import debug from "../utils/debug";
import { GM_fetch, isSupportGMXhr } from "../utils/gm";
import {
  type BuiltInSubtitleFontFamily,
  type GoogleSubtitleFontFamily,
  isBuiltInSubtitleFontFamily,
  type SubtitleFontFamily,
  subtitleFontFamilyCss,
} from "./types";

const GOOGLE_SUBTITLE_FONT_PREFIX = "google:";
const GOOGLE_FONTS_CSS_API_URL = "https://fonts.googleapis.com/css2";
const GOOGLE_FONTS_METADATA_URL = "https://fonts.google.com/metadata/fonts";

const subtitleGoogleFontFamilyNames = {
  roboto: "Roboto",
  "open-sans": "Open Sans",
  poppins: "Poppins",
  lato: "Lato",
  montserrat: "Montserrat",
  barlow: "Barlow",
} as const satisfies Partial<Record<BuiltInSubtitleFontFamily, string>>;

const loadedSubtitleGoogleFonts = new Set<SubtitleFontFamily>();
const pendingSubtitleGoogleFonts = new Map<SubtitleFontFamily, Promise<void>>();

let googleFontsCatalogPromise: null | Promise<string[]> = null;

type GoogleFontsMetadataResponse = {
  familyMetadataList?: Array<{
    family?: string;
  }>;
};

export function toGoogleSubtitleFontFamily(
  familyName: string,
): GoogleSubtitleFontFamily {
  return `${GOOGLE_SUBTITLE_FONT_PREFIX}${familyName}` as GoogleSubtitleFontFamily;
}

export function getGoogleSubtitleFontFamilyName(
  fontFamily: SubtitleFontFamily,
): null | string {
  if (fontFamily.startsWith(GOOGLE_SUBTITLE_FONT_PREFIX)) {
    const familyName = fontFamily
      .slice(GOOGLE_SUBTITLE_FONT_PREFIX.length)
      .trim();
    return familyName.length > 0 ? familyName : null;
  }

  return subtitleGoogleFontFamilyNames[fontFamily] ?? null;
}

export function getSubtitleFontFamilyCssValue(
  fontFamily: SubtitleFontFamily,
): string {
  if (isBuiltInSubtitleFontFamily(fontFamily)) {
    return subtitleFontFamilyCss[fontFamily];
  }

  const googleFontFamilyName = getGoogleSubtitleFontFamilyName(fontFamily);
  if (googleFontFamilyName) {
    return `"${googleFontFamilyName}", "Segoe UI", system-ui, sans-serif`;
  }

  return subtitleFontFamilyCss["default-sans"];
}

function buildGoogleFontsCssUrl(fontFamily: SubtitleFontFamily): null | string {
  const googleFontFamily = getGoogleSubtitleFontFamilyName(fontFamily);
  if (!googleFontFamily) {
    return null;
  }

  const familyQuery = googleFontFamily.trim().replaceAll(/\s+/g, "+");
  return `${GOOGLE_FONTS_CSS_API_URL}?family=${familyQuery}&display=swap`;
}

function injectFontStylesheet(
  fontFamily: SubtitleFontFamily,
  cssText: string,
): void {
  const styleId = `vot-google-font-${fontFamily}`;
  if (document.getElementById(styleId)) {
    return;
  }

  const gmAddStyle = (
    globalThis as {
      GM_addStyle?: (css: string) => HTMLElement | HTMLStyleElement;
    }
  ).GM_addStyle;
  const styleElement =
    typeof gmAddStyle === "function"
      ? gmAddStyle(cssText)
      : document.createElement("style");

  if (!(styleElement instanceof HTMLElement)) {
    return;
  }

  styleElement.id = styleId;
  if (!styleElement.textContent) {
    styleElement.textContent = cssText;
  }
  if (!styleElement.parentElement) {
    (document.head || document.documentElement).appendChild(styleElement);
  }
}

export async function ensureGoogleSubtitleFontLoaded(
  fontFamily: SubtitleFontFamily,
  options: {
    forceGmXhr?: boolean;
    onLoaded?: () => void;
  } = {},
): Promise<void> {
  if (loadedSubtitleGoogleFonts.has(fontFamily)) {
    return;
  }

  const existingLoad = pendingSubtitleGoogleFonts.get(fontFamily);
  if (existingLoad !== undefined) {
    await existingLoad;
    return;
  }

  const cssUrl = buildGoogleFontsCssUrl(fontFamily);
  if (!cssUrl) {
    loadedSubtitleGoogleFonts.add(fontFamily);
    return;
  }

  const googleFontFamily = getGoogleSubtitleFontFamilyName(fontFamily);
  const loadPromise = (async () => {
    try {
      const response = await GM_fetch(cssUrl, {
        timeout: 10_000,
        forceGmXhr: options.forceGmXhr ?? true,
        headers: {
          Accept: "text/css,*/*;q=0.1",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Google Fonts CSS request failed with ${response.status}`,
        );
      }

      const cssText = await response.text();
      if (!cssText.trim()) {
        throw new Error("Google Fonts CSS response is empty");
      }

      injectFontStylesheet(fontFamily, cssText);
      loadedSubtitleGoogleFonts.add(fontFamily);

      if (document.fonts && googleFontFamily) {
        await document.fonts.load(`500 20px "${googleFontFamily}"`);
      }

      options.onLoaded?.();
    } catch (error) {
      debug.log("Failed to load Google Font for subtitles", {
        fontFamily,
        error,
      });
    } finally {
      pendingSubtitleGoogleFonts.delete(fontFamily);
    }
  })();

  pendingSubtitleGoogleFonts.set(fontFamily, loadPromise);
  await loadPromise;
}

export async function loadGoogleFontsCatalog(): Promise<string[]> {
  if (googleFontsCatalogPromise !== null) {
    return await googleFontsCatalogPromise;
  }

  googleFontsCatalogPromise = (async () => {
    const response = await GM_fetch(GOOGLE_FONTS_METADATA_URL, {
      timeout: 15_000,
      forceGmXhr: isSupportGMXhr,
    });
    if (!response.ok) {
      throw new Error(
        `Google Fonts metadata request failed with ${response.status}`,
      );
    }

    const rawText = await response.text();
    const sanitizedText = rawText.replace(/^\)\]\}'\n?/, "");
    const payload = JSON.parse(sanitizedText) as GoogleFontsMetadataResponse;
    const fontFamilies = payload.familyMetadataList
      ?.map((entry) => entry.family?.trim() ?? "")
      .filter((familyName) => familyName.length > 0);

    return Array.from(new Set(fontFamilies)).sort((left, right) =>
      left.localeCompare(right),
    );
  })().catch((error) => {
    googleFontsCatalogPromise = null;
    debug.log("Failed to load Google Fonts catalog", error);
    return [];
  });

  return await googleFontsCatalogPromise;
}
