import { defineContentScript } from "wxt/utils/define-content-script";
import {
  getAllMatches,
  splitMatchesForOriginFallback,
} from "../../vite/lib/extension/manifest-helpers";
import { bootstrapExtensionPrelude } from "../extension/prelude/index";
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
  runAt: "document_start",
  world: "MAIN",
  main() {
    // Synchronous: GM globals must exist before MAIN-world scripts run.
    bootstrapExtensionPrelude();
  },
});
