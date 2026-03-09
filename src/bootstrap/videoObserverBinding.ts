import type { ServiceConf } from "@vot.js/ext/types/service";
import type { VideoObserver } from "../utils/VideoObserver";

type VideoHandlerLike = {
  init(): Promise<void>;
  setCanPlay(): Promise<void>;
  getVideoData(): Promise<unknown>;
  videoData?: unknown;
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

type SiteContainerMatch = {
  site: ServiceConf;
  container: HTMLElement;
};

const boundObservers = new WeakSet<VideoObserver>();

export function bindObserverListeners(
  options: BindObserverListenersOptions,
): void {
  const {
    videoObserver,
    videosWrappers,
    ensureRuntimeActivated,
    getServicesCached,
    findContainer,
    createVideoHandler,
  } = options;

  if (boundObservers.has(videoObserver)) return;
  boundObservers.add(videoObserver);

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

  const releaseVideoHandler = async (
    video: HTMLVideoElement,
    reason: string,
  ): Promise<void> => {
    const videoHandler = videosWrappers.get(video);
    if (!videoHandler) {
      return;
    }

    try {
      await videoHandler.release();
    } catch (error) {
      console.error(`[VOT] Failed to release videoHandler (${reason})`, error);
    } finally {
      videosWrappers.delete(video);
    }
  };

  const getMatchedSiteAndContainer = (
    video: HTMLVideoElement,
  ): SiteContainerMatch | null => {
    for (const candidate of getServicesCached()) {
      const container = findContainer(candidate, video);
      if (container) {
        return { site: candidate, container };
      }
    }

    return null;
  };

  const withRuntimeSiteUrl = (site: ServiceConf): ServiceConf => {
    const host = String(site.host);
    return host === "peertube" || host === "directlink"
      ? { ...site, url: globalThis.location.origin }
      : site;
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

      const match = getMatchedSiteAndContainer(video);
      if (!match) {
        return;
      }
      const { site, container } = match;

      const activeVideoForContainer = containerOwners.get(container);
      if (activeVideoForContainer && activeVideoForContainer !== video) {
        if (activeVideoForContainer.isConnected) {
          pendingVideoByContainer.set(container, video);
          return;
        }

        await releaseVideoHandler(activeVideoForContainer, "stale container");
        clearContainerOwner(activeVideoForContainer);
      }

      const videoHandler = createVideoHandler(
        video,
        container,
        withRuntimeSiteUrl(site),
      );
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
          await releaseVideoHandler(video, "init failed");
          const container = clearContainerOwner(video);
          clearPendingVideo(container);
          await promotePendingVideo(container);
        }
        console.error("[VOT] Failed to initialize videoHandler", err);
      }
    } finally {
      initializingVideos.delete(video);
    }
  };

  videoObserver.onVideoAdded.addListener(handleVideoAdded);

  videoObserver.onVideoRemoved.addListener(async (video) => {
    const container = clearContainerOwner(video);
    await releaseVideoHandler(video, "video removed");
    initializingVideos.delete(video);
    if (container && pendingVideoByContainer.get(container) === video) {
      clearPendingVideo(container);
    }
    await promotePendingVideo(container);
  });
}
