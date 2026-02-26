import { getAudioFromYtAudio } from "../ytAudio/strategy";

export const YT_AUDIO_STRATEGY = "ytAudio";

export const strategies = {
  [YT_AUDIO_STRATEGY]: getAudioFromYtAudio,
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies;
