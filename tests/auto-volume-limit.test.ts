import { describe, expect, test } from "bun:test";
import {
  applyAutoVolumeLimit,
  enforceAutoVolumeCeiling,
  stopAutoVolumeLimit,
} from "../src/videoHandler/autoVolumeLimit";

function fixture(mode: "once" | "hold" = "hold") {
  let volume = 0.8;
  const handler = {
    data: { enabledAutoVolume: true, autoVolumeMode: mode, autoVolume: 15 },
    hasActiveSource: () => true,
    getVideoVolume: () => volume,
    setVideoVolume: (value: number) => {
      volume = value;
    },
  };
  return {
    handler,
    get: () => volume,
    userSet: (value: number) => {
      volume = value;
    },
  };
}

describe("original-volume limit", () => {
  test("hold clamps increases but permits lower user volume", () => {
    const f = fixture();
    applyAutoVolumeLimit(f.handler);
    f.userSet(0.6);
    expect(enforceAutoVolumeCeiling(f.handler)).toBe(true);
    expect(f.get()).toBeCloseTo(0.15);
    f.userSet(0.05);
    expect(enforceAutoVolumeCeiling(f.handler)).toBe(false);
    expect(f.get()).toBeCloseTo(0.05);
    stopAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.8);
  });
  test("changing the ceiling applies immediately without overwriting baseline", () => {
    const f = fixture();
    applyAutoVolumeLimit(f.handler);
    f.handler.data.autoVolume = 10;
    applyAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.1);
    stopAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.8);
  });

  test("once mode does not undo later manual changes on unrelated setup", () => {
    const f = fixture("once");
    applyAutoVolumeLimit(f.handler);
    f.userSet(0.6);
    applyAutoVolumeLimit(f.handler);
    expect(enforceAutoVolumeCeiling(f.handler)).toBe(false);
    expect(f.get()).toBeCloseTo(0.6);
    stopAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.8);
  });

  test("runtime honors once mode despite legacy adaptive preference and restores actual baseline", async () => {
    (globalThis as any).DEBUG_MODE = false;
    const runtime = await import(
      "../src/videoHandler/modules/smartDuckingRuntime"
    );
    const f = fixture("once");
    const handler = Object.assign(f.handler, {
      audioPlayer: { player: { volume: 1 } },
      volumeOnStart: 0.9,
      isMuted: () => false,
      setVideoMuted: () => {},
    }) as any;
    handler.data.enabledSmartDucking = true;
    try {
      runtime.setupAudioSettings.call(handler);
      expect(f.get()).toBeCloseTo(0.15);
      runtime.stopSmartVolumeDucking(handler, { restoreVolume: 0.9 });
      expect(f.get()).toBeCloseTo(0.8);
    } finally {
      runtime.stopSmartVolumeDucking(handler);
    }
  });

  test("later stop does not overwrite user volume after reduction was disabled", async () => {
    (globalThis as any).DEBUG_MODE = false;
    const runtime = await import(
      "../src/videoHandler/modules/smartDuckingRuntime"
    );
    const f = fixture("hold");
    const handler = Object.assign(f.handler, {
      audioPlayer: { player: { volume: 1 } },
      volumeOnStart: 0.9,
    }) as any;
    runtime.setupAudioSettings.call(handler);
    handler.data.enabledAutoVolume = false;
    runtime.setupAudioSettings.call(handler);
    expect(f.get()).toBeCloseTo(0.8);
    f.userSet(0.5);
    runtime.stopSmartVolumeDucking(handler, { restoreVolume: 0.9 });
    expect(f.get()).toBeCloseTo(0.5);
  });

  test("YouTube observer sync links from the enforced ceiling rather than attempted volume", async () => {
    (globalThis as any).DEBUG_MODE = false;
    const { syncAudioTranslationVolumeFromVideo } = await import(
      "../src/videoHandler/modules/events"
    );
    const f = fixture("hold");
    let synced = -1;
    const handler = Object.assign(f.handler, {
      site: { host: "youtube" },
      audioPlayer: { player: { src: "local-test" } },
      syncVideoVolumeSlider: () => {},
      syncVolumeWrapper: (_type: string, value: number) => {
        synced = value;
      },
    }) as any;
    Object.assign(handler.data, { syncVolume: true, volumeLinkMode: "offset" });
    applyAutoVolumeLimit(handler);
    f.userSet(0.6);
    syncAudioTranslationVolumeFromVideo(handler, 60);
    expect(f.get()).toBeCloseTo(0.15);
    expect(synced).toBe(15);
    stopAutoVolumeLimit(handler);
  });

  test("invalid or fractional saved limits normalize to safe whole percentages", () => {
    const f = fixture();
    f.handler.data.autoVolume = Number.NaN;
    applyAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.15);
    f.handler.data.autoVolume = 14.5;
    f.userSet(0.8);
    applyAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.15);
    stopAutoVolumeLimit(f.handler);
  });

  test("manual once-mode changes do not leak into upstream adaptive restoration", async () => {
    (globalThis as any).DEBUG_MODE = false;
    const runtime = await import(
      "../src/videoHandler/modules/smartDuckingRuntime"
    );
    const f = fixture("once");
    const handler = Object.assign(f.handler, {
      audioPlayer: { player: { volume: 1 } },
    }) as any;
    runtime.setupAudioSettings.call(handler);
    f.userSet(0.6);
    runtime.applyManualVideoVolumeOverride.call(handler, 0.6);
    expect(handler.smartVolumeDuckingBaseline).toBeUndefined();
    runtime.stopSmartVolumeDucking(handler);
    expect(f.get()).toBeCloseTo(0.8);
  });

  test("replacing the video restores its baseline and captures the new element baseline", async () => {
    (globalThis as any).DEBUG_MODE = false;
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
    const oldVideo = { volume: 0.8 } as HTMLVideoElement;
    const newVideo = { volume: 0.6 } as HTMLVideoElement;
    const handler = Object.create(VideoHandler.prototype) as any;
    handler.data = {
      enabledAutoVolume: true,
      autoVolumeMode: "once",
      autoVolume: 15,
    };
    handler.video = oldVideo;
    handler.audioPlayer = {
      replaceVideo: async (video: HTMLVideoElement) => {
        handler.video = video;
      },
    };
    handler.abortController = new AbortController();
    handler.releaseExtraEvents = () => {};
    handler.resetSubtitlesWidget = () => {};
    handler.initExtraEvents = () => {};
    handler.hasActiveSource = () => true;
    handler.getVideoVolume = () => handler.video.volume;
    handler.setVideoVolume = (volume: number) => {
      handler.video.volume = volume;
    };

    applyAutoVolumeLimit(handler);
    expect(oldVideo.volume).toBeCloseTo(0.15);
    await handler.replaceVideo(newVideo);
    applyAutoVolumeLimit(handler);
    expect(oldVideo.volume).toBeCloseTo(0.8);
    expect(newVideo.volume).toBeCloseTo(0.15);
    stopAutoVolumeLimit(handler);
    expect(newVideo.volume).toBeCloseTo(0.6);
  });

  test("disabling reduction restores the level saved before reduction", () => {
    const f = fixture();
    applyAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.15);
    f.handler.data.enabledAutoVolume = false;
    applyAutoVolumeLimit(f.handler);
    expect(f.get()).toBeCloseTo(0.8);
  });
});
