/**
 * id in 'langcode.number' format
 */
export type LangId = string;

export type AdaptiveFormatRange = {
  end: string;
  start: string;
};

export type ColorInfo = {
  matrixCoefficients: "COLOR_MATRIX_COEFFICIENTS_BT709";
  primaries: "COLOR_PRIMARIES_BT709";
  transferCharacteristics: "COLOR_TRANSFER_CHARACTERISTICS_BT709";
};

export type Quality =
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "hd720"
  | "hd1080"
  | "hd1440"
  | "hd2160";

export type QualityLabel =
  | "144p"
  | "240p"
  | "360p"
  | "480p"
  | "720p"
  | "720p60"
  | "1080p"
  | "1080p60"
  | "1440p"
  | "1440p60"
  | "2160p60";

export type BaseAdaptiveFormat = {
  approxDurationMs: string;
  contentLength: string;
  averageBitrate: number;
  bitrate: number;
  indexRange: AdaptiveFormatRange;
  initRange: AdaptiveFormatRange;
  itag: number;
  lastModified: string;
  mimeType: string;
  projectionType: "RECTANGULAR";
  quality: Quality;
};

export type BaseAdaptiveFormatWithUrl = BaseAdaptiveFormat & {
  url: string;
};

export type BaseAdaptiveFormatWithSignatureCipher = BaseAdaptiveFormat & {
  signatureCipher: string;
};

export type UniversalAdaptiveFormat =
  | BaseAdaptiveFormatWithUrl
  | BaseAdaptiveFormatWithSignatureCipher;

export type VideoAdaptiveFormat = {
  colorInfo?: ColorInfo;
  fps: number;
  height: number;
  qualityLabel: QualityLabel;
  width: number;
} & UniversalAdaptiveFormat;

export type AdaptiveFormatAudioTrackInfo = {
  /**
   * Default audio by interface locale
   */
  audioIsDefault: boolean;
  /**
   * localized name of audio track
   */
  displayName: string;
  id: LangId;
};

export type AudioAdaptiveFormat = {
  audioChannels: number;
  audioQuality: "AUDIO_QUALITY_MEDIUM" | "AUDIO_QUALITY_LOW";
  audioSampleRate: string;
  /**
   * It's rarely. If you need you can find this in every MrBeast video
   */
  audioTrack?: AdaptiveFormatAudioTrackInfo;
  highReplication: boolean;
  loudnessDb: number;
  isDrc?: boolean;
  xtags?: string;
} & UniversalAdaptiveFormat;

export type AdaptiveFormat = VideoAdaptiveFormat | AudioAdaptiveFormat;

export type StreamingData = {
  adaptiveFormats: AdaptiveFormat[];
  expiresInSeconds: string;
  /**
   * maybe it's default formats
   */
  formats: AdaptiveFormat[];
  serverAbrStreamingUrl: string;
};

export type VideoDetails = {
  allowRatings: boolean;
  author: string;
  channelId: string;
  isCrawlable: boolean;
  isLiveContent: boolean;
  isOwnerViewing: boolean;
  isPrivate: boolean;
  isUnpluggedCorpus: boolean;
  keywords: string;
  lengthSeconds: string;
  /**
   * Short description (not translated)
   */
  shortDescription: string;
  thumbnail: Record<"thumbnails", unknown[]>;
  /**
   * Title (not translated)
   */
  title: string;
  videoId: string;
  viewCount: string;
};

export type AudioTrackPlaceholder = {
  captionTrackIndices: number[];
};

export type CaptionInitialState =
  | "CAPTIONS_INITIAL_STATE_ON_RECOMMENDED"
  | "CAPTIONS_INITIAL_STATE_OFF_RECOMMENDED";

export type AudioTrackVisibility = "ON" | "UNKNOWN";

export interface AudioTrack extends AudioTrackPlaceholder {
  audioTrackId: LangId;
  captionTrackIndices: number[];
  captionsInitialState: CaptionInitialState;
  defaultCaptionTrackIndex: number;
  hasDefaultTrack: boolean;
  visibility: AudioTrackVisibility;
}

export type SimpleText = Record<"simpleText", string>;

export type CaptionTrack = {
  baseUrl: string;
  isTranslatable: boolean;
  kind?: "asr";
  languageCode: string;
  name: SimpleText;
  trackName: string;
  /**
   * .languageCode by default (a.languageCode for asr)
   */
  vssId: string;
};

export type translationLanguage = {
  languageCode: string;
  languageName: SimpleText;
};

export type CaptionTracklist = {
  audioTracks: AudioTrack[] | AudioTrackPlaceholder[];
  captionTracks: CaptionTrack[];
  /**
   * Original video audio track
   */
  defaultAudioTrackIndex: number;
  translationLanguages: translationLanguage[];
};

export type MicroformatEmbed = {
  height: number;
  width: number;
  iframeUrl: string; // "https://www.youtube.com/embed/VIDEO_ID"
};

export type MicroformatRenderer = {
  /**
   * list of available country codes in UPPERCASE
   */
  availableCountries: string[];
  category: string;
  /**
   * Localized description
   */
  description: SimpleText;
  embed: MicroformatEmbed;
  externalChannelId: string;
  hasYpcMetadata: boolean;
  isFamilySafe: boolean;
  isShortsEligible: boolean;
  isUnlisted: boolean;
  lengthSeconds: string;
  ownerChannelName: string;
  ownerProfileUrl: string;
  publishDate: string; // iso date format
  thumbnail: Record<"thumbnails", unknown[]>;
  /**
   * Localized title
   */
  title: SimpleText;
  uploadDate: string; // iso date format
  viewCount: string;
};

export type PlayerResponse = {
  // doesn't have full types
  captions: Record<"playerCaptionsTracklistRenderer", CaptionTracklist>;
  microformat: Record<"playerMicroformatRenderer", MicroformatRenderer>;
  streamingData: StreamingData;
  videoDetails: VideoDetails;
};

export interface PlayerCaptionTrack {
  captionId: string;
  displayName: string;
  id: null;
  isDefault: boolean;
  isTranslateable: boolean;
  kind: "" | "asr";
  languageCode: string;
  languageName: string;
  name: string;
  translationLanguage: string | null;
  url: string;
  vssId: string;
  xtags: string;
  getId(): PlayerCaptionTrack["id"];
  getName(): PlayerCaptionTrack["name"];
  getXtags(): PlayerCaptionTrack["xtags"];
  isServable(): boolean;
  toString(): `${PlayerCaptionTrack["languageCode"]}: ${PlayerCaptionTrack["languageName"]} - ${PlayerCaptionTrack["vssId"]} - ${PlayerCaptionTrack["name"]}`;
}

export interface PlayerAudioTrackLanguageInfo {
  id: LangId;
  isDefault: boolean;
  name: string;
  getId(): PlayerAudioTrackLanguageInfo["id"];
  getIsDefault(): PlayerAudioTrackLanguageInfo["isDefault"];
  getName(): PlayerAudioTrackLanguageInfo["name"];
  toStrin(): PlayerAudioTrackLanguageInfo["name"];
}

export interface PlayerAudioTrack {
  captionsInitialState: CaptionInitialState;
  id: string;
  captionTracks: PlayerCaptionTrack;
  xtags: string;
  getLanguageInfo(): PlayerAudioTrackLanguageInfo;
  getXtags(): PlayerAudioTrack["xtags"];
  toString(): PlayerAudioTrackLanguageInfo["name"];
}

export type PlayerVideoData = {
  // doesn't have full types
  allowLiveDvr: boolean;
  author: string;
  eventId: string;
  isListed: boolean;
  isLive: boolean;
  isManifestless: boolean;
  isMultiChannelAudio: boolean;
  isPlayable: boolean;
  isPremiere: boolean;
  isWindowedLive: boolean;
  /**
   * localized title
   */
  title: string;
  video_id: string;
  video_quality: Quality;
};

export type PlayerProgressState = {
  airingStart: number;
  airingEnd: number;
  allowSeeking: boolean;
  clipEnd: null;
  clipStart: number;
  current: number;
  displayedStart: number;
  duration: number;
  ingestionTime: null;
  isAtLiveHead: boolean;
  loaded: number;
  seekableStart: number;
  seekableEnd: number;
  offset: number;
  viewerLivestreamJoinMediaTime: number;
};

export interface PlayerElement extends HTMLDivElement {
  getPlayerResponse(): PlayerResponse;
  getProgressState(): PlayerProgressState;
  getAudioTrack(): PlayerAudioTrack;
  getAvailableAudioTracks(): PlayerAudioTrack[];
  getDuration(): number;
  getVolume(): number;
  getVideoData(): PlayerVideoData;
  setVolume(volume: number): void;
  isMuted(): boolean;
}
