import type { VideoTranslationHelp } from "@vot.js/core/types/providers/yandex";
import { config } from "@vot.js/shared";
import logger from "#utils/logger.ts";
import { t } from "../localization/localizationProvider";
import { createAbortableDelay, throwIfAborted } from "../utils/abort";
import VOTLocalizedError from "../VOTLocalizedError";

/**
 * Udemy lectures with DRM only expose encrypted HLS/DASH, which Yandex cannot
 * read. Chrome still hands the decrypted audio of the playing <video> to
 * WebAudio, so we play the lecture silently at high speed behind an overlay,
 * map the captured sound back onto the media timeline and upload it to
 * Yandex the same way VOT uploads YouTube audio.
 */

export const UDEMY_AUDIO_RATE = 16000;
const CAPTURE_SPEED = 4;
const PROCESSOR_FRAMES = 2048;
const END_MARGIN_SECONDS = 0.6;
const IDENTITY_STORAGE_KEY = "udemyDrmIdentity";
const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function isProtectedUdemyLecture(
  host: string | undefined,
  translationHelp: VideoTranslationHelp[] | null | undefined,
): boolean {
  if (host !== "udemy") return false;
  return (translationHelp ?? []).some((help) => {
    if (help.target !== "video_file_url") return false;
    try {
      const url = new URL(help.targetUrl);
      return (
        url.hostname.endsWith(".udemycdn.com") &&
        (url.hostname.startsWith("hls-enc-") ||
          url.hostname.startsWith("dash-enc-") ||
          /\/(?:cbcs|cenc)\//i.test(url.pathname))
      );
    } catch {
      return false;
    }
  });
}

type IdentityStore = {
  getRaw<T>(name: string, def?: T): Promise<T>;
  setRaw<T>(name: string, value: T): Promise<void>;
};
type Identity = { salt: string; generations: Record<string, number> };

function toVideoId(bytes: Uint8Array): string {
  return Array.from(bytes.subarray(0, 11), (b) => ID_ALPHABET[b % 64]).join("");
}

function readUdemyCourseId(): string | undefined {
  const moduleEl = globalThis.document?.querySelector<HTMLElement>(
    "[data-module-id='course-taking']",
  );
  try {
    const args = JSON.parse(moduleEl?.dataset.moduleArgs ?? "{}");
    const id = args?.courseId ?? args?.course_id;
    return id ? String(id) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Course and lecture ids, not the url slugs: a renamed course keeps its id,
 * so its cached translations stay reachable.
 */
export function getUdemyLectureKey(
  videoId: string,
  courseId: string | undefined = readUdemyCourseId(),
): string {
  const lectureId = /lecture\/(\d+)/.exec(videoId)?.[1];
  const course = courseId ?? /course\/([^/]+)/.exec(videoId)?.[1] ?? "?";
  return lectureId ? `course-${course}|lecture-${lectureId}` : videoId;
}

/**
 * The youtu.be id for a lecture: derived from the lecture, languages and
 * voice type, so the same lecture always hits Yandex's cached translation.
 * A per-install secret salt keeps the ids unguessable, so nobody else can
 * fetch or pre-fill a translation of a paid lecture under the same id.
 * `renew` bumps the generation after Yandex cached a failed translation.
 */
export async function getUdemyRequestVideoId(
  key: string,
  { renew = false, store }: { renew?: boolean; store: IdentityStore },
): Promise<string> {
  const stored = await store.getRaw<Identity | undefined>(
    IDENTITY_STORAGE_KEY,
    undefined,
  );
  const isNew = !(stored && typeof stored.salt === "string");
  const identity: Identity =
    !isNew && stored
      ? { salt: stored.salt, generations: { ...stored.generations } }
      : {
          salt:
            toVideoId(crypto.getRandomValues(new Uint8Array(16))) +
            toVideoId(crypto.getRandomValues(new Uint8Array(16))),
          generations: {},
        };
  const generation = (identity.generations[key] ?? 0) + (renew ? 1 : 0);
  if (renew || isNew) {
    if (renew) identity.generations[key] = generation;
    await store.setRaw(IDENTITY_STORAGE_KEY, identity);
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${identity.salt}|${key}|${generation}`),
  );
  return toVideoId(new Uint8Array(digest));
}

/** Box-average when shrinking, linear interpolation when stretching. */
export function resampleTo(src: Float32Array, length: number): Float32Array {
  const out = new Float32Array(length);
  if (!length || !src.length) return out;
  const ratio = src.length / length;
  if (ratio > 1) {
    for (let j = 0; j < length; j++) {
      const a = Math.floor(j * ratio);
      const b = Math.min(
        src.length,
        Math.max(a + 1, Math.floor((j + 1) * ratio)),
      );
      let sum = 0;
      for (let k = a; k < b; k++) sum += src[k] ?? 0;
      out[j] = sum / (b - a);
    }
  } else {
    for (let j = 0; j < length; j++) {
      const x = j * ratio;
      const k = Math.floor(x);
      const f = x - k;
      const a = src[k] ?? 0;
      const b = src[k + 1] ?? a;
      out[j] = a * (1 - f) + b * f;
    }
  }
  return out;
}

/**
 * Places captured audio blocks on the lecture timeline. Each block is written
 * where the video clock says it belongs, so speed changes and buffering
 * stalls neither shift nor stretch the result; missed spans stay silent.
 */
export class TimelineWriter {
  readonly samples: Int16Array;
  coveredSeconds = 0;

  constructor(
    readonly durationSeconds: number,
    readonly rate = UDEMY_AUDIO_RATE,
  ) {
    this.samples = new Int16Array(
      Math.max(0, Math.round(durationSeconds * rate)),
    );
  }

  write(block: Float32Array, fromSeconds: number, toSeconds: number): boolean {
    const span = toSeconds - fromSeconds;
    if (!(span > 0.002) || span > 1.5) return false;
    const start = Math.round(fromSeconds * this.rate);
    const end = Math.min(
      this.samples.length,
      Math.round(toSeconds * this.rate),
    );
    if (start < 0 || end <= start) return false;
    const piece = resampleTo(block, end - start);
    for (let i = 0; i < piece.length; i++) {
      const s = Math.max(-1, Math.min(1, piece[i] ?? 0));
      this.samples[start + i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.coveredSeconds += (end - start) / this.rate;
    return true;
  }
}

export function wavHeader(sampleCount: number, rate: number): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, sampleCount * 2, true);
  return header;
}

export function encodeWav(samples: Int16Array, rate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  bytes.set(wavHeader(samples.length, rate));
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++)
    view.setInt16(44 + i * 2, samples[i] ?? 0, true);
  return bytes;
}

export type UploadAudioChunk = (
  chunk: Uint8Array,
  index: number,
  partsLength: number,
  fileId: string,
) => Promise<unknown>;

/**
 * Uploads a WAV of known length in VOT's partial-audio format while it is
 * still being captured: a chunk goes out as soon as every sample in it is
 * final. Only the last chunk carries the total count, as in VOT's YouTube
 * uploads. Chunks are sent in order, each retried up to three times.
 */
export class StreamingWavUploader {
  readonly fileId = `random-web_mse_proxy-${crypto.randomUUID()}`;
  readonly partsLength: number;
  private readonly header: Uint8Array;
  private readonly totalBytes: number;
  private queued = 0;
  private sent = 0;
  private queue: Promise<void> = Promise.resolve();
  private failure: unknown;

  constructor(
    private readonly samples: Int16Array,
    rate: number,
    private readonly uploadChunk: UploadAudioChunk,
    private readonly options: {
      signal: AbortSignal;
      chunkSize?: number;
      retryDelayMs?: number;
      onSent?: (sent: number, total: number) => void;
    },
  ) {
    this.header = wavHeader(samples.length, rate);
    this.totalBytes = 44 + samples.length * 2;
    this.partsLength = Math.max(1, Math.ceil(this.totalBytes / this.chunkSize));
  }

  private get chunkSize() {
    return this.options.chunkSize ?? config.minChunkSize;
  }

  private chunkBytes(index: number): Uint8Array {
    const start = index * this.chunkSize;
    const end = Math.min(this.totalBytes, start + this.chunkSize);
    const out = new Uint8Array(end - start);
    const view = new DataView(out.buffer);
    for (let pos = start; pos < end; ) {
      if (pos < 44) {
        out[pos - start] = this.header[pos] ?? 0;
        pos++;
        continue;
      }
      const sample = (pos - 44) >> 1;
      if ((pos - 44) % 2 === 0 && pos + 1 < end) {
        view.setInt16(pos - start, this.samples[sample] ?? 0, true);
        pos += 2;
      } else {
        const value = (this.samples[sample] ?? 0) & 0xffff;
        out[pos - start] = (pos - 44) % 2 === 0 ? value & 0xff : value >> 8;
        pos++;
      }
    }
    return out;
  }

  private enqueue(index: number) {
    const isLast = index === this.partsLength - 1;
    this.queue = this.queue.then(async () => {
      if (this.failure) return;
      try {
        const bytes = this.chunkBytes(index);
        for (let attempt = 1; ; attempt++) {
          throwIfAborted(this.options.signal);
          try {
            await this.uploadChunk(
              bytes,
              index,
              isLast ? this.partsLength : 0,
              this.fileId,
            );
            break;
          } catch (err) {
            if (attempt >= 3) throw err;
            await createAbortableDelay(
              (this.options.retryDelayMs ?? 2000) * attempt,
              this.options.signal,
            );
          }
        }
        this.sent++;
        this.options.onSent?.(this.sent, this.partsLength);
      } catch (err) {
        this.failure = err;
      }
    });
  }

  /** Sends every non-last chunk whose samples are all below `finalSamples`. */
  offer(finalSamples: number) {
    const finalBytes = 44 + Math.max(0, finalSamples) * 2;
    while (
      this.queued < this.partsLength - 1 &&
      (this.queued + 1) * this.chunkSize <= finalBytes
    ) {
      this.enqueue(this.queued++);
    }
  }

  async finish(): Promise<void> {
    while (this.queued < this.partsLength) this.enqueue(this.queued++);
    await this.queue;
    if (this.failure) throw this.failure;
  }
}

const SEEK_BACK_TOLERANCE_SECONDS = 1;
// Shaka jumps small gaps in the buffer by seeking forward; accepting short
// forward jumps keeps that from being "restored" into a loop.
const SEEK_FORWARD_TOLERANCE_SECONDS = 2;
const MAX_SEEK_RESTORES = 20;

/** Tracks how far the capture got, to undo seeks made during it. */
export class CapturePosition {
  head = 0;

  advance(time: number) {
    if (time >= this.head && time - this.head <= SEEK_FORWARD_TOLERANCE_SECONDS)
      this.head = time;
  }

  /** Where to send the player back after a seek; undefined accepts it. */
  restoreTarget(time: number): number | undefined {
    if (
      time >= this.head - SEEK_BACK_TOLERANCE_SECONDS &&
      time <= this.head + SEEK_FORWARD_TOLERANCE_SECONDS
    ) {
      this.advance(time);
      return undefined;
    }
    return this.head;
  }
}

type AudioTap = { ctx: AudioContext; source: MediaElementAudioSourceNode };
// createMediaElementSource works once per element; Udemy reuses the element
// between lectures, so keep the tap for the page lifetime.
const taps = new WeakMap<HTMLVideoElement, AudioTap>();

function getTap(video: HTMLVideoElement): AudioTap {
  let tap = taps.get(video);
  if (!tap) {
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(video);
    source.connect(ctx.destination);
    tap = { ctx, source };
    taps.set(video, tap);
  }
  return tap;
}

function captureFailed(reason: string): VOTLocalizedError {
  logger.warn(`[Udemy DRM] ${reason}`);
  return new VOTLocalizedError("VOTFailedDownloadAudio");
}

export type CaptureOverlay = {
  update: (title: string, detail: string) => void;
  dispose: () => void;
};

export type CaptureProgress = (done: number, etaSeconds?: number) => void;

/**
 * Silently plays the lecture from the start at CAPTURE_SPEED and returns its
 * audio as 16 kHz mono PCM aligned to the media timeline. The element's time,
 * speed and volume are restored afterwards; it is left paused so playback
 * starts once the voice-over is ready.
 */
export async function captureUdemyLectureAudio(
  video: HTMLVideoElement,
  {
    durationSeconds,
    signal,
    onProgress,
    onSamplesReady,
    createOverlay,
  }: {
    durationSeconds: number;
    signal: AbortSignal;
    onProgress?: CaptureProgress;
    /** Supplied by the UI layer; core code does not import components. */
    createOverlay?: (video: HTMLVideoElement) => CaptureOverlay;
    /** Called while capturing with the buffer and how many samples are final. */
    onSamplesReady?: (samples: Int16Array, finalSamples: number) => void;
  },
): Promise<Int16Array> {
  throwIfAborted(signal);
  const { ctx, source } = getTap(video);
  const writer = new TimelineWriter(durationSeconds);
  const stopAt = Math.max(0, durationSeconds - END_MARGIN_SECONDS);
  const saved = {
    time: video.currentTime,
    rate: video.playbackRate,
    pitch: video.preservesPitch,
    muted: video.muted,
    volume: video.volume,
  };

  const processor = ctx.createScriptProcessor(PROCESSOR_FRAMES, 2, 1);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  let capturing = false;
  const position = new CapturePosition();
  // ScriptProcessor hands over the block rendered one period earlier, so a
  // block belongs to the clock interval that ended at the previous callback.
  let prevPrevT: number | undefined;
  let prevT: number | undefined;
  processor.onaudioprocess = (event) => {
    const clock = video.currentTime;
    // Audio callbacks keep running in hidden tabs, unlike throttled timers.
    if (capturing) position.advance(clock);
    if (capturing && prevPrevT !== undefined && prevT !== undefined) {
      const input = event.inputBuffer;
      const left = input.getChannelData(0);
      const right = input.numberOfChannels > 1 ? input.getChannelData(1) : left;
      const mono = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++)
        mono[i] = ((left[i] ?? 0) + (right[i] ?? 0)) / 2;
      writer.write(mono, prevPrevT, prevT);
    }
    prevPrevT = prevT;
    prevT = clock;
  };

  let lastRateFix = 0;
  const keepRate = () => {
    if (!capturing) return;
    if (video.preservesPitch) video.preservesPitch = false;
    const rate = video.playbackRate;
    // Shaka sets the rate to 0 while buffering and restores it afterwards.
    if (rate === 0 || rate === CAPTURE_SPEED) return;
    const now = Date.now();
    if (now - lastRateFix < 1000) return;
    lastRateFix = now;
    video.playbackRate = CAPTURE_SPEED;
  };
  const resume = () => {
    if (capturing && video.paused) void video.play().catch(() => undefined);
  };
  const onPause = () => setTimeout(resume, 50);
  let seekRestores = 0;
  const onSeeking = () => {
    if (!capturing || seekRestores >= MAX_SEEK_RESTORES) return;
    const target = position.restoreTarget(video.currentTime);
    if (target === undefined) return;
    seekRestores++;
    video.currentTime = target;
  };
  // A muted or quieter element feeds silence into WebAudio; nothing reaches
  // the speakers during capture anyway.
  const onVolumeChange = () => {
    if (!capturing) return;
    if (video.muted) video.muted = false;
    if (video.volume !== 1) video.volume = 1;
  };

  const overlay = createOverlay?.(video);
  overlay?.update(
    `${t("udemyPreparingTranslation")}: 0%`,
    t("udemyCapturingAudio"),
  );
  const started = Date.now();
  const wallLimit = started + Math.max(120, durationSeconds * 2) * 1000;
  try {
    source.disconnect();
    source.connect(processor);
    processor.connect(silent);
    silent.connect(ctx.destination);
    await ctx.resume();
    if (ctx.state !== "running") {
      throw captureFailed("AudioContext is not running");
    }
    video.muted = false;
    video.volume = 1;
    video.preservesPitch = false;
    video.currentTime = 0;
    video.playbackRate = CAPTURE_SPEED;
    video.addEventListener("ratechange", keepRate);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("volumechange", onVolumeChange);
    capturing = true;
    resume();
    let lastReport = 0;
    while (video.currentTime < stopAt && !video.ended) {
      await createAbortableDelay(100, signal);
      keepRate();
      resume();
      // Blocks are written ~2 callbacks behind the clock; 2 s of media is a
      // safe margin before treating samples as final.
      onSamplesReady?.(
        writer.samples,
        Math.floor(Math.max(0, video.currentTime - 2) * writer.rate),
      );
      const now = Date.now();
      if (now > wallLimit) {
        throw captureFailed("audio capture is too slow");
      }
      if (now - started > 10_000 && writer.coveredSeconds === 0) {
        throw captureFailed("audio capture receives no sound");
      }
      if (now - lastReport >= 1000) {
        lastReport = now;
        const done = Math.min(1, video.currentTime / stopAt);
        const elapsed = (now - started) / 1000;
        const eta = done > 0.03 ? (elapsed / done) * (1 - done) : undefined;
        const percent = Math.floor(done * 100);
        overlay?.update(
          `${t("udemyPreparingTranslation")}: ${percent}%`,
          t("udemyCapturingAudio"),
        );
        onProgress?.(done, eta);
      }
    }
  } finally {
    capturing = false;
    video.removeEventListener("ratechange", keepRate);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("seeking", onSeeking);
    video.removeEventListener("volumechange", onVolumeChange);
    if (seekRestores) logger.log(`[Udemy DRM] undid ${seekRestores} seek(s)`);
    video.pause();
    video.playbackRate = saved.rate;
    video.preservesPitch = saved.pitch;
    video.muted = saved.muted;
    video.volume = saved.volume;
    video.currentTime = saved.time;
    processor.onaudioprocess = null;
    processor.disconnect();
    silent.disconnect();
    source.disconnect();
    source.connect(ctx.destination);
    overlay?.dispose();
  }
  if (writer.coveredSeconds < durationSeconds * 0.8) {
    throw captureFailed(
      `audio capture covered only ${writer.coveredSeconds.toFixed(0)} of ${durationSeconds.toFixed(0)} s`,
    );
  }
  return writer.samples;
}
