import type { ServiceConf } from "@vot.js/ext/types/service";
import { getVideoID } from "@vot.js/ext/utils/videoData";
import { GM_fetch } from "../utils/gm";
import type { VideoObserver } from "../utils/VideoObserver";

type VideoHandlerLike = {
  init(): Promise<void>;
  setCanPlay(): Promise<void>;
  getVideoData(): Promise<unknown>;
  hasActiveSource(): boolean;
  replaceVideo(video: HTMLVideoElement): Promise<void>;
  site: ServiceConf;
  videoData?: { videoId?: string };
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
  resolveVideoId?: (
    site: ServiceConf,
    video: HTMLVideoElement,
  ) => Promise<string | undefined>;
};

type SiteContainerMatch = {
  site: ServiceConf;
  container: HTMLElement;
};

const boundObservers = new WeakSet<VideoObserver>();
const RUNTIME_URL_HOSTS = new Set(["peertube", "directlink"]);

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
    resolveVideoId = (site, video) =>
      getVideoID(site, { fetchFn: GM_fetch, video }),
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
      if (videosWrappers.get(video) === videoHandler) {
        videosWrappers.delete(video);
      }
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
    return RUNTIME_URL_HOSTS.has(String(site.host))
      ? { ...site, url: globalThis.location.origin }
      : site;
  };

  const tryReplaceVideo = async (
    oldVideo: HTMLVideoElement,
    newVideo: HTMLVideoElement,
    container: HTMLElement,
  ): Promise<boolean> => {
    const videoHandler = videosWrappers.get(oldVideo);
    const previousVideoId = videoHandler?.videoData?.videoId;
    if (!videoHandler?.hasActiveSource() || !previousVideoId) {
      return false;
    }

    try {
      const nextVideoId = await resolveVideoId(videoHandler.site, newVideo);
      if (nextVideoId !== previousVideoId) return false;
      await videoHandler.replaceVideo(newVideo);
    } catch (error) {
      console.error("[VOT] Failed to replace video element", error);
      return false;
    }

    if (videosWrappers.get(oldVideo) !== videoHandler) {
      return videosWrappers.get(newVideo) === videoHandler;
    }
    videosWrappers.delete(oldVideo);
    videoContainers.delete(oldVideo);
    videosWrappers.set(newVideo, videoHandler);
    videoContainers.set(newVideo, container);
    containerOwners.set(container, newVideo);
    return true;
  };

  const promotePendingVideo = async (
    container?: HTMLElement,
  ): Promise<void> => {
    const pendingVideo = container && pendingVideoByContainer.get(container);
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
      const runtimeReady = await ensureRuntimeReady();
      if (!runtimeReady) return;

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

        if (await tryReplaceVideo(activeVideoForContainer, video, container)) {
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
          if (container) {
            pendingVideoByContainer.delete(container);
          }
          await promotePendingVideo(container);
        }
        console.error("[VOT] Failed to initialize videoHandler", err);
      }
    } finally {
      initializingVideos.delete(video);
    }
  };

  const ensureRuntimeReady = async (): Promise<boolean> => {
    try {
      await ensureRuntimeActivated("video-detected");
      return true;
    } catch (err) {
      console.error("[VOT] Failed to activate runtime", err);
      return false;
    }
  };

  videoObserver.onVideoAdded.addListener(handleVideoAdded);

  videoObserver.onVideoRemoved.addListener(async (video) => {
    const container = videoContainers.get(video);
    const replacement =
      container &&
      Array.from(container.querySelectorAll("video")).find(
        (candidate) => candidate !== video && candidate.isConnected,
      );
    if (
      container &&
      replacement &&
      (await tryReplaceVideo(video, replacement, container))
    ) {
      initializingVideos.delete(video);
      return;
    }

    clearContainerOwner(video);
    await releaseVideoHandler(video, "video removed");
    initializingVideos.delete(video);
    if (container && pendingVideoByContainer.get(container) === video) {
      pendingVideoByContainer.delete(container);
    }
    await promotePendingVideo(container);
  });
}
