import type { AudioDownloader } from "../audioDownloader";

export type GetAudioFromAPIOptions = {
  videoId: string;
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
