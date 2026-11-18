import { describe, expect, test } from "vitest";

import {
  createTranslationAudioGuard,
  recoverStalledTranslationAudio,
} from "../src/videoHandler/modules/translationAudioGuard";

type ResumeMode = "resolve" | "pending" | "reject";

async function flushMicrotasks() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

function createHost(
  options: { resyncUnpauses?: boolean; resumeMode?: ResumeMode } = {},
) {
  const { resyncUnpauses = true, resumeMode = "resolve" } = options;
  const media = { paused: false, ended: false, duration: 600 };
  const pendingResumes: Array<() => void> = [];
  const context = {
    state: "running",
    resumeCalls: 0,
    resume(): Promise<void> {
      context.resumeCalls += 1;
      if (resumeMode === "reject") {
        return Promise.reject(new Error("not allowed to start"));
      }
      if (resumeMode === "pending") {
        return new Promise<void>((resolve) => pendingResumes.push(resolve));
      }
      context.state = "running";
      return Promise.resolve();
    },
    startRunning() {
      context.state = "running";
      for (const resolve of pendingResumes.splice(0)) resolve();
    },
  };
  const player = {
    audio: media,
    lipSyncCalls: 0,
    lipSync(_mode: "playing") {
      player.lipSyncCalls += 1;
      if (resyncUnpauses) media.paused = false;
    },
  };
  const host = {
    video: { paused: false, ended: false, readyState: 4, currentTime: 10 },
    activeSource: true,
    hasActiveSource() {
      return host.activeSource;
    },
    audioPlayer: { audioContext: context, player },
  };
  return { host, media, context, player };
}

describe("recoverStalledTranslationAudio", () => {
  test("leaves normally playing translation alone", () => {
    const { host, context, player } = createHost();

    expect(recoverStalledTranslationAudio(host)).toBe("not-needed");
    expect(player.lipSyncCalls).toBe(0);
    expect(context.resumeCalls).toBe(0);
  });

  test("resyncs translation paused behind the playing video", () => {
    const { host, media, player } = createHost();
    media.paused = true;

    expect(recoverStalledTranslationAudio(host)).toBe("resynced");
    expect(player.lipSyncCalls).toBe(1);
  });

  test("ignores paused translation while the video is not playing", () => {
    const paused = createHost();
    paused.media.paused = true;
    paused.host.video.paused = true;

    const buffering = createHost();
    buffering.media.paused = true;
    buffering.host.video.readyState = 2;

    const stopped = createHost();
    stopped.media.paused = true;
    stopped.host.activeSource = false;

    const finished = createHost();
    finished.media.paused = true;
    finished.host.video.ended = true;

    for (const { host, player } of [paused, buffering, stopped, finished]) {
      expect(recoverStalledTranslationAudio(host)).toBe("not-needed");
      expect(player.lipSyncCalls).toBe(0);
    }
  });

  test("resyncs translation whose duration is unknown or infinite", () => {
    for (const duration of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { host, media, player } = createHost();
      media.paused = true;
      media.duration = duration;

      expect(recoverStalledTranslationAudio(host)).toBe("resynced");
      expect(player.lipSyncCalls).toBe(1);
    }
  });

  test("resumes an interrupted AudioContext before resyncing", async () => {
    const { host, media, context, player } = createHost();
    context.state = "interrupted";
    media.paused = true;

    expect(recoverStalledTranslationAudio(host)).toBe("resuming-context");
    expect(context.resumeCalls).toBe(1);
    expect(player.lipSyncCalls).toBe(0);

    await flushMicrotasks();
    expect(player.lipSyncCalls).toBe(1);
  });

  test("survives a rejected AudioContext resume and retries later", async () => {
    const { host, media, context, player } = createHost({
      resumeMode: "reject",
    });
    context.state = "suspended";
    media.paused = true;

    expect(recoverStalledTranslationAudio(host)).toBe("resuming-context");
    await flushMicrotasks();
    expect(player.lipSyncCalls).toBe(0);

    expect(recoverStalledTranslationAudio(host)).toBe("resuming-context");
    expect(context.resumeCalls).toBe(2);
    await flushMicrotasks();
  });

  test("does not stack resume calls while one is still pending", async () => {
    const { host, media, context, player } = createHost({
      resumeMode: "pending",
    });
    context.state = "suspended";
    media.paused = true;

    for (let i = 0; i < 3; i += 1) {
      expect(recoverStalledTranslationAudio(host)).toBe("resuming-context");
    }
    expect(context.resumeCalls).toBe(1);

    context.startRunning();
    await flushMicrotasks();
    expect(player.lipSyncCalls).toBe(1);
  });

  test("repeats a pending resume on a user gesture without resyncing twice", async () => {
    const { host, media, context, player } = createHost({
      resumeMode: "pending",
      resyncUnpauses: false,
    });
    context.state = "suspended";
    media.paused = true;

    recoverStalledTranslationAudio(host);
    recoverStalledTranslationAudio(host, true);
    expect(context.resumeCalls).toBe(2);

    context.startRunning();
    await flushMicrotasks();
    expect(player.lipSyncCalls).toBe(1);
  });

  test("repeats a pending resume once the context state changes", () => {
    const { host, media, context } = createHost({ resumeMode: "pending" });
    context.state = "interrupted";
    media.paused = true;

    recoverStalledTranslationAudio(host);
    recoverStalledTranslationAudio(host);
    expect(context.resumeCalls).toBe(1);

    context.state = "suspended";
    recoverStalledTranslationAudio(host);
    recoverStalledTranslationAudio(host);
    expect(context.resumeCalls).toBe(2);
  });

  test("resumes a suspended AudioContext even if the element plays", () => {
    const { host, context, player } = createHost();
    context.state = "suspended";

    expect(recoverStalledTranslationAudio(host)).toBe("resuming-context");
    expect(context.resumeCalls).toBe(1);
    expect(player.lipSyncCalls).toBe(0);
  });

  test("does not resume a closed AudioContext", () => {
    const { host, context } = createHost();
    context.state = "closed";

    expect(recoverStalledTranslationAudio(host)).toBe("not-needed");
    expect(context.resumeCalls).toBe(0);
  });

  test("does not restart translation that is already over", () => {
    const ended = createHost();
    ended.media.paused = true;
    ended.media.ended = true;

    const shorter = createHost();
    shorter.media.paused = true;
    shorter.media.duration = 5;

    for (const { host, player } of [ended, shorter]) {
      expect(recoverStalledTranslationAudio(host)).toBe("not-needed");
      expect(player.lipSyncCalls).toBe(0);
    }
  });

  test("handles the player that exposes audioElement", () => {
    const media = { paused: true, ended: false, duration: 600 };
    const player = {
      audioElement: media,
      lipSyncCalls: 0,
      lipSync(_mode: "playing") {
        player.lipSyncCalls += 1;
      },
    };
    const host = {
      video: { paused: false, ended: false, readyState: 4, currentTime: 10 },
      hasActiveSource: () => true,
      audioPlayer: { player },
    };

    expect(recoverStalledTranslationAudio(host)).toBe("resynced");
    expect(player.lipSyncCalls).toBe(1);
  });
});

describe("createTranslationAudioGuard", () => {
  test("throttles checks between ticks", () => {
    const { host, media, player } = createHost();
    let time = 0;
    const guard = createTranslationAudioGuard(host, () => time);

    guard.tick();
    media.paused = true;
    time = 500;
    guard.tick();
    expect(player.lipSyncCalls).toBe(0);

    time = 1000;
    guard.tick();
    expect(player.lipSyncCalls).toBe(1);
  });

  test("backs off while recovery keeps failing", () => {
    const { host, media, player } = createHost({ resyncUnpauses: false });
    media.paused = true;
    let time = 0;
    const guard = createTranslationAudioGuard(host, () => time);

    const callsAt: number[] = [];
    for (time = 0; time <= 40_000; time += 250) {
      const before = player.lipSyncCalls;
      guard.tick();
      if (player.lipSyncCalls !== before) callsAt.push(time);
    }

    expect(callsAt).toEqual([0, 1000, 3000, 7000, 15_000, 31_000]);
  });

  test("force bypasses the throttle and resets the backoff", () => {
    const { host, media, player } = createHost({ resyncUnpauses: false });
    media.paused = true;
    let time = 0;
    const guard = createTranslationAudioGuard(host, () => time);

    guard.tick();
    time = 1000;
    guard.tick();
    time = 1100;
    guard.force();
    expect(player.lipSyncCalls).toBe(3);

    time = 2100;
    guard.tick();
    expect(player.lipSyncCalls).toBe(4);
  });
});
