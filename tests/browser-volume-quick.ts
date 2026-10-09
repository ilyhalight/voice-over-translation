import "../src/styles/main.scss";
import { VOTVideoManager } from "../src/core/videoManager";
import ru from "../src/localization/locales/ru.json";
import { localizationProvider } from "../src/localization/localizationProvider";
import { UIManager } from "../src/ui/manager";
import { votStorage } from "../src/utils/storage";
import { VideoHandler } from "../src/VideoHandler";
import { enforceAutoVolumeCeiling } from "../src/videoHandler/autoVolumeLimit";
import { syncAudioTranslationVolumeFromVideo } from "../src/videoHandler/modules/events";

async function main() {
  localizationProvider.setLocaleFromJsonString(JSON.stringify(ru));
  const data = await votStorage.getValues({
    syncVolume: false,
    volumeLinkMode: "delta" as const,
    translationVolumeOffset: 10,
    enabledAutoVolume: false,
    autoVolume: 15,
    autoVolumeMode: "once" as const,
    enabledSmartDucking: false,
    showVideoSlider: true,
    defaultVolume: 100,
    audioBooster: false,
    localeLangOverride: "ru",
    account: {},
  });
  const container = document.querySelector("#player") as HTMLElement;
  const video = container.querySelector("video") as HTMLVideoElement;
  video.volume = 0.8;
  const audio = document.createElement("audio");
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
    container,
    data,
    site: { host: "custom" },
    audioPlayer: { player: audio },
    volumeLinkState: {
      initialized: false,
      lastVideoPercent: 80,
      lastTranslationPercent: 100,
    },
    internalVideoVolumeSetHistory: [],
    internalVideoVolumeSetHistoryLimit: 48,
    internalVideoVolumeSuppressionMs: 250,
  });
  handler.videoManager = new VOTVideoManager(handler);
  handler.getVideoVolume = () => handler.videoManager.getVideoVolume();
  handler.isMuted = () => video.muted;
  handler.syncVideoVolumeSlider = () =>
    handler.videoManager.syncVideoVolumeSlider();
  const manager = new UIManager({
    data,
    videoHandler: handler,
    mount: {
      root: container,
      portalContainer: document.body,
      subtitlesMountContainer: container,
    },
    intervalIdleChecker: { markActivity: () => {} } as any,
  });
  handler.uiManager = manager;
  manager.initUI().initUIEvents();
  if (!manager.isInitialized())
    throw new Error("UI manager did not initialize");
  const overlay = manager.votOverlayView;
  if (!overlay.isInitialized()) throw new Error("Overlay did not initialize");
  const videoSlider = overlay.videoVolumeSlider;
  overlay.votButton.status = "success";
  overlay.votButton.opacity = 1;
  videoSlider.hidden = false;
  overlay.translationVolumeSlider.hidden = false;
  overlay.votMenu.hidden = false;
  video.addEventListener("volumechange", () => {
    enforceAutoVolumeCeiling(handler);
    handler.syncVideoVolumeSlider();
    syncAudioTranslationVolumeFromVideo(handler, videoSlider.value);
  });
  handler.setupAudioSettings();
  handler.refreshVolumeLink();
  Object.assign(window, {
    fixture: {
      data,
      video,
      audio,
      handler,
      manager,
      overlay,
      settings: manager.votSettingsView,
      votStorage,
    },
  });
}
void main().catch((error) => {
  Object.assign(window, { fixtureError: String(error) });
  console.error(error);
});
