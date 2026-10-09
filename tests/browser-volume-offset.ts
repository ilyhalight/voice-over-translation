import "../src/styles/main.scss";
import { VOTVideoManager } from "../src/core/videoManager";
import ru from "../src/localization/locales/ru.json";
import { localizationProvider } from "../src/localization/localizationProvider";
import Slider from "../src/ui/components/slider";
import { UIManager } from "../src/ui/manager";
import { SettingsView } from "../src/ui/views/settings";
import { votStorage } from "../src/utils/storage";
import { VideoHandler } from "../src/VideoHandler";
import { syncAudioTranslationVolumeFromVideo } from "../src/videoHandler/modules/events";

async function main() {
  localizationProvider.setLocaleFromJsonString(JSON.stringify(ru));
  const data = await votStorage.getValues({
    syncVolume: true,
    volumeLinkMode: "offset" as const,
    translationVolumeOffset: 10,
    enabledAutoVolume: false,
    enabledSmartDucking: false,
    showVideoSlider: true,
    defaultVolume: 100,
    audioBooster: false,
    localeLangOverride: "ru",
    account: {},
  });
  const video = document.createElement("video");
  video.controls = true;
  video.volume = 0.1;
  const audio = document.createElement("audio");
  // Minimal silent WAV fixture; no remote media or translation service.
  const wav = new ArrayBuffer(46);
  const view = new DataView(wav);
  const text = (at: number, value: string) =>
    [...value].forEach((c, i) => {
      view.setUint8(at + i, c.charCodeAt(0));
    });
  text(0, "RIFF");
  view.setUint32(4, 38, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, 2, true);
  audio.src = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
  const handler = Object.create(VideoHandler.prototype) as VideoHandler;
  Object.assign(handler, {
    video,
    data,
    site: { host: "custom" },
    audioPlayer: { player: audio },
    volumeLinkState: {
      initialized: false,
      lastVideoPercent: 10,
      lastTranslationPercent: 100,
    },
    internalVideoVolumeSetHistory: [],
    internalVideoVolumeSetHistoryLimit: 48,
    internalVideoVolumeSuppressionMs: 250,
  });
  handler.videoManager = new VOTVideoManager(handler);
  handler.isMuted = () => video.muted;
  handler.syncVideoVolumeSlider = () =>
    handler.videoManager.syncVideoVolumeSlider();
  const videoSlider = new Slider({ labelHtml: "Original", value: 10 });
  const translationSlider = new Slider({
    labelHtml: "Translation",
    value: 100,
  });
  const manager = Object.create(UIManager.prototype) as UIManager;
  Object.assign(manager, {
    data,
    videoHandler: handler,
    votOverlayView: {
      isInitialized: () => true,
      videoVolumeSlider: videoSlider,
      translationVolumeSlider: translationSlider,
    },
  });
  handler.uiManager = manager;
  const settings = new SettingsView({
    globalPortal: document.querySelector("#portal") as HTMLElement,
    data,
    videoHandler: handler,
  });
  settings.initUI().initUIEvents();
  manager.votSettingsView = settings;
  (manager as any).bindSettingsViewEvents();
  video.addEventListener("volumechange", () => {
    handler.syncVideoVolumeSlider();
    syncAudioTranslationVolumeFromVideo(handler, videoSlider.value);
  });
  videoSlider.addEventListener("input", (value, fromSetter) => {
    if (!fromSetter) video.volume = value / 100;
  });
  document
    .querySelector("#player")
    ?.append(video, videoSlider.container, translationSlider.container);
  handler.refreshVolumeLink();
  settings.open();
  Object.assign(window, {
    fixture: { data, video, audio, handler, manager, settings, votStorage },
  });
}
void main().catch((error) => {
  Object.assign(window, { fixtureError: String(error) });
  console.error(error);
});
