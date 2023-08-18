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
// @version 1.4.0.1
// @author sodapng, mynovelhost, Toil, SashaXser, MrSoczekXD
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
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/css-loader/dist/runtime/noSourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.translationBlock {
  padding: 0.45rem !important;
  width: max-content;
  position: absolute;
  background: #2e2f34;
  border-radius: 0.5rem !important;
  left: 50%;
  top: 5rem;
  transform: translate(-50%);
  text-align: center;
  opacity: 0;
  transition: opacity 1s;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 100;
}

.translationBtn {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  color: #fff;
  padding-right: 0.25rem !important;
  cursor: pointer;
  font: 600 12px / 14px "Segoe UI", BlinkMacSystemFont, Arial, sans-serif;
}

.translationBlock:hover {
  opacity: 1;
}

.translationMenu {
  display: inline-block;
  vertical-align: middle;
  border-left: 1px solid #424348;
  max-height: 16px;
  max-width: 24px;
  cursor: pointer;
}

.translationMenuIcon {
  padding: 0 10px !important;
  width: 24px;
}

.translationIAlice {
  display: inline-block;
  vertical-align: middle;
  max-height: 26px;
  max-width: 50px;
}

.translationIconAlice {
  height: 24px !important;
  width: 24px !important;
}

.translationITranslate {
  display: inline-block;
  vertical-align: middle;
  max-height: 20px;
  max-width: 20px;
}

.translationMenuContent {
  position: absolute;
  background: #2e2f34;
  color: #fff;
  display: none;
  border-radius: 1rem !important;
  left: 50%;
  top: 10rem;
  transform: translate(-50%);
  text-align: left;
  font: 600 14px / 16px "Segoe UI", BlinkMacSystemFont, Arial, sans-serif !important;

  width: 300px;
  /* height: 375px; */
  opacity: 0;
  z-index: 100;
  transition: opacity 0.5s ease;
}

.VOTMenuSlider {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 268px !important;
  height: 8px !important;
  outline: none !important;
  margin-top: 0.5rem;
  opacity: 0.7;
  /* background: #3C3F4D !important; */
  background: rgb(253, 222, 85, 0.6) !important;
  border: none !important;
  border-radius: 2rem !important;
  -webkit-transition: 0.2s !important;
  transition: opacity 0.2s ease !important;
}

.VOTMenuSlider:hover {
  opacity: 1;
}

.VOTMenuSlider::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  border: none !important;
  background: #fff !important;
  cursor: pointer !important;
}

.VOTMenuSlider::-moz-range-thumb {
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  border: none !important;
  background: #fff !important;
  cursor: pointer !important;
}

.VOTMenuSlider::-ms-thumb {
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  border: none !important;
  background: #fff !important;
  cursor: pointer !important;
}

.VOTMenuSlider::-ms-fill-lower {
  height: 8px !important;
  border-radius: 2rem !important;
  background: linear-gradient(
    90.1deg,
    rgba(186, 153, 244, 0.85) -5.78%,
    rgba(236, 138, 202, 0.7) 56.46%,
    rgba(239, 168, 117, 0.6) 108.93%
  ) !important;
}

.VOTMenuSlider::-moz-range-progress {
  height: 8px !important;
  border-radius: 2rem !important;
  background: linear-gradient(
    90.1deg,
    rgba(186, 153, 244, 0.85) -5.78%,
    rgba(236, 138, 202, 0.7) 56.46%,
    rgba(239, 168, 117, 0.6) 108.93%
  ) !important;
}

.translationHeader {
  padding-bottom: 0.5rem !important;
}

.translationMainHeader {
  margin: 16px !important;
  color: #fff;
  font: 900 14px / 16px "Segoe UI", BlinkMacSystemFont, Arial, sans-serif !important;
}

.translationMenuOptions {
  display: flex;
  flex-flow: column wrap;
}

.translationMenuContainer {
  /* width: 100%; */
  padding-left: 16px !important;
  padding-top: 5px !important;
  display: inline-block !important;
}

.translationMenuContainer > input {
  appearance: auto !important;
  vertical-align: text-bottom;
}

.translationMenuText {
  color: #fff;
  display: inline-flex;
  width: 80%;
}

.translationVolumeBox,
.translationVideoVolumeBox {
  padding-top: 0.5rem !important;
}

.translationDropDB {
  border: none !important;
  border-radius: 4px !important;
  background: #5426ff !important;
  color: #fff !important;
  padding: 6px 16px !important;
  margin-left: auto !important;
  cursor: pointer !important;
}

.translationDownload {
  background: #5426ff !important;
  color: #fff !important;
  padding: 2px 10px !important;
  border-radius: 4px !important;
  cursor: pointer;
  display: none;
}

.translationMenuFunctional {
  display: flex;
  margin: 16px !important;
}

.VOTMenuSelect {
  width: 110px;
  border-radius: 5px !important;
  border: 1px solid #dadce0 !important;
  box-shadow: 0 1px 3px -2px #9098a9;
  box-sizing: border-box !important;
  color: #2e2f34 !important;
  background: #fff !important;
  padding: 5px !important;
}

.VOTMenuSelect:focus {
  outline: none;
}

.VOTMenuSelect:focus {
  outline: none;
  border-color: #0077ff;
  box-shadow: 0 0 0 2px rgba(#0077ff, 0.2);
}

#VOTSelectLanguages {
  display: flex !important;
  margin-left: 5px;
}

#VOTSelectLanguages svg {
  margin: 0 5px;
}

#VOTSubtitlesLangContainer {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  margin-left: 5px;
}

#VOTSubtitlesLang {
  margin-right: 25px;
}

.VOTSubtitlesWidget {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 50%;
  max-height: 100%;
  min-height: 20%;
  z-index: 100;
  left: 25%;
  top: 75%;
  pointer-events: none;
}

.VOTSubtitlesWidget > div {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  width: max-content;
  background: #2e2f34cc;
  border-radius: 1rem;
  pointer-events: all;
  padding: 1rem;
  font-size: 2rem;
  box-sizing: border-box;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.VOTSubtitlesWidget .passed {
  color: #9e84ff;
}
`, ""]);
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

/***/ "./src/styles/main.css":
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./node_modules/css-loader/dist/cjs.js!./src/styles/main.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z, options);




       /* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z && _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z.locals ? _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z.locals : undefined);


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

/***/ "./src/config/alternativeUrls.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   U: () => (/* binding */ sitesPiped),
/* harmony export */   a: () => (/* binding */ sitesInvidious)
/* harmony export */ });
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




/***/ }),

/***/ "./src/config/config.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   I1: () => (/* binding */ yandexHmacKey),
/* harmony export */   IM: () => (/* binding */ autoVolume),
/* harmony export */   Rr: () => (/* binding */ yandexUserAgent),
/* harmony export */   iF: () => (/* binding */ workerHost)
/* harmony export */ });
// CONFIGURATION
const workerHost = "api.browser.yandex.ru";
const yandexHmacKey = "xtGCyGdTY2Jy6OMEKdTuXev3Twhkamgm";
const yandexUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 YaBrowser/23.7.1.1140 Yowser/2.5 Safari/537.36";
const autoVolume = 0.15; // 0.0 - 1.0 (0% - 100%) - default volume of the video with the translation




/***/ }),

/***/ "./src/config/constants.js":
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Iz: () => (/* binding */ translations),
/* harmony export */   g$: () => (/* binding */ siteTranslates),
/* harmony export */   tW: () => (/* binding */ availableLangs),
/* harmony export */   zL: () => (/* binding */ additionalTTS)
/* harmony export */ });

// available languages for translation
const availableLangs = [
  "ru",
  "en",
  "zh",
  "ko",
  "ar",
  "fr",
  "it",
  "es",
  "de",
  "ja",
];

// Additional languages working with TTS
const additionalTTS = [
  "bn",
  "pt",
  "cs",
  "hi",
  "mr", // TODO: Add menu translation (MAYBE)
  "te", // TODO: Add menu translation (MAYBE)
  "tr",
  "ms",
  "vi",
  "ta", // TODO: Add menu translation (MAYBE)
  "jv",
  "ur",
  "fa",
  "gu", // TODO: Add menu translation (MAYBE)
  "id",
  "uk",
  "kk",
];

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
let translations = {
  ru: {
    unSupportedExtensionError: `Ошибка! ${GM_info.scriptHandler} не поддерживается этой версией расширения!\n\nПожалуйста, используйте cloudflare-версию расширения VOT.`,
    VOTDisabledForDBUpdating: `VOT отключен из-за ошибки при обновление Базы Данных. Закройте все открытые вкладки с ${window.location.hostname} и попробуйте снова`,
  },
  en: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} is not supported by this version of the extension!\n\nPlease use the cloudflare version of the VOT extension.`,
    VOTDisabledForDBUpdating: `VOT is disabled due to an error when updating the Database. Close all open tabs with ${window.location.hostname} and try again`,
  },
  zh: {
    unSupportedExtensionError: `错误! 此版本的扩展不支持 ${GM_info.scriptHandler}!\n\n请使用cloudflare版本的VOT扩展.`,
    VOTDisabledForDBUpdating: `VOT由于更新数据库时出错而被禁用。 关闭所有打开的选项卡${window.location.hostname} 再试一次`,
  },
  ar: {
    unSupportedExtensionError: `خطأ! ${GM_info.scriptHandler} غير مدعوم من قبل هذه النسخة من الامتداد!\n\nيرجى استخدام نسخة cloudflare من امتداد VOT.`,
    VOTDisabledForDBUpdating: `VOT معطل بسبب خطأ عند تحديث قاعدة البيانات. أغلق جميع علامات التبويب المفتوحة مع ${window.location.hostname} وحاول مرة أخرى`,
  },
  ko: {
    unSupportedExtensionError: `오류! ${GM_info.scriptHandler}는 이 버전의 확장 프로그램에서 지원되지 않습니다!\n\nVOT 확장 프로그램의 클라우드플레어 버전을 사용하십시오.`,
    VOTDisabledForDBUpdating: `데이터베이스 업데이트 오류로 인해 VOT가 비활성화되었습니다. ${window.location.hostname}와 열려 있는 모든 탭을 닫고 다시 시도하십시오`,
  },
  de: {
    unSupportedExtensionError: `Fehler! ${GM_info.scriptHandler} wird von dieser Version der Erweiterung nicht unterstützt!\n\nBitte verwenden Sie die Cloudflare-Version der VOT-Erweiterung.`,
    VOTDisabledForDBUpdating: `VOT wurde aufgrund eines Fehlers beim Aktualisieren der Datenbank deaktiviert. Schließen Sie alle geöffneten Tabs mit ${window.location.hostname} und versuchen Sie es erneut`,
  },
  es: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} no es compatible con esta versión de la extensión!\n\nUtilice la versión cloudflare de la extensión VOT.`,
    VOTDisabledForDBUpdating: `VOT está deshabilitado debido a un error al actualizar la Base de Datos. Cierre todas las pestañas abiertas con ${window.location.hostname} y vuelve a intentarlo`,
  },
  fr: {
    unSupportedExtensionError: `Erreur! ${GM_info.scriptHandler} n'est pas supporté par cette version de l'extension!!\n\nVeuillez utiliser la version cloudflare de l'extension VOT.`,
    VOTDisabledForDBUpdating: `VOT est désactivé en raison d'une erreur lors de la mise à jour de la Base de Données. Fermez tous les onglets ouverts avec ${window.location.hostname} et essayez à nouveau`,
  },
  it: {
    unSupportedExtensionError: `Errore! ${GM_info.scriptHandler} non è supportato da questa versione dell'estensione!\n\nUtilizzare la versione cloudflare dell'estensione VOT.`,
    VOTDisabledForDBUpdating: `VOT è disabilitato a causa di un errore durante l'aggiornamento del database. CHIUDI tutte le schede aperte con ${window.location.hostname} e riprova`,
  },
  ja: {
    unSupportedExtensionError: `エラー！ ${GM_info.scriptHandler} はこのバージョンの拡張機能ではサポートされていません！\n\nVOT拡張機能のcloudflareバージョンを使用してください。`,
    VOTDisabledForDBUpdating: `データベース更新時のエラーのため、VOTは無効になっています。${window.location.hostname} を開いているすべてのタブを閉じて、もう一度お試しください。`,
  },
  pt: {
    unSupportedExtensionError: `Erro! ${GM_info.scriptHandler} não é suportado por esta versão da extensão!\n\nPor favor, use a versão do Cloudflare da extensão VOT.`,
    VOTDisabledForDBUpdating: `VOT está desativado devido a um erro ao atualizar o banco de dados. Feche todas as guias abertas em ${window.location.hostname} e tente novamente`,
  },
  cs: {
    unSupportedExtensionError: `Chyba! ${GM_info.scriptHandler} není podporován touto verzí rozšíření!\n\nProsím, použijte cloudflare-verzi rozšíření VOT.`,
    VOTDisabledForDBUpdating: `VOT je vypnut kvůli chybě při aktualizaci databáze. Zavřete všechny otevřené karty s ${window.location.hostname} a zkuste to znovu`,
  },
  hi: {
    unSupportedExtensionError: `त्रुटि! ${GM_info.scriptHandler} इस संस्करण के एक्सटेंशन का समर्थन नहीं करता है!\n\nकृपया, वीओटी के क्लाउडफ्लेयर-वर्शन का उपयोग करें।`,
    VOTDisabledForDBUpdating: `बाकी डेटाबेस अपडेट करने में त्रुटि के कारण, वीओटी निष्क्रिय हो गया है। कृपया ${window.location.hostname} के सभी खिड़कियों को बंद करें और फिर से प्रयास करें।`,
  },
  tr: {
    unSupportedExtensionError: `Hata! ${GM_info.scriptHandler} Bu uzantı sürümü tarafından desteklenmiyor!\n\nLütfen VOT'un cloudflare sürümünü kullanın.`,
    VOTDisabledForDBUpdating: `Veritabanı güncelleştirme hatası nedeniyle VOT kapalı. ${window.location.hostname} ile açık olan tüm sekmeleri kapatın ve tekrar deneyin.`,
  },
  vi: {
    unSupportedExtensionError: `Lỗi! ${GM_info.scriptHandler} không được hỗ trợ bởi phiên bản tiện ích mở rộng này!\n\nVui lòng sử dụng phiên bản cloudflare của tiện ích mở rộng VOT.`,
    VOTDisabledForDBUpdating: `VOT bị tắt do lỗi khi cập nhật cơ sở dữ liệu. Vui lòng đóng tất cả các tab mở với ${window.location.hostname} và thử lại`,
  },
  uk: {
    unSupportedExtensionError: `Помилка! ${GM_info.scriptHandler} не підтримується цією версією розширення!\n\nБудь ласка, використовуйте cloudflare-версію розширення VOT.`,
    VOTDisabledForDBUpdating: `VOT вимкнено через помилку при оновленні бази даних. Будь ласка, закрийте всі відкриті вкладки ${window.location.hostname} та спробуйте знову`,
  },
  kk: {
    unSupportedExtensionError: `Қате! ${GM_info.scriptHandler} бұл кеңейтімділіктің мұндай нұсқасын қолдаушы емес!\n\nCloudflare-версиясын қолданыңыз.`,
    VOTDisabledForDBUpdating: `Деректер базасын жаңарту кезінде VOT өшірілді. ${window.location.hostname} сайтындағы барлық терезелерді жабыңыз және қайтадан көріңіз`,
  },
  bn: {
    unSupportedExtensionError: `ত্রুটি! ${GM_info.scriptHandler} এই সংস্করণের এক্সটেনশানটি সমর্থিত নয়!\n\nদয়া করে cloudflare ভার্শনে এক্সটেনশানটি ব্যবহার করুন।`,
    VOTDisabledForDBUpdating: `ডাটাবেস আপডেট সময়ে VOT অক্ষম করা হয়েছে। ${window.location.hostname} সমস্ত ট্যাব বন্ধ করুন এবং আবার চেষ্টা করুন`,
  },
  ms: {
    unSupportedExtensionError: `Ralat! ${GM_info.scriptHandler} tidak disokong oleh versi sambungan ini!\n\nSila gunakan versi cloudflare sambungan VOT.`,
    VOTDisabledForDBUpdating: `VOT dimatikan kerana ralat semasa mengemaskini pangkalan data. Sila tutup semua tab yang dibuka di ${window.location.hostname} dan cuba sekali lagi`,
  },
  jv: {
    unSupportedExtensionError: `Kesalahan! ${GM_info.scriptHandler} ora ditandhani dening versi ekstensi iki!\n\nMangga gunakake versi cloudflare iki saka ekstensi VOT.`,
  },
  ur: {
    unSupportedExtensionError: `خرابی! ${GM_info.scriptHandler} اس ایکسٹینشن کے اس ورژن کی حمایت نہیں کرتا!\n\nبراہ کرم ایکسٹینشن VOT کے کلاؤڈ فلیئر ورژن کا استعمال کریں۔`,
    VOTDisabledForDBUpdating: `VOT ڈیٹا بیس کو اپ ڈیٹ کرتے وقت خرابی کی وجہ سے بند ہے۔ ${window.location.hostname} تمام کھلے پروگرامات کو بند کرکے دوبارہ کوشش کریں`,
  },
  fa: {
    unSupportedExtensionError: `خطا! ${GM_info.scriptHandler} برای این نسخه توسعه دهنده پشتیبانی نمی شود!\n\n لطفاً از نسخه CloudFlare افزونه VOT استفاده کنید.`,
    VOTDisabledForDBUpdating: `VOT به دلیل خطای به‌روزرسانی پایگاه داده غیرفعال شده است. تمام تب های با ${window.location.hostname} را ببندید و دوباره تلاش کنید.`,
  },
  id: {
    unSupportedExtensionError: `Error! ${GM_info.scriptHandler} tidak didukung oleh versi ekstensi ini! \n\nSilakan gunakan versi ekstensi Cloudflare VOT.`,
    VOTDisabledForDBUpdating: `VOT dinonaktifkan karena kesalahan saat pembaruan basis data. Tutup semua tab terbuka dengan ${window.location.hostname} dan coba lagi`,
  },
};

// временный вариант
const userlang = navigator.language ?? navigator.userLanguage;
let lang = userlang.substring(0, 2) ?? "en";

// укажите свой репозеторий
async function getTranslations(lang) {
  let response = await fetch(`https://raw.githubusercontent.com/SashaXser/voice-over-translation/master/localization/${lang}.json`, {
    method: "GET",
  });
  let json = await response.json();
  translations[lang] = { ...translations[lang], ...json };
}

// временный вариант
try {
  await getTranslations(lang);
} catch (error) {
  console.error(error)
}




__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ "./src/config/regexes.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const regexes = () => {
  return {
    youtubeRegex: /^(www.|m.)?youtube(-nocookie)?.com$/,
  };
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (regexes());


/***/ }),

/***/ "./src/config/selectors.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (selectors());


/***/ }),

/***/ "./src/getSignature.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   o: () => (/* binding */ getSignature)
/* harmony export */ });
/* harmony import */ var _config_config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/config/config.js");



async function getSignature(body) {
  // Create a key from the HMAC secret
  const utf8Encoder = new TextEncoder("utf-8");
  const key = await window.crypto.subtle.importKey(
    "raw",
    utf8Encoder.encode(
       false ? 0 : _config_config_js__WEBPACK_IMPORTED_MODULE_0__/* .yandexHmacKey */ .I1
    ),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );
  // Sign the body with the key
  const signature = await window.crypto.subtle.sign("HMAC", key, body);
  // Convert the signature to a hex string
  return Array.from(new Uint8Array(signature), (x) =>
    x.toString(16).padStart(2, "0")
  ).join("");
}




/***/ }),

/***/ "./src/getUUID.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   F: () => (/* binding */ getUUID)
/* harmony export */ });
function getUUID(isLower) {
  const uuid = ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
  return isLower ? uuid : uuid.toUpperCase();
}




/***/ }),

/***/ "./src/index.js":
/***/ ((__webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/styles/main.css");
/* harmony import */ var _utils_youtubeUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/utils/youtubeUtils.js");
/* harmony import */ var _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/yandexProtobuf.js");
/* harmony import */ var _utils_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/utils/utils.js");
/* harmony import */ var _config_config_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__("./src/config/config.js");
/* harmony import */ var _config_alternativeUrls_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__("./src/config/alternativeUrls.js");
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/config/constants.js");
/* harmony import */ var _indexedDB_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/indexedDB.js");
/* harmony import */ var _menu_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./src/menu.js");
/* harmony import */ var _utils_volume_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__("./src/utils/volume.js");
/* harmony import */ var _config_regexes_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("./src/config/regexes.js");
/* harmony import */ var _config_selectors_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("./src/config/selectors.js");
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("./src/utils/debug.js");
/* harmony import */ var _rvt_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("./src/rvt.js");
/* harmony import */ var _subtitles_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("./src/subtitles.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__, _config_constants_js__WEBPACK_IMPORTED_MODULE_4__, _indexedDB_js__WEBPACK_IMPORTED_MODULE_5__, _menu_js__WEBPACK_IMPORTED_MODULE_6__, _subtitles_js__WEBPACK_IMPORTED_MODULE_11__]);
([_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__, _config_constants_js__WEBPACK_IMPORTED_MODULE_4__, _indexedDB_js__WEBPACK_IMPORTED_MODULE_5__, _menu_js__WEBPACK_IMPORTED_MODULE_6__, _subtitles_js__WEBPACK_IMPORTED_MODULE_11__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);


















const sitesChromiumBlocked = [..._config_alternativeUrls_js__WEBPACK_IMPORTED_MODULE_12__/* .sitesInvidious */ .a, ..._config_alternativeUrls_js__WEBPACK_IMPORTED_MODULE_12__/* .sitesPiped */ .U];

// translate properties
let translateFromLang = "en"; // default language of video

let translateToLang = _menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ; // default language of audio response

let ytData = "";
let subtitlesList = [];
let subtitlesListVideoId = null;

async function main() {
  _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Loading extension...");
  _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(`Selected menu language: ${_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ}`);

  if (
     true &&
    GM_info?.scriptHandler &&
    ["Violentmonkey", "FireMonkey", "Greasemonkey", "AdGuard"].includes(
      GM_info.scriptHandler
    )
  ) {
    const errorText = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].unSupportedExtensionError}`;
    console.error(errorText);
    return alert(errorText);
  }

  _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Extension compatibility passed...");

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

    const container = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createTranslationMenu */ .NX)();
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
        (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .deleteDB */ .Lj)();
        location.reload();
      });

    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Added translation menu to ", element);
  }

  function translateVideo(url, duration, requestLang, responseLang, callback) {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
      `Translate video (url: ${url}, duration: ${duration}, requestLang: ${requestLang}, responseLang: ${responseLang})`
    );

    if (false) {}

    translationPanding = true;

    (0,_rvt_js__WEBPACK_IMPORTED_MODULE_10__/* ["default"] */ .Z)(
      url,
      duration,
      requestLang,
      responseLang,
      (success, response) => {
        translationPanding = false;

        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[exec callback] Requesting video translation");
        if (!success) {
          callback(false, _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].requestTranslationFailed);
          return;
        }

        const translateResponse =
          _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_2__/* .yandexProtobuf */ .X.decodeTranslationResponse(response);
        console.log("[VOT] Translation response: ", translateResponse);

        switch (translateResponse.status) {
          case 0:
            callback(false, translateResponse.message);
            break;
          case 1:
            callback(
              !!translateResponse.url,
              translateResponse.url || _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].audioNotReceived
            );
            break;
          case 2:
            callback(
              false,
              translateResponse.remainingTime
                ? (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .secsToStrTime */ .PG)(translateResponse.remainingTime)
                : _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].translationTakeFewMinutes
            );
            break;
          case 3:
            /*
              Иногда, в ответе приходит статус код 3, но видео всё, так же, ожидает перевода.
              В конечном итоге, это занимает слишком много времени,
              как-будто сервер не понимает, что данное видео уже недавно было переведено
              и заместо возвращения готовой ссылки на перевод начинает переводить видео заново
              при чём у него это получается за очень длительное время.
            */
            callback(false, _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].videoBeingTranslated);
            break;
        }
      }
    );
  }

  async function translateProccessor(videoContainer, siteHostname, siteEvent) {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[translateProccessor] execute on element: ", videoContainer);

    let video;
    let autoRetry;
    let volumeOnStart;
    let tempOriginalVolume;
    let tempVolume;
    let dbSubtitlesMaxLength;
    let dbHighlightWords;
    let dbAutoTranslate;
    let dbDefaultVolume;
    let dbShowVideoSlider;
    let dbAutoSetVolumeYandexStyle;
    let dontTranslateYourLang;
    let dbSyncVolume;
    let dbResponseLanguage;
    let dbAudioProxy; // cf version only
    let firstPlay = true;
    let isDBInited;
    let videoData = "";

    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("videoContainer", videoContainer);

    video =
      siteHostname === "vimeo"
        ? videoContainer.querySelector(
            ".vp-video-wrapper > .vp-video > .vp-telecine > video"
          )
        : videoContainer.querySelector("video");

    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("video", video);

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

    (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .addTranslationBlock */ .Ot)(container);
    addTranslationMenu(container);
    if (
      window.location.hostname.includes("youtube.com") &&
      !window.location.hostname.includes("m.youtube.com")
    ) {
      (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .addSubtitlesWidget */ .e7)(container.parentElement);
    } else {
      (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .addSubtitlesWidget */ .e7)(container);
    }
    await changeSubtitlesLang("disabled");

    try {
      isDBInited = await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .initDB */ .zK)();
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
          label: _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].videoLanguage,
          value: "default",
          disabled: true,
        },
        ...(0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .genOptionsByOBJ */ .Ef)(_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .availableLangs */ .tW, videoData.detectedLanguage),
      ];

      const selectToLangOptions = [
        {
          label: _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].translationLanguage,
          value: "default",
          disabled: true,
        },
        ...(0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .genOptionsByOBJ */ .Ef)(_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .availableLangs */ .tW, videoData.responseLanguage),
        {
          label: "─────────",
          value: "separator",
          disabled: true,
        },
        ...(0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .genOptionsByOBJ */ .Ef)(_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .additionalTTS */ .zL, videoData.responseLanguage),
      ];

      const selectFromLang = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSelect */ .Mr)(
        "VOTTranslateFromLang",
        selectFromLangOptions
      );

      const selectToLang = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSelect */ .Mr)(
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
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[onchange] select from language", event.target.value);
          videoData = await getVideoData();
          await setSelectMenuValues(
            event.target.value,
            videoData.responseLanguage
          );
        });

      menuOptions
        .querySelector("#VOTTranslateToLang")
        .addEventListener("change", async (event) => {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[onchange] select to language", event.target.value);
          if (isDBInited) {
            translateToLang = event.target.value;
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ responseLanguage: event.target.value });
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
              "Response Language value changed. New value: ",
              event.target.value
            );
          }
          videoData = await getVideoData();
          await setSelectMenuValues(
            videoData.detectedLanguage,
            event.target.value
          );
        });
    }

    async function changeSubtitlesLang(subs) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[onchange] subtitles", subs);
      const select = document
        .querySelector(".translationMenuOptions")
        ?.querySelector("#VOTSubtitlesLang");
      select && (select.value = subs);
      if (!video) {
        console.error("[VOT] video not found");
        select && (select.value = "disabled");
        return;
      }
      if (subs === "disabled") {
        (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesWidgetContent */ .Bv)(video, null);
      } else {
        (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesWidgetContent */ .Bv)(
          video,
          await (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .fetchSubtitles */ .Hl)(subtitlesList.at(parseInt(subs)))
        );
      }
    }

    async function updateSubtitlesLangSelect() {
      const select = document
        .querySelector(".translationMenuOptions")
        ?.querySelector("#VOTSubtitlesLang");

      if (!select) {
        console.error("[VOT] #VOTSubtitlesLang not found");
        return;
      }

      const oldValue = select.value;
      select.innerHTML = "";

      const disabledOption = document.createElement("option");
      disabledOption.value = "disabled";
      disabledOption.innerHTML = _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTSubtitlesDisabled;
      select.append(disabledOption);

      for (let i = 0; i < subtitlesList.length; i++) {
        const s = subtitlesList[i];
        const option = document.createElement("option");
        option.value = i;
        option.innerHTML =
          (_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].langs[s.language] ?? s.language.toUpperCase()) +
          (s.translatedFromLanguage
            ? ` ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTTranslatedFrom} ${
                _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].langs[s.translatedFromLanguage] ??
                s.translatedFromLanguage.toUpperCase()
              }`
            : "") +
          (s.source !== "yandex" ? ` ${s.source}` : "") +
          (s.isAutoGenerated
            ? ` (${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTAutogenerated})`
            : "");
        select.append(option);
      }

      await changeSubtitlesLang(oldValue);
    }

    if (menuOptions && !menuOptions.querySelector("#VOTSubtitlesLang")) {
      const options = [
        {
          label: _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTSubtitlesDisabled,
          value: "disabled",
          disabled: false,
        },
      ];

      const select = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSelect */ .Mr)("VOTSubtitlesLang", options);

      select.id = "VOTSubtitlesLangContainer";
      const span = document.createElement("span");
      span.textContent = _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTSubtitles;
      select.prepend(span);

      menuOptions.appendChild(select);

      menuOptions
        .querySelector("#VOTSubtitlesLang")
        .addEventListener("change", async (event) => {
          await changeSubtitlesLang(event.target.value);
        });
    }

    if (isDBInited) {
      const dbData = await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .readDB */ .CZ)();
      if (dbData) {
        dbSubtitlesMaxLength = dbData.subtitlesMaxLength;
        dbHighlightWords = dbData.highlightWords;
        dbAutoTranslate = dbData.autoTranslate;
        dbDefaultVolume = dbData.defaultVolume;
        dbShowVideoSlider = dbData.showVideoSlider;
        dbAutoSetVolumeYandexStyle = dbData.autoSetVolumeYandexStyle;
        dontTranslateYourLang = dbData.dontTranslateYourLang;
        dbResponseLanguage = dbData.responseLanguage;
        dbAudioProxy = dbData.audioProxy; // cf version only
        dbSyncVolume = dbData.syncVolume; // youtube only

        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[db] data from db: ", dbData);

        if (dbSubtitlesMaxLength !== undefined) {
          (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesMaxLength */ .Lg)(dbSubtitlesMaxLength);
        }

        if (dbHighlightWords !== undefined) {
          (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesHighlightWords */ .b6)(dbHighlightWords);
        }

        if (dbResponseLanguage !== undefined) {
          videoData = await getVideoData();
          setSelectMenuValues(videoData.detectedLanguage, dbResponseLanguage);
          translateToLang = dbResponseLanguage;
        }

        if (
          dbSubtitlesMaxLength !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTSubtitlesMaxLengthSlider")
        ) {
          const slider = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSlider */ .iT)(
            "VOTSubtitlesMaxLengthSlider",
            dbSubtitlesMaxLength,
            `${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTSubtitlesMaxLength}: <b id="VOTSubtitlesMaxLengthValue">${dbSubtitlesMaxLength}</b>`,
            50,
            300
          );

          slider.querySelector("#VOTSubtitlesMaxLengthSlider").oninput = async (
            event
          ) => {
            const value = Number(event.target.value);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ subtitlesMaxLength: value });
            dbSubtitlesMaxLength = value;
            slider.querySelector(
              "#VOTSubtitlesMaxLengthValue"
            ).innerText = `${value}`;
            (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesMaxLength */ .Lg)(value);
          };

          menuOptions.appendChild(slider);
        }

        if (
          dbHighlightWords !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTHighlightWords")
        ) {
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTHighlightWords",
            dbHighlightWords,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTHighlightWords
          );

          checkbox.querySelector("#VOTHighlightWords").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ highlightWords: value });
            dbHighlightWords = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
              "highlightWords value changed. New value: ",
              dbHighlightWords
            );
            (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .setSubtitlesHighlightWords */ .b6)(value);
          };

          menuOptions.appendChild(checkbox);
        }

        if (
          dbAutoTranslate !== undefined &&
          menuOptions &&
          !menuOptions.querySelector("#VOTAutoTranslate")
        ) {
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTAutoTranslate",
            dbAutoTranslate,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTAutoTranslate +
              (siteHostname === "vk" ||
              window.location.hostname.includes("m.twitch.tv")
                ? ` <strong>(${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].recommended})</strong>`
                : "")
          );

          checkbox.querySelector("#VOTAutoTranslate").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ autoTranslate: value });
            dbAutoTranslate = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
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
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTDontTranslateYourLang",
            dontTranslateYourLang,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTDontTranslateYourLang
          );

          checkbox.querySelector("#VOTDontTranslateYourLang").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ dontTranslateYourLang: value });
            dontTranslateYourLang = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
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
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTAutoSetVolume",
            dbAutoSetVolumeYandexStyle,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTAutoSetVolume + `${_config_config_js__WEBPACK_IMPORTED_MODULE_13__/* .autoVolume */ .IM * 100}%`
          );

          checkbox.querySelector("#VOTAutoSetVolume").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ autoSetVolumeYandexStyle: value });
            dbAutoSetVolumeYandexStyle = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
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
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTShowVideoSlider",
            dbShowVideoSlider,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTShowVideoSlider
          );

          checkbox.querySelector("#VOTShowVideoSlider").onclick = async (
            event
          ) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ showVideoSlider: value });
            dbShowVideoSlider = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
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
          const checkbox = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuCheckbox */ .H0)(
            "VOTSyncVolume",
            dbSyncVolume,
            _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTSyncVolume
          );

          checkbox.querySelector("#VOTSyncVolume").onclick = async (event) => {
            event.stopPropagation();
            const value = Number(event.target.checked);
            await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ syncVolume: value });
            dbSyncVolume = value;
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("syncVolume value changed. New value: ", dbSyncVolume);
          };

          menuOptions.appendChild(checkbox);
        }

        // cf version only
        if (
          false
        ) {}
      }
    }

    (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("none", _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].translateVideo);

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
      console.log(`[VOT] Set translation from ${from} to ${to}`);
      videoData.detectedLanguage = from;
      videoData.responseLanguage = to;
    }

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
      (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("none", _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].translateVideo);
      // temp fix
      if (window.location.hostname.includes("youtube.com")) {
        document.querySelector(".html5-video-player").setVolume(100);
      }
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

      videoData.videoId = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)(siteHostname);

      videoData.detectedLanguage = translateFromLang;

      videoData.responseLanguage = translateToLang;

      if (window.location.hostname.includes("youtube.com")) {
        ytData = await _utils_youtubeUtils_js__WEBPACK_IMPORTED_MODULE_1__/* .youtubeUtils */ .K.getVideoData();
        if (ytData.author !== "") {
          videoData.detectedLanguage = ytData.detectedLanguage;
          videoData.responseLanguage = translateToLang;
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
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync video", video);
      if (!video) {
        return;
      }
      audio.currentTime = video.currentTime;
      audio.playbackRate = video.playbackRate;

      if (!mode) {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is not set");
        return;
      }

      if (mode === "play") {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is play");
        const audioPromise = audio.play();
        if (audioPromise !== undefined) {
          audioPromise.catch((e) => {
            console.error("[VOT]", e);
            if (e.name === "NotAllowedError") {
              const errorMessage = _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].grantPermissionToAutoPlay;
              (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("error", errorMessage);
              throw `[VOT] ${errorMessage}`;
            } else if (e.name === "NotSupportedError") {
              const errorMessage = sitesChromiumBlocked.includes(
                window.location.hostname
              )
                ? _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].neededAdditionalExtension
                : _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].audioFormatNotSupported;
              (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("error", errorMessage);
              throw `[VOT] ${errorMessage}`;
            }
          });
        }
        return;
      }
      if (mode === "pause") {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is pause");
        audio.pause();
      }
      if (mode === "stop") {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is stop");
        audio.pause();
      }
      if (mode === "waiting") {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is waiting");
        audio.pause();
      }
      if (mode === "playing") {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is playing");
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

      const slider = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSlider */ .iT)(
        "VOTVideoSlider",
        newVolume,
        `${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTVolume}: <b class = "volumePercent" id="VOTOriginalVolume">${newVolume}%</b>`
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
        const finalValue = (0,_utils_volume_js__WEBPACK_IMPORTED_MODULE_14__/* .syncVolume */ .C)(
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
      const slider = (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .createMenuSlider */ .iT)(
        "VOTTranslationSlider",
        defaultTranslateVolume,
        `${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTVolumeTranslation}: <b class = "volumePercent" id="VOTTranslationVolume">${defaultTranslateVolume}%</b>`
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
        await (0,_indexedDB_js__WEBPACK_IMPORTED_MODULE_5__/* .updateDB */ .l6)({ defaultVolume: Number(value) });
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
      const finalValue = (0,_utils_volume_js__WEBPACK_IMPORTED_MODULE_14__/* .syncVolume */ .C)(
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
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("VideoValidator videoData: ", videoData);
        if (
          dontTranslateYourLang === 1 &&
          videoData.detectedLanguage === _menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ &&
          videoData.responseLanguage === _menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ
        ) {
          throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTDisableFromYourLang}`;
        }
        if (ytData.isPremiere) {
          throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTPremiere}`;
        }
        if (ytData.isLive) {
          throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTLiveNotSupported}`;
        }
        if (videoData.duration > 14_400) {
          throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTVideoIsTooLong}`;
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
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Run videoValidator");
      await videoValidator();
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Run translateFunc");
      await translateFunc(
        VIDEO_ID,
        videoData.detectedLanguage,
        videoData.responseLanguage
      );
    };

    // Define a function to handle common events
    async function handleVideoEvent(event) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(`video ${event.type}`);
      await lipSync(event.type);
    }

    // Define a function to stop translation and clean up
    async function stopTranslation() {
      await stopTraslate();
      await syncVideoVolumeSlider();
    }

    // Define a function to translate a video and handle the callback
    async function translateFunc(VIDEO_ID, requestLang, responseLang) {
      console.log("[VOT] Video Data: ", videoData);
      const videoURL = `${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .siteTranslates */ .g$[siteHostname]}${VIDEO_ID}`;
      translateVideo(
        videoURL,
        videoData.duration,
        requestLang,
        responseLang,
        async (success, urlOrError) => {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[exec callback] translateVideo");
          if ((0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)(siteHostname) !== VIDEO_ID) return;
          if (!success) {
            (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("error", urlOrError);
            // if the error line contains information that the translation is being performed, then we wait
            if (urlOrError.includes(_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].translationTake)) {
              clearTimeout(autoRetry);
              autoRetry = setTimeout(
                () => translateFunc(VIDEO_ID, requestLang, responseLang),
                60_000
              );
            }
            throw `[VOT] ${urlOrError}`;
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
            video.volume = _config_config_js__WEBPACK_IMPORTED_MODULE_13__/* .autoVolume */ .IM;
            // temp fix
            if (window.location.hostname.includes("youtube.com")) {
              document
                .querySelector(".html5-video-player")
                .setVolume(_config_config_js__WEBPACK_IMPORTED_MODULE_13__/* .autoVolume */ .IM * 100);
            }
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
          const events = ["playing", "ratechange", "play", "waiting", "pause"];
          videos.forEach((v) =>
            events.forEach((e) => v.addEventListener(e, handleVideoEvent))
          );
          (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("success", _config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].disableTranslate);
          addVideoSlider();
          await addTranslationSlider();

          const VOTVideoSlider = document.querySelector("#VOTVideoSlider");
          if (VOTVideoSlider) VOTVideoSlider.value = _config_config_js__WEBPACK_IMPORTED_MODULE_13__/* .autoVolume */ .IM * 100;

          const VOTOriginalVolume =
            document.querySelector("#VOTOriginalVolume");
          if (VOTOriginalVolume) {
            VOTOriginalVolume.innerText = `${_config_config_js__WEBPACK_IMPORTED_MODULE_13__/* .autoVolume */ .IM * 100}%`;
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

      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(`[document click] ${isBlock} ${isContent} ${isVideo}`);
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
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("lipsync mode is abort");
        await stopTranslation();
        videoData = "";
      });
    });

    document
      .querySelector(".translationBtn")
      .addEventListener("click", async (event) => {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[click translationBtn] before all functions & methods");
        event.stopPropagation();
        event.stopImmediatePropagation();

        // check if the audio source is not empty
        if (audio.src) {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[click translationBtn] audio.src is not empty");
          await stopTraslate();
          return;
        }

        try {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[click translationBtn] trying execute translation");
          const VIDEO_ID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)(siteHostname);

          if (!VIDEO_ID) {
            throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTNoVideoIDFound}`;
          }

          await translateExecutor(VIDEO_ID);
        } catch (err) {
          console.error("[VOT]", err);
          (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("error", String(err).substring(5, err.length));
        }
      });

    video.addEventListener("progress", async (event) => {
      event.stopPropagation();

      if (!(firstPlay && dbAutoTranslate === 1)) {
        return;
      }
      const VIDEO_ID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)(siteHostname);

      if (!VIDEO_ID) {
        throw `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTNoVideoIDFound}`;
      }

      try {
        await translateExecutor(VIDEO_ID);
        firstPlay = false;
      } catch (err) {
        console.error("[VOT]", err);
        (0,_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .transformBtn */ .uJ)("error", String(err).substring(5, err.length));
        firstPlay = false;
      }
    });

    document
      .querySelector(".translationMenu")
      .addEventListener("click", async (event) => {
        event.stopPropagation();

        const select = document
          .querySelector(".translationMenuOptions")
          ?.querySelector("#VOTSubtitlesLang");

        if (!openedMenu || !select) {
          return;
        }

        const VIDEO_ID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)(siteHostname);

        if (!VIDEO_ID) {
          console.error(`[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_4__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_6__/* .lang */ .KQ].VOTNoVideoIDFound}`);
          subtitlesList = [];
          subtitlesListVideoId = null;
          await updateSubtitlesLangSelect();
          return;
        }

        if (subtitlesListVideoId === VIDEO_ID) {
          return;
        }

        if (!videoData.detectedLanguage) {
          videoData = await getVideoData();
          await setSelectMenuValues(
            videoData.detectedLanguage,
            videoData.responseLanguage
          );
        }

        subtitlesList = await (0,_subtitles_js__WEBPACK_IMPORTED_MODULE_11__/* .getSubtitles */ .MF)(
          siteHostname,
          VIDEO_ID,
          videoData.detectedLanguage
        );
        if (!subtitlesList) {
          await changeSubtitlesLang("disabled");
        } else {
          subtitlesListVideoId = VIDEO_ID;
        }
        await updateSubtitlesLangSelect();
      });
  }

  async function initWebsite() {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("Runned initWebsite function");
    if (_config_regexes_js__WEBPACK_IMPORTED_MODULE_7__/* ["default"] */ .Z.youtubeRegex.test(window.location.hostname)) {
      if (window.location.pathname.includes("embed")) {
        const videoContainer = document.querySelector(".html5-video-container");
        await translateProccessor(videoContainer, "youtube", null);
        return;
      }

      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[initWebsite] Found a match with youtube hostname");
      const ytPageEnter = () => {
        const videoContainer = document.querySelector(
          _config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.youtubeSelector
        );
        if (videoContainer) {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[exec] translateProccessor youtube on page enter");
          translateProccessor(videoContainer, "youtube", "yt-translate-stop");
        } else {
          if (!ytplayer || !ytplayer.config) {
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[exec] ytplayer is null");
            return;
          }
          ytplayer.config.args.jsapicallback = () => {
            _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log(
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
        let ytmobile = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)("#player");
        if (ytmobile) {
          await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(2300);
          await translateProccessor(ytmobile, "youtube", "yt-translate-stop");

          const mutationObserver = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "src"
              ) {
                ytmobile = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)("#player");
                await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(2300);
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
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[initWebsite] Found a match with twitch.tv");
      if (
        window.location.hostname.includes("m.twitch.tv") &&
        (window.location.pathname.includes("/videos/") ||
          window.location.pathname.includes("/clip/"))
      ) {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[initWebsite] Matched Twitch Mobile");
        const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.twitchMobileSelector);
        if (el) {
          await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(200);
          const twitchMobileSelector = document.querySelector(
            _config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.twitchMobileSelector
          );
          await translateProccessor(twitchMobileSelector, "twitch", null);

          const mutationObserver = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "src" &&
                mutation.target === twitchMobileSelector?.querySelector("video")
              ) {
                await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
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
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[initWebsite] Matched Twitch Desktop");
        const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.twitchSelector);
        if (el) {
          await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(200);
          await translateProccessor(el, "twitch", null);
        }
      }
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[initWebsite] Exit function in the twitch section");
      return;
    }
    if (window.location.hostname.includes("xvideos.com")) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] xvideos");
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
      await translateProccessor(
        document.querySelector(".video-bg-pic"),
        "xvideos",
        null
      );
      return;
    }
    if (window.location.hostname.includes("pornhub.com")) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] pornhub");
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
      await translateProccessor(
        document.querySelector(".mgp_videoWrapper"),
        "pornhub",
        null
      );
      return;
    }
    if (_config_alternativeUrls_js__WEBPACK_IMPORTED_MODULE_12__/* .sitesInvidious */ .a.includes(window.location.hostname)) {
      // Need an additional extension to work in chrome-like browsers
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] invidious");
      await translateProccessor(
        document.querySelector("#player"),
        "youtube",
        null
      );
    } else if (_config_alternativeUrls_js__WEBPACK_IMPORTED_MODULE_12__/* .sitesPiped */ .U.includes(window.location.hostname)) {
      // Need an additional extension to work in chrome-like browsers
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] piped");
      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.pipedSelector);
      if (el) {
        let videoIDNew;
        let videoID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("youtube");
        await translateProccessor(el, "youtube", "piped");
        setInterval(async () => {
          videoIDNew = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("youtube");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.pipedSelector),
                "youtube",
                "piped"
              );
            }
            videoID = videoIDNew;
          }
        }, 3000);
      }
    } else if (/^(www.|m.)?vk.(com|ru)$/.test(window.location.hostname)) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] vk.com");
      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.vkSelector);
      if (el) {
        await translateProccessor(
          document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.vkSelector),
          "vk",
          null
        );
        let videoIDVKNew;
        let videoIDVK = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("vk");
        setInterval(async () => {
          videoIDVKNew = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("vk");
          if (videoIDVK !== videoIDVKNew) {
            if (videoIDVKNew) {
              const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.vkSelector);
              if (el) {
                await translateProccessor(el, "vk", null);
              }
            }
            videoIDVK = videoIDVKNew;
          }
        }, 3000);
      }
    } else if (window.location.hostname.includes("vimeo.com")) {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .Z.log("[entered] vimeo.com");
      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.vimeoSelector);
      if (el) {
        await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
        await translateProccessor(
          document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.vimeoSelector),
          "vimeo",
          null
        );
      }
    } else if (window.location.hostname.includes("9gag.com")) {
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
      await translateProccessor(
        document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.gagSelector),
        "9gag",
        null
      );
    } else if (window.location.hostname.includes("coub.com")) {
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
      await translateProccessor(
        document.querySelector(".viewer__player"),
        "coub",
        null
      );
    } else if (window.location.hostname.includes("bitchute.com")) {
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .sleep */ ._v)(1000);
      await translateProccessor(
        document.querySelector(".plyr__video-wrapper"),
        "bitchute",
        null
      );
    } else if (window.location.hostname.includes("rutube.ru")) {
      const elementSelector = window.location.pathname.includes("/play/embed")
        ? "#app > div > div"
        : ".video-player > div > div > div:nth-child(2)";

      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(elementSelector);
      if (el) {
        await translateProccessor(el, "rutube", null);
      }
    } else if (window.location.hostname.includes("bilibili.com")) {
      if (window.location.pathname.includes("/video/")) {
        const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.bilibilicomSelector);
        if (el) {
          await translateProccessor(el, "bilibili.com", null);
        }
      } else if (
        window.location.pathname.includes(
          "/blackboard/webplayer/embed-old.html"
        )
      ) {
        const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)("video");
        if (el) {
          await translateProccessor(el.parentElement, "bilibili.com", null);
        }
      }
    } else if (window.location.hostname.includes("twitter.com")) {
      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.twitterSelector);
      if (el) {
        let videoIDNew;
        let videoID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("twitter");
        await translateProccessor(el, "twitter", null);
        setInterval(async () => {
          videoIDNew = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("twitter");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.twitterSelector),
                "twitter",
                null
              );
            }
            videoID = videoIDNew;
          }
        }, 3000);
      }
    } else if (window.location.hostname.includes("my.mail.ru")) {
      const el = await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .waitForElm */ .Nc)(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.mailSelector);
      if (el) {
        let videoIDNew;
        let videoID = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("mail.ru");
        await translateProccessor(el, "mail.ru", null);
        setInterval(async () => {
          videoIDNew = (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getVideoId */ .gJ)("mail.ru");
          if (videoID !== videoIDNew) {
            if (videoIDNew) {
              await translateProccessor(
                document.querySelector(_config_selectors_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .Z.mailSelector),
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

main().catch((e) => {
  console.error("[VOT]", e);
});

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/indexedDB.js":
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CZ: () => (/* binding */ readDB),
/* harmony export */   Lj: () => (/* binding */ deleteDB),
/* harmony export */   l6: () => (/* binding */ updateDB),
/* harmony export */   zK: () => (/* binding */ initDB)
/* harmony export */ });
/* harmony import */ var _menu_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/menu.js");
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/config/constants.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_menu_js__WEBPACK_IMPORTED_MODULE_0__, _config_constants_js__WEBPACK_IMPORTED_MODULE_1__]);
([_menu_js__WEBPACK_IMPORTED_MODULE_0__, _config_constants_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);



// --- IndexedDB functions start:
const dbVersion = 3; // current db version
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

const valuesV3 = {
  subtitlesMaxLength: 300,
  highlightWords: 0,
  responseLanguage: _menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ,
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

      console.log("[VOT] The database has been updated");
      objectStore.transaction.oncomplete = () => {
        const objectStore = db
          .transaction("settings", "readwrite")
          .objectStore("settings");
        const request = objectStore.get("settings");

        request.onerror = (event) => {
          console.error(
            "[VOT] Data could not be retrieved from the Database: ",
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
              "[VOT] Failed to update the Database to new version",
              event.error
            );
            reject(false);
          };

          requestUpdate.onsuccess = () => {
            console.log(
              "[VOT] Standard settings of the new version have been added to the Database."
            );
            resolve(true);
          };
        };
      };
    }

    const openRequest = openDB("VOT");

    openRequest.onerror = () => {
      console.error(
        `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTFailedInitDB}: ${openRequest.error.message}`
      );
      reject(false);
    };

    openRequest.onupgradeneeded = (event) => {
      const db = openRequest.result;

      db.onerror = () => {
        const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTFailedInitDB}`;
        console.error(errorMessage, openRequest.error);
        alert(errorMessage);
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

        console.log("[VOT] Database Created");

        objectStore.transaction.oncomplete = () => {
          const objectStore = db
            .transaction("settings", "readwrite")
            .objectStore("settings");
          const request = objectStore.add(settingsDefault);

          request.onsuccess = () => {
            console.log(
              "[VOT] Standard settings added to the Database: ",
              request.result
            );
            resolve(true);
          };

          request.onerror = () => {
            console.log(
              "[VOT] Error when adding standard settings to the Database: ",
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

      if (event.oldVersion < 3) {
        // db is outdated (db version is 1)
        updateVersionProccessor(openRequest.transaction, db, valuesV3);
      }
    };

    openRequest.onsuccess = () => {
      const db = openRequest.result;
      db.onversionchange = () => {
        db.close();
        const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTDBNeedUpdate}`;
        console.log(errorMessage);
        alert(errorMessage);
        window.location.reload();
        reject(false);
      };
      resolve(true);
    };

    openRequest.onblocked = () => {
      const db = openRequest.result;
      const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTDisabledForDBUpdating}`;
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
  subtitlesMaxLength,
  highlightWords,
  responseLanguage,
}) {
  return new Promise((resolve, reject) => {
    if (
      typeof autoTranslate === "number" ||
      typeof defaultVolume === "number" ||
      typeof showVideoSlider === "number" ||
      typeof syncVolume === "number" ||
      typeof autoSetVolumeYandexStyle === "number" ||
      typeof dontTranslateYourLang === "number" ||
      typeof audioProxy === "number" ||
      typeof subtitlesMaxLength === "number" ||
      typeof highlightWords === "number" ||
      typeof responseLanguage === "string"
    ) {
      const openRequest = openDB("VOT");

      openRequest.onerror = () => {
        const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTFailedWriteToDB}`;
        console.error(errorMessage, openRequest.error.message);
        alert(errorMessage);
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
            "[VOT] The database needs an update, please reload the page if it didn't happen automatically"
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
            "[VOT] Data could not be retrieved from the Database: ",
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

          if (typeof subtitlesMaxLength === "number") {
            data.subtitlesMaxLength = subtitlesMaxLength;
          }

          if (typeof highlightWords === "number") {
            data.highlightWords = highlightWords;
          }

          if (typeof responseLanguage === "string") {
            data.responseLanguage = responseLanguage;
          }

          const requestUpdate = objectStore.put(data);

          requestUpdate.onerror = (event) => {
            console.error(
              "[VOT] Не удалось обновить данные в Базе Данных: ",
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
        const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTDisabledForDBUpdating}`;
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
      const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTFailedReadFromDB}`;
      console.error(errorMessage, openRequest.error.message);
      alert(errorMessage);
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
        const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTDBNeedUpdate}`;
        console.error(errorMessage);
        alert(errorMessage);
        reject(false);
      };

      const objectStore = db.transaction("settings").objectStore("settings");
      const request = objectStore.get("settings");

      request.onerror = (event) => {
        console.error(
          "[VOT]",
          _config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTFailedReadFromDB,
          event.error
        );
        console.error("[VOT]", event);
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
      const errorMessage = `[VOT] ${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_0__/* .lang */ .KQ].VOTDisabledForDBUpdating}`;
      console.error(errorMessage, db);
      alert(errorMessage);
      reject(false);
    };
  });
}

function deleteDB() {
  indexedDB.deleteDatabase("VOT");
}



__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/menu.js":
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ef: () => (/* binding */ genOptionsByOBJ),
/* harmony export */   H0: () => (/* binding */ createMenuCheckbox),
/* harmony export */   KQ: () => (/* binding */ lang),
/* harmony export */   Mr: () => (/* binding */ createMenuSelect),
/* harmony export */   NX: () => (/* binding */ createTranslationMenu),
/* harmony export */   Ot: () => (/* binding */ addTranslationBlock),
/* harmony export */   iT: () => (/* binding */ createMenuSlider),
/* harmony export */   uJ: () => (/* binding */ transformBtn)
/* harmony export */ });
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/utils/debug.js");
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/config/constants.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_config_constants_js__WEBPACK_IMPORTED_MODULE_1__]);
_config_constants_js__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];



const userlang = navigator.language ?? navigator.userLanguage;
let lang = userlang.substring(0, 2) ?? "en";
if (!(lang in _config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz)) {
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
      <span class = "translationBtn" tabindex = "0">${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[lang].translateVideo}</span>
    </span>
    <span class = "translationMenu" tabindex = "0" role = "button">
      <svg class = "translationMenuIcon" height="15" width="5" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 13.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path>
      </svg>
    </span>
  `;

  element.appendChild(block);
  _utils_debug_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.log("Added translation button to ", element);
}

function createTranslationMenu() {
  const container = document.createElement("div");
  container.classList.add("translationMenuContent");
  container.innerHTML = `
    <p class = "translationMainHeader">${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[lang].translationSettings}</p>
    <div class="translationMenuOptions"></div>
    <div class="translationMenuFunctional">
      <a class = "translationDownload">
        <svg width="24px" height="24px" data-darkreader-inline-stroke="" fill="none" stroke="currentColor" style="--darkreader-inline-stroke: currentColor;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
      </a>
      <button class = "translationDropDB">${_config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[lang].resetSettings}</button>
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
function createMenuSlider(id, sliderValue, content, min = 0, max = 100) {
  const sliderContainer = document.createElement("div");
  const slider = document.createElement("input");
  const sliderLabel = document.createElement("label");

  slider.type = "range";
  slider.id = id;
  slider.classList.add("VOTMenuSlider");
  slider.min = min;
  slider.max = max;
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
  console.log(obj);
  const test = obj.map((code) => ({
    label: _config_constants_js__WEBPACK_IMPORTED_MODULE_1__/* .translations */ .Iz[lang].langs[code],
    value: code,
    selected: conditionString === code,
  }));
  console.log(test);
  return test;
}



__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/rvs.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _getUUID_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/getUUID.js");
/* harmony import */ var _getSignature_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/getSignature.js");
/* harmony import */ var _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/yandexProtobuf.js");
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/utils/debug.js");





// Request video subtitles from Yandex API
async function requestVideoSubtitles(url, requestLang, callback) {
  try {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z.log("requestVideoSubtitles");
    const yar = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "./src/yandexRequest.js"));
    const yandexRequest = yar.default;
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z.log("Inited yandexRequest...");
    // Initialize variables
    const body = _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_0__/* .yandexProtobuf */ .X.encodeSubtitlesRequest(url, requestLang);
    // Send the request
    await yandexRequest(
      "/video-subtitles/get-subtitles",
      body,
      {
        "Vsubs-Signature": await (0,_getSignature_js__WEBPACK_IMPORTED_MODULE_2__/* .getSignature */ .o)(body),
        "Sec-Vsubs-Token": (0,_getUUID_js__WEBPACK_IMPORTED_MODULE_3__/* .getUUID */ .F)(false),
      },
      callback
    );
  } catch (exception) {
    console.error("[VOT]", exception);
    // Handle errors
    callback(false);
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (requestVideoSubtitles);


/***/ }),

/***/ "./src/rvt.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _getUUID_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/getUUID.js");
/* harmony import */ var _getSignature_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/getSignature.js");
/* harmony import */ var _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/yandexProtobuf.js");
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/utils/debug.js");





// Request video translation from Yandex API
async function requestVideoTranslation(
  url,
  duration,
  requestLang,
  responseLang,
  callback
) {
  try {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z.log("requestVideoTranslation");
    const yar = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "./src/yandexRequest.js"));
    const yandexRequest = yar.default;
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z.log("Inited yandexRequest...");
    // Initialize variables
    const body = _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_0__/* .yandexProtobuf */ .X.encodeTranslationRequest(
      url,
      duration,
      requestLang,
      responseLang
    );
    // Send the request
    await yandexRequest(
      // "/stream-translation/whitelist-stream",
      // "/stream-translation/translate-stream",
      "/video-translation/translate",
      body,
      {
        "Vtrans-Signature": await (0,_getSignature_js__WEBPACK_IMPORTED_MODULE_2__/* .getSignature */ .o)(body),
        "Sec-Vtrans-Token": (0,_getUUID_js__WEBPACK_IMPORTED_MODULE_3__/* .getUUID */ .F)(false),
      },
      callback
    );
  } catch (exception) {
    console.error("[VOT]", exception);
    // Handle errors
    callback(false);
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (requestVideoTranslation);


/***/ }),

/***/ "./src/subtitles.js":
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bv: () => (/* binding */ setSubtitlesWidgetContent),
/* harmony export */   Hl: () => (/* binding */ fetchSubtitles),
/* harmony export */   Lg: () => (/* binding */ setSubtitlesMaxLength),
/* harmony export */   MF: () => (/* binding */ getSubtitles),
/* harmony export */   b6: () => (/* binding */ setSubtitlesHighlightWords),
/* harmony export */   e7: () => (/* binding */ addSubtitlesWidget)
/* harmony export */ });
/* harmony import */ var _utils_youtubeUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/utils/youtubeUtils.js");
/* harmony import */ var _utils_utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/utils/utils.js");
/* harmony import */ var _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("./src/yandexProtobuf.js");
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("./src/config/constants.js");
/* harmony import */ var _menu_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/menu.js");
/* harmony import */ var _rvs_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/rvs.js");
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("./src/utils/debug.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_utils_utils_js__WEBPACK_IMPORTED_MODULE_1__, _config_constants_js__WEBPACK_IMPORTED_MODULE_3__, _menu_js__WEBPACK_IMPORTED_MODULE_4__]);
([_utils_utils_js__WEBPACK_IMPORTED_MODULE_1__, _config_constants_js__WEBPACK_IMPORTED_MODULE_3__, _menu_js__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);








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

async function fetchSubtitles(subtitlesObject) {
  let resolved = false;
  let subtitles = await Promise.race([
    new Promise(async (resolve) => {
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .sleep */ ._v)(5000);
      if (!resolved) {
        console.error("[VOT] Failed to fetch subtitles. Reason: timeout");
      }
      resolved = true;
      resolve([]);
    }),
    new Promise(async (resolve) => {
      _utils_debug_js__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z.log("Fetching subtitles:", subtitlesObject);
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

async function getSubtitles(siteHostname, videoId, requestLang) {
  const ytSubtitles =
    siteHostname === "youtube" ? _utils_youtubeUtils_js__WEBPACK_IMPORTED_MODULE_0__/* .youtubeUtils */ .K.getSubtitles() : [];
  let resolved = false;
  const yaSubtitles = await Promise.race([
    new Promise(async (resolve) => {
      await (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .sleep */ ._v)(5000);
      if (!resolved) {
        console.error("[VOT] Failed get yandex subtitles. Reason: timeout");
      }
      resolved = true;
      resolve([]);
    }),
    new Promise((resolve) => {
      (0,_rvs_js__WEBPACK_IMPORTED_MODULE_5__/* ["default"] */ .Z)(
        `${_config_constants_js__WEBPACK_IMPORTED_MODULE_3__/* .siteTranslates */ .g$[siteHostname]}${videoId}`,
        requestLang,
        (success, response) => {
          _utils_debug_js__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z.log("[exec callback] Requesting video subtitles");

          if (!success) {
            console.error("[VOT] Failed get yandex subtitles");
            resolved = true;
            resolve([]);
          }

          const subtitlesResponse =
            _yandexProtobuf_js__WEBPACK_IMPORTED_MODULE_2__/* .yandexProtobuf */ .X.decodeSubtitlesResponse(response);
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
      (a.language === _menu_js__WEBPACK_IMPORTED_MODULE_4__/* .lang */ .KQ || b.language === _menu_js__WEBPACK_IMPORTED_MODULE_4__/* .lang */ .KQ)
    ) {
      // sort by user language
      return a.language === _menu_js__WEBPACK_IMPORTED_MODULE_4__/* .lang */ .KQ ? -1 : 1;
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

function addSubtitlesWidget(element) {
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
  let highlightWords = _highlightWords && _subtitles.containsTokens;
  const time = video.currentTime * 1000;
  const line = _subtitles.subtitles.findLast((e) => {
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

function setSubtitlesWidgetContent(video, subtitles) {
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

function setSubtitlesMaxLength(len) {
  if (typeof len === "number" && len) {
    _maxLength = len;
    _maxLengthRegexp = new RegExp(`.{1,${len}}(?:\\s|$)`, "g");
    updateSubtitles(_video);
  }
}

function setSubtitlesHighlightWords(value) {
  if (_highlightWords !== !!value) {
    _highlightWords = !!value;
    updateSubtitles(_video);
  }
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/utils/debug.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (debug);


/***/ }),

/***/ "./src/utils/utils.js":
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Nc: () => (/* binding */ waitForElm),
/* harmony export */   PG: () => (/* binding */ secsToStrTime),
/* harmony export */   _v: () => (/* binding */ sleep),
/* harmony export */   gJ: () => (/* binding */ getVideoId)
/* harmony export */ });
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/config/constants.js");
/* harmony import */ var _menu_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/menu.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_config_constants_js__WEBPACK_IMPORTED_MODULE_0__, _menu_js__WEBPACK_IMPORTED_MODULE_1__]);
([_config_constants_js__WEBPACK_IMPORTED_MODULE_0__, _menu_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);



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
    case "bilibili.com": {
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
      return false;
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
    return _config_constants_js__WEBPACK_IMPORTED_MODULE_0__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_1__/* .lang */ .KQ].translationTakeMoreThanHour;
  } else if (minutes >= 10 && minutes % 10) {
    return _config_constants_js__WEBPACK_IMPORTED_MODULE_0__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_1__/* .lang */ .KQ].translationTakeApproximatelyMinutes.format(
      minutes
    );
  } else if (minutes == 1 || (minutes == 0 && seconds > 0)) {
    return _config_constants_js__WEBPACK_IMPORTED_MODULE_0__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_1__/* .lang */ .KQ].translationTakeAboutMinute;
  } else {
    return _config_constants_js__WEBPACK_IMPORTED_MODULE_0__/* .translations */ .Iz[_menu_js__WEBPACK_IMPORTED_MODULE_1__/* .lang */ .KQ].translationTakeApproximatelyMinute.format(
      minutes
    );
  }
}



__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/utils/volume.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   C: () => (/* binding */ syncVolume)
/* harmony export */ });
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




/***/ }),

/***/ "./src/utils/youtubeUtils.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   K: () => (/* binding */ youtubeUtils)
/* harmony export */ });
/* harmony import */ var _debug_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/utils/debug.js");


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

function isMobile() {
  return /^m\.youtube\.com$/.test(window.location.hostname);
}

function getPlayer() {
  return isMobile()
    ? document.querySelector("#app")
    : document.querySelector("#movie_player");
}

function getPlayerResponse() {
  const player = getPlayer();
  if (isMobile()) return player?.data?.playerResponse ?? null;
  return player?.getPlayerResponse?.call() ?? null;
}

function getSubtitles() {
  const response = getPlayerResponse();
  let captionTracks =
    response?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  captionTracks = captionTracks.reduce((result, captionTrack) => {
    if ("languageCode" in captionTrack) {
      const language = captionTrack?.languageCode
        ?.toLowerCase()
        .split(";")[0]
        .trim()
        .split("-")[0];
      const url = captionTrack?.url || captionTrack?.baseUrl;
      language &&
        url &&
        result.push({
          source: "youtube",
          language,
          isAutoGenerated: captionTrack?.kind === "asr",
          url: `${
            url.startsWith("http") ? url : `${window.location.origin}/${url}`
          }&fmt=json3`,
        });
    }
    return result;
  }, []);
  _debug_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.log("youtube subtitles:", captionTracks);
  return captionTracks;
}

// Get the video data from the player
async function getVideoData() {
  const player = getPlayer();
  const response = getPlayerResponse();
  const {
    author,
    title,
    shortDescription: description,
    isLive,
    isLiveContent,
    isUpcoming,
  } = response?.videoDetails ?? {};
  const isPremiere = (!!isLive || !!isUpcoming) && !isLiveContent;
  const videoData = {
    isLive: !!isLive,
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
  _debug_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.log("youtube video data:", videoData);
  console.log("[VOT] Detected language: ", videoData.detectedLanguage);
  return videoData;
}

const youtubeUtils = {
  isMobile,
  getPlayer,
  getPlayerResponse,
  getSubtitles,
  getVideoData,
};


/***/ }),

/***/ "./src/yandexProtobuf.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   X: () => (/* binding */ yandexProtobuf)
/* harmony export */ });
const VideoTranslationRequest = new protobuf.Type("VideoTranslationRequest")
  .add(new protobuf.Field("url", 3, "string"))
  .add(new protobuf.Field("deviceId", 4, "string")) // removed?
  .add(new protobuf.Field("firstRequest", 5, "bool")) // true for the first request, false for subsequent ones
  .add(new protobuf.Field("duration", 6, "double"))
  .add(new protobuf.Field("unknown2", 7, "int32")) // 1 1
  .add(new protobuf.Field("language", 8, "string")) // source language code
  .add(new protobuf.Field("unknown3", 9, "int32")) // 0 0
  .add(new protobuf.Field("unknown4", 10, "int32")) // 0 0
  .add(new protobuf.Field("translationHelp", 11, "int32")) // array for translation assistance ([0] -> {2: link to video, 1: "video_file_url"}, [1] -> {2: link to subtitles, 1: "subtitles_file_url"})
  .add(new protobuf.Field("responseLanguage", 14, "string")); // target language code

const VideoSubtitlesRequest = new protobuf.Type("VideoSubtitlesRequest")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("language", 2, "string")); // source language code

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
  .add(new protobuf.Field("unknown0", 6, "int32")) // unknown 0 (1st request) -> 10 (2nd, 3th and etc requests)
  .add(new protobuf.Field("unknown1", 7, "string"))
  .add(new protobuf.Field("language", 8, "string")) // detected language (if the wrong one is set)
  .add(new protobuf.Field("message", 9, "string"));

const VideoSubtitlesObject = new protobuf.Type("VideoSubtitlesObject")
  .add(new protobuf.Field("language", 1, "string"))
  .add(new protobuf.Field("url", 2, "string"))
  .add(new protobuf.Field("unknown2", 3, "int32"))
  .add(new protobuf.Field("translatedLanguage", 4, "string"))
  .add(new protobuf.Field("translatedUrl", 5, "string"))
  .add(new protobuf.Field("unknown5", 6, "int32"))
  .add(new protobuf.Field("unknown6", 7, "int32"));

const VideoSubtitlesResponse = new protobuf.Type("VideoSubtitlesResponse")
  .add(new protobuf.Field("unknown0", 1, "int32"))
  .add(new protobuf.Field("subtitles", 2, "VideoSubtitlesObject", "repeated"));

// const VideoWhitelistStreamResponse = new protobuf.Type("VideoWhitelistStreamResponse")
//   .add(new protobuf.Field("inWhitelist", 1, "bool"))

// const VideoTranslationStreamResponse = new protobuf.Type("VideoTranslationStreamResponse")
//   .add(new protobuf.Field("unknown1", 1, "int32"))
//   .add(new protobuf.Field("array", 2, "string"))
//   .add(new protobuf.Field("ping", 3, "int32"))

// Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoWhitelistStreamRequest).add(VideoWhitelistStreamResponse);

// // Export the encoding and decoding functions
// export const yandexProtobuf = {
//   encodeTranslationRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoWhitelistStreamRequest.encode({
//       url,
//       deviceId: 'UCLA_DiR1FfKNvjuUpBHmylQ'
//     }).finish();
//   },
//   decodeTranslationResponse(response) {
//     return root.VideoWhitelistStreamResponse.decode(new Uint8Array(response));
//   }
// };

// // Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoTranslationStreamRequest).add(VideoTranslationStreamResponse);

// // Export the encoding and decoding functions
// export const yandexProtobuf = {
//   encodeTranslationRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoTranslationStreamRequest.encode({
//       url,
//       language: requestLang,
//       responseLanguage: responseLang
//     }).finish();
//   },
//   decodeTranslationResponse(response) {
//     return root.VideoTranslationStreamResponse.decode(new Uint8Array(response));
//   }
// };

// Create a root namespace and add the types
const root = new protobuf.Root()
  .define("yandex")
  .add(VideoTranslationRequest)
  .add(VideoTranslationResponse)
  .add(VideoSubtitlesRequest)
  .add(VideoSubtitlesObject)
  .add(VideoSubtitlesResponse);

// Export the encoding and decoding functions
const yandexProtobuf = {
  encodeTranslationRequest(url, duration, requestLang, responseLang) {
    return root.VideoTranslationRequest.encode({
      url,
      firstRequest: true,
      duration,
      unknown2: 1,
      language: requestLang,
      unknown3: 0,
      unknown4: 0,
      responseLanguage: responseLang,
    }).finish();
  },
  decodeTranslationResponse(response) {
    return root.VideoTranslationResponse.decode(new Uint8Array(response));
  },
  encodeSubtitlesRequest(url, requestLang) {
    return root.VideoSubtitlesRequest.encode({
      url,
      language: requestLang,
    }).finish();
  },
  decodeSubtitlesResponse(response) {
    return root.VideoSubtitlesResponse.decode(new Uint8Array(response));
  },
};


/***/ }),

/***/ "./src/yandexRequest.js":
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _config_config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/config/config.js");
/* harmony import */ var _utils_debug_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/utils/debug.js");



async function yandexRequest(path, body, headers, callback) {
  try {
    _utils_debug_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.log("yandexRequest:", path);
    // Create a fetch options object with headers and body
    const options = {
      url: `https://${_config_config_js__WEBPACK_IMPORTED_MODULE_1__/* .workerHost */ .iF}${path}`,
      method: "POST",
      headers: {
        ...{
          Accept: "application/x-protobuf",
          "Accept-Language": "en",
          "Content-Type": "application/x-protobuf",
          "User-Agent": _config_config_js__WEBPACK_IMPORTED_MODULE_1__/* .yandexUserAgent */ .Rr,
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Mode": "no-cors",
          "sec-ch-ua": null,
          "sec-ch-ua-mobile": null,
          "sec-ch-ua-platform": null,
        },
        ...headers,
      },
      binary: true,
      data: new Blob([body]),
      responseType: "arraybuffer",
    };
    // Send the request using GM_xmlhttpRequest
    GM_xmlhttpRequest({
      ...options,
      onload: (http) => {
        _utils_debug_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.log("yandexRequest:", http.status, http);
        callback(http.status === 200, http.response);
      },
      onerror: (error) => {
        console.error("[VOT]", error);
        callback(false);
      },
    });
  } catch (exception) {
    console.error("[VOT]", exception);
    // Handle errors
    callback(false);
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (yandexRequest);


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
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;