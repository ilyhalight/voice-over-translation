import { defineContentScript } from "wxt/utils/define-content-script";

import headers from "../headers.json";
import { splitMatchesForOriginFallback } from "../../vite/lib/extension/manifest-helpers";

// Mirrors buildManifestChrome: origin-fallback group (path "/*").
// Direct-path matches need a second manifest entry without
// match_origin_as_fallback (added via a wxt.config.ts manifest hook).
const { originFallbackMatches } = splitMatchesForOriginFallback(
  headers.match ?? [],
);

export default defineContentScript({
  matches: originFallbackMatches,
  excludeMatches: headers.exclude ?? [],
  allFrames: true,
  matchAboutBlank: true,
  matchOriginAsFallback: true,
  runAt: "document_start",
  world: "ISOLATED",
  async main() {
    // Side-effect module; WXT inlines it into the content-script IIFE.
    await import("../extension/bridge/index");
  },
});
