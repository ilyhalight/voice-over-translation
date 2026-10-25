export {
  applyManualVideoVolumeOverride,
  setupAudioSettings,
  stopSmartVolumeDucking,
} from "./smartDuckingRuntime";
export {
  cancelDeferredTranslationResume,
  handlePlaybackResumedTranslationRefresh,
  handleProxySettingsChanged,
  isMultiMethodS3,
  isYouTubeHosts,
  proxifyAudio,
  refreshTranslationAudio,
  syncTranslationPlaybackVolume,
  translateFunc,
  unproxifyAudio,
  updateTranslation,
} from "./translationPlayback";
