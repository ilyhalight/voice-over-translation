import {
  extractAudioCodecFromMimeType,
  isAudioOnlyMimeType,
  type ProgressiveQuality,
  pickAdaptiveAudioFormat,
} from "./internal/format-selection";

export type AudioDownloadQuality = ProgressiveQuality;
export type AudioDownloadClient = "ANDROID_VR";

export interface AudioStreamRequest {
  videoId?: string;
  videoUrl?: string;
  client?: AudioDownloadClient;
  audioQuality?: AudioDownloadQuality;
  signal?: AbortSignal;
}

export interface AudioStreamResult {
  videoId: string;
  bytesWritten: number;
  mimeType: "audio/aac" | "audio/mp4" | "audio/webm";
  codec: string;
  sampleRate: number;
  channels: number;
}

export interface AudioBufferResult extends AudioStreamResult {
  bytes: Uint8Array;
}

export interface AudioChunkStreamOptions {
  chunkSize: number;
}

export interface AudioChunkStreamResult {
  videoId: string;
  fileSize: number;
  itag: number;
  mediaPartsLength: number;
  getMediaBuffers: () => AsyncGenerator<Uint8Array>;
}

export interface AudioDownloaderOptions {
  fetchImplementation?: typeof fetch;
}

interface WatchContext {
  apiKey: string;
  clientVersion: string;
  signatureTimestamp?: number;
  visitorData?: string;
}

interface InnertubeFormat {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  qualityLabel?: string;
  contentLength?: string;
  audioSampleRate?: string;
  audioChannels?: number;
}

interface InnertubePlayerResponse {
  streamingData?: {
    formats?: InnertubeFormat[];
    adaptiveFormats?: InnertubeFormat[];
  };
}

interface ExtractionHints {
  codec: string;
  sampleRate: number;
  channels: number;
}

interface ResolvedPlayableFormat {
  videoId: string;
  chosenFormat: InnertubeFormat;
  streamUrl: string;
}

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YT_BASE = "https://www.youtube.com";
const ANDROID_VR_CLIENT_VERSION = "1.60.19";
const CLIENTS: readonly AudioDownloadClient[] = ["ANDROID_VR"];
const DEFAULT_HEADERS = {
  accept: "*/*",
  origin: YT_BASE,
  referer: `${YT_BASE}/`,
} as const;
const RANGE_FALLBACK_CHUNK_SIZE = 256 * 1024;

function withSignal(signal: AbortSignal | undefined): RequestInit {
  return signal ? { signal } : {};
}

function resolveInnertubeClient(
  requestedClient: AudioDownloadClient | undefined,
): Record<string, unknown> {
  if (requestedClient !== undefined && requestedClient !== "ANDROID_VR") {
    throw new Error(`Unsupported Innertube client: ${requestedClient}`);
  }

  return {
    clientName: "ANDROID_VR",
    clientVersion: ANDROID_VR_CLIENT_VERSION,
    hl: "en",
    gl: "US",
    androidSdkVersion: 31,
    osName: "Android",
    osVersion: "12",
    platform: "MOBILE",
  };
}

export function extractVideoId(input: string): string {
  const value = input.trim();
  if (VIDEO_ID_PATTERN.test(value)) {
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Cannot extract YouTube video id from: ${input}`);
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) {
    return getValidatedVideoId(url.pathname.split("/").find(Boolean), input);
  }

  const searchId = url.searchParams.get("v");
  if (searchId && VIDEO_ID_PATTERN.test(searchId)) return searchId;

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const pathId = getVideoIdFromPathSegments(pathSegments);
  if (pathId) return pathId;

  throw new Error(`Cannot extract YouTube video id from: ${input}`);
}

function getValidatedVideoId(id: string | undefined, input: string): string {
  if (id && VIDEO_ID_PATTERN.test(id)) {
    return id;
  }

  throw new Error(`Cannot extract YouTube video id from: ${input}`);
}

function getVideoIdFromPathSegments(pathSegments: string[]): string | null {
  const pathMarkers = ["shorts", "embed"] as const;

  for (const marker of pathMarkers) {
    const markerIndex = pathSegments.indexOf(marker);
    if (markerIndex === -1) continue;

    const id = pathSegments[markerIndex + 1];
    if (id && VIDEO_ID_PATTERN.test(id)) {
      return id;
    }
  }

  return null;
}

function decodeEscapedJsonString(input: string): string {
  return input.replaceAll("\\u0026", "&").replaceAll("\\/", "/");
}

function getRequiredVideoId(request: AudioStreamRequest): string {
  const source = request.videoId ?? request.videoUrl;
  if (!source) {
    throw new Error("Either videoId or videoUrl is required");
  }
  return extractVideoId(source);
}

function matchFirst(
  source: string,
  patterns: readonly RegExp[],
): string | undefined {
  for (const pattern of patterns) {
    const matched = pattern.exec(source)?.[1];
    if (matched) {
      return matched;
    }
  }
  return undefined;
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

function makeCPN(length = 16): string {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  let output = "";

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      output += alphabet[byte % alphabet.length] ?? "a";
    }
    return output;
  }

  for (let i = 0; i < length; i++) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "a";
  }
  return output;
}

function parsePositiveInteger(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseContentLengthFromContentRange(
  contentRange: string | null,
): number | null {
  if (!contentRange) {
    return null;
  }

  const matched = /\/(\d+)\s*$/i.exec(contentRange);
  return parsePositiveInteger(matched?.[1]);
}

function parseContentRangeHeader(
  contentRange: string | null,
): { start: number; end: number } | null {
  if (!contentRange) {
    return null;
  }

  const matched = /^bytes\s+(\d+)-(\d+)\/(?:\d+|\*)$/i.exec(
    contentRange.trim(),
  );
  if (!matched) {
    return null;
  }

  const start = Number.parseInt(matched[1] ?? "", 10);
  const end = Number.parseInt(matched[2] ?? "", 10);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start
  ) {
    return null;
  }

  return { start, end };
}

function getExpectedRangeLength(start: number, end: number): number {
  return end - start + 1;
}

function isValidRangeChunkResponse(
  response: Response,
  bytes: Uint8Array,
  start: number,
  end: number,
): boolean {
  const expectedLength = getExpectedRangeLength(start, end);
  if (expectedLength <= 0) {
    return false;
  }

  if (bytes.byteLength <= 0 || bytes.byteLength > expectedLength) {
    return false;
  }

  const contentRange = parseContentRangeHeader(
    response.headers.get("content-range"),
  );
  if (contentRange) {
    return (
      contentRange.start === start &&
      contentRange.end === start + bytes.byteLength - 1
    );
  }

  // 206 responses should normally include content-range. In environments where
  // this header is stripped, accept only exact-size payloads.
  if (response.status === 206) {
    return bytes.byteLength === expectedLength;
  }

  // 200 without content-range is ambiguous for non-zero offsets.
  if (response.status === 200) {
    return start === 0 && bytes.byteLength === expectedLength;
  }

  return false;
}

function describeRangeChunkResponse(
  response: Response,
  bytes: Uint8Array,
): string {
  const contentRange = response.headers.get("content-range") ?? "none";
  const contentLength = response.headers.get("content-length") ?? "none";
  return `status=${response.status}; bytes=${bytes.byteLength}; content-range=${contentRange}; content-length=${contentLength}`;
}

function getAudioMimeType(
  mimeType: string | undefined,
): AudioStreamResult["mimeType"] {
  const normalizedMimeType = mimeType?.toLowerCase() ?? "";
  if (normalizedMimeType.includes("audio/webm")) {
    return "audio/webm";
  }
  if (normalizedMimeType.includes("audio/mp4")) {
    return "audio/mp4";
  }
  return "audio/aac";
}

export function buildClientAttemptOrder(
  requestedClient: AudioDownloadClient | undefined,
): AudioDownloadClient[] {
  const ordered = requestedClient
    ? [requestedClient, ...CLIENTS]
    : [...CLIENTS];
  const seen = new Set<AudioDownloadClient>();

  return ordered.filter((client) => {
    if (seen.has(client)) {
      return false;
    }
    seen.add(client);
    return true;
  });
}

export class AudioDownloader {
  private readonly fetchFn: typeof fetch;

  constructor(options: AudioDownloaderOptions = {}) {
    this.fetchFn = options.fetchImplementation ?? fetch;
  }

  private async fetchRangeChunk(
    streamUrl: string,
    start: number,
    end: number,
    signal: AbortSignal | undefined,
  ): Promise<Uint8Array> {
    const rangeHeader = `bytes=${start}-${end}`;
    const response = await this.fetchFn(streamUrl, {
      headers: {
        ...DEFAULT_HEADERS,
        range: rangeHeader,
      },
      ...withSignal(signal),
    });
    if (!response.ok) {
      throw new Error(`Failed to download stream chunk: ${response.status}`);
    }

    const bytes = await readResponseBytes(response);
    if (!isValidRangeChunkResponse(response, bytes, start, end)) {
      throw new Error(
        `Received unexpected stream chunk payload: ${describeRangeChunkResponse(response, bytes)}`,
      );
    }
    return bytes;
  }

  private async downloadStreamByRanges(
    streamUrl: string,
    contentLengthHint: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<Uint8Array> {
    const fileSize = await this.resolveStreamContentLength(
      streamUrl,
      contentLengthHint,
      signal,
      true,
    );
    const merged = new Uint8Array(fileSize);
    let offset = 0;

    for (let start = 0; start < fileSize; start += RANGE_FALLBACK_CHUNK_SIZE) {
      const end = Math.min(fileSize - 1, start + RANGE_FALLBACK_CHUNK_SIZE - 1);
      const chunk = await this.fetchRangeChunk(streamUrl, start, end, signal);
      if (offset + chunk.byteLength > merged.byteLength) {
        throw new Error(
          "Downloaded stream chunk exceeds probed stream content length",
        );
      }
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }

    if (offset === merged.byteLength) {
      return merged;
    }

    // Server-side content-length probes can be stale for some streams.
    return merged.slice(0, offset);
  }

  async downloadAudioToChunkStream(
    request: AudioStreamRequest,
    options: AudioChunkStreamOptions,
  ): Promise<AudioChunkStreamResult> {
    if (options.chunkSize <= 0) {
      throw new RangeError("Audio downloader. ytAudio. chunkSize must be > 0");
    }

    return this.withResolvedPlayableAudioFormat(
      request,
      request.audioQuality ?? "best",
      "Chunk mode requires an adaptive audio stream format",
      "Unable to resolve streamable format for chunk mode",
      async ({ resolved, signal }) => {
        const fileSize = await this.resolveStreamContentLength(
          resolved.streamUrl,
          resolved.chosenFormat.contentLength,
          signal,
          true,
        );
        const mediaPartsLength = Math.max(
          1,
          Math.ceil(fileSize / options.chunkSize),
        );

        return {
          videoId: resolved.videoId,
          fileSize,
          itag: resolved.chosenFormat.itag ?? 0,
          mediaPartsLength,
          getMediaBuffers: async function* () {
            for (let index = 0; index < mediaPartsLength; index++) {
              const start = index * options.chunkSize;
              const end = Math.min(fileSize - 1, start + options.chunkSize - 1);
              const bytes = await this.fetchRangeChunk(
                resolved.streamUrl,
                start,
                end,
                signal,
              );
              yield bytes;
            }
          }.bind(this),
        };
      },
    );
  }

  async downloadAudioToUint8Array(
    request: AudioStreamRequest,
  ): Promise<AudioBufferResult> {
    const chunks: Uint8Array[] = [];
    let total = 0;

    const streamResult = await this.extractAndWriteAudio(request, {
      async write(chunk) {
        chunks.push(chunk);
        total += chunk.byteLength;
      },
    });

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      ...streamResult,
      bytes,
    };
  }

  private async extractAndWriteAudio(
    request: AudioStreamRequest,
    sink: { write: (chunk: Uint8Array) => Promise<void> },
  ): Promise<AudioStreamResult> {
    return this.withResolvedPlayableAudioFormat(
      request,
      request.audioQuality ?? "bestefficiency",
      "Selected stream is not audio-only",
      "Unable to download playable stream format",
      async ({ resolved, signal }) => {
        const streamBytes = await this.downloadStreamByRanges(
          resolved.streamUrl,
          resolved.chosenFormat.contentLength,
          signal,
        );

        const hints = this.getExtractionHints(resolved.chosenFormat);
        await sink.write(streamBytes);
        return {
          videoId: resolved.videoId,
          bytesWritten: streamBytes.byteLength,
          mimeType: getAudioMimeType(resolved.chosenFormat.mimeType),
          codec: hints.codec,
          sampleRate: hints.sampleRate,
          channels: hints.channels,
        };
      },
    );
  }

  private async withResolvedPlayableAudioFormat<T>(
    request: AudioStreamRequest,
    quality: AudioDownloadQuality,
    audioOnlyErrorMessage: string,
    failurePrefix: string,
    onResolved: (context: {
      resolved: ResolvedPlayableFormat;
      signal: AbortSignal | undefined;
    }) => Promise<T>,
  ): Promise<T> {
    const videoId = getRequiredVideoId(request);
    const { signal } = request;
    const watchContext = await this.fetchWatchContext(videoId, signal);
    const clientAttempts = buildClientAttemptOrder(request.client);
    const attemptErrors: string[] = [];

    for (const client of clientAttempts) {
      try {
        const resolved = await this.resolvePlayableFormatForClient({
          videoId,
          watchContext,
          client,
          quality,
          signal,
        });
        if (!isAudioOnlyMimeType(resolved.chosenFormat.mimeType)) {
          throw new Error(audioOnlyErrorMessage);
        }

        return await onResolved({ resolved, signal });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${client}: ${message}`);
      }
    }

    throw new Error(`${failurePrefix}. Attempts: ${attemptErrors.join(" | ")}`);
  }

  private async resolvePlayableFormatForClient({
    videoId,
    watchContext,
    client,
    quality,
    signal,
  }: {
    videoId: string;
    watchContext: WatchContext;
    client: AudioDownloadClient;
    quality: AudioDownloadQuality;
    signal?: AbortSignal;
  }): Promise<ResolvedPlayableFormat> {
    const response = await this.fetchPlayerResponse(
      videoId,
      watchContext,
      client,
      signal,
    );
    const adaptiveFormats = response.streamingData?.adaptiveFormats ?? [];
    const directAdaptiveFormats = adaptiveFormats.filter((format) =>
      Boolean(format.url),
    );
    if (!directAdaptiveFormats.length) {
      throw new Error(
        "Player response did not contain direct adaptive audio stream URLs",
      );
    }
    const chosenFormat = pickAdaptiveAudioFormat(
      directAdaptiveFormats,
      quality,
    );

    const streamUrl = this.resolveFormatUrl(chosenFormat);

    return {
      videoId,
      chosenFormat,
      streamUrl,
    };
  }

  private async resolveStreamContentLength(
    streamUrl: string,
    contentLengthHint: string | undefined,
    signal: AbortSignal | undefined,
    forceProbe = false,
  ): Promise<number> {
    const hintedLength = parsePositiveInteger(contentLengthHint);
    if (hintedLength !== null && !forceProbe) {
      return hintedLength;
    }

    let probeResponse: Response;
    try {
      probeResponse = await this.fetchFn(streamUrl, {
        headers: {
          ...DEFAULT_HEADERS,
          range: "bytes=0-0",
        },
        ...withSignal(signal),
      });
    } catch (error) {
      if (hintedLength !== null) {
        return hintedLength;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to probe stream content length: ${message}`);
    }

    if (!probeResponse.ok) {
      if (hintedLength !== null) {
        return hintedLength;
      }
      throw new Error(
        `Failed to probe stream content length: ${probeResponse.status}`,
      );
    }

    const contentRangeLength = parseContentLengthFromContentRange(
      probeResponse.headers.get("content-range"),
    );
    const storedLength = parsePositiveInteger(
      probeResponse.headers.get("x-goog-stored-content-length"),
    );
    const contentLength = parsePositiveInteger(
      probeResponse.headers.get("content-length"),
    );

    if (typeof probeResponse.body?.cancel === "function") {
      try {
        await probeResponse.body.cancel();
      } catch {
        // Ignore cancellation errors in environments without readable stream cancellation.
      }
    }

    return (
      contentRangeLength ??
      storedLength ??
      hintedLength ??
      contentLength ??
      (() => {
        throw new Error("Failed to resolve stream content length");
      })()
    );
  }

  private getExtractionHints(format: InnertubeFormat): ExtractionHints {
    const codec = extractAudioCodecFromMimeType(format.mimeType);
    const sampleRate = Number.parseInt(format.audioSampleRate ?? "", 10);

    return {
      codec,
      sampleRate:
        Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 44100,
      channels:
        format.audioChannels && format.audioChannels > 0
          ? format.audioChannels
          : 2,
    };
  }

  private resolveFormatUrl(format: InnertubeFormat): string {
    if (!format.url) {
      throw new Error("Selected format does not contain a direct stream URL");
    }
    const streamUrl = new URL(format.url);

    streamUrl.searchParams.set("cpn", makeCPN());
    return streamUrl.toString();
  }

  private async fetchWatchContext(
    videoId: string,
    signal?: AbortSignal,
  ): Promise<WatchContext> {
    const watchUrl = `${YT_BASE}/watch?v=${encodeURIComponent(videoId)}&hl=en`;
    const response = await this.fetchFn(watchUrl, {
      headers: DEFAULT_HEADERS,
      ...withSignal(signal),
    });
    if (!response.ok) {
      throw new Error(`Failed to load watch page: ${response.status}`);
    }

    const html = await response.text();
    const apiKey = matchFirst(html, [
      /"INNERTUBE_API_KEY":"([^"]+)"/,
      /["']INNERTUBE_API_KEY["']\s*:\s*"([^"]+)"/,
    ]);
    const clientVersion = matchFirst(html, [
      /"INNERTUBE_CLIENT_VERSION":"([^"]+)"/,
      /["']INNERTUBE_CLIENT_VERSION["']\s*:\s*"([^"]+)"/,
    ]);
    const stsRaw = matchFirst(html, [/"STS":(\d+)/, /["']STS["']\s*:\s*(\d+)/]);
    const visitorData = matchFirst(html, [
      /"VISITOR_DATA":"([^"]+)"/,
      /"visitorData":"([^"]+)"/,
      /["'](?:VISITOR_DATA|visitorData)["']\s*:\s*"([^"]+)"/,
    ]);

    if (!apiKey || !clientVersion) {
      throw new Error(
        "Failed to extract required player context from watch page",
      );
    }
    const signatureTimestamp = stsRaw ? Number.parseInt(stsRaw, 10) : undefined;

    const context: WatchContext = {
      apiKey,
      clientVersion,
    };

    if (
      typeof signatureTimestamp === "number" &&
      Number.isFinite(signatureTimestamp)
    ) {
      context.signatureTimestamp = signatureTimestamp;
    }
    if (visitorData) {
      context.visitorData = decodeEscapedJsonString(visitorData);
    }

    return context;
  }

  private async fetchPlayerResponse(
    videoId: string,
    watchContext: WatchContext,
    requestedClient: AudioDownloadClient | undefined,
    signal?: AbortSignal,
  ): Promise<InnertubePlayerResponse> {
    const client = resolveInnertubeClient(requestedClient);
    if (watchContext.visitorData) {
      client.visitorData = watchContext.visitorData;
    }

    const body: Record<string, unknown> = {
      context: {
        client,
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    };

    if (watchContext.signatureTimestamp) {
      body.playbackContext = {
        contentPlaybackContext: {
          signatureTimestamp: watchContext.signatureTimestamp,
        },
      };
    }

    const endpoint = `${YT_BASE}/youtubei/v1/player?key=${encodeURIComponent(watchContext.apiKey)}`;
    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        "content-type": "application/json",
        ...(watchContext.visitorData
          ? { "x-goog-visitor-id": watchContext.visitorData }
          : {}),
      },
      body: JSON.stringify(body),
      ...withSignal(signal),
    });

    if (!response.ok) {
      throw new Error(
        `Player API request failed with status ${response.status}`,
      );
    }

    const json = (await response.json()) as InnertubePlayerResponse;
    const hasFormats = Boolean(json.streamingData?.formats?.length);
    const hasAdaptiveFormats = Boolean(
      json.streamingData?.adaptiveFormats?.length,
    );
    if (!hasFormats && !hasAdaptiveFormats) {
      throw new Error("Player response did not contain streaming formats");
    }
    return json;
  }
}
