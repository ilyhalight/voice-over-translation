/**
 * Experimental translation of local video files (file://), enabled per build
 * with `VOT_LOCAL_FILE=true`.
 *
 * Yandex cannot download a local file, and it only accepts client-uploaded
 * audio for YouTube. The request therefore goes under a youtu.be id derived
 * from the file; Yandex answers AUDIO_REQUESTED and translates the audio the
 * `local_file` strategy uploads.
 */

export const LOCAL_FILE_STRATEGY = "local_file";
/** Change here to try another request url shape. */
export const LOCAL_FILE_URL_PREFIX = "https://youtu.be/";
export const LOCAL_FILE_AUDIO_RATE = 16000;

const IDENTITY_STORAGE_KEY = "localFileIdentity";
const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const WAV_HEADER_BYTES = 44;

type Identity = { salt: string; generations: Record<string, number> };

export type LocalFileIdentityStore = {
  getRaw<T>(name: string, def?: T): Promise<T>;
  setRaw(name: string, value: unknown): Promise<unknown>;
};

export function isLocalFileBuild(): boolean {
  return typeof VOT_LOCAL_FILE !== "undefined" && VOT_LOCAL_FILE;
}

export function isLocalFileUrl(url: string | undefined | null): boolean {
  return isLocalFileBuild() && Boolean(url?.startsWith("file://"));
}

function toVideoId(bytes: Uint8Array): string {
  return Array.from(bytes.subarray(0, 11), (b) => ID_ALPHABET[b % 64]).join("");
}

/**
 * Stable per file: path, duration and languages. The path tells apart files
 * with the same name in different folders; it only goes into a salted hash.
 */
export function getLocalFileKey(
  fileUrl: string,
  durationSeconds: number,
  requestLang: string,
  responseLang: string,
): string {
  let path = (fileUrl.split(/[?#]/)[0] ?? fileUrl).replace(/^file:\/\//i, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  return `${path}|${Math.round(durationSeconds)}|${requestLang}|${responseLang}`;
}

/**
 * 11-char youtu.be-shaped id: SHA-256 of `salt | key | generation`.
 * The salt is random and stays in extension storage, so the id cannot be
 * computed outside this browser. `renew` bumps the generation after Yandex
 * cached a failed translation for the previous id.
 */
export function getLocalFileRequestId(
  key: string,
  options: { renew?: boolean; store: LocalFileIdentityStore },
): Promise<string> {
  // One at a time: two parallel first requests would each create a salt.
  const next = identityQueue.then(() => resolveRequestId(key, options));
  identityQueue = next.catch(() => undefined);
  return next;
}

let identityQueue: Promise<unknown> = Promise.resolve();

async function resolveRequestId(
  key: string,
  { renew = false, store }: { renew?: boolean; store: LocalFileIdentityStore },
): Promise<string> {
  const stored = await store.getRaw<Identity | undefined>(
    IDENTITY_STORAGE_KEY,
    undefined,
  );
  const isNew = typeof stored?.salt !== "string";
  const identity: Identity = isNew
    ? {
        salt:
          toVideoId(crypto.getRandomValues(new Uint8Array(16))) +
          toVideoId(crypto.getRandomValues(new Uint8Array(16))),
        generations: {},
      }
    : { salt: stored.salt, generations: { ...stored.generations } };
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

export function toLocalFileRequestUrl(requestId: string): string {
  return `${LOCAL_FILE_URL_PREFIX}${requestId}`;
}

// Request id -> file, so the audio strategy knows which file to read.
const sources = new Map<string, { fileUrl: string; key: string }>();
const failedKeys = new Set<string>();
// File url -> id of its latest translation request.
const latestRequestIds = new Map<string, string>();

export function registerLocalFileSource(
  requestId: string,
  fileUrl: string,
  key: string,
) {
  sources.set(requestId, { fileUrl, key });
  latestRequestIds.set(fileUrl, requestId);
}

/**
 * Url Yandex knows the file by. Undefined until a translation was requested:
 * before that Yandex has no audio to build subtitles from.
 */
export function getLocalFileRequestUrl(fileUrl: string): string | undefined {
  const requestId = latestRequestIds.get(fileUrl);
  return requestId ? toLocalFileRequestUrl(requestId) : undefined;
}

export function getLocalFileSource(requestId: string): string | undefined {
  return sources.get(requestId)?.fileUrl;
}

/** Yandex caches a failed translation per id: the next request needs a new one. */
export function markLocalFileRequestFailed(requestId: string) {
  const key = sources.get(requestId)?.key;
  if (key) failedKeys.add(key);
}

const uploadCounts = new Map<string, number>();
/** Yandex may ask for the audio again; more than this means it rejects it. */
export const LOCAL_FILE_MAX_UPLOADS = 2;

/** Counts audio uploads of one request and tells whether one more is allowed. */
export function allowLocalFileUpload(requestId: string): boolean {
  const count = (uploadCounts.get(requestId) ?? 0) + 1;
  uploadCounts.set(requestId, count);
  return count <= LOCAL_FILE_MAX_UPLOADS;
}

export function resetLocalFileUploads(requestId: string) {
  uploadCounts.delete(requestId);
}

export function consumeLocalFileFailure(key: string): boolean {
  return failedKeys.delete(key);
}

export function isLocalFileRequest(requestId: string | undefined): boolean {
  return requestId !== undefined && sources.has(requestId);
}

export function mixToMonoPcm16(channels: Float32Array[]): Int16Array {
  const length = channels[0]?.length ?? 0;
  const out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const channel of channels) sum += channel[i] ?? 0;
    const sample = Math.max(-1, Math.min(1, sum / channels.length));
    out[i] = Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
  }
  return out;
}

/** 16-bit mono PCM WAV with a plain 44-byte header. */
export function encodeWav(samples: Int16Array, rate: number): Uint8Array {
  const bytes = new Uint8Array(WAV_HEADER_BYTES + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
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
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++)
    view.setInt16(WAV_HEADER_BYTES + i * 2, samples[i] ?? 0, true);
  return bytes;
}

export function splitIntoChunks(
  bytes: Uint8Array,
  chunkSize: number,
): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let start = 0; start < bytes.length; start += chunkSize) {
    chunks.push(bytes.subarray(start, start + chunkSize));
  }
  return chunks;
}
