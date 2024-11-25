function isMobile(): boolean;
function isMuted(): boolean;
function getPlayer(): undefined | import("../types/youtube").PlayerElement;
function getPlayerResponse(): null | import("../types/youtube").PlayerResponse;
function getPlayerData(): null | import("../types/youtube").PlayerVideoData;
function getVideoVolume(): number;
// add subtitle type
function getSubtitles(): unknown[];
async function getVideoData(): Promise<{
  isLive: boolean;
  title: string;
  localizedTitle: string;
  description: string;
  detectedLanguage: string;
}>;
async function getLanguage(
  player: import("../types/youtube").PlayerElement,
  response: import("../types/youtube").PlayerResponse,
  title: string,
  description: string,
): Promise<string>;
function setVideoVolume(volume: number): true | undefined;
/**
 * @param time - time in ms
 */
function videoSeek(video: HTMLVideoElement, time: number): void;

export default {
  isMobile,
  isMuted,
  getPlayer,
  getPlayerResponse,
  getPlayerData,
  getVideoVolume,
  getSubtitles,
  getVideoData,
  setVideoVolume,
  videoSeek,
};
