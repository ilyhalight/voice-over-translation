import { youtubeUtils } from "./utils/youtubeUtils.js";
import { sleep } from "./utils/utils.js";
import { yandexProtobuf } from "./yandexProtobuf.js";
import { siteTranslates } from "./config/constants.js";
import { lang } from "./menu.js";
import requestVideoSubtitles from "./rvs.js";
import debug from "./utils/debug.js";

function formatYandexSubtitlesTokens(line) {
  const lineEndMs = line.startMs + line.durationMs;
  return line.tokens.reduce((result, token, index) => {
    const nextToken = line.tokens[index + 1];
    const lastToken = result[result.length - 1];
    const alignRangeEnd = lastToken?.alignRange?.end ?? 0;
    const newAlignRangeEnd = alignRangeEnd + token.text.length;
    result.push(
      Object.assign(Object.assign({}, token), {
        alignRange: {
          start: alignRangeEnd,
          end: newAlignRangeEnd,
        },
      })
    );
    if (nextToken) {
      const endMs = token.startMs + token.durationMs;
      const durationMs = nextToken.startMs
        ? nextToken.startMs - endMs
        : lineEndMs - endMs;
      result.push({
        text: " ",
        startMs: endMs,
        durationMs,
        alignRange: {
          start: newAlignRangeEnd,
          end: newAlignRangeEnd + 1,
        },
      });
    }
    return result;
  }, []);
}

function createSubtitlesTokens(line, previousLineLastToken) {
  const tokens = line.text
    .split(new RegExp("([\n \t])"))
    .reduce((result, tokenText) => {
      if (tokenText.length) {
        const lastToken = result[result.length - 1] ?? previousLineLastToken;
        const alignRangeStart = lastToken?.alignRange?.end ?? 0;
        const alignRangeEnd = alignRangeStart + tokenText.length;
        result.push({
          text: tokenText,
          alignRange: {
            start: alignRangeStart,
            end: alignRangeEnd,
          },
        });
      }
      return result;
    }, []);
  const tokenDurationMs = Math.floor(line.durationMs / tokens.length);
  const lineEndMs = line.startMs + line.durationMs;
  return tokens.map((token, index) => {
    const isLastToken = index === tokens.length - 1;
    const startMs = line.startMs + tokenDurationMs * index;
    const durationMs = isLastToken ? lineEndMs - startMs : tokenDurationMs;
    return Object.assign(Object.assign({}, token), {
      startMs,
      durationMs,
    });
  });
}

function getSubtitlesTokens(subtitles, source) {
  const result = [];
  let lastToken;
  for (const line of subtitles.subtitles) {
    let tokens;
    if (line?.tokens?.length) {
      if (source === "yandex") {
        tokens = formatYandexSubtitlesTokens(line);
      } else {
        console.warn("[VOT] Unsupported subtitles tokens type: ", source);
        subtitles.containsTokens = false;
        return null;
      }
    } else {
      tokens = createSubtitlesTokens(line, lastToken);
    }
    lastToken = tokens[tokens.length - 1];
    result.push(
      Object.assign(Object.assign({}, line), {
        tokens,
      })
    );
  }
  subtitles.containsTokens = true;
  return result;
}

function formatYoutubeSubtitles(subtitles) {
  const result = {
    containsTokens: false,
    subtitles: [],
  };
  if (
    typeof subtitles !== "object" ||
    !("events" in subtitles) ||
    !Array.isArray(subtitles.events)
  ) {
    console.error("[VOT] Failed to format youtube subtitles", subtitles);
    return result;
  }
  for (let i = 0; i < subtitles.events.length; i++) {
    if (!subtitles.events[i].segs) continue;
    const text = subtitles.events[i].segs
      .map((e) => e.utf8.replace(/^ +| +$/g, ""))
      .join(" ");
    let durationMs = subtitles.events[i].dDurationMs;
    if (
      subtitles.events[i + 1] &&
      subtitles.events[i].tStartMs + subtitles.events[i].dDurationMs >
        subtitles.events[i + 1].tStartMs
    ) {
      durationMs =
        subtitles.events[i + 1].tStartMs - subtitles.events[i].tStartMs;
    }
    if (text !== "\n") {
      result.subtitles.push({
        text,
        startMs: subtitles.events[i].tStartMs,
        durationMs,
      });
    }
  }
  return result;
}

export async function fetchSubtitles(subtitlesObject) {
  document.querySelector(".subtitlesDownload").href = subtitlesObject.url
  let resolved = false;
  let subtitles = await Promise.race([
    new Promise(async (resolve) => {
      await sleep(5000);
      if (!resolved) {
        console.error("[VOT] Failed to fetch subtitles. Reason: timeout");
      }
      resolved = true;
      resolve([]);
    }),
    new Promise(async (resolve) => {
      debug.log("Fetching subtitles:", subtitlesObject);
      await fetch(subtitlesObject.url)
        .then((response) => response.json())
        .then((json) => {
          resolved = true;
          resolve(json);
        })
        .catch((error) => {
          console.error("[VOT] Failed to fetch subtitles. Reason:", error);
          resolved = true;
          resolve({
            containsTokens: false,
            subtitles: [],
          });
        });
    }),
  ]);
  if (subtitlesObject.source === "youtube") {
    subtitles = formatYoutubeSubtitles(subtitles);
  }
  subtitles.subtitles = getSubtitlesTokens(subtitles, subtitlesObject.source);
  console.log("[VOT] subtitles:", subtitles);
  return subtitles;
}

export async function getSubtitles(siteHostname, videoId, requestLang) {
  const ytSubtitles =
    siteHostname === "youtube" ? youtubeUtils.getSubtitles() : [];
  let resolved = false;
  const yaSubtitles = await Promise.race([
    new Promise(async (resolve) => {
      await sleep(5000);
      if (!resolved) {
        console.error("[VOT] Failed get yandex subtitles. Reason: timeout");
      }
      resolved = true;
      resolve([]);
    }),
    new Promise((resolve) => {
      requestVideoSubtitles(
        `${siteTranslates[siteHostname]}${videoId}`,
        requestLang,
        (success, response) => {
          debug.log("[exec callback] Requesting video subtitles");

          if (!success) {
            console.error("[VOT] Failed get yandex subtitles");
            resolved = true;
            resolve([]);
          }

          const subtitlesResponse =
            yandexProtobuf.decodeSubtitlesResponse(response);
          console.log("[VOT] Subtitles response: ", subtitlesResponse);

          let subtitles = subtitlesResponse.subtitles ?? [];
          subtitles = subtitles.reduce((result, yaSubtitlesObject) => {
            if (
              yaSubtitlesObject.language &&
              !result.find((e) => {
                if (
                  e.source === "yandex" &&
                  e.language === yaSubtitlesObject.language &&
                  !e.translatedFromLanguage
                ) {
                  return e;
                }
              })
            ) {
              result.push({
                source: "yandex",
                language: yaSubtitlesObject.language,
                url: yaSubtitlesObject.url,
              });
            }
            if (yaSubtitlesObject.translatedLanguage) {
              result.push({
                source: "yandex",
                language: yaSubtitlesObject.translatedLanguage,
                translatedFromLanguage: yaSubtitlesObject.language,
                url: yaSubtitlesObject.translatedUrl,
              });
            }
            return result;
          }, []);
          resolved = true;
          resolve(subtitles);
        }
      );
    }),
  ]);
  const subtitles = [...yaSubtitles, ...ytSubtitles].sort((a, b) => {
    if (a.source !== b.source) {
      // sort by source
      return a.source === "yandex" ? -1 : 1;
    }
    if (
      a.language !== b.language &&
      (a.language === lang || b.language === lang)
    ) {
      // sort by user language
      return a.language === lang ? -1 : 1;
    }
    if (a.source === "yandex") {
      // sort by translation
      if (a.translatedFromLanguage !== b.translatedFromLanguage) {
        // sort by translatedFromLanguage
        if (!a.translatedFromLanguage || !b.translatedFromLanguage) {
          // sort by isTranslated
          if (a.language === b.language) {
            return a.translatedFromLanguage ? 1 : -1;
          }
          return !a.translatedFromLanguage ? 1 : -1;
        }
        return a.translatedFromLanguage === requestLang ? -1 : 1;
      }
      if (!a.translatedFromLanguage) {
        // sort non translated by language
        return a.language === requestLang ? -1 : 1;
      }
    }
    if (a.source === "youtube" && a.isAutoGenerated !== b.isAutoGenerated) {
      // sort by isAutoGenerated
      return a.isAutoGenerated ? 1 : -1;
    }
    return 0;
  });
  console.log("[VOT] subtitles list", subtitles);
  return subtitles;
}

var _subtitlesWidget = null;

export function addSubtitlesWidget(element) {
  if (element.querySelector(".VOTSubtitlesWidget")) return;

  const container = document.createElement("div");
  container.classList.add("VOTSubtitlesWidget");
  element.appendChild(container);
  _subtitlesWidget = container;

  let dragging = false;
  let containerRect, elementRect;
  let offsetX, offsetY;

  function onMouseDown(e) {
    if (container.contains(e.target)) {
      containerRect = container.getBoundingClientRect();
      elementRect = element.getBoundingClientRect();
      offsetX = e.clientX - containerRect.x;
      offsetY = e.clientY - containerRect.y;
      dragging = true;
    }
  }

  function onMouseUp() {
    dragging = false;
  }

  function onMouseMove(e) {
    if (dragging) {
      e.preventDefault();
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      const top = y >= elementRect.top;
      const bottom = y + containerRect.height <= elementRect.bottom;
      const left = x >= elementRect.left;
      const right = x + containerRect.width <= elementRect.right;

      if (top && bottom) {
        container.style.top = `${y - elementRect.y}px`;
      } else {
        if (!top) {
          container.style.top = `${0}px`;
        } else {
          container.style.top = `${
            elementRect.height - containerRect.height
          }px`;
        }
      }
      if (left && right) {
        container.style.left = `${x - elementRect.x}px`;
      } else {
        if (!left) {
          container.style.left = `${0}px`;
        } else {
          container.style.left = `${elementRect.width - containerRect.width}px`;
        }
      }
    }
  }

  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
}

var _subtitles = null;
var _video = null;
var _lastContent = null;
var _maxLength = 300;
var _maxLengthRegexp = /.{1,300}(?:\s|$)/g;
var _highlightWords = false;

function updateSubtitles(video) {
  if (!video) return;

  let content = "";
  let highlightWords = _highlightWords && _subtitles?.containsTokens;
  const time = video.currentTime * 1000;
  const line = _subtitles?.subtitles?.findLast((e) => {
    return e.startMs < time && time < e.startMs + e.durationMs;
  });
  if (line) {
    if (highlightWords) {
      let tokens = line.tokens;
      if (tokens.at(-1).alignRange.end > _maxLength) {
        let chunks = [];
        let chunkStartIndex = 0;
        let chunkEndIndex = 0;
        let length = 0;
        for (let i = 0; i < tokens.length + 1; i++) {
          length += tokens[i]?.text?.length ?? 0;
          if (!tokens[i] || length > _maxLength) {
            let t = tokens.slice(chunkStartIndex, chunkEndIndex + 1);
            if (t.at(0) && t.at(0).text === " ") t = t.slice(1);
            if (t.at(-1) && t.at(-1).text === " ") t = t.slice(0, t.length - 1);
            chunks.push({
              startMs: tokens[chunkStartIndex].startMs,
              durationMs:
                tokens[chunkEndIndex].startMs +
                tokens[chunkEndIndex].durationMs -
                tokens[chunkStartIndex].startMs,
              tokens: t,
            });
            chunkStartIndex = i;
            length = 0;
          }
          chunkEndIndex = i;
        }
        for (let i = 0; i < chunks.length; i++) {
          if (
            chunks[i].startMs < time &&
            time < chunks[i].startMs + chunks[i].durationMs
          ) {
            tokens = chunks[i].tokens;
            break;
          }
        }
      }
      for (let token of tokens) {
        const passedMs = token.startMs + token.durationMs / 2;
        content += `<span ${
          time > passedMs ||
          (time > token.startMs - 100 && passedMs - time < 275)
            ? 'class="passed"'
            : ""
        }>${token.text}</span>`;
      }
    } else {
      if (line.text.length > _maxLength) {
        let chunks = line.text.match(_maxLengthRegexp);
        let chunkDurationMs = line.durationMs / chunks.length;
        for (let i = 0; i < chunks.length; i++) {
          if (
            line.startMs + chunkDurationMs * i < time &&
            time < line.startMs + chunkDurationMs * (i + 1)
          ) {
            content = chunks[i].trim();
            break;
          }
        }
      } else {
        content = line.text;
      }
    }
  }
  if (content !== _lastContent) {
    _lastContent = content;
    _subtitlesWidget.innerHTML = content
      ? `<div>${content.replace("\\n", "<br>")}</div>`
      : "";
  }
}

function onTimeUpdate(event) {
  updateSubtitles(event.target);
}

export function setSubtitlesWidgetContent(video, subtitles) {
  if (subtitles && video) {
    _subtitles = subtitles;
    _video = video;
    video?.addEventListener("timeupdate", onTimeUpdate);
    updateSubtitles(video);
  } else {
    _subtitles = null;
    video?.removeEventListener("timeupdate", onTimeUpdate);
    _subtitlesWidget.innerHTML = "";
  }
}

export function setSubtitlesMaxLength(len) {
  if (typeof len === "number" && len) {
    _maxLength = len;
    _maxLengthRegexp = new RegExp(`.{1,${len}}(?:\\s|$)`, "g");
    updateSubtitles(_video);
  }
}

export function setSubtitlesHighlightWords(value) {
  if (_highlightWords !== !!value) {
    _highlightWords = !!value;
    updateSubtitles(_video);
  }
}
