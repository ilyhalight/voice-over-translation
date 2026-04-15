export {
  applyManualVideoVolumeOverride,
  setupAudioSettings,
  stopSmartVolumeDucking,
} from "./smartDuckingRuntime";
export {
  handlePlaybackResumedTranslationRefresh,
  handleProxySettingsChanged,
  isMultiMethodS3,
  isYouTubeHosts,
  proxifyAudio,
  refreshTranslationAudio,
  scheduleTranslationRefresh,
  syncTranslationPlaybackVolume,
  translateFunc,
  unproxifyAudio,
  updateTranslation,
  validateAudioUrl,
} from "./translationPlayback";
