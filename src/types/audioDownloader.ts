import type { AudioAdaptiveFormat } from "@vot.js/ext/types/helpers/youtube";
import type { AudioDownloader } from "../audioDownloader";

export type ChunkRange = {
  start: number;
  end: number;
  mustExist: boolean;
};

export type VideoIdPayload = {
  videoId: string;
};

export type DownloadAudioDataSource =
  | "player-response"
  | "performance"
  | "fetch-hook"
  | "xhr-hook";

export type SerializedRequestInitData = {
  body?: Uint8Array | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headersEntries?: [string, string][];
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
};

export type DownloadAudioDataIframeResponsePayload = {
  requestInfo: string;
  requestInit?: RequestInit | SerializedRequestInitData;
  // playerResponse may be unavailable in some runtimes; keep this optional.
  adaptiveFormat?: AudioAdaptiveFormat | null;
  itag: number;
  source?: DownloadAudioDataSource;
};

export type FetchMediaWithMetaOptions = {
  mediaUrl: string;
  chunkRange: ChunkRange;
  requestInit: RequestInit;
  signal: AbortSignal;
  isUrlChanged?: boolean;
};

export type FetchMediaWithMetaResult = {
  media: ArrayBuffer;
  url: string | null;
  isAcceptableLast: boolean;
};

export type FetchMediaWithMetaByChunkRangesResult = {
  media: Uint8Array;
  url: string | null;
  isAcceptableLast: boolean;
};

export type GetAudioFromAPIOptions = {
  videoId: string;
  returnByParts?: boolean;
  signal: AbortSignal;
};

export type AudioDownloadRequestOptions = {
  audioDownloader: AudioDownloader;
  translationId: string;
  videoId: string;
  signal: AbortSignal;
};

export type DownloadedAudioData = {
  videoId: string;
  fileId: string;
  audioData: Uint8Array;
};

export type DownloadedPartialAudioData = {
  videoId: string;
  fileId: string;
  audioData: Uint8Array;
  version: 1;
  index: number;
  amount: number;
};
