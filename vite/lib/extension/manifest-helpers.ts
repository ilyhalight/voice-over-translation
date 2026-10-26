/**
 * Pure manifest-building helpers shared between:
 * - wxt.config.ts (manifest fields WXT does not derive from entrypoints)
 * - src/entrypoints/*.content.ts (origin-fallback match splitting)
 *
 * No fs/build dependencies — only string/array transforms.
 */

export const EXTENSION_ICON_SIZES = [16, 32, 48, 64, 96, 128, 256] as const;

const DEFAULT_EXTENSION_NAME = "Voice Over Translation";
const DEFAULT_EXTENSION_DESCRIPTION = "Voice Over Translation";
const DEFAULT_EXTENSION_VERSION = "0.0.0";
const EXTENSION_WEB_ACCESSIBLE_JS_GLOBS = ["*.js"] as const;

export interface ExtensionHeaders {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  match?: string[];
  exclude?: string[];
  connect?: string[];
}

// ----------------------------------------------------------------
// Host permissions
// ----------------------------------------------------------------

function normalizeHostPermission(
  entry: string | undefined | null,
): string | null {
  if (!entry) return null;
  const value = String(entry).trim();
  if (!value) return null;
  if (value === "<all_urls>") return value;

  if (/^[a-z*]+:\/\//i.test(value)) {
    if (/^[a-z*]+:\/\/[^/]+\/?$/i.test(value)) {
      return `${value.replace(/\/?$/, "")}/*`;
    }
    return value;
  }

  return `*://*.${value}/*`;
}

function normalizeHostPermissions(list: string[] = []): string[] {
  const normalized = list
    .map((item) => normalizeHostPermission(item))
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)];
}

// ----------------------------------------------------------------
// Web-accessible resources
// ----------------------------------------------------------------

function normalizeWebAccessibleResourceMatch(
  pattern: string | undefined | null,
): string | null {
  if (!pattern) return null;
  const value = String(pattern).trim();
  if (!value) return null;
  if (value === "<all_urls>") {
    return "*://*/*";
  }

  const match = /^([^:]+:\/\/[^/]+)(\/.*)?$/.exec(value);
  if (!match) {
    return null;
  }

  return `${match[1]}/*`;
}

function normalizeWebAccessibleResourceMatches(
  matches: string[] = [],
): string[] {
  return [
    ...new Set(
      matches
        .map((pattern) => normalizeWebAccessibleResourceMatch(pattern))
        .filter((pattern): pattern is string => Boolean(pattern)),
    ),
  ];
}

function createWebAccessibleResources(
  matches: string[],
): Array<Record<string, unknown>> {
  const normalizedMatches = normalizeWebAccessibleResourceMatches(matches);
  if (!normalizedMatches.length) {
    return [];
  }

  return [
    {
      resources: [...EXTENSION_WEB_ACCESSIBLE_JS_GLOBS],
      matches: normalizedMatches,
    },
  ];
}

// ----------------------------------------------------------------
// Match splitting (origin-fallback vs direct)
// ----------------------------------------------------------------

export function splitMatchesForOriginFallback(matches: string[] = []): {
  originFallbackMatches: string[];
  directMatches: string[];
} {
  const originFallbackMatches: string[] = [];
  const directMatches: string[] = [];

  const getPath = (pattern: string): string | null => {
    if (pattern === "<all_urls>") return "/*";
    const result = /^[^:]+:\/\/[^/]+(\/.*)$/.exec(pattern);
    return result ? result[1] : null;
  };

  for (const match of matches) {
    const pathPart = getPath(String(match));
    if (pathPart === "/*") originFallbackMatches.push(String(match));
    else directMatches.push(String(match));
  }

  return { originFallbackMatches, directMatches };
}

// ----------------------------------------------------------------
// Dev-mode matches
// ----------------------------------------------------------------

/** Direct video/stream file extensions matched in dev (`*://*\/*.<ext>*`). */
export const DEV_DIRECT_VIDEO_EXTENSIONS = [
  "mp4",
  "m4v",
  "webm",
  "mkv",
  "mov",
  "ogv",
  "avi",
  "flv",
  "3gp",
  "m3u8",
  "mpd",
] as const;

/** Extra platforms forced in dev (whole-site, not only path-specific). */
export const DEV_EXTRA_SITE_MATCHES = ["*://*.udemy.com/*"] as const;

/**
 * Full content-script match list for `wxt` dev: every production match
 * (origin-fallback + path-specific) + direct video files + extra platforms.
 */
export function getDevContentScriptMatches(matches: string[] = []): string[] {
  return [
    ...new Set([
      ...matches.map(String),
      ...DEV_EXTRA_SITE_MATCHES,
      ...DEV_DIRECT_VIDEO_EXTENSIONS.map((ext) => `*://*/*.${ext}*`),
    ]),
  ];
}

// ----------------------------------------------------------------
// Manifest
// ----------------------------------------------------------------

export const iconPathFn = (size: number) => `icons/icon-${size}.png`;

export function buildExtensionManifest({
  headers,
  versionName,
}: {
  headers: ExtensionHeaders;
  versionName?: string;
}) {
  const name = headers.name || DEFAULT_EXTENSION_NAME;
  const description = headers.description || DEFAULT_EXTENSION_DESCRIPTION;
  const version = headers.version || DEFAULT_EXTENSION_VERSION;
  const matches = headers.match || [];
  const hostPermissions = normalizeHostPermissions(headers.connect || []);
  const iconSizes16and32 = [16, 32];
  const war = createWebAccessibleResources(matches);

  return {
    name,
    description,
    version,
    ...(versionName && { version_name: versionName }),
    action: {
      default_title: name,
      default_icon: Object.fromEntries<string>(
        iconSizes16and32.map((size) => [size, iconPathFn(size)]),
      ),
    },
    permissions: [
      "storage",
      "notifications",
      "activeTab",
      "declarativeNetRequestWithHostAccess",
      "scripting",
    ],
    host_permissions: hostPermissions,
    icons: Object.fromEntries(
      EXTENSION_ICON_SIZES.map((size) => [size, iconPathFn(size)]),
    ),
    web_accessible_resources: war,
  };
}
