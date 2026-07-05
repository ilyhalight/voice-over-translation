import {
  sitesCoursehunterLike,
  sitesInvidious,
  sitesPeertube,
  sitesPiped,
  sitesProxiTok,
} from "@vot.js/shared/alternativeUrls";

let cachedAltMatchPatterns: string[] | null = null;

export function getAltMatchPatterns(): string[] {
  if (cachedAltMatchPatterns) return cachedAltMatchPatterns;

  cachedAltMatchPatterns = [
    sitesInvidious,
    sitesPiped,
    sitesProxiTok,
    sitesPeertube,
    sitesCoursehunterLike,
  ].flatMap((sites) =>
    sites.map((site) => {
      const dotCount = site.match(/\./g)?.length ?? 0;
      const isSubdomain = dotCount > 1;
      return `*://${isSubdomain ? "" : "*."}${site}/*`;
    }),
  );

  return cachedAltMatchPatterns;
}
