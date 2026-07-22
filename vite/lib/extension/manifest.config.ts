import { defineManifest } from "@crxjs/vite-plugin";

import headers from "../../../src/headers.json";
import { getBuildConfig } from "../env";
import {
  buildManifestChrome,
  type ChromeManifestOptions,
  type ExtensionHeaders,
  type ManifestPathStrategy,
} from "./manifest-helpers";

const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";

const CHROME_EXTENSION_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3IITn/V9BfBfaSk1oNpgoUNADzm15zSyWJ/a+bSnp5SkGAziTle3efpSWFTzpfmUnN+LyQeuXsgGqLJ6N8BeXA4g/Gh+J3gcZAgeSOaWmI7zbaXKrAyUo6irOyXaXNr4z+EuH6hqxNd7N5gv/XjaE0fGd9brepbKUoImFa5GnBE/xT6hnLPjwMYYO0tYBi7Om1Z2+Em4SvwixIK42cGxt0v6RwcE3isJ9Yt3Hm28fndfwaN6UO9C5NTXrYrlO2ivDX5njhjnVUXTM4oyy0NifcibYl0e2Au2e5xDLq0R7EkfWuW4mF3xzQi3D+R1A3pqAnMUIWDKt5bu8BmlhGzc3wIDAQAB";

const extensionHeaders = headers as ExtensionHeaders;

const sourcePathStrategy: ManifestPathStrategy = {
  iconPathFn: (size) => `src/extension/icons/icon-${size}.png`,
  scriptPathFn: (distFileName) => {
    const sourceEntries: Record<string, string> = {
      "bridge.js": "src/extension/bridge.ts",
      "content.js": "src/index.ts",
      "prelude.js": "src/extension/prelude.iife.ts",
    };

    return sourceEntries[distFileName] ?? distFileName;
  },
  background: {
    service_worker: "src/extension/background.ts",
    type: "module",
  },
};

const chromeOptions: ChromeManifestOptions = {
  versionName: extensionHeaders.version,
};

const manifest = buildManifestChrome({
  headers: extensionHeaders,
  includeWorld: true,
  pathStrategy: sourcePathStrategy,
  chromeOptions,
}) as Record<string, unknown>;

export default defineManifest(({ mode }) => {
  const BUILD_COFNIG = getBuildConfig(mode);

  const updateManifest = BUILD_COFNIG.IS_STORE_BUILD
    ? {}
    : {
        update_url: `${GITHUB_DIST_EXT_RAW_BASE}/update.xml`,
        key: CHROME_EXTENSION_KEY,
      };

  return {
    ...manifest,
    ...updateManifest,
  } as Parameters<typeof defineManifest>[0];
});
