import Bowser from "bowser";
import { ID3Writer } from "browser-id3-writer";

import { availableTTS } from "@vot.js/shared/consts";

import { nonProxyExtensions } from "../config/config.js";
import { localizationProvider } from "../localization/localizationProvider.ts";
import debug from "./debug.ts";

const userlang = navigator.language || navigator.userLanguage;
const MAX_SECS_FRACTION = 0.66;
const textFilters =
  /(?:https?|www|\bhttp\s+)[^\s/]*?(?:\.\s*[a-z]{2,}|\/)\S*|#[^\s#]+|auto-generated\s+by\s+youtube|provided\s+to\s+youtube\s+by|released\s+on|paypal?|0x[\da-f]{40}|[13][1-9a-z]{25,34}|4[\dab][1-9a-z]{93}|t[1-9a-z]{33}/gi;
const slavicLangs = [
  "uk",
  "be",
  "bg",
  "mk",
  "sr",
  "bs",
  "hr",
  "sl",
  "pl",
  "sk",
  "cs",
];
export const lang = userlang?.substring(0, 2).toLowerCase() || "en";
export const calculatedResLang = (() => {
  if (availableTTS.includes(lang)) {
    return lang;
  }

  if (slavicLangs.includes(lang)) {
    return "ru";
  }

  return "en";
})();
export const browserInfo = Bowser.getParser(
  window.navigator.userAgent,
).getResult();
export const isProxyOnlyExtension =
  GM_info?.scriptHandler && !nonProxyExtensions.includes(GM_info.scriptHandler);
export const isSupportGM4 = typeof GM !== "undefined";
export const isUnsafeWindowAllowed = typeof unsafeWindow !== "undefined";
export const isSupportGMXhr = typeof GM_xmlhttpRequest !== "undefined";

function secsToStrTime(secs) {
  let minutes = Math.floor(secs / 60);
  let seconds = Math.floor(secs % 60);
  const fraction = seconds / 60;
  if (fraction >= MAX_SECS_FRACTION) {
    // rounding to the next minute if it has already been more than N%
    // e.g. 100 -> 2 minutes
    minutes += 1;
    seconds = 0;
  }

  if (minutes >= 60) {
    return localizationProvider.get("translationTakeMoreThanHour");
  } else if (minutes === 1 || (minutes === 0 && seconds > 0)) {
    return localizationProvider.get("translationTakeAboutMinute");
  } else if (minutes !== 11 && minutes % 10 === 1) {
    return localizationProvider
      .get("translationTakeApproximatelyMinute2")
      .replace("{0}", minutes);
  } else if (
    ![12, 13, 14].includes(minutes) &&
    [2, 3, 4].includes(minutes % 10)
  ) {
    return localizationProvider
      .get("translationTakeApproximatelyMinute")
      .replace("{0}", minutes);
  }

  return localizationProvider
    .get("translationTakeApproximatelyMinutes")
    .replace("{0}", minutes);
}

function isPiPAvailable() {
  return (
    "pictureInPictureEnabled" in document && document.pictureInPictureEnabled
  );
}

function initHls() {
  return typeof Hls != "undefined" && Hls?.isSupported()
    ? new Hls({
        debug: DEBUG_MODE, // turn it on manually if necessary
        lowLatencyMode: true,
        backBufferLength: 90,
      })
    : undefined;
}

function cleanText(title, description) {
  return (title + " " + (description || ""))
    .replace(textFilters, "")
    .replace(/[^\p{L}]+/gu, " ")
    .substring(0, 450)
    .trim();
}
/**
 * Download binary file with entered filename
 *
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
/**
 * @param {string} filename
 * @return {string}
 */
function clearFileName(filename) {
  if (filename.trim().length === 0) {
    // generate a new filename
    return new Date().toLocaleDateString("en-us").replaceAll("/", "-");
  }

  return filename.replace(/^https?:\/\//, "").replace(/[\\/:*?"'<>|.]/g, "-");
}

async function GM_fetch(url, opts = {}) {
  const { timeout = 15000, ...fetchOptions } = opts;
  const controller = new AbortController();

  try {
    if (url.includes("api.browser.yandex.ru")) {
      throw new Error("Preventing yandex cors");
    }
    return await fetch(url, {
      signal: controller.signal,
      ...fetchOptions,
    });
  } catch (err) {
    // Если fetch завершился ошибкой, используем GM_xmlhttpRequest
    // https://greasyfork.org/ru/scripts/421384-gm-fetch/code
    debug.log("GM_fetch preventing CORS by GM_xmlhttpRequest", err.message);

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: fetchOptions.method || "GET",
        url,
        responseType: "blob",
        data: fetchOptions.body,
        timeout,
        headers: fetchOptions.headers || {},
        onload: (resp) => {
          const headers = resp.responseHeaders
            .split(/\r?\n/)
            .reduce((acc, line) => {
              const [, key, value] = line.match(/^([\w-]+): (.+)$/) || [];
              if (key) {
                acc[key] = value;
              }
              return acc;
            }, {});

          const response = new Response(resp.response, {
            status: resp.status,
            headers: headers,
          });
          // Response have empty url by default (readonly)
          // this need to get same response url as in classic fetch
          Object.defineProperty(response, "url", {
            value: resp.finalUrl ?? "",
          });

          resolve(response);
        },
        ontimeout: () => reject(new Error("Timeout")),
        onerror: (error) => reject(new Error(error)),
        onabort: () => reject(new Error("AbortError")),
      });
    });
  }
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function toFlatObj(data) {
  return Object.entries(data).reduce((result, [key, val]) => {
    if (val === undefined) {
      return result;
    }

    if (typeof val !== "object") {
      result[key] = val;
      return result;
    }

    const nestedItem = Object.entries(toFlatObj(data[key])).reduce(
      (res, [k, v]) => {
        res[`${key}.${k}`] = v;
        return res;
      },
      {},
    );
    return {
      ...result,
      ...nestedItem,
    };
  }, {});
}

async function exitFullscreen() {
  /**
   * TODO: after rewrite to typescript
    export interface DocumentWithFullscreen extends Document {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    }

    const doc = document as DocumentWithFullscreen;
   */
  const doc = document;
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    doc.webkitExitFullscreen && (await doc.webkitExitFullscreen());
    doc.exitFullscreen && (await doc.exitFullscreen());
  }
}

// TODO: for ts:
// const sleep = (ms: number): Promise<void> =>
//   new Promise((resolve) => window.setTimeout(resolve, ms));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO: for ts: function timeout(ms: number, message = "Operation timed out"): Promise<never> {
function timeout(ms, message = "Operation timed out") {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

// TODO: for ts:
// async function waitForCondition(
//   condition: () => boolean,
//   timeoutMs: number,
//   throwOnTimeout = false): Promise<void>
async function waitForCondition(condition, timeoutMs, throwOnTimeout = false) {
  let timedOut = false;

  return Promise.race([
    (async () => {
      while (!condition() && !timedOut) {
        await sleep(100);
      }
    })(),
    // new Promise<void>((resolve, reject) => {
    new Promise((resolve, reject) => {
      window.setTimeout(() => {
        timedOut = true;
        if (throwOnTimeout) {
          reject(
            new Error(`Wait for condition reached timeout of ${timeoutMs}`),
          );
        } else {
          resolve();
        }
      }, timeoutMs);
    }),
  ]);
}

/**
 * Downloads a translation file with progress tracking.
 *
 * @param {Response} res - The response object from a fetch request
 * @param {number} contentLength - value of Content-Length header > 0
 * @param {function(number): void} [onProgress] - Optional callback function to handle progress updates.
 *                                                Receives the download progress as a percentage (0-100)
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the downloaded file as an ArrayBuffer
 */
async function _downloadTranslationWithProgress(
  res,
  contentLength,
  onProgress = () => {},
) {
  const reader = res.body.getReader();
  const chunksBuffer = new Uint8Array(contentLength);
  let offset = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    chunksBuffer.set(value, offset);
    offset += value.length;
    onProgress(Math.round((offset / contentLength) * 100));
  }

  return chunksBuffer.buffer;
}

/**
 * Downloads a translation file and saves it as an MP3 file with metadata, if possible tracking progress.
 *
 * @param {Response} res - The response object from a fetch request
 * @param {string} filename - The name to assign to the downloaded file (without extension).
 * @param {function(number): void} [onProgress] - Optional callback function to track download progress.
 *        Receives a percentage (0 to 100) as its argument
 * @returns {Promise<boolean>} - Resolves to `true` when the download completed.
 */
async function downloadTranslation(res, filename, onProgress = () => {}) {
  const contentLength = +res.headers.get("Content-Length");
  const arrayBuffer = await (!contentLength
    ? res.arrayBuffer()
    : _downloadTranslationWithProgress(res, contentLength, onProgress));
  onProgress(100);
  const writer = new ID3Writer(arrayBuffer);
  writer.setFrame("TIT2", filename);
  writer.addTag();
  downloadBlob(writer.getBlob(), `${filename}.mp3`);
  return true;
}

function openDownloadTranslation(url) {
  window.open(url, "_blank")?.focus();
}

export {
  secsToStrTime,
  isPiPAvailable,
  initHls,
  cleanText,
  downloadBlob,
  clearFileName,
  GM_fetch,
  getTimestamp,
  clamp,
  toFlatObj,
  exitFullscreen,
  sleep,
  timeout,
  waitForCondition,
  downloadTranslation,
  openDownloadTranslation,
};
