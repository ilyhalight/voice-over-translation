import { localizationProvider } from "../localization/localizationProvider.js";

const userlang = navigator.language || navigator.userLanguage;
export const lang = userlang?.substr(0, 2)?.toLowerCase() ?? "en";

if (!String.prototype.format) {
  // https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
  // syntax example: "is {0} function".format("format")
  String.prototype.format = function () {
    // store arguments in an array
    var args = arguments;
    // use replace to iterate over the string
    // select the match and check if the related argument is present
    // if yes, replace the match with the argument
    return this.replace(/{(\d+)}/g, function (match, index) {
      // check if the argument is present
      return typeof args[index] != "undefined" ? args[index] : match;
    });
  };
}

function waitForElm(selector) {
  // https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      once: true,
    });
  });
}

const sleep = (m) => new Promise((r) => setTimeout(r, m));

const getVideoId = (service, video) => {
  const url = new URL(window.location.href);

  switch (service) {
    case "piped":
    case "invidious":
    case "youtube":
      return (
        url.pathname.match(/(?:watch|embed|shorts)\/([^/]+)/)?.[1] ||
        url.searchParams.get("v")
      );
    case "vk":
      if (url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)) {
        return url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)[0].slice(1);
      } else if (url.searchParams.get("z")) {
        return url.searchParams.get("z").split("/")[0];
      } else if (url.searchParams.get("oid") && url.searchParams.get("id")) {
        return `video-${Math.abs(
          url.searchParams.get("oid"),
        )}_${url.searchParams.get("id")}`;
      } else {
        return false;
      }
    case "nine_gag":
    case "9gag":
    case "gag":
      return url.pathname.match(/gag\/([^/]+)/)?.[1];
    case "twitch":
      if (/^m\.twitch\.tv$/.test(window.location.hostname)) {
        const linkUrl = document.head.querySelector('link[rel="canonical"]');
        return (
          linkUrl?.href.match(/videos\/([^/]+)/)?.[0] || url.pathname.slice(1)
        );
      } else if (/^player\.twitch\.tv$/.test(window.location.hostname)) {
        return `videos/${url.searchParams.get("video")}`;
      } else if (/^clips\.twitch\.tv$/.test(window.location.hostname)) {
        // get link to twitch channel (ex.: https://www.twitch.tv/xqc)
        const channelLink = document.querySelector(
          ".tw-link[data-test-selector='stream-info-card-component__stream-avatar-link']",
        );
        if (!channelLink) {
          return false;
        }

        const channelName = channelLink.href.replace(
          "https://www.twitch.tv/",
          "",
        );
        return `${channelName}/clip/${url.searchParams.get("clip")}`;
      } else if (url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)) {
        return url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)[0];
      } else {
        return url.pathname.match(/(?:videos)\/([^/]+)/)?.[0];
      }
    case "proxytok":
      return url.pathname.match(/([^/]+)\/video\/([^/]+)/)?.[0];
    case "tiktok": {
      let id = url.pathname.match(/([^/]+)\/video\/([^/]+)/)?.[0];
      if (!id) {
        const playerEl = video.closest(".xgplayer-playing, .tiktok-web-player");
        const itemEl = playerEl?.closest(
          'div[data-e2e="recommend-list-item-container"]',
        );
        const authorEl = itemEl?.querySelector(
          'a[data-e2e="video-author-avatar"]',
        );
        if (playerEl && authorEl) {
          const videoId = playerEl.id?.match(/^xgwrapper-[0-9]+-(.*)$/)?.at(1);
          const author = authorEl.href?.match(/.*(@.*)$/)?.at(1);
          if (videoId && author) {
            id = `${author}/video/${videoId}`;
          }
        }
      }
      return id;
    }
    case "vimeo":
      return (
        url.pathname.match(/[^/]+\/[^/]+$/)?.[0] ||
        url.pathname.match(/[^/]+$/)?.[0]
      );
    case "xvideos":
      return url.pathname.match(/[^/]+\/[^/]+$/)?.[0];
    case "pornhub":
      return (
        url.searchParams.get("viewkey") ||
        url.pathname.match(/embed\/([^/]+)/)?.[1]
      );
    case "twitter":
      return url.pathname.match(/status\/([^/]+)/)?.[1];
    case "udemy":
      return url.pathname;
    case "rumble":
      return url.pathname;
    case "facebook":
      // ...watch?v=XXX
      // CHANNEL_ID/videos/VIDEO_ID/
      // returning "Видео недоступно для перевода"

      // fb.watch/YYY
      // returning "Возникла ошибка, попробуйте позже"
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v");
      }

      return false;
    case "rutube":
      return url.pathname.match(/(?:video|embed)\/([^/]+)/)?.[1];
    case "coub":
      if (url.pathname.includes("/view")) {
        return url.pathname.match(/view\/([^/]+)/)?.[1];
      } else if (url.pathname.includes("/embed")) {
        return url.pathname.match(/embed\/([^/]+)/)?.[1];
      } else {
        return document.querySelector(".coub.active")?.dataset?.permalink;
      }
    case "bilibili": {
      const bvid = url.searchParams.get("bvid");
      if (bvid) {
        return bvid;
      } else {
        let vid = url.pathname.match(/video\/([^/]+)/)?.[1];
        if (vid && url.search && url.searchParams.get("p") !== null) {
          vid += `/?p=${url.searchParams.get("p")}`;
        }
        return vid;
      }
    }
    case "mail_ru":
      if (url.pathname.startsWith("/v/") || url.pathname.startsWith("/mail/")) {
        return url.pathname;
      } else if (url.pathname.match(/video\/embed\/([^/]+)/)) {
        const referer = document.querySelector(
          ".b-video-controls__mymail-link",
        );
        if (!referer) {
          return false;
        }

        return referer?.href.split("my.mail.ru")?.[1];
      }
      return false;
    case "bitchute":
      return url.pathname.match(/video\/([^/]+)/)?.[1];
    case "coursera":
      // ! LINK SHOULD BE LIKE THIS https://www.coursera.org/learn/learning-how-to-learn/lecture/75EsZ
      // return url.pathname.match(/lecture\/([^/]+)\/([^/]+)/)?.[1]; // <--- COURSE PREVIEW
      return url.pathname.match(/learn\/([^/]+)\/lecture\/([^/]+)/)?.[0]; // <--- COURSE PASSING (IF YOU LOGINED TO COURSERA)
    case "eporner":
      // ! LINK SHOULD BE LIKE THIS eporner.com/video-XXXXXXXXX/isdfsd-dfjsdfjsdf-dsfsdf-dsfsda-dsad-ddsd
      return url.pathname.match(/video-([^/]+)\/([^/]+)/)?.[0];
    case "peertube":
      return url.pathname.match(/\/w\/([^/]+)/)?.[0];
    case "dailymotion": {
      // we work in the context of the player
      // geo.dailymotion.com

      const plainPlayerConfig = Array.from(document.scripts).filter((s) =>
        s.innerText.trim().includes("window.__PLAYER_CONFIG__ = {"),
      );
      if (!plainPlayerConfig.length) {
        return false;
      }

      try {
        let clearPlainConfig = plainPlayerConfig[0].innerText
          .trim()
          .replace("window.__PLAYER_CONFIG__ = ", "");
        if (clearPlainConfig.endsWith("};")) {
          clearPlainConfig = clearPlainConfig.substring(
            0,
            clearPlainConfig.length - 1,
          );
        }
        const playerConfig = JSON.parse(clearPlainConfig);
        const videoUrl =
          playerConfig.context.embedder ?? playerConfig.context.http_referer;
        console.log(videoUrl, playerConfig);
        return videoUrl.match(/\/video\/([^/]+)/)?.[1];
      } catch (e) {
        console.error("[VOT]", e);
        return false;
      }
    }
    case "trovo": {
      if (!url.pathname.startsWith("/s/")) {
        return false;
      }

      const vid = url.searchParams.get("vid");
      if (!vid) {
        return false;
      }

      const path = url.pathname.match(/([^/]+)\/([\d]+)/)?.[0];
      if (!path) {
        return false;
      }

      return `${path}?vid=${vid}`;
    }
    case "yandexdisk": {
      return url.pathname.match(/\/[i|s|d]\/([^/]+)/)?.[1];
    }
    case "coursehunter": {
      return (
        video.getAttribute("src") ||
        video.querySelector("source").getAttribute("src")
      ).replace(/.+\/\/.+\.net/g, "");
    }
    default:
      return false;
  }
};

function secsToStrTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  if (minutes >= 60) {
    return localizationProvider.get("translationTakeMoreThanHour");
  } else if (minutes >= 10 && minutes % 10) {
    return localizationProvider
      .get("translationTakeApproximatelyMinutes")
      .format(minutes);
  } else if (minutes == 1 || (minutes == 0 && seconds > 0)) {
    return localizationProvider.get("translationTakeAboutMinute");
  } else {
    return localizationProvider
      .get("translationTakeApproximatelyMinute")
      .format(minutes);
  }
}

function langTo6391(lang) {
  // convert lang to ISO 639-1
  return lang.toLowerCase().split(";")[0].trim().split("-")[0].split("_")[0];
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

export {
  waitForElm,
  sleep,
  getVideoId,
  secsToStrTime,
  langTo6391,
  isPiPAvailable,
  initHls,
};
