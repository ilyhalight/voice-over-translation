/**
 * Post-install patch: adds DataCamp (projector.datacamp.com) support
 * to the @vot.js/ext package.
 *
 * Run with: node patches/apply-datacamp.mjs
 * Called automatically via the "postinstall" npm script.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const extDist = path.join(root, "node_modules", "@vot.js", "ext", "dist");

function patchFile(relPath, patchFn) {
  const filePath = path.join(extDist, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[datacamp-patch] SKIP (not found): ${relPath}`);
    return;
  }
  const original = fs.readFileSync(filePath, "utf8");
  const patched = patchFn(original);
  if (patched !== original) {
    fs.writeFileSync(filePath, patched, "utf8");
    console.log(`[datacamp-patch] Patched: ${relPath}`);
  } else {
    console.log(`[datacamp-patch] Already patched or no change: ${relPath}`);
  }
}

// 1. Add "datacamp" to ExtVideoService enum
patchFile("types/service.js", (content) => {
  if (content.includes('"datacamp"')) return content;
  return content.replace(
    '    ExtVideoService["netacad"] = "netacad";',
    '    ExtVideoService["netacad"] = "netacad";\n    ExtVideoService["datacamp"] = "datacamp";'
  );
});

patchFile("types/service.d.ts", (content) => {
  if (content.includes("datacamp")) return content;
  return content.replace(
    '    netacad = "netacad"',
    '    netacad = "netacad",\n    datacamp = "datacamp"'
  );
});

// 2. Add DataCamp site config to sites.js
patchFile("data/sites.js", (content) => {
  if (content.includes("datacamp")) return content;
  const datacampEntry = `    {
        host: ExtVideoService.datacamp,
        url: "https://campus.datacamp.com/courses/",
        match: /^projector\\.datacamp\\.com$/,
        selector: ".video-player.js-player",
        needExtraData: true,
    },
`;
  return content.replace(
    "    {\n        host: CoreVideoService.custom,",
    datacampEntry + "    {\n        host: CoreVideoService.custom,"
  );
});

// 3. Create the DataCamp helper file
const datacampHelperPath = path.join(extDist, "helpers", "datacamp.js");
if (!fs.existsSync(datacampHelperPath)) {
  const helperCode = `import VideoJSHelper from "./videojs.js";
import Logger from "@vot.js/shared/utils/logger";
import { normalizeLang } from "@vot.js/shared/utils/utils";

export default class DataCampHelper extends VideoJSHelper {
    SUBTITLE_SOURCE = "datacamp";
    SUBTITLE_FORMAT = "vtt";

    getVideoDataFromInput() {
        try {
            const input = document.getElementById("videoData");
            if (!input || !input.value) {
                return null;
            }
            return JSON.parse(input.value);
        } catch (err) {
            Logger.error("Failed to parse DataCamp videoData input", err.message);
            return null;
        }
    }

    async getVideoData(videoId) {
        const meta = this.getVideoDataFromInput();
        if (meta) {
            const videoUrl =
                meta.plain_video_mp4_link ||
                meta.plain_video_hls_link ||
                meta.video_mp4_link ||
                meta.video_hls_link;

            if (videoUrl) {
                const subtitles = [];

                if (meta.subtitle_vtt_link) {
                    subtitles.push({
                        language: normalizeLang("en"),
                        source: this.SUBTITLE_SOURCE,
                        format: this.SUBTITLE_FORMAT,
                        url: meta.subtitle_vtt_link,
                    });
                }

                if (meta.audio_language_variants && typeof meta.audio_language_variants === "object") {
                    for (const [langCode, variant] of Object.entries(meta.audio_language_variants)) {
                        if (variant && variant.subtitle_vtt_link) {
                            subtitles.push({
                                language: normalizeLang(langCode.split("-")[0]),
                                source: this.SUBTITLE_SOURCE,
                                format: this.SUBTITLE_FORMAT,
                                url: variant.subtitle_vtt_link,
                            });
                        }
                    }
                }

                return {
                    url: videoUrl,
                    duration: undefined,
                    subtitles,
                };
            }
        }

        return this.getVideoDataByPlayer(videoId);
    }

    async getVideoId(url) {
        const key = url.searchParams.get("projector_key");
        if (key) {
            return key;
        }
        return url.pathname + url.search;
    }
}
`;
  fs.writeFileSync(datacampHelperPath, helperCode, "utf8");
  console.log("[datacamp-patch] Created: helpers/datacamp.js");
} else {
  console.log("[datacamp-patch] Already exists: helpers/datacamp.js");
}

// 4. Register in helpers/index.js
patchFile("helpers/index.js", (content) => {
  if (content.includes("DataCampHelper")) return content;

  // Add import
  content = content.replace(
    'import NetacadHelper from "./netacad.js";',
    'import NetacadHelper from "./netacad.js";\nimport DataCampHelper from "./datacamp.js";'
  );

  // Add named export
  content = content.replace(
    'export * as NetacadHelper from "./netacad.js";',
    'export * as NetacadHelper from "./netacad.js";\nexport * as DataCampHelper from "./datacamp.js";'
  );

  // Add to availableHelpers
  content = content.replace(
    "    [ExtVideoService.netacad]: NetacadHelper,",
    "    [ExtVideoService.netacad]: NetacadHelper,\n    [ExtVideoService.datacamp]: DataCampHelper,"
  );

  return content;
});

console.log("[datacamp-patch] Done!");
