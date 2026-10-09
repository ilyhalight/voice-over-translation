import { describe, expect, test } from "bun:test";
import { applyVolumeLinkDelta } from "../src/videoHandler/volumeLink";

function makeInput() {
  return {
    state: {
      initialized: true,
      lastVideoPercent: 50,
      lastTranslationPercent: 100,
    },
    fromType: "video" as const,
    newVolume: 10,
    currentVideo: 10,
    currentTranslation: 100,
    translationMin: 0,
    translationMax: 100,
    offsetPercent: 10,
  };
}

describe("fixed translation volume offset", () => {
  test("10% original plus 10 percentage points produces 20% translation", () => {
    const input = makeInput();
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 20 });
    expect(input.state.lastTranslationPercent).toBe(20);
  });

  test("zero original volume silences translation despite a positive offset", () => {
    const input = makeInput();
    input.newVolume = 0;
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 0 });
  });

  test("fixed offset recovers after reaching maximum volume", () => {
    const input = makeInput();
    input.offsetPercent = 20;
    input.newVolume = 95;
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 100 });
    input.newVolume = 50;
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 70 });
  });

  test("fixed offset treats the original as master even for translation input", () => {
    const input = {
      ...makeInput(),
      fromType: "translation" as const,
      newVolume: 90,
    };
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 20 });
  });

  test("custom offsets are clamped to the 0..100 range", () => {
    const input = makeInput();
    input.offsetPercent = -10;
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 10 });
    input.offsetPercent = 150;
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 100 });
  });

  test("classic delta mode preserves its previous behavior", () => {
    const input = { ...makeInput(), offsetPercent: undefined };
    expect(applyVolumeLinkDelta(input)).toEqual({ nextTranslation: 60 });
  });

  test("handler applies the offset to both the slider and actual audio", async () => {
    (globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
    const previousWindow = globalThis.window;
    const previousKeyboardInit = globalThis.__votKeyboardNavInitialized;
    globalThis.__votKeyboardNavInitialized = true;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
    let VideoHandler: typeof import("../src/VideoHandler").VideoHandler;
    try {
      ({ VideoHandler } = await import("../src/VideoHandler"));
    } finally {
      globalThis.__votKeyboardNavInitialized = previousKeyboardInit;
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
    const handler = Object.create(VideoHandler.prototype);
    const translationSlider = { value: 100, min: 0, max: 100, disabled: false };
    handler.data = {
      syncVolume: true,
      volumeLinkMode: "offset",
      translationVolumeOffset: 10,
    };
    handler.volumeLinkState = makeInput().state;
    handler.uiManager = {
      votOverlayView: {
        isInitialized: () => true,
        videoVolumeSlider: { value: 10 },
        translationVolumeSlider: translationSlider,
      },
    };
    handler.audioPlayer = { player: { volume: 0.8 } };
    handler.isMuted = () => false;
    handler.syncVolumeWrapper("video", 10);
    expect(translationSlider.value).toBe(20);
    expect(handler.audioPlayer.player.volume).toBeCloseTo(0.2);
    // Changing a preset/mode must apply immediately, without moving the player slider.
    handler.data.translationVolumeOffset = 25;
    handler.syncVideoVolumeSlider = () => {};
    handler.audioPlayer.player.src = "test-audio";
    handler.refreshVolumeLink?.();
    expect(handler.audioPlayer.player.volume).toBeCloseTo(0.35);
    expect(translationSlider.disabled).toBe(true);
    handler.isMuted = () => true;
    handler.syncVolumeWrapper("video", 10);
    expect(handler.audioPlayer.player.volume).toBe(0);
    handler.isMuted = () => false;
    handler.syncVolumeWrapper("video", 10);
    expect(handler.audioPlayer.player.volume).toBeCloseTo(0.35);
    // Settings must preview the derived level before a translation source exists.
    handler.audioPlayer.player.src = "";
    handler.data.translationVolumeOffset = 17;
    handler.refreshVolumeLink();
    expect(translationSlider.value).toBe(27);
    expect(handler.audioPlayer.player.volume).toBeCloseTo(0.27);
  });

  test("offset settings controls are disabled when linking is off", async () => {
    // VideoHandler was imported above; SettingsView and its UI dependencies are cached.
    const { SettingsView } = await import("../src/ui/views/settings");
    const view = Object.create(SettingsView.prototype);
    view.data = { syncVolume: false, volumeLinkMode: "offset" };
    view.volumeLinkModeSelect = { disabled: false };
    view.translationOffsetPresetSelect = { hidden: false, disabled: false };
    view.translationOffsetTextfield = { hidden: false, disabled: false };
    view.updateVolumeLinkControls?.();
    expect(view.volumeLinkModeSelect.disabled).toBe(true);
    expect(view.translationOffsetPresetSelect.disabled).toBe(true);
    expect(view.translationOffsetTextfield.disabled).toBe(true);
  });

  test("native YouTube mute events are not skipped in fixed-offset mode", async () => {
    const events = (await import("../src/videoHandler/modules/events")) as any;
    let synced: number | undefined;
    const handler = {
      site: { host: "youtube" },
      data: { syncVolume: true, volumeLinkMode: "offset" },
      audioPlayer: { player: { src: "test-audio" } },
      isLikelyInternalVideoVolumeChange: () => true,
      syncVolumeWrapper: (_from: string, value: number) => {
        synced = value;
      },
    };
    events.syncAudioTranslationVolumeFromVideo?.(handler, 0, {
      skipYouTubeLikeHosts: true,
    });
    expect(synced).toBe(0);
  });

  test("handler clamps hold-mode volume writes before they reach the player", async () => {
    const { VideoHandler } = await import("../src/VideoHandler");
    const { applyAutoVolumeLimit, stopAutoVolumeLimit } = await import(
      "../src/videoHandler/autoVolumeLimit"
    );
    const handler = Object.create(VideoHandler.prototype);
    let volume = 0.8;
    handler.data = {
      enabledAutoVolume: true,
      autoVolumeMode: "hold",
      autoVolume: 15,
    };
    handler.hasActiveSource = () => true;
    handler.getVideoVolume = () => volume;
    handler.videoManager = {
      setVideoVolume: (next: number) => {
        volume = next;
      },
    };
    handler.internalVideoVolumeSetHistory = [];
    handler.internalVideoVolumeSetHistoryLimit = 48;
    handler.internalVideoVolumeSuppressionMs = 250;
    applyAutoVolumeLimit(handler);
    handler.setVideoVolume(0.6);
    expect(volume).toBeCloseTo(0.15);
    stopAutoVolumeLimit(handler);
    expect(volume).toBeCloseTo(0.8);
  });

  test("Select disabled setter actually blocks opening a disabled control", async () => {
    const { default: Select } = await import("../src/ui/components/select");
    const control = Object.create(Select.prototype);
    const attributes = new Map<string, string>();
    control.outer = {
      toggleAttribute: (key: string, enabled: boolean) =>
        enabled ? attributes.set(key, "") : attributes.delete(key),
      getAttribute: (key: string) => attributes.get(key) ?? null,
      hasAttribute: (key: string) => attributes.has(key),
      setAttribute: (key: string, value: string) => attributes.set(key, value),
    };
    control.disabled = true;
    expect(control.disabled).toBe(true);
    control.disabled = false;
    expect(control.disabled).toBe(false);
  });
});
