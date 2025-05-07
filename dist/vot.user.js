// ==UserScript==
// @name           [VOT] - Voice Over Translation
// @name:de        [VOT] - Voice-Over-Video-Übersetzung
// @name:es        [VOT] - Traducción de vídeo en off
// @name:fr        [VOT] - Traduction vidéo voix-off
// @name:it        [VOT] - Traduzione Video fuori campo
// @name:ru        [VOT] - Закадровый перевод видео
// @name:zh        [VOT] - 画外音视频翻译
// @description    A small extension that adds a Yandex Browser video translation to other browsers
// @description:de Eine kleine Erweiterung, die eine Voice-over-Übersetzung von Videos aus dem Yandex-Browser zu anderen Browsern hinzufügt
// @description:es Una pequeña extensión que agrega una traducción de voz en off de un video de Yandex Browser a otros navegadores
// @description:fr Une petite extension qui ajoute la traduction vocale de la vidéo du Navigateur Yandex à d'autres navigateurs
// @description:it Una piccola estensione che aggiunge la traduzione vocale del video dal browser Yandex ad altri browser
// @description:ru Небольшое расширение, которое добавляет закадровый перевод видео из Яндекс Браузера в другие браузеры
// @description:zh 一个小扩展，它增加了视频从Yandex浏览器到其他浏览器的画外音翻译
// @grant          unsafeWindow
// @grant          GM_addStyle
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_xmlhttpRequest
// @grant          GM_notification
// @grant          GM_info
// @grant          window.focus
// @grant          unsafeWindow
// @require        https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.18/hls.light.min.js
// @require        https://gist.githubusercontent.com/ilyhalight/6eb5bb4dffc7ca9e3c57d6933e2452f3/raw/7ab38af2228d0bed13912e503bc8a9ee4b11828d/gm-addstyle-polyfill.js
// @match          *://*.youtube.com/*
// @match          *://*.youtube-nocookie.com/*
// @match          *://*.youtubekids.com/*
// @match          *://*.twitch.tv/*
// @match          *://*.xvideos.com/*
// @match          *://*.xvideos-ar.com/*
// @match          *://*.xvideos005.com/*
// @match          *://*.xv-ru.com/*
// @match          *://*.pornhub.com/*
// @match          *://*.pornhub.org/*
// @match          *://*.vk.com/*
// @match          *://*.vkvideo.ru/*
// @match          *://*.vk.ru/*
// @match          *://*.vimeo.com/*
// @match          *://*.imdb.com/*
// @match          *://*.9gag.com/*
// @match          *://*.twitter.com/*
// @match          *://*.x.com/*
// @match          *://*.facebook.com/*
// @match          *://*.rutube.ru/*
// @match          *://*.bilibili.com/*
// @match          *://my.mail.ru/*
// @match          *://*.bitchute.com/*
// @match          *://*.coursera.org/*
// @match          *://*.udemy.com/course/*
// @match          *://*.tiktok.com/*
// @match          *://*.douyin.com/*
// @match          *://rumble.com/*
// @match          *://*.eporner.com/*
// @match          *://*.dailymotion.com/*
// @match          *://*.ok.ru/*
// @match          *://trovo.live/*
// @match          *://disk.yandex.ru/*
// @match          *://disk.yandex.kz/*
// @match          *://disk.yandex.com/*
// @match          *://disk.yandex.com.am/*
// @match          *://disk.yandex.com.ge/*
// @match          *://disk.yandex.com.tr/*
// @match          *://disk.yandex.by/*
// @match          *://disk.yandex.az/*
// @match          *://disk.yandex.co.il/*
// @match          *://disk.yandex.ee/*
// @match          *://disk.yandex.lt/*
// @match          *://disk.yandex.lv/*
// @match          *://disk.yandex.md/*
// @match          *://disk.yandex.net/*
// @match          *://disk.yandex.tj/*
// @match          *://disk.yandex.tm/*
// @match          *://disk.yandex.uz/*
// @match          *://youtube.googleapis.com/embed/*
// @match          *://*.banned.video/*
// @match          *://*.madmaxworld.tv/*
// @match          *://*.weverse.io/*
// @match          *://*.newgrounds.com/*
// @match          *://*.egghead.io/*
// @match          *://*.youku.com/*
// @match          *://*.archive.org/*
// @match          *://*.patreon.com/*
// @match          *://*.reddit.com/*
// @match          *://*.kodik.info/*
// @match          *://*.kodik.biz/*
// @match          *://*.kodik.cc/*
// @match          *://*.kick.com/*
// @match          *://developer.apple.com/*
// @match          *://dev.epicgames.com/*
// @match          *://*.rapid-cloud.co/*
// @match          *://odysee.com/*
// @match          *://learning.sap.com/*
// @match          *://*.watchporn.to/*
// @match          *://*.linkedin.com/*
// @match          *://*.incestflix.net/*
// @match          *://*.incestflix.to/*
// @match          *://*.porntn.com/*
// @match          *://*.dzen.ru/*
// @match          *://*.cloudflarestream.com/*
// @match          *://*.loom.com/*
// @match          *://*.artstation.com/learning/*
// @match          *://*.rt.com/*
// @match          *://*.bitview.net/*
// @match          *://*.kickstarter.com/*
// @match          *://*.thisvid.com/*
// @match          *://*.ign.com/*
// @match          *://*.bunkr.site/*
// @match          *://*.bunkr.black/*
// @match          *://*.bunkr.cat/*
// @match          *://*.bunkr.media/*
// @match          *://*.bunkr.red/*
// @match          *://*.bunkr.ws/*
// @match          *://*.bunkr.org/*
// @match          *://*.bunkr.sk/*
// @match          *://*.bunkr.si/*
// @match          *://*.bunkr.su/*
// @match          *://*.bunkr.ci/*
// @match          *://*.bunkr.cr/*
// @match          *://*.bunkr.fi/*
// @match          *://*.bunkr.ph/*
// @match          *://*.bunkr.pk/*
// @match          *://*.bunkr.ps/*
// @match          *://*.bunkr.ru/*
// @match          *://*.bunkr.la/*
// @match          *://*.bunkr.is/*
// @match          *://*.bunkr.to/*
// @match          *://*.bunkr.ac/*
// @match          *://*.bunkr.ax/*
// @match          *://web.telegram.org/k/*
// @match          *://*/*.mp4*
// @match          *://*/*.webm*
// @match          *://*.yewtu.be/*
// @match          *://yt.artemislena.eu/*
// @match          *://invidious.flokinet.to/*
// @match          *://iv.melmac.space/*
// @match          *://inv.nadeko.net/*
// @match          *://inv.tux.pizza/*
// @match          *://invidious.private.coffee/*
// @match          *://yt.drgnz.club/*
// @match          *://vid.puffyan.us/*
// @match          *://invidious.dhusch.de/*
// @match          *://*.piped.video/*
// @match          *://piped.tokhmi.xyz/*
// @match          *://piped.moomoo.me/*
// @match          *://piped.syncpundit.io/*
// @match          *://piped.mha.fi/*
// @match          *://watch.whatever.social/*
// @match          *://piped.garudalinux.org/*
// @match          *://efy.piped.pages.dev/*
// @match          *://watch.leptons.xyz/*
// @match          *://piped.lunar.icu/*
// @match          *://yt.dc09.ru/*
// @match          *://piped.mint.lgbt/*
// @match          *://*.il.ax/*
// @match          *://piped.privacy.com.de/*
// @match          *://piped.esmailelbob.xyz/*
// @match          *://piped.projectsegfau.lt/*
// @match          *://piped.in.projectsegfau.lt/*
// @match          *://piped.us.projectsegfau.lt/*
// @match          *://piped.privacydev.net/*
// @match          *://piped.palveluntarjoaja.eu/*
// @match          *://piped.smnz.de/*
// @match          *://piped.adminforge.de/*
// @match          *://piped.qdi.fi/*
// @match          *://piped.hostux.net/*
// @match          *://piped.chauvet.pro/*
// @match          *://piped.jotoma.de/*
// @match          *://piped.pfcd.me/*
// @match          *://piped.frontendfriendly.xyz/*
// @match          *://proxitok.pabloferreiro.es/*
// @match          *://proxitok.pussthecat.org/*
// @match          *://tok.habedieeh.re/*
// @match          *://proxitok.esmailelbob.xyz/*
// @match          *://proxitok.privacydev.net/*
// @match          *://tok.artemislena.eu/*
// @match          *://tok.adminforge.de/*
// @match          *://tt.vern.cc/*
// @match          *://cringe.whatever.social/*
// @match          *://proxitok.lunar.icu/*
// @match          *://proxitok.privacy.com.de/*
// @match          *://peertube.1312.media/*
// @match          *://tube.shanti.cafe/*
// @match          *://*.bee-tube.fr/*
// @match          *://video.sadmin.io/*
// @match          *://*.dalek.zone/*
// @match          *://review.peertube.biz/*
// @match          *://*.peervideo.club/*
// @match          *://tube.la-dina.net/*
// @match          *://peertube.tmp.rcp.tf/*
// @match          *://*.peertube.su/*
// @match          *://video.blender.org/*
// @match          *://videos.viorsan.com/*
// @match          *://tube-sciences-technologies.apps.education.fr/*
// @match          *://tube-numerique-educatif.apps.education.fr/*
// @match          *://tube-arts-lettres-sciences-humaines.apps.education.fr/*
// @match          *://*.beetoons.tv/*
// @match          *://comics.peertube.biz/*
// @match          *://*.makertube.net/*
// @match          *://*.poketube.fun/*
// @match          *://pt.sudovanilla.org/*
// @match          *://poke.ggtyler.dev/*
// @match          *://poke.uk2.littlekai.co.uk/*
// @match          *://poke.blahai.gay/*
// @match          *://*.ricktube.ru/*
// @match          *://*.coursehunter.net/*
// @match          *://*.coursetrain.net/*
// @exclude        file://*/*.mp4*
// @exclude        file://*/*.webm*
// @exclude        *://accounts.youtube.com/*
// @connect        yandex.ru
// @connect        disk.yandex.kz
// @connect        disk.yandex.com
// @connect        disk.yandex.com.am
// @connect        disk.yandex.com.ge
// @connect        disk.yandex.com.tr
// @connect        disk.yandex.by
// @connect        disk.yandex.az
// @connect        disk.yandex.co.il
// @connect        disk.yandex.ee
// @connect        disk.yandex.lt
// @connect        disk.yandex.lv
// @connect        disk.yandex.md
// @connect        disk.yandex.net
// @connect        disk.yandex.tj
// @connect        disk.yandex.tm
// @connect        disk.yandex.uz
// @connect        yandex.net
// @connect        timeweb.cloud
// @connect        raw.githubusercontent.com
// @connect        vimeo.com
// @connect        toil.cc
// @connect        deno.dev
// @connect        onrender.com
// @connect        workers.dev
// @connect        speed.cloudflare.com
// @connect        porntn.com
// @connect        googlevideo.com
// @namespace      vot
// @version        1.10.0beta
// @icon           https://translate.yandex.ru/icons/favicon.ico
// @author         Toil, SashaXser, MrSoczekXD, mynovelhost, sodapng
// @homepageURL    https://github.com/ilyhalight/voice-over-translation
// @updateURL      https://raw.githubusercontent.com/ilyhalight/voice-over-translation/dev/dist/vot.user.js
// @downloadURL    https://raw.githubusercontent.com/ilyhalight/voice-over-translation/dev/dist/vot.user.js
// @supportURL     https://github.com/ilyhalight/voice-over-translation/issues
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/bowser/es5.js":
/***/ (function(module) {

!function(e,t){ true?module.exports=t():0}(this,(function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(n,i,function(t){return e[t]}.bind(null,i));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=90)}({17:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n=r(18),i=function(){function e(){}return e.getFirstMatch=function(e,t){var r=t.match(e);return r&&r.length>0&&r[1]||""},e.getSecondMatch=function(e,t){var r=t.match(e);return r&&r.length>1&&r[2]||""},e.matchAndReturnConst=function(e,t,r){if(e.test(t))return r},e.getWindowsVersionName=function(e){switch(e){case"NT":return"NT";case"XP":return"XP";case"NT 5.0":return"2000";case"NT 5.1":return"XP";case"NT 5.2":return"2003";case"NT 6.0":return"Vista";case"NT 6.1":return"7";case"NT 6.2":return"8";case"NT 6.3":return"8.1";case"NT 10.0":return"10";default:return}},e.getMacOSVersionName=function(e){var t=e.split(".").splice(0,2).map((function(e){return parseInt(e,10)||0}));if(t.push(0),10===t[0])switch(t[1]){case 5:return"Leopard";case 6:return"Snow Leopard";case 7:return"Lion";case 8:return"Mountain Lion";case 9:return"Mavericks";case 10:return"Yosemite";case 11:return"El Capitan";case 12:return"Sierra";case 13:return"High Sierra";case 14:return"Mojave";case 15:return"Catalina";default:return}},e.getAndroidVersionName=function(e){var t=e.split(".").splice(0,2).map((function(e){return parseInt(e,10)||0}));if(t.push(0),!(1===t[0]&&t[1]<5))return 1===t[0]&&t[1]<6?"Cupcake":1===t[0]&&t[1]>=6?"Donut":2===t[0]&&t[1]<2?"Eclair":2===t[0]&&2===t[1]?"Froyo":2===t[0]&&t[1]>2?"Gingerbread":3===t[0]?"Honeycomb":4===t[0]&&t[1]<1?"Ice Cream Sandwich":4===t[0]&&t[1]<4?"Jelly Bean":4===t[0]&&t[1]>=4?"KitKat":5===t[0]?"Lollipop":6===t[0]?"Marshmallow":7===t[0]?"Nougat":8===t[0]?"Oreo":9===t[0]?"Pie":void 0},e.getVersionPrecision=function(e){return e.split(".").length},e.compareVersions=function(t,r,n){void 0===n&&(n=!1);var i=e.getVersionPrecision(t),s=e.getVersionPrecision(r),a=Math.max(i,s),o=0,u=e.map([t,r],(function(t){var r=a-e.getVersionPrecision(t),n=t+new Array(r+1).join(".0");return e.map(n.split("."),(function(e){return new Array(20-e.length).join("0")+e})).reverse()}));for(n&&(o=a-Math.min(i,s)),a-=1;a>=o;){if(u[0][a]>u[1][a])return 1;if(u[0][a]===u[1][a]){if(a===o)return 0;a-=1}else if(u[0][a]<u[1][a])return-1}},e.map=function(e,t){var r,n=[];if(Array.prototype.map)return Array.prototype.map.call(e,t);for(r=0;r<e.length;r+=1)n.push(t(e[r]));return n},e.find=function(e,t){var r,n;if(Array.prototype.find)return Array.prototype.find.call(e,t);for(r=0,n=e.length;r<n;r+=1){var i=e[r];if(t(i,r))return i}},e.assign=function(e){for(var t,r,n=e,i=arguments.length,s=new Array(i>1?i-1:0),a=1;a<i;a++)s[a-1]=arguments[a];if(Object.assign)return Object.assign.apply(Object,[e].concat(s));var o=function(){var e=s[t];"object"==typeof e&&null!==e&&Object.keys(e).forEach((function(t){n[t]=e[t]}))};for(t=0,r=s.length;t<r;t+=1)o();return e},e.getBrowserAlias=function(e){return n.BROWSER_ALIASES_MAP[e]},e.getBrowserTypeByAlias=function(e){return n.BROWSER_MAP[e]||""},e}();t.default=i,e.exports=t.default},18:function(e,t,r){"use strict";t.__esModule=!0,t.ENGINE_MAP=t.OS_MAP=t.PLATFORMS_MAP=t.BROWSER_MAP=t.BROWSER_ALIASES_MAP=void 0;t.BROWSER_ALIASES_MAP={"Amazon Silk":"amazon_silk","Android Browser":"android",Bada:"bada",BlackBerry:"blackberry",Chrome:"chrome",Chromium:"chromium",Electron:"electron",Epiphany:"epiphany",Firefox:"firefox",Focus:"focus",Generic:"generic","Google Search":"google_search",Googlebot:"googlebot","Internet Explorer":"ie","K-Meleon":"k_meleon",Maxthon:"maxthon","Microsoft Edge":"edge","MZ Browser":"mz","NAVER Whale Browser":"naver",Opera:"opera","Opera Coast":"opera_coast",PhantomJS:"phantomjs",Puffin:"puffin",QupZilla:"qupzilla",QQ:"qq",QQLite:"qqlite",Safari:"safari",Sailfish:"sailfish","Samsung Internet for Android":"samsung_internet",SeaMonkey:"seamonkey",Sleipnir:"sleipnir",Swing:"swing",Tizen:"tizen","UC Browser":"uc",Vivaldi:"vivaldi","WebOS Browser":"webos",WeChat:"wechat","Yandex Browser":"yandex",Roku:"roku"};t.BROWSER_MAP={amazon_silk:"Amazon Silk",android:"Android Browser",bada:"Bada",blackberry:"BlackBerry",chrome:"Chrome",chromium:"Chromium",electron:"Electron",epiphany:"Epiphany",firefox:"Firefox",focus:"Focus",generic:"Generic",googlebot:"Googlebot",google_search:"Google Search",ie:"Internet Explorer",k_meleon:"K-Meleon",maxthon:"Maxthon",edge:"Microsoft Edge",mz:"MZ Browser",naver:"NAVER Whale Browser",opera:"Opera",opera_coast:"Opera Coast",phantomjs:"PhantomJS",puffin:"Puffin",qupzilla:"QupZilla",qq:"QQ Browser",qqlite:"QQ Browser Lite",safari:"Safari",sailfish:"Sailfish",samsung_internet:"Samsung Internet for Android",seamonkey:"SeaMonkey",sleipnir:"Sleipnir",swing:"Swing",tizen:"Tizen",uc:"UC Browser",vivaldi:"Vivaldi",webos:"WebOS Browser",wechat:"WeChat",yandex:"Yandex Browser"};t.PLATFORMS_MAP={tablet:"tablet",mobile:"mobile",desktop:"desktop",tv:"tv"};t.OS_MAP={WindowsPhone:"Windows Phone",Windows:"Windows",MacOS:"macOS",iOS:"iOS",Android:"Android",WebOS:"WebOS",BlackBerry:"BlackBerry",Bada:"Bada",Tizen:"Tizen",Linux:"Linux",ChromeOS:"Chrome OS",PlayStation4:"PlayStation 4",Roku:"Roku"};t.ENGINE_MAP={EdgeHTML:"EdgeHTML",Blink:"Blink",Trident:"Trident",Presto:"Presto",Gecko:"Gecko",WebKit:"WebKit"}},90:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n,i=(n=r(91))&&n.__esModule?n:{default:n},s=r(18);function a(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}var o=function(){function e(){}var t,r,n;return e.getParser=function(e,t){if(void 0===t&&(t=!1),"string"!=typeof e)throw new Error("UserAgent should be a string");return new i.default(e,t)},e.parse=function(e){return new i.default(e).getResult()},t=e,n=[{key:"BROWSER_MAP",get:function(){return s.BROWSER_MAP}},{key:"ENGINE_MAP",get:function(){return s.ENGINE_MAP}},{key:"OS_MAP",get:function(){return s.OS_MAP}},{key:"PLATFORMS_MAP",get:function(){return s.PLATFORMS_MAP}}],(r=null)&&a(t.prototype,r),n&&a(t,n),e}();t.default=o,e.exports=t.default},91:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n=u(r(92)),i=u(r(93)),s=u(r(94)),a=u(r(95)),o=u(r(17));function u(e){return e&&e.__esModule?e:{default:e}}var d=function(){function e(e,t){if(void 0===t&&(t=!1),null==e||""===e)throw new Error("UserAgent parameter can't be empty");this._ua=e,this.parsedResult={},!0!==t&&this.parse()}var t=e.prototype;return t.getUA=function(){return this._ua},t.test=function(e){return e.test(this._ua)},t.parseBrowser=function(){var e=this;this.parsedResult.browser={};var t=o.default.find(n.default,(function(t){if("function"==typeof t.test)return t.test(e);if(t.test instanceof Array)return t.test.some((function(t){return e.test(t)}));throw new Error("Browser's test function is not valid")}));return t&&(this.parsedResult.browser=t.describe(this.getUA())),this.parsedResult.browser},t.getBrowser=function(){return this.parsedResult.browser?this.parsedResult.browser:this.parseBrowser()},t.getBrowserName=function(e){return e?String(this.getBrowser().name).toLowerCase()||"":this.getBrowser().name||""},t.getBrowserVersion=function(){return this.getBrowser().version},t.getOS=function(){return this.parsedResult.os?this.parsedResult.os:this.parseOS()},t.parseOS=function(){var e=this;this.parsedResult.os={};var t=o.default.find(i.default,(function(t){if("function"==typeof t.test)return t.test(e);if(t.test instanceof Array)return t.test.some((function(t){return e.test(t)}));throw new Error("Browser's test function is not valid")}));return t&&(this.parsedResult.os=t.describe(this.getUA())),this.parsedResult.os},t.getOSName=function(e){var t=this.getOS().name;return e?String(t).toLowerCase()||"":t||""},t.getOSVersion=function(){return this.getOS().version},t.getPlatform=function(){return this.parsedResult.platform?this.parsedResult.platform:this.parsePlatform()},t.getPlatformType=function(e){void 0===e&&(e=!1);var t=this.getPlatform().type;return e?String(t).toLowerCase()||"":t||""},t.parsePlatform=function(){var e=this;this.parsedResult.platform={};var t=o.default.find(s.default,(function(t){if("function"==typeof t.test)return t.test(e);if(t.test instanceof Array)return t.test.some((function(t){return e.test(t)}));throw new Error("Browser's test function is not valid")}));return t&&(this.parsedResult.platform=t.describe(this.getUA())),this.parsedResult.platform},t.getEngine=function(){return this.parsedResult.engine?this.parsedResult.engine:this.parseEngine()},t.getEngineName=function(e){return e?String(this.getEngine().name).toLowerCase()||"":this.getEngine().name||""},t.parseEngine=function(){var e=this;this.parsedResult.engine={};var t=o.default.find(a.default,(function(t){if("function"==typeof t.test)return t.test(e);if(t.test instanceof Array)return t.test.some((function(t){return e.test(t)}));throw new Error("Browser's test function is not valid")}));return t&&(this.parsedResult.engine=t.describe(this.getUA())),this.parsedResult.engine},t.parse=function(){return this.parseBrowser(),this.parseOS(),this.parsePlatform(),this.parseEngine(),this},t.getResult=function(){return o.default.assign({},this.parsedResult)},t.satisfies=function(e){var t=this,r={},n=0,i={},s=0;if(Object.keys(e).forEach((function(t){var a=e[t];"string"==typeof a?(i[t]=a,s+=1):"object"==typeof a&&(r[t]=a,n+=1)})),n>0){var a=Object.keys(r),u=o.default.find(a,(function(e){return t.isOS(e)}));if(u){var d=this.satisfies(r[u]);if(void 0!==d)return d}var c=o.default.find(a,(function(e){return t.isPlatform(e)}));if(c){var f=this.satisfies(r[c]);if(void 0!==f)return f}}if(s>0){var l=Object.keys(i),h=o.default.find(l,(function(e){return t.isBrowser(e,!0)}));if(void 0!==h)return this.compareVersion(i[h])}},t.isBrowser=function(e,t){void 0===t&&(t=!1);var r=this.getBrowserName().toLowerCase(),n=e.toLowerCase(),i=o.default.getBrowserTypeByAlias(n);return t&&i&&(n=i.toLowerCase()),n===r},t.compareVersion=function(e){var t=[0],r=e,n=!1,i=this.getBrowserVersion();if("string"==typeof i)return">"===e[0]||"<"===e[0]?(r=e.substr(1),"="===e[1]?(n=!0,r=e.substr(2)):t=[],">"===e[0]?t.push(1):t.push(-1)):"="===e[0]?r=e.substr(1):"~"===e[0]&&(n=!0,r=e.substr(1)),t.indexOf(o.default.compareVersions(i,r,n))>-1},t.isOS=function(e){return this.getOSName(!0)===String(e).toLowerCase()},t.isPlatform=function(e){return this.getPlatformType(!0)===String(e).toLowerCase()},t.isEngine=function(e){return this.getEngineName(!0)===String(e).toLowerCase()},t.is=function(e,t){return void 0===t&&(t=!1),this.isBrowser(e,t)||this.isOS(e)||this.isPlatform(e)},t.some=function(e){var t=this;return void 0===e&&(e=[]),e.some((function(e){return t.is(e)}))},e}();t.default=d,e.exports=t.default},92:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n,i=(n=r(17))&&n.__esModule?n:{default:n};var s=/version\/(\d+(\.?_?\d+)+)/i,a=[{test:[/googlebot/i],describe:function(e){var t={name:"Googlebot"},r=i.default.getFirstMatch(/googlebot\/(\d+(\.\d+))/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/opera/i],describe:function(e){var t={name:"Opera"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/opr\/|opios/i],describe:function(e){var t={name:"Opera"},r=i.default.getFirstMatch(/(?:opr|opios)[\s/](\S+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/SamsungBrowser/i],describe:function(e){var t={name:"Samsung Internet for Android"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:SamsungBrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/Whale/i],describe:function(e){var t={name:"NAVER Whale Browser"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:whale)[\s/](\d+(?:\.\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/MZBrowser/i],describe:function(e){var t={name:"MZ Browser"},r=i.default.getFirstMatch(/(?:MZBrowser)[\s/](\d+(?:\.\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/focus/i],describe:function(e){var t={name:"Focus"},r=i.default.getFirstMatch(/(?:focus)[\s/](\d+(?:\.\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/swing/i],describe:function(e){var t={name:"Swing"},r=i.default.getFirstMatch(/(?:swing)[\s/](\d+(?:\.\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/coast/i],describe:function(e){var t={name:"Opera Coast"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:coast)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/opt\/\d+(?:.?_?\d+)+/i],describe:function(e){var t={name:"Opera Touch"},r=i.default.getFirstMatch(/(?:opt)[\s/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/yabrowser/i],describe:function(e){var t={name:"Yandex Browser"},r=i.default.getFirstMatch(/(?:yabrowser)[\s/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/ucbrowser/i],describe:function(e){var t={name:"UC Browser"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:ucbrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/Maxthon|mxios/i],describe:function(e){var t={name:"Maxthon"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:Maxthon|mxios)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/epiphany/i],describe:function(e){var t={name:"Epiphany"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:epiphany)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/puffin/i],describe:function(e){var t={name:"Puffin"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:puffin)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/sleipnir/i],describe:function(e){var t={name:"Sleipnir"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:sleipnir)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/k-meleon/i],describe:function(e){var t={name:"K-Meleon"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/(?:k-meleon)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/micromessenger/i],describe:function(e){var t={name:"WeChat"},r=i.default.getFirstMatch(/(?:micromessenger)[\s/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/qqbrowser/i],describe:function(e){var t={name:/qqbrowserlite/i.test(e)?"QQ Browser Lite":"QQ Browser"},r=i.default.getFirstMatch(/(?:qqbrowserlite|qqbrowser)[/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/msie|trident/i],describe:function(e){var t={name:"Internet Explorer"},r=i.default.getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/\sedg\//i],describe:function(e){var t={name:"Microsoft Edge"},r=i.default.getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/edg([ea]|ios)/i],describe:function(e){var t={name:"Microsoft Edge"},r=i.default.getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/vivaldi/i],describe:function(e){var t={name:"Vivaldi"},r=i.default.getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/seamonkey/i],describe:function(e){var t={name:"SeaMonkey"},r=i.default.getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/sailfish/i],describe:function(e){var t={name:"Sailfish"},r=i.default.getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i,e);return r&&(t.version=r),t}},{test:[/silk/i],describe:function(e){var t={name:"Amazon Silk"},r=i.default.getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/phantom/i],describe:function(e){var t={name:"PhantomJS"},r=i.default.getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/slimerjs/i],describe:function(e){var t={name:"SlimerJS"},r=i.default.getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/blackberry|\bbb\d+/i,/rim\stablet/i],describe:function(e){var t={name:"BlackBerry"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/(web|hpw)[o0]s/i],describe:function(e){var t={name:"WebOS Browser"},r=i.default.getFirstMatch(s,e)||i.default.getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/bada/i],describe:function(e){var t={name:"Bada"},r=i.default.getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/tizen/i],describe:function(e){var t={name:"Tizen"},r=i.default.getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/qupzilla/i],describe:function(e){var t={name:"QupZilla"},r=i.default.getFirstMatch(/(?:qupzilla)[\s/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/firefox|iceweasel|fxios/i],describe:function(e){var t={name:"Firefox"},r=i.default.getFirstMatch(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/electron/i],describe:function(e){var t={name:"Electron"},r=i.default.getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/MiuiBrowser/i],describe:function(e){var t={name:"Miui"},r=i.default.getFirstMatch(/(?:MiuiBrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/chromium/i],describe:function(e){var t={name:"Chromium"},r=i.default.getFirstMatch(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i,e)||i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/chrome|crios|crmo/i],describe:function(e){var t={name:"Chrome"},r=i.default.getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/GSA/i],describe:function(e){var t={name:"Google Search"},r=i.default.getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:function(e){var t=!e.test(/like android/i),r=e.test(/android/i);return t&&r},describe:function(e){var t={name:"Android Browser"},r=i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/playstation 4/i],describe:function(e){var t={name:"PlayStation 4"},r=i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/safari|applewebkit/i],describe:function(e){var t={name:"Safari"},r=i.default.getFirstMatch(s,e);return r&&(t.version=r),t}},{test:[/.*/i],describe:function(e){var t=-1!==e.search("\\(")?/^(.*)\/(.*)[ \t]\((.*)/:/^(.*)\/(.*) /;return{name:i.default.getFirstMatch(t,e),version:i.default.getSecondMatch(t,e)}}}];t.default=a,e.exports=t.default},93:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n,i=(n=r(17))&&n.__esModule?n:{default:n},s=r(18);var a=[{test:[/Roku\/DVP/],describe:function(e){var t=i.default.getFirstMatch(/Roku\/DVP-(\d+\.\d+)/i,e);return{name:s.OS_MAP.Roku,version:t}}},{test:[/windows phone/i],describe:function(e){var t=i.default.getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i,e);return{name:s.OS_MAP.WindowsPhone,version:t}}},{test:[/windows /i],describe:function(e){var t=i.default.getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i,e),r=i.default.getWindowsVersionName(t);return{name:s.OS_MAP.Windows,version:t,versionName:r}}},{test:[/Macintosh(.*?) FxiOS(.*?)\//],describe:function(e){var t={name:s.OS_MAP.iOS},r=i.default.getSecondMatch(/(Version\/)(\d[\d.]+)/,e);return r&&(t.version=r),t}},{test:[/macintosh/i],describe:function(e){var t=i.default.getFirstMatch(/mac os x (\d+(\.?_?\d+)+)/i,e).replace(/[_\s]/g,"."),r=i.default.getMacOSVersionName(t),n={name:s.OS_MAP.MacOS,version:t};return r&&(n.versionName=r),n}},{test:[/(ipod|iphone|ipad)/i],describe:function(e){var t=i.default.getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i,e).replace(/[_\s]/g,".");return{name:s.OS_MAP.iOS,version:t}}},{test:function(e){var t=!e.test(/like android/i),r=e.test(/android/i);return t&&r},describe:function(e){var t=i.default.getFirstMatch(/android[\s/-](\d+(\.\d+)*)/i,e),r=i.default.getAndroidVersionName(t),n={name:s.OS_MAP.Android,version:t};return r&&(n.versionName=r),n}},{test:[/(web|hpw)[o0]s/i],describe:function(e){var t=i.default.getFirstMatch(/(?:web|hpw)[o0]s\/(\d+(\.\d+)*)/i,e),r={name:s.OS_MAP.WebOS};return t&&t.length&&(r.version=t),r}},{test:[/blackberry|\bbb\d+/i,/rim\stablet/i],describe:function(e){var t=i.default.getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i,e)||i.default.getFirstMatch(/blackberry\d+\/(\d+([_\s]\d+)*)/i,e)||i.default.getFirstMatch(/\bbb(\d+)/i,e);return{name:s.OS_MAP.BlackBerry,version:t}}},{test:[/bada/i],describe:function(e){var t=i.default.getFirstMatch(/bada\/(\d+(\.\d+)*)/i,e);return{name:s.OS_MAP.Bada,version:t}}},{test:[/tizen/i],describe:function(e){var t=i.default.getFirstMatch(/tizen[/\s](\d+(\.\d+)*)/i,e);return{name:s.OS_MAP.Tizen,version:t}}},{test:[/linux/i],describe:function(){return{name:s.OS_MAP.Linux}}},{test:[/CrOS/],describe:function(){return{name:s.OS_MAP.ChromeOS}}},{test:[/PlayStation 4/],describe:function(e){var t=i.default.getFirstMatch(/PlayStation 4[/\s](\d+(\.\d+)*)/i,e);return{name:s.OS_MAP.PlayStation4,version:t}}}];t.default=a,e.exports=t.default},94:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n,i=(n=r(17))&&n.__esModule?n:{default:n},s=r(18);var a=[{test:[/googlebot/i],describe:function(){return{type:"bot",vendor:"Google"}}},{test:[/huawei/i],describe:function(e){var t=i.default.getFirstMatch(/(can-l01)/i,e)&&"Nova",r={type:s.PLATFORMS_MAP.mobile,vendor:"Huawei"};return t&&(r.model=t),r}},{test:[/nexus\s*(?:7|8|9|10).*/i],describe:function(){return{type:s.PLATFORMS_MAP.tablet,vendor:"Nexus"}}},{test:[/ipad/i],describe:function(){return{type:s.PLATFORMS_MAP.tablet,vendor:"Apple",model:"iPad"}}},{test:[/Macintosh(.*?) FxiOS(.*?)\//],describe:function(){return{type:s.PLATFORMS_MAP.tablet,vendor:"Apple",model:"iPad"}}},{test:[/kftt build/i],describe:function(){return{type:s.PLATFORMS_MAP.tablet,vendor:"Amazon",model:"Kindle Fire HD 7"}}},{test:[/silk/i],describe:function(){return{type:s.PLATFORMS_MAP.tablet,vendor:"Amazon"}}},{test:[/tablet(?! pc)/i],describe:function(){return{type:s.PLATFORMS_MAP.tablet}}},{test:function(e){var t=e.test(/ipod|iphone/i),r=e.test(/like (ipod|iphone)/i);return t&&!r},describe:function(e){var t=i.default.getFirstMatch(/(ipod|iphone)/i,e);return{type:s.PLATFORMS_MAP.mobile,vendor:"Apple",model:t}}},{test:[/nexus\s*[0-6].*/i,/galaxy nexus/i],describe:function(){return{type:s.PLATFORMS_MAP.mobile,vendor:"Nexus"}}},{test:[/[^-]mobi/i],describe:function(){return{type:s.PLATFORMS_MAP.mobile}}},{test:function(e){return"blackberry"===e.getBrowserName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.mobile,vendor:"BlackBerry"}}},{test:function(e){return"bada"===e.getBrowserName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.mobile}}},{test:function(e){return"windows phone"===e.getBrowserName()},describe:function(){return{type:s.PLATFORMS_MAP.mobile,vendor:"Microsoft"}}},{test:function(e){var t=Number(String(e.getOSVersion()).split(".")[0]);return"android"===e.getOSName(!0)&&t>=3},describe:function(){return{type:s.PLATFORMS_MAP.tablet}}},{test:function(e){return"android"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.mobile}}},{test:function(e){return"macos"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.desktop,vendor:"Apple"}}},{test:function(e){return"windows"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.desktop}}},{test:function(e){return"linux"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.desktop}}},{test:function(e){return"playstation 4"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.tv}}},{test:function(e){return"roku"===e.getOSName(!0)},describe:function(){return{type:s.PLATFORMS_MAP.tv}}}];t.default=a,e.exports=t.default},95:function(e,t,r){"use strict";t.__esModule=!0,t.default=void 0;var n,i=(n=r(17))&&n.__esModule?n:{default:n},s=r(18);var a=[{test:function(e){return"microsoft edge"===e.getBrowserName(!0)},describe:function(e){if(/\sedg\//i.test(e))return{name:s.ENGINE_MAP.Blink};var t=i.default.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i,e);return{name:s.ENGINE_MAP.EdgeHTML,version:t}}},{test:[/trident/i],describe:function(e){var t={name:s.ENGINE_MAP.Trident},r=i.default.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:function(e){return e.test(/presto/i)},describe:function(e){var t={name:s.ENGINE_MAP.Presto},r=i.default.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:function(e){var t=e.test(/gecko/i),r=e.test(/like gecko/i);return t&&!r},describe:function(e){var t={name:s.ENGINE_MAP.Gecko},r=i.default.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/(apple)?webkit\/537\.36/i],describe:function(){return{name:s.ENGINE_MAP.Blink}}},{test:[/(apple)?webkit/i],describe:function(e){var t={name:s.ENGINE_MAP.WebKit},r=i.default.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}}];t.default=a,e.exports=t.default}})}));

/***/ }),

/***/ "./node_modules/requestidlecallback-polyfill/index.js":
/***/ (() => {

window.requestIdleCallback =
    window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return setTimeout(function() {
            cb({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    };

window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function(id) {
        clearTimeout(id);
    };


/***/ }),

/***/ "./src/styles/main.scss":
/***/ (() => {

GM_addStyle(".vot-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-ontheme));background-color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;outline:none;font-size:14px;font-weight:500;line-height:36px;transition:box-shadow .2s;display:inline-block;position:relative;box-shadow:0 3px 1px -2px #0003,0 2px 2px #00000024,0 1px 5px #0000001f;border:none!important;border-radius:4px!important;padding:0 16px!important}.vot-button[hidden]{display:none!important}.vot-button::-moz-focus-inner{border:none!important}.vot-button:before,.vot-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-button:before{background-color:rgb(var(--vot-helper-ontheme));transition:opacity .2s}.vot-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-button:hover{box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f}.vot-button:hover:before{opacity:.08}.vot-button:active{box-shadow:0 5px 5px -3px #0003,0 8px 10px 1px #00000024,0 3px 14px 2px #0000001f}.vot-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size}.vot-button[disabled=true]{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.12);color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);box-shadow:none;cursor:initial}.vot-button[disabled=true]:before,.vot-button[disabled=true]:after{opacity:0}.vot-outlined-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:34px;display:inline-block;position:relative;border:solid 1px rgba(var(--vot-onsurface-rgb,0,0,0),.24)!important;border-radius:4px!important;margin:0!important;padding:0 16px!important}.vot-outlined-button[hidden]{display:none!important}.vot-outlined-button::-moz-focus-inner{border:none!important}.vot-outlined-button:before,.vot-outlined-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:3px!important}.vot-outlined-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-outlined-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-outlined-button:hover:before{opacity:.04}.vot-outlined-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-outlined-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-outlined-button[disabled=true]:before,.vot-outlined-button[disabled=true]:after{opacity:0}.vot-text-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative;border:none!important;border-radius:4px!important;margin:0!important;padding:0 8px!important}.vot-text-button[hidden]{display:none!important}.vot-text-button::-moz-focus-inner{border:none!important}.vot-text-button:before,.vot-text-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-text-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-text-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-text-button:hover:before{opacity:.04}.vot-text-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-text-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-text-button[disabled=true]:before,.vot-text-button[disabled=true]:after{opacity:0}.vot-icon-button{--vot-helper-onsurface:rgba(var(--vot-onsurface-rgb,0,0,0),.87);box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;width:36px;height:36px;fill:var(--vot-helper-onsurface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative;border:none!important;border-radius:50%!important;margin:0!important;padding:0!important}.vot-icon-button[hidden]{display:none!important}.vot-icon-button::-moz-focus-inner{border:none!important}.vot-icon-button:before,.vot-icon-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-icon-button:before{background-color:var(--vot-helper-onsurface);transition:opacity .2s}.vot-icon-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity .3s,background-size .4s}.vot-icon-button:hover:before{opacity:.04}.vot-icon-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size,opacity}.vot-icon-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);fill:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-icon-button[disabled=true]:before,.vot-icon-button[disabled=true]:after{opacity:0}.vot-icon-button svg{fill:inherit;stroke:inherit;width:24px;height:36px}.vot-hotkey{justify-content:space-between;align-items:start;display:flex}.vot-hotkey-label{word-break:break-word;max-width:80%}.vot-hotkey-button{--vot-helper-surface:rgba(var(--vot-onsurface-rgb),.2);--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;width:fit-content;min-width:32px;height:fit-content;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:15px;line-height:1.5;display:inline-block;position:relative;border:solid 1px rgba(var(--vot-onsurface-rgb,0,0,0),.24)!important;border-radius:4px!important;margin:0!important;padding:0 8px!important}.vot-hotkey-button[hidden]{display:none!important}.vot-hotkey-button::-moz-focus-inner{border:none!important}.vot-hotkey-button:before,.vot-hotkey-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:3px!important}.vot-hotkey-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-hotkey-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-hotkey-button:hover:before{opacity:.04}.vot-hotkey-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-hotkey-button[data-status=active]{color:rgb(var(--vot-helper-theme))}.vot-hotkey-button[data-status=active]:before{opacity:.04}.vot-hotkey-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-hotkey-button[disabled=true]:before,.vot-hotkey-button[disabled=true]:after{opacity:0}.vot-textfield{display:inline-block;--vot-helper-theme:rgb(var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243)))!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari3:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif)!important;text-align:start!important;padding-top:6px!important;font-size:16px!important;line-height:1.5!important;position:relative!important}.vot-textfield[hidden]{display:none!important}.vot-textfield>input,.vot-textfield>textarea{box-sizing:border-box!important;border-style:solid!important;border-width:1px!important;border-color:transparent var(--vot-helper-safari2)var(--vot-helper-safari2)!important;width:100%!important;height:inherit!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;-webkit-text-fill-color:currentColor!important;font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;caret-color:var(--vot-helper-theme)!important;background-color:#0000!important;border-radius:4px!important;margin:0!important;padding:15px 13px!important;transition:border .2s,box-shadow .2s!important;box-shadow:inset 1px 0 #0000,inset -1px 0 #0000,inset 0 -1px #0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):placeholder-shown,.vot-textfield>textarea:not(:focus):placeholder-shown{border-top-color:var(--vot-helper-safari2)!important}.vot-textfield>input+span,.vot-textfield>textarea+span{font-family:inherit;width:100%!important;max-height:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;cursor:text!important;pointer-events:none!important;font-size:75%!important;line-height:15px!important;transition:color .2s,font-size .2s,line-height .2s!important;display:flex!important;position:absolute!important;top:0!important;left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span,.vot-textfield>textarea:not(:focus):placeholder-shown+span{font-size:inherit!important;line-height:68px!important}.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{content:\"\"!important;box-sizing:border-box!important;border-top:solid 1px var(--vot-helper-safari2)!important;pointer-events:none!important;min-width:10px!important;height:8px!important;margin-top:6px!important;transition:border .2s,box-shadow .2s!important;display:block!important;box-shadow:inset 0 1px #0000!important}.vot-textfield>input+span:before,.vot-textfield>textarea+span:before{border-left:1px solid #0000!important;border-radius:4px 0!important;margin-right:4px!important}.vot-textfield>input+span:after,.vot-textfield>textarea+span:after{border-right:1px solid #0000!important;border-radius:0 4px!important;flex-grow:1!important;margin-left:4px!important}.vot-textfield>input.vot-show-placeholer+span:before,.vot-textfield>textarea.vot-show-placeholer+span:before{margin-right:0!important}.vot-textfield>input.vot-show-placeholer+span:after,.vot-textfield>textarea.vot-show-placeholer+span:after{margin-left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span:before,.vot-textfield>input:not(:focus):placeholder-shown+span:after,.vot-textfield>textarea:not(:focus):placeholder-shown+span:before,.vot-textfield>textarea:not(:focus):placeholder-shown+span:after{border-top-color:#0000!important}.vot-textfield:hover>input:not(:disabled),.vot-textfield:hover>textarea:not(:disabled){border-color:transparent var(--vot-helper-safari3)var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled)+span:before,.vot-textfield:hover>input:not(:disabled)+span:after,.vot-textfield:hover>textarea:not(:disabled)+span:before,.vot-textfield:hover>textarea:not(:disabled)+span:after{border-top-color:var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled):not(:focus):placeholder-shown,.vot-textfield:hover>textarea:not(:disabled):not(:focus):placeholder-shown{border-color:var(--vot-helper-safari3)!important}.vot-textfield>input:focus,.vot-textfield>textarea:focus{border-color:transparent var(--vot-helper-theme)var(--vot-helper-theme)!important;box-shadow:inset 1px 0 var(--vot-helper-theme),inset -1px 0 var(--vot-helper-theme),inset 0 -1px var(--vot-helper-theme)!important;outline:none!important}.vot-textfield>input:focus+span,.vot-textfield>textarea:focus+span{color:var(--vot-helper-theme)!important}.vot-textfield>input:focus+span:before,.vot-textfield>input:focus+span:after,.vot-textfield>textarea:focus+span:before,.vot-textfield>textarea:focus+span:after{border-top-color:var(--vot-helper-theme)!important;box-shadow:inset 0 1px var(--vot-helper-theme)!important}.vot-textfield>input:disabled,.vot-textfield>input:disabled+span,.vot-textfield>textarea:disabled,.vot-textfield>textarea:disabled+span{border-color:transparent var(--vot-helper-safari1)var(--vot-helper-safari1)!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;pointer-events:none!important}.vot-textfield>input:disabled+span:before,.vot-textfield>input:disabled+span:after,.vot-textfield>textarea:disabled+span:before,.vot-textfield>textarea:disabled+span:after,.vot-textfield>input:disabled:placeholder-shown,.vot-textfield>input:disabled:placeholder-shown+span,.vot-textfield>textarea:disabled:placeholder-shown,.vot-textfield>textarea:disabled:placeholder-shown+span{border-top-color:var(--vot-helper-safari1)!important}.vot-textfield>input:disabled:placeholder-shown+span:before,.vot-textfield>input:disabled:placeholder-shown+span:after,.vot-textfield>textarea:disabled:placeholder-shown+span:before,.vot-textfield>textarea:disabled:placeholder-shown+span:after{border-top-color:#0000!important}@media not all and (-webkit-min-device-pixel-ratio:.0000264583),not all and (min-resolution:.001dpcm){@supports ((-webkit-appearance:none)){.vot-textfield>input,.vot-textfield>input+span,.vot-textfield>textarea,.vot-textfield>textarea+span,.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{transition-duration:.1s!important}}}.vot-checkbox{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));z-index:0;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;font-size:16px;line-height:1.5;display:inline-block;position:relative}.vot-checkbox-sub{padding-left:28px!important}.vot-checkbox[hidden]{display:none!important}.vot-checkbox>input{-webkit-appearance:none;appearance:none;z-index:10000;box-sizing:border-box;opacity:1;cursor:pointer;background:0 0;outline:none;width:18px;height:18px;transition:border-color .2s,background-color .2s;display:block;position:absolute;border:2px solid!important;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;border-radius:2px!important;margin:3px 1px!important;padding:0!important}.vot-checkbox>input+span{box-sizing:border-box;width:inherit;cursor:pointer;font-family:inherit;font-weight:400;display:inline-block;position:relative;padding-left:30px!important}.vot-checkbox>input+span:before{content:\"\";background-color:rgb(var(--vot-onsurface-rgb,0,0,0));opacity:0;pointer-events:none;width:40px;height:40px;transition:opacity .3s,transform .2s;display:block;position:absolute;top:-8px;left:-10px;transform:scale(1);border-radius:50%!important}.vot-checkbox>input+span:after{content:\"\";z-index:10000;pointer-events:none;width:10px;height:5px;transition:border-color .2s;display:block;position:absolute;top:3px;left:1px;transform:translate(3px,4px)rotate(-45deg);box-sizing:content-box!important;border:0 solid #0000!important;border-width:0 0 2px 2px!important}.vot-checkbox>input:checked,.vot-checkbox>input:indeterminate{background-color:rgb(var(--vot-helper-theme));border-color:rgb(var(--vot-helper-theme))!important}.vot-checkbox>input:checked+span:before,.vot-checkbox>input:indeterminate+span:before{background-color:rgb(var(--vot-helper-theme))}.vot-checkbox>input:checked+span:after,.vot-checkbox>input:indeterminate+span:after{border-color:rgb(var(--vot-helper-ontheme,255,255,255))!important}.vot-checkbox>input:hover{box-shadow:none!important}.vot-checkbox>input:indeterminate+span:after{transform:translate(4px,3px);border-left-width:0!important}.vot-checkbox:hover>input+span:before{opacity:.04}.vot-checkbox:active>input,.vot-checkbox:active:hover>input:not(:disabled){border-color:rgb(var(--vot-helper-theme))!important}.vot-checkbox:active>input:checked{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6);border-color:#0000!important}.vot-checkbox:active>input+span:before{opacity:1;transition:transform,opacity;transform:scale(0)}.vot-checkbox>input:disabled{cursor:initial;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-checkbox>input:disabled:checked,.vot-checkbox>input:disabled:indeterminate{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);border-color:#0000!important}.vot-checkbox>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial}.vot-checkbox>input:disabled+span:before{opacity:0;transform:scale(0)}.vot-slider{display:inline-block;--vot-safari-helper1:rgba(var(--vot-primary-rgb,33,150,243),.04)!important;--vot-safari-helper2:rgba(var(--vot-primary-rgb,33,150,243),.12)!important;--vot-safari-helper3:rgba(var(--vot-primary-rgb,33,150,243),.16)!important;--vot-safari-helper4:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;width:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system)!important;text-align:start!important;font-size:16px!important;line-height:1.5!important}.vot-slider[hidden]{display:none!important}.vot-slider>input{-webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;background-color:#0000!important;border:none!important;width:100%!important;height:36px!important;margin:0 0 -36px!important;padding:0!important;display:block!important;position:relative!important;top:24px!important}.vot-slider>input:hover{box-shadow:none!important}.vot-slider>input:last-child{margin:0!important;position:static!important}.vot-slider>input:before{content:\"\"!important;width:calc(100%*var(--vot-progress,0))!important;background:rgb(var(--vot-primary-rgb,33,150,243))!important;height:2px!important;display:block!important;position:absolute!important;top:calc(50% - 1px)!important}.vot-slider>input:disabled{cursor:default!important;opacity:.38!important}.vot-slider>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-webkit-slider-runnable-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-lower{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-upper{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-webkit-slider-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-fill-upper{opacity:.38!important}.vot-slider>input:disabled::-moz-range-progress{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-slider>input:disabled:-webkit-slider-thumb{color:rgb(var(--vot-surface-rgb,255,255,255))!important}.vot-slider>input:active::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper4)!important}.vot-slider>input:active::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:active::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:focus{outline:none!important}.vot-slider>input::-webkit-slider-runnable-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-moz-range-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-ms-track{box-sizing:border-box!important;background-color:#0000!important;border:none!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important;padding:0 17px!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-moz-range-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-ms-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;margin:0!important}.vot-slider>input::-moz-range-thumb{-moz-appearance:none!important}.vot-slider>input::-ms-thumb{margin:0 17px!important}.vot-slider>input::-moz-range-progress{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-lower{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-upper{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-moz-focus-outer{border:none!important}.vot-slider>span{margin-bottom:36px!important;display:inline-block!important}.vot-slider:hover>input::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper1)!important}.vot-slider:hover>input::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-slider:hover>input:hover::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-slider-label-value{margin-left:4px!important}.vot-select{font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;font-size:14px;font-weight:400;line-height:1.5;display:flex;--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0)!important;--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87)!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-select[hidden]{display:none!important}.vot-select-label{align-items:center;gap:4px;font-family:inherit;font-size:16px;display:flex}.vot-select-label .vot-select-label-icon{width:20px;height:20px;margin-top:2px}.vot-select-label .vot-select-label-icon>svg{width:20px;height:20px}.vot-select-outer{cursor:pointer;justify-content:space-between;align-items:center;width:120px;max-width:120px;display:flex;border:1px solid var(--vot-helper-safari1)!important;border-radius:4px!important;padding:0 5px!important;transition:border .2s!important}.vot-select-outer:hover{border-color:var(--vot-helper-safari2)!important}.vot-select-title{text-overflow:ellipsis;white-space:nowrap;font-family:inherit;overflow:hidden}.vot-select-arrow-icon{justify-content:center;align-items:center;width:20px;height:32px;display:flex}.vot-select-arrow-icon svg{fill:inherit;stroke:inherit}.vot-select-content-list{flex-direction:column;display:flex}.vot-select-content-list .vot-select-content-item{cursor:pointer;border-radius:8px!important;padding:5px 10px!important}.vot-select-content-list .vot-select-content-item:not([inert]):hover{background-color:#2a2c31}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]{color:rgb(var(--vot-primary-rgb,33,150,243));background-color:rgba(var(--vot-primary-rgb,33,150,243),.2)}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]:hover{background-color:rgba(var(--vot-primary-rgb,33,150,243),.1)!important}.vot-select-content-list .vot-select-content-item[inert]{cursor:default;color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)}.vot-select-content-list .vot-select-content-item[hidden]{display:none!important}.vot-header{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;font-weight:700;line-height:1.5}.vot-header[hidden]{display:none!important}.vot-header:not(:first-child){padding-top:8px}.vot-header-level-1{font-size:2em}.vot-header-level-2{font-size:1.5em}.vot-header-level-3{font-size:1.17em}.vot-header-level-4{font-size:1em}.vot-header-level-5{font-size:.83em}.vot-header-level-6{font-size:.67em}.vot-info{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;-webkit-user-select:text;user-select:text;font-size:16px;line-height:1.5;display:flex}.vot-info[hidden]{display:none!important}.vot-info>:not(:first-child){color:rgba(var(--vot-helper-onsurface-rgb),.5);flex:1;margin-left:8px!important}.vot-details{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;cursor:pointer;justify-content:space-between;align-items:center;font-size:16px;line-height:1.5;transition:background .5s;display:flex;border-radius:.5em!important;margin:-.5em!important;padding:.5em!important}.vot-details[hidden]{display:none!important}.vot-details-arrow-icon{width:20px;height:32px;fill:rgba(var(--vot-helper-onsurface-rgb),.87);justify-content:center;align-items:center;display:flex;transform:scale(1.25)rotate(-90deg)}.vot-details:hover{background:rgba(var(--vot-onsurface-rgb,0,0,0),.04)}.vot-lang-select{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;display:flex}.vot-lang-select[hidden]{display:none!important}.vot-lang-select-icon{justify-content:center;align-items:center;width:32px;height:32px;display:flex}.vot-lang-select-icon svg{fill:inherit;stroke:inherit}.vot-segmented-button{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);-webkit-user-select:none;user-select:none;background:rgb(var(--vot-surface-rgb,255,255,255));max-width:100vw;height:32px;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;align-items:center;font-size:16px;line-height:1.5;transition:opacity .5s;display:flex;position:absolute;top:5rem;left:50%;overflow:hidden;transform:translate(-50%);border-radius:4px!important}.vot-segmented-button[hidden]{display:none!important}.vot-segmented-button *{box-sizing:border-box!important}.vot-segmented-button .vot-separator{background:rgba(var(--vot-helper-theme-rgb),.1);width:1px;height:50%}.vot-segmented-button .vot-separator[hidden]{display:none!important}.vot-segmented-button .vot-segment,.vot-segmented-button .vot-segment-only-icon{height:100%;color:inherit;background-color:#0000;justify-content:center;align-items:center;transition:background-color .1s ease-in-out;display:flex;position:relative;overflow:hidden;border:none!important;padding:0 8px!important}.vot-segmented-button .vot-segment[hidden],.vot-segmented-button [hidden].vot-segment-only-icon{display:none!important}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before,.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before{background-color:rgb(var(--vot-helper-theme-rgb));transition:opacity .2s}.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-segmented-button .vot-segment:hover:before,.vot-segmented-button .vot-segment-only-icon:hover:before{opacity:.04}.vot-segmented-button .vot-segment:active:after,.vot-segmented-button .vot-segment-only-icon:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-segmented-button .vot-segment-only-icon{min-width:32px;padding:0!important}.vot-segmented-button .vot-segment-label{white-space:nowrap;color:inherit;font-weight:400;margin-left:8px!important}.vot-segmented-button[data-status=success] .vot-translate-button{color:rgb(var(--vot-primary-rgb,33,150,243));fill:rgb(var(--vot-primary-rgb,33,150,243))}.vot-segmented-button[data-status=error] .vot-translate-button{color:#f28b82;fill:#f28b82}.vot-segmented-button[data-loading=true] #vot-loading-icon{display:block!important}.vot-segmented-button[data-loading=true] #vot-translate-icon{display:none!important}.vot-segmented-button[data-direction=column]{flex-direction:column;height:fit-content}.vot-segmented-button[data-direction=column] .vot-segment-label{display:none}.vot-segmented-button[data-direction=column]>.vot-segment-only-icon,.vot-segmented-button[data-direction=column]>.vot-segment{padding:8px!important}.vot-segmented-button[data-direction=column] .vot-separator{width:50%;height:1px}.vot-segmented-button[data-position=left]{top:12.5vh;left:50px}.vot-segmented-button[data-position=right]{top:12.5vh;left:auto;right:0}.vot-segmented-button svg{width:24px;fill:inherit;stroke:inherit}.vot-tooltip{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);--vot-helper-ondialog:rgb(var(--vot-ondialog-rgb,37,38,40));--vot-helper-border:rgb(var(--vot-tooltip-border,69,69,69));-webkit-user-select:none;user-select:none;background:rgb(var(--vot-surface-rgb,255,255,255));color:var(--vot-helper-theme);fill:var(--vot-helper-theme);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;opacity:0;align-items:center;width:max-content;max-width:calc(100vw - 10px);height:max-content;font-size:14px;line-height:1.5;transition:opacity .5s;display:flex;position:absolute;top:0;bottom:0;left:0;right:0;overflow:hidden;box-shadow:0 1px 3px #0000001f;border-radius:4px!important;padding:4px 8px!important}.vot-tooltip[hidden]{display:none!important}.vot-tooltip[data-trigger=click]{-webkit-user-select:text;user-select:text}.vot-tooltip.vot-tooltip-bordered{border:1px solid var(--vot-helper-border)}.vot-tooltip *{box-sizing:border-box!important}.vot-menu{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);-webkit-user-select:none;user-select:none;background-color:var(--vot-helper-surface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;visibility:visible;opacity:1;transform-origin:top;min-width:300px;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;position:absolute;top:calc(5rem + 48px);left:50%;overflow:hidden;transform:translate(-50%)scale(1);border-radius:8px!important}.vot-menu *{box-sizing:border-box!important}.vot-menu[hidden]{pointer-events:none;visibility:hidden;opacity:0;transform:translate(-50%)scale(0);display:block!important}.vot-menu-content-wrapper{min-height:100px;max-height:calc(var(--vot-container-height,75vh) - (5rem + 32px + 16px)*2);flex-direction:column;display:flex;overflow:auto}.vot-menu-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-menu-header-container:empty{padding:0 0 16px!important}.vot-menu-header-container>.vot-icon-button{margin-inline-end:4px!important;margin-top:4px!important}.vot-menu-title-container{font-size:inherit;font-weight:inherit;text-align:start;outline:0;flex:1;display:flex;margin:0!important}.vot-menu-title{flex:1;font-size:16px;font-weight:400;line-height:1;padding:16px!important}.vot-menu-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:8px;min-height:1.375rem;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important;padding:0 16px!important}.vot-menu-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-menu-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-menu-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-menu-footer-container{flex-shrink:0;justify-content:flex-end;display:flex;padding:16px!important}.vot-menu-footer-container:empty{padding:16px 0 0!important}.vot-menu[data-position=left]{transform-origin:0;top:12.5vh;left:240px}.vot-menu[data-position=right]{transform-origin:100%;top:12.5vh;left:auto;right:-80px}.vot-dialog{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);max-width:initial;max-height:initial;width:min(var(--vot-dialog-width,512px),100%);top:50%;bottom:50%;background-color:var(--vot-helper-surface);height:fit-content;color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);-webkit-user-select:none;user-select:none;visibility:visible;opacity:1;transform-origin:50%;border-radius:8px;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;display:block;position:fixed;top:0;bottom:0;left:0;right:0;overflow-x:auto;overflow-y:hidden;transform:scale(1);box-shadow:0 0 16px #0000001f,0 16px 16px #0000003d;margin:auto!important;padding:0!important}[hidden]>.vot-dialog{pointer-events:none;opacity:0;transition:opacity .1s,transform .2s;transform:scale(.5)}.vot-dialog-container{visibility:visible;z-index:2147483647;position:absolute}.vot-dialog-container[hidden]{pointer-events:none;visibility:hidden;display:block!important}.vot-dialog-container *{box-sizing:border-box!important}.vot-dialog-backdrop{opacity:1;background-color:#0009;transition:opacity .3s;position:fixed;top:0;bottom:0;left:0;right:0}[hidden]>.vot-dialog-backdrop{pointer-events:none;opacity:0}.vot-dialog-content-wrapper{flex-direction:column;max-height:75vh;display:flex;overflow:auto}.vot-dialog-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-dialog-header-container:empty{padding:0 0 20px}.vot-dialog-header-container>.vot-icon-button{margin-inline-end:4px!important;margin-top:4px!important}.vot-dialog-title-container{font-size:inherit;font-weight:inherit;outline:0;flex:1;display:flex;margin:0!important}.vot-dialog-title{flex:1;font-size:115.385%;font-weight:700;line-height:1;padding:20px 20px 16px!important}.vot-dialog-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:16px;min-height:1.375rem;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important;padding:0 20px!important}.vot-dialog-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-dialog-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-dialog-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-dialog-footer-container{flex-shrink:0;justify-content:flex-end;display:flex;padding:16px!important}.vot-dialog-footer-container:empty{padding:20px 0 0!important}.vot-inline-loader{aspect-ratio:5;--vot-loader-bg:no-repeat radial-gradient(farthest-side,rgba(var(--vot-onsurface-rgb,0,0,0),.38)94%,transparent);background:var(--vot-loader-bg),var(--vot-loader-bg),var(--vot-loader-bg),var(--vot-loader-bg);background-size:20% 100%;height:8px;animation:.75s infinite alternate dotsSlide,1.5s infinite alternate dotsFlip}@keyframes dotsSlide{0%,10%{background-position:0 0,0 0,0 0,0 0}33%{background-position:0 0,33.3333% 0,33.3333% 0,33.3333% 0}66%{background-position:0 0,33.3333% 0,66.6667% 0,66.6667% 0}90%,to{background-position:0 0,33.3333% 0,66.6667% 0,100% 0}}@keyframes dotsFlip{0%,49.99%{transform:scale(1)}50%,to{transform:scale(-1)}}.vot-subtitles{--vot-subtitles-background:rgba(var(--vot-surface-rgb,46,47,52),var(--vot-subtitles-opacity,.8));background:var(--vot-subtitles-background,#2e2f34cc);width:max-content;max-width:100%;max-height:100%;color:var(--vot-subtitles-color,#e3e3e3);pointer-events:all;font-size:20px;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);box-sizing:border-box;-webkit-user-select:none;user-select:none;flex-wrap:wrap;gap:0 3px;line-height:normal;display:flex;position:relative;border-radius:.5em!important;padding:.5em!important}.vot-subtitles-widget{z-index:2147483647;pointer-events:none;justify-content:center;align-items:center;width:50%;min-height:20%;max-height:100%;display:flex;position:absolute;top:75%;left:25%}.vot-subtitles-info{flex-direction:column;gap:2px;display:flex;padding:6px!important}.vot-subtitles-info-service{color:var(--vot-subtitles-context-color,#86919b);margin-bottom:8px!important;font-size:10px!important;line-height:1!important}.vot-subtitles-info-header{color:var(--vot-subtitles-header-color,#fff);margin-bottom:6px!important;font-size:20px!important;font-weight:500!important;line-height:1!important}.vot-subtitles-info-context{color:var(--vot-subtitles-context-color,#86919b);font-size:12px!important;line-height:1.2!important}.vot-subtitles span{cursor:pointer;position:relative;font-size:inherit!important;font-family:inherit!important;line-height:normal!important}.vot-subtitles span.passed{color:var(--vot-subtitles-passed-color,#2196f3)}.vot-subtitles span:before{content:\"\";z-index:-1;width:100%;height:100%;position:absolute;top:2px;bottom:2px;left:-2px;right:-2px;border-radius:4px!important;padding:0 2px!important}.vot-subtitles span:hover:before{background:var(--vot-subtitles-hover-color,#ffffff8c)}.vot-subtitles span.selected:before{background:var(--vot-subtitles-passed-color,#2196f3)}#vot-subtitles-info.vot-subtitles-info *{-webkit-user-select:text!important;user-select:text!important}:root{--vot-font-family:\"Roboto\",\"Segoe UI\",system-ui,sans-serif;--vot-primary-rgb:139,180,245;--vot-onprimary-rgb:32,33,36;--vot-surface-rgb:32,33,36;--vot-onsurface-rgb:227,227,227;--vot-subtitles-color:rgb(var(--vot-onsurface-rgb,227,227,227));--vot-subtitles-passed-color:rgb(var(--vot-primary-rgb,33,150,243))}vot-block{font-family:inherit;display:block;visibility:visible!important}.vot-portal{display:inline}.vot-portal-local{z-index:2147483647;position:fixed;top:0;left:0}")

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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
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
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  k: () => (/* binding */ countryCode)
});

;// ./node_modules/chaimu/dist/config.js
/* harmony default export */ const config = ({
    version: "1.0.4",
    debug: false,
    fetchFn: fetch.bind(window),
});

;// ./node_modules/soundtouchjs/dist/soundtouch.js
/*
 * SoundTouch JS v0.1.30 audio processing library
 * Copyright (c) Olli Parviainen
 * Copyright (c) Ryan Berdeen
 * Copyright (c) Jakub Fiala
 * Copyright (c) Steve 'Cutter' Blades
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

class FifoSampleBuffer {
  constructor() {
    this._vector = new Float32Array();
    this._position = 0;
    this._frameCount = 0;
  }
  get vector() {
    return this._vector;
  }
  get position() {
    return this._position;
  }
  get startIndex() {
    return this._position * 2;
  }
  get frameCount() {
    return this._frameCount;
  }
  get endIndex() {
    return (this._position + this._frameCount) * 2;
  }
  clear() {
    this.receive(this._frameCount);
    this.rewind();
  }
  put(numFrames) {
    this._frameCount += numFrames;
  }
  putSamples(samples, position, numFrames = 0) {
    position = position || 0;
    const sourceOffset = position * 2;
    if (!(numFrames >= 0)) {
      numFrames = (samples.length - sourceOffset) / 2;
    }
    const numSamples = numFrames * 2;
    this.ensureCapacity(numFrames + this._frameCount);
    const destOffset = this.endIndex;
    this.vector.set(samples.subarray(sourceOffset, sourceOffset + numSamples), destOffset);
    this._frameCount += numFrames;
  }
  putBuffer(buffer, position, numFrames = 0) {
    position = position || 0;
    if (!(numFrames >= 0)) {
      numFrames = buffer.frameCount - position;
    }
    this.putSamples(buffer.vector, buffer.position + position, numFrames);
  }
  receive(numFrames) {
    if (!(numFrames >= 0) || numFrames > this._frameCount) {
      numFrames = this.frameCount;
    }
    this._frameCount -= numFrames;
    this._position += numFrames;
  }
  receiveSamples(output, numFrames = 0) {
    const numSamples = numFrames * 2;
    const sourceOffset = this.startIndex;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
    this.receive(numFrames);
  }
  extract(output, position = 0, numFrames = 0) {
    const sourceOffset = this.startIndex + position * 2;
    const numSamples = numFrames * 2;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
  }
  ensureCapacity(numFrames = 0) {
    const minLength = parseInt(numFrames * 2);
    if (this._vector.length < minLength) {
      const newVector = new Float32Array(minLength);
      newVector.set(this._vector.subarray(this.startIndex, this.endIndex));
      this._vector = newVector;
      this._position = 0;
    } else {
      this.rewind();
    }
  }
  ensureAdditionalCapacity(numFrames = 0) {
    this.ensureCapacity(this._frameCount + numFrames);
  }
  rewind() {
    if (this._position > 0) {
      this._vector.set(this._vector.subarray(this.startIndex, this.endIndex));
      this._position = 0;
    }
  }
}

class AbstractFifoSamplePipe {
  constructor(createBuffers) {
    if (createBuffers) {
      this._inputBuffer = new FifoSampleBuffer();
      this._outputBuffer = new FifoSampleBuffer();
    } else {
      this._inputBuffer = this._outputBuffer = null;
    }
  }
  get inputBuffer() {
    return this._inputBuffer;
  }
  set inputBuffer(inputBuffer) {
    this._inputBuffer = inputBuffer;
  }
  get outputBuffer() {
    return this._outputBuffer;
  }
  set outputBuffer(outputBuffer) {
    this._outputBuffer = outputBuffer;
  }
  clear() {
    this._inputBuffer.clear();
    this._outputBuffer.clear();
  }
}

class RateTransposer extends AbstractFifoSamplePipe {
  constructor(createBuffers) {
    super(createBuffers);
    this.reset();
    this._rate = 1;
  }
  set rate(rate) {
    this._rate = rate;
  }
  reset() {
    this.slopeCount = 0;
    this.prevSampleL = 0;
    this.prevSampleR = 0;
  }
  clone() {
    const result = new RateTransposer();
    result.rate = this._rate;
    return result;
  }
  process() {
    const numFrames = this._inputBuffer.frameCount;
    this._outputBuffer.ensureAdditionalCapacity(numFrames / this._rate + 1);
    const numFramesOutput = this.transpose(numFrames);
    this._inputBuffer.receive();
    this._outputBuffer.put(numFramesOutput);
  }
  transpose(numFrames = 0) {
    if (numFrames === 0) {
      return 0;
    }
    const src = this._inputBuffer.vector;
    const srcOffset = this._inputBuffer.startIndex;
    const dest = this._outputBuffer.vector;
    const destOffset = this._outputBuffer.endIndex;
    let used = 0;
    let i = 0;
    while (this.slopeCount < 1.0) {
      dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * this.prevSampleL + this.slopeCount * src[srcOffset];
      dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * this.prevSampleR + this.slopeCount * src[srcOffset + 1];
      i = i + 1;
      this.slopeCount += this._rate;
    }
    this.slopeCount -= 1.0;
    if (numFrames !== 1) {
      out: while (true) {
        while (this.slopeCount > 1.0) {
          this.slopeCount -= 1.0;
          used = used + 1;
          if (used >= numFrames - 1) {
            break out;
          }
        }
        const srcIndex = srcOffset + 2 * used;
        dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * src[srcIndex] + this.slopeCount * src[srcIndex + 2];
        dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * src[srcIndex + 1] + this.slopeCount * src[srcIndex + 3];
        i = i + 1;
        this.slopeCount += this._rate;
      }
    }
    this.prevSampleL = src[srcOffset + 2 * numFrames - 2];
    this.prevSampleR = src[srcOffset + 2 * numFrames - 1];
    return i;
  }
}

class FilterSupport {
  constructor(pipe) {
    this._pipe = pipe;
  }
  get pipe() {
    return this._pipe;
  }
  get inputBuffer() {
    return this._pipe.inputBuffer;
  }
  get outputBuffer() {
    return this._pipe.outputBuffer;
  }
  fillInputBuffer() {
    throw new Error('fillInputBuffer() not overridden');
  }
  fillOutputBuffer(numFrames = 0) {
    while (this.outputBuffer.frameCount < numFrames) {
      const numInputFrames = 8192 * 2 - this.inputBuffer.frameCount;
      this.fillInputBuffer(numInputFrames);
      if (this.inputBuffer.frameCount < 8192 * 2) {
        break;
      }
      this._pipe.process();
    }
  }
  clear() {
    this._pipe.clear();
  }
}

const noop = function () {
  return;
};

class SimpleFilter extends FilterSupport {
  constructor(sourceSound, pipe, callback = noop) {
    super(pipe);
    this.callback = callback;
    this.sourceSound = sourceSound;
    this.historyBufferSize = 22050;
    this._sourcePosition = 0;
    this.outputBufferPosition = 0;
    this._position = 0;
  }
  get position() {
    return this._position;
  }
  set position(position) {
    if (position > this._position) {
      throw new RangeError('New position may not be greater than current position');
    }
    const newOutputBufferPosition = this.outputBufferPosition - (this._position - position);
    if (newOutputBufferPosition < 0) {
      throw new RangeError('New position falls outside of history buffer');
    }
    this.outputBufferPosition = newOutputBufferPosition;
    this._position = position;
  }
  get sourcePosition() {
    return this._sourcePosition;
  }
  set sourcePosition(sourcePosition) {
    this.clear();
    this._sourcePosition = sourcePosition;
  }
  onEnd() {
    this.callback();
  }
  fillInputBuffer(numFrames = 0) {
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.sourceSound.extract(samples, numFrames, this._sourcePosition);
    this._sourcePosition += numFramesExtracted;
    this.inputBuffer.putSamples(samples, 0, numFramesExtracted);
  }
  extract(target, numFrames = 0) {
    this.fillOutputBuffer(this.outputBufferPosition + numFrames);
    const numFramesExtracted = Math.min(numFrames, this.outputBuffer.frameCount - this.outputBufferPosition);
    this.outputBuffer.extract(target, this.outputBufferPosition, numFramesExtracted);
    const currentFrames = this.outputBufferPosition + numFramesExtracted;
    this.outputBufferPosition = Math.min(this.historyBufferSize, currentFrames);
    this.outputBuffer.receive(Math.max(currentFrames - this.historyBufferSize, 0));
    this._position += numFramesExtracted;
    return numFramesExtracted;
  }
  handleSampleData(event) {
    this.extract(event.data, 4096);
  }
  clear() {
    super.clear();
    this.outputBufferPosition = 0;
  }
}

const USE_AUTO_SEQUENCE_LEN = 0;
const DEFAULT_SEQUENCE_MS = USE_AUTO_SEQUENCE_LEN;
const USE_AUTO_SEEKWINDOW_LEN = 0;
const DEFAULT_SEEKWINDOW_MS = USE_AUTO_SEEKWINDOW_LEN;
const DEFAULT_OVERLAP_MS = 8;
const _SCAN_OFFSETS = [[124, 186, 248, 310, 372, 434, 496, 558, 620, 682, 744, 806, 868, 930, 992, 1054, 1116, 1178, 1240, 1302, 1364, 1426, 1488, 0], [-100, -75, -50, -25, 25, 50, 75, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-20, -15, -10, -5, 5, 10, 15, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-4, -3, -2, -1, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
const AUTOSEQ_TEMPO_LOW = 0.5;
const AUTOSEQ_TEMPO_TOP = 2.0;
const AUTOSEQ_AT_MIN = 125.0;
const AUTOSEQ_AT_MAX = 50.0;
const AUTOSEQ_K = (AUTOSEQ_AT_MAX - AUTOSEQ_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
const AUTOSEQ_C = AUTOSEQ_AT_MIN - AUTOSEQ_K * AUTOSEQ_TEMPO_LOW;
const AUTOSEEK_AT_MIN = 25.0;
const AUTOSEEK_AT_MAX = 15.0;
const AUTOSEEK_K = (AUTOSEEK_AT_MAX - AUTOSEEK_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
const AUTOSEEK_C = AUTOSEEK_AT_MIN - AUTOSEEK_K * AUTOSEQ_TEMPO_LOW;
class Stretch extends AbstractFifoSamplePipe {
  constructor(createBuffers) {
    super(createBuffers);
    this._quickSeek = true;
    this.midBufferDirty = false;
    this.midBuffer = null;
    this.overlapLength = 0;
    this.autoSeqSetting = true;
    this.autoSeekSetting = true;
    this._tempo = 1;
    this.setParameters(44100, DEFAULT_SEQUENCE_MS, DEFAULT_SEEKWINDOW_MS, DEFAULT_OVERLAP_MS);
  }
  clear() {
    super.clear();
    this.clearMidBuffer();
  }
  clearMidBuffer() {
    if (this.midBufferDirty) {
      this.midBufferDirty = false;
      this.midBuffer = null;
    }
  }
  setParameters(sampleRate, sequenceMs, seekWindowMs, overlapMs) {
    if (sampleRate > 0) {
      this.sampleRate = sampleRate;
    }
    if (overlapMs > 0) {
      this.overlapMs = overlapMs;
    }
    if (sequenceMs > 0) {
      this.sequenceMs = sequenceMs;
      this.autoSeqSetting = false;
    } else {
      this.autoSeqSetting = true;
    }
    if (seekWindowMs > 0) {
      this.seekWindowMs = seekWindowMs;
      this.autoSeekSetting = false;
    } else {
      this.autoSeekSetting = true;
    }
    this.calculateSequenceParameters();
    this.calculateOverlapLength(this.overlapMs);
    this.tempo = this._tempo;
  }
  set tempo(newTempo) {
    let intskip;
    this._tempo = newTempo;
    this.calculateSequenceParameters();
    this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength);
    this.skipFract = 0;
    intskip = Math.floor(this.nominalSkip + 0.5);
    this.sampleReq = Math.max(intskip + this.overlapLength, this.seekWindowLength) + this.seekLength;
  }
  get tempo() {
    return this._tempo;
  }
  get inputChunkSize() {
    return this.sampleReq;
  }
  get outputChunkSize() {
    return this.overlapLength + Math.max(0, this.seekWindowLength - 2 * this.overlapLength);
  }
  calculateOverlapLength(overlapInMsec = 0) {
    let newOvl;
    newOvl = this.sampleRate * overlapInMsec / 1000;
    newOvl = newOvl < 16 ? 16 : newOvl;
    newOvl -= newOvl % 8;
    this.overlapLength = newOvl;
    this.refMidBuffer = new Float32Array(this.overlapLength * 2);
    this.midBuffer = new Float32Array(this.overlapLength * 2);
  }
  checkLimits(x, mi, ma) {
    return x < mi ? mi : x > ma ? ma : x;
  }
  calculateSequenceParameters() {
    let seq;
    let seek;
    if (this.autoSeqSetting) {
      seq = AUTOSEQ_C + AUTOSEQ_K * this._tempo;
      seq = this.checkLimits(seq, AUTOSEQ_AT_MAX, AUTOSEQ_AT_MIN);
      this.sequenceMs = Math.floor(seq + 0.5);
    }
    if (this.autoSeekSetting) {
      seek = AUTOSEEK_C + AUTOSEEK_K * this._tempo;
      seek = this.checkLimits(seek, AUTOSEEK_AT_MAX, AUTOSEEK_AT_MIN);
      this.seekWindowMs = Math.floor(seek + 0.5);
    }
    this.seekWindowLength = Math.floor(this.sampleRate * this.sequenceMs / 1000);
    this.seekLength = Math.floor(this.sampleRate * this.seekWindowMs / 1000);
  }
  set quickSeek(enable) {
    this._quickSeek = enable;
  }
  clone() {
    const result = new Stretch();
    result.tempo = this._tempo;
    result.setParameters(this.sampleRate, this.sequenceMs, this.seekWindowMs, this.overlapMs);
    return result;
  }
  seekBestOverlapPosition() {
    return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo();
  }
  seekBestOverlapPositionStereo() {
    let bestOffset;
    let bestCorrelation;
    let correlation;
    let i = 0;
    this.preCalculateCorrelationReferenceStereo();
    bestOffset = 0;
    bestCorrelation = Number.MIN_VALUE;
    for (; i < this.seekLength; i = i + 1) {
      correlation = this.calculateCrossCorrelationStereo(2 * i, this.refMidBuffer);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = i;
      }
    }
    return bestOffset;
  }
  seekBestOverlapPositionStereoQuick() {
    let bestOffset;
    let bestCorrelation;
    let correlation;
    let scanCount = 0;
    let correlationOffset;
    let tempOffset;
    this.preCalculateCorrelationReferenceStereo();
    bestCorrelation = Number.MIN_VALUE;
    bestOffset = 0;
    correlationOffset = 0;
    tempOffset = 0;
    for (; scanCount < 4; scanCount = scanCount + 1) {
      let j = 0;
      while (_SCAN_OFFSETS[scanCount][j]) {
        tempOffset = correlationOffset + _SCAN_OFFSETS[scanCount][j];
        if (tempOffset >= this.seekLength) {
          break;
        }
        correlation = this.calculateCrossCorrelationStereo(2 * tempOffset, this.refMidBuffer);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = tempOffset;
        }
        j = j + 1;
      }
      correlationOffset = bestOffset;
    }
    return bestOffset;
  }
  preCalculateCorrelationReferenceStereo() {
    let i = 0;
    let context;
    let temp;
    for (; i < this.overlapLength; i = i + 1) {
      temp = i * (this.overlapLength - i);
      context = i * 2;
      this.refMidBuffer[context] = this.midBuffer[context] * temp;
      this.refMidBuffer[context + 1] = this.midBuffer[context + 1] * temp;
    }
  }
  calculateCrossCorrelationStereo(mixingPosition, compare) {
    const mixing = this._inputBuffer.vector;
    mixingPosition += this._inputBuffer.startIndex;
    let correlation = 0;
    let i = 2;
    const calcLength = 2 * this.overlapLength;
    let mixingOffset;
    for (; i < calcLength; i = i + 2) {
      mixingOffset = i + mixingPosition;
      correlation += mixing[mixingOffset] * compare[i] + mixing[mixingOffset + 1] * compare[i + 1];
    }
    return correlation;
  }
  overlap(overlapPosition) {
    this.overlapStereo(2 * overlapPosition);
  }
  overlapStereo(inputPosition) {
    const input = this._inputBuffer.vector;
    inputPosition += this._inputBuffer.startIndex;
    const output = this._outputBuffer.vector;
    const outputPosition = this._outputBuffer.endIndex;
    let i = 0;
    let context;
    let tempFrame;
    const frameScale = 1 / this.overlapLength;
    let fi;
    let inputOffset;
    let outputOffset;
    for (; i < this.overlapLength; i = i + 1) {
      tempFrame = (this.overlapLength - i) * frameScale;
      fi = i * frameScale;
      context = 2 * i;
      inputOffset = context + inputPosition;
      outputOffset = context + outputPosition;
      output[outputOffset + 0] = input[inputOffset + 0] * fi + this.midBuffer[context + 0] * tempFrame;
      output[outputOffset + 1] = input[inputOffset + 1] * fi + this.midBuffer[context + 1] * tempFrame;
    }
  }
  process() {
    let offset;
    let temp;
    let overlapSkip;
    if (this.midBuffer === null) {
      if (this._inputBuffer.frameCount < this.overlapLength) {
        return;
      }
      this.midBuffer = new Float32Array(this.overlapLength * 2);
      this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength);
    }
    while (this._inputBuffer.frameCount >= this.sampleReq) {
      offset = this.seekBestOverlapPosition();
      this._outputBuffer.ensureAdditionalCapacity(this.overlapLength);
      this.overlap(Math.floor(offset));
      this._outputBuffer.put(this.overlapLength);
      temp = this.seekWindowLength - 2 * this.overlapLength;
      if (temp > 0) {
        this._outputBuffer.putBuffer(this._inputBuffer, offset + this.overlapLength, temp);
      }
      const start = this._inputBuffer.startIndex + 2 * (offset + this.seekWindowLength - this.overlapLength);
      this.midBuffer.set(this._inputBuffer.vector.subarray(start, start + 2 * this.overlapLength));
      this.skipFract += this.nominalSkip;
      overlapSkip = Math.floor(this.skipFract);
      this.skipFract -= overlapSkip;
      this._inputBuffer.receive(overlapSkip);
    }
  }
}

const testFloatEqual = function (a, b) {
  return (a > b ? a - b : b - a) > 1e-10;
};

class SoundTouch {
  constructor() {
    this.transposer = new RateTransposer(false);
    this.stretch = new Stretch(false);
    this._inputBuffer = new FifoSampleBuffer();
    this._intermediateBuffer = new FifoSampleBuffer();
    this._outputBuffer = new FifoSampleBuffer();
    this._rate = 0;
    this._tempo = 0;
    this.virtualPitch = 1.0;
    this.virtualRate = 1.0;
    this.virtualTempo = 1.0;
    this.calculateEffectiveRateAndTempo();
  }
  clear() {
    this.transposer.clear();
    this.stretch.clear();
  }
  clone() {
    const result = new SoundTouch();
    result.rate = this.rate;
    result.tempo = this.tempo;
    return result;
  }
  get rate() {
    return this._rate;
  }
  set rate(rate) {
    this.virtualRate = rate;
    this.calculateEffectiveRateAndTempo();
  }
  set rateChange(rateChange) {
    this._rate = 1.0 + 0.01 * rateChange;
  }
  get tempo() {
    return this._tempo;
  }
  set tempo(tempo) {
    this.virtualTempo = tempo;
    this.calculateEffectiveRateAndTempo();
  }
  set tempoChange(tempoChange) {
    this.tempo = 1.0 + 0.01 * tempoChange;
  }
  set pitch(pitch) {
    this.virtualPitch = pitch;
    this.calculateEffectiveRateAndTempo();
  }
  set pitchOctaves(pitchOctaves) {
    this.pitch = Math.exp(0.69314718056 * pitchOctaves);
    this.calculateEffectiveRateAndTempo();
  }
  set pitchSemitones(pitchSemitones) {
    this.pitchOctaves = pitchSemitones / 12.0;
  }
  get inputBuffer() {
    return this._inputBuffer;
  }
  get outputBuffer() {
    return this._outputBuffer;
  }
  calculateEffectiveRateAndTempo() {
    const previousTempo = this._tempo;
    const previousRate = this._rate;
    this._tempo = this.virtualTempo / this.virtualPitch;
    this._rate = this.virtualRate * this.virtualPitch;
    if (testFloatEqual(this._tempo, previousTempo)) {
      this.stretch.tempo = this._tempo;
    }
    if (testFloatEqual(this._rate, previousRate)) {
      this.transposer.rate = this._rate;
    }
    if (this._rate > 1.0) {
      if (this._outputBuffer != this.transposer.outputBuffer) {
        this.stretch.inputBuffer = this._inputBuffer;
        this.stretch.outputBuffer = this._intermediateBuffer;
        this.transposer.inputBuffer = this._intermediateBuffer;
        this.transposer.outputBuffer = this._outputBuffer;
      }
    } else {
      if (this._outputBuffer != this.stretch.outputBuffer) {
        this.transposer.inputBuffer = this._inputBuffer;
        this.transposer.outputBuffer = this._intermediateBuffer;
        this.stretch.inputBuffer = this._intermediateBuffer;
        this.stretch.outputBuffer = this._outputBuffer;
      }
    }
  }
  process() {
    if (this._rate > 1.0) {
      this.stretch.process();
      this.transposer.process();
    } else {
      this.transposer.process();
      this.stretch.process();
    }
  }
}

class WebAudioBufferSource {
  constructor(buffer) {
    this.buffer = buffer;
    this._position = 0;
  }
  get dualChannel() {
    return this.buffer.numberOfChannels > 1;
  }
  get position() {
    return this._position;
  }
  set position(value) {
    this._position = value;
  }
  extract(target, numFrames = 0, position = 0) {
    this.position = position;
    let left = this.buffer.getChannelData(0);
    let right = this.dualChannel ? this.buffer.getChannelData(1) : this.buffer.getChannelData(0);
    let i = 0;
    for (; i < numFrames; i++) {
      target[i * 2] = left[i + position];
      target[i * 2 + 1] = right[i + position];
    }
    return Math.min(numFrames, left.length - position);
  }
}

const getWebAudioNode = function (context, filter, sourcePositionCallback = noop, bufferSize = 4096) {
  const node = context.createScriptProcessor(bufferSize, 2, 2);
  const samples = new Float32Array(bufferSize * 2);
  node.onaudioprocess = event => {
    let left = event.outputBuffer.getChannelData(0);
    let right = event.outputBuffer.getChannelData(1);
    let framesExtracted = filter.extract(samples, bufferSize);
    sourcePositionCallback(filter.sourcePosition);
    if (framesExtracted === 0) {
      filter.onEnd();
    }
    let i = 0;
    for (; i < framesExtracted; i++) {
      left[i] = samples[i * 2];
      right[i] = samples[i * 2 + 1];
    }
  };
  return node;
};

const pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};
const minsSecs = function (secs) {
  const mins = Math.floor(secs / 60);
  const seconds = secs - mins * 60;
  return `${mins}:${pad(parseInt(seconds), 2)}`;
};

const onUpdate = function (sourcePosition) {
  const currentTimePlayed = this.timePlayed;
  const sampleRate = this.sampleRate;
  this.sourcePosition = sourcePosition;
  this.timePlayed = sourcePosition / sampleRate;
  if (currentTimePlayed !== this.timePlayed) {
    const timePlayed = new CustomEvent('play', {
      detail: {
        timePlayed: this.timePlayed,
        formattedTimePlayed: this.formattedTimePlayed,
        percentagePlayed: this.percentagePlayed
      }
    });
    this._node.dispatchEvent(timePlayed);
  }
};
class PitchShifter {
  constructor(context, buffer, bufferSize, onEnd = noop) {
    this._soundtouch = new SoundTouch();
    const source = new WebAudioBufferSource(buffer);
    this.timePlayed = 0;
    this.sourcePosition = 0;
    this._filter = new SimpleFilter(source, this._soundtouch, onEnd);
    this._node = getWebAudioNode(context, this._filter, sourcePostion => onUpdate.call(this, sourcePostion), bufferSize);
    this.tempo = 1;
    this.rate = 1;
    this.duration = buffer.duration;
    this.sampleRate = context.sampleRate;
    this.listeners = [];
  }
  get formattedDuration() {
    return minsSecs(this.duration);
  }
  get formattedTimePlayed() {
    return minsSecs(this.timePlayed);
  }
  get percentagePlayed() {
    return 100 * this._filter.sourcePosition / (this.duration * this.sampleRate);
  }
  set percentagePlayed(perc) {
    this._filter.sourcePosition = parseInt(perc * this.duration * this.sampleRate);
    this.sourcePosition = this._filter.sourcePosition;
    this.timePlayed = this.sourcePosition / this.sampleRate;
  }
  get node() {
    return this._node;
  }
  set pitch(pitch) {
    this._soundtouch.pitch = pitch;
  }
  set pitchSemitones(semitone) {
    this._soundtouch.pitchSemitones = semitone;
  }
  set rate(rate) {
    this._soundtouch.rate = rate;
  }
  set tempo(tempo) {
    this._soundtouch.tempo = tempo;
  }
  connect(toNode) {
    this._node.connect(toNode);
  }
  disconnect() {
    this._node.disconnect();
  }
  on(eventName, cb) {
    this.listeners.push({
      name: eventName,
      cb: cb
    });
    this._node.addEventListener(eventName, event => cb(event.detail));
  }
  off(eventName = null) {
    let listeners = this.listeners;
    if (eventName) {
      listeners = listeners.filter(e => e.name === eventName);
    }
    listeners.forEach(e => {
      this._node.removeEventListener(e.name, event => e.cb(event.detail));
    });
  }
}


//# sourceMappingURL=soundtouch.js.map

;// ./node_modules/chaimu/dist/debug.js

/* harmony default export */ const debug = ({
    log: (...text) => {
        if (!config.debug) {
            return;
        }
        return console.log(`%c✦ chaimu.js v${config.version} ✦`, "background: #000; color: #fff; padding: 0 8px", ...text);
    },
});

;// ./node_modules/chaimu/dist/player.js


const videoLipSyncEvents = [
    "playing",
    "ratechange",
    "play",
    "waiting",
    "pause",
    "seeked",
];
function initAudioContext() {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    return audioContext ? new audioContext() : undefined;
}
class BasePlayer {
    static name = "BasePlayer";
    chaimu;
    fetch;
    _src;
    fetchOpts;
    constructor(chaimu, src) {
        this.chaimu = chaimu;
        this._src = src;
        this.fetch = this.chaimu.fetchFn;
        this.fetchOpts = this.chaimu.fetchOpts;
    }
    async init() {
        return new Promise((resolve) => {
            return resolve(this);
        });
    }
    clear() {
        return new Promise((resolve) => {
            return resolve(this);
        });
    }
    lipSync(mode = false) {
        return this;
    }
    handleVideoEvent = (event) => {
        debug.log(`handle video ${event.type}`);
        this.lipSync(event.type);
        return this;
    };
    removeVideoEvents() {
        for (const e of videoLipSyncEvents) {
            this.chaimu.video.removeEventListener(e, this.handleVideoEvent);
        }
        return this;
    }
    addVideoEvents() {
        for (const e of videoLipSyncEvents) {
            this.chaimu.video.addEventListener(e, this.handleVideoEvent);
        }
        return this;
    }
    async play() {
        return new Promise((resolve) => {
            return resolve(this);
        });
    }
    async pause() {
        return new Promise((resolve) => {
            return resolve(this);
        });
    }
    get name() {
        return this.constructor.name;
    }
    set src(url) {
        this._src = url;
    }
    get src() {
        return this._src;
    }
    get currentSrc() {
        return this._src;
    }
    set volume(value) {
        return;
    }
    get volume() {
        return 0;
    }
    get playbackRate() {
        return 0;
    }
    set playbackRate(value) {
        return;
    }
    get currentTime() {
        return 0;
    }
}
class AudioPlayer extends BasePlayer {
    static name = "AudioPlayer";
    audio;
    gainNode;
    audioSource;
    constructor(chaimu, src) {
        super(chaimu, src);
        this.updateAudio();
    }
    initAudioBooster() {
        if (!this.chaimu.audioContext) {
            return this;
        }
        if (this.gainNode && this.audioSource) {
            this.audioSource.disconnect(this.gainNode);
            this.gainNode.disconnect();
        }
        this.gainNode = this.chaimu.audioContext.createGain();
        this.gainNode.connect(this.chaimu.audioContext.destination);
        this.audioSource = this.chaimu.audioContext.createMediaElementSource(this.audio);
        this.audioSource.connect(this.gainNode);
        return this;
    }
    updateAudio() {
        this.audio = new Audio(this.src);
        this.audio.crossOrigin = "anonymous";
        return this;
    }
    async init() {
        return new Promise((resolve) => {
            this.updateAudio();
            this.initAudioBooster();
            return resolve(this);
        });
    }
    audioErrorHandle = (e) => {
        console.error("[AudioPlayer]", e);
    };
    lipSync(mode = false) {
        debug.log("[AudioPlayer] lipsync video", this.chaimu.video);
        if (!this.chaimu.video) {
            return this;
        }
        this.audio.currentTime = this.chaimu.video.currentTime;
        this.audio.playbackRate = this.chaimu.video.playbackRate;
        if (!mode) {
            debug.log("[AudioPlayer] lipsync mode isn't set");
            return this;
        }
        debug.log(`[AudioPlayer] lipsync mode is ${mode}`);
        switch (mode) {
            case "play":
            case "playing":
            case "seeked": {
                if (!this.chaimu.video.paused) {
                    this.syncPlay();
                }
                return this;
            }
            case "pause":
            case "waiting": {
                void this.pause();
                return this;
            }
            default: {
                return this;
            }
        }
    }
    async clear() {
        return new Promise((resolve) => {
            this.audio.pause();
            this.audio.src = "";
            this.audio.removeAttribute("src");
            return resolve(this);
        });
    }
    syncPlay() {
        debug.log("[AudioPlayer] sync play called");
        this.audio.play().catch(this.audioErrorHandle);
        return this;
    }
    async play() {
        debug.log("[AudioPlayer] play called");
        await this.audio.play().catch(this.audioErrorHandle);
        return this;
    }
    async pause() {
        return new Promise((resolve) => {
            debug.log("[AudioPlayer] pause called");
            this.audio.pause();
            return resolve(this);
        });
    }
    set src(url) {
        this._src = url;
        if (!url) {
            void this.clear();
            return;
        }
        this.audio.src = url;
    }
    get src() {
        return this._src;
    }
    get currentSrc() {
        return this.audio.currentSrc;
    }
    set volume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
            return;
        }
        this.audio.volume = value;
    }
    get volume() {
        return this.gainNode ? this.gainNode.gain.value : this.audio.volume;
    }
    get playbackRate() {
        return this.audio.playbackRate;
    }
    set playbackRate(value) {
        this.audio.playbackRate = value;
    }
    get currentTime() {
        return this.audio.currentTime;
    }
}
class ChaimuPlayer extends BasePlayer {
    static name = "ChaimuPlayer";
    audioBuffer;
    sourceNode;
    gainNode;
    audioShifter;
    cleanerRunned = false;
    async fetchAudio() {
        if (!this._src) {
            throw new Error("No audio source provided");
        }
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        debug.log(`[ChaimuPlayer] Fetching audio from ${this._src}...`);
        try {
            const res = await this.fetch(this._src, this.fetchOpts);
            debug.log(`[ChaimuPlayer] Decoding fetched audio...`);
            const data = await res.arrayBuffer();
            this.audioBuffer = await this.chaimu.audioContext.decodeAudioData(data);
        }
        catch (err) {
            throw new Error(`Failed to fetch audio file, because ${err.message}`);
        }
        return this;
    }
    initAudioBooster() {
        if (!this.chaimu.audioContext) {
            return this;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        this.gainNode = this.chaimu.audioContext.createGain();
        return this;
    }
    async init() {
        await this.fetchAudio();
        this.initAudioBooster();
        return this;
    }
    lipSync(mode = false) {
        debug.log("[ChaimuPlayer] lipsync video", this.chaimu.video, this);
        if (!this.chaimu.video) {
            return this;
        }
        if (!mode) {
            debug.log("[ChaimuPlayer] lipsync mode isn't set");
            return this;
        }
        debug.log(`[ChaimuPlayer] lipsync mode is ${mode}`);
        switch (mode) {
            case "play":
            case "playing":
            case "ratechange":
            case "seeked": {
                if (!this.chaimu.video.paused) {
                    void this.start();
                }
                return this;
            }
            case "pause":
            case "waiting": {
                void this.pause();
                return this;
            }
            default: {
                return this;
            }
        }
    }
    async reopenCtx() {
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        try {
            await this.chaimu.audioContext.close();
        }
        catch {
        }
        return this;
    }
    async clear() {
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        debug.log("clear audio context");
        this.cleanerRunned = true;
        await this.pause();
        if (!this.gainNode) {
            this.cleanerRunned = false;
            return this;
        }
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect(this.gainNode);
            this.sourceNode = undefined;
        }
        if (this.audioShifter) {
            this.audioShifter._node.disconnect(this.gainNode);
            this.audioShifter = undefined;
        }
        this.gainNode.disconnect();
        const oldVolume = this.volume;
        this.gainNode = undefined;
        await this.reopenCtx();
        this.chaimu.audioContext = initAudioContext();
        this.initAudioBooster();
        this.volume = oldVolume;
        this.cleanerRunned = false;
        return this;
    }
    async start() {
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        if (!this.audioBuffer) {
            throw new Error("The player isn't initialized");
        }
        if (!this.gainNode ||
            (this.audioShifter && this.audioShifter.duration < this.chaimu.video.currentTime)) {
            debug.log("Skip starting player");
            return this;
        }
        if (this.cleanerRunned) {
            debug.log("The other cleaner is still running, waiting...");
            return this;
        }
        debug.log("starting audio");
        await this.clear();
        await this.play();
        this.audioShifter = new PitchShifter(this.chaimu.audioContext, this.audioBuffer, 1024);
        this.audioShifter.tempo = this.chaimu.video.playbackRate;
        this.audioShifter.percentagePlayed = this.chaimu.video.currentTime / this.audioShifter.duration;
        this.sourceNode = this.chaimu.audioContext.createBufferSource();
        this.sourceNode.buffer = null;
        this.sourceNode.connect(this.gainNode);
        this.audioShifter.connect(this.gainNode);
        this.gainNode.connect(this.chaimu.audioContext.destination);
        this.sourceNode.start(undefined, this.chaimu.video.currentTime);
        return this;
    }
    async pause() {
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        if (this.chaimu.audioContext.state !== "running") {
            return this;
        }
        await this.chaimu.audioContext.suspend();
        return this;
    }
    async play() {
        if (!this.chaimu.audioContext) {
            throw new Error("No audio context available");
        }
        await this.chaimu.audioContext.resume();
        return this;
    }
    set src(url) {
        this._src = url;
    }
    get src() {
        return this._src;
    }
    get currentSrc() {
        return this._src;
    }
    set volume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }
    get volume() {
        return this.gainNode ? this.gainNode.gain.value : 0;
    }
    set playbackRate(value) {
        if (!this.audioShifter) {
            throw new Error("No audio source available");
        }
        this.audioShifter.pitch = value;
    }
    get playbackRate() {
        return this.audioShifter?._soundtouch?.tempo ?? 0;
    }
    get currentTime() {
        return this.chaimu.video.currentTime;
    }
}

;// ./node_modules/chaimu/dist/client.js


class Chaimu {
    _debug = false;
    audioContext;
    player;
    video;
    fetchFn;
    fetchOpts;
    constructor({ url, video, debug = false, fetchFn = config.fetchFn, fetchOpts = {}, preferAudio = false, }) {
        this._debug = config.debug = debug;
        this.fetchFn = fetchFn;
        this.fetchOpts = fetchOpts;
        this.audioContext = initAudioContext();
        this.player =
            this.audioContext && !preferAudio ? new ChaimuPlayer(this, url) : new AudioPlayer(this, url);
        this.video = video;
    }
    async init() {
        await this.player.init();
        if (this.video && !this.video.paused) {
            this.player.lipSync("play");
        }
        this.player.addVideoEvents();
    }
    set debug(value) {
        this._debug = config.debug = value;
    }
    get debug() {
        return this._debug;
    }
}

;// ./node_modules/chaimu/dist/index.js






;// ./node_modules/@vot.js/shared/dist/data/config.js
/* harmony default export */ const data_config = ({
    host: "api.browser.yandex.ru",
    hostVOT: "vot.toil.cc/v1",
    hostWorker: "vot-worker.toil.cc",
    mediaProxy: "media-proxy.toil.cc",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 YaBrowser/25.4.0.0 Safari/537.36",
    componentVersion: "25.4.0.1746",
    hmac: "bt8xH3VOlb4mqf0nqAibnDOoiPlXsisf",
    defaultDuration: 343,
    minChunkSize: 5295308,
    loggerLevel: 1,
    version: "2.4.2",
});

;// ./node_modules/@vot.js/shared/dist/types/logger.js
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel[LoggerLevel["DEBUG"] = 0] = "DEBUG";
    LoggerLevel[LoggerLevel["INFO"] = 1] = "INFO";
    LoggerLevel[LoggerLevel["WARN"] = 2] = "WARN";
    LoggerLevel[LoggerLevel["ERROR"] = 3] = "ERROR";
    LoggerLevel[LoggerLevel["SILENCE"] = 4] = "SILENCE";
})(LoggerLevel || (LoggerLevel = {}));

;// ./node_modules/@vot.js/shared/dist/utils/logger.js


class Logger {
    static prefix = `[vot.js v${data_config.version}]`;
    static canLog(level) {
        return data_config.loggerLevel <= level;
    }
    static log(...messages) {
        if (!Logger.canLog(LoggerLevel.DEBUG)) {
            return;
        }
        console.log(Logger.prefix, ...messages);
    }
    static info(...messages) {
        if (!Logger.canLog(LoggerLevel.INFO)) {
            return;
        }
        console.info(Logger.prefix, ...messages);
    }
    static warn(...messages) {
        if (!Logger.canLog(LoggerLevel.WARN)) {
            return;
        }
        console.warn(Logger.prefix, ...messages);
    }
    static error(...messages) {
        if (!Logger.canLog(LoggerLevel.ERROR)) {
            return;
        }
        console.error(Logger.prefix, ...messages);
    }
}

;// ./node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
// Copyright 2008 Google Inc.  All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
// * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
// * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Code generated by the Protocol Buffer compiler is owned by the owner
// of the input file used when generating it.  This code is not
// standalone and requires a support library to be linked with it.  This
// support library is itself covered by the above license.
/* eslint-disable prefer-const,@typescript-eslint/restrict-plus-operands */
/**
 * Read a 64 bit varint as two JS numbers.
 *
 * Returns tuple:
 * [0]: low bits
 * [1]: high bits
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L175
 */
function varint64read() {
    let lowBits = 0;
    let highBits = 0;
    for (let shift = 0; shift < 28; shift += 7) {
        let b = this.buf[this.pos++];
        lowBits |= (b & 0x7f) << shift;
        if ((b & 0x80) == 0) {
            this.assertBounds();
            return [lowBits, highBits];
        }
    }
    let middleByte = this.buf[this.pos++];
    // last four bits of the first 32 bit number
    lowBits |= (middleByte & 0x0f) << 28;
    // 3 upper bits are part of the next 32 bit number
    highBits = (middleByte & 0x70) >> 4;
    if ((middleByte & 0x80) == 0) {
        this.assertBounds();
        return [lowBits, highBits];
    }
    for (let shift = 3; shift <= 31; shift += 7) {
        let b = this.buf[this.pos++];
        highBits |= (b & 0x7f) << shift;
        if ((b & 0x80) == 0) {
            this.assertBounds();
            return [lowBits, highBits];
        }
    }
    throw new Error("invalid varint");
}
/**
 * Write a 64 bit varint, given as two JS numbers, to the given bytes array.
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/writer.js#L344
 */
function varint64write(lo, hi, bytes) {
    for (let i = 0; i < 28; i = i + 7) {
        const shift = lo >>> i;
        const hasNext = !(shift >>> 7 == 0 && hi == 0);
        const byte = (hasNext ? shift | 0x80 : shift) & 0xff;
        bytes.push(byte);
        if (!hasNext) {
            return;
        }
    }
    const splitBits = ((lo >>> 28) & 0x0f) | ((hi & 0x07) << 4);
    const hasMoreBits = !(hi >> 3 == 0);
    bytes.push((hasMoreBits ? splitBits | 0x80 : splitBits) & 0xff);
    if (!hasMoreBits) {
        return;
    }
    for (let i = 3; i < 31; i = i + 7) {
        const shift = hi >>> i;
        const hasNext = !(shift >>> 7 == 0);
        const byte = (hasNext ? shift | 0x80 : shift) & 0xff;
        bytes.push(byte);
        if (!hasNext) {
            return;
        }
    }
    bytes.push((hi >>> 31) & 0x01);
}
// constants for binary math
const TWO_PWR_32_DBL = 0x100000000;
/**
 * Parse decimal string of 64 bit integer value as two JS numbers.
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
 */
function int64FromString(dec) {
    // Check for minus sign.
    const minus = dec[0] === "-";
    if (minus) {
        dec = dec.slice(1);
    }
    // Work 6 decimal digits at a time, acting like we're converting base 1e6
    // digits to binary. This is safe to do with floating point math because
    // Number.isSafeInteger(ALL_32_BITS * 1e6) == true.
    const base = 1e6;
    let lowBits = 0;
    let highBits = 0;
    function add1e6digit(begin, end) {
        // Note: Number('') is 0.
        const digit1e6 = Number(dec.slice(begin, end));
        highBits *= base;
        lowBits = lowBits * base + digit1e6;
        // Carry bits from lowBits to
        if (lowBits >= TWO_PWR_32_DBL) {
            highBits = highBits + ((lowBits / TWO_PWR_32_DBL) | 0);
            lowBits = lowBits % TWO_PWR_32_DBL;
        }
    }
    add1e6digit(-24, -18);
    add1e6digit(-18, -12);
    add1e6digit(-12, -6);
    add1e6digit(-6);
    return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
/**
 * Losslessly converts a 64-bit signed integer in 32:32 split representation
 * into a decimal string.
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
 */
function int64ToString(lo, hi) {
    let bits = newBits(lo, hi);
    // If we're treating the input as a signed value and the high bit is set, do
    // a manual two's complement conversion before the decimal conversion.
    const negative = bits.hi & 0x80000000;
    if (negative) {
        bits = negate(bits.lo, bits.hi);
    }
    const result = uInt64ToString(bits.lo, bits.hi);
    return negative ? "-" + result : result;
}
/**
 * Losslessly converts a 64-bit unsigned integer in 32:32 split representation
 * into a decimal string.
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
 */
function uInt64ToString(lo, hi) {
    ({ lo, hi } = toUnsigned(lo, hi));
    // Skip the expensive conversion if the number is small enough to use the
    // built-in conversions.
    // Number.MAX_SAFE_INTEGER = 0x001FFFFF FFFFFFFF, thus any number with
    // highBits <= 0x1FFFFF can be safely expressed with a double and retain
    // integer precision.
    // Proven by: Number.isSafeInteger(0x1FFFFF * 2**32 + 0xFFFFFFFF) == true.
    if (hi <= 0x1fffff) {
        return String(TWO_PWR_32_DBL * hi + lo);
    }
    // What this code is doing is essentially converting the input number from
    // base-2 to base-1e7, which allows us to represent the 64-bit range with
    // only 3 (very large) digits. Those digits are then trivial to convert to
    // a base-10 string.
    // The magic numbers used here are -
    // 2^24 = 16777216 = (1,6777216) in base-1e7.
    // 2^48 = 281474976710656 = (2,8147497,6710656) in base-1e7.
    // Split 32:32 representation into 16:24:24 representation so our
    // intermediate digits don't overflow.
    const low = lo & 0xffffff;
    const mid = ((lo >>> 24) | (hi << 8)) & 0xffffff;
    const high = (hi >> 16) & 0xffff;
    // Assemble our three base-1e7 digits, ignoring carries. The maximum
    // value in a digit at this step is representable as a 48-bit integer, which
    // can be stored in a 64-bit floating point number.
    let digitA = low + mid * 6777216 + high * 6710656;
    let digitB = mid + high * 8147497;
    let digitC = high * 2;
    // Apply carries from A to B and from B to C.
    const base = 10000000;
    if (digitA >= base) {
        digitB += Math.floor(digitA / base);
        digitA %= base;
    }
    if (digitB >= base) {
        digitC += Math.floor(digitB / base);
        digitB %= base;
    }
    // If digitC is 0, then we should have returned in the trivial code path
    // at the top for non-safe integers. Given this, we can assume both digitB
    // and digitA need leading zeros.
    return (digitC.toString() +
        decimalFrom1e7WithLeadingZeros(digitB) +
        decimalFrom1e7WithLeadingZeros(digitA));
}
function toUnsigned(lo, hi) {
    return { lo: lo >>> 0, hi: hi >>> 0 };
}
function newBits(lo, hi) {
    return { lo: lo | 0, hi: hi | 0 };
}
/**
 * Returns two's compliment negation of input.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Signed_32-bit_integers
 */
function negate(lowBits, highBits) {
    highBits = ~highBits;
    if (lowBits) {
        lowBits = ~lowBits + 1;
    }
    else {
        // If lowBits is 0, then bitwise-not is 0xFFFFFFFF,
        // adding 1 to that, results in 0x100000000, which leaves
        // the low bits 0x0 and simply adds one to the high bits.
        highBits += 1;
    }
    return newBits(lowBits, highBits);
}
/**
 * Returns decimal representation of digit1e7 with leading zeros.
 */
const decimalFrom1e7WithLeadingZeros = (digit1e7) => {
    const partial = String(digit1e7);
    return "0000000".slice(partial.length) + partial;
};
/**
 * Write a 32 bit varint, signed or unsigned. Same as `varint64write(0, value, bytes)`
 *
 * Copyright 2008 Google Inc.  All rights reserved.
 *
 * See https://github.com/protocolbuffers/protobuf/blob/1b18833f4f2a2f681f4e4a25cdf3b0a43115ec26/js/binary/encoder.js#L144
 */
function varint32write(value, bytes) {
    if (value >= 0) {
        // write value as varint 32
        while (value > 0x7f) {
            bytes.push((value & 0x7f) | 0x80);
            value = value >>> 7;
        }
        bytes.push(value);
    }
    else {
        for (let i = 0; i < 9; i++) {
            bytes.push((value & 127) | 128);
            value = value >> 7;
        }
        bytes.push(1);
    }
}
/**
 * Read an unsigned 32 bit varint.
 *
 * See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L220
 */
function varint32read() {
    let b = this.buf[this.pos++];
    let result = b & 0x7f;
    if ((b & 0x80) == 0) {
        this.assertBounds();
        return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 7;
    if ((b & 0x80) == 0) {
        this.assertBounds();
        return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 14;
    if ((b & 0x80) == 0) {
        this.assertBounds();
        return result;
    }
    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 21;
    if ((b & 0x80) == 0) {
        this.assertBounds();
        return result;
    }
    // Extract only last 4 bits
    b = this.buf[this.pos++];
    result |= (b & 0x0f) << 28;
    for (let readBytes = 5; (b & 0x80) !== 0 && readBytes < 10; readBytes++)
        b = this.buf[this.pos++];
    if ((b & 0x80) != 0)
        throw new Error("invalid varint");
    this.assertBounds();
    // Result can have 32 bits, convert it to unsigned
    return result >>> 0;
}

;// ./node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
// Copyright 2021-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Int64Support for the current environment.
 */
const protoInt64 = /*@__PURE__*/ makeInt64Support();
function makeInt64Support() {
    const dv = new DataView(new ArrayBuffer(8));
    // note that Safari 14 implements BigInt, but not the DataView methods
    const ok = typeof BigInt === "function" &&
        typeof dv.getBigInt64 === "function" &&
        typeof dv.getBigUint64 === "function" &&
        typeof dv.setBigInt64 === "function" &&
        typeof dv.setBigUint64 === "function" &&
        (typeof process != "object" ||
            typeof process.env != "object" ||
            process.env.BUF_BIGINT_DISABLE !== "1");
    if (ok) {
        const MIN = BigInt("-9223372036854775808"), MAX = BigInt("9223372036854775807"), UMIN = BigInt("0"), UMAX = BigInt("18446744073709551615");
        return {
            zero: BigInt(0),
            supported: true,
            parse(value) {
                const bi = typeof value == "bigint" ? value : BigInt(value);
                if (bi > MAX || bi < MIN) {
                    throw new Error(`invalid int64: ${value}`);
                }
                return bi;
            },
            uParse(value) {
                const bi = typeof value == "bigint" ? value : BigInt(value);
                if (bi > UMAX || bi < UMIN) {
                    throw new Error(`invalid uint64: ${value}`);
                }
                return bi;
            },
            enc(value) {
                dv.setBigInt64(0, this.parse(value), true);
                return {
                    lo: dv.getInt32(0, true),
                    hi: dv.getInt32(4, true),
                };
            },
            uEnc(value) {
                dv.setBigInt64(0, this.uParse(value), true);
                return {
                    lo: dv.getInt32(0, true),
                    hi: dv.getInt32(4, true),
                };
            },
            dec(lo, hi) {
                dv.setInt32(0, lo, true);
                dv.setInt32(4, hi, true);
                return dv.getBigInt64(0, true);
            },
            uDec(lo, hi) {
                dv.setInt32(0, lo, true);
                dv.setInt32(4, hi, true);
                return dv.getBigUint64(0, true);
            },
        };
    }
    return {
        zero: "0",
        supported: false,
        parse(value) {
            if (typeof value != "string") {
                value = value.toString();
            }
            assertInt64String(value);
            return value;
        },
        uParse(value) {
            if (typeof value != "string") {
                value = value.toString();
            }
            assertUInt64String(value);
            return value;
        },
        enc(value) {
            if (typeof value != "string") {
                value = value.toString();
            }
            assertInt64String(value);
            return int64FromString(value);
        },
        uEnc(value) {
            if (typeof value != "string") {
                value = value.toString();
            }
            assertUInt64String(value);
            return int64FromString(value);
        },
        dec(lo, hi) {
            return int64ToString(lo, hi);
        },
        uDec(lo, hi) {
            return uInt64ToString(lo, hi);
        },
    };
}
function assertInt64String(value) {
    if (!/^-?[0-9]+$/.test(value)) {
        throw new Error("invalid int64: " + value);
    }
}
function assertUInt64String(value) {
    if (!/^[0-9]+$/.test(value)) {
        throw new Error("invalid uint64: " + value);
    }
}

;// ./node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
// Copyright 2021-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
const symbol = Symbol.for("@bufbuild/protobuf/text-encoding");
/**
 * Protobuf-ES requires the Text Encoding API to convert UTF-8 from and to
 * binary. This WHATWG API is widely available, but it is not part of the
 * ECMAScript standard. On runtimes where it is not available, use this
 * function to provide your own implementation.
 *
 * Note that the Text Encoding API does not provide a way to validate UTF-8.
 * Our implementation falls back to use encodeURIComponent().
 */
function configureTextEncoding(textEncoding) {
    globalThis[symbol] = textEncoding;
}
function getTextEncoding() {
    if (globalThis[symbol] == undefined) {
        const te = new globalThis.TextEncoder();
        const td = new globalThis.TextDecoder();
        globalThis[symbol] = {
            encodeUtf8(text) {
                return te.encode(text);
            },
            decodeUtf8(bytes) {
                return td.decode(bytes);
            },
            checkUtf8(text) {
                try {
                    encodeURIComponent(text);
                    return true;
                }
                catch (e) {
                    return false;
                }
            },
        };
    }
    return globalThis[symbol];
}

;// ./node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
// Copyright 2021-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



/* eslint-disable prefer-const,no-case-declarations,@typescript-eslint/restrict-plus-operands */
/**
 * Protobuf binary format wire types.
 *
 * A wire type provides just enough information to find the length of the
 * following value.
 *
 * See https://developers.google.com/protocol-buffers/docs/encoding#structure
 */
var WireType;
(function (WireType) {
    /**
     * Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
     */
    WireType[WireType["Varint"] = 0] = "Varint";
    /**
     * Used for fixed64, sfixed64, double.
     * Always 8 bytes with little-endian byte order.
     */
    WireType[WireType["Bit64"] = 1] = "Bit64";
    /**
     * Used for string, bytes, embedded messages, packed repeated fields
     *
     * Only repeated numeric types (types which use the varint, 32-bit,
     * or 64-bit wire types) can be packed. In proto3, such fields are
     * packed by default.
     */
    WireType[WireType["LengthDelimited"] = 2] = "LengthDelimited";
    /**
     * Start of a tag-delimited aggregate, such as a proto2 group, or a message
     * in editions with message_encoding = DELIMITED.
     */
    WireType[WireType["StartGroup"] = 3] = "StartGroup";
    /**
     * End of a tag-delimited aggregate.
     */
    WireType[WireType["EndGroup"] = 4] = "EndGroup";
    /**
     * Used for fixed32, sfixed32, float.
     * Always 4 bytes with little-endian byte order.
     */
    WireType[WireType["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
/**
 * Maximum value for a 32-bit floating point value (Protobuf FLOAT).
 */
const FLOAT32_MAX = 3.4028234663852886e38;
/**
 * Minimum value for a 32-bit floating point value (Protobuf FLOAT).
 */
const FLOAT32_MIN = -3.4028234663852886e38;
/**
 * Maximum value for an unsigned 32-bit integer (Protobuf UINT32, FIXED32).
 */
const UINT32_MAX = 0xffffffff;
/**
 * Maximum value for a signed 32-bit integer (Protobuf INT32, SFIXED32, SINT32).
 */
const INT32_MAX = 0x7fffffff;
/**
 * Minimum value for a signed 32-bit integer (Protobuf INT32, SFIXED32, SINT32).
 */
const INT32_MIN = -0x80000000;
class BinaryWriter {
    constructor(encodeUtf8 = getTextEncoding().encodeUtf8) {
        this.encodeUtf8 = encodeUtf8;
        /**
         * Previous fork states.
         */
        this.stack = [];
        this.chunks = [];
        this.buf = [];
    }
    /**
     * Return all bytes written and reset this writer.
     */
    finish() {
        if (this.buf.length) {
            this.chunks.push(new Uint8Array(this.buf)); // flush the buffer
            this.buf = [];
        }
        let len = 0;
        for (let i = 0; i < this.chunks.length; i++)
            len += this.chunks[i].length;
        let bytes = new Uint8Array(len);
        let offset = 0;
        for (let i = 0; i < this.chunks.length; i++) {
            bytes.set(this.chunks[i], offset);
            offset += this.chunks[i].length;
        }
        this.chunks = [];
        return bytes;
    }
    /**
     * Start a new fork for length-delimited data like a message
     * or a packed repeated field.
     *
     * Must be joined later with `join()`.
     */
    fork() {
        this.stack.push({ chunks: this.chunks, buf: this.buf });
        this.chunks = [];
        this.buf = [];
        return this;
    }
    /**
     * Join the last fork. Write its length and bytes, then
     * return to the previous state.
     */
    join() {
        // get chunk of fork
        let chunk = this.finish();
        // restore previous state
        let prev = this.stack.pop();
        if (!prev)
            throw new Error("invalid state, fork stack empty");
        this.chunks = prev.chunks;
        this.buf = prev.buf;
        // write length of chunk as varint
        this.uint32(chunk.byteLength);
        return this.raw(chunk);
    }
    /**
     * Writes a tag (field number and wire type).
     *
     * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
     *
     * Generated code should compute the tag ahead of time and call `uint32()`.
     */
    tag(fieldNo, type) {
        return this.uint32(((fieldNo << 3) | type) >>> 0);
    }
    /**
     * Write a chunk of raw bytes.
     */
    raw(chunk) {
        if (this.buf.length) {
            this.chunks.push(new Uint8Array(this.buf));
            this.buf = [];
        }
        this.chunks.push(chunk);
        return this;
    }
    /**
     * Write a `uint32` value, an unsigned 32 bit varint.
     */
    uint32(value) {
        assertUInt32(value);
        // write value as varint 32, inlined for speed
        while (value > 0x7f) {
            this.buf.push((value & 0x7f) | 0x80);
            value = value >>> 7;
        }
        this.buf.push(value);
        return this;
    }
    /**
     * Write a `int32` value, a signed 32 bit varint.
     */
    int32(value) {
        assertInt32(value);
        varint32write(value, this.buf);
        return this;
    }
    /**
     * Write a `bool` value, a variant.
     */
    bool(value) {
        this.buf.push(value ? 1 : 0);
        return this;
    }
    /**
     * Write a `bytes` value, length-delimited arbitrary data.
     */
    bytes(value) {
        this.uint32(value.byteLength); // write length of chunk as varint
        return this.raw(value);
    }
    /**
     * Write a `string` value, length-delimited data converted to UTF-8 text.
     */
    string(value) {
        let chunk = this.encodeUtf8(value);
        this.uint32(chunk.byteLength); // write length of chunk as varint
        return this.raw(chunk);
    }
    /**
     * Write a `float` value, 32-bit floating point number.
     */
    float(value) {
        assertFloat32(value);
        let chunk = new Uint8Array(4);
        new DataView(chunk.buffer).setFloat32(0, value, true);
        return this.raw(chunk);
    }
    /**
     * Write a `double` value, a 64-bit floating point number.
     */
    double(value) {
        let chunk = new Uint8Array(8);
        new DataView(chunk.buffer).setFloat64(0, value, true);
        return this.raw(chunk);
    }
    /**
     * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
     */
    fixed32(value) {
        assertUInt32(value);
        let chunk = new Uint8Array(4);
        new DataView(chunk.buffer).setUint32(0, value, true);
        return this.raw(chunk);
    }
    /**
     * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
     */
    sfixed32(value) {
        assertInt32(value);
        let chunk = new Uint8Array(4);
        new DataView(chunk.buffer).setInt32(0, value, true);
        return this.raw(chunk);
    }
    /**
     * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
     */
    sint32(value) {
        assertInt32(value);
        // zigzag encode
        value = ((value << 1) ^ (value >> 31)) >>> 0;
        varint32write(value, this.buf);
        return this;
    }
    /**
     * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
     */
    sfixed64(value) {
        let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.enc(value);
        view.setInt32(0, tc.lo, true);
        view.setInt32(4, tc.hi, true);
        return this.raw(chunk);
    }
    /**
     * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
     */
    fixed64(value) {
        let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.uEnc(value);
        view.setInt32(0, tc.lo, true);
        view.setInt32(4, tc.hi, true);
        return this.raw(chunk);
    }
    /**
     * Write a `int64` value, a signed 64-bit varint.
     */
    int64(value) {
        let tc = protoInt64.enc(value);
        varint64write(tc.lo, tc.hi, this.buf);
        return this;
    }
    /**
     * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
     */
    sint64(value) {
        let tc = protoInt64.enc(value), 
        // zigzag encode
        sign = tc.hi >> 31, lo = (tc.lo << 1) ^ sign, hi = ((tc.hi << 1) | (tc.lo >>> 31)) ^ sign;
        varint64write(lo, hi, this.buf);
        return this;
    }
    /**
     * Write a `uint64` value, an unsigned 64-bit varint.
     */
    uint64(value) {
        let tc = protoInt64.uEnc(value);
        varint64write(tc.lo, tc.hi, this.buf);
        return this;
    }
}
class BinaryReader {
    constructor(buf, decodeUtf8 = getTextEncoding().decodeUtf8) {
        this.decodeUtf8 = decodeUtf8;
        this.varint64 = varint64read; // dirty cast for `this`
        /**
         * Read a `uint32` field, an unsigned 32 bit varint.
         */
        this.uint32 = varint32read;
        this.buf = buf;
        this.len = buf.length;
        this.pos = 0;
        this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    /**
     * Reads a tag - field number and wire type.
     */
    tag() {
        let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
        if (fieldNo <= 0 || wireType < 0 || wireType > 5)
            throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
        return [fieldNo, wireType];
    }
    /**
     * Skip one element and return the skipped data.
     *
     * When skipping StartGroup, provide the tags field number to check for
     * matching field number in the EndGroup tag.
     */
    skip(wireType, fieldNo) {
        let start = this.pos;
        switch (wireType) {
            case WireType.Varint:
                while (this.buf[this.pos++] & 0x80) {
                    // ignore
                }
                break;
            // eslint-disable-next-line
            // @ts-expect-error TS7029: Fallthrough case in switch
            case WireType.Bit64:
                this.pos += 4;
            // eslint-disable-next-line no-fallthrough
            case WireType.Bit32:
                this.pos += 4;
                break;
            case WireType.LengthDelimited:
                let len = this.uint32();
                this.pos += len;
                break;
            case WireType.StartGroup:
                for (;;) {
                    const [fn, wt] = this.tag();
                    if (wt === WireType.EndGroup) {
                        if (fieldNo !== undefined && fn !== fieldNo) {
                            throw new Error("invalid end group tag");
                        }
                        break;
                    }
                    this.skip(wt, fn);
                }
                break;
            default:
                throw new Error("cant skip wire type " + wireType);
        }
        this.assertBounds();
        return this.buf.subarray(start, this.pos);
    }
    /**
     * Throws error if position in byte array is out of range.
     */
    assertBounds() {
        if (this.pos > this.len)
            throw new RangeError("premature EOF");
    }
    /**
     * Read a `int32` field, a signed 32 bit varint.
     */
    int32() {
        return this.uint32() | 0;
    }
    /**
     * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
     */
    sint32() {
        let zze = this.uint32();
        // decode zigzag
        return (zze >>> 1) ^ -(zze & 1);
    }
    /**
     * Read a `int64` field, a signed 64-bit varint.
     */
    int64() {
        return protoInt64.dec(...this.varint64());
    }
    /**
     * Read a `uint64` field, an unsigned 64-bit varint.
     */
    uint64() {
        return protoInt64.uDec(...this.varint64());
    }
    /**
     * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
     */
    sint64() {
        let [lo, hi] = this.varint64();
        // decode zig zag
        let s = -(lo & 1);
        lo = ((lo >>> 1) | ((hi & 1) << 31)) ^ s;
        hi = (hi >>> 1) ^ s;
        return protoInt64.dec(lo, hi);
    }
    /**
     * Read a `bool` field, a variant.
     */
    bool() {
        let [lo, hi] = this.varint64();
        return lo !== 0 || hi !== 0;
    }
    /**
     * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
     */
    fixed32() {
        return this.view.getUint32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
     */
    sfixed32() {
        return this.view.getInt32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
     */
    fixed64() {
        return protoInt64.uDec(this.sfixed32(), this.sfixed32());
    }
    /**
     * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
     */
    sfixed64() {
        return protoInt64.dec(this.sfixed32(), this.sfixed32());
    }
    /**
     * Read a `float` field, 32-bit floating point number.
     */
    float() {
        return this.view.getFloat32((this.pos += 4) - 4, true);
    }
    /**
     * Read a `double` field, a 64-bit floating point number.
     */
    double() {
        return this.view.getFloat64((this.pos += 8) - 8, true);
    }
    /**
     * Read a `bytes` field, length-delimited arbitrary data.
     */
    bytes() {
        let len = this.uint32(), start = this.pos;
        this.pos += len;
        this.assertBounds();
        return this.buf.subarray(start, start + len);
    }
    /**
     * Read a `string` field, length-delimited data converted to UTF-8 text.
     */
    string() {
        return this.decodeUtf8(this.bytes());
    }
}
/**
 * Assert a valid signed protobuf 32-bit integer as a number or string.
 */
function assertInt32(arg) {
    if (typeof arg == "string") {
        arg = Number(arg);
    }
    else if (typeof arg != "number") {
        throw new Error("invalid int32: " + typeof arg);
    }
    if (!Number.isInteger(arg) ||
        arg > INT32_MAX ||
        arg < INT32_MIN)
        throw new Error("invalid int32: " + arg);
}
/**
 * Assert a valid unsigned protobuf 32-bit integer as a number or string.
 */
function assertUInt32(arg) {
    if (typeof arg == "string") {
        arg = Number(arg);
    }
    else if (typeof arg != "number") {
        throw new Error("invalid uint32: " + typeof arg);
    }
    if (!Number.isInteger(arg) ||
        arg > UINT32_MAX ||
        arg < 0)
        throw new Error("invalid uint32: " + arg);
}
/**
 * Assert a valid protobuf float value as a number or string.
 */
function assertFloat32(arg) {
    if (typeof arg == "string") {
        const o = arg;
        arg = Number(arg);
        if (isNaN(arg) && o !== "NaN") {
            throw new Error("invalid float32: " + o);
        }
    }
    else if (typeof arg != "number") {
        throw new Error("invalid float32: " + typeof arg);
    }
    if (Number.isFinite(arg) &&
        (arg > FLOAT32_MAX || arg < FLOAT32_MIN))
        throw new Error("invalid float32: " + arg);
}

;// ./node_modules/@vot.js/shared/dist/protos/yandex.js

const protobufPackage = "";
var StreamInterval;
(function (StreamInterval) {
    StreamInterval[StreamInterval["NO_CONNECTION"] = 0] = "NO_CONNECTION";
    StreamInterval[StreamInterval["TRANSLATING"] = 10] = "TRANSLATING";
    StreamInterval[StreamInterval["STREAMING"] = 20] = "STREAMING";
    StreamInterval[StreamInterval["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(StreamInterval || (StreamInterval = {}));
function streamIntervalFromJSON(object) {
    switch (object) {
        case 0:
        case "NO_CONNECTION":
            return StreamInterval.NO_CONNECTION;
        case 10:
        case "TRANSLATING":
            return StreamInterval.TRANSLATING;
        case 20:
        case "STREAMING":
            return StreamInterval.STREAMING;
        case -1:
        case "UNRECOGNIZED":
        default:
            return StreamInterval.UNRECOGNIZED;
    }
}
function streamIntervalToJSON(object) {
    switch (object) {
        case StreamInterval.NO_CONNECTION:
            return "NO_CONNECTION";
        case StreamInterval.TRANSLATING:
            return "TRANSLATING";
        case StreamInterval.STREAMING:
            return "STREAMING";
        case StreamInterval.UNRECOGNIZED:
        default:
            return "UNRECOGNIZED";
    }
}
function createBaseVideoTranslationHelpObject() {
    return { target: "", targetUrl: "" };
}
const VideoTranslationHelpObject = {
    encode(message, writer = new BinaryWriter()) {
        if (message.target !== "") {
            writer.uint32(10).string(message.target);
        }
        if (message.targetUrl !== "") {
            writer.uint32(18).string(message.targetUrl);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationHelpObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.target = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.targetUrl = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            target: isSet(object.target) ? globalThis.String(object.target) : "",
            targetUrl: isSet(object.targetUrl) ? globalThis.String(object.targetUrl) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.target !== "") {
            obj.target = message.target;
        }
        if (message.targetUrl !== "") {
            obj.targetUrl = message.targetUrl;
        }
        return obj;
    },
    create(base) {
        return VideoTranslationHelpObject.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationHelpObject();
        message.target = object.target ?? "";
        message.targetUrl = object.targetUrl ?? "";
        return message;
    },
};
function createBaseVideoTranslationRequest() {
    return {
        url: "",
        deviceId: undefined,
        firstRequest: false,
        duration: 0,
        unknown0: 0,
        language: "",
        forceSourceLang: false,
        unknown1: 0,
        translationHelp: [],
        wasStream: false,
        responseLanguage: "",
        unknown2: 0,
        unknown3: 0,
        bypassCache: false,
        useLivelyVoice: false,
        videoTitle: "",
    };
}
const VideoTranslationRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== "") {
            writer.uint32(26).string(message.url);
        }
        if (message.deviceId !== undefined) {
            writer.uint32(34).string(message.deviceId);
        }
        if (message.firstRequest !== false) {
            writer.uint32(40).bool(message.firstRequest);
        }
        if (message.duration !== 0) {
            writer.uint32(49).double(message.duration);
        }
        if (message.unknown0 !== 0) {
            writer.uint32(56).int32(message.unknown0);
        }
        if (message.language !== "") {
            writer.uint32(66).string(message.language);
        }
        if (message.forceSourceLang !== false) {
            writer.uint32(72).bool(message.forceSourceLang);
        }
        if (message.unknown1 !== 0) {
            writer.uint32(80).int32(message.unknown1);
        }
        for (const v of message.translationHelp) {
            VideoTranslationHelpObject.encode(v, writer.uint32(90).fork()).join();
        }
        if (message.wasStream !== false) {
            writer.uint32(104).bool(message.wasStream);
        }
        if (message.responseLanguage !== "") {
            writer.uint32(114).string(message.responseLanguage);
        }
        if (message.unknown2 !== 0) {
            writer.uint32(120).int32(message.unknown2);
        }
        if (message.unknown3 !== 0) {
            writer.uint32(128).int32(message.unknown3);
        }
        if (message.bypassCache !== false) {
            writer.uint32(136).bool(message.bypassCache);
        }
        if (message.useLivelyVoice !== false) {
            writer.uint32(144).bool(message.useLivelyVoice);
        }
        if (message.videoTitle !== "") {
            writer.uint32(154).string(message.videoTitle);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 3: {
                    if (tag !== 26) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 4: {
                    if (tag !== 34) {
                        break;
                    }
                    message.deviceId = reader.string();
                    continue;
                }
                case 5: {
                    if (tag !== 40) {
                        break;
                    }
                    message.firstRequest = reader.bool();
                    continue;
                }
                case 6: {
                    if (tag !== 49) {
                        break;
                    }
                    message.duration = reader.double();
                    continue;
                }
                case 7: {
                    if (tag !== 56) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                }
                case 8: {
                    if (tag !== 66) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
                case 9: {
                    if (tag !== 72) {
                        break;
                    }
                    message.forceSourceLang = reader.bool();
                    continue;
                }
                case 10: {
                    if (tag !== 80) {
                        break;
                    }
                    message.unknown1 = reader.int32();
                    continue;
                }
                case 11: {
                    if (tag !== 90) {
                        break;
                    }
                    message.translationHelp.push(VideoTranslationHelpObject.decode(reader, reader.uint32()));
                    continue;
                }
                case 13: {
                    if (tag !== 104) {
                        break;
                    }
                    message.wasStream = reader.bool();
                    continue;
                }
                case 14: {
                    if (tag !== 114) {
                        break;
                    }
                    message.responseLanguage = reader.string();
                    continue;
                }
                case 15: {
                    if (tag !== 120) {
                        break;
                    }
                    message.unknown2 = reader.int32();
                    continue;
                }
                case 16: {
                    if (tag !== 128) {
                        break;
                    }
                    message.unknown3 = reader.int32();
                    continue;
                }
                case 17: {
                    if (tag !== 136) {
                        break;
                    }
                    message.bypassCache = reader.bool();
                    continue;
                }
                case 18: {
                    if (tag !== 144) {
                        break;
                    }
                    message.useLivelyVoice = reader.bool();
                    continue;
                }
                case 19: {
                    if (tag !== 154) {
                        break;
                    }
                    message.videoTitle = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            deviceId: isSet(object.deviceId) ? globalThis.String(object.deviceId) : undefined,
            firstRequest: isSet(object.firstRequest) ? globalThis.Boolean(object.firstRequest) : false,
            duration: isSet(object.duration) ? globalThis.Number(object.duration) : 0,
            unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : 0,
            language: isSet(object.language) ? globalThis.String(object.language) : "",
            forceSourceLang: isSet(object.forceSourceLang) ? globalThis.Boolean(object.forceSourceLang) : false,
            unknown1: isSet(object.unknown1) ? globalThis.Number(object.unknown1) : 0,
            translationHelp: globalThis.Array.isArray(object?.translationHelp)
                ? object.translationHelp.map((e) => VideoTranslationHelpObject.fromJSON(e))
                : [],
            wasStream: isSet(object.wasStream) ? globalThis.Boolean(object.wasStream) : false,
            responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
            unknown2: isSet(object.unknown2) ? globalThis.Number(object.unknown2) : 0,
            unknown3: isSet(object.unknown3) ? globalThis.Number(object.unknown3) : 0,
            bypassCache: isSet(object.bypassCache) ? globalThis.Boolean(object.bypassCache) : false,
            useLivelyVoice: isSet(object.useLivelyVoice) ? globalThis.Boolean(object.useLivelyVoice) : false,
            videoTitle: isSet(object.videoTitle) ? globalThis.String(object.videoTitle) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.deviceId !== undefined) {
            obj.deviceId = message.deviceId;
        }
        if (message.firstRequest !== false) {
            obj.firstRequest = message.firstRequest;
        }
        if (message.duration !== 0) {
            obj.duration = message.duration;
        }
        if (message.unknown0 !== 0) {
            obj.unknown0 = Math.round(message.unknown0);
        }
        if (message.language !== "") {
            obj.language = message.language;
        }
        if (message.forceSourceLang !== false) {
            obj.forceSourceLang = message.forceSourceLang;
        }
        if (message.unknown1 !== 0) {
            obj.unknown1 = Math.round(message.unknown1);
        }
        if (message.translationHelp?.length) {
            obj.translationHelp = message.translationHelp.map((e) => VideoTranslationHelpObject.toJSON(e));
        }
        if (message.wasStream !== false) {
            obj.wasStream = message.wasStream;
        }
        if (message.responseLanguage !== "") {
            obj.responseLanguage = message.responseLanguage;
        }
        if (message.unknown2 !== 0) {
            obj.unknown2 = Math.round(message.unknown2);
        }
        if (message.unknown3 !== 0) {
            obj.unknown3 = Math.round(message.unknown3);
        }
        if (message.bypassCache !== false) {
            obj.bypassCache = message.bypassCache;
        }
        if (message.useLivelyVoice !== false) {
            obj.useLivelyVoice = message.useLivelyVoice;
        }
        if (message.videoTitle !== "") {
            obj.videoTitle = message.videoTitle;
        }
        return obj;
    },
    create(base) {
        return VideoTranslationRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationRequest();
        message.url = object.url ?? "";
        message.deviceId = object.deviceId ?? undefined;
        message.firstRequest = object.firstRequest ?? false;
        message.duration = object.duration ?? 0;
        message.unknown0 = object.unknown0 ?? 0;
        message.language = object.language ?? "";
        message.forceSourceLang = object.forceSourceLang ?? false;
        message.unknown1 = object.unknown1 ?? 0;
        message.translationHelp = object.translationHelp?.map((e) => VideoTranslationHelpObject.fromPartial(e)) || [];
        message.wasStream = object.wasStream ?? false;
        message.responseLanguage = object.responseLanguage ?? "";
        message.unknown2 = object.unknown2 ?? 0;
        message.unknown3 = object.unknown3 ?? 0;
        message.bypassCache = object.bypassCache ?? false;
        message.useLivelyVoice = object.useLivelyVoice ?? false;
        message.videoTitle = object.videoTitle ?? "";
        return message;
    },
};
function createBaseVideoTranslationResponse() {
    return {
        url: undefined,
        duration: undefined,
        status: 0,
        remainingTime: undefined,
        unknown0: undefined,
        translationId: "",
        language: undefined,
        message: undefined,
        isLivelyVoice: false,
        unknown2: undefined,
    };
}
const VideoTranslationResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== undefined) {
            writer.uint32(10).string(message.url);
        }
        if (message.duration !== undefined) {
            writer.uint32(17).double(message.duration);
        }
        if (message.status !== 0) {
            writer.uint32(32).int32(message.status);
        }
        if (message.remainingTime !== undefined) {
            writer.uint32(40).int32(message.remainingTime);
        }
        if (message.unknown0 !== undefined) {
            writer.uint32(48).int32(message.unknown0);
        }
        if (message.translationId !== "") {
            writer.uint32(58).string(message.translationId);
        }
        if (message.language !== undefined) {
            writer.uint32(66).string(message.language);
        }
        if (message.message !== undefined) {
            writer.uint32(74).string(message.message);
        }
        if (message.isLivelyVoice !== false) {
            writer.uint32(80).bool(message.isLivelyVoice);
        }
        if (message.unknown2 !== undefined) {
            writer.uint32(88).int32(message.unknown2);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 17) {
                        break;
                    }
                    message.duration = reader.double();
                    continue;
                }
                case 4: {
                    if (tag !== 32) {
                        break;
                    }
                    message.status = reader.int32();
                    continue;
                }
                case 5: {
                    if (tag !== 40) {
                        break;
                    }
                    message.remainingTime = reader.int32();
                    continue;
                }
                case 6: {
                    if (tag !== 48) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                }
                case 7: {
                    if (tag !== 58) {
                        break;
                    }
                    message.translationId = reader.string();
                    continue;
                }
                case 8: {
                    if (tag !== 66) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
                case 9: {
                    if (tag !== 74) {
                        break;
                    }
                    message.message = reader.string();
                    continue;
                }
                case 10: {
                    if (tag !== 80) {
                        break;
                    }
                    message.isLivelyVoice = reader.bool();
                    continue;
                }
                case 11: {
                    if (tag !== 88) {
                        break;
                    }
                    message.unknown2 = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : undefined,
            duration: isSet(object.duration) ? globalThis.Number(object.duration) : undefined,
            status: isSet(object.status) ? globalThis.Number(object.status) : 0,
            remainingTime: isSet(object.remainingTime) ? globalThis.Number(object.remainingTime) : undefined,
            unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : undefined,
            translationId: isSet(object.translationId) ? globalThis.String(object.translationId) : "",
            language: isSet(object.language) ? globalThis.String(object.language) : undefined,
            message: isSet(object.message) ? globalThis.String(object.message) : undefined,
            isLivelyVoice: isSet(object.isLivelyVoice) ? globalThis.Boolean(object.isLivelyVoice) : false,
            unknown2: isSet(object.unknown2) ? globalThis.Number(object.unknown2) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== undefined) {
            obj.url = message.url;
        }
        if (message.duration !== undefined) {
            obj.duration = message.duration;
        }
        if (message.status !== 0) {
            obj.status = Math.round(message.status);
        }
        if (message.remainingTime !== undefined) {
            obj.remainingTime = Math.round(message.remainingTime);
        }
        if (message.unknown0 !== undefined) {
            obj.unknown0 = Math.round(message.unknown0);
        }
        if (message.translationId !== "") {
            obj.translationId = message.translationId;
        }
        if (message.language !== undefined) {
            obj.language = message.language;
        }
        if (message.message !== undefined) {
            obj.message = message.message;
        }
        if (message.isLivelyVoice !== false) {
            obj.isLivelyVoice = message.isLivelyVoice;
        }
        if (message.unknown2 !== undefined) {
            obj.unknown2 = Math.round(message.unknown2);
        }
        return obj;
    },
    create(base) {
        return VideoTranslationResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationResponse();
        message.url = object.url ?? undefined;
        message.duration = object.duration ?? undefined;
        message.status = object.status ?? 0;
        message.remainingTime = object.remainingTime ?? undefined;
        message.unknown0 = object.unknown0 ?? undefined;
        message.translationId = object.translationId ?? "";
        message.language = object.language ?? undefined;
        message.message = object.message ?? undefined;
        message.isLivelyVoice = object.isLivelyVoice ?? false;
        message.unknown2 = object.unknown2 ?? undefined;
        return message;
    },
};
function createBaseVideoTranslationCacheItem() {
    return { status: 0, remainingTime: undefined };
}
const VideoTranslationCacheItem = {
    encode(message, writer = new BinaryWriter()) {
        if (message.status !== 0) {
            writer.uint32(8).int32(message.status);
        }
        if (message.remainingTime !== undefined) {
            writer.uint32(16).int32(message.remainingTime);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationCacheItem();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 8) {
                        break;
                    }
                    message.status = reader.int32();
                    continue;
                }
                case 2: {
                    if (tag !== 16) {
                        break;
                    }
                    message.remainingTime = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            status: isSet(object.status) ? globalThis.Number(object.status) : 0,
            remainingTime: isSet(object.remainingTime) ? globalThis.Number(object.remainingTime) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.status !== 0) {
            obj.status = Math.round(message.status);
        }
        if (message.remainingTime !== undefined) {
            obj.remainingTime = Math.round(message.remainingTime);
        }
        return obj;
    },
    create(base) {
        return VideoTranslationCacheItem.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationCacheItem();
        message.status = object.status ?? 0;
        message.remainingTime = object.remainingTime ?? undefined;
        return message;
    },
};
function createBaseVideoTranslationCacheRequest() {
    return { url: "", duration: 0, language: "", responseLanguage: "" };
}
const VideoTranslationCacheRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.duration !== 0) {
            writer.uint32(17).double(message.duration);
        }
        if (message.language !== "") {
            writer.uint32(26).string(message.language);
        }
        if (message.responseLanguage !== "") {
            writer.uint32(34).string(message.responseLanguage);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationCacheRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 17) {
                        break;
                    }
                    message.duration = reader.double();
                    continue;
                }
                case 3: {
                    if (tag !== 26) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
                case 4: {
                    if (tag !== 34) {
                        break;
                    }
                    message.responseLanguage = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            duration: isSet(object.duration) ? globalThis.Number(object.duration) : 0,
            language: isSet(object.language) ? globalThis.String(object.language) : "",
            responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.duration !== 0) {
            obj.duration = message.duration;
        }
        if (message.language !== "") {
            obj.language = message.language;
        }
        if (message.responseLanguage !== "") {
            obj.responseLanguage = message.responseLanguage;
        }
        return obj;
    },
    create(base) {
        return VideoTranslationCacheRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationCacheRequest();
        message.url = object.url ?? "";
        message.duration = object.duration ?? 0;
        message.language = object.language ?? "";
        message.responseLanguage = object.responseLanguage ?? "";
        return message;
    },
};
function createBaseVideoTranslationCacheResponse() {
    return { default: undefined, cloning: undefined };
}
const VideoTranslationCacheResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.default !== undefined) {
            VideoTranslationCacheItem.encode(message.default, writer.uint32(10).fork()).join();
        }
        if (message.cloning !== undefined) {
            VideoTranslationCacheItem.encode(message.cloning, writer.uint32(18).fork()).join();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationCacheResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.default = VideoTranslationCacheItem.decode(reader, reader.uint32());
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.cloning = VideoTranslationCacheItem.decode(reader, reader.uint32());
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            default: isSet(object.default) ? VideoTranslationCacheItem.fromJSON(object.default) : undefined,
            cloning: isSet(object.cloning) ? VideoTranslationCacheItem.fromJSON(object.cloning) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.default !== undefined) {
            obj.default = VideoTranslationCacheItem.toJSON(message.default);
        }
        if (message.cloning !== undefined) {
            obj.cloning = VideoTranslationCacheItem.toJSON(message.cloning);
        }
        return obj;
    },
    create(base) {
        return VideoTranslationCacheResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationCacheResponse();
        message.default = (object.default !== undefined && object.default !== null)
            ? VideoTranslationCacheItem.fromPartial(object.default)
            : undefined;
        message.cloning = (object.cloning !== undefined && object.cloning !== null)
            ? VideoTranslationCacheItem.fromPartial(object.cloning)
            : undefined;
        return message;
    },
};
function createBaseAudioBufferObject() {
    return { audioFile: new Uint8Array(0), fileId: "" };
}
const AudioBufferObject = {
    encode(message, writer = new BinaryWriter()) {
        if (message.audioFile.length !== 0) {
            writer.uint32(18).bytes(message.audioFile);
        }
        if (message.fileId !== "") {
            writer.uint32(10).string(message.fileId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAudioBufferObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.audioFile = reader.bytes();
                    continue;
                }
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.fileId = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            audioFile: isSet(object.audioFile) ? bytesFromBase64(object.audioFile) : new Uint8Array(0),
            fileId: isSet(object.fileId) ? globalThis.String(object.fileId) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.audioFile.length !== 0) {
            obj.audioFile = base64FromBytes(message.audioFile);
        }
        if (message.fileId !== "") {
            obj.fileId = message.fileId;
        }
        return obj;
    },
    create(base) {
        return AudioBufferObject.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseAudioBufferObject();
        message.audioFile = object.audioFile ?? new Uint8Array(0);
        message.fileId = object.fileId ?? "";
        return message;
    },
};
function createBaseChunkAudioObject() {
    return { audioPartsLength: 0, audioBuffer: undefined, fileId: "", unknown0: 0 };
}
const ChunkAudioObject = {
    encode(message, writer = new BinaryWriter()) {
        if (message.audioPartsLength !== 0) {
            writer.uint32(16).int32(message.audioPartsLength);
        }
        if (message.audioBuffer !== undefined) {
            AudioBufferObject.encode(message.audioBuffer, writer.uint32(10).fork()).join();
        }
        if (message.fileId !== "") {
            writer.uint32(26).string(message.fileId);
        }
        if (message.unknown0 !== 0) {
            writer.uint32(32).int32(message.unknown0);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseChunkAudioObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 2: {
                    if (tag !== 16) {
                        break;
                    }
                    message.audioPartsLength = reader.int32();
                    continue;
                }
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.audioBuffer = AudioBufferObject.decode(reader, reader.uint32());
                    continue;
                }
                case 3: {
                    if (tag !== 26) {
                        break;
                    }
                    message.fileId = reader.string();
                    continue;
                }
                case 4: {
                    if (tag !== 32) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            audioPartsLength: isSet(object.audioPartsLength) ? globalThis.Number(object.audioPartsLength) : 0,
            audioBuffer: isSet(object.audioBuffer) ? AudioBufferObject.fromJSON(object.audioBuffer) : undefined,
            fileId: isSet(object.fileId) ? globalThis.String(object.fileId) : "",
            unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : 0,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.audioPartsLength !== 0) {
            obj.audioPartsLength = Math.round(message.audioPartsLength);
        }
        if (message.audioBuffer !== undefined) {
            obj.audioBuffer = AudioBufferObject.toJSON(message.audioBuffer);
        }
        if (message.fileId !== "") {
            obj.fileId = message.fileId;
        }
        if (message.unknown0 !== 0) {
            obj.unknown0 = Math.round(message.unknown0);
        }
        return obj;
    },
    create(base) {
        return ChunkAudioObject.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseChunkAudioObject();
        message.audioPartsLength = object.audioPartsLength ?? 0;
        message.audioBuffer = (object.audioBuffer !== undefined && object.audioBuffer !== null)
            ? AudioBufferObject.fromPartial(object.audioBuffer)
            : undefined;
        message.fileId = object.fileId ?? "";
        message.unknown0 = object.unknown0 ?? 0;
        return message;
    },
};
function createBaseVideoTranslationAudioRequest() {
    return { translationId: "", url: "", partialAudioInfo: undefined, audioInfo: undefined };
}
const VideoTranslationAudioRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.translationId !== "") {
            writer.uint32(10).string(message.translationId);
        }
        if (message.url !== "") {
            writer.uint32(18).string(message.url);
        }
        if (message.partialAudioInfo !== undefined) {
            ChunkAudioObject.encode(message.partialAudioInfo, writer.uint32(34).fork()).join();
        }
        if (message.audioInfo !== undefined) {
            AudioBufferObject.encode(message.audioInfo, writer.uint32(50).fork()).join();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationAudioRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.translationId = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 4: {
                    if (tag !== 34) {
                        break;
                    }
                    message.partialAudioInfo = ChunkAudioObject.decode(reader, reader.uint32());
                    continue;
                }
                case 6: {
                    if (tag !== 50) {
                        break;
                    }
                    message.audioInfo = AudioBufferObject.decode(reader, reader.uint32());
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            translationId: isSet(object.translationId) ? globalThis.String(object.translationId) : "",
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            partialAudioInfo: isSet(object.partialAudioInfo) ? ChunkAudioObject.fromJSON(object.partialAudioInfo) : undefined,
            audioInfo: isSet(object.audioInfo) ? AudioBufferObject.fromJSON(object.audioInfo) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.translationId !== "") {
            obj.translationId = message.translationId;
        }
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.partialAudioInfo !== undefined) {
            obj.partialAudioInfo = ChunkAudioObject.toJSON(message.partialAudioInfo);
        }
        if (message.audioInfo !== undefined) {
            obj.audioInfo = AudioBufferObject.toJSON(message.audioInfo);
        }
        return obj;
    },
    create(base) {
        return VideoTranslationAudioRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationAudioRequest();
        message.translationId = object.translationId ?? "";
        message.url = object.url ?? "";
        message.partialAudioInfo = (object.partialAudioInfo !== undefined && object.partialAudioInfo !== null)
            ? ChunkAudioObject.fromPartial(object.partialAudioInfo)
            : undefined;
        message.audioInfo = (object.audioInfo !== undefined && object.audioInfo !== null)
            ? AudioBufferObject.fromPartial(object.audioInfo)
            : undefined;
        return message;
    },
};
function createBaseVideoTranslationAudioResponse() {
    return { status: 0, remainingChunks: [] };
}
const VideoTranslationAudioResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.status !== 0) {
            writer.uint32(8).int32(message.status);
        }
        for (const v of message.remainingChunks) {
            writer.uint32(18).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationAudioResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 8) {
                        break;
                    }
                    message.status = reader.int32();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.remainingChunks.push(reader.string());
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            status: isSet(object.status) ? globalThis.Number(object.status) : 0,
            remainingChunks: globalThis.Array.isArray(object?.remainingChunks)
                ? object.remainingChunks.map((e) => globalThis.String(e))
                : [],
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.status !== 0) {
            obj.status = Math.round(message.status);
        }
        if (message.remainingChunks?.length) {
            obj.remainingChunks = message.remainingChunks;
        }
        return obj;
    },
    create(base) {
        return VideoTranslationAudioResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseVideoTranslationAudioResponse();
        message.status = object.status ?? 0;
        message.remainingChunks = object.remainingChunks?.map((e) => e) || [];
        return message;
    },
};
function createBaseSubtitlesObject() {
    return { language: "", url: "", unknown0: 0, translatedLanguage: "", translatedUrl: "", unknown1: 0, unknown2: 0 };
}
const SubtitlesObject = {
    encode(message, writer = new BinaryWriter()) {
        if (message.language !== "") {
            writer.uint32(10).string(message.language);
        }
        if (message.url !== "") {
            writer.uint32(18).string(message.url);
        }
        if (message.unknown0 !== 0) {
            writer.uint32(24).int32(message.unknown0);
        }
        if (message.translatedLanguage !== "") {
            writer.uint32(34).string(message.translatedLanguage);
        }
        if (message.translatedUrl !== "") {
            writer.uint32(42).string(message.translatedUrl);
        }
        if (message.unknown1 !== 0) {
            writer.uint32(48).int32(message.unknown1);
        }
        if (message.unknown2 !== 0) {
            writer.uint32(56).int32(message.unknown2);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 3: {
                    if (tag !== 24) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                }
                case 4: {
                    if (tag !== 34) {
                        break;
                    }
                    message.translatedLanguage = reader.string();
                    continue;
                }
                case 5: {
                    if (tag !== 42) {
                        break;
                    }
                    message.translatedUrl = reader.string();
                    continue;
                }
                case 6: {
                    if (tag !== 48) {
                        break;
                    }
                    message.unknown1 = reader.int32();
                    continue;
                }
                case 7: {
                    if (tag !== 56) {
                        break;
                    }
                    message.unknown2 = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            language: isSet(object.language) ? globalThis.String(object.language) : "",
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : 0,
            translatedLanguage: isSet(object.translatedLanguage) ? globalThis.String(object.translatedLanguage) : "",
            translatedUrl: isSet(object.translatedUrl) ? globalThis.String(object.translatedUrl) : "",
            unknown1: isSet(object.unknown1) ? globalThis.Number(object.unknown1) : 0,
            unknown2: isSet(object.unknown2) ? globalThis.Number(object.unknown2) : 0,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.language !== "") {
            obj.language = message.language;
        }
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.unknown0 !== 0) {
            obj.unknown0 = Math.round(message.unknown0);
        }
        if (message.translatedLanguage !== "") {
            obj.translatedLanguage = message.translatedLanguage;
        }
        if (message.translatedUrl !== "") {
            obj.translatedUrl = message.translatedUrl;
        }
        if (message.unknown1 !== 0) {
            obj.unknown1 = Math.round(message.unknown1);
        }
        if (message.unknown2 !== 0) {
            obj.unknown2 = Math.round(message.unknown2);
        }
        return obj;
    },
    create(base) {
        return SubtitlesObject.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseSubtitlesObject();
        message.language = object.language ?? "";
        message.url = object.url ?? "";
        message.unknown0 = object.unknown0 ?? 0;
        message.translatedLanguage = object.translatedLanguage ?? "";
        message.translatedUrl = object.translatedUrl ?? "";
        message.unknown1 = object.unknown1 ?? 0;
        message.unknown2 = object.unknown2 ?? 0;
        return message;
    },
};
function createBaseSubtitlesRequest() {
    return { url: "", language: "" };
}
const SubtitlesRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.language !== "") {
            writer.uint32(18).string(message.language);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            language: isSet(object.language) ? globalThis.String(object.language) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.language !== "") {
            obj.language = message.language;
        }
        return obj;
    },
    create(base) {
        return SubtitlesRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseSubtitlesRequest();
        message.url = object.url ?? "";
        message.language = object.language ?? "";
        return message;
    },
};
function createBaseSubtitlesResponse() {
    return { waiting: false, subtitles: [] };
}
const SubtitlesResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.waiting !== false) {
            writer.uint32(8).bool(message.waiting);
        }
        for (const v of message.subtitles) {
            SubtitlesObject.encode(v, writer.uint32(18).fork()).join();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 8) {
                        break;
                    }
                    message.waiting = reader.bool();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.subtitles.push(SubtitlesObject.decode(reader, reader.uint32()));
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            waiting: isSet(object.waiting) ? globalThis.Boolean(object.waiting) : false,
            subtitles: globalThis.Array.isArray(object?.subtitles)
                ? object.subtitles.map((e) => SubtitlesObject.fromJSON(e))
                : [],
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.waiting !== false) {
            obj.waiting = message.waiting;
        }
        if (message.subtitles?.length) {
            obj.subtitles = message.subtitles.map((e) => SubtitlesObject.toJSON(e));
        }
        return obj;
    },
    create(base) {
        return SubtitlesResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseSubtitlesResponse();
        message.waiting = object.waiting ?? false;
        message.subtitles = object.subtitles?.map((e) => SubtitlesObject.fromPartial(e)) || [];
        return message;
    },
};
function createBaseStreamTranslationObject() {
    return { url: "", timestamp: "" };
}
const StreamTranslationObject = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.timestamp !== "") {
            writer.uint32(18).string(message.timestamp);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.timestamp = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            timestamp: isSet(object.timestamp) ? globalThis.String(object.timestamp) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.timestamp !== "") {
            obj.timestamp = message.timestamp;
        }
        return obj;
    },
    create(base) {
        return StreamTranslationObject.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseStreamTranslationObject();
        message.url = object.url ?? "";
        message.timestamp = object.timestamp ?? "";
        return message;
    },
};
function createBaseStreamTranslationRequest() {
    return { url: "", language: "", responseLanguage: "", unknown0: 0, unknown1: 0 };
}
const StreamTranslationRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.language !== "") {
            writer.uint32(18).string(message.language);
        }
        if (message.responseLanguage !== "") {
            writer.uint32(26).string(message.responseLanguage);
        }
        if (message.unknown0 !== 0) {
            writer.uint32(40).int32(message.unknown0);
        }
        if (message.unknown1 !== 0) {
            writer.uint32(48).int32(message.unknown1);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                }
                case 3: {
                    if (tag !== 26) {
                        break;
                    }
                    message.responseLanguage = reader.string();
                    continue;
                }
                case 5: {
                    if (tag !== 40) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                }
                case 6: {
                    if (tag !== 48) {
                        break;
                    }
                    message.unknown1 = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            language: isSet(object.language) ? globalThis.String(object.language) : "",
            responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
            unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : 0,
            unknown1: isSet(object.unknown1) ? globalThis.Number(object.unknown1) : 0,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.url !== "") {
            obj.url = message.url;
        }
        if (message.language !== "") {
            obj.language = message.language;
        }
        if (message.responseLanguage !== "") {
            obj.responseLanguage = message.responseLanguage;
        }
        if (message.unknown0 !== 0) {
            obj.unknown0 = Math.round(message.unknown0);
        }
        if (message.unknown1 !== 0) {
            obj.unknown1 = Math.round(message.unknown1);
        }
        return obj;
    },
    create(base) {
        return StreamTranslationRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseStreamTranslationRequest();
        message.url = object.url ?? "";
        message.language = object.language ?? "";
        message.responseLanguage = object.responseLanguage ?? "";
        message.unknown0 = object.unknown0 ?? 0;
        message.unknown1 = object.unknown1 ?? 0;
        return message;
    },
};
function createBaseStreamTranslationResponse() {
    return { interval: 0, translatedInfo: undefined, pingId: undefined };
}
const StreamTranslationResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.interval !== 0) {
            writer.uint32(8).int32(message.interval);
        }
        if (message.translatedInfo !== undefined) {
            StreamTranslationObject.encode(message.translatedInfo, writer.uint32(18).fork()).join();
        }
        if (message.pingId !== undefined) {
            writer.uint32(24).int32(message.pingId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 8) {
                        break;
                    }
                    message.interval = reader.int32();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.translatedInfo = StreamTranslationObject.decode(reader, reader.uint32());
                    continue;
                }
                case 3: {
                    if (tag !== 24) {
                        break;
                    }
                    message.pingId = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            interval: isSet(object.interval) ? streamIntervalFromJSON(object.interval) : 0,
            translatedInfo: isSet(object.translatedInfo)
                ? StreamTranslationObject.fromJSON(object.translatedInfo)
                : undefined,
            pingId: isSet(object.pingId) ? globalThis.Number(object.pingId) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.interval !== 0) {
            obj.interval = streamIntervalToJSON(message.interval);
        }
        if (message.translatedInfo !== undefined) {
            obj.translatedInfo = StreamTranslationObject.toJSON(message.translatedInfo);
        }
        if (message.pingId !== undefined) {
            obj.pingId = Math.round(message.pingId);
        }
        return obj;
    },
    create(base) {
        return StreamTranslationResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseStreamTranslationResponse();
        message.interval = object.interval ?? 0;
        message.translatedInfo = (object.translatedInfo !== undefined && object.translatedInfo !== null)
            ? StreamTranslationObject.fromPartial(object.translatedInfo)
            : undefined;
        message.pingId = object.pingId ?? undefined;
        return message;
    },
};
function createBaseStreamPingRequest() {
    return { pingId: 0 };
}
const StreamPingRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.pingId !== 0) {
            writer.uint32(8).int32(message.pingId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamPingRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 8) {
                        break;
                    }
                    message.pingId = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return { pingId: isSet(object.pingId) ? globalThis.Number(object.pingId) : 0 };
    },
    toJSON(message) {
        const obj = {};
        if (message.pingId !== 0) {
            obj.pingId = Math.round(message.pingId);
        }
        return obj;
    },
    create(base) {
        return StreamPingRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseStreamPingRequest();
        message.pingId = object.pingId ?? 0;
        return message;
    },
};
function createBaseYandexSessionRequest() {
    return { uuid: "", module: "" };
}
const YandexSessionRequest = {
    encode(message, writer = new BinaryWriter()) {
        if (message.uuid !== "") {
            writer.uint32(10).string(message.uuid);
        }
        if (message.module !== "") {
            writer.uint32(18).string(message.module);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseYandexSessionRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.uuid = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 18) {
                        break;
                    }
                    message.module = reader.string();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            uuid: isSet(object.uuid) ? globalThis.String(object.uuid) : "",
            module: isSet(object.module) ? globalThis.String(object.module) : "",
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.uuid !== "") {
            obj.uuid = message.uuid;
        }
        if (message.module !== "") {
            obj.module = message.module;
        }
        return obj;
    },
    create(base) {
        return YandexSessionRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseYandexSessionRequest();
        message.uuid = object.uuid ?? "";
        message.module = object.module ?? "";
        return message;
    },
};
function createBaseYandexSessionResponse() {
    return { secretKey: "", expires: 0 };
}
const YandexSessionResponse = {
    encode(message, writer = new BinaryWriter()) {
        if (message.secretKey !== "") {
            writer.uint32(10).string(message.secretKey);
        }
        if (message.expires !== 0) {
            writer.uint32(16).int32(message.expires);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseYandexSessionResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: {
                    if (tag !== 10) {
                        break;
                    }
                    message.secretKey = reader.string();
                    continue;
                }
                case 2: {
                    if (tag !== 16) {
                        break;
                    }
                    message.expires = reader.int32();
                    continue;
                }
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skip(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            secretKey: isSet(object.secretKey) ? globalThis.String(object.secretKey) : "",
            expires: isSet(object.expires) ? globalThis.Number(object.expires) : 0,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.secretKey !== "") {
            obj.secretKey = message.secretKey;
        }
        if (message.expires !== 0) {
            obj.expires = Math.round(message.expires);
        }
        return obj;
    },
    create(base) {
        return YandexSessionResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseYandexSessionResponse();
        message.secretKey = object.secretKey ?? "";
        message.expires = object.expires ?? 0;
        return message;
    },
};
function bytesFromBase64(b64) {
    if (globalThis.Buffer) {
        return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
    }
    else {
        const bin = globalThis.atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; ++i) {
            arr[i] = bin.charCodeAt(i);
        }
        return arr;
    }
}
function base64FromBytes(arr) {
    if (globalThis.Buffer) {
        return globalThis.Buffer.from(arr).toString("base64");
    }
    else {
        const bin = [];
        arr.forEach((byte) => {
            bin.push(globalThis.String.fromCharCode(byte));
        });
        return globalThis.btoa(bin.join(""));
    }
}
function isSet(value) {
    return value !== null && value !== undefined;
}

;// ./node_modules/@vot.js/shared/dist/secure.js


const { componentVersion } = data_config;
async function getCrypto() {
    if (typeof window !== "undefined" && window.crypto) {
        return window.crypto;
    }
    return (await Promise.resolve().then(function webpackMissingModule() { var e = new Error("Cannot find module 'node:crypto'"); e.code = 'MODULE_NOT_FOUND'; throw e; }));
}
const utf8Encoder = new TextEncoder();
async function signHMAC(hashName, hmac, data) {
    const crypto = await getCrypto();
    const key = await crypto.subtle.importKey("raw", utf8Encoder.encode(hmac), { name: "HMAC", hash: { name: hashName } }, false, ["sign", "verify"]);
    return await crypto.subtle.sign("HMAC", key, data);
}
async function getSignature(body) {
    const signature = await signHMAC("SHA-256", data_config.hmac, body);
    return new Uint8Array(signature).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}
async function getSecYaHeaders(secType, session, body, path) {
    const { secretKey, uuid } = session;
    const token = `${uuid}:${path}:${data_config.componentVersion}`;
    const tokenBody = utf8Encoder.encode(token);
    const tokenSign = await getSignature(tokenBody);
    if (secType === "Ya-Summary") {
        return {
            [`X-${secType}-Sk`]: secretKey,
            [`X-${secType}-Token`]: `${tokenSign}:${token}`,
        };
    }
    const sign = await getSignature(body);
    return {
        [`${secType}-Signature`]: sign,
        [`Sec-${secType}-Sk`]: secretKey,
        [`Sec-${secType}-Token`]: `${tokenSign}:${token}`,
    };
}
function getUUID() {
    const hexDigits = "0123456789ABCDEF";
    let uuid = "";
    for (let i = 0; i < 32; i++) {
        const randomDigit = Math.floor(Math.random() * 16);
        uuid += hexDigits[randomDigit];
    }
    return uuid;
}
async function getHmacSha1(hmacKey, salt) {
    try {
        const hmacSalt = utf8Encoder.encode(salt);
        const signature = await signHMAC("SHA-1", hmacKey, hmacSalt);
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }
    catch (err) {
        Logger.error(err);
        return false;
    }
}
const browserSecHeaders = {
    "sec-ch-ua": `"Chromium";v="132", "YaBrowser";v="${componentVersion.slice(0, 5)}", "Not?A_Brand";v="99", "Yowser";v="2.5"`,
    "sec-ch-ua-full-version-list": `"Chromium";v="132.0.6834.685", "YaBrowser";v="${componentVersion}", "Not?A_Brand";v="99.0.0.0", "Yowser";v="2.5"`,
    "Sec-Fetch-Mode": "no-cors",
};

;// ./node_modules/@vot.js/shared/dist/utils/utils.js

const iso6392to6391 = {
    afr: "af",
    aka: "ak",
    alb: "sq",
    amh: "am",
    ara: "ar",
    arm: "hy",
    asm: "as",
    aym: "ay",
    aze: "az",
    baq: "eu",
    bel: "be",
    ben: "bn",
    bos: "bs",
    bul: "bg",
    bur: "my",
    cat: "ca",
    chi: "zh",
    cos: "co",
    cze: "cs",
    dan: "da",
    div: "dv",
    dut: "nl",
    eng: "en",
    epo: "eo",
    est: "et",
    ewe: "ee",
    fin: "fi",
    fre: "fr",
    fry: "fy",
    geo: "ka",
    ger: "de",
    gla: "gd",
    gle: "ga",
    glg: "gl",
    gre: "el",
    grn: "gn",
    guj: "gu",
    hat: "ht",
    hau: "ha",
    hin: "hi",
    hrv: "hr",
    hun: "hu",
    ibo: "ig",
    ice: "is",
    ind: "id",
    ita: "it",
    jav: "jv",
    jpn: "ja",
    kan: "kn",
    kaz: "kk",
    khm: "km",
    kin: "rw",
    kir: "ky",
    kor: "ko",
    kur: "ku",
    lao: "lo",
    lat: "la",
    lav: "lv",
    lin: "ln",
    lit: "lt",
    ltz: "lb",
    lug: "lg",
    mac: "mk",
    mal: "ml",
    mao: "mi",
    mar: "mr",
    may: "ms",
    mlg: "mg",
    mlt: "mt",
    mon: "mn",
    nep: "ne",
    nor: "no",
    nya: "ny",
    ori: "or",
    orm: "om",
    pan: "pa",
    per: "fa",
    pol: "pl",
    por: "pt",
    pus: "ps",
    que: "qu",
    rum: "ro",
    rus: "ru",
    san: "sa",
    sin: "si",
    slo: "sk",
    slv: "sl",
    smo: "sm",
    sna: "sn",
    snd: "sd",
    som: "so",
    sot: "st",
    spa: "es",
    srp: "sr",
    sun: "su",
    swa: "sw",
    swe: "sv",
    tam: "ta",
    tat: "tt",
    tel: "te",
    tgk: "tg",
    tha: "th",
    tir: "ti",
    tso: "ts",
    tuk: "tk",
    tur: "tr",
    uig: "ug",
    ukr: "uk",
    urd: "ur",
    uzb: "uz",
    vie: "vi",
    wel: "cy",
    xho: "xh",
    yid: "yi",
    yor: "yo",
    zul: "zu",
};
async function fetchWithTimeout(url, options = {
    headers: {
        "User-Agent": data_config.userAgent,
    },
}) {
    const { timeout = 3000, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
    });
    clearTimeout(timeoutId);
    return response;
}
function getTimestamp() {
    return Math.floor(Date.now() / 1000);
}
function normalizeLang(lang) {
    if (lang.length === 3) {
        return iso6392to6391[lang];
    }
    return lang.toLowerCase().split(/[_;-]/)[0].trim();
}
function proxyMedia(url, format = "mp4") {
    const generalUrl = `https://${data_config.mediaProxy}/v1/proxy/video.${format}?format=base64&force=true`;
    if (!(url instanceof URL)) {
        return `${generalUrl}&url=${btoa(url)}`;
    }
    return `${generalUrl}&url=${btoa(url.href)}&origin=${url.origin}&referer=${url.origin}`;
}

;// ./node_modules/@vot.js/core/dist/protobuf.js

class YandexVOTProtobuf {
    static encodeTranslationRequest(url, duration, requestLang, responseLang, translationHelp, { forceSourceLang = false, wasStream = false, videoTitle = "", bypassCache = false, useLivelyVoice = false, } = {}) {
        return VideoTranslationRequest.encode({
            url,
            firstRequest: true,
            duration,
            unknown0: 1,
            language: requestLang,
            forceSourceLang,
            unknown1: 0,
            translationHelp: translationHelp ?? [],
            responseLanguage: responseLang,
            wasStream,
            unknown2: 0,
            unknown3: 2,
            bypassCache,
            useLivelyVoice,
            videoTitle,
        }).finish();
    }
    static decodeTranslationResponse(response) {
        return VideoTranslationResponse.decode(new Uint8Array(response));
    }
    static encodeTranslationCacheRequest(url, duration, requestLang, responseLang) {
        return VideoTranslationCacheRequest.encode({
            url,
            duration,
            language: requestLang,
            responseLanguage: responseLang,
        }).finish();
    }
    static decodeTranslationCacheResponse(response) {
        return VideoTranslationCacheResponse.decode(new Uint8Array(response));
    }
    static encodeTranslationAudioRequest(url, translationId, audioBuffer, partialAudio) {
        return VideoTranslationAudioRequest.encode({
            url,
            translationId,
            ...(partialAudio
                ? {
                    partialAudioInfo: {
                        ...partialAudio,
                        audioBuffer,
                    },
                }
                : {
                    audioInfo: audioBuffer,
                }),
        }).finish();
    }
    static decodeTranslationAudioResponse(response) {
        return VideoTranslationAudioResponse.decode(new Uint8Array(response));
    }
    static encodeSubtitlesRequest(url, requestLang) {
        return SubtitlesRequest.encode({
            url,
            language: requestLang,
        }).finish();
    }
    static decodeSubtitlesResponse(response) {
        return SubtitlesResponse.decode(new Uint8Array(response));
    }
    static encodeStreamPingRequest(pingId) {
        return StreamPingRequest.encode({
            pingId,
        }).finish();
    }
    static encodeStreamRequest(url, requestLang, responseLang) {
        return StreamTranslationRequest.encode({
            url,
            language: requestLang,
            responseLanguage: responseLang,
            unknown0: 1,
            unknown1: 0,
        }).finish();
    }
    static decodeStreamResponse(response) {
        return StreamTranslationResponse.decode(new Uint8Array(response));
    }
}
class YandexSessionProtobuf {
    static encodeSessionRequest(uuid, module) {
        return YandexSessionRequest.encode({
            uuid,
            module,
        }).finish();
    }
    static decodeSessionResponse(response) {
        return YandexSessionResponse.decode(new Uint8Array(response));
    }
}

;// ./node_modules/@vot.js/core/dist/types/yandex.js
var VideoTranslationStatus;
(function (VideoTranslationStatus) {
    VideoTranslationStatus[VideoTranslationStatus["FAILED"] = 0] = "FAILED";
    VideoTranslationStatus[VideoTranslationStatus["FINISHED"] = 1] = "FINISHED";
    VideoTranslationStatus[VideoTranslationStatus["WAITING"] = 2] = "WAITING";
    VideoTranslationStatus[VideoTranslationStatus["LONG_WAITING"] = 3] = "LONG_WAITING";
    VideoTranslationStatus[VideoTranslationStatus["PART_CONTENT"] = 5] = "PART_CONTENT";
    VideoTranslationStatus[VideoTranslationStatus["AUDIO_REQUESTED"] = 6] = "AUDIO_REQUESTED";
    VideoTranslationStatus[VideoTranslationStatus["SESSION_REQUIRED"] = 7] = "SESSION_REQUIRED";
})(VideoTranslationStatus || (VideoTranslationStatus = {}));
var AudioDownloadType;
(function (AudioDownloadType) {
    AudioDownloadType["WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME"] = "web_api_get_all_generating_urls_data_from_iframe";
    AudioDownloadType["WEB_API_REPLACED_FETCH_INSIDE_IFRAME"] = "web_api_replaced_fetch_inside_iframe";
    AudioDownloadType["WEB_API_REPLACED_FETCH_FORCE_REQUEST_WITH_SEEK"] = "web_api_replaced_fetch_force_request_with_seek";
    AudioDownloadType["WEB_API_REPLACED_FETCH"] = "web_api_replaced_fetch";
    AudioDownloadType["ANDROID_API"] = "android_api";
    AudioDownloadType["WEB_API_SLOW"] = "web_api_slow";
})(AudioDownloadType || (AudioDownloadType = {}));

;// ./node_modules/@vot.js/core/dist/types/service.js
var VideoService;
(function (VideoService) {
    VideoService["custom"] = "custom";
    VideoService["directlink"] = "custom";
    VideoService["youtube"] = "youtube";
    VideoService["piped"] = "piped";
    VideoService["invidious"] = "invidious";
    VideoService["vk"] = "vk";
    VideoService["nine_gag"] = "nine_gag";
    VideoService["gag"] = "nine_gag";
    VideoService["twitch"] = "twitch";
    VideoService["proxitok"] = "proxitok";
    VideoService["tiktok"] = "tiktok";
    VideoService["vimeo"] = "vimeo";
    VideoService["xvideos"] = "xvideos";
    VideoService["pornhub"] = "pornhub";
    VideoService["twitter"] = "twitter";
    VideoService["x"] = "twitter";
    VideoService["rumble"] = "rumble";
    VideoService["facebook"] = "facebook";
    VideoService["rutube"] = "rutube";
    VideoService["coub"] = "coub";
    VideoService["bilibili"] = "bilibili";
    VideoService["mail_ru"] = "mailru";
    VideoService["mailru"] = "mailru";
    VideoService["bitchute"] = "bitchute";
    VideoService["eporner"] = "eporner";
    VideoService["peertube"] = "peertube";
    VideoService["dailymotion"] = "dailymotion";
    VideoService["trovo"] = "trovo";
    VideoService["yandexdisk"] = "yandexdisk";
    VideoService["ok_ru"] = "okru";
    VideoService["okru"] = "okru";
    VideoService["googledrive"] = "googledrive";
    VideoService["bannedvideo"] = "bannedvideo";
    VideoService["weverse"] = "weverse";
    VideoService["newgrounds"] = "newgrounds";
    VideoService["egghead"] = "egghead";
    VideoService["youku"] = "youku";
    VideoService["archive"] = "archive";
    VideoService["kodik"] = "kodik";
    VideoService["patreon"] = "patreon";
    VideoService["reddit"] = "reddit";
    VideoService["kick"] = "kick";
    VideoService["apple_developer"] = "apple_developer";
    VideoService["appledeveloper"] = "apple_developer";
    VideoService["poketube"] = "poketube";
    VideoService["epicgames"] = "epicgames";
    VideoService["odysee"] = "odysee";
    VideoService["coursehunterLike"] = "coursehunterLike";
    VideoService["sap"] = "sap";
    VideoService["watchpornto"] = "watchpornto";
    VideoService["linkedin"] = "linkedin";
    VideoService["ricktube"] = "ricktube";
    VideoService["incestflix"] = "incestflix";
    VideoService["porntn"] = "porntn";
    VideoService["dzen"] = "dzen";
    VideoService["cloudflarestream"] = "cloudflarestream";
    VideoService["loom"] = "loom";
    VideoService["rtnews"] = "rtnews";
    VideoService["bitview"] = "bitview";
    VideoService["thisvid"] = "thisvid";
    VideoService["ign"] = "ign";
    VideoService["bunkr"] = "bunkr";
    VideoService["imdb"] = "imdb";
    VideoService["telegram"] = "telegram";
})(VideoService || (VideoService = {}));

;// ./node_modules/@vot.js/core/dist/utils/vot.js

function convertVOT(service, videoId, url) {
    if (service === VideoService.patreon) {
        return {
            service: "mux",
            videoId: new URL(url).pathname.slice(1),
        };
    }
    return {
        service,
        videoId,
    };
}

;// ./src/localization/locales/en.json
const en_namespaceObject = /*#__PURE__*/JSON.parse('{"recommended":"recommended","translateVideo":"Translate video","disableTranslate":"Turn off","translationSettings":"Translation settings","subtitlesSettings":"Subtitles settings","resetSettings":"Reset settings","videoBeingTranslated":"The video is being translated","videoLanguage":"Video language","translationLanguage":"Translation language","translationTake":"The translation will take","translationTakeMoreThanHour":"The translation will take more than an hour","translationTakeAboutMinute":"The translation will take about a minute","translationTakeFewMinutes":"The translation will take a few minutes","translationTakeApproximatelyMinutes":"The translation will take approximately {0} minutes","translationTakeApproximatelyMinute":"The translation will take approximately {0} minutes","requestTranslationFailed":"Failed to request video translation","audioNotReceived":"Audio link not received","audioFormatNotSupported":"The audio format is not supported","VOTAutoTranslate":"Translate on open","VOTDontTranslateYourLang":"Don\'t translate from my language","VOTVolume":"Video volume:","VOTVolumeTranslation":"Translation volume:","VOTAutoSetVolume":"Reduce video volume to","VOTShowVideoSlider":"Video volume slider","VOTSyncVolume":"Link translation and video volume","VOTDisableFromYourLang":"You have disabled the translation of the video in your language","VOTVideoIsTooLong":"Video is too long","VOTNoVideoIDFound":"No video ID found","VOTSubtitles":"Subtitles","VOTSubtitlesDisabled":"Disabled","VOTSubtitlesMaxLength":"Subtitles max length","VOTHighlightWords":"Highlight words","VOTTranslatedFrom":"translated from","VOTAutogenerated":"autogenerated","VOTSettings":"VOT Settings","VOTMenuLanguage":"Menu language","VOTAuthors":"Authors","VOTVersion":"Version","VOTLoader":"Loader","VOTBrowser":"Browser","VOTShowPiPButton":"Show PiP button","langs":{"auto":"Auto","af":"Afrikaans","ak":"Akan","sq":"Albanian","am":"Amharic","ar":"Arabic","hy":"Armenian","as":"Assamese","ay":"Aymara","az":"Azerbaijani","bn":"Bangla","eu":"Basque","be":"Belarusian","bho":"Bhojpuri","bs":"Bosnian","bg":"Bulgarian","my":"Burmese","ca":"Catalan","ceb":"Cebuano","zh":"Chinese","zh-Hans":"Chinese (Simplified)","zh-Hant":"Chinese (Traditional)","co":"Corsican","hr":"Croatian","cs":"Czech","da":"Danish","dv":"Divehi","nl":"Dutch","en":"English","eo":"Esperanto","et":"Estonian","ee":"Ewe","fil":"Filipino","fi":"Finnish","fr":"French","gl":"Galician","lg":"Ganda","ka":"Georgian","de":"German","el":"Greek","gn":"Guarani","gu":"Gujarati","ht":"Haitian Creole","ha":"Hausa","haw":"Hawaiian","iw":"Hebrew","hi":"Hindi","hmn":"Hmong","hu":"Hungarian","is":"Icelandic","ig":"Igbo","id":"Indonesian","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kn":"Kannada","kk":"Kazakh","km":"Khmer","rw":"Kinyarwanda","ko":"Korean","kri":"Krio","ku":"Kurdish","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","ln":"Lingala","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mi":"Māori","mr":"Marathi","mn":"Mongolian","ne":"Nepali","nso":"Northern Sotho","no":"Norwegian","ny":"Nyanja","or":"Odia","om":"Oromo","ps":"Pashto","fa":"Persian","pl":"Polish","pt":"Portuguese","pa":"Punjabi","qu":"Quechua","ro":"Romanian","ru":"Russian","sm":"Samoan","sa":"Sanskrit","gd":"Scottish Gaelic","sr":"Serbian","sn":"Shona","sd":"Sindhi","si":"Sinhala","sk":"Slovak","sl":"Slovenian","so":"Somali","st":"Southern Sotho","es":"Spanish","su":"Sundanese","sw":"Swahili","sv":"Swedish","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","ti":"Tigrinya","ts":"Tsonga","tr":"Turkish","tk":"Turkmen","uk":"Ukrainian","ur":"Urdu","ug":"Uyghur","uz":"Uzbek","vi":"Vietnamese","cy":"Welsh","fy":"Western Frisian","xh":"Xhosa","yi":"Yiddish","yo":"Yoruba","zu":"Zulu"},"streamNoConnectionToServer":"There is no connection to the server","searchField":"Search...","VOTTranslateAPIErrors":"Translate errors from the API","VOTDetectService":"Language detection service","VOTProxyWorkerHost":"Enter the proxy worker address","VOTM3u8ProxyHost":"Enter the address of the m3u8 proxy worker","proxySettings":"Proxy Settings","translationTakeApproximatelyMinute2":"The translation will take approximately {0} minutes","VOTAudioBooster":"Extended translation volume increase","VOTSubtitlesDesign":"Subtitles design","VOTSubtitlesFontSize":"Font size of subtitles","VOTSubtitlesOpacity":"Transparency of the subtitle background","VOTPressNewHotkey":"Press the new hotkey...","VOTCreateTranslationHotkey":"Create Hotkey for Translation","VOTChangeHotkeyWithCurrent":"Change Hotkey (Current: {0})","VOTSubtitlesDownloadFormat":"The format for downloading subtitles","VOTDownloadWithName":"Download files with the video name","VOTUpdateLocaleFiles":"Update localization files","VOTLocaleHash":"Locale hash","VOTUpdatedAt":"Updated at","VOTNeedWebAudioAPI":"To enable this, you must have a Web Audio API","VOTMediaCSPEnabledOnSite":"Media CSP is enabled on this site","VOTOnlyBypassMediaCSP":"Use it only for bypassing Media CSP","VOTNewAudioPlayer":"Use the new audio player","VOTUseNewModel":"Use an experimental variation of Yandex voices for some videos","TranslationDelayed":"The translation is slightly delayed","VOTTranslationCompletedNotify":"The translation on the {0} has been completed!","VOTSendNotifyOnComplete":"Send a notification that the video has been translated","VOTBugReport":"Report a bug","VOTTranslateProxyDisabled":"Disabled","VOTTranslateProxyEnabled":"Enabled","VOTTranslateProxyEverything":"Proxy everything","VOTTranslateProxyStatus":"Proxying mode","VOTTranslatedBy":"Translated by {0}","VOTStreamNotAvailable":"Translate stream isn\'t available","VOTTranslationTextService":"Text translation service","VOTNotAffectToVoice":"Doesn\'t affect the translation of text in voice over","DontTranslateSelectedLanguages":"Don\'t translate from selected languages","showVideoVolumeSlider":"Display the video volume slider","hotkeysSettings":"Hotkeys settings","None":"None","VOTUseLivelyVoice":"Use lively voices. Speakers sound like native Russians.","miscSettings":"Misc settings","services":{"yandexbrowser":"Yandex Browser","msedge":"Microsoft Edge","rust-server":"Rust Server"},"aboutExtension":"About extension","appearance":"Appearance","buttonPositionInWidePlayer":"Button position in wide player","position":{"left":"Left","right":"Right","top":"Top","default":"Default"},"secs":"secs","autoHideButtonDelay":"Delay before hiding the translate button","notFound":"not found","downloadFailed":"Failed to download file","minButtonPositionContainer":"The button position only changes in players larger than 600 pixels.","VOTTranslateProxyStatusDefault":"Completely disabling proxying in your country may break the extension","PressTheKeyCombination":"Press the key combination..."}');
;// ./src/utils/debug.ts
/* harmony default export */ const utils_debug = ({
  log: (...text) => {
    if (true) {
      return;
    }
    return console.log(
      "%c[VOT DEBUG]",
      "background: #F2452D; color: #fff; padding: 5px;",
      ...text,
    );
  },
});

;// ./src/config/config.js
// CONFIGURATION
const workerHost = "api.browser.yandex.ru";
/**
 * used for streaming
 *
 * @see https://github.com/FOSWLY/media-proxy
 */
const m3u8ProxyHost = "media-proxy.toil.cc/v1/proxy/m3u8";
/**
 * @see https://github.com/FOSWLY/vot-worker
 */
const proxyWorkerHost = "vot-worker.toil.cc";
const votBackendUrl = "https://vot.toil.cc/v1";
/**
 * @see https://github.com/FOSWLY/translate-backend
 */
const foswlyTranslateUrl = "https://translate.toil.cc/v2";
const detectRustServerUrl = "https://rust-server-531j.onrender.com/detect";

const repoPath = "ilyhalight/voice-over-translation";
const contentUrl = `https://raw.githubusercontent.com/${repoPath}`;
const repositoryUrl = `https://github.com/${repoPath}`;

/**
 * 0% - 100% - default volume of the video with the translation
 */
const defaultAutoVolume = 15;
/**
 * Max audio volume percentage (if available)
 */
const maxAudioVolume = 900;
/**
 * The number of repeated responses after which the message turns into "translation is delayed, please wait"
 */
const minLongWaitingCount = 5;
const defaultTranslationService = "yandexbrowser";
const defaultDetectService = "yandexbrowser";

const nonProxyExtensions = ["Tampermonkey", "Violentmonkey"];
const proxyOnlyCountries = ["UA", "LV", "LT"];



;// ./src/types/storage.ts






 






const storageKeys = [
  "autoTranslate",
  "dontTranslateLanguages",
  "enabledDontTranslateLanguages",
  "enabledAutoVolume",
  "autoVolume",
  "buttonPos",
  "showVideoSlider",
  "syncVolume",
  "downloadWithName",
  "sendNotifyOnComplete",
  "subtitlesMaxLength",
  "highlightWords",
  "subtitlesFontSize",
  "subtitlesOpacity",
  "subtitlesDownloadFormat",
  "responseLanguage",
  "defaultVolume",
  "onlyBypassMediaCSP",
  "newAudioPlayer",
  "showPiPButton",
  "translateAPIErrors",
  "translationService",
  "detectService",
  "translationHotkey",
  "m3u8ProxyHost",
  "proxyWorkerHost",
  "translateProxyEnabled",
  "translateProxyEnabledDefault",
  "audioBooster",
  "useNewModel",
  "autoHideButtonDelay",
  "localePhrases",
  "localeLang",
  "localeHash",
  "localeUpdatedAt",
  "localeLangOverride",
] ;

 



















































// EXTERNAL MODULE: ./node_modules/bowser/es5.js
var es5 = __webpack_require__("./node_modules/bowser/es5.js");
;// ./node_modules/@vot.js/shared/dist/data/consts.js
const availableLangs = [
    "auto",
    "ru",
    "en",
    "zh",
    "ko",
    "lt",
    "lv",
    "ar",
    "fr",
    "it",
    "es",
    "de",
    "ja",
];
const availableTTS = ["ru", "en", "kk"];
const subtitlesFormats = ["srt", "vtt", "json"];


;// ./src/utils/utils.js








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
const lang = userlang?.substring(0, 2).toLowerCase() || "en";
const calculatedResLang = (() => {
  if (availableTTS.includes(lang)) {
    return lang;
  }

  if (slavicLangs.includes(lang)) {
    return "ru";
  }

  return "en";
})();
const browserInfo = es5.getParser(
  window.navigator.userAgent,
).getResult();
const isProxyOnlyExtension =
  GM_info?.scriptHandler && !nonProxyExtensions.includes(GM_info.scriptHandler);
const isSupportGM4 = typeof GM !== "undefined";

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
        debug: false, // turn it on manually if necessary
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
 * Remove all banned characters from filename
 *
 * @param {string} filename
 * @return {string}
 */
function clearFileName(filename) {
  if (filename.trim().length === 0) {
    // generate a new filename
    return new Date().toLocaleDateString("en-us").replaceAll("/", "-");
  }

  return filename.replace(/[\\/:*?"'<>|]/g, "");
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
    utils_debug.log("GM_fetch preventing CORS by GM_xmlhttpRequest", err.message);

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
          // Response have empty url by default
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

function utils_getTimestamp() {
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

const isIframe = () => window.self !== window.top;
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



;// ./src/utils/storage.ts






async function convertData(
  data,
  option,
  oldValue,
  newValue,
  optionValue = undefined,
) {
  const optionVal = optionValue ?? data[option];
  if (optionVal !== oldValue) {
    return;
  }

  data[option] = newValue;
  await votStorage.set(option, newValue);
  console.log(`[VOT] Old ${option} converted to new ${newValue}`);
}

const votStorage = new (class {
  supportGM;
  supportGMPromises;
  supportGMGetValues;

  constructor() {
    this.supportGM = typeof GM_getValue === "function";
    this.supportGMPromises = isSupportGM4 && typeof GM?.getValue === "function";
    this.supportGMGetValues =
      isSupportGM4 && typeof GM?.getValues === "function";
    utils_debug.log(
      `[VOT Storage] GM Promises: ${this.supportGMPromises} | GM: ${this.supportGM}`,
    );
  }

  syncGet(name, def) {
    if (this.supportGM) {
      return GM_getValue(name, def);
    }

    let val = window.localStorage.getItem(name);
    if (!val) {
      return def ;
    }

    try {
      return JSON.parse(val);
    } catch {
      return def ;
    }
  }

  async get(name, def) {
    if (this.supportGMPromises) {
      return await GM.getValue(name, def);
    }

    return Promise.resolve(this.syncGet(name, def));
  }

  async getValues




(data) {
    if (this.supportGMGetValues) {
      return await GM.getValues(data);
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(data ).map(
          async ([key, value]) => {
            const val = await this.get(key , value);
            return [key, val];
          },
        ),
      ),
    );
  }

  syncSet(
    name,
    value,
  ) {
    if (this.supportGM) {
      return GM_setValue(name, value);
    }

    return window.localStorage.setItem(name, JSON.stringify(value));
  }

  async set(
    name,
    value,
  ) {
    if (this.supportGMPromises) {
      return await GM.setValue(name, value);
    }

    return Promise.resolve(this.syncSet(name, value));
  }

  syncDelete(name) {
    if (this.supportGM) {
      return GM_deleteValue(name);
    }

    return window.localStorage.removeItem(name);
  }

  async delete(name) {
    if (this.supportGMPromises) {
      return await GM.deleteValue(name);
    }

    return Promise.resolve(this.syncDelete(name));
  }

  syncList() {
    if (this.supportGM) {
      return GM_listValues();
    }

    return storageKeys;
  }

  async list() {
    if (this.supportGMPromises) {
      return await GM.listValues();
    }

    return Promise.resolve(this.syncList());
  }
})();

;// ./src/localization/localizationProvider.ts









class LocalizationProvider {
  storageKeys = [
    "localePhrases",
    "localeLang",
    "localeHash",
    "localeUpdatedAt",
    "localeLangOverride",
  ];
  /**
   * Language used before page was reloaded
   */
  lang;
  /**
   * Locale phrases with current language
   */
  locale;
  defaultLocale = toFlatObj(en_namespaceObject);

  cacheTTL = 7200;
  localizationUrl = `${contentUrl}/${"dev"}/src/localization`;

  constructor() {
    this.lang = this.getLang();
    this.locale = {};
    this.setLocaleFromJsonString(votStorage.syncGet("localePhrases", ""));
  }

  getLangOverride() {
    return votStorage.syncGet("localeLangOverride", "auto");
  }

  getLang() {
    const langOverride = this.getLangOverride();
    return langOverride !== "auto" ? langOverride : lang;
  }

  getAvailableLangs() {
    return ["auto","en","ru","af","am","ar","az","bg","bn","bs","ca","cs","cy","da","de","el","es","et","eu","fa","fi","fr","gl","hi","hr","hu","hy","id","it","ja","jv","kk","km","kn","ko","lo","mk","ml","mn","ms","mt","my","ne","nl","pa","pl","pt","ro","si","sk","sl","sq","sr","su","sv","sw","tr","uk","ur","uz","vi","zh","zu"];
  }

  reset() {
    for (const key of this.storageKeys) {
      votStorage.syncDelete(key);
    }
  }

   buildUrl(path, force = false) {
    const query = force ? `?timestamp=${utils_getTimestamp()}` : "";
    return `${this.localizationUrl}${path}${query}`;
  }

  async checkUpdates(force = false) {
    utils_debug.log("Check locale updates...");
    try {
      const res = await GM_fetch(this.buildUrl("/hashes.json", force));
      if (!res.ok) throw res.status;
      const hashes = await res.json();
      return (await votStorage.get("localeHash")) !== hashes[this.lang]
        ? hashes[this.lang]
        : false;
    } catch (err) {
      console.error(
        "[VOT] [localizationProvider] Failed to get locales hash:",
        err,
      );
      return false;
    }
  }

  async update(force = false) {
    const localeUpdatedAt = await votStorage.get("localeUpdatedAt", 0);
    if (
      !force &&
      localeUpdatedAt + this.cacheTTL > utils_getTimestamp() &&
      (await votStorage.get("localeLang")) === this.lang
    )
      return;

    const hash = await this.checkUpdates(force);
    await votStorage.set("localeUpdatedAt", utils_getTimestamp());
    if (!hash) return;

    utils_debug.log("Updating locale...");
    try {
      const res = await GM_fetch(
        this.buildUrl(`/locales/${this.lang}.json`, force),
      );
      if (!res.ok) throw res.status;
      // We use it .text() in order for there to be a single logic for GM_Storage and localStorage
      const text = await res.text();
      await votStorage.set("localePhrases", text);
      await votStorage.set("localeHash", hash);
      await votStorage.set("localeLang", this.lang);
      this.setLocaleFromJsonString(text);
    } catch (err) {
      console.error("[VOT] [localizationProvider] Failed to get locale:", err);
      this.setLocaleFromJsonString(await votStorage.get("localePhrases", ""));
    }
  }

  setLocaleFromJsonString(json) {
    try {
      const locale = JSON.parse(json) || {};
      this.locale = toFlatObj(locale);
    } catch (err) {
      console.error("[VOT] [localizationProvider]", err);
      this.locale = {};
    }
  }

  getFromLocale(locale, key) {
    return locale?.[key] ?? this.warnMissingKey(locale, key);
  }

  warnMissingKey(locale, key) {
    console.warn(
      "[VOT] [localizationProvider] locale",
      locale,
      "doesn't contain key",
      key,
    );
    return undefined;
  }

  getDefault(key) {
    return this.getFromLocale(this.defaultLocale, key) ?? key;
  }

  get(key) {
    return this.getFromLocale(this.locale, key) ?? this.getDefault(key);
  }
}

const localizationProvider = new LocalizationProvider();

;// ./src/utils/VOTLocalizedError.js


class VOTLocalizedError extends Error {
  constructor(message) {
    super(localizationProvider.getDefault(message));
    this.name = "VOTLocalizedError";
    this.unlocalizedMessage = message;
    this.localizedMessage = localizationProvider.get(message);
  }
}

;// ./node_modules/@vot.js/core/dist/client.js









class VOTJSError extends Error {
    data;
    constructor(message, data = undefined) {
        super(message);
        this.data = data;
        this.name = "VOTJSError";
        this.message = message;
    }
}
class MinimalClient {
    host;
    schema;
    fetch;
    fetchOpts;
    sessions = {};
    userAgent = data_config.userAgent;
    headers = {
        "User-Agent": this.userAgent,
        Accept: "application/x-protobuf",
        "Accept-Language": "en",
        "Content-Type": "application/x-protobuf",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
    };
    hostSchemaRe = /(http(s)?):\/\//;
    constructor({ host = data_config.host, fetchFn = fetchWithTimeout, fetchOpts = {}, headers = {}, } = {}) {
        const schema = this.hostSchemaRe.exec(host)?.[1];
        this.host = schema ? host.replace(`${schema}://`, "") : host;
        this.schema = schema ?? "https";
        this.fetch = fetchFn;
        this.fetchOpts = fetchOpts;
        this.headers = { ...this.headers, ...headers };
    }
    async request(path, body, headers = {}, method = "POST") {
        const options = this.getOpts(new Blob([body]), headers, method);
        try {
            const res = await this.fetch(`${this.schema}://${this.host}${path}`, options);
            const data = (await res.arrayBuffer());
            return {
                success: res.status === 200,
                data,
            };
        }
        catch (err) {
            return {
                success: false,
                data: err?.message,
            };
        }
    }
    async requestJSON(path, body = null, headers = {}, method = "POST") {
        const options = this.getOpts(body, {
            "Content-Type": "application/json",
            ...headers,
        }, method);
        try {
            const res = await this.fetch(`${this.schema}://${this.host}${path}`, options);
            const data = (await res.json());
            return {
                success: res.status === 200,
                data,
            };
        }
        catch (err) {
            return {
                success: false,
                data: err?.message,
            };
        }
    }
    getOpts(body, headers = {}, method = "POST") {
        return {
            method,
            headers: {
                ...this.headers,
                ...headers,
            },
            body,
            ...this.fetchOpts,
        };
    }
    async getSession(module) {
        const timestamp = getTimestamp();
        const session = this.sessions[module];
        if (session && session.timestamp + session.expires > timestamp) {
            return session;
        }
        const { secretKey, expires, uuid } = await this.createSession(module);
        this.sessions[module] = {
            secretKey,
            expires,
            timestamp,
            uuid,
        };
        return this.sessions[module];
    }
    async createSession(module) {
        const uuid = getUUID();
        const body = YandexSessionProtobuf.encodeSessionRequest(uuid, module);
        const res = await this.request("/session/create", body, {
            "Vtrans-Signature": await getSignature(body),
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request create session", res);
        }
        const sessionResponse = YandexSessionProtobuf.decodeSessionResponse(res.data);
        return {
            ...sessionResponse,
            uuid,
        };
    }
}
class client_VOTClient extends MinimalClient {
    hostVOT;
    schemaVOT;
    requestLang;
    responseLang;
    paths = {
        videoTranslation: "/video-translation/translate",
        videoTranslationFailAudio: "/video-translation/fail-audio-js",
        videoTranslationAudio: "/video-translation/audio",
        videoTranslationCache: "/video-translation/cache",
        videoSubtitles: "/video-subtitles/get-subtitles",
        streamPing: "/stream-translation/ping-stream",
        streamTranslation: "/stream-translation/translate-stream",
    };
    isCustomLink(url) {
        return !!(/\.(m3u8|m4(a|v)|mpd)/.exec(url) ??
            /^https:\/\/cdn\.qstv\.on\.epicgames\.com/.exec(url));
    }
    headersVOT = {
        "User-Agent": `vot.js/${data_config.version}`,
        "Content-Type": "application/json",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
    };
    constructor({ host, hostVOT = data_config.hostVOT, fetchFn, fetchOpts, requestLang = "en", responseLang = "ru", headers, } = {}) {
        super({
            host,
            fetchFn,
            fetchOpts,
            headers,
        });
        const schemaVOT = this.hostSchemaRe.exec(hostVOT)?.[1];
        this.hostVOT = schemaVOT ? hostVOT.replace(`${schemaVOT}://`, "") : hostVOT;
        this.schemaVOT = schemaVOT ?? "https";
        this.requestLang = requestLang;
        this.responseLang = responseLang;
    }
    async requestVOT(path, body, headers = {}) {
        const options = this.getOpts(JSON.stringify(body), {
            ...this.headersVOT,
            ...headers,
        });
        try {
            const res = await this.fetch(`${this.schemaVOT}://${this.hostVOT}${path}`, options);
            const data = (await res.json());
            return {
                success: res.status === 200,
                data,
            };
        }
        catch (err) {
            return {
                success: false,
                data: err?.message,
            };
        }
    }
    async translateVideoYAImpl({ videoData, requestLang = this.requestLang, responseLang = this.responseLang, translationHelp = null, headers = {}, extraOpts = {}, shouldSendFailedAudio = true, }) {
        const { url, duration = data_config.defaultDuration } = videoData;
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeTranslationRequest(url, duration, requestLang, responseLang, translationHelp, extraOpts);
        const path = this.paths.videoTranslation;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTLocalizedError("requestTranslationFailed");
        }
        const translationData = YandexVOTProtobuf.decodeTranslationResponse(res.data);
        console.log(translationData);
        Logger.log("translateVideo", translationData);
        const { status, translationId, } = translationData;
        switch (status) {
            case VideoTranslationStatus.FAILED:
                throw translationData?.message ? new VOTJSError("Yandex couldn't translate video", translationData) : new VOTLocalizedError("requestTranslationFailed");
            case VideoTranslationStatus.FINISHED:
            case VideoTranslationStatus.PART_CONTENT:
                if (!translationData.url) {
                    throw new VOTLocalizedError("audioNotReceived");
                }
                return {
                    translationId,
                    translated: true,
                    url: translationData.url,
                    status,
                    remainingTime: translationData.remainingTime ?? -1,
                };
            case VideoTranslationStatus.WAITING:
            case VideoTranslationStatus.LONG_WAITING:
                return {
                    translationId,
                    translated: false,
                    status,
                    remainingTime: translationData.remainingTime,
                };
            case VideoTranslationStatus.AUDIO_REQUESTED:
                if (url.startsWith("https://youtu.be/") && shouldSendFailedAudio) {
                    await this.requestVtransFailAudio(url);
                    await this.requestVtransAudio(url, translationData.translationId, {
                        audioFile: new Uint8Array(),
                        fileId: AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
                    });
                    return await this.translateVideoYAImpl({
                        videoData,
                        requestLang,
                        responseLang,
                        translationHelp,
                        headers,
                        shouldSendFailedAudio: false,
                    });
                }
                return {
                    translationId,
                    translated: false,
                    status,
                    remainingTime: translationData.remainingTime ?? -1,
                };
            case VideoTranslationStatus.SESSION_REQUIRED:
                throw new VOTJSError("Yandex account required to translate video", translationData);
            default:
                Logger.error("Unknown response", translationData);
                throw new VOTJSError("Unknown response from Yandex", translationData);
        }
    }
    async translateVideoVOTImpl({ url, videoId, service, requestLang = this.requestLang, responseLang = this.responseLang, headers = {}, }) {
        const votData = convertVOT(service, videoId, url);
        const res = await this.requestVOT(this.paths.videoTranslation, {
            provider: "yandex",
            service: votData.service,
            video_id: votData.videoId,
            from_lang: requestLang,
            to_lang: responseLang,
            raw_video: url,
        }, {
            ...headers,
        });
        if (!res.success) {
            throw new VOTLocalizedError("requestTranslationFailed");
        }
        const translationData = res.data;
        switch (translationData.status) {
            case "failed":
                throw new VOTJSError("Yandex couldn't translate video", translationData);
            case "success":
                if (!translationData.translated_url) {
                    throw new VOTLocalizedError("audioNotReceived");
                }
                return {
                    translationId: String(translationData.id),
                    translated: true,
                    url: translationData.translated_url,
                    status: 1,
                    remainingTime: -1,
                };
            case "waiting":
                return {
                    translationId: "",
                    translated: false,
                    remainingTime: translationData.remaining_time,
                    status: 2,
                    message: translationData.message,
                };
        }
    }
    async requestVtransFailAudio(url) {
        const res = await this.requestJSON(this.paths.videoTranslationFailAudio, JSON.stringify({
            video_url: url,
        }), undefined, "PUT");
        if (!res.data || typeof res.data === "string" || res.data.status !== 1) {
            throw new VOTJSError("Failed to request to fake video translation fail audio js", res);
        }
        return res;
    }
    async requestVtransAudio(url, translationId, audioBuffer, partialAudio, headers = {}) {
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeTranslationAudioRequest(url, translationId, audioBuffer, partialAudio);
        const path = this.paths.videoTranslationAudio;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        }, "PUT");
        if (!res.success) {
            throw new VOTJSError("Failed to request video translation audio", res);
        }
        return YandexVOTProtobuf.decodeTranslationAudioResponse(res.data);
    }
    async translateVideoCache({ videoData, requestLang = this.requestLang, responseLang = this.responseLang, headers = {}, }) {
        const { url, duration = data_config.defaultDuration } = videoData;
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeTranslationCacheRequest(url, duration, requestLang, responseLang);
        const path = this.paths.videoTranslationCache;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        }, "POST");
        if (!res.success) {
            throw new VOTJSError("Failed to request video translation cache", res);
        }
        return YandexVOTProtobuf.decodeTranslationCacheResponse(res.data);
    }
    async translateVideo({ videoData, requestLang = this.requestLang, responseLang = this.responseLang, translationHelp = null, headers = {}, extraOpts = {}, shouldSendFailedAudio = true, }) {
        const { url, videoId, host } = videoData;
        return this.isCustomLink(url)
            ? await this.translateVideoVOTImpl({
                url,
                videoId,
                service: host,
                requestLang,
                responseLang,
                headers,
            })
            : await this.translateVideoYAImpl({
                videoData,
                requestLang,
                responseLang,
                translationHelp,
                headers,
                extraOpts,
                shouldSendFailedAudio,
            });
    }
    async getSubtitlesYAImpl({ videoData, requestLang = this.requestLang, headers = {}, }) {
        const { url } = videoData;
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeSubtitlesRequest(url, requestLang);
        const path = this.paths.videoSubtitles;
        const vsubsHeaders = await getSecYaHeaders("Vsubs", session, body, path);
        const res = await this.request(path, body, {
            ...vsubsHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request video subtitles", res);
        }
        const subtitlesData = YandexVOTProtobuf.decodeSubtitlesResponse(res.data);
        const subtitles = subtitlesData.subtitles.map((subtitle) => {
            const { language, url, translatedLanguage, translatedUrl } = subtitle;
            return {
                language,
                url,
                translatedLanguage,
                translatedUrl,
            };
        });
        return {
            waiting: subtitlesData.waiting,
            subtitles,
        };
    }
    async getSubtitlesVOTImpl({ url, videoId, service, headers = {}, }) {
        const votData = convertVOT(service, videoId, url);
        const res = await this.requestVOT(this.paths.videoSubtitles, {
            provider: "yandex",
            service: votData.service,
            video_id: votData.videoId,
        }, headers);
        if (!res.success) {
            throw new VOTJSError("Failed to request video subtitles", res);
        }
        const subtitlesData = res.data;
        const subtitles = subtitlesData.reduce((result, subtitle) => {
            if (!subtitle.lang_from) {
                return result;
            }
            const originalSubtitle = subtitlesData.find((sub) => sub.lang === subtitle.lang_from);
            if (!originalSubtitle) {
                return result;
            }
            result.push({
                language: originalSubtitle.lang,
                url: originalSubtitle.subtitle_url,
                translatedLanguage: subtitle.lang,
                translatedUrl: subtitle.subtitle_url,
            });
            return result;
        }, []);
        return {
            waiting: false,
            subtitles,
        };
    }
    async getSubtitles({ videoData, requestLang = this.requestLang, headers = {}, }) {
        const { url, videoId, host } = videoData;
        return this.isCustomLink(url)
            ? await this.getSubtitlesVOTImpl({
                url,
                videoId,
                service: host,
                headers,
            })
            : await this.getSubtitlesYAImpl({
                videoData,
                requestLang,
                headers,
            });
    }
    async pingStream({ pingId, headers = {} }) {
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeStreamPingRequest(pingId);
        const path = this.paths.streamPing;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request stream ping", res);
        }
        return true;
    }
    async translateStream({ videoData, requestLang = this.requestLang, responseLang = this.responseLang, headers = {}, }) {
        const { url } = videoData;
        if (this.isCustomLink(url)) {
            throw new VOTLocalizedError("VOTStreamNotSupportedUrl");
        }
        const session = await this.getSession("video-translation");
        const body = YandexVOTProtobuf.encodeStreamRequest(url, requestLang, responseLang);
        const path = this.paths.streamTranslation;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request stream translation", res);
        }
        const translateResponse = YandexVOTProtobuf.decodeStreamResponse(res.data);
        const interval = translateResponse.interval;
        switch (interval) {
            case StreamInterval.NO_CONNECTION:
            case StreamInterval.TRANSLATING:
                return {
                    translated: false,
                    interval,
                    message: interval === StreamInterval.NO_CONNECTION
                        ? "streamNoConnectionToServer"
                        : "translationTakeFewMinutes",
                };
            case StreamInterval.STREAMING: {
                return {
                    translated: true,
                    interval,
                    pingId: translateResponse.pingId,
                    result: translateResponse.translatedInfo,
                };
            }
            default:
                Logger.error("Unknown response", translateResponse);
                throw new VOTJSError("Unknown response from Yandex", translateResponse);
        }
    }
}
class client_VOTWorkerClient extends client_VOTClient {
    constructor(opts = {}) {
        opts.host = opts.host ?? data_config.hostWorker;
        super(opts);
    }
    async request(path, body, headers = {}, method = "POST") {
        const options = this.getOpts(JSON.stringify({
            headers: {
                ...this.headers,
                ...headers,
            },
            body: Array.from(body),
        }), {
            "Content-Type": "application/json",
        }, method);
        try {
            const res = await this.fetch(`${this.schema}://${this.host}${path}`, options);
            const data = (await res.arrayBuffer());
            return {
                success: res.status === 200,
                data,
            };
        }
        catch (err) {
            return {
                success: false,
                data: err?.message,
            };
        }
    }
    async requestJSON(path, body = null, headers = {}, method = "POST") {
        const options = this.getOpts(JSON.stringify({
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
                Accept: "application/json",
                ...headers,
            },
            body,
        }), {
            Accept: "application/json",
            "Content-Type": "application/json",
        }, method);
        try {
            const res = await this.fetch(`${this.schema}://${this.host}${path}`, options);
            const data = (await res.json());
            return {
                success: res.status === 200,
                data,
            };
        }
        catch (err) {
            return {
                success: false,
                data: err?.message,
            };
        }
    }
}

;// ./node_modules/@vot.js/ext/dist/client.js


class VOTClient extends client_VOTClient {
    constructor(opts) {
        super(opts);
        this.headers = {
            ...browserSecHeaders,
            ...this.headers,
        };
    }
}
class VOTWorkerClient extends client_VOTWorkerClient {
    constructor(opts) {
        super(opts);
        this.headers = {
            ...browserSecHeaders,
            ...this.headers,
        };
    }
}

;// ./node_modules/@vot.js/core/dist/utils/videoData.js
class VideoDataError extends Error {
    constructor(message) {
        super(message);
        this.name = "VideoDataError";
        this.message = message;
    }
}
const localLinkRe = /(file:\/\/(\/)?|(http(s)?:\/\/)(127\.0\.0\.1|localhost|192\.168\.(\d){1,3}\.(\d){1,3}))/;

;// ./node_modules/@vot.js/shared/dist/data/alternativeUrls.js
const sitesInvidious = [
    "yewtu.be",
    "yt.artemislena.eu",
    "invidious.flokinet.to",
    "iv.melmac.space",
    "inv.nadeko.net",
    "inv.tux.pizza",
    "invidious.private.coffee",
    "yt.drgnz.club",
    "vid.puffyan.us",
    "invidious.dhusch.de",
];
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
const sitesProxiTok = [
    "proxitok.pabloferreiro.es",
    "proxitok.pussthecat.org",
    "tok.habedieeh.re",
    "proxitok.esmailelbob.xyz",
    "proxitok.privacydev.net",
    "tok.artemislena.eu",
    "tok.adminforge.de",
    "tt.vern.cc",
    "cringe.whatever.social",
    "proxitok.lunar.icu",
    "proxitok.privacy.com.de",
];
const sitesPeertube = [
    "peertube.1312.media",
    "tube.shanti.cafe",
    "bee-tube.fr",
    "video.sadmin.io",
    "dalek.zone",
    "review.peertube.biz",
    "peervideo.club",
    "tube.la-dina.net",
    "peertube.tmp.rcp.tf",
    "peertube.su",
    "video.blender.org",
    "videos.viorsan.com",
    "tube-sciences-technologies.apps.education.fr",
    "tube-numerique-educatif.apps.education.fr",
    "tube-arts-lettres-sciences-humaines.apps.education.fr",
    "beetoons.tv",
    "comics.peertube.biz",
    "makertube.net",
];
const sitesPoketube = [
    "poketube.fun",
    "pt.sudovanilla.org",
    "poke.ggtyler.dev",
    "poke.uk2.littlekai.co.uk",
    "poke.blahai.gay",
];
const sitesRicktube = ["ricktube.ru"];
const sitesMaterialious = (/* unused pure expression or super */ null && ([
    "materialious.nadeko.net",
    "app.materialio.us",
]));
const sitesCoursehunterLike = ["coursehunter.net", "coursetrain.net"];


;// ./node_modules/@vot.js/ext/dist/types/service.js

var ExtVideoService;
(function (ExtVideoService) {
    ExtVideoService["udemy"] = "udemy";
    ExtVideoService["coursera"] = "coursera";
    ExtVideoService["douyin"] = "douyin";
    ExtVideoService["artstation"] = "artstation";
    ExtVideoService["kickstarter"] = "kickstarter";
})(ExtVideoService || (ExtVideoService = {}));
const service_VideoService = {
    ...VideoService,
    ...ExtVideoService,
};

;// ./node_modules/@vot.js/ext/dist/data/sites.js



/* harmony default export */ const sites = ([
    {
        additionalData: "mobile",
        host: VideoService.youtube,
        url: "https://youtu.be/",
        match: /^m.youtube.com$/,
        selector: ".player-container",
        needExtraData: true,
    },
    {
        host: VideoService.youtube,
        url: "https://youtu.be/",
        match: /^(www.)?youtube(-nocookie|kids)?.com$/,
        selector: ".html5-video-container:not(#inline-player *)",
        needExtraData: true,
    },
    {
        host: VideoService.invidious,
        url: "https://youtu.be/",
        match: sitesInvidious,
        selector: "#player",
        needBypassCSP: true,
    },
    {
        host: VideoService.piped,
        url: "https://youtu.be/",
        match: sitesPiped,
        selector: ".shaka-video-container",
        needBypassCSP: true,
    },
    {
        host: VideoService.poketube,
        url: "https://youtu.be/",
        match: sitesPoketube,
        selector: ".video-player-container",
    },
    {
        host: VideoService.ricktube,
        url: "https://youtu.be/",
        match: sitesRicktube,
        selector: "#oframeplayer > pjsdiv:has(video)",
    },
    {
        additionalData: "mobile",
        host: VideoService.vk,
        url: "https://vk.com/video?z=",
        match: [/^m.vk.(com|ru)$/, /^m.vkvideo.ru$/],
        selector: "vk-video-player",
        shadowRoot: true,
        needExtraData: true,
    },
    {
        additionalData: "clips",
        host: VideoService.vk,
        url: "https://vk.com/video?z=",
        match: /^(www.|m.)?vk.(com|ru)$/,
        selector: 'div[data-testid="clipcontainer-video"]',
        needExtraData: true,
    },
    {
        host: VideoService.vk,
        url: "https://vk.com/video?z=",
        match: [/^(www.|m.)?vk.(com|ru)$/, /^(www.|m.)?vkvideo.ru$/],
        selector: ".videoplayer_media",
        needExtraData: true,
    },
    {
        host: VideoService.nine_gag,
        url: "https://9gag.com/gag/",
        match: /^9gag.com$/,
        selector: ".video-post",
    },
    {
        host: VideoService.twitch,
        url: "https://twitch.tv/",
        match: [
            /^m.twitch.tv$/,
            /^(www.)?twitch.tv$/,
            /^clips.twitch.tv$/,
            /^player.twitch.tv$/,
        ],
        needExtraData: true,
        selector: ".video-ref, main > div > section > div > div > div",
    },
    {
        host: VideoService.proxitok,
        url: "https://www.tiktok.com/",
        match: sitesProxiTok,
        selector: ".column.has-text-centered",
    },
    {
        host: VideoService.tiktok,
        url: "https://www.tiktok.com/",
        match: /^(www.)?tiktok.com$/,
        selector: null,
    },
    {
        host: ExtVideoService.douyin,
        url: "https://www.douyin.com/",
        match: /^(www.)?douyin.com/,
        selector: ".xg-video-container",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: VideoService.vimeo,
        url: "https://vimeo.com/",
        match: /^vimeo.com$/,
        needExtraData: true,
        selector: ".player",
    },
    {
        host: VideoService.vimeo,
        url: "https://player.vimeo.com/",
        match: /^player.vimeo.com$/,
        additionalData: "embed",
        needExtraData: true,
        needBypassCSP: true,
        selector: ".player",
    },
    {
        host: VideoService.xvideos,
        url: "https://www.xvideos.com/",
        match: [
            /^(www.)?xvideos(-ar)?.com$/,
            /^(www.)?xvideos(\d\d\d).com$/,
            /^(www.)?xv-ru.com$/,
        ],
        selector: "#hlsplayer",
        needBypassCSP: true,
    },
    {
        host: VideoService.pornhub,
        url: "https://rt.pornhub.com/view_video.php?viewkey=",
        match: /^[a-z]+.pornhub.(com|org)$/,
        selector: ".mainPlayerDiv > .video-element-wrapper-js > div",
        eventSelector: ".mgp_eventCatcher",
    },
    {
        additionalData: "embed",
        host: VideoService.pornhub,
        url: "https://rt.pornhub.com/view_video.php?viewkey=",
        match: (url) => /^[a-z]+.pornhub.(com|org)$/.exec(url.host) &&
            url.pathname.startsWith("/embed/"),
        selector: "#player",
    },
    {
        host: VideoService.twitter,
        url: "https://twitter.com/i/status/",
        match: /^(twitter|x).com$/,
        selector: 'div[data-testid="videoComponent"] > div:nth-child(1) > div',
        eventSelector: 'div[data-testid="videoPlayer"]',
        needBypassCSP: true,
    },
    {
        host: VideoService.rumble,
        url: "https://rumble.com/",
        match: /^rumble.com$/,
        selector: "#videoPlayer > .videoPlayer-Rumble-cls > div",
    },
    {
        host: VideoService.facebook,
        url: "https://facebook.com/",
        match: (url) => url.host.includes("facebook.com") && url.pathname.includes("/videos/"),
        selector: 'div[role="main"] div[data-pagelet$="video" i]',
        needBypassCSP: true,
    },
    {
        additionalData: "reels",
        host: VideoService.facebook,
        url: "https://facebook.com/",
        match: (url) => url.host.includes("facebook.com") && url.pathname.includes("/reel/"),
        selector: 'div[role="main"]',
        needBypassCSP: true,
    },
    {
        host: VideoService.rutube,
        url: "https://rutube.ru/video/",
        match: /^rutube.ru$/,
        selector: ".video-player > div > div > div:nth-child(2)",
    },
    {
        additionalData: "embed",
        host: VideoService.rutube,
        url: "https://rutube.ru/video/",
        match: /^rutube.ru$/,
        selector: "#app > div > div",
    },
    {
        host: VideoService.bilibili,
        url: "https://www.bilibili.com/",
        match: /^(www|m|player).bilibili.com$/,
        selector: ".bpx-player-video-wrap",
    },
    {
        additionalData: "old",
        host: VideoService.bilibili,
        url: "https://www.bilibili.com/",
        match: /^(www|m).bilibili.com$/,
        selector: null,
    },
    {
        host: VideoService.mailru,
        url: "https://my.mail.ru/",
        match: /^my.mail.ru$/,
        selector: "#b-video-wrapper",
    },
    {
        host: VideoService.bitchute,
        url: "https://www.bitchute.com/video/",
        match: /^(www.)?bitchute.com$/,
        selector: ".video-js",
    },
    {
        host: VideoService.eporner,
        url: "https://www.eporner.com/",
        match: /^(www.)?eporner.com$/,
        selector: ".vjs-v7",
    },
    {
        host: VideoService.peertube,
        url: "stub",
        match: sitesPeertube,
        selector: ".vjs-v7",
    },
    {
        host: VideoService.dailymotion,
        url: "https://dai.ly/",
        match: /^geo([\d]+)?.dailymotion.com$/,
        selector: ".player",
    },
    {
        host: VideoService.trovo,
        url: "https://trovo.live/s/",
        match: /^trovo.live$/,
        selector: ".player-video",
    },
    {
        host: VideoService.yandexdisk,
        url: "https://yadi.sk/",
        match: /^disk.yandex.(ru|kz|com(\.(am|ge|tr))?|by|az|co\.il|ee|lt|lv|md|net|tj|tm|uz)$/,
        selector: ".video-player__player > div:nth-child(1)",
        eventSelector: ".video-player__player",
        needBypassCSP: true,
        needExtraData: true,
    },
    {
        host: VideoService.okru,
        url: "https://ok.ru/video/",
        match: /^ok.ru$/,
        selector: "vk-video-player",
        shadowRoot: true,
    },
    {
        host: VideoService.googledrive,
        url: "https://drive.google.com/file/d/",
        match: /^youtube.googleapis.com$/,
        selector: ".html5-video-container",
    },
    {
        host: VideoService.bannedvideo,
        url: "https://madmaxworld.tv/watch?id=",
        match: /^(www.)?banned.video|madmaxworld.tv$/,
        selector: ".vjs-v7",
        needExtraData: true,
    },
    {
        host: VideoService.weverse,
        url: "https://weverse.io/",
        match: /^weverse.io$/,
        selector: ".webplayer-internal-source-wrapper",
        needExtraData: true,
    },
    {
        host: VideoService.newgrounds,
        url: "https://www.newgrounds.com/",
        match: /^(www.)?newgrounds.com$/,
        selector: ".ng-video-player",
    },
    {
        host: VideoService.egghead,
        url: "https://egghead.io/",
        match: /^egghead.io$/,
        selector: ".cueplayer-react-video-holder",
    },
    {
        host: VideoService.youku,
        url: "https://v.youku.com/",
        match: /^v.youku.com$/,
        selector: "#ykPlayer",
    },
    {
        host: VideoService.archive,
        url: "https://archive.org/details/",
        match: /^archive.org$/,
        selector: ".jw-media",
    },
    {
        host: VideoService.kodik,
        url: "stub",
        match: /^kodik.(info|biz|cc)$/,
        selector: ".fp-player",
        needExtraData: true,
    },
    {
        host: VideoService.patreon,
        url: "stub",
        match: /^(www.)?patreon.com$/,
        selector: 'div[data-tag="post-card"] div[elevation="subtle"] > div > div > div > div',
        needExtraData: true,
    },
    {
        additionalData: "old",
        host: VideoService.reddit,
        url: "stub",
        match: /^old.reddit.com$/,
        selector: ".reddit-video-player-root",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: VideoService.reddit,
        url: "stub",
        match: /^(www.|new.)?reddit.com$/,
        selector: "div[slot=post-media-container]",
        shadowRoot: true,
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: VideoService.kick,
        url: "https://kick.com/",
        match: /^kick.com$/,
        selector: "#injected-embedded-channel-player-video > div",
        needExtraData: true,
    },
    {
        host: VideoService.appledeveloper,
        url: "https://developer.apple.com/",
        match: /^developer.apple.com$/,
        selector: ".developer-video-player",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: VideoService.epicgames,
        url: "https://dev.epicgames.com/community/learning/",
        match: /^dev.epicgames.com$/,
        selector: ".vjs-v7",
        needExtraData: true,
    },
    {
        host: VideoService.odysee,
        url: "stub",
        match: /^odysee.com$/,
        selector: ".vjs-v7",
        needExtraData: true,
    },
    {
        host: VideoService.coursehunterLike,
        url: "stub",
        match: sitesCoursehunterLike,
        selector: "#oframeplayer > pjsdiv:has(video)",
        needExtraData: true,
    },
    {
        host: VideoService.sap,
        url: "https://learning.sap.com/courses/",
        match: /^learning.sap.com$/,
        selector: ".playkit-container",
        eventSelector: ".playkit-player",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: ExtVideoService.udemy,
        url: "https://www.udemy.com/",
        match: /udemy.com$/,
        selector: 'div[data-purpose="curriculum-item-viewer-content"] > section > div > div > div > div:nth-of-type(2)',
        needExtraData: true,
    },
    {
        host: ExtVideoService.coursera,
        url: "https://www.coursera.org/",
        match: /coursera.org$/,
        selector: ".vjs-v8",
        needExtraData: true,
    },
    {
        host: VideoService.watchpornto,
        url: "https://watchporn.to/",
        match: /^watchporn.to$/,
        selector: ".fp-player",
    },
    {
        host: VideoService.linkedin,
        url: "https://www.linkedin.com/learning/",
        match: /^(www.)?linkedin.com$/,
        selector: ".vjs-v7",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: VideoService.incestflix,
        url: "https://www.incestflix.net/watch/",
        match: /^(www.)?incestflix.(net|to|com)$/,
        selector: "#incflix-stream",
        needExtraData: true,
    },
    {
        host: VideoService.porntn,
        url: "https://porntn.com/videos/",
        match: /^porntn.com$/,
        selector: ".fp-player",
        needExtraData: true,
    },
    {
        host: VideoService.dzen,
        url: "https://dzen.ru/video/watch/",
        match: /^dzen.ru$/,
        selector: ".zen-ui-video-video-player",
    },
    {
        host: VideoService.cloudflarestream,
        url: "stub",
        match: /^(watch|embed|iframe|customer-[^.]+).cloudflarestream.com$/,
        selector: null,
    },
    {
        host: VideoService.loom,
        url: "https://www.loom.com/share/",
        match: /^(www.)?loom.com$/,
        selector: ".VideoLayersContainer",
        needExtraData: true,
        needBypassCSP: true,
    },
    {
        host: ExtVideoService.artstation,
        url: "https://www.artstation.com/learning/",
        match: /^(www.)?artstation.com$/,
        selector: ".vjs-v7",
        needExtraData: true,
    },
    {
        host: VideoService.rtnews,
        url: "https://www.rt.com/",
        match: /^(www.)?rt.com$/,
        selector: ".jw-media",
        needExtraData: true,
    },
    {
        host: VideoService.bitview,
        url: "https://www.bitview.net/watch?v=",
        match: /^(www.)?bitview.net$/,
        selector: ".vlScreen",
        needExtraData: true,
    },
    {
        host: ExtVideoService.kickstarter,
        url: "https://www.kickstarter.com/",
        match: /^(www.)?kickstarter.com/,
        selector: ".ksr-video-player",
        needExtraData: true,
    },
    {
        host: VideoService.thisvid,
        url: "https://thisvid.com/",
        match: /^(www.)?thisvid.com$/,
        selector: ".fp-player",
    },
    {
        additionalData: "regional",
        host: VideoService.ign,
        url: "https://de.ign.com/",
        match: /^(\w{2}.)?ign.com$/,
        needExtraData: true,
        selector: ".video-container",
    },
    {
        host: VideoService.ign,
        url: "https://www.ign.com/",
        match: /^(www.)?ign.com$/,
        selector: ".player",
        needExtraData: true,
    },
    {
        host: VideoService.bunkr,
        url: "https://bunkr.site/",
        match: /^bunkr.(site|black|cat|media|red|site|ws|org|s[kiu]|c[ir]|fi|p[hks]|ru|la|is|to|a[cx])$/,
        needExtraData: true,
        selector: ".plyr__video-wrapper",
    },
    {
        host: VideoService.imdb,
        url: "https://www.imdb.com/video/",
        match: /^(www.)?imdb.com$/,
        selector: ".jw-media",
    },
    {
        host: VideoService.telegram,
        url: "https://t.me/",
        match: (url) => /^web.telegram.org$/.test(url.hostname) && url.pathname.startsWith("/k"),
        selector: ".ckin__player",
    },
    {
        host: VideoService.custom,
        url: "stub",
        match: (url) => /([^.]+).(mp4|webm)/.test(url.pathname),
        rawResult: true,
    },
]);

;// ./node_modules/@vot.js/ext/dist/helpers/base.js

class VideoHelperError extends Error {
    constructor(message) {
        super(message);
        this.name = "VideoHelper";
        this.message = message;
    }
}
class BaseHelper {
    API_ORIGIN = window.location.origin;
    fetch;
    extraInfo;
    referer;
    origin;
    service;
    video;
    language;
    constructor({ fetchFn = fetchWithTimeout, extraInfo = true, referer = document.referrer ?? window.location.origin + "/", origin = window.location.origin, service, video, language = "en", } = {}) {
        this.fetch = fetchFn;
        this.extraInfo = extraInfo;
        this.referer = referer;
        this.origin = /^(http(s)?):\/\//.test(String(origin))
            ? origin
            : window.location.origin;
        this.service = service;
        this.video = video;
        this.language = language;
    }
    async getVideoData(videoId) {
        return undefined;
    }
    async getVideoId(url) {
        return undefined;
    }
    returnBaseData(videoId) {
        if (!this.service) {
            return undefined;
        }
        return {
            url: this.service.url + videoId,
            videoId,
            host: this.service.host,
            duration: undefined,
        };
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/mailru.js


class MailRuHelper extends BaseHelper {
    API_ORIGIN = "https://my.mail.ru";
    async getVideoMeta(videoId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/+/video/meta/${videoId}?xemail=&ajax_call=1&func_name=&mna=&mnb=&ext=1&_=${new Date().getTime()}`);
            return (await res.json());
        }
        catch (err) {
            Logger.error("Failed to get mail.ru video data", err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        const pathname = url.pathname;
        if (/\/(v|mail|bk|inbox)\//.exec(pathname)) {
            return pathname.slice(1);
        }
        const videoId = /video\/embed\/([^/]+)/.exec(pathname)?.[1];
        if (!videoId) {
            return undefined;
        }
        const videoData = await this.getVideoMeta(videoId);
        if (!videoData) {
            return undefined;
        }
        return videoData.meta.url.replace("//my.mail.ru/", "");
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/weverse.js



class WeverseHelper extends BaseHelper {
    API_ORIGIN = "https://global.apis.naver.com/weverse/wevweb";
    API_APP_ID = "be4d79eb8fc7bd008ee82c8ec4ff6fd4";
    API_HMAC_KEY = "1b9cb6378d959b45714bec49971ade22e6e24e42";
    HEADERS = {
        Accept: "application/json, text/plain, */*",
        Origin: "https://weverse.io",
        Referer: "https://weverse.io/",
    };
    getURLData() {
        return {
            appId: this.API_APP_ID,
            language: "en",
            os: "WEB",
            platform: "WEB",
            wpf: "pc",
        };
    }
    async createHash(pathname) {
        const timestamp = Date.now();
        const salt = pathname.substring(0, Math.min(255, pathname.length)) + timestamp;
        const sign = await getHmacSha1(this.API_HMAC_KEY, salt);
        if (!sign) {
            throw new VideoHelperError("Failed to get weverse HMAC signature");
        }
        return {
            wmsgpad: timestamp.toString(),
            wmd: sign,
        };
    }
    async getHashURLParams(pathname) {
        const hash = await this.createHash(pathname);
        return new URLSearchParams(hash).toString();
    }
    async getPostPreview(postId) {
        const pathname = `/post/v1.0/post-${postId}/preview?` +
            new URLSearchParams({
                fieldSet: "postForPreview",
                ...this.getURLData(),
            }).toString();
        try {
            const urlParams = await this.getHashURLParams(pathname);
            const res = await this.fetch(this.API_ORIGIN + pathname + "&" + urlParams, {
                headers: this.HEADERS,
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get weverse post preview by postId: ${postId}`, err.message);
            return false;
        }
    }
    async getVideoInKey(videoId) {
        const pathname = `/video/v1.1/vod/${videoId}/inKey?` +
            new URLSearchParams({
                gcc: "RU",
                ...this.getURLData(),
            }).toString();
        try {
            const urlParams = await this.getHashURLParams(pathname);
            const res = await this.fetch(this.API_ORIGIN + pathname + "&" + urlParams, {
                method: "POST",
                headers: this.HEADERS,
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get weverse InKey by videoId: ${videoId}`, err.message);
            return false;
        }
    }
    async getVideoInfo(infraVideoId, inkey, serviceId) {
        const timestamp = Date.now();
        try {
            const urlParams = new URLSearchParams({
                key: inkey,
                sid: serviceId,
                nonce: timestamp.toString(),
                devt: "html5_pc",
                prv: "N",
                aup: "N",
                stpb: "N",
                cpl: "en",
                env: "prod",
                lc: "en",
                adi: JSON.stringify([
                    {
                        adSystem: null,
                    },
                ]),
                adu: "/",
            }).toString();
            const res = await this.fetch(`https://global.apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/${infraVideoId}?` +
                urlParams, {
                headers: this.HEADERS,
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get weverse video info (infraVideoId: ${infraVideoId}, inkey: ${inkey}, serviceId: ${serviceId}`, err.message);
            return false;
        }
    }
    extractVideoInfo(videoList) {
        return videoList.find((video) => video.useP2P === false && video.source.includes(".mp4"));
    }
    async getVideoData(videoId) {
        const videoPreview = await this.getPostPreview(videoId);
        if (!videoPreview) {
            return undefined;
        }
        const { videoId: internalVideoId, serviceId, infraVideoId, } = videoPreview.extension.video;
        if (!(internalVideoId && serviceId && infraVideoId)) {
            return undefined;
        }
        const inkeyData = await this.getVideoInKey(internalVideoId);
        if (!inkeyData) {
            return undefined;
        }
        const videoInfo = await this.getVideoInfo(infraVideoId, inkeyData.inKey, serviceId);
        if (!videoInfo) {
            return undefined;
        }
        const videoItem = this.extractVideoInfo(videoInfo.videos.list);
        if (!videoItem) {
            return undefined;
        }
        return {
            url: videoItem.source,
            duration: videoItem.duration,
        };
    }
    async getVideoId(url) {
        return /([^/]+)\/(live|media)\/([^/]+)/.exec(url.pathname)?.[3];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/kodik.js



class KodikHelper extends BaseHelper {
    API_ORIGIN = window.location.origin;
    getSecureData(videoPath) {
        try {
            const [videoType, videoId, hash] = videoPath.split("/").filter((a) => a);
            const allScripts = Array.from(document.getElementsByTagName("script"));
            const secureScript = allScripts.filter((s) => s.innerHTML.includes(`videoId = "${videoId}"`) ||
                s.innerHTML.includes(`serialId = Number(${videoId})`));
            if (!secureScript.length) {
                throw new VideoHelperError("Failed to find secure script");
            }
            const secureContent = /'{[^']+}'/.exec(secureScript[0].textContent.trim())?.[0];
            if (!secureContent) {
                throw new VideoHelperError("Secure json wasn't found in secure script");
            }
            const secureJSON = JSON.parse(secureContent.replaceAll("'", ""));
            if (videoType !== "serial") {
                return {
                    videoType: videoType,
                    videoId,
                    hash,
                    ...secureJSON,
                };
            }
            const videoInfoContent = allScripts
                .filter((s) => s.innerHTML.includes(`var videoInfo = {}`))?.[0]
                ?.textContent?.trim();
            if (!videoInfoContent) {
                throw new VideoHelperError("Failed to find videoInfo content");
            }
            const realVideoType = /videoInfo\.type\s+?=\s+?'([^']+)'/.exec(videoInfoContent)?.[1];
            const realVideoId = /videoInfo\.id\s+?=\s+?'([^']+)'/.exec(videoInfoContent)?.[1];
            const realHash = /videoInfo\.hash\s+?=\s+?'([^']+)'/.exec(videoInfoContent)?.[1];
            if (!realVideoType || !realVideoId || !realHash) {
                throw new VideoHelperError("Failed to parse videoInfo content");
            }
            return {
                videoType: realVideoType,
                videoId: realVideoId,
                hash: realHash,
                ...secureJSON,
            };
        }
        catch (err) {
            Logger.error(`Failed to get kodik secure data by videoPath: ${videoPath}.`, err.message);
            return false;
        }
    }
    async getFtor(secureData) {
        const { videoType, videoId: id, hash, d, d_sign, pd, pd_sign, ref, ref_sign, } = secureData;
        try {
            const res = await this.fetch(this.API_ORIGIN + "/ftor", {
                method: "POST",
                headers: {
                    "User-Agent": data_config.userAgent,
                    Origin: this.API_ORIGIN,
                    Referer: `${this.API_ORIGIN}/${videoType}/${id}/${hash}/360p`,
                },
                body: new URLSearchParams({
                    d,
                    d_sign,
                    pd,
                    pd_sign,
                    ref: decodeURIComponent(ref),
                    ref_sign,
                    bad_user: "false",
                    cdn_is_working: "true",
                    info: "{}",
                    type: videoType,
                    hash,
                    id,
                }),
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get kodik video data (type: ${videoType}, id: ${id}, hash: ${hash})`, err.message);
            return false;
        }
    }
    decryptUrl(encryptedUrl) {
        const decryptedUrl = atob(encryptedUrl.replace(/[a-zA-Z]/g, function (e) {
            const charCode = e.charCodeAt(0) + 18;
            const pos = e <= "Z" ? 90 : 122;
            return String.fromCharCode(pos >= charCode ? charCode : charCode - 26);
        }));
        return "https:" + decryptedUrl;
    }
    async getVideoData(videoId) {
        const secureData = this.getSecureData(videoId);
        if (!secureData) {
            return undefined;
        }
        const videoData = await this.getFtor(secureData);
        if (!videoData) {
            return undefined;
        }
        const videoDataLinks = Object.entries(videoData.links[videoData.default.toString()]);
        const videoLink = videoDataLinks.find(([, data]) => data.type === "application/x-mpegURL")?.[1];
        if (!videoLink) {
            return undefined;
        }
        return {
            url: videoLink.src.startsWith("//")
                ? `https:${videoLink.src}`
                : this.decryptUrl(videoLink.src),
        };
    }
    async getVideoId(url) {
        return /\/(uv|video|seria|episode|season|serial)\/([^/]+)\/([^/]+)\/([\d]+)p/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/patreon.js


class PatreonHelper extends BaseHelper {
    API_ORIGIN = "https://www.patreon.com/api";
    async getPosts(postId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/posts/${postId}?json-api-use-default-includes=false`);
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get patreon posts by postId: ${postId}.`, err.message);
            return false;
        }
    }
    async getVideoData(postId) {
        const postData = await this.getPosts(postId);
        if (!postData) {
            return undefined;
        }
        const postFileUrl = postData.data.attributes.post_file.url;
        if (!postFileUrl) {
            return undefined;
        }
        return {
            url: postFileUrl,
        };
    }
    async getVideoId(url) {
        const fullPostId = /posts\/([^/]+)/.exec(url.pathname)?.[1];
        if (!fullPostId) {
            return undefined;
        }
        return fullPostId.replace(/[^\d.]/g, "");
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/reddit.js


class RedditHelper extends BaseHelper {
    API_ORIGIN = "https://www.reddit.com";
    async getContentUrl(videoId) {
        if (this.service?.additionalData !== "old") {
            return document.querySelector("shreddit-player-2")?.src;
        }
        const playerEl = document.querySelector("[data-hls-url]");
        return playerEl?.dataset.hlsUrl?.replaceAll("&amp;", "&");
    }
    async getVideoData(videoId) {
        try {
            const contentUrl = await this.getContentUrl(videoId);
            if (!contentUrl) {
                throw new VideoHelperError("Failed to find content url");
            }
            return {
                url: decodeURIComponent(contentUrl),
            };
        }
        catch (err) {
            Logger.error(`Failed to get reddit video data by video ID: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return /\/r\/(([^/]+)\/([^/]+)\/([^/]+)\/([^/]+))/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/bannedvideo.js

class BannedVideoHelper extends BaseHelper {
    API_ORIGIN = "https://api.banned.video";
    async getVideoInfo(videoId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/graphql`, {
                method: "POST",
                body: JSON.stringify({
                    operationName: "GetVideo",
                    query: `query GetVideo($id: String!) {
            getVideo(id: $id) {
              title
              description: summary
              duration: videoDuration
              videoUrl: directUrl
              isStream: live
            }
          }`,
                    variables: {
                        id: videoId,
                    },
                }),
                headers: {
                    "User-Agent": "bannedVideoFrontEnd",
                    "apollographql-client-name": "banned-web",
                    "apollographql-client-version": "1.3",
                    "content-type": "application/json",
                },
            });
            return (await res.json());
        }
        catch (err) {
            console.error(`Failed to get bannedvideo video info by videoId: ${videoId}.`, err.message);
            return false;
        }
    }
    async getVideoData(videoId) {
        const videoInfo = await this.getVideoInfo(videoId);
        if (!videoInfo) {
            return undefined;
        }
        const { videoUrl, duration, isStream, description, title } = videoInfo.data.getVideo;
        return {
            url: videoUrl,
            duration,
            isStream,
            title,
            description,
        };
    }
    async getVideoId(url) {
        return url.searchParams.get("id") ?? undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/kick.js


class KickHelper extends BaseHelper {
    API_ORIGIN = "https://kick.com/api";
    async getClipInfo(clipId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/v2/clips/${clipId}`);
            const data = (await res.json());
            const { clip_url: url, duration, title } = data.clip;
            return {
                url,
                duration,
                title,
            };
        }
        catch (err) {
            Logger.error(`Failed to get kick clip info by clipId: ${clipId}.`, err.message);
            return undefined;
        }
    }
    async getVideoInfo(videoId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/v1/video/${videoId}`);
            const data = (await res.json());
            const { source: url, livestream } = data;
            const { session_title: title, duration } = livestream;
            return {
                url,
                duration: Math.round(duration / 1000),
                title,
            };
        }
        catch (err) {
            Logger.error(`Failed to get kick video info by videoId: ${videoId}.`, err.message);
            return undefined;
        }
    }
    async getVideoData(videoId) {
        return videoId.startsWith("videos")
            ? await this.getVideoInfo(videoId.replace("videos/", ""))
            : await this.getClipInfo(videoId.replace("clips/", ""));
    }
    async getVideoId(url) {
        return /([^/]+)\/((videos|clips)\/([^/]+))/.exec(url.pathname)?.[2];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/appledeveloper.js


class AppleDeveloperHelper extends BaseHelper {
    API_ORIGIN = "https://developer.apple.com";
    async getVideoData(videoId) {
        try {
            const contentUrl = document.querySelector("meta[property='og:video']")?.content;
            if (!contentUrl) {
                throw new VideoHelperError("Failed to find content url");
            }
            return {
                url: contentUrl,
            };
        }
        catch (err) {
            Logger.error(`Failed to get apple developer video data by video ID: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return /videos\/play\/([^/]+)\/([\d]+)/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/epicgames.js



class EpicGamesHelper extends BaseHelper {
    API_ORIGIN = "https://dev.epicgames.com/community/api/learning";
    async getPostInfo(videoId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/post.json?hash_id=${videoId}`);
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get epicgames post info by videoId: ${videoId}.`, err.message);
            return false;
        }
    }
    getVideoBlock() {
        const videoUrlRe = /videoUrl\s?=\s"([^"]+)"?/;
        const script = Array.from(document.body.querySelectorAll("script")).find((s) => videoUrlRe.exec(s.innerHTML));
        if (!script) {
            return undefined;
        }
        const content = script.innerHTML.trim();
        const playlistUrl = videoUrlRe
            .exec(content)?.[1]
            ?.replace("qsep://", "https://");
        if (!playlistUrl) {
            return undefined;
        }
        let subtitlesString = /sources\s?=\s(\[([^\]]+)\])?/.exec(content)?.[1];
        if (!subtitlesString) {
            return {
                playlistUrl,
                subtitles: [],
            };
        }
        try {
            subtitlesString = (subtitlesString
                .replace(/src:(\s)+?(videoUrl)/g, 'src:"removed"')
                .substring(0, subtitlesString.lastIndexOf("},")) + "]")
                .split("\n")
                .map((line) => line.replace(/([^\s]+):\s?(?!.*\1)/, '"$1":'))
                .join("\n");
            const subtitlesObj = JSON.parse(subtitlesString);
            const subtitles = subtitlesObj.filter((sub) => sub.type === "captions");
            return {
                playlistUrl,
                subtitles,
            };
        }
        catch {
            return {
                playlistUrl,
                subtitles: [],
            };
        }
    }
    async getVideoData(videoId) {
        const courseId = videoId.split(":")?.[1];
        const postInfo = await this.getPostInfo(courseId);
        if (!postInfo) {
            return undefined;
        }
        const videoBlock = this.getVideoBlock();
        if (!videoBlock) {
            return undefined;
        }
        const { playlistUrl, subtitles: videoSubtitles } = videoBlock;
        const { title, description } = postInfo;
        const subtitles = videoSubtitles.map((caption) => ({
            language: normalizeLang(caption.srclang),
            source: "epicgames",
            format: "vtt",
            url: caption.src,
        }));
        return {
            url: playlistUrl,
            title,
            description,
            subtitles,
        };
    }
    async getVideoId(url) {
        return new Promise((resolve) => {
            const origin = "https://dev.epicgames.com";
            const reqId = btoa(window.location.href);
            window.addEventListener("message", (e) => {
                if (e.origin !== origin) {
                    return undefined;
                }
                if (!(typeof e.data === "string" && e.data.startsWith("getVideoId:"))) {
                    return undefined;
                }
                const videoId = e.data.replace("getVideoId:", "");
                return resolve(videoId);
            });
            window.top.postMessage(`getVideoId:${reqId}`, origin);
        });
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/odysee.js


class OdyseeHelper extends BaseHelper {
    API_ORIGIN = "https://odysee.com";
    async getVideoData(videoId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/${videoId}`);
            const content = await res.text();
            const url = /"contentUrl":(\s)?"([^"]+)"/.exec(content)?.[2];
            if (!url) {
                throw new VideoHelperError("Odysee url doesn't parsed");
            }
            return { url };
        }
        catch (err) {
            Logger.error(`Failed to get odysee video data by video ID: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/coursehunterLike.js


class CoursehunterLikeHelper extends BaseHelper {
    API_ORIGIN = this.origin ?? "https://coursehunter.net";
    async getCourseId() {
        const courseId = window.course_id;
        if (courseId !== undefined) {
            return String(courseId);
        }
        return document.querySelector('input[name="course_id"]')
            ?.value;
    }
    async getLessonsData(courseId) {
        const lessons = window.lessons;
        if (lessons?.length) {
            return lessons;
        }
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/api/v1/course/${courseId}/lessons`);
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get CoursehunterLike lessons data by courseId: ${courseId}, because ${err.message}`);
            return undefined;
        }
    }
    getLessondId(videoId) {
        let lessondId = videoId.split("?lesson=")?.[1];
        if (lessondId) {
            return +lessondId;
        }
        const activeLessondEl = document.querySelector(".lessons-item_active");
        lessondId = activeLessondEl?.dataset?.index;
        if (lessondId) {
            return +lessondId;
        }
        return 1;
    }
    async getVideoData(videoId) {
        const courseId = await this.getCourseId();
        if (!courseId) {
            return undefined;
        }
        const lessonsData = await this.getLessonsData(courseId);
        if (!lessonsData) {
            return undefined;
        }
        const lessonId = this.getLessondId(videoId);
        const currentLesson = lessonsData?.[lessonId - 1];
        const { file: videoUrl, duration, title } = currentLesson;
        if (!videoUrl) {
            return undefined;
        }
        return {
            url: videoUrl,
            duration,
            title,
        };
    }
    async getVideoId(url) {
        const courseId = /course\/([^/]+)/.exec(url.pathname)?.[0];
        return courseId ? courseId + url.search : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/twitch.js

class TwitchHelper extends BaseHelper {
    API_ORIGIN = "https://clips.twitch.tv";
    async getClipLink(pathname, clipId) {
        const schema = document.querySelector("script[type='application/ld+json']");
        const clearPathname = pathname.slice(1);
        if (schema) {
            const schemaJSON = JSON.parse(schema.innerText);
            const channelLink = schemaJSON["@graph"].find((obj) => obj["@type"] === "VideoObject")?.creator.url;
            if (!channelLink) {
                throw new VideoHelperError("Failed to find channel link");
            }
            const channelName = channelLink.replace("https://www.twitch.tv/", "");
            return `${channelName}/clip/${clearPathname}`;
        }
        const isEmbed = clearPathname === "embed";
        const channelLink = document.querySelector(isEmbed
            ? ".tw-link[data-test-selector='stream-info-card-component__stream-avatar-link']"
            : ".clips-player a:not([class])");
        if (!channelLink) {
            return undefined;
        }
        const channelName = channelLink.href.replace("https://www.twitch.tv/", "");
        return `${channelName}/clip/${isEmbed ? clipId : clearPathname}`;
    }
    async getVideoData(videoId) {
        const title = document.querySelector('[data-a-target="stream-title"], [data-test-selector="stream-info-card-component__subtitle"]')?.innerText;
        const isStream = !!document.querySelector('[data-a-target="animated-channel-viewers-count"], .channel-status-info--live, .top-bar--pointer-enabled .tw-channel-status-text-indicator');
        return {
            url: this.service.url + videoId,
            isStream,
            title,
        };
    }
    async getVideoId(url) {
        const pathname = url.pathname;
        if (/^m\.twitch\.tv$/.test(pathname)) {
            return /videos\/([^/]+)/.exec(url.href)?.[0] ?? pathname.slice(1);
        }
        else if (/^player\.twitch\.tv$/.test(url.hostname)) {
            return `videos/${url.searchParams.get("video")}`;
        }
        const clipPath = /([^/]+)\/(?:clip)\/([^/]+)/.exec(pathname);
        if (clipPath) {
            return clipPath[0];
        }
        const isClipsDomain = /^clips\.twitch\.tv$/.test(url.hostname);
        if (isClipsDomain) {
            return await this.getClipLink(pathname, url.searchParams.get("clip"));
        }
        const videoPath = /(?:videos)\/([^/]+)/.exec(pathname);
        if (videoPath) {
            return videoPath[0];
        }
        const isUserOfflinePage = document.querySelector(".home-offline-hero .tw-link");
        if (isUserOfflinePage?.href) {
            const pageUrl = new URL(isUserOfflinePage.href);
            return /(?:videos)\/([^/]+)/.exec(pageUrl.pathname)?.[0];
        }
        return document.querySelector(".persistent-player") ? pathname : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/sap.js



class SapHelper extends BaseHelper {
    API_ORIGIN = "https://learning.sap.com/";
    async requestKaltura(kalturaDomain, partnerId, entryId) {
        const clientTag = "html5:v3.17.22";
        const apiVersion = "3.3.0";
        try {
            const res = await this.fetch(`https://${kalturaDomain}/api_v3/service/multirequest`, {
                method: "POST",
                body: JSON.stringify({
                    "1": {
                        service: "session",
                        action: "startWidgetSession",
                        widgetId: `_${partnerId}`,
                    },
                    "2": {
                        service: "baseEntry",
                        action: "list",
                        ks: "{1:result:ks}",
                        filter: { redirectFromEntryId: entryId },
                        responseProfile: {
                            type: 1,
                            fields: "id,referenceId,name,description,dataUrl,duration,flavorParamsIds,type,dvrStatus,externalSourceType,createdAt,updatedAt,endDate,plays,views,downloadUrl,creatorId",
                        },
                    },
                    "3": {
                        service: "baseEntry",
                        action: "getPlaybackContext",
                        entryId: "{2:result:objects:0:id}",
                        ks: "{1:result:ks}",
                        contextDataParams: {
                            objectType: "KalturaContextDataParams",
                            flavorTags: "all",
                        },
                    },
                    apiVersion,
                    format: 1,
                    ks: "",
                    clientTag,
                    partnerId,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error("Failed to request kaltura data", err.message);
            return undefined;
        }
    }
    async getKalturaData(videoId) {
        try {
            const scriptEl = document.querySelector('script[data-nscript="beforeInteractive"]');
            if (!scriptEl) {
                throw new VideoHelperError("Failed to find script element");
            }
            const sapData = /https:\/\/([^"]+)\/p\/([^"]+)\/embedPlaykitJs\/uiconf_id\/([^"]+)/.exec(scriptEl?.src);
            if (!sapData) {
                throw new VideoHelperError(`Failed to get sap data for videoId: ${videoId}`);
            }
            const [, kalturaDomain, partnerId] = sapData;
            let entryId = document.querySelector("#shadow")?.firstChild?.getAttribute("id");
            if (!entryId) {
                const nextDataEl = document.querySelector("#__NEXT_DATA__");
                if (!nextDataEl) {
                    throw new VideoHelperError("Failed to find next data element");
                }
                entryId = /"sourceId":\s?"([^"]+)"/.exec(nextDataEl.innerText)?.[1];
            }
            if (!kalturaDomain || Number.isNaN(+partnerId) || !entryId) {
                throw new VideoHelperError(`One of the necessary parameters for getting a link to a sap video in wasn't found for ${videoId}. Params: kalturaDomain = ${kalturaDomain}, partnerId = ${partnerId}, entryId = ${entryId}`);
            }
            return await this.requestKaltura(kalturaDomain, partnerId, entryId);
        }
        catch (err) {
            Logger.error("Failed to get kaltura data", err.message);
            return undefined;
        }
    }
    async getVideoData(videoId) {
        const kalturaData = await this.getKalturaData(videoId);
        if (!kalturaData) {
            return undefined;
        }
        const [, baseEntryList, playbackContext] = kalturaData;
        const { duration } = baseEntryList.objects[0];
        const videoUrl = playbackContext.sources.find((source) => source.format === "url" &&
            source.protocols === "http,https" &&
            source.url.includes(".mp4"))?.url;
        if (!videoUrl) {
            return undefined;
        }
        const subtitles = playbackContext.playbackCaptions.map((caption) => {
            return {
                language: normalizeLang(caption.languageCode),
                source: "sap",
                format: "vtt",
                url: caption.webVttUrl,
                isAutoGenerated: caption.label.includes("auto-generated"),
            };
        });
        return {
            url: videoUrl,
            subtitles,
            duration,
        };
    }
    async getVideoId(url) {
        return /((courses|learning-journeys)\/([^/]+)(\/[^/]+)?)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/videojs.js



class VideoJSHelper extends BaseHelper {
    SUBTITLE_SOURCE = "videojs";
    SUBTITLE_FORMAT = "vtt";
    static getPlayer() {
        return document.querySelector(".video-js")
            ?.player;
    }
    getVideoDataByPlayer(videoId) {
        try {
            const player = VideoJSHelper.getPlayer();
            if (!player) {
                throw new Error(`Video player doesn't have player option, videoId ${videoId}`);
            }
            const duration = player.duration();
            const sources = Array.isArray(player.currentSources)
                ? player.currentSources
                : player.getCache()?.sources;
            const { tracks_: tracks } = player.textTracks();
            const videoUrl = sources.find((source) => source.type === "video/mp4" || source.type === "video/webm");
            if (!videoUrl) {
                throw new Error(`Failed to find video url for videoID ${videoId}`);
            }
            const subtitles = tracks
                .filter((track) => track.src)
                .map((track) => ({
                language: normalizeLang(track.language),
                source: this.SUBTITLE_SOURCE,
                format: this.SUBTITLE_FORMAT,
                url: track.src,
            }));
            return {
                url: videoUrl.src,
                duration,
                subtitles,
            };
        }
        catch (err) {
            Logger.error("Failed to get videojs video data", err.message);
            return undefined;
        }
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/linkedin.js


class LinkedinHelper extends VideoJSHelper {
    SUBTITLE_SOURCE = "linkedin";
    async getVideoData(videoId) {
        const data = this.getVideoDataByPlayer(videoId);
        if (!data) {
            return undefined;
        }
        const { url, duration, subtitles } = data;
        return {
            url: proxyMedia(new URL(url)),
            duration,
            subtitles,
        };
    }
    async getVideoId(url) {
        return /\/learning\/(([^/]+)\/([^/]+))/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/vimeo.js



class VimeoHelper extends BaseHelper {
    API_KEY = "";
    DEFAULT_SITE_ORIGIN = "https://vimeo.com";
    SITE_ORIGIN = this.service?.url?.slice(0, -1) ?? this.DEFAULT_SITE_ORIGIN;
    isErrorData(data) {
        return Object.hasOwn(data, "error");
    }
    isPrivatePlayer() {
        return this.referer && !this.referer.includes("vimeo.com");
    }
    async getViewerData() {
        try {
            const res = await this.fetch("https://vimeo.com/_next/viewer");
            const data = (await res.json());
            const { apiUrl, jwt } = data;
            this.API_ORIGIN = `https://${apiUrl}`;
            this.API_KEY = `jwt ${jwt}`;
            return data;
        }
        catch (err) {
            Logger.error(`Failed to get default viewer data.`, err.message);
            return false;
        }
    }
    async getVideoInfo(videoId) {
        try {
            const params = new URLSearchParams({
                fields: "name,link,description,duration",
            }).toString();
            const res = await this.fetch(`${this.API_ORIGIN}/videos/${videoId}?${params}`, {
                headers: {
                    Authorization: this.API_KEY,
                },
            });
            const data = (await res.json());
            if (this.isErrorData(data)) {
                throw new Error(data.developer_message ?? data.error);
            }
            return data;
        }
        catch (err) {
            Logger.error(`Failed to get video info by video ID: ${videoId}`, err.message);
            return false;
        }
    }
    async getPrivateVideoSource(files) {
        try {
            const { default_cdn, cdns } = files.dash;
            const cdnUrl = cdns[default_cdn].url;
            const res = await this.fetch(cdnUrl);
            if (res.status !== 200) {
                throw new VideoHelperError(await res.text());
            }
            const data = (await res.json());
            const baseUrl = new URL(data.base_url, cdnUrl);
            const videoData = data.audio.find((v) => v.mime_type === "audio/mp4" && v.format === "dash");
            if (!videoData) {
                throw new VideoHelperError("Failed to find video data");
            }
            const segmentUrl = videoData.segments?.[0]?.url;
            if (!segmentUrl) {
                throw new VideoHelperError("Failed to find first segment url");
            }
            const [videoName, videoParams] = segmentUrl.split("?", 2);
            const params = new URLSearchParams(videoParams);
            params.delete("range");
            return new URL(`${videoData.base_url}${videoName}?${params.toString()}`, baseUrl).href;
        }
        catch (err) {
            Logger.error(`Failed to get private video source`, err.message);
            return false;
        }
    }
    async getPrivateVideoInfo(videoId) {
        try {
            if (typeof playerConfig === "undefined") {
                return undefined;
            }
            const videoSource = await this.getPrivateVideoSource(playerConfig.request.files);
            if (!videoSource) {
                throw new VideoHelperError("Failed to get private video source");
            }
            const { video: { title, duration }, request: { text_tracks: subs }, } = playerConfig;
            return {
                url: `${this.SITE_ORIGIN}/${videoId}`,
                video_url: videoSource,
                title,
                duration,
                subs,
            };
        }
        catch (err) {
            Logger.error(`Failed to get private video info by video ID: ${videoId}`, err.message);
            return false;
        }
    }
    async getSubsInfo(videoId) {
        try {
            const params = new URLSearchParams({
                per_page: "100",
                fields: "language,type,link",
            }).toString();
            const res = await this.fetch(`${this.API_ORIGIN}/videos/${videoId}/texttracks?${params}`, {
                headers: {
                    Authorization: this.API_KEY,
                },
            });
            const content = (await res.json());
            if (this.isErrorData(content)) {
                throw new Error(content.developer_message ?? content.error);
            }
            return content.data;
        }
        catch (err) {
            Logger.error(`Failed to get subtitles info by video ID: ${videoId}`, err.message);
            return [];
        }
    }
    async getVideoData(videoId) {
        const isPrivate = this.isPrivatePlayer();
        if (isPrivate) {
            const videoInfo = await this.getPrivateVideoInfo(videoId);
            if (!videoInfo) {
                return undefined;
            }
            const { url, subs, video_url, title, duration } = videoInfo;
            const subtitles = subs.map((sub) => ({
                language: normalizeLang(sub.lang),
                source: "vimeo",
                format: "vtt",
                url: this.SITE_ORIGIN + sub.url,
                isAutoGenerated: sub.lang.includes("autogenerated"),
            }));
            const translationHelp = subtitles.length
                ? [
                    { target: "video_file_url", targetUrl: video_url },
                    { target: "subtitles_file_url", targetUrl: subtitles[0].url },
                ]
                : null;
            return {
                ...(translationHelp
                    ? {
                        url,
                        translationHelp,
                    }
                    : {
                        url: video_url,
                    }),
                subtitles,
                title,
                duration,
            };
        }
        if (!this.extraInfo) {
            return this.returnBaseData(videoId);
        }
        if (videoId.includes("/")) {
            videoId = videoId.replace("/", ":");
        }
        const viewerData = await this.getViewerData();
        if (!viewerData) {
            return this.returnBaseData(videoId);
        }
        const videoInfo = await this.getVideoInfo(videoId);
        if (!videoInfo) {
            return this.returnBaseData(videoId);
        }
        const subsData = await this.getSubsInfo(videoId);
        const subtitles = subsData.map((caption) => ({
            language: normalizeLang(caption.language),
            source: "vimeo",
            format: "vtt",
            url: caption.link,
            isAutoGenerated: caption.language.includes("autogen"),
        }));
        const { link: url, duration, name: title, description } = videoInfo;
        return {
            url,
            title,
            description,
            subtitles,
            duration,
        };
    }
    async getVideoId(url) {
        const embedId = /video\/[^/]+$/.exec(url.pathname)?.[0];
        if (this.isPrivatePlayer()) {
            return embedId;
        }
        if (embedId) {
            const hash = url.searchParams.get("h");
            const videoId = embedId.replace("video/", "");
            return hash ? `${videoId}/${hash}` : videoId;
        }
        const categoriesVideoId = /channels\/[^/]+\/([^/]+)/.exec(url.pathname)?.[1] ??
            /groups\/[^/]+\/videos\/([^/]+)/.exec(url.pathname)?.[1] ??
            /(showcase|album)\/[^/]+\/video\/([^/]+)/.exec(url.pathname)?.[2];
        if (categoriesVideoId) {
            return categoriesVideoId;
        }
        return /([^/]+\/)?[^/]+$/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/yandexdisk.js



class YandexDiskHelper extends BaseHelper {
    API_ORIGIN = window.location.origin;
    CLIENT_PREFIX = "/client/disk";
    INLINE_PREFIX = "/i/";
    DISK_PREFIX = "/d/";
    isErrorData(data) {
        return Object.hasOwn(data, "error");
    }
    async getClientVideoData(videoId) {
        const url = new URL(window.location.href);
        const dialogId = url.searchParams.get("idDialog");
        if (!dialogId) {
            return undefined;
        }
        const preloadedScript = document.querySelector("#preloaded-data");
        if (!preloadedScript) {
            return undefined;
        }
        try {
            const preloadedData = JSON.parse(preloadedScript.innerText);
            const { idClient, sk } = preloadedData.config;
            const res = await this.fetch(this.API_ORIGIN + "/models-v2?m=mpfs/info", {
                method: "POST",
                body: JSON.stringify({
                    apiMethod: "mpfs/info",
                    connection_id: idClient,
                    requestParams: {
                        path: dialogId.replaceAll(" ", "+"),
                    },
                    sk,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = (await res.json());
            if (this.isErrorData(data)) {
                throw new VideoHelperError(data.error?.message ?? data.error?.code);
            }
            if (data?.type !== "file") {
                throw new VideoHelperError("Failed to get resource info");
            }
            const { meta: { short_url, video_info }, name, } = data;
            if (!video_info) {
                throw new VideoHelperError("There's no video open right now");
            }
            if (!short_url) {
                throw new VideoHelperError("Access to the video is limited");
            }
            const title = this.clearTitle(name);
            const duration = Math.round(video_info.duration / 1000);
            return {
                url: short_url,
                title,
                duration,
            };
        }
        catch (err) {
            Logger.error(`Failed to get yandex disk video data by video ID: ${videoId}, because ${err.message}`);
            return undefined;
        }
    }
    clearTitle(title) {
        return title.replace(/(\.[^.]+)$/, "");
    }
    getBodyHash(fileHash, sk) {
        const data = JSON.stringify({
            hash: fileHash,
            sk,
        });
        return encodeURIComponent(data);
    }
    async fetchList(dirHash, sk) {
        const body = this.getBodyHash(dirHash, sk);
        const res = await this.fetch(this.API_ORIGIN + "/public/api/fetch-list", {
            method: "POST",
            body,
        });
        const data = (await res.json());
        if (Object.hasOwn(data, "error")) {
            throw new VideoHelperError("Failed to fetch folder list");
        }
        return data.resources;
    }
    async getDownloadUrl(fileHash, sk) {
        const body = this.getBodyHash(fileHash, sk);
        const res = await this.fetch(this.API_ORIGIN + "/public/api/download-url", {
            method: "POST",
            body,
        });
        const data = (await res.json());
        if (data.error) {
            throw new VideoHelperError("Failed to get download url");
        }
        return data.data.url;
    }
    async getDiskVideoData(videoId) {
        try {
            const prefetchEl = document.getElementById("store-prefetch");
            if (!prefetchEl) {
                throw new VideoHelperError("Failed to get prefetch data");
            }
            const resourcePaths = videoId.split("/").slice(3);
            if (!resourcePaths.length) {
                throw new VideoHelperError("Failed to find video file path");
            }
            const data = JSON.parse(prefetchEl.innerText);
            const { resources, rootResourceId, environment: { sk }, } = data;
            const rootResource = resources[rootResourceId];
            const resourcePathsLastIdx = resourcePaths.length - 1;
            const resourcePath = resourcePaths
                .filter((_, idx) => idx !== resourcePathsLastIdx)
                .join("/");
            let resourcesList = Object.values(resources);
            if (resourcePath.includes("/")) {
                resourcesList = await this.fetchList(`${rootResource.hash}:/${resourcePath}`, sk);
            }
            const resource = resourcesList.find((resource) => resource.name === resourcePaths[resourcePathsLastIdx]);
            if (!resource) {
                throw new VideoHelperError("Failed to find resource");
            }
            if (resource && resource.type === "dir") {
                throw new VideoHelperError("Path is dir, but expected file");
            }
            const { meta: { short_url, mediatype, videoDuration }, path, name, } = resource;
            if (mediatype !== "video") {
                throw new VideoHelperError("Resource isn't a video");
            }
            const title = this.clearTitle(name);
            const duration = Math.round(videoDuration / 1000);
            if (short_url) {
                return {
                    url: short_url,
                    duration,
                    title,
                };
            }
            const downloadUrl = await this.getDownloadUrl(path, sk);
            return {
                url: proxyMedia(new URL(downloadUrl)),
                duration,
                title,
            };
        }
        catch (err) {
            Logger.error(`Failed to get yandex disk video data by disk video ID: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoData(videoId) {
        if (videoId.startsWith(this.INLINE_PREFIX) ||
            /^\/d\/([^/]+)$/.exec(videoId)) {
            return {
                url: this.service.url + videoId.slice(1),
            };
        }
        videoId = decodeURIComponent(videoId);
        if (videoId.startsWith(this.CLIENT_PREFIX)) {
            return await this.getClientVideoData(videoId);
        }
        return await this.getDiskVideoData(videoId);
    }
    async getVideoId(url) {
        if (url.pathname.startsWith(this.CLIENT_PREFIX)) {
            return url.pathname + url.search;
        }
        const fileId = /\/i\/([^/]+)/.exec(url.pathname)?.[0];
        if (fileId) {
            return fileId;
        }
        return /\/d\/([^/]+)/.exec(url.pathname) ? url.pathname : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/vk.js



class VKHelper extends BaseHelper {
    static getPlayer() {
        if (typeof Videoview === "undefined") {
            return undefined;
        }
        return Videoview?.getPlayerObject?.call(undefined);
    }
    async getVideoData(videoId) {
        const player = VKHelper.getPlayer();
        if (!player) {
            return this.returnBaseData(videoId);
        }
        try {
            const { description: descriptionHTML, duration, md_title: title, } = player.vars;
            const parser = new DOMParser();
            const doc = parser.parseFromString(descriptionHTML, "text/html");
            const description = Array.from(doc.body.childNodes)
                .filter((el) => el.nodeName !== "BR")
                .map((el) => el.textContent)
                .join("\n");
            let subtitles;
            if (Object.hasOwn(player.vars, "subs")) {
                subtitles = player.vars.subs.map((sub) => ({
                    language: normalizeLang(sub.lang),
                    source: "vk",
                    format: "vtt",
                    url: sub.url,
                    isAutoGenerated: !!sub.is_auto,
                }));
            }
            return {
                url: this.service.url + videoId,
                title,
                description,
                duration,
                subtitles,
            };
        }
        catch (err) {
            Logger.error(`Failed to get VK video data, because: ${err.message}`);
            return this.returnBaseData(videoId);
        }
    }
    async getVideoId(url) {
        const pathID = /^\/(video|clip)-?\d{8,9}_\d{9}$/.exec(url.pathname);
        if (pathID) {
            return pathID[0].slice(1);
        }
        const idInsidePlaylist = /\/playlist\/[^/]+\/(video-?\d{8,9}_\d{9})/.exec(url.pathname);
        if (idInsidePlaylist) {
            return idInsidePlaylist[1];
        }
        const paramZ = url.searchParams.get("z");
        if (paramZ) {
            return paramZ.split("/")[0];
        }
        const paramOID = url.searchParams.get("oid");
        const paramID = url.searchParams.get("id");
        if (paramOID && paramID) {
            return `video-${Math.abs(parseInt(paramOID))}_${paramID}`;
        }
        return undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/trovo.js

class TrovoHelper extends BaseHelper {
    async getVideoId(url) {
        const vid = url.searchParams.get("vid");
        const path = /([^/]+)\/([\d]+)/.exec(url.pathname)?.[0];
        if (!vid || !path) {
            return undefined;
        }
        return `${path}?vid=${vid}`;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/incestflix.js



class IncestflixHelper extends BaseHelper {
    async getVideoData(videoId) {
        try {
            const sourceEl = document.querySelector("#incflix-stream source:first-of-type");
            if (!sourceEl) {
                throw new VideoHelperError("Failed to find source element");
            }
            const srcLink = sourceEl.getAttribute("src");
            if (!srcLink) {
                throw new VideoHelperError("Failed to find source link");
            }
            const source = new URL(srcLink.startsWith("//") ? `https:${srcLink}` : srcLink);
            source.searchParams.append("media-proxy", "video.mp4");
            return {
                url: proxyMedia(source),
            };
        }
        catch (err) {
            Logger.error(`Failed to get Incestflix data by videoId: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return /\/watch\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/porntn.js



class PornTNHelper extends BaseHelper {
    async getVideoData(videoId) {
        try {
            if (typeof flashvars === "undefined") {
                return undefined;
            }
            const { rnd, video_url: source, video_title: title } = flashvars;
            if (!source || !rnd) {
                throw new VideoHelperError("Failed to find video source or rnd");
            }
            const getFileUrl = new URL(source);
            getFileUrl.searchParams.append("rnd", rnd);
            Logger.log("PornTN get_file link", getFileUrl.href);
            const cdnResponse = await this.fetch(getFileUrl.href, { method: "head" });
            const cdnUrl = new URL(cdnResponse.url);
            Logger.log("PornTN cdn link", cdnUrl.href);
            const proxiedUrl = proxyMedia(cdnUrl);
            return {
                url: proxiedUrl,
                title,
            };
        }
        catch (err) {
            Logger.error(`Failed to get PornTN data by videoId: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return /\/videos\/(([^/]+)\/([^/]+))/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/googledrive.js

class GoogleDriveHelper extends BaseHelper {
    getPlayerData() {
        const playerEl = document.querySelector("#movie_player");
        return playerEl?.getVideoData?.call() ?? undefined;
    }
    async getVideoId(url) {
        return this.getPlayerData()?.video_id;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/bilibili.js

class BilibiliHelper extends BaseHelper {
    async getVideoId(url) {
        const bangumiId = /bangumi\/play\/([^/]+)/.exec(url.pathname)?.[0];
        if (bangumiId) {
            return bangumiId;
        }
        const bvid = url.searchParams.get("bvid");
        if (bvid) {
            return `video/${bvid}`;
        }
        let vid = /video\/([^/]+)/.exec(url.pathname)?.[0];
        if (vid && url.searchParams.get("p") !== null) {
            vid += `/?p=${url.searchParams.get("p")}`;
        }
        return vid;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/xvideos.js

class XVideosHelper extends BaseHelper {
    async getVideoId(url) {
        return /[^/]+\/[^/]+$/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/watchpornto.js

class WatchPornToHelper extends BaseHelper {
    async getVideoId(url) {
        return /(video|embed)\/(\d+)(\/[^/]+\/)?/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/archive.js

class ArchiveHelper extends BaseHelper {
    async getVideoId(url) {
        return /(details|embed)\/([^/]+)/.exec(url.pathname)?.[2];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/dailymotion.js

class DailymotionHelper extends BaseHelper {
    async getVideoId(url) {
        const plainPlayerConfig = Array.from(document.querySelectorAll("*")).filter((s) => s.innerHTML.trim().includes(".m3u8"));
        const videoUrl = plainPlayerConfig?.[1]?.lastChild?.src;
        return videoUrl ? /\/video\/(\w+)\.m3u8/.exec(videoUrl)?.[1] : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/youku.js

class YoukuHelper extends BaseHelper {
    async getVideoId(url) {
        return /v_show\/id_[\w=]+/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/egghead.js

class EggheadHelper extends BaseHelper {
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/newgrounds.js

class NewgroundsHelper extends BaseHelper {
    async getVideoId(url) {
        return /([^/]+)\/(view)\/([^/]+)/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/okru.js

class OKRuHelper extends BaseHelper {
    async getVideoId(url) {
        return /\/video\/(\d+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/peertube.js

class PeertubeHelper extends BaseHelper {
    async getVideoId(url) {
        return /\/w\/([^/]+)/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/eporner.js

class EpornerHelper extends BaseHelper {
    async getVideoId(url) {
        return /video-([^/]+)\/([^/]+)/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/bitchute.js

class BitchuteHelper extends BaseHelper {
    async getVideoId(url) {
        return /(video|embed)\/([^/]+)/.exec(url.pathname)?.[2];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/rutube.js

class RutubeHelper extends BaseHelper {
    async getVideoId(url) {
        return /(?:video|embed)\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/facebook.js

class FacebookHelper extends BaseHelper {
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/rumble.js

class RumbleHelper extends BaseHelper {
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/twitter.js

class TwitterHelper extends BaseHelper {
    async getVideoId(url) {
        const videoId = /status\/([^/]+)/.exec(url.pathname)?.[1];
        if (videoId) {
            return videoId;
        }
        const postEl = this.video?.closest('[data-testid="tweet"]');
        const newLink = postEl?.querySelector('a[role="link"][aria-label]')?.href;
        return newLink ? /status\/([^/]+)/.exec(newLink)?.[1] : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/pornhub.js

class PornhubHelper extends BaseHelper {
    async getVideoId(url) {
        return (url.searchParams.get("viewkey") ??
            /embed\/([^/]+)/.exec(url.pathname)?.[1]);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/tiktok.js

class TikTokHelper extends BaseHelper {
    async getVideoId(url) {
        return /([^/]+)\/video\/([^/]+)/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/nine_gag.js

class NineGAGHelper extends BaseHelper {
    async getVideoId(url) {
        return /gag\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/youtube.js




class YoutubeHelper extends BaseHelper {
    static isMobile() {
        return /^m\.youtube\.com$/.test(window.location.hostname);
    }
    static getPlayer() {
        if (window.location.pathname.startsWith("/shorts/") &&
            !YoutubeHelper.isMobile()) {
            return document.querySelector("#shorts-player");
        }
        return document.querySelector("#movie_player");
    }
    static getPlayerResponse() {
        return YoutubeHelper.getPlayer()?.getPlayerResponse?.call(undefined);
    }
    static getPlayerData() {
        return YoutubeHelper.getPlayer()?.getVideoData?.call(undefined);
    }
    static getVolume() {
        const player = YoutubeHelper.getPlayer();
        if (player?.getVolume) {
            return player.getVolume() / 100;
        }
        return 1;
    }
    static setVolume(volume) {
        const player = YoutubeHelper.getPlayer();
        if (player?.setVolume) {
            player.setVolume(Math.round(volume * 100));
            return true;
        }
        return false;
    }
    static isMuted() {
        const player = YoutubeHelper.getPlayer();
        if (player?.isMuted) {
            return player.isMuted();
        }
        return false;
    }
    static videoSeek(video, time) {
        Logger.log("videoSeek", time);
        const preTime = YoutubeHelper.getPlayer()?.getProgressState()?.seekableEnd ??
            video.currentTime;
        const finalTime = preTime - time;
        video.currentTime = finalTime;
    }
    static getSubtitles(userLang) {
        const response = YoutubeHelper.getPlayerResponse();
        const playerCaptions = response?.captions?.playerCaptionsTracklistRenderer;
        if (!playerCaptions) {
            return [];
        }
        const captionTracks = playerCaptions.captionTracks ?? [];
        const translationLanguages = playerCaptions.translationLanguages ?? [];
        const userLangSupported = translationLanguages.find((language) => language.languageCode === userLang);
        const asrSubtitleItem = captionTracks.find((captionTrack) => captionTrack?.kind === "asr");
        const asrLang = asrSubtitleItem?.languageCode ?? "en";
        const subtitles = captionTracks.reduce((result, captionTrack) => {
            if (!("languageCode" in captionTrack)) {
                return result;
            }
            const language = captionTrack.languageCode
                ? normalizeLang(captionTrack.languageCode)
                : undefined;
            const url = captionTrack.baseUrl;
            if (!language || !url) {
                return result;
            }
            const captionUrl = `${url.startsWith("http") ? url : `${window.location.origin}/${url}`}&fmt=json3`;
            result.push({
                source: "youtube",
                format: "json",
                language,
                isAutoGenerated: captionTrack?.kind === "asr",
                url: captionUrl,
            });
            if (userLangSupported &&
                captionTrack.isTranslatable &&
                captionTrack.languageCode === asrLang &&
                userLang !== language) {
                result.push({
                    source: "youtube",
                    format: "json",
                    language: userLang,
                    isAutoGenerated: captionTrack?.kind === "asr",
                    translatedFromLanguage: language,
                    url: `${captionUrl}&tlang=${userLang}`,
                });
            }
            return result;
        }, []);
        Logger.log("youtube subtitles:", subtitles);
        return subtitles;
    }
    static getLanguage() {
        if (!YoutubeHelper.isMobile()) {
            const player = YoutubeHelper.getPlayer();
            const trackInfo = player?.getAudioTrack
                ?.call(undefined)
                ?.getLanguageInfo();
            if (trackInfo && trackInfo.id !== "und") {
                return normalizeLang(trackInfo.id.split(".")[0]);
            }
        }
        const response = YoutubeHelper.getPlayerResponse();
        const autoCaption = response?.captions?.playerCaptionsTracklistRenderer.captionTracks.find((caption) => caption.kind === "asr" && caption.languageCode);
        return autoCaption ? normalizeLang(autoCaption.languageCode) : undefined;
    }
    async getVideoData(videoId) {
        const { title: localizedTitle } = YoutubeHelper.getPlayerData() ?? {};
        const { shortDescription: description, isLive: isStream, title, } = YoutubeHelper.getPlayerResponse()?.videoDetails ?? {};
        const subtitles = YoutubeHelper.getSubtitles(this.language);
        let detectedLanguage = YoutubeHelper.getLanguage();
        if (detectedLanguage && !availableLangs.includes(detectedLanguage)) {
            detectedLanguage = undefined;
        }
        const duration = YoutubeHelper.getPlayer()?.getDuration?.call(undefined) ?? undefined;
        return {
            url: this.service.url + videoId,
            isStream,
            title,
            localizedTitle,
            detectedLanguage,
            description,
            subtitles,
            duration,
        };
    }
    async getVideoId(url) {
        if (url.hostname === "youtu.be") {
            url.search = `?v=${url.pathname.replace("/", "")}`;
            url.pathname = "/watch";
        }
        if (url.searchParams.has("enablejsapi")) {
            const videoUrl = YoutubeHelper.getPlayer()?.getVideoUrl();
            url = videoUrl ? new URL(videoUrl) : url;
        }
        return (/(?:watch|embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1] ??
            url.searchParams.get("v"));
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/dzen.js

class DzenHelper extends BaseHelper {
    async getVideoId(url) {
        return /video\/watch\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/udemy.js




class UdemyHelper extends BaseHelper {
    API_ORIGIN = "https://www.udemy.com/api-2.0";
    getModuleData() {
        const appLoaderEl = document.querySelector(".ud-app-loader[data-module-id='course-taking']");
        const moduleData = appLoaderEl?.dataset?.moduleArgs;
        if (!moduleData) {
            return undefined;
        }
        return JSON.parse(moduleData);
    }
    getLectureId() {
        return /learn\/lecture\/([^/]+)/.exec(window.location.pathname)?.[1];
    }
    isErrorData(data) {
        return Object.hasOwn(data, "error");
    }
    async getLectureData(courseId, lectureId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/users/me/subscribed-courses/${courseId}/lectures/${lectureId}/?` +
                new URLSearchParams({
                    "fields[lecture]": "title,description,asset",
                    "fields[asset]": "length,media_sources,captions",
                }).toString());
            const data = (await res.json());
            if (this.isErrorData(data)) {
                throw new VideoHelperError(data.detail ?? "unknown error");
            }
            return data;
        }
        catch (err) {
            Logger.error(`Failed to get lecture data by courseId: ${courseId} and lectureId: ${lectureId}`, err.message);
            return undefined;
        }
    }
    async getCourseLang(courseId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/users/me/subscribed-courses/${courseId}?` +
                new URLSearchParams({
                    "fields[course]": "locale",
                }).toString());
            const data = (await res.json());
            if (this.isErrorData(data)) {
                throw new VideoHelperError(data.detail ?? "unknown error");
            }
            return data;
        }
        catch (err) {
            Logger.error(`Failed to get course lang by courseId: ${courseId}`, err.message);
            return undefined;
        }
    }
    findVideoUrl(sources) {
        return sources?.find((src) => src.type === "video/mp4")?.src;
    }
    findSubtitleUrl(captions, detectedLanguage) {
        let subtitle = captions?.find((caption) => normalizeLang(caption.locale_id) === detectedLanguage);
        if (!subtitle) {
            subtitle =
                captions?.find((caption) => normalizeLang(caption.locale_id) === "en") ?? captions?.[0];
        }
        return subtitle?.url;
    }
    async getVideoData(videoId) {
        const moduleData = this.getModuleData();
        if (!moduleData) {
            return undefined;
        }
        const { courseId } = moduleData;
        const lectureId = this.getLectureId();
        Logger.log(`[Udemy] courseId: ${courseId}, lectureId: ${lectureId}`);
        if (!lectureId) {
            return undefined;
        }
        const lectureData = await this.getLectureData(courseId, lectureId);
        if (!lectureData) {
            return undefined;
        }
        const { title, description, asset } = lectureData;
        const { length: duration, media_sources, captions } = asset;
        const videoUrl = this.findVideoUrl(media_sources);
        if (!videoUrl) {
            Logger.log("Failed to find .mp4 video file in media_sources", media_sources);
            return undefined;
        }
        let courseLang = "en";
        const courseLangData = await this.getCourseLang(courseId);
        if (courseLangData) {
            const { locale: { locale: courseLocale }, } = courseLangData;
            courseLang = courseLocale ? normalizeLang(courseLocale) : courseLang;
        }
        if (!availableLangs.includes(courseLang)) {
            courseLang = "en";
        }
        const subtitleUrl = this.findSubtitleUrl(captions, courseLang);
        if (!subtitleUrl) {
            Logger.log("Failed to find subtitle file in captions", captions);
        }
        return {
            ...(subtitleUrl
                ? {
                    url: this.service?.url + videoId,
                    translationHelp: [
                        {
                            target: "subtitles_file_url",
                            targetUrl: subtitleUrl,
                        },
                        {
                            target: "video_file_url",
                            targetUrl: videoUrl,
                        },
                    ],
                    detectedLanguage: courseLang,
                }
                : {
                    url: videoUrl,
                    translationHelp: null,
                }),
            duration,
            title,
            description,
        };
    }
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/coursera.js




class CourseraHelper extends VideoJSHelper {
    API_ORIGIN = "https://www.coursera.org/api";
    SUBTITLE_SOURCE = "coursera";
    async getCourseData(courseId) {
        try {
            const response = await this.fetch(`${this.API_ORIGIN}/onDemandCourses.v1/${courseId}`);
            const resJSON = (await response.json());
            return resJSON?.elements?.[0];
        }
        catch (err) {
            Logger.error(`Failed to get course data by courseId: ${courseId}`, err.message);
            return undefined;
        }
    }
    static getPlayer() {
        return super.getPlayer();
    }
    async getVideoData(videoId) {
        const data = this.getVideoDataByPlayer(videoId);
        if (!data) {
            return undefined;
        }
        const { options_: options } = CourseraHelper.getPlayer() ?? {};
        if (!data.subtitles?.length && options) {
            data.subtitles = options.tracks.map((track) => ({
                url: track.src,
                language: normalizeLang(track.srclang),
                source: this.SUBTITLE_SOURCE,
                format: this.SUBTITLE_FORMAT,
            }));
        }
        const courseId = options?.courseId;
        if (!courseId) {
            return data;
        }
        let courseLang = "en";
        const courseData = await this.getCourseData(courseId);
        if (courseData) {
            const { primaryLanguageCodes: [primaryLangauge], } = courseData;
            courseLang = primaryLangauge
                ? normalizeLang(primaryLangauge)
                : "en";
        }
        if (!availableLangs.includes(courseLang)) {
            courseLang = "en";
        }
        const subtitleItem = data.subtitles.find((subtitle) => subtitle.language === courseLang) ??
            data.subtitles?.[0];
        const subtitleUrl = subtitleItem?.url;
        if (!subtitleUrl) {
            Logger.warn("Failed to find any subtitle file");
        }
        const { url, duration } = data;
        const translationHelp = subtitleUrl
            ? [
                {
                    target: "subtitles_file_url",
                    targetUrl: subtitleUrl,
                },
                {
                    target: "video_file_url",
                    targetUrl: url,
                },
            ]
            : null;
        return {
            ...(subtitleUrl
                ? {
                    url: this.service?.url + videoId,
                    translationHelp,
                }
                : {
                    url,
                    translationHelp,
                }),
            detectedLanguage: courseLang,
            duration,
        };
    }
    async getVideoId(url) {
        const matched = /learn\/([^/]+)\/lecture\/([^/]+)/.exec(url.pathname) ??
            /lecture\/([^/]+)\/([^/]+)/.exec(url.pathname);
        return matched?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/cloudflarestream.js

class CloudflareStreamHelper extends BaseHelper {
    async getVideoId(url) {
        return url.pathname + url.search;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/douyin.js



class DouyinHelper extends BaseHelper {
    static getPlayer() {
        if (typeof player === "undefined") {
            return undefined;
        }
        return player;
    }
    async getVideoData(videoId) {
        const xgPlayer = DouyinHelper.getPlayer();
        if (!xgPlayer) {
            return undefined;
        }
        const { config: { url: sources, duration, lang, isLive: isStream }, } = xgPlayer;
        if (!sources) {
            return undefined;
        }
        const source = sources.find((s) => s.src.includes("www.douyin.com/aweme/v1/play/"));
        if (!source) {
            return undefined;
        }
        return {
            url: proxyMedia(source.src),
            duration,
            isStream,
            ...(availableLangs.includes(lang)
                ? { detectedLanguage: lang }
                : {}),
        };
    }
    async getVideoId(url) {
        const pathId = /video\/([\d]+)/.exec(url.pathname)?.[0];
        if (pathId) {
            return pathId;
        }
        return DouyinHelper.getPlayer()?.config.vid;
    }
}

;// ./node_modules/@vot.js/shared/dist/types/helpers/bannedvideo.js
var TypeName;
(function (TypeName) {
    TypeName["Channel"] = "Channel";
    TypeName["Video"] = "Video";
})(TypeName || (TypeName = {}));

;// ./node_modules/@vot.js/shared/dist/types/index.js





















;// ./node_modules/@vot.js/shared/dist/index.js









;// ./node_modules/@vot.js/ext/dist/helpers/loom.js




class LoomHelper extends BaseHelper {
    getClientVersion() {
        if (typeof SENTRY_RELEASE === "undefined") {
            return undefined;
        }
        return SENTRY_RELEASE.id;
    }
    async getVideoData(videoId) {
        try {
            const clientVer = this.getClientVersion();
            if (!clientVer) {
                throw new VideoHelperError("Failed to get client version");
            }
            const res = await this.fetch("https://www.loom.com/graphql", {
                headers: {
                    "User-Agent": data_config.userAgent,
                    "content-type": "application/json",
                    "x-loom-request-source": `loom_web_${clientVer}`,
                    "apollographql-client-name": "web",
                    "apollographql-client-version": clientVer,
                    "Alt-Used": "www.loom.com",
                },
                body: `{"operationName":"FetchCaptions","variables":{"videoId":"${videoId}"},"query":"query FetchCaptions($videoId: ID!, $password: String) {\\n  fetchVideoTranscript(videoId: $videoId, password: $password) {\\n    ... on VideoTranscriptDetails {\\n      id\\n      captions_source_url\\n      language\\n      __typename\\n    }\\n    ... on GenericError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`,
                method: "POST",
            });
            if (res.status !== 200) {
                throw new VideoHelperError("Failed to get data from graphql");
            }
            const result = (await res.json());
            const data = result.data.fetchVideoTranscript;
            if (data.__typename === "GenericError") {
                throw new VideoHelperError(data.message);
            }
            return {
                url: this.service.url + videoId,
                subtitles: [
                    {
                        format: "vtt",
                        language: normalizeLang(data.language),
                        source: "loom",
                        url: data.captions_source_url,
                    },
                ],
            };
        }
        catch (err) {
            Logger.error(`Failed to get Loom video data, because: ${err.message}`);
            return this.returnBaseData(videoId);
        }
    }
    async getVideoId(url) {
        return /(embed|share)\/([^/]+)?/.exec(url.pathname)?.[2];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/artstation.js



class ArtstationHelper extends BaseHelper {
    API_ORIGIN = "https://www.artstation.com/api/v2/learning";
    getCSRFToken() {
        return document.querySelector('meta[name="public-csrf-token"]')?.content;
    }
    async getCourseInfo(courseId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/courses/${courseId}/autoplay.json`, {
                method: "POST",
                headers: {
                    "PUBLIC-CSRF-TOKEN": this.getCSRFToken(),
                },
            });
            return (await res.json());
        }
        catch (err) {
            Logger.error(`Failed to get artstation course info by courseId: ${courseId}.`, err.message);
            return false;
        }
    }
    async getVideoUrl(chapterId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/quicksilver/video_url.json?chapter_id=${chapterId}`);
            const data = (await res.json());
            return data.url.replace("qsep://", "https://");
        }
        catch (err) {
            Logger.error(`Failed to get artstation video url by chapterId: ${chapterId}.`, err.message);
            return false;
        }
    }
    async getVideoData(videoId) {
        const [, courseId, , , chapterId] = videoId.split("/");
        const courseInfo = await this.getCourseInfo(courseId);
        if (!courseInfo) {
            return undefined;
        }
        const chapter = courseInfo.chapters.find((chapter) => chapter.hash_id === chapterId);
        if (!chapter) {
            return undefined;
        }
        const videoUrl = await this.getVideoUrl(chapter.id);
        if (!videoUrl) {
            return undefined;
        }
        const { title, duration, subtitles: videoSubtitles } = chapter;
        const subtitles = videoSubtitles
            .filter((subtitle) => subtitle.format === "vtt")
            .map((subtitle) => ({
            language: normalizeLang(subtitle.locale),
            source: "artstation",
            format: "vtt",
            url: subtitle.file_url,
        }));
        return {
            url: videoUrl,
            title,
            duration,
            subtitles,
        };
    }
    async getVideoId(url) {
        return /courses\/(\w{3,5})\/([^/]+)\/chapters\/(\w{3,5})/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/rtnews.js


class RtNewsHelper extends BaseHelper {
    async getVideoData(videoId) {
        const videoEl = document.querySelector(".jw-video, .media__video_noscript");
        if (!videoEl) {
            return undefined;
        }
        let videoSrc = videoEl.getAttribute("src");
        if (!videoSrc) {
            return undefined;
        }
        if (videoSrc.endsWith(".MP4")) {
            videoSrc = proxyMedia(videoSrc);
        }
        return {
            videoId,
            url: videoSrc,
        };
    }
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/bitview.js


class BitviewHelper extends BaseHelper {
    async getVideoData(videoId) {
        try {
            const videoUrl = document.querySelector(".vlScreen > video")?.src;
            if (!videoUrl) {
                throw new VideoHelperError("Failed to find video URL");
            }
            return {
                url: videoUrl,
            };
        }
        catch (err) {
            Logger.error(`Failed to get Bitview data by videoId: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return url.searchParams.get("v");
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/kickstarter.js



class KickstarterHelper extends BaseHelper {
    async getVideoData(videoId) {
        try {
            const videoEl = document.querySelector(".ksr-video-player > video");
            const url = videoEl?.querySelector("source[type^='video/mp4']")?.src;
            if (!url) {
                throw new VideoHelperError("Failed to find video URL");
            }
            const subtitles = videoEl?.querySelectorAll("track") ?? [];
            return {
                url,
                subtitles: Array.from(subtitles).reduce((result, sub) => {
                    const lang = sub.getAttribute("srclang");
                    const url = sub.getAttribute("src");
                    if (!lang || !url) {
                        return result;
                    }
                    result.push({
                        language: normalizeLang(lang),
                        url,
                        format: "vtt",
                        source: "kickstarter",
                    });
                    return result;
                }, []),
            };
        }
        catch (err) {
            Logger.error(`Failed to get Kickstarter data by videoId: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return url.pathname.slice(1);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/thisvid.js

class ThisVidHelper extends BaseHelper {
    async getVideoId(url) {
        return /(videos|embed)\/[^/]+/.exec(url.pathname)?.[0];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/ign.js




class IgnHelper extends BaseHelper {
    getVideoDataBySource(videoId) {
        const url = document.querySelector('.icms.video > source[type="video/mp4"][data-quality="360"]')?.src;
        if (!url) {
            return this.returnBaseData(videoId);
        }
        return {
            url: proxyMedia(url),
        };
    }
    getVideoDataByNext(videoId) {
        try {
            const nextContent = document.getElementById("__NEXT_DATA__")?.textContent;
            if (!nextContent) {
                throw new VideoDataError("Not found __NEXT_DATA__ content");
            }
            const data = JSON.parse(nextContent);
            const { props: { pageProps: { page: { description, title, video: { videoMetadata: { duration }, assets, }, }, }, }, } = data;
            const videoUrl = assets.find((asset) => asset.height === 360 && asset.url.includes(".mp4"))?.url;
            if (!videoUrl) {
                throw new VideoDataError("Not found video URL in assets");
            }
            return {
                url: proxyMedia(videoUrl),
                duration,
                title,
                description,
            };
        }
        catch (err) {
            Logger.warn(`Failed to get ign video data by video ID: ${videoId}, because ${err.message}. Using clear link instead...`);
            return this.returnBaseData(videoId);
        }
    }
    async getVideoData(videoId) {
        if (document.getElementById("__NEXT_DATA__")) {
            return this.getVideoDataByNext(videoId);
        }
        return this.getVideoDataBySource(videoId);
    }
    async getVideoId(url) {
        return (/([^/]+)\/([\d]+)\/video\/([^/]+)/.exec(url.pathname)?.[0] ??
            /\/videos\/([^/]+)/.exec(url.pathname)?.[0]);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/bunkr.js

class BunkrHelper extends BaseHelper {
    async getVideoData(videoId) {
        const url = document.querySelector('#player > source[type="video/mp4"]')?.src;
        if (!url) {
            return undefined;
        }
        return {
            url,
        };
    }
    async getVideoId(url) {
        return /\/f\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/imdb.js

class IMDbHelper extends BaseHelper {
    async getVideoId(url) {
        return /video\/([^/]+)/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/telegram.js

class TelegramHelper extends BaseHelper {
    static getMediaViewer() {
        if (typeof appMediaViewer === "undefined") {
            return undefined;
        }
        return appMediaViewer;
    }
    async getVideoId(_url) {
        const mediaViewer = TelegramHelper.getMediaViewer();
        if (!mediaViewer) {
            return undefined;
        }
        if (mediaViewer.live) {
            return undefined;
        }
        const message = mediaViewer.target.message;
        if (message.peer_id._ !== "peerChannel") {
            return undefined;
        }
        const media = message.media;
        if (media._ !== "messageMediaDocument") {
            return undefined;
        }
        if (media.document.type !== "video") {
            return undefined;
        }
        const postId = message.mid & 0xffffffff;
        const username = await mediaViewer.managers.appPeersManager.getPeerUsername(message.peerId);
        return `${username}/${postId}`;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/index.js



















































































































const availableHelpers = {
    [VideoService.mailru]: MailRuHelper,
    [VideoService.weverse]: WeverseHelper,
    [VideoService.kodik]: KodikHelper,
    [VideoService.patreon]: PatreonHelper,
    [VideoService.reddit]: RedditHelper,
    [VideoService.bannedvideo]: BannedVideoHelper,
    [VideoService.kick]: KickHelper,
    [VideoService.appledeveloper]: AppleDeveloperHelper,
    [VideoService.epicgames]: EpicGamesHelper,
    [VideoService.odysee]: OdyseeHelper,
    [VideoService.coursehunterLike]: CoursehunterLikeHelper,
    [VideoService.twitch]: TwitchHelper,
    [VideoService.sap]: SapHelper,
    [VideoService.linkedin]: LinkedinHelper,
    [VideoService.vimeo]: VimeoHelper,
    [VideoService.yandexdisk]: YandexDiskHelper,
    [VideoService.vk]: VKHelper,
    [VideoService.trovo]: TrovoHelper,
    [VideoService.incestflix]: IncestflixHelper,
    [VideoService.porntn]: PornTNHelper,
    [VideoService.googledrive]: GoogleDriveHelper,
    [VideoService.bilibili]: BilibiliHelper,
    [VideoService.xvideos]: XVideosHelper,
    [VideoService.watchpornto]: WatchPornToHelper,
    [VideoService.archive]: ArchiveHelper,
    [VideoService.dailymotion]: DailymotionHelper,
    [VideoService.youku]: YoukuHelper,
    [VideoService.egghead]: EggheadHelper,
    [VideoService.newgrounds]: NewgroundsHelper,
    [VideoService.okru]: OKRuHelper,
    [VideoService.peertube]: PeertubeHelper,
    [VideoService.eporner]: EpornerHelper,
    [VideoService.bitchute]: BitchuteHelper,
    [VideoService.rutube]: RutubeHelper,
    [VideoService.facebook]: FacebookHelper,
    [VideoService.rumble]: RumbleHelper,
    [VideoService.twitter]: TwitterHelper,
    [VideoService.pornhub]: PornhubHelper,
    [VideoService.tiktok]: TikTokHelper,
    [VideoService.proxitok]: TikTokHelper,
    [VideoService.nine_gag]: NineGAGHelper,
    [VideoService.youtube]: YoutubeHelper,
    [VideoService.ricktube]: YoutubeHelper,
    [VideoService.invidious]: YoutubeHelper,
    [VideoService.poketube]: YoutubeHelper,
    [VideoService.piped]: YoutubeHelper,
    [VideoService.dzen]: DzenHelper,
    [VideoService.cloudflarestream]: CloudflareStreamHelper,
    [VideoService.loom]: LoomHelper,
    [VideoService.rtnews]: RtNewsHelper,
    [VideoService.bitview]: BitviewHelper,
    [VideoService.thisvid]: ThisVidHelper,
    [VideoService.ign]: IgnHelper,
    [VideoService.bunkr]: BunkrHelper,
    [VideoService.imdb]: IMDbHelper,
    [VideoService.telegram]: TelegramHelper,
    [ExtVideoService.udemy]: UdemyHelper,
    [ExtVideoService.coursera]: CourseraHelper,
    [ExtVideoService.douyin]: DouyinHelper,
    [ExtVideoService.artstation]: ArtstationHelper,
    [ExtVideoService.kickstarter]: KickstarterHelper,
};
class VideoHelper {
    helpersData;
    constructor(helpersData = {}) {
        this.helpersData = helpersData;
    }
    getHelper(service) {
        return new availableHelpers[service](this.helpersData);
    }
}

;// ./node_modules/@vot.js/ext/dist/utils/videoData.js




function getService() {
    if (localLinkRe.exec(window.location.href)) {
        return [];
    }
    const hostname = window.location.hostname;
    const enteredURL = new URL(window.location.href);
    const isMathes = (match) => {
        if (match instanceof RegExp) {
            return match.test(hostname);
        }
        else if (typeof match === "string") {
            return hostname.includes(match);
        }
        else if (typeof match === "function") {
            return match(enteredURL);
        }
        return false;
    };
    return sites.filter((e) => {
        return ((Array.isArray(e.match) ? e.match.some(isMathes) : isMathes(e.match)) &&
            e.host &&
            e.url);
    });
}
async function getVideoID(service, opts = {}) {
    const url = new URL(window.location.href);
    const serviceHost = service.host;
    if (Object.keys(availableHelpers).includes(serviceHost)) {
        const helper = new VideoHelper(opts).getHelper(serviceHost);
        return await helper.getVideoId(url);
    }
    return serviceHost === VideoService.custom ? url.href : undefined;
}
async function getVideoData(service, opts = {}) {
    const videoId = await getVideoID(service, opts);
    if (!videoId) {
        throw new VideoDataError(`Entered unsupported link: "${service.host}"`);
    }
    const origin = window.location.origin;
    if ([
        VideoService.peertube,
        VideoService.coursehunterLike,
        VideoService.cloudflarestream,
    ].includes(service.host)) {
        service.url = origin;
    }
    if (service.rawResult) {
        return {
            url: videoId,
            videoId,
            host: service.host,
            duration: undefined,
        };
    }
    if (!service.needExtraData) {
        return {
            url: service.url + videoId,
            videoId,
            host: service.host,
            duration: undefined,
        };
    }
    const helper = new VideoHelper({
        ...opts,
        service,
        origin,
    }).getHelper(service.host);
    const result = await helper.getVideoData(videoId);
    if (!result) {
        throw new VideoDataError(`Failed to get video raw url for ${service.host}`);
    }
    return {
        ...result,
        videoId,
        host: service.host,
    };
}

;// ./node_modules/@vot.js/ext/dist/types/index.js










;// ./node_modules/@vot.js/ext/dist/index.js






;// ./node_modules/lit-html/lit-html.js
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.trustedTypes,s=i?i.createPolicy("lit-html",{createHTML:t=>t}):void 0,e="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,o="?"+h,n=`<${o}>`,r=document,l=()=>r.createComment(""),c=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,_=/>/g,m=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),b=y(2),w=y(3),T=Symbol.for("lit-noChange"),E=Symbol.for("lit-nothing"),A=new WeakMap,C=r.createTreeWalker(r,129);function P(t,i){if(!a(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s?s.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":3===i?"<math>":"",c=f;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f?"!--"===u[1]?c=v:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m):void 0!==u[3]&&(c=m):c===m?">"===u[0]?(c=r??f,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m:'"'===u[3]?g:p):c===g||c===p?c=m:c===v||c===_?c=f:(c=m,r=void 0);const x=c===m&&t[i+1].startsWith("/>")?" ":"";l+=c===f?s+n:d>=0?(o.push(a),s.slice(0,d)+e+s.slice(d)+h+x):s+h+(-2===d?i:x)}return[P(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),o]};class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=V(t,s);if(this.el=N.createElement(f,n),C.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=C.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e)){const i=v[a++],s=r.getAttribute(t).split(h),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?H:"?"===e[1]?I:"@"===e[1]?L:k}),r.removeAttribute(t)}else t.startsWith(h)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h),s=t.length-1;if(s>0){r.textContent=i?i.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),C.nextNode(),d.push({type:2,index:++c});r.append(t[s],l())}}}else if(8===r.nodeType)if(r.data===o)d.push({type:2,index:c});else{let t=-1;for(;-1!==(t=r.data.indexOf(h,t+1));)d.push({type:7,index:c}),t+=h.length-1}c++}}static createElement(t,i){const s=r.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){if(i===T)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=S(t,h._$AS(t,i.values),h,e)),i}class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r).importNode(i,!0);C.currentNode=e;let h=C.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new R(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new z(h,this,t)),this._$AV.push(i),l=s[++n]}o!==l?.index&&(h=C.nextNode(),o++)}return C.currentNode=r,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=E,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),c(t)?t===E||null==t||""===t?(this._$AH!==E&&this._$AR(),this._$AH=E):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==E&&c(this._$AH)?this._$AA.nextSibling.data=t:this.T(r.createTextNode(t)),this._$AH=t}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(P(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else{const t=new M(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new N(t)),i}k(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new R(this.O(l()),this.O(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e)}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=E,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=E}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=S(this,t,i,0),o=!c(t)||t!==this._$AH&&t!==T,o&&(this._$AH=t);else{const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=S(this,e[s+n],i,n),r===T&&(r=this._$AH[n]),o||=!c(r)||r!==this._$AH[n],r===E?t=E:t!==E&&(t+=(r??"")+h[n+1]),this._$AH[n]=r}o&&!e&&this.j(t)}j(t){t===E?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===E?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==E)}}class L extends k{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5}_$AI(t,i=this){if((t=S(this,t,i,0)??E)===T)return;const s=this._$AH,e=t===E&&s!==E||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==E&&(s===E||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t)}}const Z={M:e,P:h,A:o,C:1,L:V,R:M,D:u,V:S,I:R,H:k,N:I,U:L,B:H,F:z},j=t.litHtmlPolyfillSupport;j?.(N,R),(t.litHtmlVersions??=[]).push("3.3.0");const B=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new R(i.insertBefore(l(),t),t,void 0,s??{})}return h._$AI(t),h};
//# sourceMappingURL=lit-html.js.map

// EXTERNAL MODULE: ./src/styles/main.scss
var main = __webpack_require__("./src/styles/main.scss");
;// ./src/ui.js




// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class UI {
  /**
   * Auxiliary method for creating HTML elements
   *
   * @param {string} tag - Element tag
   * @param {string[]} classes - List of classes for element
   * @param {HTMLElement|string|null} content - Internal content (optional)
   * @return {HTMLElement} Created element
   */
  static createEl(tag, classes = [], content = null) {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (content !== null) el.append(content);
    return el;
  }

  /**
   * Create header element
   *
   * @param {HTMLElement|string} html - header content
   * @param {1|2|3|4|5|6} level - header level
   * @return {HTMLElement} HTML header element
   */
  static createHeader(html, level = 4) {
    const header = UI.createEl("vot-block", [
      "vot-header",
      `vot-header-level-${level}`,
    ]);
    header.append(html);
    return header;
  }

  /**
   * Create information element
   *
   * @param {HTMLElement|string} labelHtml - label content
   * @param {import("./types/components/shared").LitHtml} valueHtml - value content
   * @return {{
   *  container: HTMLElement,
   *  header: HTMLElement,
   *  value: HTMLElement
   * }} information elements
   */
  static createInformation(labelHtml, valueHtml) {
    const container = UI.createEl("vot-block", ["vot-info"]);
    const header = UI.createEl("vot-block");
    B(labelHtml, header);
    const value = UI.createEl("vot-block");
    B(valueHtml, value);
    container.append(header, value);
    return { container, header, value };
  }

  /**
   * Create button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML button element
   */
  static createButton(html) {
    const button = UI.createEl("vot-block", ["vot-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create text button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML text button element
   */
  static createTextButton(html) {
    const button = UI.createEl("vot-block", ["vot-text-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create outlined button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML outlined button element
   */
  static createOutlinedButton(html) {
    const button = UI.createEl("vot-block", ["vot-outlined-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create icon button
   *
   * @param {TemplateResult} templateHtml - icon svg lit template
   * @return {HTMLElement} HTML icon button element
   */
  static createIconButton(templateHtml) {
    const button = UI.createEl("vot-block", ["vot-icon-button"]);
    B(templateHtml, button);
    return button;
  }

  static createInlineLoader() {
    return UI.createEl("vot-block", ["vot-inline-loader"]);
  }

  static createPortal(local = false) {
    return UI.createEl("vot-block", [`vot-portal${local ? "-local" : ""}`]);
  }

  static createSubtitleInfo(word, desc, translationService) {
    const container = UI.createEl("vot-block", ["vot-subtitles-info"]);
    container.id = "vot-subtitles-info";
    const translatedWith = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-service"],
      localizationProvider
        .get("VOTTranslatedBy")
        .replace("{0}", translationService),
    );
    const header = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-header"],
      word,
    );
    const context = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-context"],
      desc,
    );

    container.append(translatedWith, header, context);

    return {
      container,
      translatedWith,
      header,
      context,
    };
  }
}

;// ./node_modules/@vot.js/shared/dist/utils/subs.js
function convertToStrTime(ms, delimiter = ",") {
    const seconds = ms / 1000;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor(ms % 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}${delimiter}${milliseconds.toString().padStart(3, "0")}`;
}
function convertToMSTime(time) {
    const parts = time.split(" ")?.[0]?.split(":");
    if (parts.length < 3) {
        parts.unshift("00");
    }
    const [strHours, strMinutes, strSeconds] = parts;
    const secs = +strSeconds.replace(/[,.]/, "");
    const mins = +strMinutes * 60_000;
    const hours = +strHours * 3_600_000;
    return hours + mins + secs;
}
function convertSubsFromJSON(data, output = "srt") {
    const isVTT = output === "vtt";
    const delimiter = isVTT ? "." : ",";
    const subs = data.subtitles
        .map((sub, idx) => {
        const result = isVTT ? "" : `${idx + 1}\n`;
        return (result +
            `${convertToStrTime(sub.startMs, delimiter)} --> ${convertToStrTime(sub.startMs + sub.durationMs, delimiter)}\n${sub.text}\n\n`);
    })
        .join("")
        .trim();
    return isVTT ? `WEBVTT\n\n${subs}` : subs;
}
function convertSubsToJSON(data, from = "srt") {
    const parts = data.split(/\r?\n\r?\n/g);
    if (from === "vtt") {
        parts.shift();
    }
    if (/^\d+\r?\n/.exec(parts?.[0] ?? "")) {
        from = "srt";
    }
    const offset = +(from === "srt");
    const subtitles = parts.reduce((result, part) => {
        const lines = part.trim().split("\n");
        const time = lines[offset];
        const text = lines.slice(offset + 1).join("\n");
        if ((lines.length !== 2 || !part.includes(" --> ")) &&
            !time?.includes(" --> ")) {
            if (result.length === 0) {
                return result;
            }
            result[result.length - 1].text += `\n\n${lines.join("\n")}`;
            return result;
        }
        const [start, end] = time.split(" --> ");
        const startMs = convertToMSTime(start);
        const endMs = convertToMSTime(end);
        const durationMs = endMs - startMs;
        result.push({
            text,
            startMs,
            durationMs,
            speakerId: "0",
        });
        return result;
    }, []);
    return {
        containsTokens: false,
        subtitles,
    };
}
function getSubsFormat(data) {
    if (typeof data !== "string") {
        return "json";
    }
    if (/^(WEBVTT([^\n]+)?)(\r?\n)/.exec(data)) {
        return "vtt";
    }
    return "srt";
}
function convertSubs(data, output = "srt") {
    const from = getSubsFormat(data);
    if (from === output)
        return data;
    if (from === "json") {
        return convertSubsFromJSON(data, output);
    }
    data = convertSubsToJSON(data, from);
    if (output === "json") {
        return data;
    }
    return convertSubsFromJSON(data, output);
}

;// ./src/utils/translateApis.ts










/**
 * Limit: 10k symbols for yandex, 50k for msedge
 */
const FOSWLYTranslateAPI = new (class {
  isFOSWLYError(
    data,
  ) {
    return Object.hasOwn(data, "error");
  }

  async request(
    path,
    opts = {},
  ) {
    try {
      const res = await GM_fetch(`${foswlyTranslateUrl}${path}`, {
        timeout: 3000,
        ...opts,
      });

      const data = (await res.json()) ;
      if (this.isFOSWLYError(data)) {
        throw data.error;
      }

      return data;
    } catch (err) {
      console.error(
        `[VOT] Failed to get data from FOSWLY Translate API, because ${
          (err ).message
        }`,
      );
      return undefined;
    }
  }

  async translateMultiple(
    text,
    lang,
    service,
  ) {
    const result = await this.request(
      "/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          lang,
          service,
        }),
      },
    );

    return result ? result.translations : text;
  }

  async translate(
    text,
    lang,
    service,
  ) {
    const result = await this.request(
      `/translate?${new URLSearchParams({
        text,
        lang,
        service,
      })}`,
    );

    return result ? result.translations[0] : text;
  }

  async detect(
    text,
    service,
  ) {
    const result = await this.request(
      `/detect?${new URLSearchParams({
        text,
        service,
      })}`,
    );

    return result ? result.lang : "en";
  }
})();

const RustServerAPI = {
  async detect(text) {
    try {
      const response = await GM_fetch(detectRustServerUrl, {
        method: "POST",
        body: text,
        timeout: 3000,
      });

      return await response.text();
    } catch (error) {
      console.error(
        `[VOT] Error getting lang from text, because ${
          (error ).message
        }`,
      );
      return "en";
    }
  },
};

async function translate(
  text,
  fromLang = "",
  toLang = "ru",
) {
  const service = await votStorage.get(
    "translationService",
    defaultTranslationService,
  );
  switch (service) {
    case "yandexbrowser":
    case "msedge": {
      const langPair = fromLang && toLang ? `${fromLang}-${toLang}` : toLang;
      return Array.isArray(text)
        ? await FOSWLYTranslateAPI.translateMultiple(text, langPair, service)
        : await FOSWLYTranslateAPI.translate(text, langPair, service);
    }
    default:
      return text;
  }
}

async function detect(text) {
  const service = await votStorage.get("detectService", defaultDetectService);
  switch (service) {
    case "yandexbrowser":
    case "msedge":
      return await FOSWLYTranslateAPI.detect(text, service);
    case "rust-server":
      return await RustServerAPI.detect(text);
    default:
      return "en";
  }
}

const foswlyServices = ["yandexbrowser", "msedge"] ;
const detectServices = [...foswlyServices, "rust-server"] ;



;// ./src/types/components/tooltip.ts
const positions = ["left", "top", "right", "bottom"] ;
 

const triggers = ["hover", "click"] ;
 







































;// ./src/ui/components/tooltip.ts




class Tooltip {
  showed = false;

  target;
  anchor;
  content;
  position;
  trigger;
  parentElement;
  layoutRoot;
  offsetX;
  offsetY;
  hidden;
  autoLayout;

  pageWidth;
  pageHeight;
  globalOffsetX;
  globalOffsetY;
  maxWidth;
  backgroundColor;
  borderRadius;
  _bordered;

  container;
  onResizeObserver;
  intersectionObserver;

  constructor({
    target,
    anchor = undefined,
    content = "",
    position = "top",
    trigger = "hover",
    offset = 4,
    maxWidth = undefined,
    hidden = false,
    autoLayout = true,
    backgroundColor = undefined,
    borderRadius = undefined,
    bordered = true,
    parentElement = document.body,
    layoutRoot = document.documentElement,
  }) {
    if (!(target instanceof HTMLElement)) {
      throw new Error("target must be a valid HTMLElement");
    }

    this.target = target;
    this.anchor = anchor instanceof HTMLElement ? anchor : target;
    this.content = content;
    if (typeof offset === "number") {
      this.offsetY = this.offsetX = offset;
    } else {
      this.offsetX = offset.x;
      this.offsetY = offset.y;
    }
    this.hidden = hidden;
    this.autoLayout = autoLayout;
    this.trigger = Tooltip.validateTrigger(trigger) ? trigger : "hover";
    this.position = Tooltip.validatePos(position) ? position : "top";
    this.parentElement = parentElement;
    this.layoutRoot = layoutRoot;
    this.borderRadius = borderRadius;
    this._bordered = bordered;
    this.maxWidth = maxWidth;
    this.backgroundColor = backgroundColor;
    this.updatePageSize();
    this.init();
  }

  static validatePos(position) {
    return positions.includes(position);
  }

  static validateTrigger(trigger) {
    return triggers.includes(trigger);
  }

  setPosition(position) {
    this.position = Tooltip.validatePos(position) ? position : "top";
    this.updatePos();
    return this;
  }

  setContent(content) {
    this.content = content;
    this.destroy();
    return this;
  }

  onResize = () => {
    this.updatePageSize();
    this.updatePos();
  };

  onClick = () => {
    this.showed ? this.destroy() : this.create();
  };

  onScroll = () => {
    requestAnimationFrame(() => {
      this.updatePageSize();
      this.updatePos();
    });
  };

  onHoverPointerDown = (e) => {
    if (e.pointerType === "mouse") {
      return;
    }

    this.create();
  };

  onHoverPointerUp = (e) => {
    if (e.pointerType === "mouse") {
      return;
    }

    this.destroy();
  };

  onMouseEnter = () => {
    this.create();
  };

  onMouseLeave = () => {
    this.destroy();
  };

  updatePageSize() {
    if (this.layoutRoot !== document.documentElement) {
      const { left, top } = this.parentElement.getBoundingClientRect();
      this.globalOffsetX = left;
      this.globalOffsetY = top;
    } else {
      this.globalOffsetX = 0;
      this.globalOffsetY = 0;
    }

    this.pageWidth =
      (this.layoutRoot.clientWidth || document.documentElement.clientWidth) +
      window.pageXOffset;
    this.pageHeight =
      (this.layoutRoot.clientHeight || document.documentElement.clientHeight) +
      window.pageYOffset;
    return this;
  }

  onIntersect = ([entry]) => {
    if (!entry.isIntersecting) {
      return this.destroy(true);
    }
  };

  init() {
    this.onResizeObserver = new ResizeObserver(this.onResize);
    this.intersectionObserver = new IntersectionObserver(this.onIntersect);
    document.addEventListener("scroll", this.onScroll, {
      passive: true,
      capture: true,
    });
    if (this.trigger === "click") {
      this.target.addEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.addEventListener("mouseenter", this.onMouseEnter);
    this.target.addEventListener("mouseleave", this.onMouseLeave);
    this.target.addEventListener("pointerdown", this.onHoverPointerDown);
    this.target.addEventListener("pointerup", this.onHoverPointerUp);

    return this;
  }

  release() {
    this.destroy();
    document.removeEventListener("scroll", this.onScroll, {
      capture: true,
    });
    if (this.trigger === "click") {
      this.target.removeEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.removeEventListener("mouseenter", this.onMouseEnter);
    this.target.removeEventListener("mouseleave", this.onMouseLeave);
    this.target.removeEventListener("pointerdown", this.onHoverPointerDown);
    this.target.removeEventListener("pointerup", this.onHoverPointerUp);
    return this;
  }

   create() {
    this.destroy(true);
    this.showed = true;
    this.container = UI.createEl("vot-block", ["vot-tooltip"], this.content);
    if (this.bordered) {
      this.container.classList.add("vot-tooltip-bordered");
    }

    this.container.setAttribute("role", "tooltip");
    this.container.dataset.trigger = this.trigger;
    this.container.dataset.position = this.position;
    this.parentElement.appendChild(this.container);

    this.updatePos();
    if (this.backgroundColor !== undefined) {
      this.container.style.backgroundColor = this.backgroundColor;
    }

    if (this.borderRadius !== undefined) {
      this.container.style.borderRadius = `${this.borderRadius}px`;
    }

    if (this.hidden) {
      this.container.hidden = true;
    }

    this.container.style.opacity = "1";
    this.onResizeObserver?.observe(this.layoutRoot);
    this.intersectionObserver?.observe(this.target);
    return this;
  }

  updatePos() {
    if (!this.container) {
      return this;
    }

    const { top, left } = this.calcPos(this.autoLayout);
    const availableWidth = this.pageWidth - this.offsetX * 2;
    const maxWidth =
      this.maxWidth ??
      Math.min(
        availableWidth,
        this.pageWidth - Math.min(left, this.pageWidth - availableWidth),
      );

    this.container.style.transform = `translate(${left}px, ${top}px)`;
    this.container.style.maxWidth = `${maxWidth}px`;
    return this;
  }

  calcPos(autoLayout = true) {
    if (!this.container) {
      return { top: 0, left: 0 };
    }

    const {
      left: anchorLeft,
      right: anchorRight,
      top: anchorTop,
      bottom: anchorBottom,
      width: anchorWidth,
      height: anchorHeight,
    } = this.anchor.getBoundingClientRect();
    const { width, height } = this.container.getBoundingClientRect();

    const left = anchorLeft - this.globalOffsetX;
    const right = anchorRight - this.globalOffsetX;
    const top = anchorTop - this.globalOffsetY;
    const bottom = anchorBottom - this.globalOffsetY;

    switch (this.position) {
      case "top": {
        const pTop = clamp(top - height - this.offsetY, 0, this.pageHeight);
        if (autoLayout && pTop + this.offsetY < height) {
          this.position = "bottom";
          return this.calcPos(false);
        }

        return {
          top: pTop,
          left: clamp(
            left - width / 2 + anchorWidth / 2,
            this.offsetX,
            this.pageWidth - width - this.offsetX,
          ),
        };
      }
      case "right": {
        const pLeft = clamp(right + this.offsetX, 0, this.pageWidth - width);
        if (autoLayout && pLeft + width > this.pageWidth - this.offsetX) {
          this.position = "left";
          return this.calcPos(false);
        }

        return {
          top: clamp(
            top + (anchorHeight - height) / 2,
            this.offsetY,
            this.pageHeight - height - this.offsetY,
          ),
          left: pLeft,
        };
      }
      case "bottom": {
        const pTop = clamp(bottom + this.offsetY, 0, this.pageHeight - height);
        if (autoLayout && pTop + height > this.pageHeight - this.offsetY) {
          this.position = "top";
          return this.calcPos(false);
        }

        return {
          top: pTop,
          left: clamp(
            left - width / 2 + anchorWidth / 2,
            this.offsetX,
            this.pageWidth - width - this.offsetX,
          ),
        };
      }
      case "left": {
        const pLeft = Math.max(0, left - width - this.offsetX);
        if (autoLayout && pLeft + width > left - this.offsetX) {
          this.position = "right";
          return this.calcPos(false);
        }

        return {
          top: clamp(
            top + (anchorHeight - height) / 2,
            this.offsetY,
            this.pageHeight - height - this.offsetY,
          ),
          left: pLeft,
        };
      }
      default:
        return { top: 0, left: 0 };
    }
  }

   destroy(instant = false) {
    if (!this.container) {
      return this;
    }

    this.showed = false;
    this.onResizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (instant) {
      this.container.remove();
      return this;
    }

    const container = this.container;
    container.style.opacity = "0";
    container.addEventListener(
      "transitionend",
      () => {
        container?.remove();
      },
      {
        once: true,
      },
    );

    return this;
  }

  set bordered(isBordered) {
    this._bordered = isBordered;
    this.container?.classList.toggle("vot-tooltip-bordered");
  }

  get bordered() {
    return this._bordered;
  }
}

;// ./src/subtitles.js











// biome-ignore lint/complexity/noStaticOnlyClass: waiting rewrite to ts
class SubtitlesProcessor {
  static formatYandexTokens(line) {
    const lineEndMs = line.startMs + line.durationMs;
    return line.tokens.reduce((result, token, index) => {
      const nextToken = line.tokens[index + 1];
      const lastToken = result[result.length - 1];
      const alignRangeEnd = lastToken?.alignRange?.end ?? 0;
      const newAlignRangeEnd = alignRangeEnd + token.text.length;

      token.alignRange = {
        start: alignRangeEnd,
        end: newAlignRangeEnd,
      };
      result.push(token);

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

  static createTokens(line, previousLineLastToken) {
    const tokens = line.text.split(/([\n \t])/).reduce((result, tokenText) => {
      if (!tokenText.length) return result;

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
      return result;
    }, []);

    const tokenDurationMs = Math.floor(line.durationMs / tokens.length);
    const lineEndMs = line.startMs + line.durationMs;

    return tokens.map((token, index) => {
      const isLastToken = index === tokens.length - 1;
      const startMs = line.startMs + tokenDurationMs * index;
      const durationMs = isLastToken ? lineEndMs - startMs : tokenDurationMs;
      return {
        ...token,
        startMs,
        durationMs,
      };
    });
  }

  static processTokens(subtitles, subtitlesObject) {
    const result = [];
    let lastToken;
    const { source, isAutoGenerated } = subtitlesObject;

    for (const line of subtitles.subtitles) {
      const hasTokens = line?.tokens?.length;
      const tokens =
        hasTokens &&
        (source === "yandex" || (source === "youtube" && isAutoGenerated))
          ? SubtitlesProcessor.formatYandexTokens(line)
          : SubtitlesProcessor.createTokens(line, lastToken);

      lastToken = tokens[tokens.length - 1];
      result.push({
        ...line,
        tokens,
      });
    }

    subtitles.containsTokens = true;
    return result;
  }

  static formatYoutubeSubtitles(subtitles, isAsr = false) {
    if (!subtitles?.events?.length) {
      console.error("[VOT] Invalid YouTube subtitles format:", subtitles);
      return {
        containsTokens: isAsr,
        subtitles: [],
      };
    }

    const result = {
      containsTokens: isAsr,
      subtitles: [],
    };

    for (let i = 0; i < subtitles.events.length; i++) {
      const subtitle = subtitles.events[i];
      if (!subtitle.segs) continue;

      let durationMs = subtitle.dDurationMs;
      if (
        subtitles.events[i + 1] &&
        subtitle.tStartMs + subtitle.dDurationMs >
          subtitles.events[i + 1].tStartMs
      ) {
        durationMs = subtitles.events[i + 1].tStartMs - subtitle.tStartMs;
      }

      const tokens = [];
      let lastSegDuration = durationMs;

      for (let j = 0; j < subtitle.segs.length; j++) {
        const seg = subtitle.segs[j];
        const text = seg.utf8.trim();
        if (text === "\n") continue;

        const offset = seg.tOffsetMs ?? 0;
        let segDuration = durationMs;
        const nextSeg = subtitle.segs[j + 1];

        if (nextSeg?.tOffsetMs) {
          segDuration = nextSeg.tOffsetMs - offset;
          lastSegDuration -= segDuration;
        }

        tokens.push({
          text,
          startMs: subtitle.tStartMs + offset,
          durationMs: nextSeg ? segDuration : lastSegDuration,
        });
      }

      const text = tokens.map((e) => e.text).join(" ");
      if (text) {
        result.subtitles.push({
          text,
          startMs: subtitle.tStartMs,
          durationMs,
          ...(isAsr
            ? {
                tokens,
              }
            : {}),
        });
      }
    }

    return result;
  }
  /**
   * Remove HTML tags from JSON subtitle text
   */
  static cleanJsonSubtitles(subtitles) {
    const { containsTokens, subtitles: subtitlesList } = subtitles;
    return {
      containsTokens,
      subtitles: subtitlesList.map((item) => ({
        ...item,
        text: item.text.replace(/(<([^>]+)>)/gi, ""),
      })),
    };
  }

  static async fetchSubtitles(subtitlesObject) {
    const { source, isAutoGenerated, format, url } = subtitlesObject;

    try {
      const response = await GM_fetch(url, {
        timeout: 7000,
      });
      let subtitles;

      if (["vtt", "srt"].includes(format)) {
        const text = await response.text();
        subtitles = convertSubs(text, "json");
      } else {
        subtitles = await response.json();
      }

      if (source === "youtube") {
        subtitles = SubtitlesProcessor.formatYoutubeSubtitles(
          subtitles,
          isAutoGenerated,
        );
      } else if (source === "vk") {
        subtitles = SubtitlesProcessor.cleanJsonSubtitles(subtitles);
      }

      subtitles.subtitles = SubtitlesProcessor.processTokens(
        subtitles,
        subtitlesObject,
      );
      console.log("[VOT] Processed subtitles:", subtitles);
      return subtitles;
    } catch (error) {
      console.error("[VOT] Failed to process subtitles:", error);
      return {
        containsTokens: false,
        subtitles: [],
      };
    }
  }

  static async getSubtitles(client, videoData) {
    const {
      host,
      url,
      detectedLanguage: requestLang,
      videoId,
      duration,
      subtitles: extraSubtitles = [],
    } = videoData;

    try {
      const res = await Promise.race([
        client.getSubtitles({
          videoData: {
            host,
            url,
            videoId,
            duration,
          },
          requestLang,
        }),
        timeout(5000, "Timeout"),
      ]);

      console.log("[VOT] Subtitles response:", res);
      if (res.waiting) {
        console.error("[VOT] Failed to get Yandex subtitles");
      }

      const yandexSubs = (res.subtitles ?? []).reduce((result, sub) => {
        if (
          sub.language &&
          !result.find(
            (e) =>
              e.source === "yandex" &&
              e.language === sub.language &&
              !e.translatedFromLanguage,
          )
        ) {
          result.push({
            source: "yandex",
            language: sub.language,
            url: sub.url,
          });
        }

        if (sub.translatedLanguage) {
          result.push({
            source: "yandex",
            language: sub.translatedLanguage,
            translatedFromLanguage: sub.language,
            url: sub.translatedUrl,
          });
        }

        return result;
      }, []);

      return [...yandexSubs, ...extraSubtitles].sort((a, b) => {
        // Source priority
        if (a.source !== b.source) {
          return a.source === "yandex" ? -1 : 1;
        }

        // Language priority
        if (
          a.language !== b.language &&
          (a.language === lang || b.language === lang)
        ) {
          return a.language === lang ? -1 : 1;
        }

        if (a.source === "yandex") {
          // Translation priority
          if (a.translatedFromLanguage !== b.translatedFromLanguage) {
            if (!a.translatedFromLanguage || !b.translatedFromLanguage) {
              return a.language === b.language
                ? a.translatedFromLanguage
                  ? 1
                  : -1
                : !a.translatedFromLanguage
                  ? 1
                  : -1;
            }
            return a.translatedFromLanguage === requestLang ? -1 : 1;
          }

          // Non-translated language priority
          if (!a.translatedFromLanguage) {
            return a.language === requestLang ? -1 : 1;
          }
        }

        // Auto-generated priority
        if (a.source !== "yandex" && a.isAutoGenerated !== b.isAutoGenerated) {
          return a.isAutoGenerated ? 1 : -1;
        }

        return 0;
      });
    } catch (error) {
      const message =
        error.message === "Timeout"
          ? "Failed to get Yandex subtitles: timeout"
          : "Error in getSubtitles function";
      console.error(`[VOT] ${message}`, error);
      // на сайтах, где нет сабов всегда красит кнопку
      throw error;
    }
  }
}

class SubtitlesWidget {
  constructor(video, container, site, portal, tooltipLayoutRoot = undefined) {
    this.video = video;
    this.container = container;
    this.site = site;
    this.tooltipLayoutRoot = tooltipLayoutRoot;

    this.portal = portal;
    this.subtitlesContainer = this.createSubtitlesContainer();
    this.position = {
      left: 25,
      top: 75,
    };
    this.dragging = {
      active: false,
      offset: {
        x: 0,
        y: 0,
      },
    };

    this.subtitles = null;
    this.subtitleLang = undefined;
    this.lastContent = null;
    this.highlightWords = false;
    this.fontSize = 20;
    this.opacity = 0.2;
    this.maxLength = 300;

    this.abortController = new AbortController();
    this.bindEvents();
    this.updateContainerRect();
  }

  createSubtitlesContainer() {
    this.subtitlesContainer = document.createElement("vot-block");
    this.subtitlesContainer.classList.add("vot-subtitles-widget");
    this.container.appendChild(this.subtitlesContainer);
    return this.subtitlesContainer;
  }

  bindEvents() {
    const { signal } = this.abortController;
    this.onPointerDownBound = (e) => this.onPointerDown(e);
    this.onPointerUpBound = () => this.onPointerUp();
    this.onPointerMoveBound = (e) => this.onPointerMove(e);
    this.onTimeUpdateBound = () => this.update();

    document.addEventListener("pointerdown", this.onPointerDownBound, {
      signal,
    });
    document.addEventListener("pointerup", this.onPointerUpBound, {
      signal,
    });
    document.addEventListener("pointermove", this.onPointerMoveBound, {
      signal,
    });

    this.video?.addEventListener("timeupdate", this.onTimeUpdateBound, {
      signal,
    });
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  onPointerDown(e) {
    if (!this.subtitlesContainer.contains(e.target)) return;

    const rect = this.subtitlesContainer.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    this.dragging = {
      active: true,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      containerOffset: {
        x: containerRect.left,
        y: containerRect.top,
      },
    };
  }
  onPointerUp() {
    this.dragging.active = false;
  }

  onPointerMove(e) {
    if (!this.dragging.active) return;

    e.preventDefault();
    const { width, height } = this.container.getBoundingClientRect();
    const { containerOffset, offset } = this.dragging;

    this.position = {
      left: ((e.clientX - offset.x - containerOffset.x) / width) * 100,
      top: ((e.clientY - offset.y - containerOffset.y) / height) * 100,
    };

    this.applySubtitlePosition();
  }

  onResize() {
    this.updateContainerRect();
  }

  updateContainerRect() {
    this.containerRect = this.container.getBoundingClientRect();
    this.applySubtitlePosition();
  }

  applySubtitlePosition() {
    const { width, height } = this.containerRect;
    const { offsetWidth, offsetHeight } = this.subtitlesContainer;

    const maxLeft = ((width - offsetWidth) / width) * 100;
    const maxTop = ((height - offsetHeight) / height) * 100;

    this.position.left = Math.max(0, Math.min(this.position.left, maxLeft));
    this.position.top = Math.max(0, Math.min(this.position.top, maxTop));

    this.subtitlesContainer.style.left = `${this.position.left}%`;
    this.subtitlesContainer.style.top = `${this.position.top}%`;
    this.tokenTooltip?.updatePos();
  }

  processTokens(tokens) {
    if (tokens.at(-1).alignRange.end <= this.maxLength) return tokens;

    const chunks = [];
    let chunkTokens = [];
    let length = 0;

    for (const token of tokens) {
      length += token.text.length;
      chunkTokens.push(token);

      if (length > this.maxLength) {
        chunks.push(this.trimChunk(chunkTokens));
        chunkTokens = [];
        length = 0;
      }
    }

    if (chunkTokens.length) chunks.push(this.trimChunk(chunkTokens));

    const time = this.video.currentTime * 1000;
    return (
      chunks.find(
        (chunk) =>
          chunk[0].startMs < time &&
          time < chunk.at(-1).startMs + chunk.at(-1).durationMs,
      ) || chunks[0]
    );
  }

  trimChunk(tokens) {
    if (tokens[0]?.text === " ") tokens.shift();
    if (tokens.at(-1)?.text === " ") tokens.pop();
    return tokens;
  }

  async translateStrTokens(text) {
    const fromLang = this.subtitleLang;
    const toLang = localizationProvider.lang;
    if (this.strTranslatedTokens) {
      const translated = await translate(text, fromLang, toLang);
      return [this.strTranslatedTokens, translated];
    }

    const translated = await translate(
      [this.strTokens, text],
      fromLang,
      toLang,
    );
    this.strTranslatedTokens = translated[0];
    return translated;
  }

  releaseTooltip() {
    if (this.tokenTooltip) {
      this.tokenTooltip.target.classList.remove("selected");
      this.tokenTooltip.release();
      this.tokenTooltip = undefined;
    }

    return this;
  }

  onClick = async (e) => {
    if (
      this.tokenTooltip?.target === e.target &&
      this.tokenTooltip?.container
    ) {
      this.tokenTooltip.showed
        ? e.target.classList.add("selected")
        : e.target.classList.remove("selected");
      return;
    }

    this.releaseTooltip();
    e.target.classList.add("selected");
    const text = e.target.textContent.trim().replace(/[.|,]/, "");
    const service = await votStorage.get(
      "translationService",
      defaultTranslationService,
    );
    const subtitlesInfo = UI.createSubtitleInfo(
      text,
      this.strTranslatedTokens || this.strTokens,
      service,
    );
    this.tokenTooltip = new Tooltip({
      target: e.target,
      anchor: this.subtitlesBlock,
      layoutRoot: this.tooltipLayoutRoot,
      content: subtitlesInfo.container,
      parentElement: this.portal,
      maxWidth: this.subtitlesContainer.offsetWidth,
      borderRadius: 12,
      bordered: false,
      position: "top",
      trigger: "click",
    });
    this.tokenTooltip.create();

    const strTokens = this.strTokens;
    const translated = await this.translateStrTokens(text);
    if (strTokens !== this.strTokens || !this.tokenTooltip?.showed) {
      return;
    }

    subtitlesInfo.header.textContent = translated[1];
    subtitlesInfo.context.textContent = translated[0];
    this.tokenTooltip.setContent(subtitlesInfo.container);
    this.tokenTooltip.create();
  };

  renderTokens(tokens, time) {
    return tokens.map((token) => {
      const passed =
        this.highlightWords &&
        (time > token.startMs + token.durationMs / 2 ||
          (time > token.startMs - 100 &&
            token.startMs + token.durationMs / 2 - time < 275));

      return x`<span
        @click="${this.onClick}"
        class="${passed ? "passed" : ""}"
      >
        ${token.text.replace("\\n", "<br>")}
      </span>`;
    });
  }

  setContent(subtitles, lang = undefined) {
    this.releaseTooltip();
    this.subtitleLang = lang;
    if (!subtitles || !this.video) {
      this.subtitles = null;
      B(null, this.subtitlesContainer);
      return;
    }

    this.subtitles = subtitles;
    this.update();
  }

  setMaxLength(len) {
    if (typeof len === "number" && len > 0) {
      this.maxLength = len;
      this.update();
    }
  }

  setHighlightWords(value) {
    this.highlightWords = Boolean(value);
    this.update();
  }

  setFontSize(size) {
    this.fontSize = size;
    if (this.subtitlesBlock) {
      this.subtitlesBlock.style.fontSize = `${size}px`;
    }
  }

  /**
   * Set subtitles opacity by percentage where 100 - full transparent, 0 - not transparent
   *
   * @param {number} rate - 0-100 percent of opacity
   */
  setOpacity(rate) {
    this.opacity = ((100 - +rate) / 100).toFixed(2);
    if (this.subtitlesBlock) {
      this.subtitlesBlock.style.setProperty(
        "--vot-subtitles-opacity",
        this.opacity,
      );
    }
  }

  stringifyTokens(tokens) {
    return tokens.map((token) => token.text).join("");
  }

  update() {
    if (!this.video || !this.subtitles) return;

    const time = this.video.currentTime * 1000;
    const line = this.subtitles.subtitles.findLast(
      (e) => e.startMs < time && time < e.startMs + e.durationMs,
    );

    if (!line) {
      B(null, this.subtitlesContainer);
      this.subtitlesBlock = null;
      this.releaseTooltip();
      return;
    }

    const tokens = this.processTokens(line.tokens);
    const content = this.renderTokens(tokens, time);
    const stringContent = JSON.stringify(content);

    if (stringContent !== this.lastContent) {
      this.lastContent = stringContent;
      const strTokens = this.stringifyTokens(tokens);
      if (strTokens !== this.strTokens) {
        this.releaseTooltip();
        this.strTokens = strTokens;
        this.strTranslatedTokens = "";
      }

      B(
        x`<vot-block
          class="vot-subtitles"
          style="font-size: ${this.fontSize}px; --vot-subtitles-opacity: ${this
            .opacity}"
          >${content}</vot-block
        >`,
        this.subtitlesContainer,
      );
      this.subtitlesBlock =
        this.subtitlesContainer.querySelector(".vot-subtitles");
    }
  }

  release() {
    this.abortController.abort();
    this.resizeObserver.disconnect();
    this.releaseTooltip();
    this.subtitlesContainer.remove();
  }
}

;// ./src/utils/volume.js
// element - audio / video element
function syncVolume(element, sliderVolume, otherSliderVolume, tempVolume) {
  let finalValue = sliderVolume;
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



// EXTERNAL MODULE: ./node_modules/requestidlecallback-polyfill/index.js
var requestidlecallback_polyfill = __webpack_require__("./node_modules/requestidlecallback-polyfill/index.js");
;// ./src/core/eventImpl.ts


class EventImpl {
  listeners;
  constructor() {
    this.listeners = new Set();
  }

  addListener(handler) {
    if (this.listeners.has(handler)) {
      throw new Error("[VOT] The listener has already been added.");
    }
    this.listeners.add(handler);
  }

  removeListener(handler) {
    this.listeners.delete(handler);
  }

  dispatch(...args) {
    for (const handler of this.listeners) {
      try {
        handler(...args);
      } catch (exception) {
        console.error("[VOT]", exception);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

;// ./src/utils/VideoObserver.js




class VideoObserver {
  static adKeywords = new Set([
    "advertise",
    "advertisement",
    "promo",
    "sponsor",
    "banner",
    "commercial",
    "preroll",
    "midroll",
    "postroll",
    "ad-container",
    "sponsored",
  ]);

  constructor() {
    this.videoCache = new WeakSet();
    this.observedNodes = {
      added: new Set(),
      removed: new Set(),
    };
    this.onVideoAdded = new EventImpl();
    this.onVideoRemoved = new EventImpl();
    this.observer = new MutationObserver(this.handleMutations);
  }

  isAdRelated(element) {
    const attributes = ["class", "id", "title"];
    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && VideoObserver.adKeywords.has(value.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  hasAudio(video) {
    if (typeof video.mozHasAudio !== "undefined") {
      return video.mozHasAudio;
    }
    if (typeof video.webkitAudioDecodedByteCount !== "undefined") {
      return video.webkitAudioDecodedByteCount > 0;
    }
    if ("audioTracks" in video) {
      return video.audioTracks.length > 0 || !video.muted;
    }
    return !video.muted;
  }

  isValidVideo(video) {
    if (this.isAdRelated(video)) return false;

    let parent = video.parentElement;
    while (parent && !this.isAdRelated(parent)) {
      parent = parent.parentElement;
    }
    if (parent) return false;

    if (!this.hasAudio(video)) {
      utils_debug.log("Ignoring video without audio:", video);
      return false;
    }

    return true;
  }

  traverseDOM(root) {
    if (root instanceof HTMLVideoElement) {
      this.checkVideoState(root);
      return;
    }

    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) =>
          node.tagName === "VIDEO" || node.shadowRoot
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      },
    );

    while (treeWalker.nextNode()) {
      const currentNode = treeWalker.currentNode;
      if (currentNode instanceof HTMLVideoElement) {
        this.checkVideoState(currentNode);
      }
      if (currentNode.shadowRoot) {
        this.traverseDOM(currentNode.shadowRoot);
      }
    }
  }

  checkVideoState(video) {
    if (this.videoCache.has(video)) return;

    this.videoCache.add(video);

    const onLoadedData = () => {
      if (this.isValidVideo(video)) {
        this.onVideoAdded.dispatch(video);
      }
      video.removeEventListener("loadeddata", onLoadedData);
    };

    const onEmptied = () => {
      if (!video.isConnected) {
        this.onVideoRemoved.dispatch(video);
        this.videoCache.delete(video);
        video.removeEventListener("emptied", onEmptied);
      }
    };

    video.addEventListener("emptied", onEmptied);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onLoadedData();
    } else {
      video.addEventListener("loadeddata", onLoadedData);
    }
  }

  handleMutations = (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      for (const node of mutation.addedNodes) {
        this.observedNodes.added.add(node);
      }
      for (const node of mutation.removedNodes) {
        this.observedNodes.removed.add(node);
      }
    }

    window.requestIdleCallback(
      () => {
        for (const node of this.observedNodes.added) {
          this.traverseDOM(node);
        }

        for (const node of this.observedNodes.removed) {
          if (node.querySelectorAll) {
            const videos = node.querySelectorAll("video");
            for (const video of videos) {
              if (!video.isConnected) {
                this.onVideoRemoved.dispatch(video);
                this.videoCache.delete(video);
              }
            }
          }
        }

        this.observedNodes.added.clear();
        this.observedNodes.removed.clear();
      },
      { timeout: 1000 },
    );
  };

  enable() {
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    this.traverseDOM(document.documentElement);
  }

  disable() {
    this.observer.disconnect();
    this.videoCache = new WeakSet();
  }
}

;// ./node_modules/browser-id3-writer/dist/browser-id3-writer.mjs
function browser_id3_writer_e(e){return String(e).split("").map((e=>e.charCodeAt(0)))}function browser_id3_writer_t(t){return new Uint8Array(browser_id3_writer_e(t))}function browser_id3_writer_a(t){const a=new ArrayBuffer(2*t.length),r=new Uint8Array(a);return new Uint16Array(a).set(browser_id3_writer_e(t)),r}function browser_id3_writer_r(e){const t=255;return[e>>>24&t,e>>>16&t,e>>>8&t,e&t]}function browser_id3_writer_n(e){return 11+e}function browser_id3_writer_s(e,t,a,r){return 11+t+1+1+(r?2+2*(a+1):a+1)+e}function browser_id3_writer_i(e){let t=0;return e.forEach((e=>{t+=2+2*e[0].length+2+2+2*e[1].length+2})),11+t}function browser_id3_writer_c(e,t){const a=2*t;let r=0;return e.forEach((e=>{r+=2+2*e[0].length+2+4})),18+a+2+r}class browser_id3_writer_o{_setIntegerFrame(e,t){const a=parseInt(t,10);this.frames.push({name:e,value:a,size:browser_id3_writer_n(a.toString().length)})}_setStringFrame(e,t){const a=t.toString();let r=13+2*a.length;"TDAT"===e&&(r=browser_id3_writer_n(a.length)),this.frames.push({name:e,value:a,size:r})}_setPictureFrame(e,t,a,r){const n=function(e){if(!e||!e.length)return null;if(255===e[0]&&216===e[1]&&255===e[2])return"image/jpeg";if(137===e[0]&&80===e[1]&&78===e[2]&&71===e[3])return"image/png";if(71===e[0]&&73===e[1]&&70===e[2])return"image/gif";if(87===e[8]&&69===e[9]&&66===e[10]&&80===e[11])return"image/webp";const t=73===e[0]&&73===e[1]&&42===e[2]&&0===e[3],a=77===e[0]&&77===e[1]&&0===e[2]&&42===e[3];return t||a?"image/tiff":66===e[0]&&77===e[1]?"image/bmp":0===e[0]&&0===e[1]&&1===e[2]&&0===e[3]?"image/x-icon":null}(new Uint8Array(t)),i=a.toString();if(!n)throw new Error("Unknown picture MIME type");a||(r=!1),this.frames.push({name:"APIC",value:t,pictureType:e,mimeType:n,useUnicodeEncoding:r,description:i,size:browser_id3_writer_s(t.byteLength,n.length,i.length,r)})}_setLyricsFrame(e,t,a){const r=e.split("").map((e=>e.charCodeAt(0))),n=t.toString(),s=a.toString();var i,c;this.frames.push({name:"USLT",value:s,language:r,description:n,size:(i=n.length,c=s.length,16+2*i+2+2+2*c)})}_setCommentFrame(e,t,a){const r=e.split("").map((e=>e.charCodeAt(0))),n=t.toString(),s=a.toString();var i,c;this.frames.push({name:"COMM",value:s,language:r,description:n,size:(i=n.length,c=s.length,16+2*i+2+2+2*c)})}_setPrivateFrame(e,t){const a=e.toString();var r,n;this.frames.push({name:"PRIV",value:t,id:a,size:(r=a.length,n=t.byteLength,10+r+1+n)})}_setUserStringFrame(e,t){const a=e.toString(),r=t.toString();var n,s;this.frames.push({name:"TXXX",description:a,value:r,size:(n=a.length,s=r.length,13+2*n+2+2+2*s)})}_setUrlLinkFrame(e,t){const a=t.toString();var r;this.frames.push({name:e,value:a,size:(r=a.length,10+r)})}_setPairedTextFrame(e,t){this.frames.push({name:e,value:t,size:browser_id3_writer_i(t)})}_setSynchronisedLyricsFrame(e,t,a,r,n){const s=n.toString(),i=r.split("").map((e=>e.charCodeAt(0)));this.frames.push({name:"SYLT",value:t,language:i,description:s,type:e,timestampFormat:a,size:browser_id3_writer_c(t,s.length)})}constructor(e){if(!e||"object"!=typeof e||!("byteLength"in e))throw new Error("First argument should be an instance of ArrayBuffer or Buffer");this.arrayBuffer=e,this.padding=4096,this.frames=[],this.url=""}setFrame(e,t){switch(e){case"TPE1":case"TCOM":case"TCON":{if(!Array.isArray(t))throw new Error(`${e} frame value should be an array of strings`);const a="TCON"===e?";":"/",r=t.join(a);this._setStringFrame(e,r);break}case"TLAN":case"TIT1":case"TIT2":case"TIT3":case"TALB":case"TPE2":case"TPE3":case"TPE4":case"TRCK":case"TPOS":case"TMED":case"TPUB":case"TCOP":case"TKEY":case"TEXT":case"TDAT":case"TCMP":case"TSRC":this._setStringFrame(e,t);break;case"TBPM":case"TLEN":case"TYER":this._setIntegerFrame(e,t);break;case"USLT":if(t.language=t.language||"eng","object"!=typeof t||!("description"in t)||!("lyrics"in t))throw new Error("USLT frame value should be an object with keys description and lyrics");if(t.language&&!t.language.match(/[a-z]{3}/i))throw new Error("Language must be coded following the ISO 639-2 standards");this._setLyricsFrame(t.language,t.description,t.lyrics);break;case"APIC":if("object"!=typeof t||!("type"in t)||!("data"in t)||!("description"in t))throw new Error("APIC frame value should be an object with keys type, data and description");if(t.type<0||t.type>20)throw new Error("Incorrect APIC frame picture type");this._setPictureFrame(t.type,t.data,t.description,!!t.useUnicodeEncoding);break;case"TXXX":if("object"!=typeof t||!("description"in t)||!("value"in t))throw new Error("TXXX frame value should be an object with keys description and value");this._setUserStringFrame(t.description,t.value);break;case"WCOM":case"WCOP":case"WOAF":case"WOAR":case"WOAS":case"WORS":case"WPAY":case"WPUB":this._setUrlLinkFrame(e,t);break;case"COMM":if(t.language=t.language||"eng","object"!=typeof t||!("description"in t)||!("text"in t))throw new Error("COMM frame value should be an object with keys description and text");if(t.language&&!t.language.match(/[a-z]{3}/i))throw new Error("Language must be coded following the ISO 639-2 standards");this._setCommentFrame(t.language,t.description,t.text);break;case"PRIV":if("object"!=typeof t||!("id"in t)||!("data"in t))throw new Error("PRIV frame value should be an object with keys id and data");this._setPrivateFrame(t.id,t.data);break;case"IPLS":if(!Array.isArray(t)||!Array.isArray(t[0]))throw new Error("IPLS frame value should be an array of pairs");this._setPairedTextFrame(e,t);break;case"SYLT":if("object"!=typeof t||!("type"in t)||!("text"in t)||!("timestampFormat"in t))throw new Error("SYLT frame value should be an object with keys type, text and timestampFormat");if(!Array.isArray(t.text)||!Array.isArray(t.text[0]))throw new Error("SYLT frame text value should be an array of pairs");if(t.type<0||t.type>6)throw new Error("Incorrect SYLT frame content type");if(t.timestampFormat<1||t.timestampFormat>2)throw new Error("Incorrect SYLT frame time stamp format");t.language=t.language||"eng",t.description=t.description||"",this._setSynchronisedLyricsFrame(t.type,t.text,t.timestampFormat,t.language,t.description);break;default:throw new Error(`Unsupported frame ${e}`)}return this}removeTag(){if(this.arrayBuffer.byteLength<10)return;const e=new Uint8Array(this.arrayBuffer),t=e[3],a=((r=[e[6],e[7],e[8],e[9]])[0]<<21)+(r[1]<<14)+(r[2]<<7)+r[3]+10;var r,n;73!==(n=e)[0]||68!==n[1]||51!==n[2]||t<2||t>4||(this.arrayBuffer=new Uint8Array(e.subarray(a)).buffer)}addTag(){this.removeTag();const e=[255,254],n=10+this.frames.reduce(((e,t)=>e+t.size),0)+this.padding,s=new ArrayBuffer(this.arrayBuffer.byteLength+n),i=new Uint8Array(s);let c=0,o=[];return o=[73,68,51,3],i.set(o,c),c+=o.length,c++,c++,o=function(e){const t=127;return[e>>>21&t,e>>>14&t,e>>>7&t,e&t]}(n-10),i.set(o,c),c+=o.length,this.frames.forEach((n=>{switch(o=browser_id3_writer_t(n.name),i.set(o,c),c+=o.length,o=browser_id3_writer_r(n.size-10),i.set(o,c),c+=o.length,c+=2,n.name){case"WCOM":case"WCOP":case"WOAF":case"WOAR":case"WOAS":case"WORS":case"WPAY":case"WPUB":o=browser_id3_writer_t(n.value),i.set(o,c),c+=o.length;break;case"TPE1":case"TCOM":case"TCON":case"TLAN":case"TIT1":case"TIT2":case"TIT3":case"TALB":case"TPE2":case"TPE3":case"TPE4":case"TRCK":case"TPOS":case"TKEY":case"TMED":case"TPUB":case"TCOP":case"TEXT":case"TSRC":o=[1].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(n.value),i.set(o,c),c+=o.length;break;case"TXXX":case"USLT":case"COMM":o=[1],"USLT"!==n.name&&"COMM"!==n.name||(o=o.concat(n.language)),o=o.concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(n.description),i.set(o,c),c+=o.length,o=[0,0].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(n.value),i.set(o,c),c+=o.length;break;case"TBPM":case"TLEN":case"TDAT":case"TYER":c++,o=browser_id3_writer_t(n.value),i.set(o,c),c+=o.length;break;case"PRIV":o=browser_id3_writer_t(n.id),i.set(o,c),c+=o.length,c++,i.set(new Uint8Array(n.value),c),c+=n.value.byteLength;break;case"APIC":o=[n.useUnicodeEncoding?1:0],i.set(o,c),c+=o.length,o=browser_id3_writer_t(n.mimeType),i.set(o,c),c+=o.length,o=[0,n.pictureType],i.set(o,c),c+=o.length,n.useUnicodeEncoding?(o=[].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(n.description),i.set(o,c),c+=o.length,c+=2):(o=browser_id3_writer_t(n.description),i.set(o,c),c+=o.length,c++),i.set(new Uint8Array(n.value),c),c+=n.value.byteLength;break;case"IPLS":o=[1],i.set(o,c),c+=o.length,n.value.forEach((t=>{o=[].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(t[0].toString()),i.set(o,c),c+=o.length,o=[0,0].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(t[1].toString()),i.set(o,c),c+=o.length,o=[0,0],i.set(o,c),c+=o.length}));break;case"SYLT":o=[1].concat(n.language).concat(n.timestampFormat).concat(n.type),i.set(o,c),c+=o.length,o=[].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(n.description),i.set(o,c),c+=o.length,c+=2,n.value.forEach((t=>{o=[].concat(e),i.set(o,c),c+=o.length,o=browser_id3_writer_a(t[0].toString()),i.set(o,c),c+=o.length,o=[0,0],i.set(o,c),c+=o.length,o=browser_id3_writer_r(t[1]),i.set(o,c),c+=o.length}))}})),c+=this.padding,i.set(new Uint8Array(this.arrayBuffer),c),this.arrayBuffer=s,s}getBlob(){return new Blob([this.arrayBuffer],{type:"audio/mpeg"})}getURL(){return this.url||(this.url=URL.createObjectURL(this.getBlob())),this.url}revokeURL(){URL.revokeObjectURL(this.url)}}
;// ./src/ui/icons.ts


const TRANSLATE_ICON_SVG = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path
    id="vot-translate-icon"
    fill-rule="evenodd"
    d="M15.778 18.95L14.903 21.375C14.8364 21.5583 14.7197 21.7083 14.553 21.825C14.3864 21.9417 14.203 22 14.003 22C13.6697 22 13.3989 21.8625 13.1905 21.5875C12.9822 21.3125 12.9447 21.0083 13.078 20.675L16.878 10.625C16.9614 10.4417 17.0864 10.2917 17.253 10.175C17.4197 10.0583 17.603 10 17.803 10H18.553C18.753 10 18.9364 10.0583 19.103 10.175C19.2697 10.2917 19.3947 10.4417 19.478 10.625L23.278 20.7C23.4114 21.0167 23.378 21.3125 23.178 21.5875C22.978 21.8625 22.7114 22 22.378 22C22.1614 22 21.9739 21.9375 21.8155 21.8125C21.6572 21.6875 21.5364 21.525 21.453 21.325L20.628 18.95H15.778ZM19.978 17.2H16.378L18.228 12.25L19.978 17.2Z"
  ></path>
  <path
    d="M9 14L4.7 18.3C4.51667 18.4833 4.28333 18.575 4 18.575C3.71667 18.575 3.48333 18.4833 3.3 18.3C3.11667 18.1167 3.025 17.8833 3.025 17.6C3.025 17.3167 3.11667 17.0833 3.3 16.9L7.65 12.55C7.01667 11.85 6.4625 11.125 5.9875 10.375C5.5125 9.625 5.1 8.83333 4.75 8H6.85C7.15 8.6 7.47083 9.14167 7.8125 9.625C8.15417 10.1083 8.56667 10.6167 9.05 11.15C9.78333 10.35 10.3917 9.52917 10.875 8.6875C11.3583 7.84583 11.7667 6.95 12.1 6H2C1.71667 6 1.47917 5.90417 1.2875 5.7125C1.09583 5.52083 1 5.28333 1 5C1 4.71667 1.09583 4.47917 1.2875 4.2875C1.47917 4.09583 1.71667 4 2 4H8V3C8 2.71667 8.09583 2.47917 8.2875 2.2875C8.47917 2.09583 8.71667 2 9 2C9.28333 2 9.52083 2.09583 9.7125 2.2875C9.90417 2.47917 10 2.71667 10 3V4H16C16.2833 4 16.5208 4.09583 16.7125 4.2875C16.9042 4.47917 17 4.71667 17 5C17 5.28333 16.9042 5.52083 16.7125 5.7125C16.5208 5.90417 16.2833 6 16 6H14.1C13.75 7.18333 13.275 8.33333 12.675 9.45C12.075 10.5667 11.3333 11.6167 10.45 12.6L12.85 15.05L12.1 17.1L9 14Z"
  ></path>
  <path
    id="vot-loading-icon"
    style="display:none"
    d="M19.8081 16.3697L18.5842 15.6633V13.0832C18.5842 12.9285 18.5228 12.7801 18.4134 12.6707C18.304 12.5613 18.1556 12.4998 18.0009 12.4998C17.8462 12.4998 17.6978 12.5613 17.5884 12.6707C17.479 12.7801 17.4176 12.9285 17.4176 13.0832V15.9998C17.4176 16.1022 17.4445 16.2028 17.4957 16.2915C17.5469 16.3802 17.6205 16.4538 17.7092 16.505L19.2247 17.38C19.2911 17.4189 19.3645 17.4443 19.4407 17.4547C19.5169 17.4652 19.5945 17.4604 19.6688 17.4407C19.7432 17.4211 19.813 17.3869 19.8741 17.3402C19.9352 17.2934 19.9864 17.2351 20.0249 17.1684C20.0634 17.1018 20.0883 17.0282 20.0982 16.952C20.1081 16.8757 20.1028 16.7982 20.0827 16.7239C20.0625 16.6497 20.0279 16.5802 19.9808 16.5194C19.9336 16.4586 19.8749 16.4077 19.8081 16.3697ZM18.0015 10C16.8478 10 15.6603 10.359 14.7011 11C13.7418 11.641 12.9415 12.4341 12.5 13.5C12.0585 14.5659 11.8852 16.0369 12.1103 17.1684C12.3353 18.3 12.8736 19.4942 13.6894 20.31C14.5053 21.1258 15.8684 21.7749 17 22C18.1316 22.2251 19.4341 21.9415 20.5 21.5C21.5659 21.0585 22.359 20.2573 23 19.298C23.641 18.3387 24.0015 17.1537 24.0015 16C23.9998 14.4534 23.5951 13.0936 22.5015 12C21.4079 10.9064 19.5481 10.0017 18.0015 10ZM18.0009 20.6665C17.0779 20.6665 16.1757 20.3928 15.4082 19.88C14.6408 19.3672 14.0427 18.6384 13.6894 17.7857C13.3362 16.933 13.2438 15.9947 13.4239 15.0894C13.604 14.1842 14.0484 13.3527 14.7011 12.7C15.3537 12.0474 16.1852 11.6029 17.0905 11.4228C17.9957 11.2428 18.934 11.3352 19.7867 11.6884C20.6395 12.0416 21.3683 12.6397 21.8811 13.4072C22.3939 14.1746 22.6676 15.0769 22.6676 15.9998C22.666 17.237 22.1738 18.4231 21.299 19.298C20.4242 20.1728 19.2381 20.665 18.0009 20.6665Z"
  ></path>
</svg>`;

const PIP_ICON_SVG = b`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M120-520q-17 0-28.5-11.5T80-560q0-17 11.5-28.5T120-600h104L80-743q-12-12-12-28.5T80-800q12-12 28.5-12t28.5 12l143 144v-104q0-17 11.5-28.5T320-800q17 0 28.5 11.5T360-760v200q0 17-11.5 28.5T320-520H120Zm40 360q-33 0-56.5-23.5T80-240v-160q0-17 11.5-28.5T120-440q17 0 28.5 11.5T160-400v160h280q17 0 28.5 11.5T480-200q0 17-11.5 28.5T440-160H160Zm680-280q-17 0-28.5-11.5T800-480v-240H480q-17 0-28.5-11.5T440-760q0-17 11.5-28.5T480-800h320q33 0 56.5 23.5T880-720v240q0 17-11.5 28.5T840-440ZM600-160q-17 0-28.5-11.5T560-200v-120q0-17 11.5-28.5T600-360h240q17 0 28.5 11.5T880-320v120q0 17-11.5 28.5T840-160H600Z"
  />
</svg>`;

const MENU_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"
  />
</svg>`;

const DOWNLOAD_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24" class="vot-loader" id="vot-loader-download">
  <path class="vot-loader-main" d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"/>
  <path class="vot-loader-helper" d=""/>
</svg>`;

const SUBTITLES_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24">
  <path d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.588 1.413T20 20H4Zm2-4h8v-2H6v2Zm10 0h2v-2h-2v2ZM6 12h2v-2H6v2Zm4 0h8v-2h-8v2Z"/>
</svg>`;

const SETTINGS_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 -960 960 960">
  <path d="M555-80H405q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-344q-8-13-5-28t15-24l75-57q-1-7-1-13.5v-27q0-6.5 1-13.5l-75-57q-12-9-15-24t5-28l74-129q7-14 21.5-17.5T220-761l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 129q8 13 5 28t-15 24l-75 57q1 7 1 13.5v27q0 6.5-2 13.5l75 57q12 9 15 24t-5 28l-74 128q-8 13-22.5 17.5T738-199l-85-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10Zm-73-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm0-80q-25 0-42.5-17.5T422-480q0-25 17.5-42.5T482-540q25 0 42.5 17.5T542-480q0 25-17.5 42.5T482-420Zm-2-60Zm-40 320h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Z"/>
</svg>`;

const CHEVRON_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" >
  <path
    d="M12 14.975q-.2 0-.375-.062T11.3 14.7l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062Z"
  />
</svg>`;

const ARROW_RIGHT_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M647-440H200q-17 0-28.5-11.5T160-480q0-17 11.5-28.5T200-520h447L451-716q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l264 264q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L508-188q-11 11-27.5 11T452-188q-12-12-12-28.5t12-28.5l195-195Z"
  />
</svg>`;

const CLOSE_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 -960 960 960">
  <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
</svg>`;

const WARNING_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none">
    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 11a1 1 0 1 1 0 2a1 1 0 0 1 0-2m0-9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1"/>
  </g>
</svg>`;

const HELP_ICON = b`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none">
    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 12a1 1 0 1 1 0 2a1 1 0 0 1 0-2m0-9.5a3.625 3.625 0 0 1 1.348 6.99a.8.8 0 0 0-.305.201c-.044.05-.051.114-.05.18L13 14a1 1 0 0 1-1.993.117L11 14v-.25c0-1.153.93-1.845 1.604-2.116a1.626 1.626 0 1 0-2.229-1.509a1 1 0 1 1-2 0A3.625 3.625 0 0 1 12 6.5"/>
  </g>
</svg>`;

;// ./src/ui/components/dialog.ts





class Dialog {
  container;
  backdrop;
  box;
  contentWrapper;
  headerContainer;
  titleContainer;
  title;
  closeButton;
  bodyContainer;
  footerContainer;

   onClose = new EventImpl();

   _titleHtml;
   _isTemp;

  constructor({ titleHtml, isTemp = false }) {
    this._titleHtml = titleHtml;
    this._isTemp = isTemp;

    const elements = this.createElements();
    this.container = elements.container;
    this.backdrop = elements.backdrop;
    this.box = elements.box;

    this.contentWrapper = elements.contentWrapper;
    this.headerContainer = elements.headerContainer;
    this.titleContainer = elements.titleContainer;
    this.title = elements.title;
    this.closeButton = elements.closeButton;
    this.bodyContainer = elements.bodyContainer;
    this.footerContainer = elements.footerContainer;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-dialog-container"]);
    if (this._isTemp) {
      container.classList.add("vot-dialog-temp");
    }

    container.hidden = !this._isTemp;

    const backdrop = UI.createEl("vot-block", ["vot-dialog-backdrop"]);
    const box = UI.createEl("vot-block", ["vot-dialog"]);
    const contentWrapper = UI.createEl("vot-block", [
      "vot-dialog-content-wrapper",
    ]);
    const headerContainer = UI.createEl("vot-block", [
      "vot-dialog-header-container",
    ]);
    const titleContainer = UI.createEl("vot-block", [
      "vot-dialog-title-container",
    ]);

    const title = UI.createEl("vot-block", ["vot-dialog-title"]);
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

    const closeButton = UI.createIconButton(CLOSE_ICON);
    closeButton.classList.add("vot-dialog-close-button");
    backdrop.onclick = closeButton.onclick = () => this.close();
    headerContainer.append(titleContainer, closeButton);

    const bodyContainer = UI.createEl("vot-block", [
      "vot-dialog-body-container",
    ]);
    const footerContainer = UI.createEl("vot-block", [
      "vot-dialog-footer-container",
    ]);

    contentWrapper.append(headerContainer, bodyContainer, footerContainer);
    box.appendChild(contentWrapper);
    container.append(backdrop, box);

    return {
      container,
      backdrop,
      box,
      contentWrapper,
      headerContainer,
      titleContainer,
      title,
      closeButton,
      bodyContainer,
      footerContainer,
    };
  }

  addEventListener(type, listener) {
    this.onClose.addListener(listener);

    return this;
  }

  removeEventListener(type, listener) {
    this.onClose.removeListener(listener);

    return this;
  }

  open() {
    this.hidden = false;
    return this;
  }

  remove() {
    this.container.remove();
    this.onClose.dispatch();
    return this;
  }

  close() {
    if (this._isTemp) {
      return this.remove();
    }

    this.hidden = true;
    this.onClose.dispatch();
    return this;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get isDialogOpen() {
    return !this.container.hidden;
  }
}

;// ./src/ui/components/textfield.ts




class Textfield {
  container;
  input;
  label;

   onInput = new EventImpl();
   onChange = new EventImpl();

   _labelHtml;
   _multiline;
   _placeholder;
   _value;

  constructor({
    labelHtml = "",
    placeholder = "",
    value = "",
    multiline = false,
  }) {
    this._labelHtml = labelHtml;
    this._multiline = multiline;
    this._placeholder = placeholder;
    this._value = value;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-textfield"]);
    const input = document.createElement(
      this._multiline ? "textarea" : "input",
    );
    if (!this._labelHtml) {
      input.classList.add("vot-show-placeholer");
    }
    input.placeholder = this._placeholder;
    input.value = this._value;

    const label = UI.createEl("span");
    label.append(this._labelHtml);
    container.append(input, label);
    input.addEventListener("input", () => {
      this._value = this.input.value;
      this.onInput.dispatch(this._value);
    });
    input.addEventListener("change", () => {
      this._value = this.input.value;
      this.onChange.dispatch(this._value);
    });

    return {
      container,
      label,
      input,
    };
  }

  addEventListener(
    type,
    listener,
  ) {
    if (type === "change") {
      this.onChange.addListener(listener);
    } else if (type === "input") {
      this.onInput.addListener(listener);
    }

    return this;
  }

  removeEventListener(
    type,
    listener,
  ) {
    if (type === "change") {
      this.onChange.removeListener(listener);
    } else if (type === "input") {
      this.onInput.removeListener(listener);
    }

    return this;
  }

  get value() {
    return this._value;
  }

  /**
   * If you set a different new value, it will trigger the change event
   */
  set value(val) {
    if (this._value === val) {
      return;
    }

    this.input.value = this._value = val;
    this.onChange.dispatch(this._value);
  }

  get placeholder() {
    return this._placeholder;
  }

  set placeholder(text) {
    this.input.placeholder = this._placeholder = text;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/ui/components/select.ts















class Select


 {
  container;
  outer;
  arrowIcon;
  title;

  dialogParent;
  labelElement;

   _selectTitle;
   _dialogTitle;
   multiSelect;
   _items;

   isLoading = false;
   isDialogOpen = false;
   onSelectItem = new EventImpl();
   onBeforeOpen = new EventImpl();
   contentList;

  selectedItems = [];
  selectedValues;

  constructor({
    selectTitle,
    dialogTitle,
    items,
    labelElement,
    dialogParent = document.documentElement,
    multiSelect,
  }) {
    this._selectTitle = selectTitle;
    this._dialogTitle = dialogTitle;
    this._items = items;
    this.multiSelect = (multiSelect ?? false) ;
    this.labelElement = labelElement;
    this.dialogParent = dialogParent;
    this.selectedValues = this.calcSelectedValues();

    const elements = this.createElements();
    this.container = elements.container;
    this.outer = elements.outer;
    this.arrowIcon = elements.arrowIcon;
    this.title = elements.title;
  }

  static genLanguageItems(
    langs,
    conditionString,
  ) {
    return langs.map((lang) => {
      const phrase = `langs.${lang}` ;
      const label = localizationProvider.get(phrase);
      return {
        label: label === phrase ? lang.toUpperCase() : label,
        value: lang,
        selected: conditionString === lang,
      };
    });
  }

   multiSelectItemHandle = (
    contentItem,
    item,
  ) => {
    const value = item.value;
    if (this.selectedValues.has(value) && this.selectedValues.size > 1) {
      this.selectedValues.delete(value);
      item.selected = false;
    } else {
      this.selectedValues.add(value);
      item.selected = true;
    }

    contentItem.dataset.votSelected = this.selectedValues.has(value).toString();
    this.updateSelectedState();
    this.onSelectItem.dispatch(Array.from(this.selectedValues));
  };

   singleSelectItemHandle = (item) => {
    const value = item.value;
    this.selectedValues = new Set([value]);
    for (const contentItem of this.selectedItems) {
      contentItem.dataset.votSelected = (
        contentItem.dataset.votValue === value
      ).toString();
    }

    for (const item of this._items) {
      item.selected = item.value === value;
    }

    this.updateTitle();
    this.onSelectItem.dispatch(value);
  };

   createDialogContentList() {
    const contentList = UI.createEl("vot-block", ["vot-select-content-list"]);

    for (const item of this._items) {
      const contentItem = UI.createEl("vot-block", ["vot-select-content-item"]);
      contentItem.textContent = item.label;
      contentItem.dataset.votSelected =
        item.selected === true ? "true" : "false";
      contentItem.dataset.votValue = item.value;
      if (item.disabled) {
        contentItem.inert = true;
      }

      contentItem.addEventListener("click", (e) => {
        if ((e.target ).inert) {
          return;
        }

        if (this.multiSelect) {
          return this.multiSelectItemHandle(contentItem, item);
        }

        return this.singleSelectItemHandle(item);
      });

      contentList.appendChild(contentItem);
    }

    this.selectedItems = Object.values(contentList.childNodes) ;

    return contentList;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-select"]);
    if (this.labelElement) {
      container.append(this.labelElement);
    }

    const outer = UI.createEl("vot-block", ["vot-select-outer"]);
    const title = UI.createEl("vot-block", ["vot-select-title"]);
    title.textContent = this.visibleText;

    const arrowIcon = UI.createEl("vot-block", ["vot-select-arrow-icon"]);
    B(CHEVRON_ICON, arrowIcon);
    outer.append(title, arrowIcon);
    outer.addEventListener("click", () => {
      if (this.isLoading || this.isDialogOpen) {
        return;
      }

      try {
        this.isLoading = true;
        const tempDialog = new Dialog({
          titleHtml: this._dialogTitle,
          isTemp: true,
        });

        this.onBeforeOpen.dispatch(tempDialog);
        this.dialogParent.appendChild(tempDialog.container);

        const votSearchLangTextfield = new Textfield({
          labelHtml: localizationProvider.get("searchField"),
        });

        votSearchLangTextfield.addEventListener("input", (searchText) => {
          for (const contentItem of this.selectedItems) {
            contentItem.hidden = !contentItem.textContent
              ?.toLowerCase()
              .includes(searchText);
          }
        });

        this.contentList = this.createDialogContentList();
        tempDialog.bodyContainer.append(
          votSearchLangTextfield.container,
          this.contentList,
        );
        tempDialog.addEventListener("close", () => {
          this.isDialogOpen = false;
          this.selectedItems = [];
        });
      } finally {
        this.isLoading = false;
      }
    });

    container.appendChild(outer);

    return {
      container,
      outer,
      arrowIcon,
      title,
    };
  }

   calcSelectedValues() {
    return new Set(
      this._items.filter((item) => item.selected).map((item) => item.value),
    );
  }

  




  addEventListener(
    type,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    if (type === "selectItem") {
      this.onSelectItem.addListener(listener);
    } else if (type === "beforeOpen") {
      this.onBeforeOpen.addListener(listener);
    }

    return this;
  }

  











  removeEventListener(
    type,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    if (type === "selectItem") {
      this.onSelectItem.removeListener(listener);
    } else if (type === "beforeOpen") {
      this.onBeforeOpen.removeListener(listener);
    }

    return this;
  }

  updateTitle() {
    this.title.textContent = this.visibleText;
    return this;
  }

  updateSelectedState() {
    if (this.selectedItems.length > 0) {
      for (const item of this.selectedItems) {
        const val = item.dataset.votValue ;
        if (!val) {
          continue;
        }

        item.dataset.votSelected = this.selectedValues.has(val).toString();
      }
    }

    this.updateTitle();
    return this;
  }

  setSelectedValue(value) {
    if (this.multiSelect) {
      this.selectedValues = new Set(
        Array.isArray(value)
          ? (value.map(String) )
          : [String(value) ],
      );
    } else {
      this.selectedValues = new Set([String(value) ]);
    }

    for (const item of this._items) {
      item.selected = this.selectedValues.has(String(item.value) );
    }

    this.updateSelectedState();
    return this;
  }

  /**
   * @warning Use chaining with this method or reassign to variable to get the updated type of instance
   */
  updateItems(newItems) {
    this._items = newItems ;
    this.selectedValues = this.calcSelectedValues();
    this.updateSelectedState();

    const dialogContainer = this.contentList?.parentElement;
    if (!this.contentList || !dialogContainer) {
      return this ;
    }

    const oldContentList = this.contentList;
    this.contentList = this.createDialogContentList();
    dialogContainer.replaceChild(this.contentList, oldContentList);
    return this ;
  }

  get visibleText() {
    if (!this.multiSelect) {
      return (
        this._items.find((item) => item.selected)?.label ?? this._selectTitle
      );
    }

    return (
      this._items
        .filter((item) => this.selectedValues.has(item.value))
        .map((item) => item.label)
        .join(", ") ?? this._selectTitle
    );
  }

  set selectTitle(title) {
    this._selectTitle = title;
    this.updateTitle();
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/ui/components/votMenu.ts




class VOTMenu {
  container;
  contentWrapper;
  headerContainer;
  bodyContainer;
  footerContainer;
  titleContainer;
  title;

   _position;
   _titleHtml;

  constructor({ position = "default", titleHtml = "" }) {
    this._position = position;
    this._titleHtml = titleHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.contentWrapper = elements.contentWrapper;
    this.headerContainer = elements.headerContainer;
    this.bodyContainer = elements.bodyContainer;
    this.footerContainer = elements.footerContainer;
    this.titleContainer = elements.titleContainer;
    this.title = elements.title;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-menu"]);
    container.hidden = true;
    container.dataset.position = this._position;

    const contentWrapper = UI.createEl("vot-block", [
      "vot-menu-content-wrapper",
    ]);
    container.appendChild(contentWrapper);

    // header
    const headerContainer = UI.createEl("vot-block", [
      "vot-menu-header-container",
    ]);
    const titleContainer = UI.createEl("vot-block", [
      "vot-menu-title-container",
    ]);
    headerContainer.appendChild(titleContainer);
    const title = UI.createEl("vot-block", ["vot-menu-title"]);
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

    // body & footer
    const bodyContainer = UI.createEl("vot-block", ["vot-menu-body-container"]);
    const footerContainer = UI.createEl("vot-block", [
      "vot-menu-footer-container",
    ]);

    contentWrapper.append(headerContainer, bodyContainer, footerContainer);
    return {
      container,
      contentWrapper,
      headerContainer,
      bodyContainer,
      footerContainer,
      titleContainer,
      title,
    };
  }

  setText(titleText) {
    this._titleHtml = this.title.textContent = titleText;
    return this;
  }

  remove() {
    this.container.remove();
    return this;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get position() {
    return this._position;
  }

  set position(position) {
    this._position = this.container.dataset.position = position;
  }
}

;// ./src/ui/components/votButton.ts











class VOTButton {
  container;
  translateButton;
  separator;
  pipButton;
  separator2;
  menuButton;
  label;

   _position;
   _direction;
   _status;
   _labelHtml;

  constructor({
    position = "default",
    direction = "default",
    status = "none",
    labelHtml = "",
  }) {
    this._position = position;
    this._direction = direction;
    this._status = status;
    this._labelHtml = labelHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.translateButton = elements.translateButton;
    this.separator = elements.separator;
    this.pipButton = elements.pipButton;
    this.separator2 = elements.separator2;
    this.menuButton = elements.menuButton;
    this.label = elements.label;
  }

  static calcPosition(percentX, isBigContainer) {
    if (!isBigContainer) {
      return "default";
    }

    return percentX <= 44 ? "left" : percentX >= 66 ? "right" : "default";
  }

  static calcDirection(position) {
    return ["default", "top"].includes(position) ? "row" : "column";
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-segmented-button"]);
    container.dataset.position = this._position;
    container.dataset.direction = this._direction;
    container.dataset.status = this._status;
    const translateButton = UI.createEl("vot-block", [
      "vot-segment",
      "vot-translate-button",
    ]);
    B(TRANSLATE_ICON_SVG, translateButton);

    const label = UI.createEl("span", ["vot-segment-label"]);
    label.append(this._labelHtml);
    translateButton.appendChild(label);

    const separator = UI.createEl("vot-block", ["vot-separator"]);
    const pipButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    B(PIP_ICON_SVG, pipButton);

    const separator2 = UI.createEl("vot-block", ["vot-separator"]);
    const menuButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    B(MENU_ICON, menuButton);

    container.append(
      translateButton,
      separator,
      pipButton,
      separator2,
      menuButton,
    );
    return {
      container,
      translateButton,
      separator,
      pipButton,
      separator2,
      menuButton,
      label,
    };
  }

  showPiPButton(visible) {
    this.separator2.hidden = this.pipButton.hidden = !visible;
    return this;
  }

  setText(labelText) {
    this._labelHtml = this.label.textContent = labelText;
    return this;
  }

  remove() {
    this.container.remove();
    return this;
  }

  get tooltipPos() {
    switch (this.position) {
      case "left":
        return "right";
      case "right":
        return "left";
      default:
        return "bottom";
    }
  }

  set status(status) {
    this._status = this.container.dataset.status = status;
  }

  get status() {
    return this._status;
  }

  set loading(isLoading) {
    this.container.dataset.loading = isLoading.toString();
  }

  get loading() {
    return this.container.dataset.loading === "true";
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get position() {
    return this._position;
  }

  set position(position) {
    this._position = this.container.dataset.position = position;
  }

  get direction() {
    return this._direction;
  }

  set direction(direction) {
    this._direction = this.container.dataset.direction = direction;
  }

  set opacity(opacity) {
    this.container.style.opacity = opacity.toString();
  }

  get opacity() {
    return Number(this.container.style.opacity);
  }
}

;// ./src/ui/components/languagePairSelect.ts









class LanguagePairSelect


 {
  container;
  fromSelect;
  directionIcon;
  toSelect;

  dialogParent;

  // from select opts
   _fromSelectTitle;
   _fromDialogTitle;
   _fromItems;

  // to select opts
   _toSelectTitle;
   _toDialogTitle;
   _toItems;

  constructor({
    from: {
      selectTitle: fromSelectTitle = localizationProvider.get("videoLanguage"),
      dialogTitle: fromDialogTitle = localizationProvider.get("videoLanguage"),
      items: fromItems,
    },
    to: {
      selectTitle: toSelectTitle = localizationProvider.get(
        "translationLanguage",
      ),
      dialogTitle: toDialogTitle = localizationProvider.get(
        "translationLanguage",
      ),
      items: toItems,
    },
    dialogParent = document.documentElement,
  }) {
    this._fromSelectTitle = fromSelectTitle;
    this._fromDialogTitle = fromDialogTitle;
    this._fromItems = fromItems;

    this._toSelectTitle = toSelectTitle;
    this._toDialogTitle = toDialogTitle;
    this._toItems = toItems;

    this.dialogParent = dialogParent;

    const elements = this.createElements();
    this.container = elements.container;
    this.fromSelect = elements.fromSelect;
    this.directionIcon = elements.directionIcon;
    this.toSelect = elements.toSelect;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-lang-select"]);
    const fromSelect = new Select({
      selectTitle: this._fromSelectTitle,
      dialogTitle: this._fromDialogTitle,
      items: this._fromItems,
      dialogParent: this.dialogParent,
    });

    const directionIcon = UI.createEl("vot-block", ["vot-lang-select-icon"]);
    B(ARROW_RIGHT_ICON, directionIcon);

    const toSelect = new Select({
      selectTitle: this._toSelectTitle,
      dialogTitle: this._toDialogTitle,
      items: this._toItems,
      dialogParent: this.dialogParent,
    });

    container.append(fromSelect.container, directionIcon, toSelect.container);

    return {
      container,
      fromSelect,
      directionIcon,
      toSelect,
    };
  }

  setSelectedValues(from, to) {
    this.fromSelect.setSelectedValue(from);
    this.toSelect.setSelectedValue(to);
    return this;
  }

  updateItems(
    fromItems,
    toItems,
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this._fromItems = fromItems ;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this._toItems = toItems ;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this.fromSelect = this.fromSelect.updateItems(fromItems);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this.toSelect = this.toSelect.updateItems(toItems);
    return this ;
  }
}

;// ./src/ui/components/slider.ts







class Slider {
  container;
  input;
  label;

   onInput = new EventImpl();

   _labelHtml;
   _value;
   _min;
   _max;
   _step;

  constructor({
    labelHtml,
    value = 50,
    min = 0,
    max = 100,
    step = 1,
  }) {
    this._labelHtml = labelHtml;
    this._value = value;
    this._min = min;
    this._max = max;
    this._step = step;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
    this.update();
  }

   updateProgress() {
    const progress = (this._value - this._min) / (this._max - this._min);
    this.container.style.setProperty("--vot-progress", progress.toString());
    return this;
  }

   update() {
    this._value = this.input.valueAsNumber;
    this._min = +this.input.min;
    this._max = +this.input.max;
    this.updateProgress();
    return this;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-slider"]);
    const input = document.createElement("input");
    input.type = "range";
    input.min = this._min.toString();
    input.max = this._max.toString();
    input.step = this._step.toString();
    input.value = this._value.toString();

    const label = UI.createEl("span");
    B(this._labelHtml, label);

    container.append(input, label);
    input.addEventListener("input", () => {
      this.update();
      this.onInput.dispatch(this._value);
    });

    return {
      container,
      label,
      input,
    };
  }

  addEventListener(type, listener) {
    this.onInput.addListener(listener);

    return this;
  }

  removeEventListener(type, listener) {
    this.onInput.removeListener(listener);

    return this;
  }

  get value() {
    return this._value;
  }

  /**
   * If you set a different new value, it will trigger the input event
   */
  set value(val) {
    this._value = val;
    this.input.value = val.toString();
    this.updateProgress();
    this.onInput.dispatch(this._value);
  }

  get min() {
    return this._min;
  }

  set min(val) {
    this._min = val;
    this.input.min = this._min.toString();
    this.updateProgress();
  }

  get max() {
    return this._max;
  }

  set max(val) {
    this._max = val;
    this.input.max = this._max.toString();
    this.updateProgress();
  }

  get step() {
    return this._step;
  }

  set step(val) {
    this._step = val;
    this.input.step = this._step.toString();
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/ui/components/sliderLabel.ts



class SliderLabel {
  container;
  strong;

   _labelText;
   _labelEOL;
   _value;
   _symbol;

  constructor({
    labelText,
    labelEOL = "",
    value = 50,
    symbol = "%",
  }) {
    this._labelText = labelText;
    this._labelEOL = labelEOL;
    this._value = value;
    this._symbol = symbol;

    const elements = this.createElements();
    this.container = elements.container;
    this.strong = elements.strong;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-slider-label"]);
    container.textContent = this.labelText;

    const strong = UI.createEl("strong", ["vot-slider-label-value"]);
    strong.textContent = this.valueText;

    container.append(strong);

    return {
      container,
      strong,
    };
  }

  get labelText() {
    return `${this._labelText}${this._labelEOL}`;
  }

  get valueText() {
    return `${this._value}${this._symbol}`;
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.strong.textContent = this.valueText;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/ui/components/selectLabel.ts







class SelectLabel {
  container;
  icon;

   _labelText;
   _icon;

  constructor({ labelText, icon }) {
    this._labelText = labelText;
    this._icon = icon;

    const elements = this.createElements();
    this.container = elements.container;
    this.icon = elements.icon;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-select-label"]);
    container.textContent = this._labelText;

    const icon = UI.createEl("vot-block", ["vot-select-label-icon"]);
    if (this._icon) {
      B(this._icon, icon);
    }
    container.appendChild(icon);

    return {
      container,
      icon,
    };
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/ui/views/overlay.ts



























class OverlayView {
  root;
  tooltipLayoutRoot;
  portalContainer;
  globalPortal;

   dragging = false;
   initialized = false;
   data;
   videoHandler;
   cancelDraggingEvents = ["pointercancel", "touchcancel"];

  // events
   onClickSettings = new EventImpl();
   onClickPiP = new EventImpl();
   onClickTranslate = new EventImpl();
   onClickDownloadTranslation = new EventImpl();
   onClickDownloadSubtitles = new EventImpl();
   onSelectFromLanguage = new EventImpl();
   onSelectToLanguage = new EventImpl();
   onSelectSubtitles = new EventImpl();
   onInputVideoVolume = new EventImpl();
   onInputTranslationVolume = new EventImpl();

  // shared
  votOverlayPortal;
  // button
  votButton;
  votButtonTooltip;
  // menu
  votMenu;
  downloadTranslationButton;
  downloadSubtitlesButton;
  openSettingsButton;
  languagePairSelect;
  subtitlesSelectLabel;
  subtitlesSelect;
  videoVolumeSliderLabel;
  videoVolumeSlider;
  tranlsationVolumeSliderLabel;
  translationVolumeSlider;

  constructor({
    root,
    portalContainer,
    tooltipLayoutRoot,
    globalPortal,
    data = {},
    videoHandler,
  }) {
    this.root = root;
    this.portalContainer = portalContainer;
    this.tooltipLayoutRoot = tooltipLayoutRoot;
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }

  isInitialized()




















 {
    return this.initialized;
  }

  calcButtonLayout(position) {
    if (this.isBigContainer && ["left", "right"].includes(position)) {
      return {
        direction: "column",
        position,
      };
    }

    return {
      direction: "row",
      position: "default",
    };
  }

  



























  addEventListener(
    type









,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    switch (type) {
      case "click:settings": {
        this.onClickSettings.addListener(listener);
        break;
      }
      case "click:pip": {
        this.onClickPiP.addListener(listener);
        break;
      }
      case "click:downloadTranslation": {
        this.onClickDownloadTranslation.addListener(listener);
        break;
      }
      case "click:downloadSubtitles": {
        this.onClickDownloadSubtitles.addListener(listener);
        break;
      }
      case "click:translate": {
        this.onClickTranslate.addListener(listener);
        break;
      }
      case "input:videoVolume": {
        this.onInputVideoVolume.addListener(listener);
        break;
      }
      case "input:translationVolume": {
        this.onInputTranslationVolume.addListener(listener);
        break;
      }
      case "select:fromLanguage": {
        this.onSelectFromLanguage.addListener(listener);
        break;
      }
      case "select:toLanguage": {
        this.onSelectToLanguage.addListener(listener);
        break;
      }
      case "select:subtitles": {
        this.onSelectSubtitles.addListener(listener);
        break;
      }
    }

    return this;
  }

  






























  removeEventListener(
    type









,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    switch (type) {
      case "click:settings": {
        this.onClickSettings.removeListener(listener);
        break;
      }
      case "click:pip": {
        this.onClickPiP.removeListener(listener);
        break;
      }
      case "click:downloadTranslation": {
        this.onClickDownloadTranslation.removeListener(listener);
        break;
      }
      case "click:downloadSubtitles": {
        this.onClickDownloadSubtitles.removeListener(listener);
        break;
      }
      case "click:translate": {
        this.onClickTranslate.removeListener(listener);
        break;
      }
      case "input:videoVolume": {
        this.onInputVideoVolume.removeListener(listener);
        break;
      }
      case "input:translationVolume": {
        this.onInputTranslationVolume.removeListener(listener);
        break;
      }
      case "select:fromLanguage": {
        this.onSelectFromLanguage.removeListener(listener);
        break;
      }
      case "select:toLanguage": {
        this.onSelectToLanguage.removeListener(listener);
        break;
      }
      case "select:subtitles": {
        this.onSelectSubtitles.removeListener(listener);
        break;
      }
    }

    return this;
  }

  initUI(buttonPosition = "default") {
    if (this.isInitialized()) {
      throw new Error("[VOT] OverlayView is already initialized");
    }

    this.initialized = true;

    // #region Shared logic
    const { position, direction } = this.calcButtonLayout(buttonPosition);

    this.votOverlayPortal = UI.createPortal(true);
    this.portalContainer.appendChild(this.votOverlayPortal);

    // #endregion Shared logic
    // #region VOT Button
    this.votButton = new VOTButton({
      position,
      direction,
      status: "none",
      labelHtml: localizationProvider.get("translateVideo"),
    });
    this.votButton.opacity = 0;
    if (!this.pipButtonVisible) {
      this.votButton.showPiPButton(false);
    }
    this.root.appendChild(this.votButton.container);
    this.votButtonTooltip = new Tooltip({
      target: this.votButton.translateButton,
      content: localizationProvider.get("translateVideo"),
      position: this.votButton.tooltipPos,
      hidden: direction === "row",
      bordered: false,
      parentElement: this.votOverlayPortal,
      layoutRoot: this.tooltipLayoutRoot,
    });

    // #endregion VOT Button
    // #region VOT Menu
    this.votMenu = new VOTMenu({
      titleHtml: localizationProvider.get("VOTSettings"),
      position,
    });
    this.root.appendChild(this.votMenu.container);

    // #region VOT Menu Header
    this.downloadTranslationButton = UI.createIconButton(DOWNLOAD_ICON);
    this.downloadTranslationButton.hidden = true;

    this.downloadSubtitlesButton = UI.createIconButton(SUBTITLES_ICON);
    this.downloadSubtitlesButton.hidden = true;

    this.openSettingsButton = UI.createIconButton(SETTINGS_ICON);

    this.votMenu.headerContainer.append(
      this.downloadTranslationButton,
      this.downloadSubtitlesButton,
      this.openSettingsButton,
    );

    // #endregion VOT Menu Header
    // #region VOT Menu Body

    const detectedLanguage =
      this.videoHandler?.videoData?.detectedLanguage ?? "en";
    const responseLanguage = this.data.responseLanguage ?? "ru";
    this.languagePairSelect = new LanguagePairSelect({
      from: {
        selectTitle: localizationProvider.get(`langs.${detectedLanguage}`),
        items: Select.genLanguageItems(availableLangs, detectedLanguage),
      },
      to: {
        selectTitle: localizationProvider.get(`langs.${responseLanguage}`),
        items: Select.genLanguageItems(availableTTS, responseLanguage),
      },
    });

    this.subtitlesSelectLabel = new SelectLabel({
      labelText: localizationProvider.get("VOTSubtitles"),
    });
    this.subtitlesSelect = new Select({
      selectTitle: localizationProvider.get("VOTSubtitlesDisabled"),
      dialogTitle: localizationProvider.get("VOTSubtitles"),
      labelElement: this.subtitlesSelectLabel.container,
      dialogParent: this.globalPortal,
      items: [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
          selected: true,
        },
      ],
    });

    const videoVolume = this.videoHandler
      ? this.videoHandler.getVideoVolume() * 100
      : 100;
    this.videoVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTVolume"),
      value: videoVolume,
    });

    this.videoVolumeSlider = new Slider({
      labelHtml: this.videoVolumeSliderLabel.container,
      value: videoVolume,
    });
    this.videoVolumeSlider.hidden =
      !this.data.showVideoSlider || this.votButton.status !== "success";

    const defaultVolume = this.data.defaultVolume ?? 100;
    this.tranlsationVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTVolumeTranslation"),
      value: defaultVolume,
    });

    this.translationVolumeSlider = new Slider({
      labelHtml: this.tranlsationVolumeSliderLabel.container,
      value: defaultVolume,
      max: this.data.audioBooster ? maxAudioVolume : 100,
    });
    this.translationVolumeSlider.hidden = this.votButton.status !== "success";

    this.votMenu.bodyContainer.append(
      this.languagePairSelect.container,
      this.subtitlesSelect.container,
      this.videoVolumeSlider.container,
      this.translationVolumeSlider.container,
    );

    // #endregion VOT Menu Body
    // #endregion VOT Menu
    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    // #region [Events] VOT Button
    // Prevent button click events from propagating.
    this.votButton.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    this.votButton.translateButton.addEventListener("pointerdown", async () => {
      this.onClickTranslate.dispatch();
    });

    this.votButton.pipButton.addEventListener("pointerdown", async () => {
      this.onClickPiP.dispatch();
    });

    this.votButton.menuButton.addEventListener("pointerdown", async () => {
      this.votMenu.hidden = !this.votMenu.hidden;
    });

    // #region [Events] VOT Button Dragging
    const enableDraggingByEvent = (event) => {
      this.dragging = true;
      event.preventDefault();
    };

    this.votButton.container.addEventListener(
      "pointerdown",
      enableDraggingByEvent,
    );
    this.root.addEventListener("pointerup", this.disableDragging);
    this.root.addEventListener("pointermove", this.handleContainerPointerMove);

    this.votButton.container.addEventListener(
      "touchstart",
      enableDraggingByEvent,
      {
        passive: false,
      },
    );
    this.root.addEventListener("touchend", this.disableDragging);
    this.root.addEventListener("touchmove", this.handleContainerTouchMove, {
      passive: false,
    });

    for (const event of this.cancelDraggingEvents) {
      document.addEventListener(event, this.disableDragging);
    }

    // #endregion [Events] VOT Button Dragging
    // #endregion [Events] VOT Button
    // #region [Events] VOT Menu
    this.votMenu.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    // #region [Events] VOT Menu Header
    this.downloadTranslationButton.addEventListener("click", async () => {
      this.onClickDownloadTranslation.dispatch();
    });

    this.downloadSubtitlesButton.addEventListener("click", async () => {
      this.onClickDownloadSubtitles.dispatch();
    });

    this.openSettingsButton.addEventListener("click", async () => {
      this.onClickSettings.dispatch();
    });

    // #endregion [Events] VOT Menu Header
    // #region [Events] VOT Menu Body
    this.languagePairSelect.fromSelect.addEventListener(
      "selectItem",
      (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.videoData.detectedLanguage = language;
        }
        this.onSelectFromLanguage.dispatch(language);
      },
    );

    this.languagePairSelect.toSelect.addEventListener(
      "selectItem",
      async (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.translateToLang =
            this.videoHandler.videoData.responseLanguage = language;
        }
        this.data.responseLanguage = language;
        await votStorage.set("responseLanguage", this.data.responseLanguage);
        this.onSelectToLanguage.dispatch(language);
      },
    );

    this.subtitlesSelect.addEventListener("beforeOpen", async (dialog) => {
      if (!this.videoHandler?.videoData) {
        return;
      }

      const cacheKey = `${this.videoHandler.videoData.videoId}_${this.videoHandler.videoData.detectedLanguage}_${this.videoHandler.videoData.responseLanguage}_${this.data.useNewModel}`;
      if (this.videoHandler.cacheManager.getSubtitles(cacheKey)) {
        return;
      }

      this.votButton.loading = true;
      const loadingEl = UI.createInlineLoader();
      loadingEl.style.margin = "0 auto";
      dialog.footerContainer.appendChild(loadingEl);
      await this.videoHandler.loadSubtitles();
      dialog.footerContainer.removeChild(loadingEl);
      this.votButton.loading = false;
    });

    this.subtitlesSelect.addEventListener("selectItem", (data) => {
      this.onSelectSubtitles.dispatch(data);
    });

    this.videoVolumeSlider.addEventListener("input", (value) => {
      this.videoVolumeSliderLabel.value = value;
      this.onInputVideoVolume.dispatch(value);
    });

    this.translationVolumeSlider.addEventListener("input", async (value) => {
      this.tranlsationVolumeSliderLabel.value = value;
      this.data.defaultVolume = value;
      await votStorage.set("defaultVolume", this.data.defaultVolume);
      this.onInputTranslationVolume.dispatch(value);
    });

    // #endregion [Events] VOT Menu Body
    // #endregion [Events] VOT Menu
    return this;
  }

  updateButtonLayout(position, direction) {
    if (!this.isInitialized()) {
      return this;
    }

    this.votMenu.position = position;

    this.votButton.position = position;
    this.votButton.direction = direction;

    this.votButtonTooltip.hidden = direction === "row";
    this.votButtonTooltip.setPosition(this.votButton.tooltipPos);

    return this;
  }

  async moveButton(percentX) {
    if (!this.isInitialized()) {
      return this;
    }

    const position = VOTButton.calcPosition(percentX, this.isBigContainer);
    if (position === this.votButton.position) {
      return this;
    }

    const direction = VOTButton.calcDirection(position);
    this.data.buttonPos = position;
    this.updateButtonLayout(position, direction);
    if (this.isBigContainer) {
      await votStorage.set("buttonPos", position);
    }

    return this;
  }

  async handleDragMove(
    event,
    clientX,
    rect = this.root.getBoundingClientRect(),
  ) {
    if (!this.dragging) {
      return this;
    }

    event.preventDefault();
    const x = clientX - rect.left;
    const percentX = (x / rect.width) * 100;
    await this.moveButton(percentX);
    return this;
  }

  disableDragging = () => {
    this.dragging = false;
  };

  handleContainerPointerMove = async (event) => {
    void (await this.handleDragMove(event, event.clientX));
  };

  handleContainerTouchMove = async (event) => {
    void (await this.handleDragMove(event, event.touches[0].clientX));
  };

  updateButtonOpacity(opacity) {
    if (!this.isInitialized() || !this.votMenu.hidden) {
      return this;
    }

    this.votButton.opacity = opacity;
    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.votButton.remove();
    this.votMenu.remove();
    this.votButtonTooltip.release();
    this.votOverlayPortal.remove();

    this.initialized = initialized;
    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.root.removeEventListener("pointerup", this.disableDragging);
    this.root.removeEventListener(
      "pointermove",
      this.handleContainerPointerMove,
    );

    this.root.removeEventListener("touchend", this.disableDragging);
    this.root.removeEventListener("touchmove", this.handleContainerTouchMove);

    for (const event of this.cancelDraggingEvents) {
      document.removeEventListener(event, this.disableDragging);
    }

    this.onClickSettings.clear();
    this.onClickPiP.clear();
    this.onClickTranslate.clear();
    this.onClickDownloadTranslation.clear();
    this.onClickDownloadSubtitles.clear();

    this.onSelectFromLanguage.clear();
    this.onSelectToLanguage.clear();
    this.onSelectSubtitles.clear();

    this.onInputVideoVolume.clear();
    this.onInputTranslationVolume.clear();

    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }

  get isBigContainer() {
    return this.root.clientWidth > 550;
  }

  get pipButtonVisible() {
    return isPiPAvailable() && !!this.data.showPiPButton;
  }
}

;// ./src/ui/components/checkbox.ts







class Checkbox {
  container;
  input;
  label;

   onChange = new EventImpl();

   _labelHtml;
   _checked;
   _isSubCheckbox;

  constructor({
    labelHtml,
    checked = false,
    isSubCheckbox = false,
  }) {
    this._labelHtml = labelHtml;
    this._checked = checked;
    this._isSubCheckbox = isSubCheckbox;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
  }

   createElements() {
    const container = UI.createEl("label", ["vot-checkbox"]);
    if (this._isSubCheckbox) {
      container.classList.add("vot-checkbox-sub");
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this._checked;
    input.addEventListener("change", () => {
      this._checked = input.checked;
      this.onChange.dispatch(this._checked);
    });

    const label = UI.createEl("span");
    B(this._labelHtml, label);

    container.append(input, label);
    return { container, input, label };
  }

  addEventListener(type, listener) {
    this.onChange.addListener(listener);

    return this;
  }

  removeEventListener(
    type,
    listener,
  ) {
    this.onChange.removeListener(listener);

    return this;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get disabled() {
    return this.input.disabled;
  }

  set disabled(isDisabled) {
    this.input.disabled = isDisabled;
  }

  get checked() {
    return this._checked;
  }

  /**
   * If you set a different new value, it will trigger the change event
   */
  set checked(isChecked) {
    if (this._checked === isChecked) {
      return;
    }

    this._checked = this.input.checked = isChecked;
    this.onChange.dispatch(this._checked);
  }
}

;// ./src/ui/components/hotkeyButton.ts





class HotkeyButton {
  container;
  button;

   onChange = new EventImpl();

   _labelHtml;
   _key;
   pressedKeys;

   recording = false;

  constructor({ labelHtml, key = null }) {
    this._labelHtml = labelHtml;
    this._key = key;
    this.pressedKeys = new Set();

    const elements = this.createElements();
    this.container = elements.container;
    this.button = elements.button;
  }

   stopRecordingKeys() {
    this.recording = false;
    document.removeEventListener("keydown", this.keydownHandle);
    document.removeEventListener("keyup", this.keyupOrBlurHandle);
    document.removeEventListener("blur", this.keyupOrBlurHandle);
    this.button.removeAttribute("data-status");
    this.pressedKeys.clear();
  }

   keydownHandle = (event) => {
    if (!this.recording || event.repeat) {
      return;
    }

    event.preventDefault();
    if (event.code === "Escape") {
      this.key = null;
      this.button.textContent = this.keyText;
      this.stopRecordingKeys();
      return;
    }

    this.pressedKeys.add(event.code);
    this.button.textContent = formatKeysCombo(this.pressedKeys);
  };

   keyupOrBlurHandle = () => {
    if (!this.recording) {
      return;
    }

    this.key = formatKeysCombo(this.pressedKeys);
    this.stopRecordingKeys();
  };

   createElements() {
    const container = UI.createEl("vot-block", ["vot-hotkey"]);
    const label = UI.createEl("vot-block", ["vot-hotkey-label"]);
    label.textContent = this._labelHtml;

    const button = UI.createEl("vot-block", ["vot-hotkey-button"]);
    button.textContent = this.keyText;
    button.addEventListener("click", () => {
      button.dataset.status = "active";

      this.recording = true;
      this.pressedKeys.clear();
      this.button.textContent = localizationProvider.get(
        "PressTheKeyCombination",
      );

      document.addEventListener("keydown", this.keydownHandle);
      document.addEventListener("keyup", this.keyupOrBlurHandle);
      document.addEventListener("blur", this.keyupOrBlurHandle);
    });

    container.append(label, button);
    return { container, button, label };
  }

  addEventListener(
    type,
    listener,
  ) {
    this.onChange.addListener(listener);

    return this;
  }

  removeEventListener(
    type,
    listener,
  ) {
    this.onChange.removeListener(listener);

    return this;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get key() {
    return this._key;
  }

  get keyText() {
    if (!this._key) {
      return localizationProvider.get("None");
    }

    return this._key?.replace("Key", "").replace("Digit", "");
  }

  /**
   * If you set a different new value, it will trigger the change event
   */
  set key(newKey) {
    if (this._key === newKey) {
      return;
    }

    this._key = newKey;
    this.button.textContent = this.keyText;
    this.onChange.dispatch(this._key);
  }
}

/**
 * Formats a set of key codes into a string representing a key combination
 */
function formatKeysCombo(keys) {
  const keysArray = Array.isArray(keys) ? keys : Array.from(keys);

  return keysArray
    .map((code) => code.replace("Key", "").replace("Digit", ""))
    .join("+");
}

;// ./src/ui/components/details.ts







class Details {
  container;
  header;
  arrowIcon;

   onClick = new EventImpl();

   _titleHtml;

  constructor({ titleHtml }) {
    this._titleHtml = titleHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.header = elements.header;
    this.arrowIcon = elements.arrowIcon;
  }

   createElements() {
    const container = UI.createEl("vot-block", ["vot-details"]);

    const header = UI.createEl("vot-block");
    header.append(this._titleHtml);

    const arrowIcon = UI.createEl("vot-block", ["vot-details-arrow-icon"]);
    B(CHEVRON_ICON, arrowIcon);
    container.append(header, arrowIcon);
    container.addEventListener("click", () => {
      this.onClick.dispatch();
    });

    return {
      container,
      header,
      arrowIcon,
    };
  }

  addEventListener(type, listener) {
    this.onClick.addListener(listener);

    return this;
  }

  removeEventListener(type, listener) {
    this.onClick.removeListener(listener);

    return this;
  }

  set hidden(isHidden) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}

;// ./src/types/components/votButton.ts
const votButton_positions = ["default", "top", "left", "right"] ;
 

const directions = (/* unused pure expression or super */ null && (["default", "row", "column"])) ;
 










;// ./src/ui/views/settings.ts







































class SettingsView {
  globalPortal;

   initialized = false;
   data;
   videoHandler;

   onClickBugReport = new EventImpl();
   onClickResetSettings = new EventImpl();

   onChangeAutoTranslate = new EventImpl();
   onChangeShowVideoVolume = new EventImpl();
   onChangeAudioBooster = new EventImpl();
   onChangeUseLivelyVoice = new EventImpl();
   onChangeSubtitlesHighlightWords = new EventImpl();
   onChangeProxyWorkerHost = new EventImpl();
   onChangeUseNewAudioPlayer = new EventImpl();
   onChangeOnlyBypassMediaCSP = new EventImpl();
   onChangeShowPiPButton = new EventImpl();

   onInputSubtitlesMaxLength = new EventImpl();
   onInputSubtitlesFontSize = new EventImpl();
   onInputSubtitlesBackgroundOpacity = new EventImpl();
   onInputAutoHideButtonDelay = new EventImpl();

   onSelectItemProxyTranslationStatus = new EventImpl();
   onSelectItemTranslationTextService = new EventImpl();
   onSelectItemButtonPosition = new EventImpl();
   onSelectItemMenuLanguage = new EventImpl();

  dialog;
  translationSettingsHeader;
  autoTranslateCheckbox;
  dontTranslateLanguagesCheckbox;
  dontTranslateLanguagesSelect;
  autoSetVolumeSliderLabel;
  autoSetVolumeCheckbox;
  autoSetVolumeSlider;
  showVideoVolumeSliderCheckbox;
  audioBoosterCheckbox;
  audioBoosterTooltip;
  syncVolumeCheckbox;
  downloadWithNameCheckbox;
  sendNotifyOnCompleteCheckbox;
  useLivelyVoiceCheckbox;
  subtitlesSettingsHeader;
  subtitlesDownloadFormatSelectLabel;
  subtitlesDownloadFormatSelect;
  subtitlesDesignDetails;
  hotkeysSettingsHeader;
  translateHotkeyButton;
  proxySettingsHeader;
  proxyM3U8HostTextfield;
  proxyWorkerHostTextfield;
  proxyTranslationStatusSelectLabel;
  proxyTranslationStatusSelectTooltip;
  proxyTranslationStatusSelect;
  miscSettingsHeader;
  translateAPIErrorsCheckbox;
  useNewAudioPlayerCheckbox;
  useNewAudioPlayerTooltip;
  onlyBypassMediaCSPCheckbox;
  onlyBypassMediaCSPTooltip;
  translationTextServiceLabel;
  translationTextServiceSelect;
  translationTextServiceTooltip;
  detectServiceLabel;
  detectServiceSelect;
  appearanceDetails;
  aboutExtensionDetails;
  bugReportButton;
  resetSettingsButton;

  constructor({ globalPortal, data = {}, videoHandler }) {
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }

  isInitialized()




















































 {
    return this.initialized;
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] SettingsView is already initialized");
    }

    this.initialized = true;

    this.dialog = new Dialog({
      titleHtml: localizationProvider.get("VOTSettings"),
    });
    this.globalPortal.appendChild(this.dialog.container);

    // #region Translation
    this.translationSettingsHeader = UI.createHeader(
      localizationProvider.get("translationSettings"),
    );

    this.autoTranslateCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAutoTranslate"),
      checked: this.data.autoTranslate,
    });

    const dontTranslateLanguages = this.data.dontTranslateLanguages ?? [];
    this.dontTranslateLanguagesCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("DontTranslateSelectedLanguages"),
      checked: this.data.enabledDontTranslateLanguages,
    });

    this.dontTranslateLanguagesSelect = new Select({
      dialogParent: this.globalPortal,
      dialogTitle: localizationProvider.get("DontTranslateSelectedLanguages"),
      selectTitle:
        dontTranslateLanguages
          .map((lang) => localizationProvider.get(`langs.${lang}`))
          .join(", ") ??
        localizationProvider.get("DontTranslateSelectedLanguages"),
      items: Select.genLanguageItems(availableLangs).map

((item) => ({
        ...item,
        selected: dontTranslateLanguages.includes(item.value),
      })),
      multiSelect: true,
      labelElement: this.dontTranslateLanguagesCheckbox.container,
    });

    const autoVolume = this.data.autoVolume ?? defaultAutoVolume;
    this.autoSetVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTAutoSetVolume"),
      value: autoVolume,
    });

    this.autoSetVolumeCheckbox = new Checkbox({
      labelHtml: this.autoSetVolumeSliderLabel.container,
      checked: this.data.enabledAutoVolume ?? true,
    });

    this.autoSetVolumeSlider = new Slider({
      labelHtml: this.autoSetVolumeCheckbox.container,
      value: autoVolume,
    });

    this.showVideoVolumeSliderCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("showVideoVolumeSlider"),
      checked: this.data.showVideoSlider,
    });

    this.audioBoosterCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAudioBooster"),
      checked: this.data.audioBooster,
    });
    if (!this.videoHandler?.audioContext) {
      this.audioBoosterCheckbox.disabled = true;
      this.audioBoosterTooltip = new Tooltip({
        target: this.audioBoosterCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }

    this.syncVolumeCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTSyncVolume"),
      checked: this.data.syncVolume,
    });

    this.downloadWithNameCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTDownloadWithName"),
      checked: this.data.downloadWithName,
    });

    this.sendNotifyOnCompleteCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTSendNotifyOnComplete"),
      checked: this.data.sendNotifyOnComplete,
    });

    this.useLivelyVoiceCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTUseLivelyVoice"),
      checked: this.data.useNewModel,
    });

    this.dialog.bodyContainer.append(
      this.translationSettingsHeader,
      this.autoTranslateCheckbox.container,
      this.dontTranslateLanguagesSelect.container,
      this.autoSetVolumeSlider.container,
      this.showVideoVolumeSliderCheckbox.container,
      this.audioBoosterCheckbox.container,
      this.syncVolumeCheckbox.container,
      this.downloadWithNameCheckbox.container,
      this.sendNotifyOnCompleteCheckbox.container,
      this.useLivelyVoiceCheckbox.container,
    );

    // #endregion Translation
    // #region Subtitles

    this.subtitlesSettingsHeader = UI.createHeader(
      localizationProvider.get("subtitlesSettings"),
    );

    this.subtitlesDownloadFormatSelectLabel = new SelectLabel({
      labelText: localizationProvider.get("VOTSubtitlesDownloadFormat"),
    });
    this.subtitlesDownloadFormatSelect = new Select({
      selectTitle:
        this.data.subtitlesDownloadFormat ??
        localizationProvider.get("VOTSubtitlesDownloadFormat"),
      dialogTitle: localizationProvider.get("VOTSubtitlesDownloadFormat"),
      dialogParent: this.globalPortal,
      labelElement: this.subtitlesDownloadFormatSelectLabel.container,
      items: subtitlesFormats.map((format) => ({
        label: format.toUpperCase(),
        value: format,
        selected: format === this.data.subtitlesDownloadFormat,
      })),
    });

    this.subtitlesDesignDetails = new Details({
      titleHtml: localizationProvider.get("VOTSubtitlesDesign"),
    });

    this.dialog.bodyContainer.append(
      this.subtitlesSettingsHeader,
      this.subtitlesDownloadFormatSelect.container,
      this.subtitlesDesignDetails.container,
    );

    // #endregion Subtitles
    // #region Hotkeys
    this.hotkeysSettingsHeader = UI.createHeader(
      localizationProvider.get("hotkeysSettings"),
    );
    this.translateHotkeyButton = new HotkeyButton({
      labelHtml: "Translate",
      key: this.data.translationHotkey,
    });

    this.dialog.bodyContainer.append(
      this.hotkeysSettingsHeader,
      this.translateHotkeyButton.container,
    );

    // #endregion Hotkeys
    // #region Proxy

    this.proxySettingsHeader = UI.createHeader(
      localizationProvider.get("proxySettings"),
    );

    this.proxyM3U8HostTextfield = new Textfield({
      labelHtml: localizationProvider.get("VOTM3u8ProxyHost"),
      value: this.data.m3u8ProxyHost,
      placeholder: m3u8ProxyHost,
    });

    this.proxyWorkerHostTextfield = new Textfield({
      labelHtml: localizationProvider.get("VOTProxyWorkerHost"),
      value: this.data.proxyWorkerHost,
      placeholder: proxyWorkerHost,
    });

    const proxyEnabledLabels = [
      localizationProvider.get("VOTTranslateProxyDisabled"),
      localizationProvider.get("VOTTranslateProxyEnabled"),
      localizationProvider.get("VOTTranslateProxyEverything"),
    ];
    const translateProxyEnabled = this.data.translateProxyEnabled ?? 0;
    const isTranslateProxyRequired =
      countryCode && proxyOnlyCountries.includes(countryCode);
    this.proxyTranslationStatusSelectLabel = new SelectLabel({
      icon: isTranslateProxyRequired ? WARNING_ICON : undefined,
      labelText: localizationProvider.get("VOTTranslateProxyStatus"),
    });
    if (isTranslateProxyRequired) {
      this.proxyTranslationStatusSelectTooltip = new Tooltip({
        target: this.proxyTranslationStatusSelectLabel.icon,
        content: localizationProvider.get("VOTTranslateProxyStatusDefault"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }

    this.proxyTranslationStatusSelect = new Select({
      selectTitle: proxyEnabledLabels[translateProxyEnabled],
      dialogTitle: localizationProvider.get("VOTTranslateProxyStatus"),
      dialogParent: this.globalPortal,
      labelElement: this.proxyTranslationStatusSelectLabel.container,
      items: proxyEnabledLabels.map((label, idx) => ({
        label,
        value: idx.toString(),
        selected: idx === translateProxyEnabled,
        disabled: idx === 0 && isProxyOnlyExtension,
      })),
    });

    this.dialog.bodyContainer.append(
      this.proxySettingsHeader,
      this.proxyM3U8HostTextfield.container,
      this.proxyWorkerHostTextfield.container,
      this.proxyTranslationStatusSelect.container,
    );

    // #endregion Proxy
    // #region Misc

    this.miscSettingsHeader = UI.createHeader(
      localizationProvider.get("miscSettings"),
    );

    this.translateAPIErrorsCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTTranslateAPIErrors"),
      checked: this.data.translateAPIErrors ?? true,
    });
    this.translateAPIErrorsCheckbox.hidden = localizationProvider.lang === "ru";

    this.useNewAudioPlayerCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTNewAudioPlayer"),
      checked: this.data.newAudioPlayer,
    });
    if (!this.videoHandler?.audioContext) {
      this.useNewAudioPlayerCheckbox.disabled = true;
      this.useNewAudioPlayerTooltip = new Tooltip({
        target: this.useNewAudioPlayerCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }

    const onlyBypassMediaCSPLabel = this.videoHandler?.site.needBypassCSP
      ? `${localizationProvider.get("VOTOnlyBypassMediaCSP")} (${localizationProvider.get("VOTMediaCSPEnabledOnSite")})`
      : localizationProvider.get("VOTOnlyBypassMediaCSP");
    this.onlyBypassMediaCSPCheckbox = new Checkbox({
      labelHtml: onlyBypassMediaCSPLabel,
      checked: this.data.onlyBypassMediaCSP,
      isSubCheckbox: true,
    });
    if (!this.videoHandler?.audioContext) {
      this.onlyBypassMediaCSPTooltip = new Tooltip({
        target: this.onlyBypassMediaCSPCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.onlyBypassMediaCSPCheckbox.disabled =
      !this.data.newAudioPlayer && !!this.videoHandler?.audioContext;
    if (!this.data.newAudioPlayer) {
      this.onlyBypassMediaCSPCheckbox.hidden = true;
    }

    this.translationTextServiceLabel = new SelectLabel({
      labelText: localizationProvider.get("VOTTranslationTextService"),
      icon: HELP_ICON,
    });
    const translationService =
      this.data.translationService ?? defaultTranslationService;
    this.translationTextServiceSelect = new Select({
      selectTitle: localizationProvider.get(`services.${translationService}`),
      dialogTitle: localizationProvider.get("VOTTranslationTextService"),
      dialogParent: this.globalPortal,
      labelElement: this.translationTextServiceLabel.container,
      items: foswlyServices.map((service) => ({
        label: localizationProvider.get(`services.${service}`),
        value: service,
        selected: service === translationService,
      })),
    });

    this.translationTextServiceTooltip = new Tooltip({
      target: this.translationTextServiceLabel.icon,
      content: localizationProvider.get("VOTNotAffectToVoice"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });

    this.detectServiceLabel = new SelectLabel({
      labelText: localizationProvider.get("VOTDetectService"),
    });
    const detectService = this.data.detectService ?? defaultDetectService;
    this.detectServiceSelect = new Select({
      selectTitle: localizationProvider.get(`services.${detectService}`),
      dialogTitle: localizationProvider.get("VOTDetectService"),
      dialogParent: this.globalPortal,
      labelElement: this.detectServiceLabel.container,
      items: detectServices.map((service) => ({
        label: localizationProvider.get(`services.${service}`),
        value: service,
        selected: service === detectService,
      })),
    });

    this.appearanceDetails = new Details({
      titleHtml: localizationProvider.get("appearance"),
    });

    this.aboutExtensionDetails = new Details({
      titleHtml: localizationProvider.get("aboutExtension"),
    });

    this.bugReportButton = UI.createOutlinedButton(
      localizationProvider.get("VOTBugReport"),
    );
    this.resetSettingsButton = UI.createButton(
      localizationProvider.get("resetSettings"),
    );

    this.dialog.bodyContainer.append(
      this.miscSettingsHeader,
      this.translateAPIErrorsCheckbox.container,
      this.useNewAudioPlayerCheckbox.container,
      this.onlyBypassMediaCSPCheckbox.container,
      this.translationTextServiceSelect.container,
      this.detectServiceSelect.container,
      this.appearanceDetails.container,
      this.aboutExtensionDetails.container,
      this.bugReportButton,
      this.resetSettingsButton,
    );

    // #endregion Misc
    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    // #region [Events]
    // #region [Events] Translation
    this.autoTranslateCheckbox.addEventListener("change", async (checked) => {
      this.data.autoTranslate = checked;
      await votStorage.set("autoTranslate", this.data.autoTranslate);
      utils_debug.log("autoTranslate value changed. New value:", checked);
      this.onChangeAutoTranslate.dispatch(checked);
    });

    this.dontTranslateLanguagesCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.enabledDontTranslateLanguages = checked;
        await votStorage.set(
          "enabledDontTranslateLanguages",
          this.data.enabledDontTranslateLanguages,
        );
        utils_debug.log(
          "enabledDontTranslateLanguages value changed. New value:",
          checked,
        );
      },
    );

    this.dontTranslateLanguagesSelect.addEventListener(
      "selectItem",
      async (values) => {
        this.data.dontTranslateLanguages = values;
        await votStorage.set(
          "dontTranslateLanguages",
          this.data.dontTranslateLanguages,
        );
        utils_debug.log("dontTranslateLanguages value changed. New value:", values);
      },
    );

    this.autoSetVolumeCheckbox.addEventListener("change", async (checked) => {
      this.data.enabledAutoVolume = checked;
      await votStorage.set("enabledAutoVolume", this.data.enabledAutoVolume);
      utils_debug.log("enabledAutoVolume value changed. New value:", checked);
    });

    this.autoSetVolumeSlider.addEventListener("input", async (value) => {
      this.data.autoVolume = this.autoSetVolumeSliderLabel.value = value;
      await votStorage.set("autoVolume", this.data.autoVolume);
      utils_debug.log("autoVolume value changed. New value:", value);
    });

    this.showVideoVolumeSliderCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.showVideoSlider = checked;
        await votStorage.set("showVideoSlider", this.data.showVideoSlider);
        utils_debug.log("showVideoVolumeSlider value changed. New value:", checked);
        this.onChangeShowVideoVolume.dispatch(checked);
      },
    );

    this.audioBoosterCheckbox.addEventListener("change", async (checked) => {
      this.data.audioBooster = checked;
      await votStorage.set("audioBooster", this.data.audioBooster);
      utils_debug.log("audioBooster value changed. New value:", checked);
      this.onChangeAudioBooster.dispatch(checked);
    });

    this.syncVolumeCheckbox.addEventListener("change", async (checked) => {
      this.data.syncVolume = checked;
      await votStorage.set("syncVolume", this.data.syncVolume);
      utils_debug.log("syncVolume value changed. New value:", checked);
    });

    this.downloadWithNameCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.downloadWithName = checked;
        await votStorage.set("downloadWithName", this.data.downloadWithName);
        utils_debug.log("downloadWithName value changed. New value:", checked);
      },
    );

    this.sendNotifyOnCompleteCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.sendNotifyOnComplete = checked;
        await votStorage.set(
          "sendNotifyOnComplete",
          this.data.sendNotifyOnComplete,
        );
        utils_debug.log("sendNotifyOnComplete value changed. New value:", checked);
      },
    );

    this.useLivelyVoiceCheckbox.addEventListener("change", async (checked) => {
      this.data.useNewModel = checked;
      await votStorage.set("useNewModel", this.data.useNewModel);
      utils_debug.log("useNewModel value changed. New value:", checked);
      this.onChangeUseLivelyVoice.dispatch(checked);
    });

    // #endregion [Events] Translation
    // #region [Events] Subtitles
    this.subtitlesDownloadFormatSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.subtitlesDownloadFormat = item;
        await votStorage.set(
          "subtitlesDownloadFormat",
          this.data.subtitlesDownloadFormat,
        );
        utils_debug.log("subtitlesDownloadFormat value changed. New value:", item);
      },
    );
    this.subtitlesDesignDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("VOTSubtitlesDesign"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      // #region [Events] Subtitles Dialog UI
      const subtitlesHighlightWordsCheckbox = new Checkbox({
        labelHtml: localizationProvider.get("VOTHighlightWords"),
        checked: this.data.highlightWords,
      });

      const subtitlesMaxLength = this.data.subtitlesMaxLength ?? 300;
      const subtitlesMaxLengthSliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesMaxLength"),
        labelEOL: ":",
        symbol: "",
        value: subtitlesMaxLength,
      });
      const subtitlesMaxLengthSlider = new Slider({
        labelHtml: subtitlesMaxLengthSliderLabel.container,
        value: subtitlesMaxLength,
        min: 50,
        max: 300,
      });

      const subtitlesFontSize = this.data.subtitlesFontSize ?? 20;
      const subtitlesFontSizeSliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesFontSize"),
        labelEOL: ":",
        symbol: "px",
        value: subtitlesFontSize,
      });
      const subtitlesFontSizeSlider = new Slider({
        labelHtml: subtitlesFontSizeSliderLabel.container,
        value: subtitlesFontSize,
        min: 8,
        max: 50,
      });

      const subtitlesBackgroundOpacity = this.data.subtitlesOpacity ?? 20;
      const subtitlesBackgroundOpacitySliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesOpacity"),
        labelEOL: ":",
        value: subtitlesBackgroundOpacity,
      });

      const subtitlesBackgroundOpacitySlider = new Slider({
        labelHtml: subtitlesBackgroundOpacitySliderLabel.container,
        value: subtitlesBackgroundOpacity,
      });

      dialog.bodyContainer.append(
        subtitlesHighlightWordsCheckbox.container,
        subtitlesMaxLengthSlider.container,
        subtitlesFontSizeSlider.container,
        subtitlesBackgroundOpacitySlider.container,
      );

      // #endregion [Events] Subtitles Dialog UI
      // #region [Events] Subtitles Dialog Events
      subtitlesHighlightWordsCheckbox.addEventListener(
        "change",
        async (checked) => {
          this.data.highlightWords = checked;
          await votStorage.set("highlightWords", this.data.highlightWords);
          utils_debug.log("highlightWords value changed. New value:", checked);
          this.onChangeSubtitlesHighlightWords.dispatch(checked);
        },
      );
      subtitlesMaxLengthSlider.addEventListener("input", (value) => {
        subtitlesMaxLengthSliderLabel.value = value;
        this.data.subtitlesMaxLength = value;
        votStorage.set("subtitlesMaxLength", this.data.subtitlesMaxLength);
        utils_debug.log("highlightWords value changed. New value:", value);
        this.onInputSubtitlesMaxLength.dispatch(value);
      });

      subtitlesFontSizeSlider.addEventListener("input", (value) => {
        subtitlesFontSizeSliderLabel.value = value;
        this.data.subtitlesFontSize = value;
        votStorage.set("subtitlesFontSize", this.data.subtitlesFontSize);
        utils_debug.log("subtitlesFontSize value changed. New value:", value);
        this.onInputSubtitlesFontSize.dispatch(value);
      });

      subtitlesBackgroundOpacitySlider.addEventListener("input", (value) => {
        subtitlesBackgroundOpacitySliderLabel.value = value;
        this.data.subtitlesOpacity = value;
        votStorage.set("subtitlesOpacity", this.data.subtitlesOpacity);
        utils_debug.log("subtitlesOpacity value changed. New value:", value);
        this.onInputSubtitlesBackgroundOpacity.dispatch(value);
      });

      // #endregion [Events] Subtitles Dialog Events
    });

    // #endregion [Events] Settings Subtitles
    // #region [Events] Hotkeys
    this.translateHotkeyButton.addEventListener("change", async (key) => {
      this.data.translationHotkey = key;
      await votStorage.set("translationHotkey", this.data.translationHotkey);
      utils_debug.log("translationHotkey value changed. New value:", key);
    });

    // #endregion [Events] Hotkeys
    // #region [Events] Proxy
    this.proxyM3U8HostTextfield.addEventListener("change", async (value) => {
      this.data.m3u8ProxyHost = value || m3u8ProxyHost;
      await votStorage.set("m3u8ProxyHost", this.data.m3u8ProxyHost);
      utils_debug.log(
        "m3u8ProxyHost value changed. New value:",
        this.data.m3u8ProxyHost,
      );
    });

    this.proxyWorkerHostTextfield.addEventListener("change", async (value) => {
      this.data.proxyWorkerHost = value || proxyWorkerHost;
      await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
      utils_debug.log(
        "proxyWorkerHost value changed. New value:",
        this.data.proxyWorkerHost,
      );
      this.onChangeProxyWorkerHost.dispatch(value);
    });
    this.proxyTranslationStatusSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.translateProxyEnabled = Number.parseInt(
          item,
        ) ;
        await votStorage.set(
          "translateProxyEnabled",
          this.data.translateProxyEnabled,
        );
        // User has set the value manually, we don't need to set the default value
        await votStorage.set("translateProxyEnabledDefault", false);
        utils_debug.log(
          "translateProxyEnabled value changed. New value:",
          this.data.translateProxyEnabled,
        );
        this.onSelectItemProxyTranslationStatus.dispatch(item);
      },
    );

    // #endregion [Events] Proxy
    // #region [Events] Misc
    this.translateAPIErrorsCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.translateAPIErrors = checked;
        await votStorage.set(
          "translateAPIErrors",
          this.data.translateAPIErrors,
        );
        utils_debug.log("translateAPIErrors value changed. New value:", checked);
      },
    );

    this.useNewAudioPlayerCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.newAudioPlayer = checked;
        await votStorage.set("newAudioPlayer", this.data.newAudioPlayer);
        utils_debug.log("newAudioPlayer value changed. New value:", checked);
        this.onlyBypassMediaCSPCheckbox.disabled =
          this.onlyBypassMediaCSPCheckbox.hidden = !checked;
        this.onChangeUseNewAudioPlayer.dispatch(checked);
      },
    );

    this.onlyBypassMediaCSPCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.onlyBypassMediaCSP = checked;
        await votStorage.set(
          "onlyBypassMediaCSP",
          this.data.onlyBypassMediaCSP,
        );
        utils_debug.log("onlyBypassMediaCSP value changed. New value:", checked);
        this.onChangeOnlyBypassMediaCSP.dispatch(checked);
      },
    );

    this.translationTextServiceSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.translationService = item;
        await votStorage.set(
          "translationService",
          this.data.translationService,
        );
        utils_debug.log("translationService value changed. New value:", item);
        this.onSelectItemTranslationTextService.dispatch(item);
      },
    );

    this.detectServiceSelect.addEventListener("selectItem", async (item) => {
      this.data.detectService = item;
      await votStorage.set("detectService", this.data.detectService);
      utils_debug.log("detectService value changed. New value:", item);
    });

    this.appearanceDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("appearance"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      // #region [Events] Misc Dialog UI
      const showPiPButtonCheckbox = new Checkbox({
        labelHtml: localizationProvider.get("VOTShowPiPButton"),
        checked: this.data.showPiPButton,
      });
      showPiPButtonCheckbox.hidden = !isPiPAvailable();

      const autoHideButtonDelay = this.data.autoHideButtonDelay ?? 1;
      const autoHideButtonDelaySliderLabel = new SliderLabel({
        labelText: localizationProvider.get("autoHideButtonDelay"),
        labelEOL: ":",
        symbol: ` ${localizationProvider.get("secs")}`,
        value: autoHideButtonDelay,
      });

      const autoHideButtonDelaySlider = new Slider({
        labelHtml: autoHideButtonDelaySliderLabel.container,
        value: autoHideButtonDelay,
        min: 0.1,
        max: 3,
        step: 0.1,
      });

      const buttonPositionSelectLabel = new SelectLabel({
        labelText: localizationProvider.get("buttonPositionInWidePlayer"),
        icon: HELP_ICON,
      });
      const buttonPositionSelect = new Select({
        selectTitle: localizationProvider.get("buttonPositionInWidePlayer"),
        dialogTitle: localizationProvider.get("buttonPositionInWidePlayer"),
        labelElement: buttonPositionSelectLabel.container,
        dialogParent: this.globalPortal,
        items: votButton_positions.map((position) => ({
          label: localizationProvider.get(`position.${position}`),
          value: position,
          selected: position === this.data.buttonPos,
        })),
      });
      const buttonPositionTooltip = new Tooltip({
        target: buttonPositionSelectLabel.icon,
        content: localizationProvider.get("minButtonPositionContainer"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });

      const menuLanguageSelectLabel = new SelectLabel({
        labelText: localizationProvider.get("VOTMenuLanguage"),
      });
      const menuLanguageSelect = new Select({
        selectTitle: localizationProvider.get(
          `langs.${localizationProvider.getLangOverride() }`,
        ),
        dialogTitle: localizationProvider.get("VOTMenuLanguage"),
        labelElement: menuLanguageSelectLabel.container,
        dialogParent: this.globalPortal,
        items: Select.genLanguageItems(
          localizationProvider.getAvailableLangs(),
          localizationProvider.getLangOverride(),
        ),
      });

      dialog.bodyContainer.append(
        showPiPButtonCheckbox.container,
        autoHideButtonDelaySlider.container,
        buttonPositionSelect.container,
        menuLanguageSelect.container,
      );

      // #endregion [Events] Misc Dialog UI
      // #region [Events] Misc Dialog Events
      dialog.addEventListener("close", () => {
        buttonPositionTooltip.release();
      });

      showPiPButtonCheckbox.addEventListener("change", async (checked) => {
        this.data.showPiPButton = checked;
        await votStorage.set("showPiPButton", this.data.showPiPButton);
        utils_debug.log("showPiPButton value changed. New value:", checked);
        this.onChangeShowPiPButton.dispatch(checked);
      });

      autoHideButtonDelaySlider.addEventListener("input", async (value) => {
        utils_debug.log("autoHideButtonDelay value changed. New value:", value);
        autoHideButtonDelaySliderLabel.value = value;
        this.data.autoHideButtonDelay = value;
        await votStorage.set(
          "autoHideButtonDelay",
          this.data.autoHideButtonDelay,
        );
        this.onInputAutoHideButtonDelay.dispatch(value);
      });

      buttonPositionSelect.addEventListener("selectItem", async (item) => {
        utils_debug.log("buttonPos value changed. New value:", item);
        this.data.buttonPos = item;
        await votStorage.set("buttonPos", this.data.buttonPos);
        this.onSelectItemButtonPosition.dispatch(item);
      });

      menuLanguageSelect.addEventListener("selectItem", async (item) => {
        const oldLang = localizationProvider.getLangOverride();
        if (oldLang === item) {
          return;
        }

        utils_debug.log("menuLanguage value changed. New value:", item);
        await votStorage.set("localeLangOverride", item);
        localizationProvider.lang = localizationProvider.getLang();
        await localizationProvider.update(true);
        this.data.localeUpdatedAt = await votStorage.get("localeUpdatedAt", 0);
        this.onSelectItemMenuLanguage.dispatch(item);
      });

      // #endregion [Events] Misc Dialog Events
    });

    this.aboutExtensionDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("aboutExtension"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      const versionInfo = UI.createInformation(
        `${localizationProvider.get("VOTVersion")}:`,
        GM_info.script.version || localizationProvider.get("notFound"),
      );

      const authorsInfo = UI.createInformation(
        `${localizationProvider.get("VOTAuthors")}:`,
        (GM_info.script ).author ??
          localizationProvider.get("notFound"),
      );

      const loaderInfo = UI.createInformation(
        `${localizationProvider.get("VOTLoader")}:`,
        `${GM_info.scriptHandler} v${GM_info.version}`,
      );

      const userBrowserInfo = UI.createInformation(
        `${localizationProvider.get("VOTBrowser")}:`,
        `${browserInfo.browser.name} ${browserInfo.browser.version} (${browserInfo.os.name} ${browserInfo.os.version})`,
      );

      const localeUpdatedAt = new Date(
        (this.data.localeUpdatedAt ?? 0) * 1000,
      ).toLocaleString();
      const localeInfoValue = x`${this.data.localeHash}<br />(${localizationProvider.get(
          "VOTUpdatedAt",
        )}
        ${localeUpdatedAt})`;

      const localeInfo = UI.createInformation(
        `${localizationProvider.get("VOTLocaleHash")}:`,
        localeInfoValue,
      );

      const updateLocaleFilesButton = UI.createOutlinedButton(
        localizationProvider.get("VOTUpdateLocaleFiles"),
      );

      dialog.bodyContainer.append(
        versionInfo.container,
        authorsInfo.container,
        loaderInfo.container,
        userBrowserInfo.container,
        localeInfo.container,
        updateLocaleFilesButton,
      );

      updateLocaleFilesButton.addEventListener("click", async () => {
        await votStorage.set("localeHash", "");
        await localizationProvider.update(true);
        window.location.reload();
      });
    });

    this.bugReportButton.addEventListener("click", () => {
      this.onClickBugReport.dispatch();
    });

    this.resetSettingsButton.addEventListener("click", () => {
      this.onClickResetSettings.dispatch();
    });

    // #endregion [Events]
    return this;
  }

  











































































  addEventListener(
    type


















,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    switch (type) {
      case "click:bugReport": {
        this.onClickBugReport.addListener(listener);
        break;
      }
      case "click:resetSettings": {
        this.onClickResetSettings.addListener(listener);
        break;
      }
      case "change:autoTranslate": {
        this.onChangeAutoTranslate.addListener(listener);
        break;
      }
      case "change:showVideoVolume": {
        this.onChangeShowVideoVolume.addListener(listener);
        break;
      }
      case "change:audioBuster": {
        this.onChangeAudioBooster.addListener(listener);
        break;
      }
      case "change:useLivelyVoice": {
        this.onChangeUseLivelyVoice.addListener(listener);
        break;
      }
      case "change:subtitlesHighlightWords": {
        this.onChangeSubtitlesHighlightWords.addListener(listener);
        break;
      }
      case "change:proxyWorkerHost": {
        this.onChangeProxyWorkerHost.addListener(listener);
        break;
      }
      case "change:useNewAudioPlayer": {
        this.onChangeUseNewAudioPlayer.addListener(listener);
        break;
      }
      case "change:onlyBypassMediaCSP": {
        this.onChangeOnlyBypassMediaCSP.addListener(listener);
        break;
      }
      case "change:showPiPButton": {
        this.onChangeShowPiPButton.addListener(listener);
        break;
      }
      case "input:subtitlesMaxLength": {
        this.onInputSubtitlesMaxLength.addListener(listener);
        break;
      }
      case "input:subtitlesFontSize": {
        this.onInputSubtitlesFontSize.addListener(listener);
        break;
      }
      case "input:subtitlesBackgroundOpacity": {
        this.onInputSubtitlesBackgroundOpacity.addListener(listener);
        break;
      }
      case "input:autoHideButtonDelay": {
        this.onInputAutoHideButtonDelay.addListener(listener);
        break;
      }
      case "select:proxyTranslationStatus": {
        this.onSelectItemProxyTranslationStatus.addListener(listener);
        break;
      }
      case "select:translationTextService": {
        this.onSelectItemTranslationTextService.addListener(listener);
        break;
      }
      case "select:buttonPosition": {
        this.onSelectItemButtonPosition.addListener(listener);
        break;
      }
      case "select:menuLanguage": {
        this.onSelectItemMenuLanguage.addListener(listener);
        break;
      }
    }

    return this;
  }

  











































































  removeEventListener(
    type


















,
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener,
  ) {
    switch (type) {
      case "click:bugReport": {
        this.onClickBugReport.removeListener(listener);
        break;
      }
      case "click:resetSettings": {
        this.onClickResetSettings.removeListener(listener);
        break;
      }
      case "change:autoTranslate": {
        this.onChangeAutoTranslate.removeListener(listener);
        break;
      }
      case "change:showVideoVolume": {
        this.onChangeShowVideoVolume.removeListener(listener);
        break;
      }
      case "change:audioBuster": {
        this.onChangeAudioBooster.removeListener(listener);
        break;
      }
      case "change:useLivelyVoice": {
        this.onChangeUseLivelyVoice.removeListener(listener);
        break;
      }
      case "change:subtitlesHighlightWords": {
        this.onChangeSubtitlesHighlightWords.removeListener(listener);
        break;
      }
      case "change:proxyWorkerHost": {
        this.onChangeProxyWorkerHost.removeListener(listener);
        break;
      }
      case "change:useNewAudioPlayer": {
        this.onChangeUseNewAudioPlayer.removeListener(listener);
        break;
      }
      case "change:onlyBypassMediaCSP": {
        this.onChangeOnlyBypassMediaCSP.removeListener(listener);
        break;
      }
      case "change:showPiPButton": {
        this.onChangeShowPiPButton.removeListener(listener);
        break;
      }
      case "input:subtitlesMaxLength": {
        this.onInputSubtitlesMaxLength.removeListener(listener);
        break;
      }
      case "input:subtitlesFontSize": {
        this.onInputSubtitlesFontSize.removeListener(listener);
        break;
      }
      case "input:subtitlesBackgroundOpacity": {
        this.onInputSubtitlesBackgroundOpacity.removeListener(listener);
        break;
      }
      case "input:autoHideButtonDelay": {
        this.onInputAutoHideButtonDelay.removeListener(listener);
        break;
      }
      case "select:proxyTranslationStatus": {
        this.onSelectItemProxyTranslationStatus.removeListener(listener);
        break;
      }
      case "select:translationTextService": {
        this.onSelectItemTranslationTextService.removeListener(listener);
        break;
      }
      case "select:buttonPosition": {
        this.onSelectItemButtonPosition.removeListener(listener);
        break;
      }
      case "select:menuLanguage": {
        this.onSelectItemMenuLanguage.removeListener(listener);
        break;
      }
    }

    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    this.dialog.remove();
    this.audioBoosterTooltip?.release();
    this.useNewAudioPlayerTooltip?.release();
    this.onlyBypassMediaCSPTooltip?.release();
    this.translationTextServiceTooltip?.release();
    this.proxyTranslationStatusSelectTooltip?.release();

    this.initialized = initialized;
    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    this.onClickBugReport.clear();
    this.onClickResetSettings.clear();

    this.onChangeAutoTranslate.clear();
    this.onChangeShowVideoVolume.clear();
    this.onChangeAudioBooster.clear();
    this.onChangeUseLivelyVoice.clear();
    this.onChangeSubtitlesHighlightWords.clear();
    this.onChangeProxyWorkerHost.clear();
    this.onChangeUseNewAudioPlayer.clear();
    this.onChangeOnlyBypassMediaCSP.clear();
    this.onChangeShowPiPButton.clear();

    this.onInputSubtitlesMaxLength.clear();
    this.onInputSubtitlesFontSize.clear();
    this.onInputSubtitlesBackgroundOpacity.clear();
    this.onInputAutoHideButtonDelay.clear();

    this.onSelectItemProxyTranslationStatus.clear();
    this.onSelectItemTranslationTextService.clear();
    this.onSelectItemButtonPosition.clear();
    this.onSelectItemMenuLanguage.clear();

    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }

  open() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    return this.dialog.open();
  }

  close() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    return this.dialog.close();
  }
}

;// ./src/ui/manager.ts

















class UIManager {
  root;
  portalContainer;
  tooltipLayoutRoot;

   initialized = false;
   data;
   videoHandler;

  votGlobalPortal;
  /**
   * Contains all elements over video player e.g. button, menu and etc
   */
  votOverlayView;
  /**
   * Dialog settings menu
   */
  votSettingsView;

  constructor({
    root,
    portalContainer,
    tooltipLayoutRoot,
    data = {},
    videoHandler,
  }) {
    this.root = root;
    this.portalContainer = portalContainer;
    this.tooltipLayoutRoot = tooltipLayoutRoot;
    this.videoHandler = videoHandler;
    this.data = data;
  }

  isInitialized()



 {
    return this.initialized;
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] UIManager is already initialized");
    }

    this.initialized = true;

    this.votGlobalPortal = UI.createPortal();
    document.documentElement.appendChild(this.votGlobalPortal);

    this.votOverlayView = new OverlayView({
      root: this.root,
      portalContainer: this.portalContainer,
      tooltipLayoutRoot: this.tooltipLayoutRoot,
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
    });
    this.votOverlayView.initUI();

    this.votSettingsView = new SettingsView({
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
    });
    this.votSettingsView.initUI();

    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    // #region overlay view events
    this.votOverlayView.initUIEvents();
    this.votOverlayView
      .addEventListener("click:translate", async () => {
        await this.videoHandler?.translationHandler.handleTranslationBtnClick();
      })
      .addEventListener("click:pip", async () => {
        if (!this.videoHandler) {
          return;
        }

        const isPiPActive =
          this.videoHandler.video === document.pictureInPictureElement;
        await (isPiPActive
          ? document.exitPictureInPicture()
          : this.videoHandler.video.requestPictureInPicture());
      })
      .addEventListener("click:settings", async () => {
        this.videoHandler?.subtitlesWidget.releaseTooltip();
        this.votSettingsView.open();
        await exitFullscreen();
      })
      .addEventListener("click:downloadTranslation", async () => {
        if (!this.videoHandler?.downloadTranslationUrl) return;
        try {
          if (!this.data.downloadWithName) {
            return window
              .open(this.videoHandler.downloadTranslationUrl, "_blank")
              ?.focus();
          }
          // TODO: add loading animation or change text %
          const res = await GM_fetch(this.videoHandler.downloadTranslationUrl, {
            timeout: 0,
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const contentLength = +res.headers.get("Content-Length");
          const reader = res.body.getReader();
          const chunksBuffer = new Uint8Array(contentLength);
          let offset = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunksBuffer.set(value, offset);
            offset += value.length;
            // updateAnimation(Math.round((offset / contentLength) * 100));
          }
          const filename = clearFileName(
            // biome-ignore lint/style/noNonNullAssertion: remove ! after rewriting index.js to ts
            this.videoHandler.videoData.downloadTitle,
          );
          const writer = new browser_id3_writer_o(chunksBuffer.buffer);
          writer.setFrame("TIT2", filename);
          writer.addTag();
          downloadBlob(writer.getBlob(), `${filename}.mp3`);
        } catch (err) {
          console.error("[VOT] Download failed:", err);
          this.transformBtn(
            "error",
            localizationProvider.get("downloadFailed"),
          );
        }
      })
      .addEventListener("click:downloadSubtitles", async () => {
        if (
          !this.videoHandler ||
          !this.videoHandler.yandexSubtitles ||
          !this.videoHandler.videoData
        ) {
          return;
        }

        const subsFormat = this.data.subtitlesDownloadFormat ?? "json";
        const subsContent = convertSubs(
          this.videoHandler.yandexSubtitles,
          subsFormat,
        );
        const blob = new Blob(
          [
            subsFormat === "json"
              ? JSON.stringify(subsContent)
              : (subsContent ),
          ],
          {
            type: "text/plain",
          },
        );
        const filename = this.data.downloadWithName
          ? clearFileName(this.videoHandler.videoData.downloadTitle)
          : `subtitles_${this.videoHandler.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${subsFormat}`);
      })
      .addEventListener("input:videoVolume", (volume) => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.setVideoVolume(volume / 100);
        if (this.data.syncVolume) {
          this.videoHandler.syncVolumeWrapper("video", volume);
        }
      })
      .addEventListener("input:translationVolume", () => {
        if (!this.videoHandler) {
          return;
        }

        const defaultVolume = this.data.defaultVolume ?? 100;
        this.videoHandler.audioPlayer.player.volume = defaultVolume / 100;
        if (!this.data.syncVolume) {
          return;
        }

        this.videoHandler.syncVolumeWrapper("translation", defaultVolume);
        if (
          ["youtube", "googledrive"].includes(this.videoHandler.site.host) &&
          this.videoHandler.site.additionalData !== "mobile"
        ) {
          this.videoHandler.setVideoVolume(
            this.videoHandler.tempOriginalVolume / 100,
          );
        }
      })
      .addEventListener("select:subtitles", async (data) => {
        await this.videoHandler?.changeSubtitlesLang(data);
      });

    // #endregion overlay view events
    // #region settings view events
    this.votSettingsView.initUIEvents();
    this.votSettingsView
      .addEventListener("change:autoTranslate", async (checked) => {
        if (
          checked &&
          this.videoHandler &&
          !this.videoHandler.audioPlayer.player.src
        ) {
          await this.videoHandler.translationHandler.handleTranslationBtnClick();
        }
      })
      .addEventListener("change:showVideoVolume", () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        this.votOverlayView.videoVolumeSlider.container.hidden =
          !this.data.showVideoSlider ||
          this.votOverlayView.votButton.status !== "success";
      })
      .addEventListener("change:audioBuster", async () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        const currentVolume = this.votOverlayView.translationVolumeSlider.value;
        this.votOverlayView.translationVolumeSlider.max = this.data.audioBooster
          ? maxAudioVolume
          : 100;
        this.votOverlayView.translationVolumeSlider.value = clamp(
          currentVolume,
          0,
          100,
        );
      })
      .addEventListener("change:useLivelyVoice", () => {
        this.videoHandler?.stopTranslate();
      })
      .addEventListener("change:subtitlesHighlightWords", (checked) => {
        this.videoHandler?.subtitlesWidget.setHighlightWords(
          this.data.highlightWords ?? checked,
        );
      })
      .addEventListener("input:subtitlesMaxLength", (value) => {
        this.videoHandler?.subtitlesWidget.setMaxLength(
          this.data.subtitlesMaxLength ?? value,
        );
      })
      .addEventListener("input:subtitlesFontSize", (value) => {
        this.videoHandler?.subtitlesWidget.setFontSize(
          this.data.subtitlesFontSize ?? value,
        );
      })
      .addEventListener("input:subtitlesBackgroundOpacity", (value) => {
        this.videoHandler?.subtitlesWidget.setOpacity(
          this.data.subtitlesOpacity ?? value,
        );
      })
      .addEventListener("change:proxyWorkerHost", (value) => {
        if (!this.data.translateProxyEnabled || !this.videoHandler) {
          return;
        }

        this.videoHandler.votClient.host = this.data.proxyWorkerHost ?? value;
      })
      .addEventListener("select:proxyTranslationStatus", () => {
        this.videoHandler?.initVOTClient();
      })
      .addEventListener("change:useNewAudioPlayer", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.stopTranslate();
        this.videoHandler.createPlayer();
      })
      .addEventListener("change:onlyBypassMediaCSP", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.stopTranslate();
        this.videoHandler.createPlayer();
      })
      .addEventListener("select:translationTextService", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.subtitlesWidget.strTranslatedTokens = "";
        this.videoHandler.subtitlesWidget.releaseTooltip();
      })
      .addEventListener("change:showPiPButton", () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        this.votOverlayView.votButton.pipButton.hidden =
          this.votOverlayView.votButton.separator2.hidden =
            !this.votOverlayView.pipButtonVisible;
      })
      .addEventListener("input:autoHideButtonDelay", (value) => {
        // TODO: add logic
      })
      .addEventListener("select:buttonPosition", (item) => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        const newPosition = this.data.buttonPos ?? item;
        this.votOverlayView.updateButtonLayout(
          newPosition,
          VOTButton.calcDirection(newPosition),
        );
      })
      .addEventListener("select:menuLanguage", async () => {
        this.videoHandler?.stopTranslation();
        this.release();
        this.initUI();
        this.initUIEvents();
        if (!this.videoHandler) {
          return;
        }

        await this.videoHandler.updateSubtitlesLangSelect();
        this.videoHandler.subtitlesWidget.portal =
          this.votOverlayView.votOverlayPortal;
        this.videoHandler.subtitlesWidget.strTranslatedTokens = "";
      })
      .addEventListener("click:bugReport", () => {
        if (!this.videoHandler) {
          return;
        }

        const params = new URLSearchParams(
          this.videoHandler.collectReportInfo(),
        ).toString();

        window.open(`${repositoryUrl}/issues/new?${params}`, "_blank")?.focus();
      })
      .addEventListener("click:resetSettings", async () => {
        const valuesForClear = await votStorage.list();
        await Promise.all(
          valuesForClear.map(async (val) => await votStorage.delete(val)),
        );

        window.location.reload();
      });

    // #endregion settings view events
  }

   isLoadingText(text) {
    return (
      typeof text === "string" &&
      (text.includes(localizationProvider.get("translationTake")) ||
        text.includes(localizationProvider.get("TranslationDelayed")))
    );
  }

  transformBtn(status, text) {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.votOverlayView.votButton.status = status;
    this.votOverlayView.votButton.loading =
      status === "error" && this.isLoadingText(text);
    this.votOverlayView.votButton.setText(text);
    this.votOverlayView.votButtonTooltip.setContent(text);
    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    this.votOverlayView.releaseUI(true);
    this.votSettingsView.releaseUI(true);
    this.votGlobalPortal.remove();
    this.initialized = initialized;

    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    this.votOverlayView.releaseUIEvents(false);
    this.votSettingsView.releaseUIEvents(false);
    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }
}

;// ./src/audioDownloader/shared.ts



const IFRAME_HASH = "vot_iframe";
const IFRAME_ID = "vot_iframe_player";

const MIN_CHUNK_RANGES_PART_SIZE = data_config.minChunkSize; // 5295308
const MIN_CONTENT_LENGTH_MULTIPLIER = 0.9;
const CHUNK_STEPS = [60_000, 80_000, 150_000, 330_000, 460_000];
const MIN_ARRAY_BUFFER_LENGTH = 15_000;
const ACCEPTABLE_LENGTH_DIFF = 0.9;

const getRequestUrl = (request) =>
  typeof request === "string" ? request : request.url;

function serializeRequestInit(
  request,
) {
  const body = new Uint8Array([120, 0]);
  if (typeof request === "string") {
    return {
      body,
      cache: "no-store" ,
      credentials: "include" ,
      method: "POST",
    };
  }

  const {
    headers,
    cache,
    credentials,
    integrity,
    keepalive,
    method,
    mode,
    redirect,
    referrer,
    referrerPolicy,
  } = request;
  const headersEntries = [...headers.entries()];

  return {
    body,
    cache,
    credentials,
    headersEntries,
    integrity,
    keepalive,
    method,
    mode,
    redirect,
    referrer,
    referrerPolicy,
  };
}

function deserializeRequestInit(request) {
  const { headersEntries, ...options } = request;
  const headers = new Headers(headersEntries);
  return {
    ...options,
    headers,
  };
}

function serializeResponse(response) {
  const { ok, redirected, status, statusText, type, url } = response;
  return {
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
  };
}

;// ./src/audioDownloader/iframe.ts










let lastMessageId = "";

// TODO: remove after update vot.js






const getAdaptiveFormats = () =>
  YoutubeHelper.getPlayerResponse()?.streamingData?.adaptiveFormats;

async function isEncodedRequest(url, request) {
  if (
    !url.includes("googlevideo.com/videoplayback") ||
    typeof request === "string"
  ) {
    return false;
  }

  try {
    const reader = request.clone().body?.getReader();
    if (!reader) {
      return false;
    }

    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalLength += value.length;
      if (totalLength > 2) {
        return true;
      }
    }
  } catch {}

  return false;
}

function selectBestAudioFormat() {
  const allFormats = getAdaptiveFormats();
  if (!allFormats?.length) {
    const reason = !allFormats
      ? "Cannot get adaptive formats"
      : "Empty adaptive formats";
    throw new Error(`Audio downloader. WEB API. ${reason}`);
  }

  const audioFormats = (allFormats ).filter(
    ({ audioQuality, mimeType }) => audioQuality || mimeType?.includes("audio"),
  );
  if (!audioFormats.length) {
    throw new Error("Audio downloader. WEB API. No audio adaptive formats");
  }

  const itag251Sorted = audioFormats
    .filter(({ itag }) => itag === 251)
    .sort(({ contentLength: a }, { contentLength: b }) =>
      a && b ? Number.parseInt(a) - Number.parseInt(b) : -1,
    );

  return itag251Sorted.at(-1) ?? audioFormats[0];
}

const waitForPlayer = async () => {
  await waitForCondition(() => Boolean(YoutubeHelper.getPlayer()), 10_000);
  return YoutubeHelper.getPlayer();
};

async function getDownloadAudioData(data) {
  try {
    lastMessageId = data.messageId;
    console.log("getDownloadAudioData", data);
    const originalFetch = unsafeWindow.fetch;

    unsafeWindow.fetch = async (
      input,
      init,
    ) => {
      console.log("patched window fetch :3", input, init);
      if (input instanceof URL) {
        input = input.toString();
      }

      const requestUrl = getRequestUrl(input);
      if (await isEncodedRequest(requestUrl, input)) {
        window.parent.postMessage(
          {
            ...data,
            messageDirection: "response",
            error: "Audio downloader. Detected encoded request.",
          },
          "*",
        );
        unsafeWindow.fetch = originalFetch;
        return originalFetch(input, init);
      }

      const response = await originalFetch(input, init);
      if (data.messageId !== lastMessageId) {
        unsafeWindow.fetch = originalFetch;
        return response;
      }

      if (requestUrl.includes("&itag=251&")) {
        unsafeWindow.fetch = originalFetch;
        window.parent.postMessage(
          {
            ...data,
            messageDirection: "response",
            payload: {
              requestInfo: requestUrl,
              requestInit: init || serializeRequestInit(input),
              adaptiveFormat: selectBestAudioFormat(),
              itag: 251,
            },
          },
          "*",
        );
      }

      return response;
    };

    const player = await waitForPlayer();
    if (data.messageId !== lastMessageId) {
      throw new Error(
        "Audio downloader. Download started for another video while getting player",
      );
    }
    if (!player?.loadVideoById) {
      throw new Error(
        "Audio downloader. There is no player.loadVideoById in iframe",
      );
    }
    console.log("player", player, player.pauseVideo, player.mute);
    player.loadVideoById(data.payload.videoId);
    player.pauseVideo?.();
    player.mute?.();

    setTimeout(() => {
      if (data.messageId !== lastMessageId) {
        console.error(
          "Audio Downloader. Download started for another video while waiting to repause video",
        );
        return;
      }

      if (!player) {
        console.error(
          "[Critical] Audio Downloader. Player not found in iframe after timeout",
        );
        return;
      }

      player.pauseVideo?.();
    }, 1000);
  } catch (error) {
    window.parent.postMessage(
      {
        ...data,
        messageDirection: "response",
        error,
      },
      "*",
    );
  }
}

const handleIframeMessage = async ({ data }) => {
  if (data?.messageDirection !== "request") {
    return;
  }

  try {
    switch (data.messageType) {
      case "get-download-audio-data-in-iframe":
        await getDownloadAudioData(
          data.payload ,
        );
        break;
      default:
        console.log(`NOT IMPLEMENTED: ${data.messageType}`, data.payload);
    }
  } catch (error) {
    console.error("[VOT] Main world bridge", {
      error,
    });
  }
};

function initIframeService() {
  window.addEventListener("message", handleIframeMessage);
  window.parent.postMessage(
    {
      messageType: "say-service-iframe-is-ready",
      messageDirection: "response",
    },
    "*",
  );
}

;// ./src/audioDownloader/index.ts





















let serviceIframe = null;
let mediaQuaryIndex = 1;
const textDecoder = new TextDecoder("ascii");

const generateMessageId = () =>
  `main-world-bridge-${performance.now()}-${Math.random()}`;

const hasServiceIframe = () =>
  document.getElementById(IFRAME_ID) ;

async function setupServiceIframe(src) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.zIndex = "-1";
  iframe.style.display = "none";
  iframe.id = IFRAME_ID;
  iframe.src = `${src}#${IFRAME_HASH}`;
  document.body.appendChild(iframe);

  const ready = new Promise((resolve) => {
    const handleMessage = ({ data }) => {
      if (data.messageType === "say-service-iframe-is-ready") {
        window.removeEventListener("message", handleMessage);
        resolve(true);
      }
    };
    window.addEventListener("message", handleMessage);
  });

  await Promise.race([
    ready,
    timeout(
      15000,
      "Audio downloader. Service iframe did not have time to be ready",
    ),
  ]);

  return iframe;
}

async function ensureServiceIframe(src) {
  if (src.includes("#")) {
    throw new Error(
      "Audio downloader. The src parameter should not contain a hash (#) character.",
    );
  }

  if (hasServiceIframe()) {
    if (serviceIframe !== null) {
      return serviceIframe;
    }

    throw new Error(
      "Audio downloader. Service iframe already exists in DOM, but added not by us.",
    );
  }

  serviceIframe = await setupServiceIframe(src);
  return serviceIframe;
}

async function sendAudioDownloadRequestToIframe(
  data,
) {
  const { videoId } = data.payload;
  const iframeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;

  try {
    const iframe = await ensureServiceIframe(iframeUrl);
    if (!hasServiceIframe()) {
      throw new Error("Audio downloader. WEB API. Service iframe deleted");
    }

    iframe.contentWindow?.postMessage(
      {
        messageId: generateMessageId(),
        messageType: "get-download-audio-data-in-iframe",
        messageDirection: "request",
        payload: data,
        error: data.error,
      },
      "*",
    );
  } catch (err) {
    data.error = err;
    data.messageDirection = "response";
    window.postMessage(data, "*");
  }
}

function requestDataFromMainWorld(
  messageType,
  payload,
) {
  const messageId = generateMessageId();
  return new Promise((resolve, reject) => {
    const handleMessage = ({
      data,
    }) => {
      if (
        data?.messageId === messageId &&
        data.messageType === messageType &&
        data.messageDirection === "response"
      ) {
        window.removeEventListener("message", handleMessage);
        data.error ? reject(data.error) : resolve(data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    window.postMessage(
      {
        messageId,
        messageType,
        messageDirection: "request",
        ...(payload !== undefined && { payload }),
      },
      "*",
    );
  });
}

const getDownloadAudioDataInMainWorld = (payload) =>
  requestDataFromMainWorld


("get-download-audio-data-in-main-world", payload);

const GET_AUDIO_DATA_ERROR_MESSAGE =
  "Audio downloader. WEB API. Can not get getGeneratingAudioUrlsDataFromIframe due to timeout";

async function getGeneratingAudioUrlsDataFromIframe(
  videoId,
) {
  try {
    return await Promise.race([
      getDownloadAudioDataInMainWorld({ videoId }),
      timeout(20000, GET_AUDIO_DATA_ERROR_MESSAGE),
    ]);
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.message === GET_AUDIO_DATA_ERROR_MESSAGE;

    throw new Error(
      isTimeout
        ? GET_AUDIO_DATA_ERROR_MESSAGE
        : "Audio downloader. WEB API. Failed to get audio data",
    );
  }
}

function makeFileId(itag, fileSize) {
  return JSON.stringify({
    downloadType:
      AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
    itag,
    minChunkSize: MIN_CHUNK_RANGES_PART_SIZE,
    fileSize,
  });
}

function parseContentLength({ contentLength }) {
  if (typeof contentLength !== "string") {
    throw new Error(
      `Audio downloader. WEB API. Content length (${contentLength}) is not a string`,
    );
  }

  const parsed = Number.parseInt(contentLength);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Audio downloader. WEB API. Parsed content length is not finite (${parsed})`,
    );
  }

  return parsed;
}

function getChunkRangesPartsFromContentLength(
  contentLength,
) {
  if (contentLength < 1) {
    throw new Error(
      "Audio downloader. WEB API. contentLength must be at least 1",
    );
  }

  const minChunkSize = Math.round(
    contentLength * MIN_CONTENT_LENGTH_MULTIPLIER,
  );
  const parts = [];
  let currentPart = [];
  let currentPartSize = 0;
  let stepIndex = 0;
  let start = 0;
  let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
  while (end < contentLength) {
    const mustExist = end < minChunkSize;
    currentPart.push({ start, end, mustExist });
    currentPartSize += end - start;
    if (currentPartSize >= MIN_CHUNK_RANGES_PART_SIZE) {
      parts.push(currentPart);
      currentPart = [];
      currentPartSize = 0;
    }

    if (stepIndex < CHUNK_STEPS.length - 1) {
      stepIndex++;
    }

    start = end + 1;
    end += CHUNK_STEPS[stepIndex];
  }

  end = contentLength;
  currentPart.push({ start, end, mustExist: false });
  parts.push(currentPart);
  return parts;
}

function getChunkRangesFromContentLength(contentLength) {
  if (contentLength < 1) {
    throw new Error(
      "Audio downloader. WEB API. contentLength cannot be less than 1",
    );
  }

  const minChunkSize = Math.round(
    contentLength * MIN_CONTENT_LENGTH_MULTIPLIER,
  );
  const chunkRanges = [];
  let stepIndex = 0;
  let start = 0;
  let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
  while (end < contentLength) {
    const mustExist = end < minChunkSize;
    chunkRanges.push({
      start,
      end: end,
      mustExist,
    });

    if (stepIndex !== CHUNK_STEPS.length - 1) {
      stepIndex++;
    }

    start = end + 1;
    end += CHUNK_STEPS[stepIndex];
  }

  chunkRanges.push({
    start,
    end: contentLength,
    mustExist: false,
  });

  return chunkRanges;
}

function getChunkRangesPartsFromAdaptiveFormat(format) {
  const contentLength = parseContentLength(format);
  const chunkParts = getChunkRangesPartsFromContentLength(contentLength);
  if (!chunkParts.length) {
    throw new Error("Audio downloader. WEB API. No chunk parts generated");
  }

  return chunkParts;
}

const INCORRECT_FETCH_MEDIA_MESSAGE =
  "Audio downloader. WEB API. Incorrect response on fetch media url";
const CANT_FETCH_MEDIA_MESSAGE =
  "Audio downloader. WEB API. Can not fetch media url";
const CANT_GET_ARRAY_BUFFER_MESSAGE =
  "Audio downloader. WEB API. Can not get array buffer from media url";

function isChunkLengthAcceptable(
  buffer,
  { start, end },
) {
  const rangeLength = end - start;
  if (
    rangeLength > MIN_ARRAY_BUFFER_LENGTH &&
    buffer.byteLength < MIN_ARRAY_BUFFER_LENGTH
  ) {
    return false;
  }

  return (
    Math.min(rangeLength, buffer.byteLength) /
      Math.max(rangeLength, buffer.byteLength) >
    ACCEPTABLE_LENGTH_DIFF
  );
}

function patchMediaUrl(
  url,
  { start, end },
) {
  const modifiedUrl = new URL(url);
  modifiedUrl.searchParams.set("range", `${start}-${end}`);
  modifiedUrl.searchParams.set("rn", String(mediaQuaryIndex++));
  modifiedUrl.searchParams.delete("ump");
  return modifiedUrl.toString();
}

const getUrlFromArrayBuffer = (buffer) => {
  const match = textDecoder.decode(buffer).match(/https:\/\/.*$/);
  return match?.[0] ?? null;
};

async function fetchMediaWithMeta({
  mediaUrl,
  chunkRange,
  requestInit,
  signal,
  isUrlChanged = false,
}) {
  const patchedUrl = patchMediaUrl(mediaUrl, chunkRange);
  let response;

  try {
    response = await GM_fetch(patchedUrl, {
      ...requestInit,
      signal,
    });

    if (!response.ok) {
      const errorDetails = serializeResponse(response);
      console.error(INCORRECT_FETCH_MEDIA_MESSAGE, errorDetails);
      throw new Error(INCORRECT_FETCH_MEDIA_MESSAGE);
    }
  } catch (err) {
    if (err instanceof Error && err.message === INCORRECT_FETCH_MEDIA_MESSAGE) {
      throw err;
    }

    console.error(CANT_FETCH_MEDIA_MESSAGE, {
      mediaUrl: patchedUrl,
      error: err,
    });

    throw new Error(CANT_FETCH_MEDIA_MESSAGE);
  }

  let arrayBuffer;
  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (err) {
    console.error(CANT_GET_ARRAY_BUFFER_MESSAGE, {
      mediaUrl: patchedUrl,
      error: err,
    });
    throw new Error(CANT_GET_ARRAY_BUFFER_MESSAGE);
  }

  if (isChunkLengthAcceptable(arrayBuffer, chunkRange)) {
    return {
      media: arrayBuffer,
      url: isUrlChanged ? mediaUrl : null,
      isAcceptableLast: false,
    };
  }

  const redirectedUrl = getUrlFromArrayBuffer(arrayBuffer);
  if (redirectedUrl) {
    return fetchMediaWithMeta({
      mediaUrl: redirectedUrl,
      chunkRange,
      requestInit,
      signal,
      isUrlChanged: true,
    });
  }

  if (!chunkRange.mustExist) {
    return {
      media: arrayBuffer,
      url: null,
      isAcceptableLast: true,
    };
  }

  throw new Error(
    `Audio downloader. WEB API. Can not get redirected media url ${patchedUrl}`,
  );
}

function mergeBuffers(buffers) {
  const totalLength = buffers.reduce(
    (total, buffer) => total + buffer.byteLength,
    0,
  );
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    merged.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return merged;
}

async function fetchMediaWithMetaByChunkRanges(
  mediaUrl,
  requestInit,
  chunkRanges,
  signal,
) {
  let currentUrl = mediaUrl;
  const mediaBuffers = [];
  let isAcceptableLast = false;

  for (const chunkRange of chunkRanges) {
    const result = await fetchMediaWithMeta({
      mediaUrl: currentUrl,
      chunkRange,
      requestInit,
      signal,
    });

    if (result.url) {
      currentUrl = result.url;
    }

    mediaBuffers.push(result.media);
    isAcceptableLast = result.isAcceptableLast;

    if (isAcceptableLast) {
      break;
    }
  }

  return {
    media: mergeBuffers(mediaBuffers),
    url: currentUrl,
    isAcceptableLast,
  };
}

function getChunkRangesFromAdaptiveFormat(
  adaptiveFormat,
) {
  const contentLength = parseContentLength(adaptiveFormat);
  const chunkRanges = getChunkRangesFromContentLength(contentLength);
  if (!chunkRanges.length) {
    throw new Error("Audio downloader. WEB API. Empty chunk ranges");
  }

  return chunkRanges;
}

async function getAudioFromWebApiWithReplacedFetch({
  videoId,
  returnByParts = false,
  signal,
}) {
  const { requestInit, requestInfo, adaptiveFormat, itag } =
    await getGeneratingAudioUrlsDataFromIframe(videoId);
  if (!requestInfo) {
    throw new Error("Audio downloader. WEB API. Can not get requestInfo");
  }

  let mediaUrl = getRequestUrl(requestInfo);
  const serializedInit = serializeRequestInit(requestInfo);
  const fallbackInit = deserializeRequestInit(serializedInit);
  const finalRequestInit = requestInit || fallbackInit;

  return {
    fileId: makeFileId(itag, adaptiveFormat.contentLength),
    mediaPartsLength: returnByParts
      ? getChunkRangesPartsFromAdaptiveFormat(adaptiveFormat).length
      : 1,
    async *getMediaBuffers() {
      if (returnByParts) {
        const chunkParts =
          getChunkRangesPartsFromAdaptiveFormat(adaptiveFormat);
        for (const part of chunkParts) {
          const { media, url, isAcceptableLast } =
            await fetchMediaWithMetaByChunkRanges(
              mediaUrl,
              finalRequestInit,
              part,
              signal,
            );

          if (url) {
            mediaUrl = url;
          }

          yield media;
          if (isAcceptableLast) {
            break;
          }
        }
      } else {
        const fullRange = getChunkRangesFromAdaptiveFormat(adaptiveFormat);
        const { media } = await fetchMediaWithMetaByChunkRanges(
          mediaUrl,
          finalRequestInit,
          fullRange,
          signal,
        );
        yield media;
      }
    },
  };
}

async function handleCommonAudioDownloadRequest({
  audioDownloader,
  translationId,
  videoId,
  signal,
}) {
  const audioData = await getAudioFromWebApiWithReplacedFetch({
    videoId,
    returnByParts: true,
    signal,
  });
  if (!audioData) {
    throw new Error("Audio downloader. Can not get audio data");
  }
  console.log("Audio downloader. Url found", {
    audioDownloadType: "web_api_get_all_generating_urls_data_from_iframe",
  });

  const { getMediaBuffers, mediaPartsLength, fileId } = audioData;
  if (mediaPartsLength < 2) {
    const { value } = await getMediaBuffers().next();
    if (!value) {
      throw new Error("Audio downloader. Empty audio");
    }

    audioDownloader.onDownloadedAudio.dispatch(translationId, {
      videoId,
      fileId,
      audioData: value,
    });
    return;
  }

  let index = 0;
  for await (const audioChunk of getMediaBuffers()) {
    if (!audioChunk) {
      throw new Error("Audio downloader. Empty audio");
    }

    audioDownloader.onDownloadedPartialAudio.dispatch(translationId, {
      videoId,
      fileId,
      audioData: audioChunk,
      version: 1,
      index,
      amount: mediaPartsLength,
    });

    index++;
  }
}

async function mainWorldMessageHandler({
  data,
}) {
  try {
    if (data?.messageDirection !== "request") {
      return;
    }

    console.log("Main world bridge", data);
    switch (data.messageType) {
      case "get-download-audio-data-in-main-world": {
        sendAudioDownloadRequestToIframe(
          data ,
        );
        break;
      }
    }
  } catch (error) {
    console.error("[VOT] Main world bridge", {
      error,
    });
  }
}

class AudioDownloader {
  onDownloadedAudio = new EventImpl();
  onDownloadedPartialAudio = new EventImpl();
  onDownloadAudioError = new EventImpl();

  async runAudioDownload(
    videoId,
    translationId,
    signal,
  ) {
    window.addEventListener("message", mainWorldMessageHandler);
    try {
      await handleCommonAudioDownloadRequest({
        audioDownloader: this,
        translationId,
        videoId,
        signal,
      });
      console.log("Audio downloader. Audio download finished", {
        videoId,
      });
    } catch (err) {
      console.error("Audio downloader. Failed to download audio", err);
      this.onDownloadAudioError.dispatch(videoId);
    }

    window.removeEventListener("message", mainWorldMessageHandler);
  }

  











  addEventListener(
    type,
    listener,
  ) {
    switch (type) {
      case "downloadedAudio":
        this.onDownloadedAudio.addListener(listener);
        break;
      case "downloadedPartialAudio":
        this.onDownloadedPartialAudio.addListener(listener);
        break;
      case "downloadAudioError":
        this.onDownloadAudioError.addListener(listener);
        break;
    }

    return this;
  }

  











  removeEventListener(
    type,
    listener,
  ) {
    switch (type) {
      case "downloadedAudio":
        this.onDownloadedAudio.removeListener(listener);
        break;
      case "downloadedPartialAudio":
        this.onDownloadedPartialAudio.removeListener(listener);
        break;
      case "downloadAudioError":
        this.onDownloadAudioError.removeListener(listener);
        break;
    }

    return this;
  }
}

;// ./src/index.js




























let countryCode; // Used later for proxy settings

/*─────────────────────────────────────────────────────────────*/
/*           Helper class: CacheManager                        */
/* Merges video translation and subtitles caching by a composite key  */
/*─────────────────────────────────────────────────────────────*/
class CacheManager {
  constructor() {
    this.cache = new Map();
  }
  /**
   * Returns the full cache entry for the given key.
   * @param {string} key The composite key.
   * @returns {Object|undefined}
   */
  get(key) {
    return this.cache.get(key);
  }
  /**
   * Sets the full cache entry for the given key.
   * @param {string} key The composite key.
   * @param {Object} value The cache entry.
   */
  set(key, value) {
    this.cache.set(key, value);
  }
  /**
   * Deletes the entire cache entry for the given key.
   * @param {string} key The composite key.
   */
  delete(key) {
    this.cache.delete(key);
  }
  /**
   * Gets the translation object for the given key.
   * @param {string} key The composite key.
   * @returns {Object|undefined}
   */
  getTranslation(key) {
    const entry = this.get(key);
    return entry ? entry.translation : undefined;
  }
  /**
   * Sets the translation object for the given key.
   * @param {string} key The composite key.
   * @param {Object} translation The translation data.
   */
  setTranslation(key, translation) {
    const entry = this.get(key) || {};
    entry.translation = translation;
    this.set(key, entry);
  }
  /**
   * Gets the subtitles array for the given key.
   * @param {string} key The composite key.
   * @returns {Array|undefined}
   */
  getSubtitles(key) {
    const entry = this.get(key);
    return entry ? entry.subtitles : undefined;
  }
  /**
   * Sets the subtitles array for the given key.
   * @param {string} key The composite key.
   * @param {Array} subtitles The subtitles data.
   */
  setSubtitles(key, subtitles) {
    const entry = this.get(key) || {};
    entry.subtitles = subtitles;
    this.set(key, entry);
  }
  /**
   * Deletes the subtitles data for the given key.
   * @param {string} key The composite key.
   */
  deleteSubtitles(key) {
    const entry = this.get(key);
    if (entry) {
      entry.subtitles = undefined;
      this.set(key, entry);
    }
  }
}

/*─────────────────────────────────────────────────────────────*/
/*       Helper class: VOTTranslationHandler                   */
/*  Handles video translation, audio URL validation, etc.      */
/*─────────────────────────────────────────────────────────────*/
class VOTTranslationHandler {
  /**
   * @param {VideoHandler} videoHandler Parent VideoHandler instance.
   */
  constructor(videoHandler) {
    this.videoHandler = videoHandler;
    this.audioDownloader = new AudioDownloader();
    this.audioDownloader
      .addEventListener("downloadedAudio", async (translationId, data) => {
        console.log("downloadedAudio", data);
        const { videoId, fileId, audioData } = data;
        const videoUrl = this.getCanonicalUrl(videoId);
        await this.videoHandler.votClient.requestVtransAudio(
          videoUrl,
          translationId,
          {
            audioFile: audioData,
            fileId,
          },
        );
      })
      .addEventListener(
        "downloadedPartialAudio",
        async (translationId, data) => {
          // TODO: sended last audio part throw 400
          // console.log("downloadedPartialAudio", data);
          // const { audioData, fileId, videoId, amount, version, index } = data;
          // const videoUrl = this.getCanonicalUrl(videoId);
          // await this.videoHandler.votClient.requestVtransAudio(
          //   videoUrl,
          //   translationId,
          //   {
          //     audioFile: audioData,
          //     fileId: String(index),
          //   },
          //   {
          //     audioPartsLength: amount,
          //     fileId,
          //     unknown0: version,
          //   },
          // );
        },
      )
      .addEventListener("downloadAudioError", async (videoId) => {
        console.log(`Failed to download audio ${videoId}`);
        const videoUrl = this.getCanonicalUrl(videoId);
        await this.videoHandler.votClient.requestVtransFailAudio(videoUrl);
      });
  }

  getCanonicalUrl(videoId) {
    // i guess hardcoded > videoData.url (in this case)
    return `https://youtu.be/${videoId}`;
  }

  /**
   * Translates video data via API.
   * @param {Object} videoData The video data object.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @param {Object|null} [translationHelp=null] Optional translation helper data.
   * @returns {Promise<Object|null>} Promise resolving to the translation result.
   */
  async translateVideoImpl(
    videoData,
    requestLang,
    responseLang,
    translationHelp = null,
    shouldSendFailedAudio = false,
  ) {
    clearTimeout(this.videoHandler.autoRetry);
    utils_debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      const res = await this.videoHandler.votClient.translateVideo({
        videoData,
        requestLang,
        responseLang,
        translationHelp,
        extraOpts: {
          useLivelyVoice: this.videoHandler.data?.useNewModel,
          videoTitle: this.videoHandler.videoData.title,
        },
        shouldSendFailedAudio,
      });
      utils_debug.log("Translate video result", res);
      if (res.translated && res.remainingTime < 1) {
        utils_debug.log("Video translation finished with this data: ", res);
        return res;
      }

      const message =
        res.message ?? localizationProvider.get("translationTakeFewMinutes");
      await this.videoHandler.updateTranslationErrorMsg(
        res.remainingTime > 0 ? secsToStrTime(res.remainingTime) : message,
      );

      if (
        res.status === VideoTranslationStatus.AUDIO_REQUESTED &&
        videoData.host === "youtube"
      ) {
        console.log("Start audio download");
        await this.audioDownloader.runAudioDownload(
          videoData.videoId,
          res.translationId,
          new AbortController().signal,
        );
        // for get instant result on download end
        console.log("Send translate video");
        return await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          true,
        );
      }
    } catch (err) {
      await this.videoHandler.updateTranslationErrorMsg(
        err.data?.message ?? err,
      );
      console.error("[VOT]", err);
      const cacheKey = `${videoData.videoId}_${requestLang}_${responseLang}_${this.videoHandler.data.useNewModel}`;
      this.videoHandler.cacheManager.setTranslation(cacheKey, {
        error: err,
      });
      return null;
    }
    return new Promise((resolve) => {
      this.videoHandler.autoRetry = setTimeout(async () => {
        resolve(
          await this.translateVideoImpl(
            videoData,
            requestLang,
            responseLang,
            translationHelp,
            true,
          ),
        );
      }, 20000);
    });
  }

  /**
   * Translates a video stream.
   * @param {Object} videoData The video data.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @returns {Promise<Object|null>} Promise resolving to the stream translation result.
   */
  async translateStreamImpl(videoData, requestLang, responseLang) {
    clearTimeout(this.videoHandler.autoRetry);
    utils_debug.log(
      videoData,
      `Translate stream (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      const res = await this.videoHandler.votClient.translateStream({
        videoData,
        requestLang,
        responseLang,
      });
      utils_debug.log("Translate stream result", res);
      if (!res.translated && res.interval === 10) {
        await this.videoHandler.updateTranslationErrorMsg(
          localizationProvider.get("translationTakeFewMinutes"),
        );
        return new Promise((resolve) => {
          this.videoHandler.autoRetry = setTimeout(async () => {
            resolve(
              await this.translateStreamImpl(
                videoData,
                requestLang,
                responseLang,
              ),
            );
          }, res.interval * 1000);
        });
      }
      if (res.message) {
        utils_debug.log(`Stream translation aborted! Message: ${res.message}`);
        throw new VOTLocalizedError("streamNoConnectionToServer");
      }
      if (!res.result) {
        utils_debug.log("Failed to find translation result! Data:", res);
        throw new VOTLocalizedError("audioNotReceived");
      }
      utils_debug.log("Stream translated successfully. Running...", res);
      this.videoHandler.streamPing = setInterval(async () => {
        utils_debug.log("Ping stream translation", res.pingId);
        this.videoHandler.votClient.pingStream({
          pingId: res.pingId,
        });
      }, res.interval * 1000);
      return res;
    } catch (err) {
      console.error("[VOT] Failed to translate stream", err);
      await this.videoHandler.updateTranslationErrorMsg(
        err.data?.message ?? err,
      );
      return null;
    }
  }

  /**
   * Handles the translation button click.
   * @returns {Promise<void>}
   */
  async handleTranslationBtnClick() {
    utils_debug.log(
      "[click translationBtn]",
      this.videoHandler.audioPlayer,
      this.videoHandler.audioPlayer.player,
    );
    if (this.videoHandler.audioPlayer.player.src) {
      utils_debug.log(
        "[click translationBtn] audio.src is not empty",
        this.videoHandler.audioPlayer.player.src,
      );
      this.videoHandler.stopTranslate();
      return;
    }
    if (this.videoHandler.hls?.url) {
      utils_debug.log(
        "[click translationBtn] hls is not empty",
        this.videoHandler.hls.url,
      );
      this.videoHandler.stopTranslate();
      return;
    }
    try {
      utils_debug.log("[click translationBtn] trying execute translation");
      if (!this.videoHandler.videoData?.videoId) {
        throw new VOTLocalizedError("VOTNoVideoIDFound");
      }
      // For VK clips and Douyin, get the current video ID.
      if (
        (this.videoHandler.site.host === "vk" &&
          this.videoHandler.site.additionalData === "clips") ||
        this.videoHandler.site.host === "douyin"
      ) {
        this.videoHandler.videoData = await this.videoHandler.getVideoData();
      }
      utils_debug.log("Run translateFunc", this.videoHandler.videoData.videoId);
      this.videoHandler.isTranslating = true;
      await this.videoHandler.translateFunc(
        this.videoHandler.videoData.videoId,
        this.videoHandler.videoData.isStream,
        this.videoHandler.videoData.detectedLanguage,
        this.videoHandler.videoData.responseLanguage,
        this.videoHandler.videoData.translationHelp,
      );
    } catch (err) {
      console.error("[VOT]", err);
      if (err?.name === "VOTLocalizedError") {
        this.videoHandler.transformBtn("error", err.localizedMessage);
      } else {
        this.videoHandler.transformBtn("error", err?.message);
      }
    }
  }
}

/*─────────────────────────────────────────────────────────────*/
/*         Helper class: VOTVideoManager                       */
/*  Handles video data retrieval, volume controls, subtitles, and related events  */
/*─────────────────────────────────────────────────────────────*/
class VOTVideoManager {
  /**
   * @param {VideoHandler} videoHandler Parent VideoHandler instance.
   */
  constructor(videoHandler) {
    this.videoHandler = videoHandler;
  }

  /**
   * Retrieves video data from the page.
   * @returns {Promise<Object>} Video data object.
   */
  async getVideoData() {
    const {
      duration,
      url,
      videoId,
      host,
      title,
      translationHelp = null,
      localizedTitle,
      description,
      detectedLanguage: possibleLanguage,
      subtitles,
      isStream = false,
    } = await getVideoData(this.videoHandler.site, {
      fetchFn: GM_fetch,
      video: this.videoHandler.video,
      language: localizationProvider.lang,
    });

    let detectedLanguage =
      possibleLanguage ?? this.videoHandler.translateFromLang;
    if (!possibleLanguage && title) {
      const text = cleanText(title, description);
      utils_debug.log(`Detecting language text: ${text}`);
      const language = await detect(text);
      if (availableLangs.includes(language)) {
        detectedLanguage = language;
      }
    }
    const videoData = {
      translationHelp,
      isStream,
      duration:
        duration ||
        this.videoHandler.video?.duration ||
        data_config.defaultDuration, // if 0, we get 400 error
      videoId,
      url,
      host,
      detectedLanguage,
      responseLanguage: this.videoHandler.translateToLang,
      subtitles,
      title,
      localizedTitle,
      downloadTitle: localizedTitle ?? title ?? videoId,
    };
    console.log("[VOT] Detected language:", detectedLanguage);
    // For certain hosts, force a default language.
    if (["rutube", "ok.ru", "mail_ru"].includes(this.videoHandler.site.host)) {
      videoData.detectedLanguage = "ru";
    } else if (this.videoHandler.site.host === "youku") {
      videoData.detectedLanguage = "zh";
    } else if (this.videoHandler.site.host === "vk") {
      const trackLang = document.getElementsByTagName("track")?.[0]?.srclang;
      videoData.detectedLanguage = trackLang || "auto";
    } else if (this.videoHandler.site.host === "weverse") {
      videoData.detectedLanguage = "ko";
    }
    return videoData;
  }

  /**
   * Validates video data (duration, language) before translation.
   * @throws {VOTLocalizedError} If the video is too long or in a language that should not be translated.
   * @returns {boolean} True if video is valid.
   */
  videoValidator() {
    utils_debug.log("VideoValidator videoData: ", this.videoHandler.videoData);
    if (
      this.videoHandler.data.enabledDontTranslateLanguages &&
      this.videoHandler.data.dontTranslateLanguages?.includes(
        this.videoHandler.videoData.detectedLanguage,
      )
    ) {
      throw new VOTLocalizedError("VOTDisableFromYourLang");
    }
    if (
      this.videoHandler.site.host === "twitch" &&
      this.videoHandler.videoData.isStream
    ) {
      // to translate streams on twitch, need to somehow go back 30(?) seconds to the player
      throw new VOTLocalizedError("VOTStreamNotAvailable");
    }

    if (
      !this.videoHandler.videoData.isStream &&
      this.videoHandler.videoData.duration > 14400
    ) {
      throw new VOTLocalizedError("VOTVideoIsTooLong");
    }
    return true;
  }

  /**
   * Gets current video volume (0.0 - 1.0).
   * @returns {number} Video volume.
   */
  getVideoVolume() {
    let videoVolume = this.videoHandler.video?.volume;
    if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      videoVolume = YoutubeHelper.getVolume() ?? videoVolume;
    }
    return videoVolume;
  }

  /**
   * Sets the video volume.
   * @param {number} volume A value between 0.0 and 1.0.
   * @returns {VideoHandler} The VideoHandler instance.
   */
  setVideoVolume(volume) {
    if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      const videoVolume = YoutubeHelper.setVolume(volume);
      if (videoVolume) return this.videoHandler;
    }
    this.videoHandler.video.volume = volume;
    return this.videoHandler;
  }

  /**
   * Checks if the video is muted.
   * @returns {boolean} True if muted.
   */
  isMuted() {
    return ["youtube", "googledrive"].includes(this.videoHandler.site.host)
      ? YoutubeHelper.isMuted()
      : this.videoHandler.video?.muted;
  }

  /**
   * Syncs the video volume slider with the actual video volume.
   */
  syncVideoVolumeSlider() {
    const videoVolume = this.isMuted() ? 0 : this.getVideoVolume() * 100;
    const newSlidersVolume = Math.round(videoVolume);
    this.videoHandler.uiManager.votOverlayView.videoVolumeSlider.value =
      newSlidersVolume;
    if (this.videoHandler.data.syncVolume) {
      this.videoHandler.tempOriginalVolume = Number(newSlidersVolume);
    }
  }

  /**
   * Sets the language select menu values.
   * @param {string} from Source language code.
   * @param {string} to Target language code.
   */
  setSelectMenuValues(from, to) {
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.selectTitle =
      localizationProvider.get(`langs.${from}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.selectTitle =
      localizationProvider.get(`langs.${to}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.setSelectedValue(
      from,
    );
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.setSelectedValue(
      to,
    );
    console.log(`[VOT] Set translation from ${from} to ${to}`);
    this.videoHandler.videoData.detectedLanguage = from;
    this.videoHandler.videoData.responseLanguage = to;
  }
}

/*─────────────────────────────────────────────────────────────*/
/*                        Main class: VideoHandler             */
/*  Composes the helper classes and retains full functionality.  */
/*─────────────────────────────────────────────────────────────*/
class VideoHandler {
  /** @type {string} */
  translateFromLang = "auto";
  /** @type {string} */
  translateToLang = calculatedResLang;
  /** @type {number|undefined} */
  timer;
  /** @type {undefined|Partial<StorageData>} */
  data;
  /** @type {undefined|object} */
  videoData;
  /** @type {boolean} */
  firstPlay = true;
  /** @type {AudioContext} */
  audioContext = initAudioContext();
  // For HLS streaming (if applicable)
  hls;
  /** @type {VOTClient|VOTWorkerClient} */
  votClient;
  /** @type {Chaimu} */
  audioPlayer;
  cacheManager; // cache for translation and subtitles
  downloadTranslationUrl = null;
  autoRetry; // auto retry timeout
  streamPing; // stream ping interval
  votOpts;
  volumeOnStart;
  tempOriginalVolume; // temp video volume for syncing
  tempVolume; // temp translation volume for syncing
  firstSyncVolume = true; // used for skip 1st syncing with observer
  longWaitingResCount = 0;
  subtitles = []; // current subtitle list

  /**
   * Constructs a new VideoHandler instance.
   * @param {HTMLVideoElement} video The video element to handle.
   * @param {HTMLElement} container The container element for the video.
   * @param {Object} site The site object associated with the video.
   */
  constructor(video, container, site) {
    utils_debug.log(
      "[VideoHandler] add video:",
      video,
      "container:",
      container,
      this,
    );
    this.video = video;
    this.container = container;
    this.site = site;
    this.abortController = new AbortController();
    this.extraEvents = [];
    // Create helper instances.
    this.uiManager = new UIManager({
      root: this.container,
      portalContainer: this.getPortalContainer(),
      tooltipLayoutRoot: this.getTooltipLayoutRoot(),
      data: this.data,
      videoHandler: this,
    });
    this.translationHandler = new VOTTranslationHandler(this);
    this.videoManager = new VOTVideoManager(this);
    this.cacheManager = new CacheManager();
  }

  // TODO: remove todo after refactor and maybe set as portalContainer getter
  getPortalContainer() {
    return this.site.host === "youtube" && this.site.additionalData !== "mobile"
      ? this.container.parentElement
      : this.container;
  }

  // TODO: remove todo after refactor and maybe set as tooltipLayoutRoot getter
  getTooltipLayoutRoot() {
    switch (this.site.host) {
      case "kickstarter": {
        return document.getElementById("react-project-header");
      }
      case "custom": {
        return undefined;
      }
      default: {
        return this.container;
      }
    }
  }

  /**
   * Returns the container element for event listeners.
   * @returns {HTMLElement} The event container.
   */
  getEventContainer() {
    if (!this.site.eventSelector) return this.container;
    if (this.site.host === "twitter")
      return this.container.closest(this.site.eventSelector);
    return document.querySelector(this.site.eventSelector);
  }

  /**
   * Auto-initiates translation if conditions are met.
   */
  async autoTranslate() {
    if (!(this.firstPlay && this.data.autoTranslate && this.videoData.videoId))
      return;
    this.firstPlay = false;
    try {
      this.videoManager.videoValidator();
      await this.translationHandler.handleTranslationBtnClick();
    } catch (err) {
      console.error("[VOT]", err);
      return;
    }
  }

  /**
   * Determines if audio should be preferred.
   * @returns {boolean} True if audio is preferred.
   */
  getPreferAudio() {
    if (!this.audioContext) return true;
    if (!this.data.newAudioPlayer) return true;
    if (this.videoData.isStream) return true; // Use old player for streams with HLS
    if (this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP) return false;
    return !this.site.needBypassCSP;
  }

  /**
   * Creates the audio player.
   * @returns {VideoHandler} The VideoHandler instance.
   */
  createPlayer() {
    const preferAudio = this.getPreferAudio();
    utils_debug.log("preferAudio:", preferAudio);
    this.audioPlayer = new Chaimu({
      video: this.video,
      debug: false,
      fetchFn: GM_fetch,
      fetchOpts: {
        timeout: 0,
      },
      preferAudio,
    });
    return this;
  }

  /**
   * Initializes the VideoHandler: loads settings, UI, video data, events, etc.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    // Retrieve settings from storage.
    this.data = await votStorage.getValues({
      autoTranslate: false,
      dontTranslateLanguages: [calculatedResLang],
      enabledDontTranslateLanguages: true,
      enabledAutoVolume: true,
      autoVolume: defaultAutoVolume,
      buttonPos: "default",
      showVideoSlider: true,
      syncVolume: false,
      downloadWithName: true,
      sendNotifyOnComplete: false,
      subtitlesMaxLength: 300,
      highlightWords: false,
      subtitlesFontSize: 20,
      subtitlesOpacity: 20,
      subtitlesDownloadFormat: "srt",
      responseLanguage: calculatedResLang,
      defaultVolume: 100,
      onlyBypassMediaCSP: Number(!!this.audioContext),
      newAudioPlayer: Number(!!this.audioContext),
      showPiPButton: false,
      translateAPIErrors: true,
      translationService: defaultTranslationService,
      detectService: defaultDetectService,
      translationHotkey: null,
      m3u8ProxyHost: m3u8ProxyHost,
      proxyWorkerHost: proxyWorkerHost,
      translateProxyEnabled: 0,
      translateProxyEnabledDefault: true,
      audioBooster: false,
      useNewModel: false,
      localeHash: "",
      localeUpdatedAt: false,
    });
    // TODO: TEMP
    this.uiManager.data = this.data;
    console.log("[VOT] data from db: ", this.data);

    // Enable translate proxy if extension isn't compatible with GM_xmlhttpRequest
    if (!this.data.translateProxyEnabled && isProxyOnlyExtension) {
      this.data.translateProxyEnabled = 1;
    }
    // Determine country for proxy purposes
    if (!countryCode) {
      try {
        const response = await GM_fetch("https://speed.cloudflare.com/meta", {
          timeout: 7000,
        });
        ({ country: countryCode } = await response.json());
      } catch (err) {
        console.error("[VOT] Error getting country:", err);
      }
    }

    if (
      proxyOnlyCountries.includes(countryCode) &&
      this.data.translateProxyEnabledDefault
    ) {
      this.data.translateProxyEnabled = 2;
    }

    utils_debug.log(
      "translateProxyEnabled",
      this.data.translateProxyEnabled,
      this.data.translateProxyEnabledDefault,
    );
    utils_debug.log("Extension compatibility passed...");

    this.initVOTClient();

    // Initialize UI elements and events.
    this.uiManager.initUI();
    this.uiManager.initUIEvents();

    // Initialize subtitles widget.
    this.subtitlesWidget = new SubtitlesWidget(
      this.video,
      this.getPortalContainer(),
      this.site,
      this.uiManager.votOverlayView.votOverlayPortal,
      this.getTooltipLayoutRoot(),
    );
    this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
    this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
    this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
    this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);

    // Get video data and create player.
    this.createPlayer();
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.data.responseLanguage ?? "ru",
    );

    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.initExtraEvents();

    await this.autoTranslate();

    this.initialized = true;
  }

  /**
   * Initializes the VOT client.
   * @returns {VideoHandler} This instance.
   */
  initVOTClient() {
    this.votOpts = {
      fetchFn: GM_fetch,
      hostVOT: votBackendUrl,
      host: this.data.translateProxyEnabled
        ? this.data.proxyWorkerHost
        : workerHost,
    };
    this.votClient = new (
      this.data.translateProxyEnabled ? VOTWorkerClient : VOTClient
    )(this.votOpts);
    return this;
  }

  /**
   * Sets the translation button state and text.
   * @param {string} status The new status.
   * @param {string} text The text to display.
   * @returns {VideoHandler} This instance.
   */
  transformBtn(status, text) {
    this.uiManager.transformBtn(status, text);
    return this;
  }

  /**
   * Initializes extra event listeners (resize, click outside, keydown, etc.).
   */
  initExtraEvents() {
    const { signal } = this.abortController;
    const addExtraEventListener = (element, event, handler) => {
      this.extraEvents.push({
        element,
        event,
        handler,
      });
      element.addEventListener(event, handler, {
        signal,
      });
    };
    const addExtraEventListeners = (element, events, handler) => {
      for (const event of events) {
        addExtraEventListener(element, event, handler);
      }
    };

    // Update menu container height on resize.
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const e of entries) {
        this.uiManager.votOverlayView.votMenu.container.style.setProperty(
          "--vot-container-height",
          `${e.contentRect.height}px`,
        );
      }

      const { position, direction } =
        this.uiManager.votOverlayView.calcButtonLayout(this.data?.buttonPos);
      this.uiManager.votOverlayView.updateButtonLayout(position, direction);
    });
    this.resizeObserver.observe(this.video);
    this.uiManager.votOverlayView.votMenu.container.style.setProperty(
      "--vot-container-height",
      `${this.video.getBoundingClientRect().height}px`,
    );

    // Sync volume slider with original YouTube video.
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver = new MutationObserver((mutations) => {
        if (!this.audioPlayer.player.src || !this.data.syncVolume) return;
        for (const mutation of mutations) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "aria-valuenow"
          ) {
            if (this.firstSyncVolume) {
              this.firstSyncVolume = false;
              return;
            }
            const videoVolume = this.isMuted()
              ? 0
              : this.getVideoVolume() * 100;
            const finalVolume = Math.round(videoVolume);
            this.data.defaultVolume = finalVolume;
            this.audioPlayer.player.volume = this.data.defaultVolume / 100;
            this.syncVolumeWrapper("video", finalVolume);
          }
        }
      });
      const ytpVolumePanel = document.querySelector(".ytp-volume-panel");
      if (ytpVolumePanel) {
        this.syncVolumeObserver.observe(ytpVolumePanel, {
          attributes: true,
          subtree: true,
        });
      }
    }

    // Global document click event: hide menu if click is outside.
    document.addEventListener(
      "click",
      (event) => {
        const e = event.target;
        const button = this.uiManager.votOverlayView.votButton.container;
        const menu = this.uiManager.votOverlayView.votMenu.container;
        const container = this.container;
        const settings = this.uiManager.votSettingsView.dialog.container;
        const tempDialog = document.querySelector(".vot-dialog-temp");
        const isButton = button.contains(e);
        const isMenu = menu.contains(e);
        const isVideo = container.contains(e);
        const isSettings = settings.contains(e);
        const isTempDialog = tempDialog?.contains(e) ?? false;
        utils_debug.log(
          `[document click] ${isButton} ${isMenu} ${isVideo} ${isSettings} ${isTempDialog}`,
        );
        if (!(!isButton && !isMenu && !isSettings && !isTempDialog)) return;
        if (!isVideo) this.uiManager.votOverlayView.updateButtonOpacity(0);
        this.uiManager.votOverlayView.votMenu.hidden = true;
      },
      {
        signal,
      },
    );

    // Global keydown: trigger translation hotkey if appropriate.
    // Set of key combinations pressed by the user
    const userPressedKeys = new Set();

    document.addEventListener(
      "keydown",
      async (event) => {
        if (event.repeat) {
          // prevent unnecessary calls
          return;
        }

        userPressedKeys.add(event.code);

        const activeElement = document.activeElement;
        const isInputElement =
          ["input", "textarea"].includes(activeElement.tagName.toLowerCase()) ||
          activeElement.isContentEditable;
        if (isInputElement) {
          return;
        }

        const combo = formatKeysCombo(userPressedKeys);

        utils_debug.log(`combo: ${combo}`);
        utils_debug.log(
          `this.data.translationHotkey: ${this.data.translationHotkey}`,
        );

        if (combo === this.data.translationHotkey) {
          await this.translationHandler.handleTranslationBtnClick();
        }
      },
      { signal },
    );

    document.addEventListener("blur", () => {
      // clear the pressed keys when page lost focus
      userPressedKeys.clear();
    });

    document.addEventListener(
      "keyup",
      (event) => {
        userPressedKeys.delete(event.code);
      },
      { signal },
    );

    const eventContainer = this.getEventContainer();
    if (eventContainer)
      addExtraEventListeners(
        eventContainer,
        ["pointermove", "pointerout"],
        this.resetTimer,
      );

    addExtraEventListener(
      this.uiManager.votOverlayView.votButton.container,
      "pointermove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListener(
      this.uiManager.votOverlayView.votMenu.container,
      "pointermove",
      this.changeOpacityOnEvent,
    );
    // fix #866
    if (this.site.host !== "xvideos")
      addExtraEventListener(document, "touchmove", this.resetTimer);

    // Prevent propagation on pointerdown events.
    addExtraEventListener(
      this.uiManager.votOverlayView.votButton.container,
      "pointerdown",
      (e) => {
        e.stopImmediatePropagation();
      },
    );
    // don't change mousedown, otherwise it may break on youtube
    addExtraEventListeners(
      this.uiManager.votOverlayView.votMenu.container,
      ["pointerdown", "mousedown"],
      (e) => {
        e.stopImmediatePropagation();
      },
    );

    // fix draggable menu in youtube (#394, #417)
    if (this.site.host === "youtube") this.container.draggable = false;
    if (this.site.host === "googledrive") this.container.style.height = "100%";

    addExtraEventListener(this.video, "canplay", async () => {
      if (this.site.host === "rutube" && this.video.src) return;
      await this.setCanPlay();
    });
    addExtraEventListener(this.video, "emptied", async () => {
      const videoId = await getVideoID(this.site, {
        fetchFn: GM_fetch,
        video: this.video,
      });
      if (
        this.video.src &&
        this.videoData &&
        videoId === this.videoData.videoId
      )
        return;
      utils_debug.log("lipsync mode is emptied");
      this.videoData = undefined;
      this.stopTranslation();
    });
    if (!["rutube", "ok"].includes(this.site.host)) {
      addExtraEventListener(this.video, "volumechange", () => {
        this.syncVideoVolumeSlider();
      });
    }
    if (this.site.host === "youtube" && !this.site.additionalData) {
      addExtraEventListener(document, "yt-page-data-updated", async () => {
        utils_debug.log("yt-page-data-updated");
        // fix #802
        if (!window.location.pathname.includes("/shorts/")) return;
        await this.setCanPlay();
      });
    }
  }

  /**
   * Called when the video can play.
   */
  async setCanPlay() {
    const videoId = await getVideoID(this.site, {
      fetchFn: GM_fetch,
      video: this.video,
    });
    if (this.video.src && this.videoData && videoId === this.videoData.videoId)
      return;
    await this.handleSrcChanged();
    await this.autoTranslate();
    utils_debug.log("lipsync mode is canplay");
  }

  /**
   * Resets the auto-hide timer for the UI.
   */
  resetTimer = () => {
    clearTimeout(this.timer);
    this.uiManager.votOverlayView.updateButtonOpacity(1);
    this.timer = setTimeout(() => {
      this.uiManager.votOverlayView.updateButtonOpacity(0);
    }, 1000);
  };

  /**
   * Changes the opacity when an event occurs.
   * @param {Event} event The event object.
   */
  changeOpacityOnEvent = (event) => {
    clearTimeout(this.timer);
    this.uiManager.votOverlayView.updateButtonOpacity(1);
    event.stopPropagation();
  };

  /**
   * Changes subtitles language based on user selection.
   * @param {string} subs The subtitles selection value.
   */
  async changeSubtitlesLang(subs) {
    utils_debug.log("[onchange] subtitles", subs);
    this.uiManager.votOverlayView.subtitlesSelect.setSelectedValue(subs);
    if (subs === "disabled") {
      this.subtitlesWidget.setContent(null);
      this.uiManager.votOverlayView.downloadSubtitlesButton.hidden = true;
      this.yandexSubtitles = null;
    } else {
      const subtitlesObj = this.subtitles.at(Number.parseInt(subs));
      if (
        this.data.translateProxyEnabled === 2 &&
        subtitlesObj.url.startsWith(
          "https://brosubs.s3-private.mds.yandex.net/vtrans/",
        )
      ) {
        const subsPath = subtitlesObj.url.replace(
          "https://brosubs.s3-private.mds.yandex.net/vtrans/",
          "",
        );
        subtitlesObj.url = `https://${this.data.proxyWorkerHost}/video-subtitles/subtitles-proxy/${subsPath}`;
        console.log(`[VOT] Subs proxied via ${subtitlesObj.url}`);
      }
      this.yandexSubtitles =
        await SubtitlesProcessor.fetchSubtitles(subtitlesObj);
      this.subtitlesWidget.setContent(
        this.yandexSubtitles,
        subtitlesObj.language,
      );
      this.uiManager.votOverlayView.downloadSubtitlesButton.hidden = false;
    }
  }

  /**
   * Updates the subtitles selection options.
   */
  async updateSubtitlesLangSelect() {
    if (!this.subtitles || this.subtitles.length === 0) {
      const updatedOptions = [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
          selected: true,
          disabled: false,
        },
      ];
      this.uiManager.votOverlayView.subtitlesSelect.updateItems(updatedOptions);
      await this.changeSubtitlesLang(updatedOptions[0].value);
      return;
    }
    const updatedOptions = [
      {
        label: localizationProvider.get("VOTSubtitlesDisabled"),
        value: "disabled",
        selected: true,
        disabled: false,
      },
      ...this.subtitles.map((s, idx) => ({
        label:
          (localizationProvider.get(`langs.${s.language}`) ??
            s.language.toUpperCase()) +
          (s.translatedFromLanguage
            ? ` ${localizationProvider.get("VOTTranslatedFrom")} ${
                localizationProvider.get(`langs.${s.translatedFromLanguage}`) ??
                s.translatedFromLanguage.toUpperCase()
              }`
            : "") +
          (s.source !== "yandex" ? `, ${window.location.hostname}` : "") +
          (s.isAutoGenerated
            ? ` (${localizationProvider.get("VOTAutogenerated")})`
            : ""),
        value: idx,
        selected: false,
        disabled: false,
      })),
    ];
    this.uiManager.votOverlayView.subtitlesSelect.updateItems(updatedOptions);
    await this.changeSubtitlesLang(updatedOptions[0].value);
  }

  /**
   * Loads subtitles for the current video.
   */
  async loadSubtitles() {
    if (!this.videoData?.videoId) {
      console.error(
        `[VOT] ${localizationProvider.getDefault("VOTNoVideoIDFound")}`,
      );
      this.subtitles = [];
      return;
    }
    const cacheKey = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useNewModel}`;
    try {
      let cachedSubs = this.cacheManager.getSubtitles(cacheKey);
      if (!cachedSubs) {
        cachedSubs = await SubtitlesProcessor.getSubtitles(
          this.votClient,
          this.videoData,
        );
        this.cacheManager.setSubtitles(cacheKey, cachedSubs);
      }
      this.subtitles = cachedSubs;
    } catch (error) {
      console.error("[VOT] Failed to load subtitles:", error);
      this.subtitles = [];
    }
    await this.updateSubtitlesLangSelect();
  }

  /**
   * Gets the video volume.
   * @returns {number} The video volume (0.0 - 1.0).
   */
  getVideoVolume() {
    return this.videoManager.getVideoVolume();
  }

  /**
   * Sets the video volume.
   * @param {number} volume A number between 0 and 1.
   * @returns {VideoHandler} This instance.
   */
  setVideoVolume(volume) {
    return this.videoManager.setVideoVolume(volume);
  }

  /**
   * Checks if the video is muted.
   * @returns {boolean} True if muted.
   */
  isMuted() {
    return this.videoManager.isMuted();
  }

  /**
   * Syncs the video volume slider.
   */
  syncVideoVolumeSlider() {
    this.videoManager.syncVideoVolumeSlider();
  }

  /**
   * Sets language select menu values.
   * @param {string} from Source language.
   * @param {string} to Target language.
   */
  setSelectMenuValues(from, to) {
    this.videoManager.setSelectMenuValues(from, to);
  }

  /**
   * Wraps over syncVolume for slider syncing.
   * @param {"translation"|"video"} fromType The initiator slider.
   * @param {number} newVolume The new volume value.
   */
  syncVolumeWrapper(fromType, newVolume) {
    const slider =
      fromType === "translation"
        ? this.uiManager.votOverlayView.videoVolumeSlider
        : this.uiManager.votOverlayView.translationVolumeSlider;
    const currentSliderValue = Number(slider.input.value);
    const finalValue = syncVolume(
      fromType === "translation" ? this.video : this.audioPlayer.player,
      newVolume,
      currentSliderValue,
      fromType === "translation" ? this.tempVolume : this.tempOriginalVolume,
    );
    slider.input.value = finalValue;
    slider.label.querySelector("strong").textContent = `${finalValue}%`;
    UI.updateSlider(slider.input);
    this.tempOriginalVolume =
      fromType === "translation" ? finalValue : newVolume;
    this.tempVolume = fromType === "translation" ? newVolume : finalValue;
  }

  /**
   * Retrieves video data.
   * @returns {Promise<Object>} The video data object.
   */
  async getVideoData() {
    return await this.videoManager.getVideoData();
  }

  /**
   * Validates the video.
   * @returns {boolean} True if valid.
   */
  videoValidator() {
    return this.videoManager.videoValidator();
  }

  /**
   * Stops translation and resets UI elements.
   */
  stopTranslate() {
    this.audioPlayer.player.removeVideoEvents();
    this.audioPlayer.player.clear();
    this.audioPlayer.player.src = undefined;
    utils_debug.log("audioPlayer after stopTranslate", this.audioPlayer);
    this.uiManager.votOverlayView.videoVolumeSlider.hidden = true;
    this.uiManager.votOverlayView.translationVolumeSlider.hidden = true;
    this.uiManager.votOverlayView.downloadTranslationButton.hidden = true;
    this.downloadTranslationUrl = null;
    this.longWaitingResCount = 0;
    this.transformBtn("none", localizationProvider.get("translateVideo"));
    utils_debug.log(`Volume on start: ${this.volumeOnStart}`);
    if (this.volumeOnStart) this.setVideoVolume(this.volumeOnStart);
    clearInterval(this.streamPing);
    clearTimeout(this.autoRetry);
    this.hls?.destroy();
    this.firstSyncVolume = true;
  }

  /**
   * Updates the translation error message on the UI.
   * @param {string|Error} errorMessage The error message.
   */
  async updateTranslationErrorMsg(errorMessage) {
    const translationTake = localizationProvider.get("translationTake");
    const lang = localizationProvider.lang;
    this.longWaitingResCount =
      errorMessage === localizationProvider.get("translationTakeAboutMinute")
        ? this.longWaitingResCount + 1
        : 0;
    utils_debug.log("longWaitingResCount", this.longWaitingResCount);
    if (this.longWaitingResCount > minLongWaitingCount) {
      // biome-ignore lint/style/noParameterAssign: waiting recode to ts
      errorMessage = new VOTLocalizedError("TranslationDelayed");
    }
    if (errorMessage?.name === "VOTLocalizedError") {
      this.transformBtn("error", errorMessage.localizedMessage);
    } else if (errorMessage instanceof Error) {
      this.transformBtn("error", errorMessage?.message);
    } else if (
      this.data.translateAPIErrors &&
      lang !== "ru" &&
      !errorMessage.includes(translationTake)
    ) {
      this.uiManager.votOverlayView.votButton.loading = true;
      const translatedMessage = await translate(errorMessage, "ru", lang);
      this.transformBtn("error", translatedMessage);
    } else {
      this.transformBtn("error", errorMessage);
    }
    if (
      [
        "Подготавливаем перевод",
        "Видео передано в обработку",
        "Ожидаем перевод видео",
        "Загружаем переведенное аудио",
      ].includes(errorMessage)
    ) {
      this.uiManager.votOverlayView.votButton.loading = false;
    }
  }

  /**
   * Called after translation is updated.
   * @param {string} audioUrl The URL of the translation audio.
   */
  afterUpdateTranslation(audioUrl) {
    const isSuccess =
      this.uiManager.votOverlayView.votButton.container.dataset.status ===
      "success";
    this.uiManager.votOverlayView.videoVolumeSlider.hidden =
      !this.data.showVideoSlider || !isSuccess;
    this.uiManager.votOverlayView.translationVolumeSlider.hidden = !isSuccess;
    if (this.data.enabledAutoVolume) {
      this.uiManager.votOverlayView.videoVolumeSlider.value =
        this.data.autoVolume;
    }

    if (!this.videoData.isStream) {
      this.uiManager.votOverlayView.downloadTranslationButton.hidden = false;
      this.downloadTranslationUrl = audioUrl;
    }
    utils_debug.log(
      "afterUpdateTranslation downloadTranslationUrl",
      this.downloadTranslationUrl,
    );
    if (
      this.data.sendNotifyOnComplete &&
      this.longWaitingResCount &&
      isSuccess
    ) {
      GM_notification({
        text: localizationProvider
          .get("VOTTranslationCompletedNotify")
          .replace("{0}", window.location.hostname),
        title: GM_info.script.name,
        timeout: 5000,
        silent: true,
        tag: "VOTTranslationCompleted", // TM 5.0
        onclick: () => {
          window.focus();
        },
      });
    }
  }

  /**
   * Validates the audio URL by sending a HEAD request.
   * @param {string} audioUrl The audio URL to validate.
   * @returns {Promise<string>} The valid audio URL.
   */
  async validateAudioUrl(audioUrl) {
    try {
      const response = await GM_fetch(audioUrl, {
        method: "HEAD",
      });
      utils_debug.log("Test audio response", response);
      if (response.ok) {
        utils_debug.log("Valid audioUrl", audioUrl);
        return audioUrl;
      }
      utils_debug.log("Yandex returned not valid audio, trying to fix...");
      this.videoData.detectedLanguage = "auto";
      const translateRes = await this.translationHandler.translateVideoImpl(
        this.videoData,
        this.videoData.detectedLanguage,
        this.videoData.responseLanguage,
        this.videoData.translationHelp,
      );
      this.setSelectMenuValues(
        this.videoData.detectedLanguage,
        this.videoData.responseLanguage,
      );
      // biome-ignore lint/style/noParameterAssign: waiting recode to ts
      audioUrl = translateRes.url;
      utils_debug.log("Fixed audio audioUrl", audioUrl);
    } catch (err) {
      utils_debug.log("Test audio error:", err);
    }
    return audioUrl;
  }

  /**
   * Proxifies the audio URL if needed.
   * @param {string} audioUrl The original audio URL.
   * @returns {string} The proxified audio URL.
   */
  proxifyAudio(audioUrl) {
    if (
      this.data.translateProxyEnabled === 2 &&
      audioUrl.startsWith("https://vtrans.s3-private.mds.yandex.net/tts/prod/")
    ) {
      const audioPath = audioUrl.replace(
        "https://vtrans.s3-private.mds.yandex.net/tts/prod/",
        "",
      );
      // biome-ignore lint/style/noParameterAssign: waiting recode to ts
      audioUrl = `https://${this.data.proxyWorkerHost}/video-translation/audio-proxy/${audioPath}`;
      console.log(`[VOT] Audio proxied via ${audioUrl}`);
    }
    return audioUrl;
  }

  /**
   * Updates the translation audio source.
   * @param {string} audioUrl The audio URL.
   */
  async updateTranslation(audioUrl) {
    if (audioUrl !== this.audioPlayer.player.currentSrc) {
      // biome-ignore lint/style/noParameterAssign: waiting recode to ts
      audioUrl = await this.validateAudioUrl(this.proxifyAudio(audioUrl));
    }
    if (this.audioPlayer.player.src !== audioUrl) {
      this.audioPlayer.player.src = audioUrl;
    }
    try {
      this.audioPlayer.init();
    } catch (err) {
      utils_debug.log("this.audioPlayer.init() error", err);
      this.transformBtn("error", err.message);
    }
    this.setupAudioSettings();
    if (this.site.host === "twitter") {
      document
        .querySelector('button[data-testid="app-bar-back"][role="button"]')
        .addEventListener("click", this.stopTranslation);
    }
    this.transformBtn("success", localizationProvider.get("disableTranslate"));
    this.afterUpdateTranslation(audioUrl);
  }

  /**
   * Translates the video/audio.
   * @param {string} VIDEO_ID The video ID.
   * @param {boolean} isStream Whether the video is a stream.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @param {any} translationHelp Optional translation helper data.
   */
  async translateFunc(
    VIDEO_ID,
    isStream,
    requestLang,
    responseLang,
    translationHelp,
  ) {
    console.log("[VOT] Video Data: ", this.videoData);
    utils_debug.log("Run videoValidator");
    this.videoValidator();
    this.uiManager.votOverlayView.votButton.loading = true;
    this.volumeOnStart = this.getVideoVolume();
    const cacheKey = `${VIDEO_ID}_${requestLang}_${responseLang}_${this.data.useNewModel}`;
    const cachedEntry = this.cacheManager.getTranslation(cacheKey);
    if (cachedEntry?.url) {
      await this.updateTranslation(cachedEntry.url);
      utils_debug.log("[translateFunc] Cached translation was received");
      return;
    }
    if (cachedEntry?.error) {
      utils_debug.log("Skip translation - previous attempt failed");
      await this.updateTranslationErrorMsg(cachedEntry.error.data?.message);
      return;
    }
    if (isStream) {
      const translateRes = await this.translationHandler.translateStreamImpl(
        this.videoData,
        requestLang,
        responseLang,
      );
      if (!translateRes) {
        utils_debug.log("Skip translation");
        return;
      }
      this.transformBtn(
        "success",
        localizationProvider.get("disableTranslate"),
      );
      try {
        this.hls = initHls();
        this.audioPlayer.init();
      } catch (err) {
        utils_debug.log("this.audioPlayer.init() error", err);
        this.transformBtn("error", err.message);
      }
      const streamURL = this.setHLSSource(translateRes.result.url);
      if (this.site.host === "youtube") {
        YoutubeHelper.videoSeek(this.video, 10);
      }
      this.setupAudioSettings();
      if (!this.video.src && !this.video.currentSrc && !this.video.srcObject) {
        return this.stopTranslation();
      }
      return this.afterUpdateTranslation(streamURL);
    }
    const translateRes = await this.translationHandler.translateVideoImpl(
      this.videoData,
      requestLang,
      responseLang,
      translationHelp,
    );
    utils_debug.log("[translateRes]", translateRes);
    if (!translateRes) {
      utils_debug.log("Skip translation");
      return;
    }
    await this.updateTranslation(translateRes.url);
    // Invalidate subtitles cache if there is no matching subtitle.
    const cachedSubs = this.cacheManager.getSubtitles(cacheKey);
    if (
      !cachedSubs?.some(
        (item) =>
          item.source === "yandex" &&
          item.translatedFromLanguage === this.videoData.detectedLanguage &&
          item.language === this.videoData.responseLanguage,
      )
    ) {
      this.cacheManager.deleteSubtitles(cacheKey);
      this.subtitles = [];
    }
    this.cacheManager.setTranslation(cacheKey, {
      videoId: VIDEO_ID,
      from: requestLang,
      to: responseLang,
      url: this.downloadTranslationUrl,
      useNewModel: this.data?.useNewModel,
    });
  }

  /**
   * Sets up HLS streaming if needed.
   * @param {string} streamURL The HLS stream URL.
   */
  setupHLS(streamURL) {
    // biome-ignore lint/complexity/useArrowFunction: waiting recode to ts
    this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      utils_debug.log("audio and hls.js are now bound together !");
    });
    // biome-ignore lint/complexity/useArrowFunction: waiting recode to ts
    this.hls.on(Hls.Events.MANIFEST_PARSED, function (data) {
      utils_debug.log(`manifest loaded, found ${data?.levels?.length} quality level`);
    });
    this.hls.loadSource(streamURL);
    this.hls.attachMedia(this.audioPlayer.player.audio);
    this.hls.on(Hls.Events.ERROR, function (data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log("fatal media error encountered, try to recover");
            this.hls.recoverMediaError();
            break;
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error("fatal network error encountered", data);
            break;
          default:
            this.hls.destroy();
            break;
        }
      }
    });
    utils_debug.log(this.hls);
  }

  /**
   * Sets the HLS source URL.
   * @param {string} url The original URL.
   * @returns {string} The final stream URL.
   */
  setHLSSource(url) {
    const streamURL = `https://${this.data.m3u8ProxyHost}/?all=yes&origin=${encodeURIComponent("https://strm.yandex.ru")}&referer=${encodeURIComponent("https://strm.yandex.ru")}&url=${encodeURIComponent(url)}`;
    if (this.hls) {
      this.setupHLS(streamURL);
    } else if (
      this.audioPlayer.player.audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      this.audioPlayer.player.src = streamURL; // For Safari
    } else {
      throw new VOTLocalizedError("audioFormatNotSupported");
    }
    return streamURL;
  }

  /**
   * Configures audio settings such as volume.
   */
  setupAudioSettings() {
    if (typeof this.data.defaultVolume === "number") {
      this.audioPlayer.player.volume = this.data.defaultVolume / 100;
    }
    if (this.data.enabledAutoVolume) {
      this.setVideoVolume((this.data.autoVolume / 100).toFixed(2));
    }
  }

  /**
   * Stops translation and synchronizes volume.
   */
  stopTranslation = () => {
    this.stopTranslate();
    this.syncVideoVolumeSlider();
  };

  /**
   * Handles video source change events.
   */
  async handleSrcChanged() {
    utils_debug.log("[VideoHandler] src changed", this);
    this.firstPlay = true;
    this.stopTranslation();
    const hide =
      !this.video.src && !this.video.currentSrc && !this.video.srcObject;
    this.uiManager.votOverlayView.votButton.container.hidden = hide;
    if (hide) this.uiManager.votOverlayView.votMenu.hidden = hide;
    if (!this.site.selector) this.container = this.video.parentElement;
    if (
      !this.container.contains(
        this.uiManager.votOverlayView.votButton.container,
      )
    ) {
      this.container.append(
        this.uiManager.votOverlayView.votButton.container,
        this.uiManager.votOverlayView.votMenu.container,
      );
    }
    this.videoData = await this.getVideoData();
    const cacheKey = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useNewModel}`;
    this.subtitles = this.cacheManager.getSubtitles(cacheKey);
    await this.updateSubtitlesLangSelect();
    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
    );
  }

  /**
   * Releases resources and removes event listeners.
   */
  async release() {
    utils_debug.log("[VideoHandler] release");
    this.initialized = false;
    this.releaseExtraEvents();
    this.subtitlesWidget.release();
    this.uiManager.release();
  }

  /**
   * Collects report information for bug reporting.
   * @returns {Object} Report info object.
   */
  collectReportInfo() {
    const os = `${browserInfo.os.name} ${browserInfo.os.version}`;
    const additionalInfo = `<details>
<summary>Autogenerated by VOT:</summary>
<ul>
  <li>OS: ${os}</li>
  <li>Browser: ${browserInfo.browser.name} ${browserInfo.browser.version}</li>
  <li>Loader: ${GM_info.scriptHandler} v${GM_info.version}</li>
  <li>Script version: ${GM_info.script.version}</li>
  <li>URL: <code>${window.location.href}</code></li>
  <li>Lang: <code>${this.videoData.detectedLanguage}</code> -> <code>${this.videoData.responseLanguage}</code> (New model: ${this.data.useNewModel})</li>
  <li>Player: ${this.data.newAudioPlayer ? "New" : "Old"} (CSP only: ${this.data.onlyBypassMediaCSP})</li>
  <li>Proxying mode: ${this.data.translateProxyEnabled}</li>
</ul>
</details>`;
    const template = `1-bug-report-${localizationProvider.lang === "ru" ? "ru" : "en"}.yml`;
    return {
      assignees: "ilyhalight",
      template,
      os,
      "script-version": GM_info.script.version,
      "additional-info": additionalInfo,
    };
  }

  /**
   * Releases extra event listeners.
   */
  releaseExtraEvents() {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver?.disconnect();
    }
  }
}

const videoObserver = new VideoObserver();
const videosWrappers = new WeakMap();

/**
 * Recursively finds the closest parent element matching a selector.
 * @param {HTMLElement} el The starting element.
 * @param {string} selector The CSS selector.
 * @returns {HTMLElement|null} The matching parent element.
 */
function climb(el, selector) {
  if (!el || !selector) return null;
  if (el instanceof Document) return el.querySelector(selector);
  const foundEl = el.closest(selector);
  if (foundEl) return foundEl;
  const root = el.getRootNode();
  return climb(root instanceof ShadowRoot ? root.host : root, selector);
}

/**
 * Finds the container element for a given video.
 * @param {Object} site The site object.
 * @param {HTMLVideoElement} video The video element.
 * @returns {HTMLElement|null} The container element.
 */
function findContainer(site, video) {
  utils_debug.log("findContainer", site, video);
  if (site.shadowRoot) {
    const container = climb(video, site.selector);
    utils_debug.log("findContainer with site.shadowRoot", container);
    return container ?? video.parentElement;
  }
  utils_debug.log("findContainer without shadowRoot");
  if (!site.selector) return video.parentElement;
  const elements = document.querySelectorAll(site.selector);
  return (
    Array.from(elements).find((e) => e.contains(video)) ?? video.parentElement
  );
}

/**
 * Initializes iframe communication for special cases.
 */
function initIframeInteractor() {
  const configs = {
    "https://dev.epicgames.com": {
      targetOrigin: "https://dev.epicgames.com",
      dataFilter: (data) =>
        typeof data === "string" && data.startsWith("getVideoId:"),
      extractVideoId: (url) => url.pathname.split("/").slice(-2, -1)[0],
      iframeSelector: (src) => `electra-player > iframe[src="${src}"]`,
      responseFormatter: (videoId, data) => `${data}:${videoId}`,
      processRequest: (data) => {
        const reqId = data.replace("getVideoId:", "");
        return atob(reqId);
      },
    },
  };

  const currentConfig = Object.entries(configs).find(
    ([origin]) =>
      window.location.origin === origin &&
      (origin !== "https://dev.epicgames.com" ||
        window.location.pathname.includes("/community/learning/")),
  )?.[1];
  if (!currentConfig) return;
  window.addEventListener("message", (event) => {
    try {
      if (event.origin !== currentConfig.targetOrigin) return;
      if (!currentConfig.dataFilter(event.data)) return;
      const url = new URL(window.location.href);
      const videoId = currentConfig.extractVideoId(url);
      if (!videoId) return;
      const iframeSrc = currentConfig.processRequest?.(event.data) || url.href;
      const selector =
        typeof currentConfig.iframeSelector === "function"
          ? currentConfig.iframeSelector(iframeSrc)
          : currentConfig.iframeSelector;
      const iframe = document.querySelector(selector);
      if (!iframe?.contentWindow) return;
      const response = currentConfig.responseFormatter(videoId, event.data);
      iframe.contentWindow.postMessage(response, currentConfig.targetOrigin);
    } catch (error) {
      console.error("Iframe communication error:", error);
    }
  });
}

/**
 * Main function to start the extension.
 */
async function src_main() {
  if (isIframe() && window.location.hash.includes(IFRAME_HASH)) {
    initIframeService();
    return;
  }

  utils_debug.log("Loading extension...");
  await localizationProvider.update();
  utils_debug.log(`Selected menu language: ${localizationProvider.lang}`);
  initIframeInteractor();
  videoObserver.onVideoAdded.addListener(async (video) => {
    if (videosWrappers.has(video)) return;

    let container;
    const site = getService().find((site) => {
      container = findContainer(site, video);
      return Boolean(container);
    });

    if (!site) return;
    if (["peertube", "directlink"].includes(site.host)) {
      // set the url of the current site for peertube and directlink
      site.url = window.location.origin;
    }

    try {
      const videoHandler = new VideoHandler(video, container, site);
      videoHandler.videoData = await videoHandler.getVideoData();
      await videoHandler.init();
      videosWrappers.set(video, videoHandler);
    } catch (err) {
      console.error("[VOT] Failed to initialize videoHandler", err);
    }
  });
  videoObserver.onVideoRemoved.addListener(async (video) => {
    if (videosWrappers.has(video)) {
      await videosWrappers.get(video).release();
      videosWrappers.delete(video);
    }
  });
  videoObserver.enable();
}

src_main().catch((e) => {
  console.error("[VOT]", e);
});

})();

/******/ })()
;