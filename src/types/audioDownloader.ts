import type { AudioDownloader } from "../audioDownloader";
import type { AvailableAudioDownloadType } from "../audioDownloader/strategies/bridgeProtocol";

export type GetAudioFromAPIOptions = {
  videoId: string;
  signal: AbortSignal;
};

export type AudioDownloadRequestOptions = {
  audioDownloader: AudioDownloader;
  translationId: string;
  videoId: string;
  signal: AbortSignal;
  audioDownloadType: AvailableAudioDownloadType;
};

export type DownloadedPartialAudioData = {
  videoId: string;
  fileId: string;
  audioData: Uint8Array;
  version: 1;
  index: number;
  amount: number;
};
