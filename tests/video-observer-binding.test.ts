import { describe, expect, test } from "bun:test";

import { bindObserverListeners } from "../src/bootstrap/videoObserverBinding";

class AsyncEvent<T> {
  private listener?: (value: T) => void | Promise<void>;

  addListener(listener: (value: T) => void | Promise<void>): void {
    this.listener = listener;
  }

  async dispatch(value: T): Promise<void> {
    await this.listener?.(value);
  }
}

function createFixture(resolveVideoId: (video: HTMLVideoElement) => string) {
  const added = new AsyncEvent<HTMLVideoElement>();
  const removed = new AsyncEvent<HTMLVideoElement>();
  const videos: HTMLVideoElement[] = [];
  const container = {
    querySelectorAll: () => videos,
  } as unknown as HTMLElement;
  const site = { host: "youtube", url: "https://youtu.be/" } as any;
  const wrappers = new WeakMap<HTMLVideoElement, any>();
  const handlers: any[] = [];

  bindObserverListeners({
    videoObserver: {
      onVideoAdded: added,
      onVideoRemoved: removed,
    } as any,
    videosWrappers: wrappers,
    ensureRuntimeActivated: async () => {},
    getServicesCached: () => [site],
    findContainer: () => container,
    createVideoHandler: (video) => {
      const handler = {
        site,
        video,
        videoData: { videoId: resolveVideoId(video) },
        active: true,
        init: async () => {},
        setCanPlay: async () => {},
        getVideoData: async () => undefined,
        hasActiveSource() {
          return this.active;
        },
        async replaceVideo(nextVideo: HTMLVideoElement) {
          this.video = nextVideo;
        },
        async release() {
          this.released = true;
        },
        released: false,
      };
      handlers.push(handler);
      return handler;
    },
    resolveVideoId: async (_site, video) => resolveVideoId(video),
  });

  return { added, container, handlers, removed, videos, wrappers };
}

function createVideo(isConnected: boolean): HTMLVideoElement {
  return { isConnected } as HTMLVideoElement;
}

describe("video observer binding", () => {
  test("reuses an active handler when the old video element is removed", async () => {
    const videoIds = new WeakMap<HTMLVideoElement, string>();
    const fixture = createFixture((video) => videoIds.get(video) ?? "");
    const oldVideo = createVideo(true);
    const newVideo = createVideo(true);
    videoIds.set(oldVideo, "same-video");
    videoIds.set(newVideo, "same-video");
    fixture.videos.push(oldVideo);

    await fixture.added.dispatch(oldVideo);
    const handler = fixture.handlers[0];
    Object.defineProperty(oldVideo, "isConnected", { value: false });
    fixture.videos.splice(0, 1, newVideo);

    await fixture.removed.dispatch(oldVideo);

    expect(fixture.handlers).toHaveLength(1);
    expect(handler.released).toBe(false);
    expect(handler.video).toBe(newVideo);
    expect(fixture.wrappers.get(oldVideo)).toBeUndefined();
    expect(fixture.wrappers.get(newVideo)).toBe(handler);

    await fixture.added.dispatch(newVideo);
    expect(fixture.handlers).toHaveLength(1);
  });

  test("keeps the normal lifecycle when the video ID changes", async () => {
    const videoIds = new WeakMap<HTMLVideoElement, string>();
    const fixture = createFixture((video) => videoIds.get(video) ?? "");
    const oldVideo = createVideo(true);
    const newVideo = createVideo(true);
    videoIds.set(oldVideo, "first-video");
    videoIds.set(newVideo, "second-video");
    fixture.videos.push(oldVideo);

    await fixture.added.dispatch(oldVideo);
    const oldHandler = fixture.handlers[0];
    Object.defineProperty(oldVideo, "isConnected", { value: false });
    fixture.videos.splice(0, 1, newVideo);

    await fixture.added.dispatch(newVideo);

    expect(fixture.handlers).toHaveLength(2);
    expect(oldHandler.released).toBe(true);
    expect(fixture.wrappers.get(newVideo)).toBe(fixture.handlers[1]);
  });
});
