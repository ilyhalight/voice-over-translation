import {
  extractAudioCodecFromMimeType,
  isAudioOnlyMimeType,
  type ProgressiveQuality,
  pickAdaptiveAudioFormat,
} from "./internal/format-selection";

export type AudioDownloadQuality = ProgressiveQuality;
export type AudioDownloadClient =
  | "IOS"
  | "WEB"
  | "MWEB"
  | "ANDROID"
  | "ANDROID_VR"
  | "YTMUSIC"
  | "YTMUSIC_ANDROID"
  | "YTSTUDIO_ANDROID"
  | "TV"
  | "TV_SIMPLY"
  | "TV_EMBEDDED"
  | "YTKIDS"
  | "WEB_EMBEDDED"
  | "WEB_CREATOR";

export interface AudioStreamRequest {
  videoId?: string;
  videoUrl?: string;
  client?: AudioDownloadClient;
  videoQuality?: AudioDownloadQuality;
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
  client: AudioDownloadClient;
  chosenFormat: InnertubeFormat;
  streamUrl: string;
}

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const YT_BASE = "https://www.youtube.com";
const ANDROID_CLIENT_VERSION = "19.44.38";
const ANDROID_VR_CLIENT_VERSION = "1.60.19";
const IOS_CLIENT_VERSION = "19.45.4";
const CLIENT_FALLBACK_ORDER: readonly AudioDownloadClient[] = [
  "ANDROID_VR",
  "ANDROID",
  "IOS",
  "WEB",
  "MWEB",
];
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
  watchContext: WatchContext,
  videoId: string,
): Record<string, unknown> {
  switch (requestedClient) {
    case "ANDROID":
    case "YTMUSIC_ANDROID":
    case "YTSTUDIO_ANDROID":
      return {
        clientName: "ANDROID",
        clientVersion: ANDROID_CLIENT_VERSION,
        hl: "en",
        gl: "US",
        androidSdkVersion: 34,
        osName: "Android",
        osVersion: "14",
        platform: "MOBILE",
      };
    case "ANDROID_VR":
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
    case "IOS":
      return {
        clientName: "IOS",
        clientVersion: IOS_CLIENT_VERSION,
        hl: "en",
        gl: "US",
        platform: "MOBILE",
        osName: "iPhone",
        osVersion: "18.0.0.22A3354",
        deviceMake: "Apple",
        deviceModel: "iPhone16,2",
      };
    case "MWEB":
      return {
        clientName: "MWEB",
        clientVersion: watchContext.clientVersion,
        hl: "en",
        gl: "US",
        originalUrl: `${YT_BASE}/watch?v=${videoId}`,
      };
    default:
      return {
        clientName: "WEB",
        clientVersion: watchContext.clientVersion,
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
        originalUrl: `${YT_BASE}/watch?v=${videoId}`,
      };
  }
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
    const id = url.pathname.split("/").find(Boolean);
    if (id && VIDEO_ID_PATTERN.test(id)) {
      return id;
    }
  }

  const searchId = url.searchParams.get("v");
  if (searchId && VIDEO_ID_PATTERN.test(searchId)) {
    return searchId;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const shortsIndex = pathSegments.indexOf("shorts");
  if (shortsIndex !== -1) {
    const shortsId = pathSegments[shortsIndex + 1];
    if (shortsId && VIDEO_ID_PATTERN.test(shortsId)) {
      return shortsId;
    }
  }

  const embedIndex = pathSegments.indexOf("embed");
  if (embedIndex !== -1) {
    const embedId = pathSegments[embedIndex + 1];
    if (embedId && VIDEO_ID_PATTERN.test(embedId)) {
      return embedId;
    }
  }

  throw new Error(`Cannot extract YouTube video id from: ${input}`);
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
  const byteReader = (response as { bytes?: () => Promise<Uint8Array> }).bytes;
  if (typeof byteReader === "function") {
    return byteReader.call(response);
  }
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

function addRangeToStreamUrl(
  streamUrl: string,
  start: number,
  end: number,
  requestNumber: number,
): string {
  const url = new URL(streamUrl);
  url.searchParams.set("range", `${start}-${end}`);
  if (requestNumber > 0) {
    url.searchParams.set("rn", String(requestNumber));
  } else {
    url.searchParams.delete("rn");
  }
  return url.toString();
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
    ? [requestedClient, ...CLIENT_FALLBACK_ORDER]
    : [...CLIENT_FALLBACK_ORDER];
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
    requestNumber: number,
  ): Promise<Uint8Array> {
    const rangeUrl = addRangeToStreamUrl(streamUrl, start, end, requestNumber);
    const rangeHeader = `bytes=${start}-${end}`;

    let queryResponseStatus: number | string = "fetch_error";
    try {
      const queryResponse = await this.fetchFn(rangeUrl, {
        headers: DEFAULT_HEADERS,
        ...withSignal(signal),
      });
      queryResponseStatus = queryResponse.status;
      if (queryResponse.ok) {
        const bytes = await readResponseBytes(queryResponse);
        if (!bytes.byteLength) {
          throw new Error("Received empty stream chunk");
        }
        return bytes;
      }
    } catch (error) {
      queryResponseStatus =
        error instanceof Error ? error.message : "fetch_error";
    }

    const headerResponse = await this.fetchFn(streamUrl, {
      headers: {
        ...DEFAULT_HEADERS,
        range: rangeHeader,
      },
      ...withSignal(signal),
    });
    if (!headerResponse.ok) {
      throw new Error(
        `Failed to download stream chunk: query=${queryResponseStatus}; header=${headerResponse.status}`,
      );
    }

    const bytes = await readResponseBytes(headerResponse);
    if (!bytes.byteLength) {
      throw new Error("Received empty stream chunk");
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

    for (
      let start = 0, index = 0;
      start < fileSize;
      start += RANGE_FALLBACK_CHUNK_SIZE, index++
    ) {
      const end = Math.min(fileSize - 1, start + RANGE_FALLBACK_CHUNK_SIZE - 1);
      const chunk = await this.fetchRangeChunk(
        streamUrl,
        start,
        end,
        signal,
        index + 1,
      );
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

  private async downloadStreamBytes(
    streamUrl: string,
    contentLengthHint: string | undefined,
    signal: AbortSignal | undefined,
    options: {
      preferRangeFirst?: boolean;
    } = {},
  ): Promise<Uint8Array> {
    if (options.preferRangeFirst) {
      try {
        return await this.downloadStreamByRanges(
          streamUrl,
          contentLengthHint,
          signal,
        );
      } catch (rangeError) {
        const rangeMessage =
          rangeError instanceof Error ? rangeError.message : String(rangeError);
        throw new Error(`Failed to download stream by ranges: ${rangeMessage}`);
      }
    }

    let fullResponseStatus: number | string = "fetch_error";
    try {
      const streamResponse = await this.fetchFn(streamUrl, {
        headers: DEFAULT_HEADERS,
        ...withSignal(signal),
      });
      fullResponseStatus = streamResponse.status;
      if (streamResponse.ok) {
        const bytes = await readResponseBytes(streamResponse);
        if (!bytes.byteLength) {
          throw new Error("Received empty stream");
        }
        return bytes;
      }
    } catch (error) {
      fullResponseStatus =
        error instanceof Error ? error.message : "fetch_error";
    }

    try {
      return await this.downloadStreamByRanges(
        streamUrl,
        contentLengthHint,
        signal,
      );
    } catch (rangeError) {
      const rangeMessage =
        rangeError instanceof Error ? rangeError.message : String(rangeError);
      throw new Error(
        `Failed to download stream: full=${fullResponseStatus}; range=${rangeMessage}`,
      );
    }
  }

  async downloadAudioToChunkStream(
    request: AudioStreamRequest,
    options: AudioChunkStreamOptions,
  ): Promise<AudioChunkStreamResult> {
    if (options.chunkSize <= 0) {
      throw new RangeError("Audio downloader. ytAudio. chunkSize must be > 0");
    }

    const videoId = getRequiredVideoId(request);
    const { signal } = request;
    const watchContext = await this.fetchWatchContext(videoId, signal);
    const quality = request.videoQuality ?? "best";
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
          throw new Error(
            "Chunk mode requires an adaptive audio stream format",
          );
        }
        const fileSize = await this.resolveStreamContentLength(
          resolved.streamUrl,
          resolved.chosenFormat.contentLength,
          request.signal,
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
                request.signal,
                index + 1,
              );
              yield bytes;
            }
          }.bind(this),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${client}: ${message}`);
      }
    }

    throw new Error(
      `Unable to resolve streamable format for chunk mode. Attempts: ${attemptErrors.join(" | ")}`,
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
    const videoId = getRequiredVideoId(request);
    const { signal } = request;
    const watchContext = await this.fetchWatchContext(videoId, signal);
    const quality = request.videoQuality ?? "bestefficiency";
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
        const isAudioOnly = isAudioOnlyMimeType(resolved.chosenFormat.mimeType);
        const streamBytes = await this.downloadStreamBytes(
          resolved.streamUrl,
          resolved.chosenFormat.contentLength,
          request.signal,
          {
            // Audio-only streams are commonly served with strict rules that can
            // reject plain full-file GET requests. Range mode is more reliable.
            preferRangeFirst: isAudioOnly,
          },
        );

        const hints = this.getExtractionHints(resolved.chosenFormat);
        if (isAudioOnly) {
          await sink.write(streamBytes);
          return {
            videoId: resolved.videoId,
            bytesWritten: streamBytes.byteLength,
            mimeType: getAudioMimeType(resolved.chosenFormat.mimeType),
            codec: hints.codec,
            sampleRate: hints.sampleRate,
            channels: hints.channels,
          };
        }

        throw new Error(
          "Selected stream is not audio-only. Video-based fallback is disabled.",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${client}: ${message}`);
      }
    }

    throw new Error(
      `Unable to download playable stream format. Attempts: ${attemptErrors.join(" | ")}`,
    );
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
    let chosenFormat: InnertubeFormat | null = null;

    if (directAdaptiveFormats.length) {
      try {
        chosenFormat = pickAdaptiveAudioFormat(directAdaptiveFormats, quality);
      } catch {
        // Try next client below.
      }
    }

    if (!chosenFormat) {
      throw new Error(
        "Player response did not contain direct adaptive audio stream URLs",
      );
    }
    const streamUrl = this.resolveFormatUrl(
      chosenFormat,
      watchContext.clientVersion,
    );

    return {
      videoId,
      client,
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

    const probeUrl = addRangeToStreamUrl(streamUrl, 0, 0, 0);
    let probeResponse: Response | null = null;
    let probeQueryStatus: number | string = "fetch_error";
    try {
      const queryProbeResponse = await this.fetchFn(probeUrl, {
        headers: DEFAULT_HEADERS,
        ...withSignal(signal),
      });
      probeQueryStatus = queryProbeResponse.status;
      if (queryProbeResponse.ok) {
        probeResponse = queryProbeResponse;
      }
    } catch (error) {
      probeQueryStatus = error instanceof Error ? error.message : "fetch_error";
    }

    if (!probeResponse) {
      const headerProbeResponse = await this.fetchFn(streamUrl, {
        headers: {
          ...DEFAULT_HEADERS,
          range: "bytes=0-0",
        },
        ...withSignal(signal),
      });
      if (headerProbeResponse.ok) {
        probeResponse = headerProbeResponse;
      } else {
        if (hintedLength !== null) {
          return hintedLength;
        }
        throw new Error(
          `Failed to probe stream content length: query=${probeQueryStatus}; header=${headerProbeResponse.status}`,
        );
      }
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

  private resolveFormatUrl(
    format: InnertubeFormat,
    clientVersion: string,
  ): string {
    if (!format.url) {
      throw new Error("Selected format does not contain a direct stream URL");
    }
    const streamUrl = new URL(format.url);

    const client = streamUrl.searchParams.get("c");
    if (client === "WEB") {
      streamUrl.searchParams.set("cver", clientVersion);
    }

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
    const client = resolveInnertubeClient(
      requestedClient,
      watchContext,
      videoId,
    );
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
