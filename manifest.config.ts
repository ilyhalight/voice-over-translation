import { defineManifest } from "@crxjs/vite-plugin";

import headers from "./src/headers.json";
import {
  buildManifestChrome,
  type ChromeManifestOptions,
  type ExtensionHeaders,
  type ManifestPathStrategy,
} from "./vite/vite.extension.manifest-helpers";

const typedHeaders = headers as unknown as ExtensionHeaders;

// CRXJS resolves from source (src/) paths, not dist output paths.
// pathStrategy overrides the default dist-oriented path generation
// so buildManifestChrome produces src paths directly.
const srcPathStrategy: ManifestPathStrategy = {
  iconPathFn: (size) => `src/extension/icons/icon-${size}.png`,
  scriptPathFn: (distJs) => {
    const srcMap: Record<string, string> = {
      "bridge.js": "src/extension/bridge.ts",
      "prelude.js": "src/extension/prelude.iife.ts",
      "content.js": "src/index.ts",
    };
    return srcMap[distJs] ?? distJs;
  },
  background: {
    service_worker: "src/extension/background.ts",
    type: "module",
  },
};

const chromeOptions: ChromeManifestOptions = {
  versionName: typedHeaders.version,
};

// Build full Chrome manifest directly with source paths
const manifest = buildManifestChrome({
  headers: typedHeaders,
  includeWorld: true,
  pathStrategy: srcPathStrategy,
  chromeOptions,
}) as Parameters<typeof defineManifest>[0];

// Chrome side-load auto-update (not used for Chrome Web Store distribution)
const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";
manifest.update_url = `${GITHUB_DIST_EXT_RAW_BASE}/update.xml`;

// Public key for consistent extension ID (derived from keys/chrome-crx.pem)
// Chrome calculates ID as first 32 chars of SHA256(publicKey), a-p mapped
manifest.key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3IITn/V9BfBfaSk1oNpgoUNADzm15zSyWJ/a+bSnp5SkGAziTle3efpSWFTzpfmUnN+LyQeuXsgGqLJ6N8BeXA4g/Gh+J3gcZAgeSOaWmI7zbaXKrAyUo6irOyXaXNr4z+EuH6hqxNd7N5gv/XjaE0fGd9brepbKUoImFa5GnBE/xT6hnLPjwMYYO0tYBi7Om1Z2+Em4SvwixIK42cGxt0v6RwcE3isJ9Yt3Hm28fndfwaN6UO9C5NTXrYrlO2ivDX5njhjnVUXTM4oyy0NifcibYl0e2Au2e5xDLq0R7EkfWuW4mF3xzQi3D+R1A3pqAnMUIWDKt5bu8BmlhGzc3wIDAQAB";

export default defineManifest(manifest);
