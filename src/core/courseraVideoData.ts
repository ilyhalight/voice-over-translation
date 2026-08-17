import CourseraHelper from "@vot.js/ext/helpers/coursera";
import type { ServiceConf } from "@vot.js/ext/types/service";
import {
  getVideoData,
  getVideoID,
} from "@vot.js/ext/utils/videoData";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import {
  getCourseraCourseSlugFromPath,
  getCourseraVideoIdFromPath,
} from "./courseraSupport";

type SiteVideoData = Awaited<ReturnType<typeof getVideoData>>;

type HelperPrototype = {
  getVideoId: (url: URL) => Promise<string | undefined>;
  getCourseSlug: () => string | undefined;
};

let courseraHelperPatched = false;

/**
 * Keep vot.js helper methods in sync when the same class instance is used
 * internally by `getVideoID` / `getVideoData`.
 */
export function applyCourseraHelperPatch(): void {
  if (courseraHelperPatched) {
    return;
  }
  courseraHelperPatched = true;

  const proto = CourseraHelper.prototype as unknown as HelperPrototype;
  proto.getVideoId = async (url) => getCourseraVideoIdFromPath(url.pathname);
  proto.getCourseSlug = () =>
    getCourseraCourseSlugFromPath(globalThis.location.pathname);
}

applyCourseraHelperPatch();

export async function getCourseraExtraVideoData(
  service: ServiceConf,
  opts: {
    fetchFn?: typeof GM_fetch;
    video?: HTMLVideoElement;
    language?: string;
  },
): Promise<SiteVideoData | undefined> {
  const videoId = getCourseraVideoIdFromPath(globalThis.location.pathname);
  if (!videoId) {
    return undefined;
  }

  const helper = new CourseraHelper({
    ...opts,
    service,
    origin: globalThis.location.origin,
  });
  helper.getCourseSlug = () =>
    getCourseraCourseSlugFromPath(globalThis.location.pathname);

  const result = await helper.getVideoData(videoId);
  if (!result?.url) {
    debug.log("[VOT] Coursera helper returned no video url", { videoId });
    return undefined;
  }

  debug.log("[VOT] Resolved Coursera video data", {
    videoId,
    hasTranslationHelp: Boolean(result.translationHelp?.length),
  });

  return {
    ...result,
    url: result.url,
    videoId,
    host: service.host,
  } as SiteVideoData;
}

export async function resolveSiteVideoId(
  site: ServiceConf,
  video: HTMLVideoElement,
): Promise<string | undefined> {
  if (site.host === "coursera") {
    const videoId = getCourseraVideoIdFromPath(globalThis.location.pathname);
    if (videoId) {
      return videoId;
    }
  }

  return getVideoID(site, { fetchFn: GM_fetch, video });
}

export async function fetchSiteVideoData(
  site: ServiceConf,
  opts: {
    fetchFn?: typeof GM_fetch;
    video?: HTMLVideoElement;
    language?: string;
  },
): Promise<SiteVideoData> {
  if (site.host === "coursera") {
    const courseraData = await getCourseraExtraVideoData(site, opts);
    if (courseraData) {
      return courseraData;
    }
  }

  return getVideoData(site, opts);
}
