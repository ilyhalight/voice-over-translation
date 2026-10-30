import { defineContentScript } from "wxt/utils/define-content-script";
import {
  getAllMatches,
  splitMatchesForOriginFallback,
} from "../../vite/lib/extension/manifest-helpers";
import headers from "../headers.json";

// Path-specific matches are added in wxt.config.ts (build:manifestGenerated)
// because Chrome rejects them with match_origin_as_fallback.
const { originFallbackMatches } = splitMatchesForOriginFallback(
  getAllMatches(headers),
);

export default defineContentScript({
  matches: originFallbackMatches,
  excludeMatches: headers.exclude ?? [],
  allFrames: true,
  matchAboutBlank: true,
  matchOriginAsFallback: true,
  runAt: "document_end",
  world: "MAIN",
  async main() {
    // src/index.ts self-bootstraps on evaluation.
    await import("../index");
  },
});
