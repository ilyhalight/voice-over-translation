// ==UserScript==
// @name [VOT] - Voice Over Translation
// @name:de [VOT] - Voice-Over-Video-Übersetzung
// @name:es [VOT] - Traducción de vídeo en off
// @name:fr [VOT] - Traduction vidéo voix-off
// @name:it [VOT] - Traduzione Video fuori campo
// @name:ru [VOT] - Закадровый перевод видео
// @name:zh [VOT] - 画外音视频翻译
// @description A small extension that adds a Yandex Browser video translation to other browsers
// @description:de Eine kleine Erweiterung, die eine Voice-over-Übersetzung von Videos aus dem Yandex-Browser zu anderen Browsern hinzufügt
// @description:es Una pequeña extensión que agrega una traducción de voz en off de un video de Yandex Browser a otros navegadores
// @description:fr Une petite extension qui ajoute la traduction vocale de la vidéo du Navigateur Yandex à d'autres navigateurs
// @description:it Una piccola estensione che aggiunge la traduzione vocale del video dal browser Yandex ad altri browser
// @description:ru Небольшое расширение, которое добавляет закадровый перевод видео из Яндекс Браузера в другие браузеры
// @description:zh 一个小扩展，它增加了视频从Yandex浏览器到其他浏览器的画外音翻译
// @version 1.3.7
// @author sodapng, mynovelhost, Toil, SashaXser
// @supportURL https://github.com/ilyhalight/voice-over-translation/issues
// @match *://*.youtube.com/*
// @match *://*.youtube-nocookie.com/*
// @match *://*.twitch.tv/*
// @match *://*.xvideos.com/*
// @match *://*.pornhub.com/*
// @match *://*.vk.com/*
// @match *://*.vk.ru/*
// @match *://invidious.snopyta.org/*
// @match *://invidious.kavin.rocks/*
// @match *://vid.puffyan.us/*
// @match *://invidious.namazso.eu/*
// @match *://inv.riverside.rocks/*
// @match *://yt.artemislena.eu/*
// @match *://invidious.flokinet.to/*
// @match *://invidious.esmailelbob.xyz/*
// @match *://invidious.nerdvpn.de/*
// @match *://invidious.slipfox.xyz/*
// @match *://invidio.xamh.de/*
// @match *://invidious.dhusch.de/*
// @match *://*.piped.video/*
// @match *://piped.tokhmi.xyz/*
// @match *://piped.moomoo.me/*
// @match *://piped.syncpundit.io/*
// @match *://piped.mha.fi/*
// @match *://watch.whatever.social/*
// @match *://piped.garudalinux.org/*
// @match *://efy.piped.pages.dev/*
// @match *://watch.leptons.xyz/*
// @match *://piped.lunar.icu/*
// @match *://yt.dc09.ru/*
// @match *://piped.mint.lgbt/*
// @match *://*.il.ax/*
// @match *://piped.privacy.com.de/*
// @match *://piped.esmailelbob.xyz/*
// @match *://piped.projectsegfau.lt/*
// @match *://piped.in.projectsegfau.lt/*
// @match *://piped.us.projectsegfau.lt/*
// @match *://piped.privacydev.net/*
// @match *://piped.palveluntarjoaja.eu/*
// @match *://piped.smnz.de/*
// @match *://piped.adminforge.de/*
// @match *://piped.qdi.fi/*
// @match *://piped.hostux.net/*
// @match *://piped.chauvet.pro/*
// @match *://piped.jotoma.de/*
// @match *://piped.pfcd.me/*
// @match *://piped.frontendfriendly.xyz/*
// @match *://*.yewtu.be/*
// @match *://inv.vern.cc/*
// @match *://*.vimeo.com/*
// @match *://*.9gag.com/*
// @match *://*.twitter.com/*
// @match *://*.facebook.com/*
// @match *://*.rutube.ru/*
// @match *://*.bilibili.com/*
// @match *://my.mail.ru/*
// @match *://*.bitchute.com/*
// @connect api.browser.yandex.ru
// @downloadURL https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
// @grant GM_xmlhttpRequest
// @grant GM_info
// @homepageURL https://github.com/ilyhalight/voice-over-translation/issues
// @icon https://translate.yandex.ru/icons/favicon.ico
// @namespace vot
// @require https://cdnjs.cloudflare.com/ajax/libs/protobufjs/7.2.3/light/protobuf.min.js
// @updateURL https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/main.css":
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/css-loader/dist/runtime/noSourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".translationBlock {\n  padding: 0.45rem !important;\n  width: max-content;\n  position: absolute;\n  background: #2e2f34;\n  border-radius: 0.5rem !important;\n  left: 50%;\n  top: 5rem;\n  transform: translate(-50%);\n  text-align: center;\n  opacity: 0;\n  transition: opacity 1s;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  z-index: 100;\n}\n\n.translationBtn {\n  position: relative;\n  display: inline-block;\n  vertical-align: middle;\n  color: #fff;\n  padding-right: 0.25rem !important;\n  cursor: pointer;\n  font: 600 12px / 14px \"Segoe UI\", BlinkMacSystemFont, Arial, sans-serif;\n}\n\n.translationBlock:hover {\n  opacity: 1;\n}\n\n.translationMenu {\n  display: inline-block;\n  vertical-align: middle;\n  border-left: 1px solid #424348;\n  max-height: 16px;\n  max-width: 24px;\n  cursor: pointer;\n}\n\n.translationMenuIcon {\n  padding: 0 10px !important;\n  width: 24px;\n}\n\n.translationIAlice {\n  display: inline-block;\n  vertical-align: middle;\n  max-height: 26px;\n  max-width: 50px;\n}\n\n.translationIconAlice {\n  height: 24px !important;\n  width: 24px !important;\n}\n\n.translationITranslate {\n  display: inline-block;\n  vertical-align: middle;\n  max-height: 20px;\n  max-width: 20px;\n}\n\n.translationMenuContent {\n  position: absolute;\n  background: #2e2f34;\n  color: #fff;\n  display: none;\n  border-radius: 1rem !important;\n  left: 50%;\n  top: 10rem;\n  transform: translate(-50%);\n  text-align: left;\n  font: 600 14px / 16px \"Segoe UI\", BlinkMacSystemFont, Arial, sans-serif !important;\n\n  width: 300px;\n  /* height: 375px; */\n  opacity: 0;\n  z-index: 100;\n  transition: opacity 0.5s ease;\n}\n\n.VOTMenuSlider {\n  -webkit-appearance: none !important;\n  appearance: none !important;\n  width: 268px !important;\n  height: 8px !important;\n  outline: none !important;\n  margin-top: 0.5rem;\n  opacity: 0.7;\n  /* background: #3C3F4D !important; */\n  background: rgb(253, 222, 85, 0.6) !important;\n  border: none !important;\n  border-radius: 2rem !important;\n  -webkit-transition: 0.2s !important;\n  transition: opacity 0.2s ease !important;\n}\n\n.VOTMenuSlider:hover {\n  opacity: 1;\n}\n\n.VOTMenuSlider::-webkit-slider-thumb {\n  -webkit-appearance: none !important;\n  appearance: none !important;\n  width: 10px !important;\n  height: 10px !important;\n  border-radius: 50% !important;\n  border: none !important;\n  background: #fff !important;\n  cursor: pointer !important;\n}\n\n.VOTMenuSlider::-moz-range-thumb {\n  width: 10px !important;\n  height: 10px !important;\n  border-radius: 50% !important;\n  border: none !important;\n  background: #fff !important;\n  cursor: pointer !important;\n}\n\n.VOTMenuSlider::-ms-thumb {\n  width: 10px !important;\n  height: 10px !important;\n  border-radius: 50% !important;\n  border: none !important;\n  background: #fff !important;\n  cursor: pointer !important;\n}\n\n.VOTMenuSlider::-ms-fill-lower {\n  height: 8px !important;\n  border-radius: 2rem !important;\n  background: linear-gradient(\n    90.1deg,\n    rgba(186, 153, 244, 0.85) -5.78%,\n    rgba(236, 138, 202, 0.7) 56.46%,\n    rgba(239, 168, 117, 0.6) 108.93%\n  ) !important;\n}\n\n.VOTMenuSlider::-moz-range-progress {\n  height: 8px !important;\n  border-radius: 2rem !important;\n  background: linear-gradient(\n    90.1deg,\n    rgba(186, 153, 244, 0.85) -5.78%,\n    rgba(236, 138, 202, 0.7) 56.46%,\n    rgba(239, 168, 117, 0.6) 108.93%\n  ) !important;\n}\n\n.translationHeader {\n  padding-bottom: 0.5rem !important;\n}\n\n.translationMainHeader {\n  margin: 16px !important;\n  color: #fff;\n  font: 900 14px / 16px \"Segoe UI\", BlinkMacSystemFont, Arial, sans-serif !important;\n}\n\n.translationMenuOptions {\n  display: flex;\n  flex-flow: column wrap;\n}\n\n.translationMenuContainer {\n  /* width: 100%; */\n  padding-left: 16px !important;\n  padding-top: 5px !important;\n  display: inline-block !important;\n}\n\n.translationMenuContainer > input {\n  appearance: auto !important;\n  vertical-align: text-bottom;\n}\n\n.translationMenuText {\n  color: #fff;\n  display: inline-flex;\n  width: 80%;\n}\n\n.translationVolumeBox,\n.translationVideoVolumeBox {\n  padding-top: 0.5rem !important;\n}\n\n.translationDropDB {\n  border: none !important;\n  border-radius: 4px !important;\n  background: #5426ff !important;\n  color: #fff !important;\n  padding: 6px 16px !important;\n  margin-left: auto !important;\n  cursor: pointer !important;\n}\n\n.translationDownload {\n  background: #5426ff !important;\n  color: #fff !important;\n  padding: 2px 10px !important;\n  border-radius: 4px !important;\n  cursor: pointer;\n  display: none;\n}\n\n.translationMenuFunctional {\n  display: flex;\n  margin: 16px !important;\n}\n\n.VOTMenuSelect {\n  width: 110px;\n  border-radius: 5px !important;\n  border: 1px solid #dadce0 !important;\n  box-shadow: 0 1px 3px -2px #9098a9;\n  box-sizing: border-box !important;\n  color: #2e2f34 !important;\n  background: #fff !important;\n  padding: 5px !important;\n}\n\n.VOTMenuSelect:focus {\n  outline: none;\n}\n\n.VOTMenuSelect:focus {\n  outline: none;\n  border-color: #0077ff;\n  box-shadow: 0 0 0 2px rgba(#0077ff, 0.2);\n}\n\n#VOTSelectLanguages {\n  display: flex !important;\n  margin-left: 5px;\n}\n\n#VOTSelectLanguages svg {\n  margin: 0 5px;\n}\n", ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/noSourceMaps.js":
/***/ ((module) => {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/***/ ((module) => {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/***/ ((module) => {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./src/config/config.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "I1": () => (/* binding */ yandexHmacKey),
/* harmony export */   "IM": () => (/* binding */ autoVolume),
/* harmony export */   "Rr": () => (/* binding */ yandexUserAgent),
/* harmony export */   "iF": () => (/* binding */ workerHost)
/* harmony export */ });
// CONFIGURATION
const workerHost = "api.browser.yandex.ru";
const yandexHmacKey = "gnnde87s24kcuMH8rbWhLyfeuEKDkGGm";
const yandexUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 CriOS/104.0.5112.114 YaBrowser/22.9.4.633.10 SA/3 Mobile/15E148 Safari/604.1";
const autoVolume = 0.15; // 0.0 - 1.0 (0% - 100%) - default volume of the video with the translation




/***/ }),

/***/ "./src/rvt.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ rvt)
});

;// CONCATENATED MODULE: ./src/getUUID.js
function getUUID(isLower) {
  const uuid = ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
  return isLower ? uuid : uuid.toUpperCase();
}



// EXTERNAL MODULE: ./src/yandexRequests.js
var yandexRequests = __webpack_require__("./src/yandexRequests.js");
// EXTERNAL MODULE: ./src/config/config.js
var config = __webpack_require__("./src/config/config.js");
;// CONCATENATED MODULE: ./src/rvt.js




// Request video translation from Yandex API
async function requestVideoTranslation(
  url,
  unknown1,
  requestLang,
  responseLang,
  callback
) {
  // Initialize variables
  const deviceId = getUUID(true);
  const body = yandexRequests/* yandexRequests.encodeRequest */.G.encodeRequest(
    url,
    deviceId,
    unknown1,
    requestLang,
    responseLang
  );

  try {
    // Create a key from the HMAC secret
    const utf8Encoder = new TextEncoder("utf-8");
    const key = await window.crypto.subtle.importKey(
      "raw",
      utf8Encoder.encode(config/* yandexHmacKey */.I1),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign", "verify"]
    );
    // Sign the body with the key
    const signature = await window.crypto.subtle.sign("HMAC", key, body);
    // Convert the signature to a hex string
    const hexSignature = Array.from(new Uint8Array(signature), (x) =>
      x.toString(16).padStart(2, "0")
    ).join("");
    // Create a fetch options object with headers and body
    const options = {
      // url: `https://${workerHost}/stream-translation/whitelist-stream`,
      // url: `https://${workerHost}/stream-translation/translate-stream`,
      url: `https://${config/* workerHost */.iF}/video-translation/translate`,
      method: "POST",
      headers: {
        Accept: "application/x-protobuf",
        "Accept-Language": "en",
        "Content-Type": "application/x-protobuf",
        "User-Agent": config/* yandexUserAgent */.Rr,
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Mode": "no-cors",
        "sec-ch-ua": null,
        "sec-ch-ua-mobile": null,
        "sec-ch-ua-platform": null,
        "Vtrans-Signature": hexSignature,
        "Sec-Vtrans-Token": getUUID(false),
      },
      data: String.fromCharCode(...body),
      responseType: "arraybuffer",
    };
    // Send the request using GM_xmlhttpRequest
    GM_xmlhttpRequest({
      ...options,
      onload: (http) => {
        callback(http.status === 200, http.response);
      },
      onerror: (error) => {
        callback(false);
      },
    });
  } catch (exception) {
    // Handle errors
    callback(false);
  }
}

/* harmony default export */ const rvt = (requestVideoTranslation);


/***/ }),

/***/ "./src/yandexRequests.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "G": () => (/* binding */ yandexRequests)
/* harmony export */ });
const VideoTranslationRequest = new protobuf.Type("VideoTranslationRequest")
  .add(new protobuf.Field("url", 3, "string"))
  .add(new protobuf.Field("deviceId", 4, "string"))
  .add(new protobuf.Field("firstRequest", 5, "bool")) // true for the first request, false for subsequent ones
  .add(new protobuf.Field("unknown1", 6, "fixed64"))
  .add(new protobuf.Field("unknown2", 7, "int32")) // 1 1
  .add(new protobuf.Field("language", 8, "string")) // source language code
  .add(new protobuf.Field("unknown3", 9, "int32")) // 0 0
  .add(new protobuf.Field("unknown4", 10, "int32")) // 0 0
  .add(new protobuf.Field("translationHelp", 11, "int32")) // array for translation assistance ([0] -> {2: link to video, 1: "video_file_url"}, [1] -> {2: link to subtitles, 1: "subtitles_file_url"})
  .add(new protobuf.Field("responseLanguage", 14, "string")); // target language code

// const VideoWhitelistStreamRequest = new protobuf.Type("VideoWhitelistStreamRequest")
//   .add(new protobuf.Field("url", 1, "string"))
//   .add(new protobuf.Field("deviceId", 4, "string"))

// const VideoTranslationStreamRequest = new protobuf.Type("VideoTranslationStreamRequest")
//   .add(new protobuf.Field("url", 1, "string"))
//   .add(new protobuf.Field("language", 2, "string"))
//   .add(new protobuf.Field("responseLanguage", 3, "string"))

const VideoTranslationResponse = new protobuf.Type("VideoTranslationResponse")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("duration", 2, "double"))
  .add(new protobuf.Field("status", 4, "int32")) // status
  .add(new protobuf.Field("remainingTime", 5, "int32")) // secs before translation
  .add(new protobuf.Field("language", 8, "string")) // detected language (if the wrong one is set)
  .add(new protobuf.Field("message", 9, "string"));
// 6 - unknown 0 (1st request) -> 10 (2nd, 3th and etc requests)
// 7 - unknown array

// const VideoWhitelistStreamResponse = new protobuf.Type("VideoWhitelistStreamResponse")
//   .add(new protobuf.Field("inWhitelist", 1, "bool"))

// const VideoTranslationStreamResponse = new protobuf.Type("VideoTranslationStreamResponse")
//   .add(new protobuf.Field("unknown1", 1, "int32"))
//   .add(new protobuf.Field("array", 2, "string"))
//   .add(new protobuf.Field("ping", 3, "int32"))

// Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoWhitelistStreamRequest).add(VideoWhitelistStreamResponse);

// // Export the encoding and decoding functions
// export const yandexRequests = {
//   encodeRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoWhitelistStreamRequest.encode({
//       url,
//       deviceId: 'UCLA_DiR1FfKNvjuUpBHmylQ'
//     }).finish();
//   },
//   decodeResponse(response) {
//     return root.VideoWhitelistStreamResponse.decode(new Uint8Array(response));
//   }
// };

// // Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoTranslationStreamRequest).add(VideoTranslationStreamResponse);

// // Export the encoding and decoding functions
// export const yandexRequests = {
//   encodeRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoTranslationStreamRequest.encode({
//       url,
//       language: requestLang,
//       responseLanguage: responseLang
//     }).finish();
//   },
//   decodeResponse(response) {
//     return root.VideoTranslationStreamResponse.decode(new Uint8Array(response));
//   }
// };

// Create a root namespace and add the types
const root = new protobuf.Root()
  .define("yandex")
  .add(VideoTranslationRequest)
  .add(VideoTranslationResponse);

// Export the encoding and decoding functions
const yandexRequests = {
  encodeRequest(url, deviceId, unknown1, requestLang, responseLang) {
    return root.VideoTranslationRequest.encode({
      url,
      deviceId,
      firstRequest: true,
      unknown1,
      unknown2: 1,
      language: requestLang,
      unknown3: 0,
      unknown4: 0,
      responseLanguage: responseLang,
    }).finish();
  },
  decodeResponse(response) {
    return root.VideoTranslationResponse.decode(new Uint8Array(response));
  },
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__("./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__("./node_modules/style-loader/dist/runtime/styleDomAPI.js");
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__("./node_modules/style-loader/dist/runtime/insertBySelector.js");
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__("./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__("./node_modules/style-loader/dist/runtime/insertStyleElement.js");
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__("./node_modules/style-loader/dist/runtime/styleTagTransform.js");
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/styles/main.css
var main = __webpack_require__("./node_modules/css-loader/dist/cjs.js!./src/styles/main.css");
;// CONCATENATED MODULE: ./src/styles/main.css

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());

      options.insert = insertBySelector_default().bind(null, "head");
    
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(main/* default */.Z, options);




       /* harmony default export */ const styles_main = (main/* default */.Z && main/* default.locals */.Z.locals ? main/* default.locals */.Z.locals : undefined);

;// CONCATENATED MODULE: ./src/utils/getYTVideoData.js
async function detect(cleanText) {
  const response = await fetch("https://rust-server-531j.onrender.com/detect", {
    method: "POST",
    body: cleanText,
  });
  return await response.text();
}

// Get the language code from the response or the text
async function getLanguage(player, response, title, description, author) {
  if (!window.location.hostname.includes("m.youtube.com")) {
    // ! Experimental ! get lang from selected audio track if availabled
    const audioTracks = player.getAudioTrack();
    const trackInfo = audioTracks?.getLanguageInfo(); // get selected track info (id === "und" if tracks are not available)
    if (trackInfo?.id !== "und") {
      return trackInfo.id.split(".")[0];
    }
  }

  // TODO: If the audio tracks will work fine, transfer the receipt of captions to the audioTracks variable
  // Check if there is an automatic caption track in the response
  const captionTracks =
    response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (captionTracks?.length) {
    const autoCaption = captionTracks.find((caption) => caption.kind === "asr");
    if (autoCaption) {
      return autoCaption.languageCode;
    }
  }
  // If there is no caption track, use detect to get the language code from the text
  const text = [title, description, author].join(" ");
  // Remove anything that is not a letter or a space in any language
  const cleanText = text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\s]/gu, "")
    .slice(0, 250);
  return await detect(cleanText);
}

// Get the video data from the player
async function getYTVideoData() {
  const player = document.querySelector("#movie_player");
  const data = player.getVideoData();
  const response = player.getPlayerResponse();
  const { isLive, isPremiere, title, author } = data;
  const { shortDescription: description } = response?.videoDetails ?? {};
  const videoData = {
    isLive,
    isPremiere,
    title,
    description,
    author,
    detectedLanguage: await getLanguage(
      player,
      response,
      title,
      description,
      author
    ),
  };
  console.log("VOT Detected language: ", videoData.detectedLanguage);
  return videoData;
}



// EXTERNAL MODULE: ./src/yandexRequests.js
var yandexRequests = __webpack_require__("./src/yandexRequests.js");
;// CONCATENATED MODULE: ./src/config/constants.js
const translateFuncParam = 0x40_75_50_00_00_00_00_00;

const localStorageUserlangKey = "VOT_userlang";

// available languages for translation
const availableLangs = {
  ru: "Russian",
  en: "English",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

// Additional languages working with TTS
const additionalTTS = {
  bn: "Bengali", // TODO: Add menu translation
  pt: "Portuguese",
  cs: "Czech",
  hi: "Hindi",
  mr: "Marathi", // TODO: Add menu translation
  te: "Telugu", // TODO: Add menu translation
  tr: "Turkish",
  ms: "Malay", // TODO: Add menu translation
  vi: "Vietnamese",
  ta: "Tamil", // TODO: Add menu translation
  jv: "Javanese", // TODO: Add menu translation
  ur: "Urdu", // TODO: Add menu translation
  fa: "Persian", // TODO: Add menu translation
  gu: "Gujarati", // TODO: Add menu translation
  id: "Indonesian", // TODO: Add menu translation
  uk: "Ukrainian",
  kk: "Kazakh",
};

const siteTranslates = {
  youtube: "https://youtu.be/",
  twitch: "https://twitch.tv/",
  vimeo: "https://vimeo.com/",
  "9gag": "https://9gag.com/gag/",
  vk: "https://vk.com/video?z=",
  xvideos: "https://www.xvideos.com/",
  pornhub: "https://rt.pornhub.com/view_video.php?viewkey=",
  udemy: "https://www.udemy.com",
  twitter: "https://twitter.com/i/status/",
  facebook: "https://www.facebook.com/",
  rutube: "https://rutube.ru/video/",
  "bilibili.com": "https://www.bilibili.com/video/",
  "mail.ru": "https://my.mail.ru/",
  coub: "https://coub.com/view/",
  bitchute: "https://www.bitchute.com/video/",
};

// TODO:
/*
  Add a language upload from github.

  it may be worth redesigning the translation system
  (if there is no necessary phrase, then the phrase in English / "raw" phrase will be displayed)
*/
const translations = {
  ru: {
    recommended: "рекомендуется",
    translateVideo: "Перевести видео",
    disableTranslate: "Выключить",
    translationSettings: "Настройки перевода",
    resetSettings: "Сбросить настройки",
    videoBeingTranslated: "Видео переводится",
    videoLanguage: "Язык видео",
    translationLanguage: "Язык перевода",
    translationTake: "Перевод займёт",
    translationTakeMoreThanHour: "Перевод займёт больше часа",
    translationTakeAboutMinute: "Перевод займёт около минуты",
    translationTakeFewMinutes: "Перевод займёт несколько минут",
    translationTakeApproximatelyMinutes: "Перевод займёт примерно {0} минут",
    translationTakeApproximatelyMinute: "Перевод займёт примерно {0} минуты",
    unSupportedExtensionError: `Ошибка! ${GM_info.scriptHandler} не поддерживается этой версией расширения!\n\nПожалуйста, используйте cloudflare-версию расширения VOT.`,
    requestTranslationFailed: "Не удалось запросить перевод видео",
    audioNotReceived: "Не получена ссылка на аудио",
    grantPermissionToAutoPlay: "Предоставьте разрешение на автовоспроизведение",
    neededAdditionalExtension:
      "Для поддержки этого сайта необходимо дополнительное расширение",
    audioFormatNotSupported: "Формат аудио не поддерживается",
    VOTAutoTranslate: "Переводить при открытии",
    VOTDontTranslateYourLang: "Не переводить с родного языка",
    VOTVolume: "Громкость видео",
    VOTVolumeTranslation: "Громкость перевода",
    VOTAutoSetVolume: "Уменьшать громкость видео до ",
    VOTShowVideoSlider: "Слайдер громкости видео",
    VOTSyncVolume: "Связать громкость перевода и видео",
    VOTAudioProxy: "Проксировать полученное аудио",
    VOTDisableFromYourLang: "VOT: Вы отключили перевод видео на вашем языке",
    VOTLiveNotSupported:
      "VOT: Не поддерживается перевод трансляций в прямом эфире",
    VOTPremiere: "VOT: Дождитесь окончания премьеры перед переводом",
    VOTVideoIsTooLong: "VOT: Видео слишком длинное",
    VOTNoVideoIDFound: "VOT: Не найдено ID видео",
    VOTFailedInitDB: "VOT: Не удалось инициализовать базу данных",
    VOTDBNeedUpdate:
      "VOT: Базе данных нужно обновление, пожалуйста, перезагрузите страницу",
    VOTDisabledForDBUpdating: `VOT отключен из-за ошибки при обновление Базы Данных. Закройте все открытые вкладки с ${window.location.hostname} и попробуйте снова`,
    VOTFailedWriteToDB: "VOT: Не удалось записать данные в базу данных",
    VOTFailedReadFromDB: "VOT: Не удалось получить данные из базы данных",
    Russian: "Русский",
    English: "Английский",
    Chinese: "Китайский",
    French: "Французский",
    Italian: "Итальянский",
    Spanish: "Испанский",
    German: "Немецкий",
    Korean: "Корейский",
    Japanese: "Японский",
    Arabic: "Арабский",
    Bengali: "Бенгальский",
    Portuguese: "Португальский",
    Czech: "Чешский",
    Hindi: "Хинди",
    Marathi: "Маратхи",
    Telugu: "Телугу",
    Turkish: "Турецкий",
    Malay: "Малайский",
    Vietnamese: "Вьетнамский",
    Tamil: "Тамильский",
    Javanese: "Яванский",
    Urdu: "Урду",
    Persian: "Персидский",
    Gujarati: "Гуджарати",
    Indonesian: "Индонезийский",
    Ukrainian: "Украинский",
    Kazakh: "Казахский",
  },
  uk: {
    recommended: "рекомендовано",
    translateVideo: "Перекласти відео",
    disableTranslate: "Вимкнути",
    translationSettings: "Налаштування перекладу",
    resetSettings: "Скинути налаштування",
    videoBeingTranslated: "Відео перекладається",
    videoLanguage: "Мова відео",
    translationLanguage: "Мова перекладу",
    translationTake: "Переклад займе",
    translationTakeMoreThanHour: "Переклад займе більше години",
    translationTakeAboutMinute: "Переклад займе приблизно хвилину",
    translationTakeFewMinutes: "Переклад займе кілька хвилин",
    translationTakeApproximatelyMinutes: "Переклад займе приблизно {0} хвилин",
    translationTakeApproximatelyMinute: "Переклад займе приблизно {0} хвилини",
    unSupportedExtensionError: `Помилка! ${GM_info.scriptHandler} не підтримується цією версією розширення!\n\nБудь ласка, використовуйте версію VOT розширення з cloudflare.`,
    requestTranslationFailed: "Не вдалося запросити переклад відео",
    audioNotReceived: "Посилання на аудіо не отримано",
    grantPermissionToAutoPlay: "Надайте дозвіл на автоматичне відтворення",
    neededAdditionalExtension:
      "Для підтримки цього сайту потрібне додаткове розширення",
    audioFormatNotSupported: "Формат аудіо не підтримується",
    VOTAutoTranslate: "Перекладати при відкритті",
    VOTDontTranslateYourLang: "Не перекладати з моєї мови",
    VOTVolume: "Гучність відео",
    VOTVolumeTranslation: "Гучність перекладу",
    VOTAutoSetVolume: "Зменшити гучність відео до ",
    VOTShowVideoSlider: "Повзунок гучності відео",
    VOTSyncVolume: "Пов'язати гучність перекладу і відео",
    VOTAudioProxy: "Проксювати отримане аудіо",
    VOTDisableFromYourLang: "VOT: Ви вимкнули переклад відео на вашу мову",
    VOTLiveNotSupported: "VOT: Переклад прямих трансляцій не підтримується",
    VOTPremiere: "VOT: Дочекайтеся закінчення прем'єри перед перекладом",
    VOTVideoIsTooLong: "VOT: Відео занадто довге",
    VOTNoVideoIDFound: "VOT: Не знайдено ідентифікатор відео",
    VOTFailedInitDB: "VOT: Не вдалося ініціалізувати базу даних",
    VOTDBNeedUpdate:
      "VOT: База даних потребує оновлення, будь ласка, перезавантажте сторінку",
    VOTDisabledForDBUpdating: `VOT вимкнено через помилку при оновленні бази даних. Закрийте всі вкладки з ${window.location.hostname} і спробуйте ще раз`,
    VOTFailedWriteToDB: "VOT: Не вдалося записати дані в базу даних",
    VOTFailedReadFromDB: "VOT: Не вдалося отримати дані з бази даних",
    Russian: "Російська",
    English: "Англійська",
    Chinese: "Китайська",
    French: "Французька",
    Italian: "Італійська",
    Spanish: "Іспанська",
    German: "Німецька",
    Korean: "Корейська",
    Japanese: "Японська",
    Arabic: "Арабська",
    Bengali: "Бенгальська",
    Portuguese: "Португальська",
    Czech: "Чеська",
    Hindi: "Гінді",
    Marathi: "Маратхі",
    Telugu: "Телугу",
    Turkish: "Турецька",
    Malay: "Малайська",
    Vietnamese: "В'єтнамська",
    Tamil: "Тамільська",
    Javanese: "Яванська",
    Urdu: "Урду",
    Persian: "Перська",
    Gujarati: "Гуджараті",
    Indonesian: "Індонезійська",
    Ukrainian: "Українська",
    Kazakh: "Казахський",
  },
  pt: {
    recommended: "recomendado",
    translateVideo: "Traduzir vídeo",
    disableTranslate: "Desligar",
    translationSettings: "Configurações de tradução",
    resetSettings: "Redefinir configurações",
    videoBeingTranslated: "O vídeo está sendo traduzido",
    videoLanguage: "Idioma do vídeo",
    translationLanguage: "Idioma da tradução",
    translationTake: "A tradução levará",
    translationTakeMoreThanHour: "A tradução levará mais de uma hora",
    translationTakeAboutMinute: "A tradução levará cerca de um minuto",
    translationTakeFewMinutes: "A tradução levará alguns minutos",
    translationTakeApproximatelyMinutes:
      "A tradução levará aproximadamente {0} minutos",
    translationTakeApproximatelyMinute:
      "A tradução levará aproximadamente {0} minutos",
    unSupportedExtensionError: `Erro! ${GM_info.scriptHandler} não é suportado por esta versão da extensão!\n\nPor favor, use a versão cloudflare da extensão VOT.`,
    requestTranslationFailed: "Falha ao solicitar a tradução do vídeo",
    audioNotReceived: "Link de áudio não recebido",
    grantPermissionToAutoPlay: "Conceder permissão para reprodução automática",
    neededAdditionalExtension:
      "Uma extensão adicional é necessária para suportar este site",
    audioFormatNotSupported: "O formato de áudio não é suportado",
    VOTAutoTranslate: "Traduzir ao abrir",
    VOTDontTranslateYourLang: "Não traduzir do meu idioma",
    VOTVolume: "Volume do vídeo",
    VOTVolumeTranslation: "Volume da tradução",
    VOTAutoSetVolume: "Reduzir o volume do vídeo para ",
    VOTShowVideoSlider: "Controle deslizante de volume do vídeo",
    VOTSyncVolume: "Ligar o volume da tradução e do vídeo",
    VOTAudioProxy: "Proxy de áudio recebido",
    VOTDisableFromYourLang:
      "VOT: Você desativou a tradução do vídeo no seu idioma",
    VOTLiveNotSupported:
      "VOT: A tradução de transmissões ao vivo não é suportada",
    VOTPremiere: "VOT: Aguarde o fim da estreia antes de traduzir",
    VOTVideoIsTooLong: "VOT: O vídeo é muito longo",
    VOTNoVideoIDFound: "VOT: Nenhum ID de vídeo encontrado",
    VOTFailedInitDB: "VOT: Falha ao inicializar o banco de dados",
    VOTDBNeedUpdate:
      "VOT: O banco de dados precisa de uma atualização, por favor recarregue a página",
    VOTDisabledForDBUpdating: `VOT está desativado devido a um erro ao atualizar o Banco de Dados. Feche todas as abas abertas com ${window.location.hostname} e tente novamente`,
    VOTFailedWriteToDB:
      "VOT: Não foi possível escrever os dados no banco de dados",
    VOTFailedReadFromDB:
      "VOT: Não foi possível recuperar os dados do banco de dados",
    Russian: "Russo",
    English: "Inglês",
    Chinese: "Chinês",
    French: "Francês",
    Italian: "Italiano",
    Spanish: "Espanhol",
    German: "Alemão",
    Korean: "Coreano",
    Japanese: "Japonês",
    Arabic: "Árabe",
    Bengali: "Bengali",
    Portuguese: "Português",
    Czech: "Tcheco",
    Hindi: "Hindi",
    Marathi: "Marathi",
    Telugu: "Telugu",
    Turkish: "Turco",
    Malay: "Malaio",
    Vietnamese: "Vietnamita",
    Tamil: "Tâmil",
    Javanese: "Javanês",
    Urdu: "Urdu",
    Persian: "Persa",
    Gujarati: "Gujarati",
    Indonesian: "Indonésio",
    Ukrainian: "Ucraniano",
    Kazakh: "Cazaque",
  },
  tr: {
    recommended: "önerilen",
    translateVideo: "Videoyu çevir",
    disableTranslate: "Kapat",
    translationSettings: "Çeviri ayarları",
    resetSettings: "Ayarları sıfırla",
    videoBeingTranslated: "Video çevriliyor",
    videoLanguage: "Video dili",
    translationLanguage: "Çeviri dili",
    translationTake: "Çeviri şu kadar sürecek",
    translationTakeMoreThanHour: "Çeviri bir saatten fazla sürecek",
    translationTakeAboutMinute: "Çeviri yaklaşık bir dakika sürecek",
    translationTakeFewMinutes: "Çeviri birkaç dakika sürecek",
    translationTakeApproximatelyMinutes:
      "Çeviri yaklaşık olarak {0} dakika sürecek",
    translationTakeApproximatelyMinute:
      "Çeviri yaklaşık olarak {0} dakika sürecek",
    unSupportedExtensionError: `Hata! ${GM_info.scriptHandler} bu sürümdeki uzantı tarafından desteklenmiyor!\n\nLütfen VOT uzantısının cloudflare sürümünü kullanın.`,
    requestTranslationFailed: "Video çevirisi isteği başarısız oldu",
    audioNotReceived: "Ses bağlantısı alınmadı",
    grantPermissionToAutoPlay: "Otomatik oynatma izni verin",
    neededAdditionalExtension:
      "Bu siteyi desteklemek için ek bir uzantı gerekiyor",
    audioFormatNotSupported: "Ses formatı desteklenmiyor",
    VOTAutoTranslate: "Açılışta çevir",
    VOTDontTranslateYourLang: "Dilimden çevirme yapma",
    VOTVolume: "Video sesi",
    VOTVolumeTranslation: "Çeviri Sesi",
    VOTAutoSetVolume: "Video sesini şu seviyeye düşür ",
    VOTShowVideoSlider: "Video sesi kaydırıcısı",
    VOTSyncVolume: "Çeviri ve video sesini bağla",
    VOTAudioProxy: "Alınan sesi vekil sunucuya yönlendir",
    VOTDisableFromYourLang:
      "VOT: Videoyu dilinizden çevirmeyi devre dışı bıraktınız",
    VOTLiveNotSupported: "VOT: Canlı yayınların çevirisi desteklenmiyor",
    VOTPremiere: "VOT: Çevirmek için prömiyerin bitmesini bekleyin",
    VOTVideoIsTooLong: "VOT: Video çok uzun",
    VOTNoVideoIDFound: "VOT: Video kimliği bulunamadı",
    VOTFailedInitDB: "VOT: Veritabanı başlatılamadı",
    VOTDBNeedUpdate:
      "VOT: Veritabanının güncellenmesi gerekiyor, lütfen sayfayı yenileyin",
    VOTDisabledForDBUpdating: `Veritabanını güncellerken bir hata nedeniyle VOT devre dışı bırakıldı. ${window.location.hostname} ile açık tüm sekmeleri kapatın ve tekrar deneyin`,
    VOTFailedWriteToDB: "VOT: Veritabanına veri yazılamadı",
    VOTFailedReadFromDB: "VOT: Veritabanından veri alınamadı",
    Russian: "Rusça",
    English: "İngilizce",
    Chinese: "Çince",
    French: "Fransızca",
    Italian: "İtalyanca",
    Spanish: "İspanyolca",
    German: "Almanca",
    Korean: "Korece",
    Japanese: "Japonca",
    Arabic: "Arapça",
    Bengali: "Bengalce",
    Portuguese: "Portekizce",
    Czech: "Çekçe",
    Hindi: "Hintçe",
    Marathi: "Marathi dili",
    Telugu: "Telugu dili",
    Turkish: "Türkçe",
    Malay: "Malayca",
    Vietnamese: "Vietnamca",
    Tamil: "Tamilce",
    Javanese: "Cava dili",
    Urdu: "Urduca",
    Persian: "Farsça",
    Gujarati: "Gucaratça",
    Indonesian: "Endonezce",
    Ukrainian: "Ukraynaca",
    Kazakh: "Kazak",
  },
  hi: {
    recommended: "अनुशंसित",
    translateVideo: "वीडियो अनुवाद करें",
    disableTranslate: "बंद करें",
    translationSettings: "अनुवाद सेटिंग्स",
    resetSettings: "सेटिंग्स रीसेट करें",
    videoBeingTranslated: "वीडियो का अनुवाद हो रहा है",
    videoLanguage: "वीडियो भाषा",
    translationLanguage: "अनुवाद भाषा",
    translationTake: "अनुवाद में समय लगेगा",
    translationTakeMoreThanHour: "अनुवाद में एक घंटे से अधिक समय लगेगा",
    translationTakeAboutMinute: "अनुवाद में लगभग एक मिनट लगेगा",
    translationTakeFewMinutes: "अनुवाद में कुछ मिनट लगेंगे",
    translationTakeApproximatelyMinutes: "अनुवाद में लगभग {0} मिनट लगेंगे",
    translationTakeApproximatelyMinute: "अनुवाद में लगभग {0} मिनट लगेंगे",
    unSupportedExtensionError: `त्रुटि! ${GM_info.scriptHandler} को इस संस्करण के एक्स्टेंसन द्वारा समर्थित नहीं किया जाता है!\n\nकृप्या VOT एक्स्टेंसन का cloudflare संस्करण प्रयोग करें।`,
    requestTranslationFailed: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    audioNotReceived: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    grantPermissionToAutoPlay: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    neededAdditionalExtension: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    audioFormatNotSupported: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTAutoTranslate: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTDontTranslateYourLang: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTVolume: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTVolumeTranslation: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTAutoSetVolume: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें ",
    VOTShowVideoSlider: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTSyncVolume: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTAudioProxy: "प्रत्यक्ष प्रसार के लिए प्रतीक्षा करें",
    VOTDisableFromYourLang:
      "VOT: आपने अपनी भाषा में वीडियो का अनुवाद करना बंद कर दिया है",
    VOTLiveNotSupported: "VOT: प्रत्यक्ष प्रसारण का अनुवाद समर्थित नहीं है",
    VOTPremiere:
      "VOT: अनुवाद करने से पहले प्रीमियर का अंत होने तक प्रतीक्षा करें",
    VOTVideoIsTooLong: "VOT: वीडियो बहुत लंबा है",
    VOTNoVideoIDFound: "VOT: कोई वीडियो ID नहीं मिली",
    VOTFailedInitDB: "VOT: डेटाबेस को प्रारंभ करने में विफल",
    VOTDBNeedUpdate:
      "VOT: डेटाबेस को अपडेट की आवश्यकता है, कृपया पृष्ठ को पुनः लोड करें",
    VOTDisabledForDBUpdating: `VOT, Database को अपडेट करते समय हुई त्रुटि के कारण, अक्षम है. ${window.location.hostname} के साथ सभी खुले टैब को बंद करें और पुनः प्रयास करें`,
    VOTFailedWriteToDB: "VOT: डेटाबेस में डेटा लिखा नहीं जा सका",
    VOTFailedReadFromDB: "VOT: डेटाबेस से डेटा प्राप्त नहीं हो सका",
    Russian: "रूसी",
    English: "अंग्रेजी",
    Chinese: "चीनी",
    French: "फ्रेंच",
    Italian: "इतालवी",
    Spanish: "स्पेनिश",
    German: "जर्मन",
    Korean: "कोरियाई",
    Japanese: "जापानी",
    Arabic: "अरबी",
    Bengali: "बंगाली",
    Portuguese: "पुर्तगाली",
    Czech: "चेक",
    Hindi: "हिन्दी",
    Marathi: "मराठी",
    Telugu: "तेलुगु",
    Turkish: "तुर्की",
    Malay: "मलय",
    Vietnamese: "वियतनामी",
    Tamil: "तमिल",
    Javanese: "जावानीस",
    Urdu: "उर्दू",
    Persian: "फारसी",
    Gujarati: "गुजराती",
    Indonesian: "इन्डोनेशियाई",
    Ukrainian: "यूक्रेनी",
    Kazakh: "कज़ाख",
  },
  vi: {
    recommended: "được khuyến nghị",
    translateVideo: "Dịch video",
    disableTranslate: "Tắt",
    translationSettings: "Cài đặt dịch",
    resetSettings: "Đặt lại cài đặt",
    videoBeingTranslated: "Video đang được dịch",
    videoLanguage: "Ngôn ngữ video",
    translationLanguage: "Ngôn ngữ dịch",
    translationTake: "Việc dịch sẽ mất",
    translationTakeMoreThanHour: "Việc dịch sẽ mất hơn một giờ",
    translationTakeAboutMinute: "Việc dịch sẽ mất khoảng một phút",
    translationTakeFewMinutes: "Việc dịch sẽ mất vài phút",
    translationTakeApproximatelyMinutes: "Việc dịch sẽ mất khoảng {0} phút",
    translationTakeApproximatelyMinute: "Việc dịch sẽ mất khoảng {0} phút",
    unSupportedExtensionError: `Lỗi! ${GM_info.scriptHandler} không được hỗ trợ bởi phiên bản này của tiện ích mở rộng!\n\nVui lòng sử dụng phiên bản cloudflare của tiện ích mở rộng VOT.`,
    requestTranslationFailed: "Không thể yêu cầu dịch video",
    audioNotReceived: "Không nhận được liên kết âm thanh",
    grantPermissionToAutoPlay: "Cấp quyền tự động phát",
    neededAdditionalExtension:
      "Cần thêm tiện ích mở rộng để hỗ trợ trang web này",
    audioFormatNotSupported: "Định dạng âm thanh không được hỗ trợ",
    VOTAutoTranslate: "Dịch khi mở",
    VOTDontTranslateYourLang: "Không dịch từ ngôn ngữ của tôi",
    VOTVolume: "Âm lượng video",
    VOTVolumeTranslation: "Âm lượng dịch",
    VOTAutoSetVolume: "Giảm âm lượng video xuống ",
    VOTShowVideoSlider: "Thanh trượt âm lượng video",
    VOTSyncVolume: "Liên kết âm lượng dịch và video",
    VOTAudioProxy: "Proxy âm thanh nhận được",
    VOTDisableFromYourLang:
      "VOT: Bạn đã tắt chức năng dịch video bằng ngôn ngữ của bạn",
    VOTLiveNotSupported: "VOT: Không hỗ trợ dịch trực tiếp",
    VOTPremiere: "VOT: Hãy đợi buổi ra mắt kết thúc trước khi dịch",
    VOTVideoIsTooLong: "VOT: Video quá dài",
    VOTNoVideoIDFound: "VOT: Không tìm thấy ID video",
    VOTFailedInitDB: "VOT: Không thể khởi tạo cơ sở dữ liệu",
    VOTDBNeedUpdate:
      "VOT: Cơ sở dữ liệu cần cập nhật, vui lòng tải lại trang web",
    VOTDisabledForDBUpdating: `VOT bị vô hiệu hóa do lỗi khi cập nhật Cơ sở dữ liệu. Đóng tất cả các tab đã mở với ${window.location.hostname} và thử lại`,
    VOTFailedWriteToDB: "VOT: Không thể ghi dữ liệu vào cơ sở dữ liệu",
    VOTFailedReadFromDB: "VOT: Không thể lấy dữ liệu từ cơ sở dữ liệu",
    Russian: "Tiếng Nga",
    English: "Tiếng Anh",
    Chinese: "Tiếng Trung Quốc",
    French: "Tiếng Pháp",
    Italian: "Tiếng Ý",
    Spanish: "Tiếng Tây Ban Nha",
    German: "Tiếng Đức",
    Korean: "Tiếng Hàn Quốc",
    Japanese: "Tiếng Nhật",
    Arabic: "Tiếng Ả Rập",
    Bengali: "Tiếng Bengal",
    Portuguese: "Tiếng Bồ Đào Nha",
    Czech: "Tiếng Séc",
    Hindi: "Tiếng Hindi",
    Marathi: "Tiếng Marathi",
    Telugu: "Tiếng Telugu",
    Turkish: "Tiếng Thổ Nhĩ Kỳ",
    Malay: "Tiếng Mã Lai",
    Vietnamese: "Tiếng Việt",
    Tamil: "Tiếng Tamil",
    Javanese: "Tiếng Java",
    Urdu: "Tiếng Urdu",
    Persian: "Tiếng Ba Tư",
    Gujarati: "Tiếng Gujarati",
    Indonesian: "Tiếng Indonesia",
    Ukrainian: "Tiếng Ukraina",
    Kazakh: "Tiếng Kazakh",
  },
  en: {
    recommended: "recommended",
    translateVideo: "Translate video",
    disableTranslate: "Turn off",
    translationSettings: "Translation settings",
    resetSettings: "Reset settings",
    videoBeingTranslated: "The video is being translated",
    videoLanguage: "Video language",
    translationLanguage: "Translation language",
    translationTake: "The translation will take",
    translationTakeMoreThanHour: "The translation will take more than an hour",
    translationTakeAboutMinute: "The translation will take about a minute",
    translationTakeFewMinutes: "The translation will take a few minutes",
    translationTakeApproximatelyMinutes:
      "The translation will take approximately {0} minutes",
    translationTakeApproximatelyMinute:
      "The translation will take approximately {0} minutes",
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} is not supported by this version of the extension!\n\nPlease use the cloudflare version of the VOT extension.`,
    requestTranslationFailed: "Failed to request video translation",
    audioNotReceived: "Audio link not received",
    grantPermissionToAutoPlay: "Grant permission to autoplay",
    neededAdditionalExtension:
      "An additional extension is needed to support this site",
    audioFormatNotSupported: "The audio format is not supported",
    VOTAutoTranslate: "Translate on open",
    VOTDontTranslateYourLang: "Do not translate from my language",
    VOTVolume: "Video volume",
    VOTVolumeTranslation: "Translation Volume",
    VOTAutoSetVolume: "Reduce video volume to ",
    VOTShowVideoSlider: "Video volume slider",
    VOTSyncVolume: "Link translation and video volume",
    VOTAudioProxy: "Proxy received audio",
    VOTDisableFromYourLang:
      "VOT: You have disabled the translation of the video in your language",
    VOTLiveNotSupported: "VOT: Translation of live streams is not supported",
    VOTPremiere: "VOT: Wait for the premiere to end before translating",
    VOTVideoIsTooLong: "VOT: Video is too long",
    VOTNoVideoIDFound: "VOT: No video ID found",
    VOTFailedInitDB: "VOT: Failed to initialize database",
    VOTDBNeedUpdate:
      "VOT: The database needs an update, please reload the page",
    VOTDisabledForDBUpdating: `VOT is disabled due to an error when updating the Database. Close all open tabs with ${window.location.hostname} and try again`,
    VOTFailedWriteToDB: "VOT: Data could not be written to the database",
    VOTFailedReadFromDB: "VOT: Data could not be retrieved from the database",
    Russian: "Russian",
    English: "English",
    Chinese: "Chinese",
    French: "French",
    Italian: "Italian",
    Spanish: "Spanish",
    German: "German",
    Korean: "Korean",
    Japanese: "Japanese",
    Arabic: "Arabic",
    Bengali: "Bengali",
    Portuguese: "Portuguese",
    Czech: "Czech",
    Hindi: "Hindi",
    Marathi: "Marathi",
    Telugu: "Telugu",
    Turkish: "Turkish",
    Malay: "Malay",
    Vietnamese: "Vietnamese",
    Tamil: "Tamil",
    Javanese: "Javanese",
    Urdu: "Urdu",
    Persian: "Persian",
    Gujarati: "Gujarati",
    Indonesian: "Indonesian",
    Ukrainian: "Ukrainian",
    Kazakh: "Kazakh",
  },
  zh: {
    recommended: "推荐使用",
    translateVideo: "翻译视频",
    disableTranslate: "关掉",
    translationSettings: "翻译需要一个多小时",
    resetSettings: "重置设置",
    videoBeingTranslated: "视频正在翻译中",
    videoLanguage: "视频语言",
    translationLanguage: "翻译语言",
    translationTake: "翻译将采取",
    translationTakeMoreThanHour: "翻译将采取一个多小时",
    translationTakeAboutMinute: "翻译将采取一分钟",
    translationTakeFewMinutes: "翻译将采取几分钟",
    translationTakeApproximatelyMinutes: "翻译将采取大约需要{0}分钟",
    translationTakeApproximatelyMinute: "翻译将采取大约需要{0}分钟",
    unSupportedExtensionError: `错误! 此版本的扩展不支持 ${GM_info.scriptHandler}!\n\n请使用cloudflare版本的VOT扩展.`,
    requestTranslationFailed: "请求视频翻译失败",
    audioNotReceived: "未收到音频链接",
    grantPermissionToAutoPlay: "授予自动播放权限",
    neededAdditionalExtension: "需要一个额外的扩展来支持这个网站",
    audioFormatNotSupported: "不支持音频格式",
    VOTAutoTranslate: "打开时翻译",
    VOTDontTranslateYourLang: "不要从你的语言翻译过来",
    VOTVolume: "视频量",
    VOTVolumeTranslation: "翻译量",
    VOTAutoSetVolume: "将视频音量降低到",
    VOTShowVideoSlider: "视频音量滑块",
    VOTSyncVolume: "链接翻译和视频音量",
    VOTAudioProxy: "代理接收的音频",
    VOTDisableFromYourLang: "VOT：你已经禁用了你的语言的视频翻译",
    VOTLiveNotSupported: "VOT：不支持直播流的翻译",
    VOTPremiere: "VOT：等待首映结束后再翻译",
    VOTVideoIsTooLong: "VOT：视频太长",
    VOTNoVideoIDFound: "VOT: 没有找到视频ID",
    VOTFailedInitDB: "VOT: 初始化数据库失败",
    VOTDBNeedUpdate: "VOT: 数据库需要更新,请重新加载页面",
    VOTDisabledForDBUpdating: `VOT由于更新数据库时出错而被禁用。 关闭所有打开的选项卡${window.location.hostname} 再试一次`,
    VOTFailedWriteToDB: "VOT: 无法将数据写入数据库",
    VOTFailedReadFromDB: "VOT: 无法从数据库中检索数据",
    Russian: "俄语",
    English: "英语",
    Chinese: "中文",
    French: "法语",
    Italian: "意大利语",
    Spanish: "西班牙语",
    German: "德语",
    Korean: "韩语",
    Japanese: "日语",
    Arabic: "阿拉伯语",
    Bengali: "孟加拉语",
    Portuguese: "葡萄牙语",
    Czech: "捷克语",
    Hindi: "印地语",
    Marathi: "马拉地语",
    Telugu: "泰卢固语",
    Turkish: "土耳其语",
    Malay: "马来语",
    Vietnamese: "越南语",
    Tamil: "泰米尔语",
    Javanese: "爪哇语",
    Urdu: "乌尔都语",
    Persian: "波斯语",
    Gujarati: "古吉拉特语",
    Indonesian: "印度尼西亚语",
    Ukrainian: "乌克兰语",
    Kazakh: "哈萨克语",
  },
  ar: {
    recommended: "موصى به",
    translateVideo: "ترجمة الفيديو",
    disableTranslate: "إيقاف التشغيل",
    translationSettings: "إعدادات الترجمة",
    resetSettings: "إعادة تعيين الإعدادات",
    videoBeingTranslated: "يتم ترجمة الفيديو",
    videoLanguage: "لغة الفيديو",
    translationLanguage: "لغة الترجمة",
    translationTake: "ستستغرق الترجمة",
    translationTakeMoreThanHour: "ستستغرق الترجمة أكثر من ساعة",
    translationTakeAboutMinute: "ستستغرق الترجمة حوالي دقيقة",
    translationTakeFewMinutes: "ستستغرق الترجمة بضع دقائق",
    translationTakeApproximatelyMinutes: "ستستغرق الترجمة تقريبا {0} دقائق",
    translationTakeApproximatelyMinute: "ستستغرق الترجمة تقريبا {0} دقيقة",
    unSupportedExtensionError: `خطأ! ${GM_info.scriptHandler} غير مدعوم من قبل هذه النسخة من الامتداد!\n\nيرجى استخدام نسخة cloudflare من امتداد VOT.`,
    requestTranslationFailed: "فشل طلب ترجمة الفيديو",
    audioNotReceived: "لم يتم استلام رابط الصوت",
    grantPermissionToAutoPlay: "السماح بالتشغيل التلقائي",
    neededAdditionalExtension: "هناك حاجة إلى امتداد إضافي لدعم هذا الموقع",
    audioFormatNotSupported: "تنسيق الصوت غير مدعوم",
    VOTAutoTranslate: "الترجمة عند الفتح",
    VOTDontTranslateYourLang: "لا تترجم من لغتي",
    VOTVolume: "حجم الفيديو",
    VOTVolumeTranslation: "حجم الترجمة",
    VOTAutoSetVolume: "خفض حجم الفيديو إلى ",
    VOTShowVideoSlider: "شريط تحكم حجم الفيديو",
    VOTSyncVolume: "اربط حجم الترجمة والفيديو",
    VOTAudioProxy: "الصوت المستلم عبر وكيل",
    VOTDisableFromYourLang: "VOT: لقد قمت بتعطيل ترجمة الفيديو بلغتك",
    VOTLiveNotSupported: "VOT: لا يتم دعم ترجمة البث المباشر",
    VOTPremiere: "VOT: انتظر حتى ينتهي العرض الأول قبل الترجمة",
    VOTVideoIsTooLong: "VOT: الفيديو طويل جداً",
    VOTNoVideoIDFound: "VOT: لم يتم العثور على معرف الفيديو",
    VOTFailedInitDB: "VOT: فشل في تهيئة قاعدة البيانات",
    VOTDBNeedUpdate:
      "VOT: تحتاج قاعدة البيانات إلى تحديث، يرجى إعادة تحميل الصفحة",
    VOTDisabledForDBUpdating: `VOT معطل بسبب خطأ عند تحديث قاعدة البيانات. أغلق جميع علامات التبويب المفتوحة مع ${window.location.hostname} وحاول مرة أخرى`,
    VOTFailedWriteToDB: "VOT: لم يتمكن من كتابة البيانات إلى قاعدة البيانات",
    VOTFailedReadFromDB: "VOT: لم يتمكن من استرداد البيانات من قاعدة البيانات",
    Russian: "الروسية",
    English: "الإنجليزية",
    Chinese: "الصينية",
    French: "الفرنسية",
    Italian: "الإيطالية",
    Spanish: "الإسبانية",
    German: "الألمانية",
    Korean: "الكورية",
    Japanese: "اليابانية",
    Arabic: "العربية",
    Bengali: "البنغالية",
    Portuguese: "البرتغالية",
    Czech: "التشيكية",
    Hindi: "الهندية",
    Marathi: "الماراثية",
    Telugu: "التيلجو",
    Turkish: "التركية",
    Malay: "الملايو",
    Vietnamese: "الفيتنامية",
    Tamil: "التاميلية",
    Javanese: "الجاوية",
    Urdu: "الأردية",
    Persian: "الفارسية",
    Gujarati: "الغوجاراتية",
    Indonesian: "الإندونيسية",
    Ukrainian: "الأوكرانية",
    Kazakh: "الكازاخستانية",
  },
  ko: {
    recommended: "추천",
    translateVideo: "비디오 번역",
    disableTranslate: "끄기",
    translationSettings: "번역 설정",
    resetSettings: "설정 초기화",
    videoBeingTranslated: "비디오가 번역되고 있습니다",
    videoLanguage: "비디오 언어",
    translationLanguage: "번역 언어",
    translationTake: "번역에 걸리는 시간",
    translationTakeMoreThanHour: "번역에 1시간 이상 걸립니다",
    translationTakeAboutMinute: "번역에 약 1분 걸립니다",
    translationTakeFewMinutes: "번역에 몇 분 걸립니다",
    translationTakeApproximatelyMinutes: "번역에 약 {0}분 걸립니다",
    translationTakeApproximatelyMinute: "번역에 약 {0}분 걸립니다",
    unSupportedExtensionError: `오류! ${GM_info.scriptHandler}는 이 버전의 확장 프로그램에서 지원되지 않습니다!\n\nVOT 확장 프로그램의 클라우드플레어 버전을 사용하십시오.`,
    requestTranslationFailed: "비디오 번역 요청 실패",
    audioNotReceived: "오디오 링크를 받지 못했습니다",
    grantPermissionToAutoPlay: "자동 재생 권한 부여",
    neededAdditionalExtension:
      "이 사이트를 지원하기 위해 추가 확장 프로그램이 필요합니다",
    audioFormatNotSupported: "오디오 형식이 지원되지 않습니다",
    VOTAutoTranslate: "열 때 번역하기",
    VOTDontTranslateYourLang: "내 언어에서 번역하지 않기",
    VOTVolume: "비디오 볼륨",
    VOTVolumeTranslation: "번역 볼륨",
    VOTAutoSetVolume: "비디오 볼륨을 줄입니다 ",
    VOTShowVideoSlider: "비디오 볼륨 슬라이더",
    VOTSyncVolume: "번역과 비디오 볼륨 연동하기",
    VOTAudioProxy: "프록시로 오디오 받기",
    VOTDisableFromYourLang:
      "VOT: 내 언어로 된 비디오의 번역을 비활성화했습니다",
    VOTLiveNotSupported: "VOT: 라이브 스트림의 번역은 지원되지 않습니다",
    VOTPremiere: "VOT: 번역하기 전에 프리미어가 끝날 때까지 기다리십시오",
    VOTVideoIsTooLong: "VOT: 비디오가 너무 깁니다",
    VOTNoVideoIDFound: "VOT: 비디오 ID를 찾을 수 없습니다",
    VOTFailedInitDB: "VOT: 데이터베이스 초기화 실패",
    VOTDBNeedUpdate:
      "VOT: 데이터베이스가 업데이트가 필요합니다. 페이지를 새로고침하십시오",
    VOTDisabledForDBUpdating: `데이터베이스 업데이트 오류로 인해 VOT가 비활성화되었습니다. ${window.location.hostname}와 열려 있는 모든 탭을 닫고 다시 시도하십시오`,
    VOTFailedWriteToDB: "VOT: 데이터베이스에 데이터를 쓸 수 없습니다",
    VOTFailedReadFromDB: "VOT: 데이터베이스에서 데이터를 읽을 수 없습니다",
    Russian: "러시아어",
    English: "영어",
    Chinese: "중국어",
    French: "프랑스어",
    Italian: "이탈리아어",
    Spanish: "스페인어",
    German: "독일어",
    Korean: "한국어",
    Japanese: "일본어",
    Arabic: "아랍어",
    Bengali: "벵골어",
    Portuguese: "포르투갈어",
    Czech: "체코어",
    Hindi: "힌디어",
    Marathi: "마라티어",
    Telugu: "텔루구어",
    Turkish: "터키어",
    Malay: "말레이어",
    Vietnamese: "베트남어",
    Tamil: "타밀어",
    Javanese: "자바어",
    Urdu: "우르두어",
    Persian: "페르시아어",
    Gujarati: "구자라트어",
    Indonesian: "인도네시아어",
    Ukrainian: "우크라이나어",
    Kazakh: "카자흐어",
  },
  de: {
    recommended: "es wird empfohlen",
    translateVideo: "Video übersetzen",
    disableTranslate: "Ausschalten",
    translationSettings: "Übersetzungseinstellungen",
    resetSettings: "Einstellungen zurücksetzen",
    videoBeingTranslated: "Das Video wird übersetzt",
    videoLanguage: "Sprache Video",
    translationLanguage: "Zielsprache",
    translationTake: "Die Übersetzung dauert",
    translationTakeMoreThanHour: "Die Übersetzung dauert mehr als eine Stunde",
    translationTakeAboutMinute: "Die Übersetzung dauert ungefähr eine Minute",
    translationTakeFewMinutes: "Die Übersetzung dauert einige Minuten",
    translationTakeApproximatelyMinutes:
      "Die Übersetzung dauert ungefähr {0} Minuten",
    translationTakeApproximatelyMinute:
      "Die Übersetzung dauert ungefähr {0} Minuten",
    unSupportedExtensionError: `Fehler! ${GM_info.scriptHandler} wird von dieser Version der Erweiterung nicht unterstützt!\n\nBitte verwenden Sie die Cloudflare-Version der VOT-Erweiterung.`,
    requestTranslationFailed:
      "Videoübersetzung konnte nicht angefordert werden",
    audioNotReceived: "Audiolink nicht empfangen",
    grantPermissionToAutoPlay:
      "Erteilen Sie die Berechtigung zur automatischen Wiedergabe",
    neededAdditionalExtension:
      "Eine zusätzliche Erweiterung ist erforderlich, um diese Website zu unterstützen",
    audioFormatNotSupported: "Das Audioformat wird nicht unterstützt",
    VOTAutoTranslate: "Beim Öffnen übersetzen",
    VOTDontTranslateYourLang: "Nicht aus Ihrer Sprache übersetzen",
    VOTVolume: "Video Lautstärke",
    VOTVolumeTranslation: "Übersetzungsvolumen",
    VOTAutoSetVolume: "Video-Lautstärke auf reduzieren ",
    VOTShowVideoSlider: "Video-Lautstärkeregler",
    VOTSyncVolume: "Übersetzungs- und Videolautstärke verknüpfen",
    VOTAudioProxy: "Empfangenes Audio proxyen",
    VOTDisableFromYourLang:
      "VOT: Sie haben die Übersetzung des Videos in Ihrer Sprache deaktiviert",
    VOTLiveNotSupported:
      "VOT: Übersetzung von Live-Streams wird nicht unterstützt",
    VOTPremiere:
      "VOT: Warten Sie, bis die Premiere beendet ist, bevor Sie übersetzen",
    VOTVideoIsTooLong: "VOT: Video ist zu lang",
    VOTNoVideoIDFound: "VOT: Keine Video-ID gefunden",
    VOTFailedInitDB: "VOT: Datenbank konnte nicht initialisiert werden",
    VOTDBNeedUpdate:
      "VOT: Die Datenbank muss aktualisiert werden, bitte laden Sie die Seite neu",
    VOTDisabledForDBUpdating: `VOT wurde aufgrund eines Fehlers beim Aktualisieren der Datenbank deaktiviert. Schließen Sie alle geöffneten Tabs mit ${window.location.hostname} und versuchen Sie es erneut`,
    VOTFailedWriteToDB:
      "VOT: Daten konnten nicht in die Datenbank geschrieben werden",
    VOTFailedReadFromDB: "VOT: Konnte keine Daten aus der Datenbank abrufen",
    Russian: "Russisch",
    English: "Englisch",
    Chinese: "Chinesisch",
    French: "Französisch",
    Italian: "Italienisch",
    Spanish: "Spanisch",
    German: "Deutsch",
    Korean: "Koreanisch",
    Japanese: "Japanisch",
    Arabic: "Arabisch",
    Bengali: "Bengalisch",
    Portuguese: "Portugiesisch",
    Czech: "Tschechisch",
    Hindi: "Hindi",
    Marathi: "Marathi",
    Telugu: "Telugu",
    Turkish: "Türkisch",
    Malay: "Malaiisch",
    Vietnamese: "Vietnamesisch",
    Tamil: "Tamil",
    Javanese: "Javanisch",
    Urdu: "Urdu",
    Persian: "Persisch",
    Gujarati: "Gujarati",
    Indonesian: "Indonesisch",
    Ukrainian: "Ukrainisch",
    Kazakh: "Kasachisch",
  },
  es: {
    recommended: "es recomendable",
    translateVideo: "Traducir video",
    disableTranslate: "Apagar",
    translationSettings: "Ajustes de traducción",
    resetSettings: "Restablecer ajustes",
    videoBeingTranslated: "El video está siendo traducido",
    videoLanguage: "Idioma del video",
    translationLanguage: "Idioma de la traducción",
    translationTake: "La traducción tardará",
    translationTakeMoreThanHour: "La traducción tardará más de una hora",
    translationTakeAboutMinute:
      "La traducción tardará aproximadamente un minuto",
    translationTakeFewMinutes: "La traducción tardará unos minutos",
    translationTakeApproximatelyMinutes:
      "La traducción tardará aproximadamente {0} minutos",
    translationTakeApproximatelyMinute:
      "La traducción tardará aproximadamente {0} minutos",
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} no es compatible con esta versión de la extensión!\n\nUtilice la versión cloudflare de la extensión VOT.`,
    requestTranslationFailed: "Error al solicitar la traducción de vídeo",
    audioNotReceived: "Audiolink nicht empfangen",
    grantPermissionToAutoPlay: "Conceder permiso de reproducción automática",
    neededAdditionalExtension:
      "Se necesita una extensión adicional para admitir este sitio",
    audioFormatNotSupported: "El formato de audio no es compatible",
    VOTAutoTranslate: "Traducir al abrir",
    VOTDontTranslateYourLang: "No traduzca de su lengua",
    VOTVolume: "Volumen de vídeo",
    VOTVolumeTranslation: "Volumen de traducción",
    VOTAutoSetVolume: "Reducir el volumen del video al ",
    VOTShowVideoSlider: "Deslizador de volumen de video",
    VOTSyncVolume: "Vincular el volumen de traducción y video",
    VOTAudioProxy: "Proxificar el audio recibido",
    VOTDisableFromYourLang:
      "VOT: Ha desactivado la traducción del vídeo en su idioma",
    VOTLiveNotSupported:
      "VOT: No se admite la traducción de transmisiones en vivo",
    VOTPremiere: "VOT: Espere a que termine el estreno antes de traducir",
    VOTVideoIsTooLong: "VOT: El video es demasiado largo",
    VOTNoVideoIDFound: "VOT: No se encontró id de video",
    VOTFailedInitDB: "VOT: No se pudo inicializar la base de datos",
    VOTDBNeedUpdate:
      "VOT: la Base de datos necesita una actualización, por favor vuelva a cargar la página",
    VOTDisabledForDBUpdating: `VOT está deshabilitado debido a un error al actualizar la Base de Datos. Cierre todas las pestañas abiertas con ${window.location.hostname} y vuelve a intentarlo`,
    VOTFailedWriteToDB: "VOT: No se pudo escribir datos en la base de datos",
    VOTFailedReadFromDB: "VOT: No se pudo recuperar datos de la base de datos",
    Russian: "Ruso",
    English: "Inglés",
    Chinese: "Chino",
    French: "Francés",
    Italian: "Italiano",
    Spanish: "Español",
    German: "Alemán",
    Korean: "Coreano",
    Japanese: "Japonés",
    Arabic: "Árabe",
    Bengali: "Bengalí",
    Portuguese: "Portugués",
    Czech: "Checo",
    Hindi: "Hindi",
    Marathi: "Maratí",
    Telugu: "Telugu",
    Turkish: "Turco",
    Malay: "Malayo",
    Vietnamese: "Vietnamita",
    Tamil: "Tamil",
    Javanese: "Javanés",
    Urdu: "Urdu",
    Persian: "Persa",
    Gujarati: "Gujarati",
    Indonesian: "Indonesio",
    Ukrainian: "Ucraniano",
    Kazakh: "Kazaja",
  },
  fr: {
    recommended: "recommande",
    translateVideo: "Traduire la vidéo",
    disableTranslate: "Désactiver",
    translationSettings: "Paramètres de traduction",
    resetSettings: "Réinitialiser les paramètres",
    videoBeingTranslated: "La vidéo est en cours de traduction",
    videoLanguage: "Langue vidéo",
    translationLanguage: "Langue cible",
    translationTake: "La traduction prendra",
    translationTakeMoreThanHour: "La traduction prendra plus d'une heure",
    translationTakeAboutMinute: "La traduction prendra environ une minute",
    translationTakeFewMinutes: "La traduction prendra quelques minutes",
    translationTakeApproximatelyMinutes:
      "La traduction prendra environ {0} minutes",
    translationTakeApproximatelyMinute:
      "La traduction prendra environ {0} minutes",
    unSupportedExtensionError: `Erreur! ${GM_info.scriptHandler} n'est pas supporté par cette version de l'extension!!\n\nVeuillez utiliser la version cloudflare de l'extension VOT.`,
    requestTranslationFailed:
      "Impossible de demander la traduction de la vidéo",
    audioNotReceived: "Lien audio non reçu",
    grantPermissionToAutoPlay: "Accorder l'autorisation de lecture automatique",
    neededAdditionalExtension:
      "Une extension supplémentaire est nécessaire pour prendre en charge ce site",
    audioFormatNotSupported: "Format audio non pris en charge",
    VOTAutoTranslate: "Traduire à l'ouverture",
    VOTDontTranslateYourLang: "Ne pas traduire à partir de votre langue",
    VOTVolume: "Volume de la vidéo",
    VOTVolumeTranslation: "Volume de traduction",
    VOTAutoSetVolume: "Réduire le volume de la vidéo à ",
    VOTShowVideoSlider: "Curseur de volume vidéo",
    VOTSyncVolume: "Lier le volume de la traduction et de la vidéo",
    VOTAudioProxy: "Proxy audio reçu",
    VOTDisableFromYourLang:
      "VOT: Vous avez désactivé la traduction de la vidéo dans votre langue",
    VOTLiveNotSupported:
      "VOT: La traduction des flux en direct n'est pas prise en charge",
    VOTPremiere: "VOT: Attendez la fin de la première avant de traduire",
    VOTVideoIsTooLong: "VOT: La vidéo est trop longue",
    VOTNoVideoIDFound: "VOT: ID vidéo introuvable",
    VOTFailedInitDB: "VOT: Impossible d'initialiser la base de données",
    VOTDBNeedUpdate:
      "VOT: la Base de données a besoin d'une mise à jour, veuillez recharger la page",
    VOTDisabledForDBUpdating: `VOT est désactivé en raison d'une erreur lors de la mise à jour de la Base de Données. Fermez tous les onglets ouverts avec ${window.location.hostname} et essayez à nouveau`,
    VOTFailedWriteToDB:
      "VOT: Impossible d'écrire les données dans la base de données",
    VOTFailedReadFromDB:
      "VOT: Impossible de récupérer les données de la base de données",
    Russian: "Russe",
    English: "Anglais",
    Chinese: "Chinois",
    French: "Français",
    Italian: "Italien",
    Spanish: "Espagnol",
    German: "Allemand",
    Korean: "Coréen",
    Japanese: "Japonais",
    Arabic: "Arabe",
    Bengali: "Bengali",
    Portuguese: "Portugais",
    Czech: "Tchèque",
    Hindi: "Hindi",
    Marathi: "Marathi",
    Telugu: "Télougou",
    Turkish: "Turc",
    Malay: "Malais",
    Vietnamese: "Vietnamien",
    Tamil: "Tamoul",
    Javanese: "Javanais",
    Urdu: "Ourdou",
    Persian: "Persan",
    Gujarati: "Gujarati",
    Indonesian: "Indonésien",
    Ukrainian: "Ukrainien",
    Kazakh: "Kazakh",
  },
  it: {
    recommended: "è consigliabile",
    translateVideo: "Traduci il video",
    disableTranslate: "Spegnere",
    translationSettings: "Impostazioni di traduzione",
    resetSettings: "Ripristina impostazioni",
    videoBeingTranslated: "Il video è in fase di traduzione",
    videoLanguage: "Lingua Video",
    translationLanguage: "Lingua di traduzione",
    translationTake: "La traduzione richiederà",
    translationTakeMoreThanHour: "La traduzione richiederà più di un'ora",
    translationTakeAboutMinute: "La traduzione richiederà circa un minuto",
    translationTakeFewMinutes: "La traduzione richiederà alcuni minuti",
    translationTakeApproximatelyMinutes:
      "La traduzione richiederà circa {0} minuti",
    translationTakeApproximatelyMinute:
      "La traduzione richiederà circa {0} minuti",
    unSupportedExtensionError: `Errore! ${GM_info.scriptHandler} non è supportato da questa versione dell'estensione!\n\nUtilizzare la versione cloudflare dell'estensione VOT.`,
    requestTranslationFailed: "Richiesta di traduzione video non riuscita",
    audioNotReceived: "Collegamento audio non ricevuto",
    grantPermissionToAutoPlay:
      "Concedere l'Autorizzazione per la riproduzione automatica",
    neededAdditionalExtension:
      "Per supportare questo sito è necessaria un'estensione aggiuntiva",
    audioFormatNotSupported: "Il formato audio non è supportato",
    VOTAutoTranslate: "Traduci all'apertura",
    VOTDontTranslateYourLang: "Non traducete dalla vostra lingua",
    VOTVolume: "Volume video",
    VOTVolumeTranslation: "Volume di traduzione",
    VOTAutoSetVolume: "Riduci il volume del video al ",
    VOTShowVideoSlider: "Cursore del volume del video",
    VOTSyncVolume: "Collega il volume della traduzione e del video",
    VOTAudioProxy: "Proxy audio ricevuto",
    VOTDisableFromYourLang:
      "VOT: Avete disabilitato la traduzione del video nella vostra lingua",
    VOTLiveNotSupported:
      "VOT: La traduzione dei flussi dal vivo non è supportata",
    VOTPremiere: "VOT: Aspetta che la prima finisca prima di tradurre",
    VOTVideoIsTooLong: "VOT: Il video è troppo lungo",
    VOTNoVideoIDFound: "VOT: ID video non trovato",
    VOTFailedInitDB: "VOT: Impossibile inizializzare il database",
    VOTDBNeedUpdate:
      "VOT: Il database ha bisogno di aggiornamento, si prega di ricaricare la pagina",
    VOTDisabledForDBUpdating: `VOT è disabilitato a causa di un errore durante l'aggiornamento del database. CHIUDI tutte le schede aperte con ${window.location.hostname} e riprova`,
    VOTFailedWriteToDB: "VOT: Impossibile scrivere dati nel database",
    VOTFailedReadFromDB: "VOT: Impossibile recuperare i dati dal database",
    Russian: "Russo",
    English: "Inglese",
    Chinese: "Cinese",
    French: "Francese",
    Italian: "Italiano",
    Spanish: "Spagnolo",
    German: "Tedesco",
    Korean: "Coreano",
    Japanese: "Giapponese",
    Arabic: "Arabo",
    Bengali: "Bengalese",
    Portuguese: "Portoghese",
    Czech: "Ceco",
    Hindi: "Hindi",
    Marathi: "Marathi",
    Telugu: "Telugu",
    Turkish: "Turco",
    Malay: "Malese",
    Vietnamese: "Vietnamita",
    Tamil: "Tamil",
    Javanese: "Giavanese",
    Urdu: "Urdu",
    Persian: "Persiano",
    Gujarati: "Gujarati",
    Indonesian: "Indonesiano",
    Ukrainian: "Ucraino",
    Kazakh: "Kasako",
  },
  ja: {
    recommended: "おすすめ",
    translateVideo: "動画を翻訳する",
    disableTranslate: "オフにする",
    translationSettings: "翻訳設定",
    resetSettings: "設定をリセットする",
    videoBeingTranslated: "動画が翻訳されています",
    videoLanguage: "動画の言語",
    translationLanguage: "翻訳言語",
    translationTake: "翻訳にかかる時間は",
    translationTakeMoreThanHour: "翻訳には1時間以上かかります",
    translationTakeAboutMinute: "翻訳には約1分かかります",
    translationTakeFewMinutes: "翻訳には数分かかります",
    translationTakeApproximatelyMinutes: "翻訳には約{0}分かかります",
    translationTakeApproximatelyMinute: "翻訳には約{0}分かかります",
    unSupportedExtensionError: `エラー！ ${GM_info.scriptHandler} はこのバージョンの拡張機能ではサポートされていません！\n\nVOT拡張機能のcloudflareバージョンを使用してください。`,
    requestTranslationFailed: "動画の翻訳リクエストに失敗しました",
    audioNotReceived: "音声リンクが受信されませんでした",
    grantPermissionToAutoPlay: "自動再生の権限を付与する",
    neededAdditionalExtension:
      "このサイトをサポートするために追加の拡張機能が必要です",
    audioFormatNotSupported: "音声形式がサポートされていません",
    VOTAutoTranslate: "開いたときに翻訳する",
    VOTDontTranslateYourLang: "自分の言語からは翻訳しない",
    VOTVolume: "動画の音量",
    VOTVolumeTranslation: "翻訳の音量",
    VOTAutoSetVolume: "動画の音量を ",
    VOTShowVideoSlider: "動画の音量スライダー",
    VOTSyncVolume: "バインド翻訳とビデオボリューム",
    VOTAudioProxy: "プロキシで受信した音声",
    VOTDisableFromYourLang: "VOT：あなたの言語での動画の翻訳を無効にしました",
    VOTLiveNotSupported: "VOT：ライブストリームの翻訳はサポートされていません",
    VOTPremiere: "VOT：プレミアが終わるまで待ってから翻訳してください",
    VOTVideoIsTooLong: "VOT：動画が長すぎます",
    VOTNoVideoIDFound: "VOT：動画IDが見つかりませんでした",
    VOTFailedInitDB: "VOT：データベースの初期化に失敗しました",
    VOTDBNeedUpdate:
      "VOT：データベースを更新する必要があります。ページを再読み込みしてください。",
    VOTDisabledForDBUpdating: `データベース更新時のエラーのため、VOTは無効になっています。${window.location.hostname} を開いているすべてのタブを閉じて、もう一度お試しください。`,
    VOTFailedWriteToDB: "VOT：データベースにデータを書き込めませんでした。",
    VOTFailedReadFromDB: "VOT：データベースからデータを取得できませんでした。",
    Russian: "ロシア語",
    English: "英語",
    Chinese: "中国語",
    French: "フランス語",
    Italian: "イタリア語",
    Spanish: "スペイン語",
    German: "ドイツ語",
    Korean: "韓国語",
    Japanese: "日本語",
    Arabic: "アラビア語",
    Bengali: "ベンガル語",
    Portuguese: "ポルトガル語",
    Czech: "チェコ語",
    Hindi: "ヒンディー語",
    Marathi: "マラーティー語",
    Telugu: "テルグ語",
    Turkish: "トルコ語",
    Malay: "マレー語",
    Vietnamese: "ベトナム語",
    Tamil: "タミル語",
    Javanese: "ジャワ語",
    Urdu: "ウルドゥー語",
    Persian: "ペルシア語",
    Gujarati: "グジャラート語",
    Indonesian: "インドネシア語",
    Ukrainian: "ウクライナ語",
    Kazakh: "カザフ語",
  },
  cs: {
    recommended: "doporučeno",
    translateVideo: "Přeložit video",
    disableTranslate: "Vypnout",
    translationSettings: "Nastavení překladu",
    resetSettings: "Obnovit nastavení",
    videoBeingTranslated: "Video se překládá",
    videoLanguage: "Jazyk videa",
    translationLanguage: "Jazyk překladu",
    translationTake: "Překlad potrvá",
    translationTakeMoreThanHour: "Překlad potrvá více než hodinu",
    translationTakeAboutMinute: "Překlad potrvá asi minutu",
    translationTakeFewMinutes: "Překlad potrvá několik minut",
    translationTakeApproximatelyMinutes: "Překlad potrvá přibližně {0} minut",
    translationTakeApproximatelyMinute: "Překlad potrvá přibližně {0} minutu",
    unSupportedExtensionError: `Chyba! ${GM_info.scriptHandler} není podporován touto verzí rozšíření!\n\nProsím použijte cloudflare verzi rozšíření VOT.`,
    requestTranslationFailed: "Nepodařilo se požádat o překlad videa",
    audioNotReceived: "Nebyl přijat odkaz na zvuk",
    grantPermissionToAutoPlay: "Udělit oprávnění k automatickému přehrávání",
    neededAdditionalExtension:
      "Pro podporu tohoto webu je potřeba další rozšíření",
    audioFormatNotSupported: "Formát zvuku není podporován",
    VOTAutoTranslate: "Přeložit při otevření",
    VOTDontTranslateYourLang: "Nepřekládat z mého jazyka",
    VOTVolume: "Hlasitost videa",
    VOTVolumeTranslation: "Hlasitost překladu",
    VOTAutoSetVolume: "Snížit hlasitost videa na ",
    VOTShowVideoSlider: "Posuvník hlasitosti videa",
    VOTSyncVolume: "Propojit hlasitost překladu a videa",
    VOTAudioProxy: "Proxy pro přijatý zvuk",
    VOTDisableFromYourLang: "VOT: Zakázali jste překlad videa ve vašem jazyce",
    VOTLiveNotSupported: "VOT: Překlad živých vysílání není podporován",
    VOTPremiere: "VOT: Počkejte, až skončí premiéra, než začnete překládat",
    VOTVideoIsTooLong: "VOT: Video je příliš dlouhé",
    VOTNoVideoIDFound: "VOT: Nebylo nalezeno ID videa",
    VOTFailedInitDB: "VOT: Nepodařilo se inicializovat databázi",
    VOTDBNeedUpdate:
      "VOT: Databáze potřebuje aktualizaci, prosím obnovte stránku",
    VOTDisabledForDBUpdating: `VOT je zakázán kvůli chybě při aktualizaci databáze. Zavřete všechny otevřené karty s ${window.location.hostname} a zkuste to znovu`,
    VOTFailedWriteToDB: "VOT: Data se nepodařilo zapsat do databáze",
    VOTFailedReadFromDB: "VOT: Data se nepodařilo načíst z databáze",
    Russian: "Ruština",
    English: "Angličtina",
    Chinese: "Čínština",
    French: "Francouzština",
    Italian: "Italština",
    Spanish: "Španělština",
    German: "Němčina",
    Korean: "Korejština",
    Japanese: "Japonština",
    Arabic: "Arabština",
    Bengali: "Bengálština",
    Portuguese: "Portugalština",
    Czech: "Čeština",
    Hindi: "Hindština",
    Marathi: "Maráthština",
    Telugu: "Telugština",
    Turkish: "Turečtina",
    Malay: "Malajština",
    Vietnamese: "Vietnamština",
    Tamil: "Tamilština",
    Javanese: "Jávština",
    Urdu: "Urdština",
    Persian: "Perština",
    Gujarati: "Gudžarátština",
    Indonesian: "Indonéština",
    Ukrainian: "Ukrajinština",
    Kazakh: "Kazašský",
  },
  kk: {
    recommended: "ұсынылатын",
    translateVideo: "Бейне тілін аудару",
    disableTranslate: "Өшіру",
    translationSettings: "Аудару параметрлері",
    resetSettings: "Параметрлерді қалпына келтіру",
    videoBeingTranslated: "Бейне аударылуда",
    videoLanguage: "Бейне тілі",
    translationLanguage: "Аудару тілі",
    translationTake: "Аудару көзететін уақыт",
    translationTakeMoreThanHour: "Аудару бір сағаттан артық уақыт алады",
    translationTakeAboutMinute: "Аудару бір минуттан аз уақыт алады",
    translationTakeFewMinutes: "Аудару бірнеше минуттан аз уақыт алады",
    translationTakeApproximatelyMinutes:
      "Аудару жағдайында тағы {0} минут тұрады",
    translationTakeApproximatelyMinute:
      "Аудару жағдайында тағы {0} минут тұрады",
    unSupportedExtensionError: `Қате! ${GM_info.scriptHandler} көмекшілікті бұл нұсқасымен қолдаулары жоқ!\n\nVOT көмекшілігінің cloudflare-нұсқасын пайдаланыңыз.`,
    requestTranslationFailed: "Бейненің аударуын сұрау сәтсіз аяқталды",
    audioNotReceived: "Аудиоға сілтеме алынбады",
    grantPermissionToAutoPlay: "Автоматты түрде ойнатуға рұқсат беріңіз",
    neededAdditionalExtension: "Бұл сайты қолдау үшін қосымша көмекшілік керек",
    audioFormatNotSupported: "Аудио пішімі қолдаулы емес",
    VOTAutoTranslate: "Ашылғанда аудару",
    VOTDontTranslateYourLang: "Туылған тілді аудармау",
    VOTVolume: "Бейне тыңдауы",
    VOTVolumeTranslation: "Аудару тыңдауы",
    VOTAutoSetVolume: "Бейненің тыңдауын бұзу",
    VOTShowVideoSlider: "Бейне тыңдауы сызғышы",
    VOTSyncVolume: "Аудару тыңдауын бейненің тыңдауына байланыстыру",
    VOTAudioProxy: "Алынған аудионы прокси",
    VOTDisableFromYourLang: "VOT: Сіздің тіліңіздегі бейнені аудармау",
    VOTLiveNotSupported:
      "VOT: Жылжымайтын трансляцияларды аудару қолдаулы емес",
    VOTPremiere: "VOT: Алдын ала шоу аяқталғаннан кейін аударыңыз",
    VOTVideoIsTooLong: "VOT: Бейне тым ұзын",
    VOTNoVideoIDFound: "VOT: Бейне ID табылмады",
    VOTFailedInitDB: "VOT: Деректер қорытындысын іске қосу сәтсіз аяқталды",
    VOTDBNeedUpdate:
      "VOT: Деректер қорытындысын жаңарту керек, жаңарту үшін бетті қайта жүктеңіз",
    VOTDisabledForDBUpdating: `VOT: Деректер базасын жаңарту қатесінен VOT өшірілді. ${window.location.hostname} сайтындағы барлық терезелерді жабыңыз және қайтадан көріңіз`,
    VOTFailedWriteToDB:
      "VOT: Деректер базасына деректерді жазу сәтсіз аяқталды",
    VOTFailedReadFromDB:
      "VOT: Деректер базасынан деректерді оқу сәтсіз аяқталды",
    Russian: "Орыс",
    English: "Ағылшын",
    Chinese: "Қытай",
    French: "Француз",
    Italian: "Итальян",
    Spanish: "Испан",
    German: "Неміс",
    Korean: "Корей",
    Japanese: "Жапон",
    Arabic: "Араб",
    Bengali: "Бенгал",
    Portuguese: "Португал",
    Czech: "Чех",
    Hindi: "Ҳинд",
    Marathi: "Маратхи",
    Telugu: "Телугу",
    Turkish: "Түрік",
    Malay: "Малай",
    Vietnamese: "Вьетнам",
    Tamil: "Тамил",
    Javanese: "Ява",
    Urdu: "Урду",
    Persian: "Парсы",
    Gujarati: "Гуджарати",
    Indonesian: "Индонезиялық",
    Ukrainian: "Украин",
    Kazakh: "Қазақша",
  },
};



;// CONCATENATED MODULE: ./src/utils/debug.js
const debug = {};
debug.log = (...text) => {
  if (true) {
    return;
  }
  return console.log(
    "%c[VOT DEBUG]",
    "background: #F2452D; color: #fff; padding: 5px;",
    ...text
  );
};

/* harmony default export */ const utils_debug = (debug);

;// CONCATENATED MODULE: ./src/menu.js



const userlang = localStorage.getItem(localStorageUserlangKey) || navigator.language || navigator.userLanguage;
let lang = userlang.substr(0, 2).toLowerCase();
if (!(lang in translations)) {
  lang = "en";
}

function changeBtnColor(n) {
  document.querySelector(".translationBtn").style.color = n;
}

function changeBtnState(newState = "none") {
  document.querySelector(".translationBtn").dataset.state = newState;
}

function changeIconBackground(type = "none") {
  let iconBackgroundColor;
  switch (type) {
    case "error":
      iconBackgroundColor = "#7A7A7D";
      break;
    case "success":
      iconBackgroundColor = "#A36EFF";
      break;
    default:
      iconBackgroundColor = "#FFFFFF";
      break;
  }

  document.querySelector(".translateIcon").style.fill = iconBackgroundColor;
}

function transformBtn(type = "none", text) {
  switch (type) {
    case "error":
      changeIconBackground(type);
      changeBtnColor("#7A7A7D");
      changeBtnState(type);
      break;
    case "success":
      changeIconBackground(type);
      changeBtnColor("#A36EFF");
      changeBtnState(type);
      break;
    default:
      changeIconBackground("none");
      changeBtnColor("#FFFFFF");
      changeBtnState("none");
      break;
  }

  document.querySelector(".translationBtn").innerText = text;
}

// Add translation buttton block
function addTranslationBlock(element) {
  if (!element || element.querySelector(".translationBlock")) return;

  const block = document.createElement("div");
  block.classList.add("translationBlock");
  block.innerHTML = `
    <span class = "translationArea" role = "button">
      <span class = "translationITranslate" tabindex = "-1">
        <svg class="translateIcon" width="24" height="24" viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17.605 19.703c.794-.13 1.647-.476 2.47-.983.695 1.013 1.255 1.546 1.306 1.593l1.166-1.207c-.011-.01-.504-.48-1.124-1.401.277-.25.547-.512.797-.798a12.1 12.1 0 0 0 2.268-3.826c.383.216.761.541.96 1.027.68 1.649-.301 3.557-1.215 4.385l1.152 1.22c1.52-1.378 2.571-3.959 1.638-6.227-.368-.892-1.077-1.59-2.064-2.037.162-.763.216-1.38.233-1.785h-1.698c-.017.307-.06.762-.173 1.323-1.325-.187-2.818-.006-4.248.508a25.994 25.994 0 0 1-.313-2.547c5.092-.287 8.098-1.488 8.237-1.546l-.654-1.533c-.03.013-2.875 1.14-7.65 1.418-.001-.405-.008-.666-.012-.85-.008-.339-.01-.423.03-.67L17.01 5.75c-.026.283-.024.573-.018 1.278l.002.318c-.026 0-.051 0-.077.002l-.08.001a39.286 39.286 0 0 1-3.27-.14L13.25 8.89c.5.043 2.023.122 3.397.122h.1a19.457 19.457 0 0 1 .208-.003l.106-.002c.067.948.196 2.034.421 3.22a8.05 8.05 0 0 0-2.267 1.963l.811 1.871c.327-.732.995-1.51 1.856-2.111a16.762 16.762 0 0 0 1.33 3.346c-.811.514-1.64.818-2.301.804l.694 1.603Zm2.953-3.488a8.18 8.18 0 0 0 .374-.389 10.465 10.465 0 0 0 1.927-3.224c-.198-.021-.4-.031-.606-.031-.907 0-1.885.199-2.834.574.31 1.209.718 2.23 1.14 3.07ZM9.769 11.688 4.25 24.438h2.259l1.357-3.407h5.582l1.357 3.407h2.258l-5.52-12.75H9.77Zm.887 2.624 2.056 5H8.6l2.056-5Z"></path>
        </svg>
      </span>
      <span class = "translationBtn" tabindex = "0">${translations[lang].translateVideo}</span>
    </span>
    <span class = "translationMenu" tabindex = "0" role = "button">
      <svg class = "translationMenuIcon" height="15" width="5" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 13.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path>
      </svg>
    </span>
  `;

  element.appendChild(block);
  utils_debug.log("VOT: Added translation button to ", element);
}

function createTranslationMenu() {
  const container = document.createElement("div");
  container.classList.add("translationMenuContent");
  container.innerHTML = `
    <p class = "translationMainHeader">${translations[lang].translationSettings}</p>
    <div class="translationMenuOptions"></div>
    <div class="translationMenuFunctional">
      <a class = "translationDownload">
        <svg width="24px" height="24px" data-darkreader-inline-stroke="" fill="none" stroke="currentColor" style="--darkreader-inline-stroke: currentColor;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
      </a>
      <button class = "translationDropDB">${translations[lang].resetSettings}</button>
    </div>
  `;

  container.onclick = (event) => event.stopPropagation();
  return container;
}

// Create checkbox for menu
function createMenuCheckbox(id, valueToCheck, content) {
  const checkboxContainer = document.createElement("div");
  const checkbox = document.createElement("input");
  const checkboxLabel = document.createElement("label");

  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.checked = Boolean(valueToCheck);

  checkboxLabel.htmlFor = id;
  checkboxLabel.innerHTML = content;

  checkboxContainer.classList.add("translationMenuContainer");
  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  return checkboxContainer;
}

// Create slider for menu
function createMenuSlider(id, sliderValue, content) {
  const sliderContainer = document.createElement("div");
  const slider = document.createElement("input");
  const sliderLabel = document.createElement("label");

  slider.type = "range";
  slider.id = id;
  slider.classList.add("VOTMenuSlider");
  slider.min = 0;
  slider.max = 100;
  slider.value = sliderValue;

  sliderLabel.htmlFor = id;
  sliderLabel.classList.add("translationHeader");
  sliderLabel.innerHTML = content;

  sliderContainer.classList.add("translationMenuContainer");
  sliderContainer.appendChild(sliderLabel);
  sliderContainer.appendChild(slider);

  return sliderContainer;
}

// Create select for menu
function createMenuSelect(id, selectOptions) {
  // selectOptions structure:
  // [
  //     {
  //         label: string,
  //         value: string,
  //         selected: boolean,
  //         disabled: boolean
  //     }
  // ]
  const selectContainer = document.createElement("div");
  const select = document.createElement("select");

  select.id = id;
  select.classList.add("VOTMenuSelect");

  for (const option of selectOptions) {
    const optionElement = document.createElement("option");
    optionElement.innerText = option.label;
    optionElement.value = option.value;
    if (
      Object.prototype.hasOwnProperty.call(option, "selected") &&
      option.selected
    ) {
      optionElement.setAttribute("selected", "selected");
    }

    if (Object.prototype.hasOwnProperty.call(option, "disabled")) {
      optionElement.disabled = option.disabled;
    }

    select.appendChild(optionElement);
  }

  selectContainer.classList.add("translationMenuContainer");
  selectContainer.appendChild(select);

  return selectContainer;
}

function genOptionsByOBJ(obj, conditionString) {
  return Object.entries(obj).map(([key, value]) => ({
    label: translations[lang][value],
    value: key,
    selected: conditionString === key,
  }));
}



;// CONCATENATED MODULE: ./src/utils/utils.js



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

const getVideoId = (service) => {
  const url = new URL(window.location.href);

  switch (service) {
    case "youtube":
      return (
        url.pathname.match(/(?:watch|embed)\/([^/]+)/)?.[1] ||
        url.searchParams.get("v")
      );
    case "vk":
      if (url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)) {
        return url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)[0].slice(1);
      } else if (url.searchParams.get("z")) {
        return url.searchParams.get("z").split("/")[0];
      } else if (url.searchParams.get("oid") && url.searchParams.get("id")) {
        return `video-${Math.abs(
          url.searchParams.get("oid")
        )}_${url.searchParams.get("id")}`;
      } else {
        return false;
      }
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
          ".tw-link[data-test-selector='stream-info-card-component__stream-avatar-link']"
        );
        if (!channelLink) {
          return false;
        }

        const channelName = channelLink.href.replace(
          "https://www.twitch.tv/",
          ""
        );
        return `${channelName}/clip/${url.searchParams.get("clip")}`;
      } else if (url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)) {
        return url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)[0];
      } else {
        return url.pathname.match(/(?:videos)\/([^/]+)/)?.[0];
      }
    case "tiktok":
      return url.pathname.match(/video\/([^/]+)/)?.[1];
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
    case "facebook":
      return url.pathname;
    case "rutube":
      return url.pathname.match(/(?:video|embed)\/([^/]+)/)?.[1];
    case "coub":
      return url.pathname.match(/view\/([^/]+)/)?.[1];
    case "bilibili.com":
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
    case "mail.ru":
      if (url.pathname.startsWith("/v/") || url.pathname.startsWith("/mail/")) {
        return url.pathname;
      } else if (url.pathname.match(/video\/embed\/([^/]+)/)) {
        const referer = document.querySelector(
          ".b-video-controls__mymail-link"
        );
        if (!referer) {
          return false;
        }

        return referer?.href.split("my.mail.ru")?.[1];
      }
    case "bitchute":
      return url.pathname.match(/video\/([^/]+)/)?.[1];
    default:
      return false;
  }
};

function secsToStrTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  if (minutes >= 60) {
    return translations[lang].translationTakeMoreThanHour;
  } else if (minutes >= 10 && minutes % 10) {
    return translations[lang].translationTakeApproximatelyMinutes.format(
      minutes
    );
  } else if (minutes == 1 || (minutes == 0 && seconds > 0)) {
    return translations[lang].translationTakeAboutMinute;
  } else {
    return translations[lang].translationTakeApproximatelyMinute.format(
      minutes
    );
  }
}



// EXTERNAL MODULE: ./src/config/config.js
var config = __webpack_require__("./src/config/config.js");
;// CONCATENATED MODULE: ./src/config/alternativeUrls.js
// Sites host Invidious. I tested the performance only on invidious.kevin.rocks, youtu.be and inv.vern.cc
const sitesInvidious = [
  "invidious.snopyta.org",
  "yewtu.be",
  "invidious.kavin.rocks",
  "vid.puffyan.us",
  "invidious.namazso.eu",
  "inv.riverside.rocks",
  "yt.artemislena.eu",
  "invidious.flokinet.to",
  "invidious.esmailelbob.xyz",
  "y.com.sb",
  "invidious.nerdvpn.de",
  "inv.vern.cc",
  "invidious.slipfox.xyz",
  "invidio.xamh.de",
  "invidious.dhusch.de",
];

// Sites host Piped. I tested the performance only on piped.video
const sitesPiped = [
  "piped.video",
  "piped.tokhmi.xyz",
  "piped.moomoo.me",
  "piped.syncpundit.io",
  "piped.mha.fi",
  "watch.whatever.social",
  "piped.garudalinux.org",
  "efy.piped.pages.dev",
  "watch.leptons.xyz",
  "piped.lunar.icu",
  "yt.dc09.ru",
  "piped.mint.lgbt",
  "il.ax",
  "piped.privacy.com.de",
  "piped.esmailelbob.xyz",
  "piped.projectsegfau.lt",
  "piped.in.projectsegfau.lt",
  "piped.us.projectsegfau.lt",
  "piped.privacydev.net",
  "piped.palveluntarjoaja.eu",
  "piped.smnz.de",
  "piped.adminforge.de",
  "piped.qdi.fi",
  "piped.hostux.net",
  "piped.chauvet.pro",
  "piped.jotoma.de",
  "piped.pfcd.me",
  "piped.frontendfriendly.xyz",
];



;// CONCATENATED MODULE: ./src/indexedDB.js



// --- IndexedDB functions start:
const dbVersion = 2; // current db version
const settingsDefault = {
  key: "settings",
  autoTranslate: 0,
  defaultVolume: 100,
  showVideoSlider: 0,
  syncVolume: 0,
  autoSetVolumeYandexStyle: 1,
  dontTranslateYourLang: 1,
}; // default settings for db v1

const valuesV2 = {
  audioProxy: 0,
};

function openDB(name) {
  return indexedDB.open(name, dbVersion);
}

async function initDB() {
  return new Promise((resolve, reject) => {
    function updateVersionProccessor(
      transaction,
      db,
      indexes,
      previousIndexes = {}
    ) {
      // openRequest is transaction object
      // indexes is object of strings with default values (used for createIndex) ex. {"name": 0}
      // previousIndexes is indexes for previous version
      const objectStore = transaction.objectStore("settings");

      for (const key of Object.keys(indexes)) {
        objectStore.createIndex(key, key, { unique: false });
      }

      console.log("VOT: The database has been updated");
      objectStore.transaction.oncomplete = (event) => {
        const objectStore = db
          .transaction("settings", "readwrite")
          .objectStore("settings");
        const request = objectStore.get("settings");

        request.onerror = (event) => {
          console.error(
            "VOT: Data could not be retrieved from the Database: ",
            event.error
          );
          reject(false);
        };

        request.onsuccess = () => {
          const data =
            request.result || Object.assign(settingsDefault, previousIndexes); // use data from db or reset all data
          for (const key in indexes) {
            data[key] = indexes[key];
          }

          const requestUpdate = objectStore.put(data);

          requestUpdate.onerror = (event) => {
            console.error(
              "VOT: Failed to update the Database to new version",
              event.error
            );
            reject(false);
          };

          requestUpdate.onsuccess = () => {
            console.log(
              "VOT: Standard settings of the new version have been added to the Database."
            );
            resolve(true);
          };
        };
      };
    }

    const openRequest = openDB("VOT");

    openRequest.onerror = () => {
      console.error(
        `${translations[lang].VOTFailedInitDB}: ${openRequest.error.message}`
      );
      reject(false);
    };

    openRequest.onupgradeneeded = (event) => {
      const db = openRequest.result;

      db.onerror = () => {
        const errorMessage = translations[lang].VOTFailedInitDB;
        alert(errorMessage);
        console.error(errorMessage, openRequest.error);
        reject(false);
      };

      if (event.oldVersion < 1) {
        // db not found
        const objectStore = db.createObjectStore("settings", {
          keyPath: "key",
        });

        // add indexes for 1 version (without key index)
        for (const key of Object.keys(settingsDefault).filter(
          (k) => k !== "key"
        )) {
          objectStore.createIndex(key, key, { unique: false });
        }

        console.log("VOT: Database Created");

        objectStore.transaction.oncomplete = (event) => {
          const objectStore = db
            .transaction("settings", "readwrite")
            .objectStore("settings");
          const request = objectStore.add(settingsDefault);

          request.onsuccess = () => {
            console.log(
              "VOT: Standard settings added to the Database: ",
              request.result
            );
            resolve(true);
          };

          request.onerror = () => {
            console.log(
              "VOT: Error when adding standard settings to the Database: ",
              request.error
            );
            reject(false);
          };
        };
      }

      if (event.oldVersion < 2) {
        // db is outdated (db version is 1)
        updateVersionProccessor(openRequest.transaction, db, valuesV2);
      }
    };

    openRequest.onsuccess = () => {
      const db = openRequest.result;
      db.onversionchange = () => {
        db.close();
        const errorMessage = translations[lang].VOTDBNeedUpdate;
        alert(errorMessage);
        console.log(errorMessage);
        window.location.reload();
        reject(false);
      };
      resolve(true);
    };

    openRequest.onblocked = () => {
      const db = openRequest.result;
      const errorMessage = translations[lang].VOTDisabledForDBUpdating;
      console.error(errorMessage, db);
      alert(errorMessage);
      reject(false);
    };
  });
}

async function updateDB({
  autoTranslate,
  defaultVolume,
  showVideoSlider,
  syncVolume,
  autoSetVolumeYandexStyle,
  dontTranslateYourLang,
  audioProxy,
}) {
  return new Promise((resolve, reject) => {
    if (
      typeof autoTranslate === "number" ||
      typeof defaultVolume === "number" ||
      typeof showVideoSlider === "number" ||
      typeof syncVolume === "number" ||
      typeof autoSetVolumeYandexStyle === "number" ||
      typeof dontTranslateYourLang === "number" ||
      typeof audioProxy === "number"
    ) {
      const openRequest = openDB("VOT");

      openRequest.onerror = () => {
        const errorMessage = translations[lang].VOTFailedWriteToDB;
        alert(errorMessage);
        console.error(errorMessage, openRequest.error.message);
        reject(false);
      };

      openRequest.onupgradeneeded = async () => {
        const db = openRequest.result;
        db.close();
        await initDB();
        resolve(true);
      };

      openRequest.onsuccess = () => {
        const db = openRequest.result;
        db.onversionchange = () => {
          db.close();
          console.log(
            "VOT: The database needs an update, please reload the page if it didn't happen automatically"
          );
          window.location.reload();
          reject(false);
        };

        const objectStore = db
          .transaction("settings", "readwrite")
          .objectStore("settings");
        const request = objectStore.get("settings");

        request.onerror = (event) => {
          console.error(
            "VOT: Data could not be retrieved from the Database: ",
            event.error
          );
          reject(false);
        };

        request.onsuccess = () => {
          const data = request.result;

          if (typeof autoTranslate === "number") {
            data.autoTranslate = autoTranslate;
          }

          if (typeof defaultVolume === "number") {
            data.defaultVolume = defaultVolume;
          }

          if (typeof showVideoSlider === "number") {
            data.showVideoSlider = showVideoSlider;
          }

          if (typeof syncVolume === "number") {
            data.syncVolume = syncVolume;
          }

          if (typeof autoSetVolumeYandexStyle === "number") {
            data.autoSetVolumeYandexStyle = autoSetVolumeYandexStyle;
          }

          if (typeof dontTranslateYourLang === "number") {
            data.dontTranslateYourLang = dontTranslateYourLang;
          }

          if (typeof audioProxy === "number") {
            data.audioProxy = audioProxy;
          }

          const requestUpdate = objectStore.put(data);

          requestUpdate.onerror = (event) => {
            console.error(
              "VOT: Не удалось обновить данные в Базе Данных: ",
              event.error
            );
            reject(false);
          };

          requestUpdate.onsuccess = () => {
            resolve(true);
          };
        };
      };

      openRequest.onblocked = () => {
        const db = openRequest.result;
        const errorMessage = translations[lang].VOTDisabledForDBUpdating;
        console.error(errorMessage, db);
        alert(errorMessage);
        reject(false);
      };
    }
  });
}

async function readDB() {
  return new Promise((resolve, reject) => {
    const openRequest = openDB("VOT");

    openRequest.onerror = () => {
      const errorMessage = translations[lang].VOTFailedReadFromDB;
      alert(errorMessage);
      console.error(errorMessage, openRequest.error.message);
      reject(false);
    };

    openRequest.onupgradeneeded = async () => {
      const db = openRequest.result;
      db.close();
      await initDB();
      resolve(true);
    };

    openRequest.onsuccess = () => {
      const db = openRequest.result;
      db.onversionchange = () => {
        db.close();
        const errorMessage = translations[lang].VOTDBNeedUpdate;
        alert(errorMessage);
        console.error(errorMessage);
        reject(false);
      };

      const objectStore = db.transaction("settings").objectStore("settings");
      const request = objectStore.get("settings");

      request.onerror = (event) => {
        console.error(translations[lang].VOTFailedReadFromDB, event.error);
        console.error(event);
        reject(false);
      };

      request.onsuccess = () => {
        if (request.result === undefined) {
          db.close();
          deleteDB();
          reject(false);
        }
        const data = request.result;
        resolve(data);
      };
    };

    openRequest.onblocked = () => {
      const db = openRequest.result;
      const errorMessage = translations[lang].VOTDisabledForDBUpdating;
      console.error(errorMessage, db);
      alert(errorMessage);
      reject(false);
    };
  });
}

function deleteDB() {
  indexedDB.deleteDatabase("VOT");
}



;// CONCATENATED MODULE: ./src/utils/volume.js
// element - audio / video element
function syncVolume(element, sliderVolume, otherSliderVolume, tempVolume) {
  let finalValue;
  if (sliderVolume > tempVolume) {
    // sliderVolume = 100
    // tempVolume = 69
    // volume = 15
    // 100 - 69 = 31
    // 15 + 31 = 46 - final video volume
    finalValue = otherSliderVolume + (sliderVolume - tempVolume);
    finalValue = finalValue > 100 ? 100 : Math.max(finalValue, 0);

    element.volume = finalValue / 100;
  } else if (sliderVolume < tempVolume) {
    // sliderVolume = 69
    // tempVolume = 100
    // volume = 15
    // 100 - 69 = 31
    // 15 - 31 = 0 - final video volume
    finalValue = otherSliderVolume - (tempVolume - sliderVolume);
    finalValue = finalValue > 100 ? 100 : Math.max(finalValue, 0);

    element.volume = finalValue / 100;
  }

  return finalValue;
}



;// CONCATENATED MODULE: ./src/config/regexes.js
const regexes = () => {
  return {
    youtubeRegex: /^(www.|m.)?youtube(-nocookie)?.com$/,
  };
};

/* harmony default export */ const config_regexes = (regexes());

;// CONCATENATED MODULE: ./src/config/selectors.js
const selectors = () => {
  return {
    youtubeSelector: ".html5-video-container",
    twitchSelector: ".video-ref",
    twitchMobileSelector: "main > div > section > div > div > div",
    pipedSelector: ".shaka-video-container",
    vkSelector: ".videoplayer_media",
    twitterSelector:
      'div[data-testid="videoComponent"] > div:nth-child(1) > div',
    vimeoSelector: ".player",
    gagSelector: ".video-post",
    bilibilicomSelector: ".bpx-player-video-wrap",
    mailSelector: "#b-video-wrapper",
  };
};

/* harmony default export */ const config_selectors = (selectors());

;// CONCATENATED MODULE: ./src/index.js















const sitesChromiumBlocked = [...sitesInvidious, ...sitesPiped];

// translate properties
let translateFromLang = "en"; // default language of video

let translateToLang = lang; // default language of audio response

let ytData = "";

async function src_main() {
  utils_debug.log("Loading extension...");
  utils_debug.log(`Selected menu language: ${lang}`);

  const rvt = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "./src/rvt.js"));

  const requestVideoTranslation = rvt.default;

  utils_debug.log("Inited requestVideoTranslation...");

  if (
     true &&
    GM_info?.scriptHandler &&
    ["Violentmonkey", "FireMonkey", "Greasemonkey", "AdGuard"].includes(
      GM_info.scriptHandler
    )
  ) {
    const errorText = translations[lang].unSupportedExtensionError;
    console.error(errorText);
    return alert(errorText);
  }

  utils_debug.log("Extension compatibility passed...");

  let timer;
  const audio = new Audio();
  let opacityRatio = 0.9;
  let openedMenu = false;

  if (false) { var translationPanding; }

  function logout(n) {
    if (openedMenu) return;

    document.querySelector(".translationBlock").style.opacity = n;
  }

  function resetTimer() {
    clearTimeout(timer);
    logout(1);
    timer = setTimeout(() => {
      logout(0);
    }, 2000);
  }

  function changeOpacityOnEvent(event, timer, opacityRatio) {
    clearTimeout(timer);
    logout(opacityRatio);
    event.stopPropagation();
  }

  const deleteAudioSrc = async () => {
    audio.src = "";
    audio.removeAttribute("src");
  };

  // Add menu container
  function addTranslationMenu(element) {
    if (element.querySelector(".translationMenuContent")) return;

    const container = createTranslationMenu();
    element.appendChild(container);

    // click to translation menu icon
    document
      .querySelector(".translationMenu")
      ?.addEventListener("click", (event) => {
        event.stopPropagation();
        const content = document.querySelector(".translationMenuContent");
        content.style.display = openedMenu ? "none" : "block";
        content.style.opacity = opacityRatio;
        openedMenu = !openedMenu;
      });

    document
      .querySelector(".translationDropDB")
      .addEventListener("click", (event) => {
        event.stopPropagation();
        deleteDB();
        location.reload();
      });

    utils_debug.log("VOT: Added translation menu to ", element);
  }

  function translateVideo(url, unknown1, requestLang, responseLang, callback) {
    utils_debug.log(
      `Translate video (url: ${url}, unknown1: ${unknown1}, requestLang: ${requestLang}, responseLang: ${responseLang})`
    );

    if (false) {}

    translationPanding = true;

    requestVideoTranslation(
      url,
      unknown1,
      requestLang,
      responseLang,
      (success, response) => {
        translationPanding = false;

        utils_debug.log("[exec callback] Requesting video translation");
        if (!success) {
          callback(false, translations[lang].requestTranslationFailed);
          return;
        }

        const translateResponse = yandexRequests/* yandexRequests.decodeResponse */.G.decodeResponse(response);
        console.log("VOT Response: ", translateResponse);

        switch (translateResponse.status) {
          case 0:
            callback(false, translateResponse.message);
            break;
          case 1:
            callback(
              !!translateResponse.url,
              translateResponse.url || translations[lang].audioNotReceived
            );
            break;
          case 2:
            callback(
              false,
              translateResponse.remainingTime
                ? secsToStrTime(translateResponse.remainingTime)
                : translations[lang].translationTakeFewMinutes
            );
            break;
          case 3:
            /*
              Иногда, в ответе приходит статус код 3, но видео всё, так же, ожидает перевода. В конечном итоге, это занимает слишком много времени,
              как-будто сервер не понимает, что данное видео уже недавно было переведено и заместо возвращения готовой ссылки на перевод начинает переводить видео заново при чём у него это получается за очень длительное время
            */
            callback(false, translations[lang].videoBeingTranslated);
            break;
        }
      }
    );
  }

  async function translateProccessor(videoContainer, siteHostname, siteEvent) {
    utils_debug.log("[translateProccessor] execute on element: ", videoContainer);

    let video;
    let autoRetry;
    let volumeOnStart;
    let tempOriginalVolume;
    let tempVolume;
    let dbAutoTranslate;
    let dbDefaultVolume;
    let dbShowVideoSlider;
    let dbAutoSetVolumeYandexStyle;
    let dontTranslateYourLang;
    let dbSyncVolume;
    let dbAudioProxy; // cf version only
    let firstPlay = true;
    let isDBInited;
    let videoData = "";

    utils_debug.log("videoContainer", videoContainer);

    video =
      siteHostname === "vimeo"
        ? videoContainer.querySelector(
            ".vp-video-wrapper > .vp-video > .vp-telecine > video"
          )
        : videoContainer.querySelector("video");

    utils_debug.log("video", video);

    const container =
      siteHostname === "pornhub" &&
      window.location.pathname.includes("view_video.php")
        ? document.querySelector(".original.mainPlayerDiv")
        : siteHostname === "pornhub" &&
          window.location.pathname.includes("embed/")
        ? document.querySelector("body")
        : window.location.hostname.includes("m.youtube.com")
        ? document.querySelector("#player-control-container")
        : videoContainer;

    addTranslationBlock(container);
    addTranslationMenu(container);

    try {
      isDBInited = await initDB();
    } catch (err) {
      console.error(
        "[VOT] Failed to initialize database settings. All changes made will not be saved",
        err
      );
    }

    const menuOptions = document.querySelector(".translationMenuOptions");
    if (menuOptions && !menuOptions.querySelector("#VOTTranslateFromLang")) {
      const selectFromLangOptions = [
        {
          label: translations[lang].videoLanguage,
          value: "default",
          disabled: true,
        },
        ...genOptionsByOBJ(availableLangs, videoData.detectedLanguage),
      ];

      const selectToLangOptions = [
        {
          label: translations[lang].translationLanguage,
          value: "default",
          disabled: true,
        },
        ...genOptionsByOBJ(availableLangs, videoData.responseLanguage),
        {
          label: "─────────",
          value: "separator",
          disabled: true,
        },
        ...genOptionsByOBJ(additionalTTS, videoData.responseLanguage),
      ];

      const selectFromLang = createMenuSelect(
        "VOTTranslateFromLang",
        selectFromLangOptions
      );

      const selectToLang = createMenuSelect(
        "VOTTranslateToLang",
        selectToLangOptions
      ).firstElementChild;

      selectFromLang.id = "VOTSelectLanguages";
      selectFromLang.innerHTML += `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16m0 0l-6 6m6-6l-6-6"/>
        </svg>
      `;

      selectFromLang.appendChild(selectToLang);
      menuOptions.appendChild(selectFromLang);

      menuOptions
        .querySelector("#VOTTranslateFromLang")
        .addEventListener("change", async (event) => {
          utils_debug.log("[onchange] select from language", event.target.value);
          videoData = await getVideoData();
          await setSelectMenuValues(
            event.target.value,
            videoData.responseLanguage
          );
        });

      menuOptions
        .querySelector("#VOTTranslateToLang")
        .addEventListener("change", async (event) => {
          utils_debug.log("[onchange] select to language", event.target.value);
          videoData = await getVideoData();
          await setSelectMenuValues(
            videoData.detectedLanguage,
            event.target.value
          );
        });
    }

    if (isDBInited) {
      const dbData = await readDB();
      if (dbData) {
        dbAutoTranslate = dbData.autoTranslate;
        dbDefaultVolume = dbData.defaultVolume;
        dbShowVideoSlider = dbData.showVideoSlider;
        dbAutoSetVolumeYandexStyle = dbData.autoSetVolumeYandexStyle;
        dontTranslateYourLang = dbData.dontTranslateYourLang;
        dbAudioProxy = dbData.audioProxy; // cf version only
        dbSyncVolume = dbData.syncVolume; // youtube only

        utils_debug.log("[db] data from db: ", dbData);

        if (
          dbAutoTranslate !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTAutoTranslate")
        ) {
          const checkbox = createMenuCheckbox(
            "VOTAutoTranslate",
            dbAutoTranslate,
            translations[lang].VOTAutoTranslate +
              (siteHostname === "vk" ||
              window.location.hostname.includes("m.twitch.tv")
                ? ` <strong>(${translations[lang].recommended})</strong>`
                : "")
          );

          checkbox.querySelector("#VOTAutoTranslate").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await updateDB({ autoTranslate: value });
            dbAutoTranslate = value;
            utils_debug.log(
              "autoTranslate value changed. New value: ",
              dbAutoTranslate
            );
          };

          menuOptions.appendChild(checkbox);
        }

        if (
          window.location.hostname.includes("youtube.com") &&
          dontTranslateYourLang !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTDontTranslateYourLang")
        ) {
          const checkbox = createMenuCheckbox(
            "VOTDontTranslateYourLang",
            dontTranslateYourLang,
            translations[lang].VOTDontTranslateYourLang
          );

          checkbox.querySelector("#VOTDontTranslateYourLang").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await updateDB({ dontTranslateYourLang: value });
            dontTranslateYourLang = value;
            utils_debug.log(
              "dontTranslateYourLang value changed. New value: ",
              dontTranslateYourLang
            );
          };

          menuOptions.appendChild(checkbox);
        }

        if (
          dbAutoSetVolumeYandexStyle !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTAutoSetVolume")
        ) {
          const checkbox = createMenuCheckbox(
            "VOTAutoSetVolume",
            dbAutoSetVolumeYandexStyle,
            translations[lang].VOTAutoSetVolume + `${config/* autoVolume */.IM * 100}%`
          );

          checkbox.querySelector("#VOTAutoSetVolume").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await updateDB({ autoSetVolumeYandexStyle: value });
            dbAutoSetVolumeYandexStyle = value;
            utils_debug.log(
              "autoSetVolumeYandexStyle value changed. New value: ",
              dbAutoSetVolumeYandexStyle
            );
          };

          menuOptions.appendChild(checkbox);
        }

        if (
          dbShowVideoSlider !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTShowVideoSlider")
        ) {
          const checkbox = createMenuCheckbox(
            "VOTShowVideoSlider",
            dbShowVideoSlider,
            translations[lang].VOTShowVideoSlider
          );

          checkbox.querySelector("#VOTShowVideoSlider").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await updateDB({ showVideoSlider: value });
            dbShowVideoSlider = value;
            utils_debug.log(
              "showVideoSlider value changed. New value: ",
              dbShowVideoSlider
            );
            if (
              dbShowVideoSlider === 1 &&
              document.querySelector(".translationBtn").dataset.state ===
                "success"
            ) {
              addVideoSlider();
            } else {
              document.querySelector("#VOTVideoSlider")?.parentElement.remove();
            }
          };

          menuOptions.appendChild(checkbox);
        }

        if (
          window.location.hostname.includes("youtube.com") &&
          !window.location.hostname.includes("m.youtube.com") &&
          dbSyncVolume !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTSyncVolume")
        ) {
          const checkbox = createMenuCheckbox(
            "VOTSyncVolume",
            dbSyncVolume,
            translations[lang].VOTSyncVolume
          );

          checkbox.querySelector("#VOTSyncVolume").onclick = async (event) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await updateDB({ syncVolume: value });
            dbSyncVolume = value;
            utils_debug.log("syncVolume value changed. New value: ", dbSyncVolume);
          };

          menuOptions.appendChild(checkbox);
        }

        // cf version only
        if (
          false
        ) {}
      }
    }

    transformBtn("none", translations[lang].translateVideo);

    if (
      window.location.hostname.includes("youtube.com") &&
      !window.location.hostname.includes("m.youtube.com")
    ) {
      const syncVolumeObserver = new MutationObserver(async function (
        mutations
      ) {
        mutations.forEach(async function (mutation) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "aria-valuenow" &&
            document.querySelector("#VOTVideoSlider")
          ) {
            syncVideoVolumeSlider();
          }
        });
      });

      syncVolumeObserver.observe(document.querySelector(".ytp-volume-panel"), {
        attributes: true,
        childList: false,
        subtree: true,
        attributeOldValue: true,
      });
    }

    async function setSelectMenuValues(from, to) {
      if (!document.querySelector("#VOTSelectLanguages")) {
        return;
      }
      document.querySelector("#VOTTranslateFromLang").value = from;
      document.querySelector("#VOTTranslateToLang").value = to;
      console.log(`Set translation from ${from} to ${to}`);
      videoData.detectedLanguage = from;
      videoData.responseLanguage = to;
      localStorage.setItem(localStorageUserlangKey, to);
    }

    // data - ytData or VideoData
    // async function setDetectedLangauge(data, videolang) {
    //   switch (videolang) {
    //     case "en":
    //       data.detectedLanguage = videolang;
    //       data.responseLanguage = lang;
    //       break;
    //     case "ru":
    //       data.detectedLanguage = videolang;
    //       data.responseLanguage = lang;
    //       if (lang == "ru") data.responseLanguage = "en";
    //       break;
    //     default:
    //       if (!Object.keys(availableLangs).includes(videolang)) {
    //         return setDetectedLangauge(data, "en");
    //       }

    //       data.detectedLanguage = videolang;
    //   }

    //   setSelectMenuValues(data.detectedLanguage, data.responseLanguage);

    //   return data;
    // }

    // data - ytData or VideoData
    // async function setResponseLangauge(data, videolang) {
    //   switch (videolang) {
    //     case "en":
    //       data.responseLanguage = videolang;
    //       data.detectedLanguage = "ru";
    //       break;
    //     default:
    //       if (!Object.keys(availableLangs).includes(videolang)) {
    //         return setResponseLangauge(data, "ru");
    //       }

    //       if (data.detectedLanguage && data.responseLanguage === lang) {
    //         data.detectedLanguage = "en";
    //       }

    //       data.responseLanguage = videolang;
    //   }

    //   setSelectMenuValues(data.detectedLanguage, data.responseLanguage);

    //   return data;
    // }

    async function stopTraslate() {
      // Default actions on stop translate
      audio.pause();
      video.removeEventListener(".translate", stopTraslate, false);
      await deleteAudioSrc();
      document.querySelector("#VOTVideoSlider")?.parentElement.remove();
      document.querySelector("#VOTTranslationSlider")?.parentElement.remove();
      const downloadBtn = document.querySelector(".translationDownload");
      downloadBtn.href = "";
      downloadBtn.style.display = "none";
      transformBtn("none", translations[lang].translateVideo);
      if (volumeOnStart) {
        video.volume = volumeOnStart;
      }
    }

    async function syncVideoVolumeSlider() {
      // Sync volume slider with original video (youtube only)
      const newSlidersVolume = document
        .querySelector(".ytp-volume-panel")
        .getAttribute("aria-valuenow");

      const videoSlider = document.querySelector("#VOTVideoSlider");

      if (!videoSlider) {
        return;
      }
      videoSlider.value = newSlidersVolume;

      const videoVolumeLabel = document.querySelector("#VOTVideoVolume");

      if (videoVolumeLabel) {
        videoVolumeLabel.innerText = `${newSlidersVolume}%`;
      }

      if (dbSyncVolume === 1) {
        tempOriginalVolume = Number(newSlidersVolume);
      }
    }

    async function getVideoData() {
      const videoData = {};

      videoData.duration = video?.duration || 0;

      videoData.videoId = getVideoId(siteHostname);

      videoData.detectedLanguage = translateFromLang;

      videoData.responseLanguage = translateToLang;

      if (window.location.hostname.includes("youtube.com")) {
        ytData = await getYTVideoData();
        if (ytData.author !== "") {
          videoData.detectedLanguage = ytData.detectedLanguage;
          videoData.responseLanguage = lang;
        }
      } else if (
        window.location.hostname.includes("rutube") ||
        window.location.hostname.includes("my.mail.ru")
      ) {
        videoData.detectedLanguage = "ru";
        videoData.responseLanguage = "en";
      } else if (window.location.hostname.includes("bilibili.com")) {
        videoData.detectedLanguage = "zh";
      }

      return videoData;
    }

    const lipSync = async (mode = false) => {
      utils_debug.log("lipsync video", video);
      if (!video) {
        return;
      }
      audio.currentTime = video.currentTime;
      audio.playbackRate = video.playbackRate;

      if (!mode) {
        utils_debug.log("lipsync mode is not set");
        return;
      }

      if (mode === "play") {
        utils_debug.log("lipsync mode is play");
        const audioPromise = audio.play();
        if (audioPromise !== undefined) {
          audioPromise.catch((e) => {
            console.error(e);
            if (e.name === "NotAllowedError") {
              const errorMessage = translations[lang].grantPermissionToAutoPlay;
              transformBtn("error", errorMessage);
              throw `VOT: ${errorMessage}`;
            } else if (e.name === "NotSupportedError") {
              const errorMessage = sitesChromiumBlocked.includes(
                window.location.hostname
              )
                ? translations[lang].neededAdditionalExtension
                : translations[lang].audioFormatNotSupported;
              transformBtn("error", errorMessage);
              throw `VOT: ${errorMessage}`;
            }
          });
        }
        return;
      }
      if (mode === "pause") {
        utils_debug.log("lipsync mode is pause");
        audio.pause();
      }
      if (mode === "stop") {
        utils_debug.log("lipsync mode is stop");
        audio.pause();
      }
      if (mode === "waiting") {
        utils_debug.log("lipsync mode is waiting");
        audio.pause();
      }
      if (mode === "playing") {
        utils_debug.log("lipsync mode is playing");
        audio.play();
      }
    };

    function addVideoSlider() {
      if (
        dbShowVideoSlider !== 1 ||
        document.querySelector("#VOTVideoSlider") ||
        document.querySelector(".translationBtn").dataset.state !== "success"
      ) {
        return;
      }

      const newVolume =
        window.location.hostname.includes("youtube.com") &&
        !dbAutoSetVolumeYandexStyle
          ? document
              .querySelector(".ytp-volume-panel")
              ?.getAttribute("aria-valuenow")
          : Math.round(video.volume * 100);
      tempOriginalVolume = newVolume;

      const slider = createMenuSlider(
        "VOTVideoSlider",
        newVolume,
        `${translations[lang].VOTVolume}: <b class = "volumePercent" id="VOTOriginalVolume">${newVolume}%</b>`
      );

      slider.querySelector("#VOTVideoSlider").oninput = async (event) => {
        const { value } = event.target;
        video.volume = value / 100;
        slider.querySelector("#VOTOriginalVolume").innerText = `${value}%`;

        if (dbSyncVolume !== 1) {
          return;
        }

        // Sync translation volume slider with video volume slider
        const translateVolumeSlider = document.querySelector(
          "#VOTTranslationSlider"
        );

        if (!translateVolumeSlider) {
          return;
        }
        const translateVolume = Number(translateVolumeSlider.value);
        const finalValue = syncVolume(
          audio,
          value,
          translateVolume,
          tempOriginalVolume
        );

        translateVolumeSlider.value = finalValue;

        const translateVolumeLabel = document.querySelector(
          "#VOTTranslationVolume"
        );

        if (translateVolumeLabel) {
          translateVolumeLabel.innerText = `${finalValue}%`;
        }

        tempVolume = finalValue;
        tempOriginalVolume = value;
      };

      const menuOptions = document.querySelector(".translationMenuOptions");
      menuOptions.appendChild(slider);
    }

    async function addTranslationSlider() {
      // Return early if slider already exists or translation is not successful
      if (
        document.querySelector("#VOTTranslationSlider") ||
        document.querySelector(".translationBtn").dataset.state !== "success"
      ) {
        return;
      }

      // Use dbDefaultVolume or 100 as the default translation volume
      const defaultTranslateVolume =
        typeof dbDefaultVolume === "number" ? dbDefaultVolume : 100;
      tempOriginalVolume = defaultTranslateVolume;

      // Create a slider element with the default volume and label
      const slider = createMenuSlider(
        "VOTTranslationSlider",
        defaultTranslateVolume,
        `${translations[lang].VOTVolumeTranslation}: <b class = "volumePercent" id="VOTTranslationVolume">${defaultTranslateVolume}%</b>`
      );

      // Add an input event listener to the slider
      slider.querySelector("#VOTTranslationSlider").oninput = async ({
        target: { value },
      }) => {
        // Set the audio volume to the slider value
        audio.volume = value / 100;

        // Update the volume label
        document.querySelector("#VOTTranslationVolume").innerText = `${value}%`;

        // Update the database with the new volume value
        await updateDB({ defaultVolume: Number(value) });
        dbDefaultVolume = Number(value);

        // Sync translation volume with video volume if dbSyncVolume is 1
        if (dbSyncVolume === 1) {
          syncTranslationWithVideo(value);
        }
      };

      // Append the slider to the menu options
      const menuOptions = document.querySelector(".translationMenuOptions");
      menuOptions.appendChild(slider);
    }

    // A helper function to sync translation volume with video volume
    function syncTranslationWithVideo(translationValue) {
      // Get the video volume slider element
      const videoVolumeSlider = document.querySelector("#VOTVideoSlider");

      if (!videoVolumeSlider) {
        return;
      }
      // Get the video volume value
      const videoVolume = Number(videoVolumeSlider.value);

      // Calculate the synced video volume based on the translation volume
      const finalValue = syncVolume(
        video,
        translationValue,
        videoVolume,
        tempVolume
      );

      // Set the video volume slider value to the synced value
      videoVolumeSlider.value = finalValue;

      // Update the video volume label
      const videoVolumeLabel = document.querySelector("#VOTOriginalVolume");
      if (videoVolumeLabel) videoVolumeLabel.innerText = `${finalValue}%`;

      // Update the temp variables for future syncing
      tempOriginalVolume = finalValue;
      tempVolume = translationValue;
    }

    async function videoValidator() {
      if (window.location.hostname.includes("youtube.com")) {
        utils_debug.log("VideoValidator videoData: ", videoData);
        if (
          dontTranslateYourLang === 1 &&
          videoData.detectedLanguage === lang &&
          videoData.responseLanguage === lang
        ) {
          throw translations[lang].VOTDisableFromYourLang;
        }

        if (ytData.isLive) {
          throw translations[lang].VOTLiveNotSupported;
        }

        if (ytData.isPremiere) {
          throw translations[lang].VOTPremiere;
        }
        if (videoData.duration > 14_400) {
          throw translations[lang].VOTVideoIsTooLong;
        }
      }
      return true;
    }

    const translateExecutor = async (VIDEO_ID) => {
      if (!videoData.detectedLanguage) {
        videoData = await getVideoData();
        await setSelectMenuValues(
          videoData.detectedLanguage,
          videoData.responseLanguage
        );
      }
      utils_debug.log("Run videoValidator");
      await videoValidator();
      utils_debug.log("Run translateFunc");
      await translateFunc(
        VIDEO_ID,
        videoData.detectedLanguage,
        videoData.responseLanguage
      );
    };

    // Define a function to handle common events
    async function handleVideoEvent(event) {
      utils_debug.log(`video ${event.type}`);
      await lipSync(event.type);
    }

    // Define a function to stop translation and clean up
    async function stopTranslation() {
      await stopTraslate();
      await syncVideoVolumeSlider();
    }

    // Define a function to translate a video and handle the callback
    async function translateFunc(VIDEO_ID, requestLang, responseLang) {
      console.log("VOT Video Data: ", videoData);
      const videoURL = `${siteTranslates[siteHostname]}${VIDEO_ID}`;
      translateVideo(
        videoURL,
        translateFuncParam,
        requestLang,
        responseLang,
        async (success, urlOrError) => {
          utils_debug.log("[exec callback] translateVideo");
          if (getVideoId(siteHostname) !== VIDEO_ID) return;
          if (!success) {
            transformBtn("error", urlOrError);
            // if the error line contains information that the translation is being performed, then we wait
            if (urlOrError.includes(translations[lang].translationTake)) {
              clearTimeout(autoRetry);
              autoRetry = setTimeout(
                () => translateFunc(VIDEO_ID, requestLang, responseLang),
                60_000
              );
            }
            throw urlOrError;
          }

          audio.src = urlOrError;

          // cf version only
          if (
            false
          ) {}

          volumeOnStart = video?.volume;
          if (typeof dbDefaultVolume === "number") {
            audio.volume = dbDefaultVolume / 100;
          }
          if (
            typeof dbAutoSetVolumeYandexStyle === "number" &&
            dbAutoSetVolumeYandexStyle
          ) {
            video.volume = config/* autoVolume */.IM;
          }

          switch (siteHostname) {
            case "twitter":
              document
                .querySelector('div[data-testid="app-bar-back"][role="button"]')
                .addEventListener("click", stopTranslation);
              break;
            case "invidious":
            case "piped":
              break;
            default:
              if (siteEvent !== null) {
                document.body.addEventListener(siteEvent, stopTranslation);
              }
              break;
          }

          const siteHostnames = [
            "twitch",
            "vimeo",
            "facebook",
            "rutube",
            "twitter",
            "bilibili.com",
            "mail.ru",
          ];
          for (let i = 0; i < siteHostnames.length; i++) {
            if (siteHostname === siteHostnames[i]) {
              const mutationObserver = new MutationObserver(
                async (mutations) => {
                  mutations.forEach(async (mutation) => {
                    if (
                      mutation.type === "attributes" &&
                      mutation.attributeName === "src" &&
                      mutation.target === video &&
                      mutation.target.src !== ""
                    ) {
                      stopTranslation();
                      firstPlay = true;
                    }
                  });
                }
              );
              mutationObserver.observe(videoContainer, {
                attributes: true,
                childList: false,
                subtree: true,
                attributeOldValue: true,
              });
              break;
            }
          }

          if (video && !video.paused) lipSync("play");
          const videos = document.querySelectorAll("video");
          const events = [
            "playing",
            "ratechange",
            "play",
            "abort",
            "waiting",
            "pause",
          ];
          videos.forEach((v) =>
            events.forEach((e) => v.addEventListener(e, handleVideoEvent))
          );
          transformBtn("success", translations[lang].disableTranslate);
          addVideoSlider();
          await addTranslationSlider();

          const VOTVideoSlider = document.querySelector("#VOTVideoSlider");
          if (VOTVideoSlider) VOTVideoSlider.value = config/* autoVolume */.IM * 100;

          const VOTOriginalVolume =
            document.querySelector("#VOTOriginalVolume");
          if (VOTOriginalVolume) {
            VOTOriginalVolume.innerText = `${config/* autoVolume */.IM * 100}%`;
          }

          const downloadBtn = document.querySelector(".translationDownload");
          downloadBtn.href = urlOrError;
          downloadBtn.style.display = "initial";
        }
      );
    }

    document.addEventListener("click", async (event) => {
      const block = document.querySelector(".translationBlock");
      const menuContainer = document.querySelector(".translationMenuContent");
      const isBlock =
        block || event.target === block ? block.contains(event.target) : false;
      const isContent =
        menuContainer || event.target === menuContainer
          ? menuContainer.contains(event.target)
          : false;
      const isVideo =
        videoContainer || event.target === videoContainer
          ? videoContainer.contains(event.target)
          : false;

      utils_debug.log(`[document click] ${isBlock} ${isContent} ${isVideo}`);
      if (!(!isBlock && !isContent)) return;
      if (!isVideo) logout(0);

      menuContainer.style.display = "none";
      openedMenu = false;
    });

    const addEventListeners = (element, events, handler) => {
      events.forEach((event) =>
        element.addEventListener(event, async (event) => {
          await handler(event);
        })
      );
    };

    if (siteHostname === "pornhub") {
      if (window.location.pathname.includes("view_video.php")) {
        const videoElement = document.querySelector(
          ".original.mainPlayerDiv > video-element > div"
        );
        addEventListeners(videoElement, ["mousemove", "mouseout"], resetTimer);
      } else if (window.location.pathname.includes("embed/")) {
        const playerElement = document.querySelector("#player");
        addEventListeners(playerElement, ["mousemove", "mouseout"], resetTimer);
      }
    } else if (siteHostname === "twitter") {
      const videoPlayerElement = document.querySelector(
        'div[data-testid="videoPlayer"'
      );
      addEventListeners(
        videoPlayerElement,
        ["mousemove", "mouseout"],
        resetTimer
      );
    } else {
      addEventListeners(videoContainer, ["mousemove", "mouseout"], resetTimer);
    }

    document
      .querySelector(".translationBlock")
      .addEventListener("mousemove", (event) =>
        changeOpacityOnEvent(event, timer, opacityRatio)
      );
    document
      .querySelector(".translationMenuContent")
      .addEventListener("mousemove", (event) =>
        changeOpacityOnEvent(event, timer, opacityRatio)
      );

    document.addEventListener("touchstart", (event) =>
      changeOpacityOnEvent(event, timer, opacityRatio)
    );
    document.addEventListener("touchmove", (event) =>
      changeOpacityOnEvent(event, timer, opacityRatio)
    );
    document.addEventListener("touchend", (event) =>
      changeOpacityOnEvent(event, timer, opacityRatio)
    );
    document.querySelectorAll("video").forEach((video) => {
      video.addEventListener("abort", async () => {
        utils_debug.log("lipsync mode is abort");
        await stopTranslation();
        videoData = "";
      });
    });

    document
      .querySelector(".translationBtn")
      .addEventListener("click", async (event) => {
        utils_debug.log("[click translationBtn] before all functions & methods");
        event.stopPropagation();
        event.stopImmediatePropagation();

        // check if the audio source is not empty
        if (audio.src) {
          utils_debug.log("[click translationBtn] audio.src is not empty");
          await stopTraslate();
          return;
        }

        try {
          utils_debug.log("[click translationBtn] trying execute translation");
          const VIDEO_ID = getVideoId(siteHostname);

          if (!VIDEO_ID) {
            throw translations[lang].VOTNoVideoIDFound;
          }

          await translateExecutor(VIDEO_ID);
        } catch (err) {
          transformBtn("error", String(err).substring(4, err.length));
          console.error(err);
        }
      });

    video.addEventListener("progress", async (event) => {
      event.stopPropagation();

      if (!(firstPlay && dbAutoTranslate === 1)) {
        return;
      }
      const VIDEO_ID = getVideoId(siteHostname);

      if (!VIDEO_ID) {
        throw translations[lang].VOTNoVideoIDFound;
      }

      try {
        await translateExecutor(VIDEO_ID);
        firstPlay = false;
      } catch (err) {
        transformBtn("error", String(err).substring(4, err.length));
        firstPlay = false;
      }
    });
  }

  async function initWebsite() {
    utils_debug.log("Runned initWebsite function");
    if (config_regexes.youtubeRegex.test(window.location.hostname)) {
      if (window.location.pathname.includes("embed")) {
        const videoContainer = document.querySelector(".html5-video-container");
        await translateProccessor(videoContainer, "youtube", null);
        return;
      }

      utils_debug.log("[initWebsite] Found a match with youtube hostname");
      const ytPageEnter = () => {
        const videoContainer = document.querySelector(
          config_selectors.youtubeSelector
        );
        if (videoContainer) {
          utils_debug.log("[exec] translateProccessor youtube on page enter");
          translateProccessor(videoContainer, "youtube", "yt-translate-stop");
        } else {
          if (!ytplayer || !ytplayer.config) {
            utils_debug.log("[exec] ytplayer is null");
            return;
          }
          ytplayer.config.args.jsapicallback = () => {
            utils_debug.log(
              "[exec] translateProccessor youtube on page enter (ytplayer.config.args.jsapicallback)"
            );
            translateProccessor(videoContainer, "youtube", "yt-translate-stop");
          };
        }
      };

      document.addEventListener("spfdone", ytPageEnter);
      document.addEventListener("yt-navigate-finish", ytPageEnter);

      const ytPageLeave = () => {
        document.body.dispatchEvent(new Event("yt-translate-stop"));
      };

      document.addEventListener("spfrequest", ytPageLeave);
      document.addEventListener("yt-navigate-start", ytPageLeave);

      if (window.location.hostname.includes("m.youtube.com")) {
        let ytmobile = await waitForElm("#player");
        if (ytmobile) {
          await sleep(2300);
          await translateProccessor(ytmobile, "youtube", "yt-translate-stop");

          const mutationObserver = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "src"
              ) {
                ytmobile = await waitForElm("#player");
                await sleep(2300);
                await translateProccessor(
                  ytmobile,
                  "youtube",
                  "yt-translate-stop"
                );
              }
            }
          });

          mutationObserver.observe(ytmobile, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
          });
        }
        const ytPageLeave = () => {
          document.body.dispatchEvent(new Event("yt-translate-stop"));
        };
        document.addEventListener("spfdone", ytPageLeave);
        document.addEventListener("yt-navigate-finish", ytPageLeave);
        document.addEventListener("spfrequest", ytPageLeave);
        document.addEventListener("yt-navigate-start", ytPageLeave);
      }
      return;
    }
    if (window.location.hostname.includes("twitch.tv")) {
      utils_debug.log("[initWebsite] Found a match with twitch.tv");
      if (
        window.location.hostname.includes("m.twitch.tv") &&
        (window.location.pathname.includes("/videos/") ||
          window.location.pathname.includes("/clip/"))
      ) {
        utils_debug.log("[initWebsite] Matched Twitch Mobile");
        const el = await waitForElm(config_selectors.twitchMobileSelector);
        if (el) {
          await sleep(200);
          const twitchMobileSelector = document.querySelector(
            config_selectors.twitchMobileSelector
          );
          await translateProccessor(twitchMobileSelector, "twitch", null);

          const mutationObserver = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "src" &&
                mutation.target === twitchMobileSelector?.querySelector("video")
              ) {
                await sleep(1000);
                await translateProccessor(twitchMobileSelector, "twitch", null);
              }
            }
          });

          mutationObserver.observe(twitchMobileSelector, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
          });
        }
      } else if (
        window.location.hostname.includes("player.twitch.tv") ||
        window.location.hostname.includes("clips.twitch.tv") ||
        window.location.pathname.includes("/videos/") ||
        window.location.pathname.includes("/clip/")
      ) {
        utils_debug.log("[initWebsite] Matched Twitch Desktop");
        const el = await waitForElm(config_selectors.twitchSelector);
        if (el) {
          await sleep(200);
          await translateProccessor(el, "twitch", null);
        }
      }
      utils_debug.log("[initWebsite] Exit function in the twitch section");
      return;
    }
    if (window.location.hostname.includes("xvideos.com")) {
      utils_debug.log("[entered] xvideos");
      await sleep(1000);
      await translateProccessor(
        document.querySelector(".video-bg-pic"),
        "xvideos",
        null
      );
      return;
    }
    if (window.location.hostname.includes("pornhub.com")) {
      utils_debug.log("[entered] pornhub");
      await sleep(1000);
      await translateProccessor(
        document.querySelector(".mgp_videoWrapper"),
        "pornhub",
        null
      );
      return;
    }
    if (sitesInvidious.includes(window.location.hostname)) {
      // Need an additional extension to work in chrome-like browsers
      utils_debug.log("[entered] invidious");
      await translateProccessor(
        document.querySelector("#player"),
        "youtube",
        null
      );
    } else if (sitesPiped.includes(window.location.hostname)) {
      // Need an additional extension to work in chrome-like browsers
      utils_debug.log("[entered] piped");
      const el = await waitForElm(config_selectors.pipedSelector);
      if (el) {
        let videoIDNew;
        let videoID = getVideoId("youtube");
        await translateProccessor(el, "youtube", "piped");
        setInterval(async () => {
          videoIDNew = getVideoId("youtube");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(config_selectors.pipedSelector),
                "youtube",
                "piped"
              );
            }
            videoID = videoIDNew;
          }
        }, 3000);
      }
    } else if (/^(www.|m.)?vk.(com|ru)$/.test(window.location.hostname)) {
      utils_debug.log("[entered] vk.com");
      const el = await waitForElm(config_selectors.vkSelector);
      if (el) {
        await translateProccessor(
          document.querySelector(config_selectors.vkSelector),
          "vk",
          null
        );
        let videoIDVKNew;
        let videoIDVK = getVideoId("vk");
        setInterval(async () => {
          videoIDVKNew = getVideoId("vk");
          if (videoIDVK !== videoIDVKNew) {
            if (videoIDVKNew) {
              const el = await waitForElm(config_selectors.vkSelector);
              if (el) {
                await translateProccessor(el, "vk", null);
              }
            }
            videoIDVK = videoIDVKNew;
          }
        }, 3000);
      }
    } else if (window.location.hostname.includes("vimeo.com")) {
      utils_debug.log("[entered] vimeo.com");
      const el = await waitForElm(config_selectors.vimeoSelector);
      if (el) {
        await sleep(1000);
        await translateProccessor(
          document.querySelector(config_selectors.vimeoSelector),
          "vimeo",
          null
        );
      }
    } else if (window.location.hostname.includes("9gag.com")) {
      await sleep(1000);
      await translateProccessor(
        document.querySelector(config_selectors.gagSelector),
        "9gag",
        null
      );
    } else if (window.location.hostname.includes("coub.com")) {
      await sleep(1000);
      await translateProccessor(
        document.querySelector(".viewer__player"),
        "coub",
        null
      );
    } else if (window.location.hostname.includes("bitchute.com")) {
      await sleep(1000);
      await translateProccessor(
        document.querySelector(".plyr__video-wrapper"),
        "bitchute",
        null
      );
    } else if (window.location.hostname.includes("rutube.ru")) {
      const elementSelector = window.location.pathname.includes("/play/embed")
        ? "#app > div > div"
        : ".video-player > div > div > div:nth-child(2)";

      const el = await waitForElm(elementSelector);
      if (el) {
        await translateProccessor(el, "rutube", null);
      }
    } else if (window.location.hostname.includes("bilibili.com")) {
      if (window.location.pathname.includes("/video/")) {
        const el = await waitForElm(config_selectors.bilibilicomSelector);
        if (el) {
          await translateProccessor(el, "bilibili.com", null);
        }
      } else if (
        window.location.pathname.includes(
          "/blackboard/webplayer/embed-old.html"
        )
      ) {
        const el = await waitForElm("video");
        if (el) {
          await translateProccessor(el.parentElement, "bilibili.com", null);
        }
      }
    } else if (window.location.hostname.includes("twitter.com")) {
      const el = await waitForElm(config_selectors.twitterSelector);
      if (el) {
        let videoIDNew;
        let videoID = getVideoId("twitter");
        await translateProccessor(el, "twitter", null);
        setInterval(async () => {
          videoIDNew = getVideoId("twitter");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(config_selectors.twitterSelector),
                "twitter",
                null
              );
            }
            videoID = videoIDNew;
          }
        }, 3000);
      }
    } else if (window.location.hostname.includes("my.mail.ru")) {
      const el = await waitForElm(config_selectors.mailSelector);
      if (el) {
        let videoIDNew;
        let videoID = getVideoId("mail.ru");
        await translateProccessor(el, "mail.ru", null);
        setInterval(async () => {
          videoIDNew = getVideoId("mail.ru");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(config_selectors.mailSelector),
                "mail.ru",
                null
              );
            }
            videoID = videoIDNew;
          }
        }, 3000);
      }
    }
  }

  await initWebsite();
}

src_main().catch((e) => {
  console.error(e);
});

})();

/******/ })()
;