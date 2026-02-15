import type { ServiceConf } from "@vot.js/ext/types/service";
import type { VideoObserver } from "../utils/VideoObserver";

type VideoHandlerLike = {
  init(): Promise<void>;
  setCanPlay(): Promise<void>;
  release(): Promise<void> | void;
};

type BindObserverListenersOptions = {
  videoObserver: VideoObserver;
  videosWrappers: WeakMap<HTMLVideoElement, VideoHandlerLike>;
  ensureRuntimeActivated: (reason: string) => Promise<void>;
  getServicesCached: () => ServiceConf[];
  findContainer: (
    site: ServiceConf,
    video: HTMLVideoElement,
  ) => HTMLElement | null;
  createVideoHandler: (
    video: HTMLVideoElement,
    container: HTMLElement,
    site: ServiceConf,
  ) => VideoHandlerLike;
};

let observerListenersBound = false;

export function bindObserverListeners(
  options: BindObserverListenersOptions,
): void {
  if (observerListenersBound) return;
  observerListenersBound = true;

  const {
    videoObserver,
    videosWrappers,
    ensureRuntimeActivated,
    getServicesCached,
    findContainer,
    createVideoHandler,
  } = options;

  const initializingVideos = new WeakSet<HTMLVideoElement>();
  const containerOwners = new WeakMap<HTMLElement, HTMLVideoElement>();
  const videoContainers = new WeakMap<HTMLVideoElement, HTMLElement>();
  const pendingVideoByContainer = new WeakMap<HTMLElement, HTMLVideoElement>();

  const clearContainerOwner = (
    video: HTMLVideoElement,
  ): HTMLElement | undefined => {
    const container = videoContainers.get(video);
    if (container && containerOwners.get(container) === video) {
      containerOwners.delete(container);
    }
    videoContainers.delete(video);
    return container ?? undefined;
  };

  const clearPendingVideo = (container?: HTMLElement): void => {
    if (!container) {
      return;
    }
    pendingVideoByContainer.delete(container);
  };

  const promotePendingVideo = async (
    container?: HTMLElement,
  ): Promise<void> => {
    if (!container) {
      return;
    }

    const pendingVideo = pendingVideoByContainer.get(container);
    if (!pendingVideo) {
      return;
    }
    pendingVideoByContainer.delete(container);
    if (
      !pendingVideo.isConnected ||
      videosWrappers.has(pendingVideo) ||
      initializingVideos.has(pendingVideo)
    ) {
      return;
    }
    await handleVideoAdded(pendingVideo);
  };

  const handleVideoAdded = async (video: HTMLVideoElement) => {
    if (videosWrappers.has(video) || initializingVideos.has(video)) return;
    initializingVideos.add(video);

    try {
      try {
        await ensureRuntimeActivated("video-detected");
      } catch (err) {
        console.error("[VOT] Failed to activate runtime", err);
        return;
      }

      let container: HTMLElement | null = null;
      const site = getServicesCached().find((candidate) => {
        container = findContainer(candidate, video);
        return Boolean(container);
      });

      if (!site || !container) {
        return;
      }

      const activeVideoForContainer = containerOwners.get(container);
      if (activeVideoForContainer && activeVideoForContainer !== video) {
        if (activeVideoForContainer.isConnected) {
          pendingVideoByContainer.set(container, video);
          return;
        }

        try {
          await videosWrappers.get(activeVideoForContainer)?.release();
        } catch (err) {
          console.error("[VOT] Failed to release stale videoHandler", err);
        }
        videosWrappers.delete(activeVideoForContainer);
        clearContainerOwner(activeVideoForContainer);
      }

      if (["peertube", "directlink"].includes(site.host)) {
        site.url = globalThis.location.origin;
      }

      const videoHandler = createVideoHandler(video, container, site);
      // Register before async init to prevent duplicate in-flight handlers.
      videosWrappers.set(video, videoHandler);
      videoContainers.set(video, container);
      containerOwners.set(container, video);

      try {
        await videoHandler.init();
        if (videosWrappers.get(video) !== videoHandler) {
          return;
        }
        try {
          await videoHandler.setCanPlay();
        } catch (err) {
          console.error("[VOT] Failed to get video data", err);
        }
      } catch (err) {
        if (videosWrappers.get(video) === videoHandler) {
          videosWrappers.delete(video);
          const container = clearContainerOwner(video);
          clearPendingVideo(container);
          await promotePendingVideo(container);
        }
        throw err;
      }
    } catch (err) {
      console.error("[VOT] Failed to initialize videoHandler", err);
    } finally {
      initializingVideos.delete(video);
    }
  };

  videoObserver.onVideoAdded.addListener(handleVideoAdded);

  videoObserver.onVideoRemoved.addListener(async (video) => {
    const container = clearContainerOwner(video);
    if (videosWrappers.has(video)) {
      await videosWrappers.get(video)?.release();
      videosWrappers.delete(video);
    }
    initializingVideos.delete(video);
    if (container && pendingVideoByContainer.get(container) === video) {
      clearPendingVideo(container);
    }
    await promotePendingVideo(container);
  });
}
