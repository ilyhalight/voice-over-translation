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
// @grant          GM_addStyle
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_xmlhttpRequest
// @grant          GM_info
// @require        https://cdn.jsdelivr.net/npm/protobufjs/dist/light/protobuf.min.js
// @require        https://cdn.jsdelivr.net/npm/hls.js/dist/hls.light.min.js
// @require        https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js
// @require        https://gist.githubusercontent.com/ilyhalight/6eb5bb4dffc7ca9e3c57d6933e2452f3/raw/7ab38af2228d0bed13912e503bc8a9ee4b11828d/gm-addstyle-polyfill.js
// @match          *://*.youtube.com/*
// @match          *://*.youtube-nocookie.com/*
// @match          *://*.youtubekids.com/*
// @match          *://*.twitch.tv/*
// @match          *://*.xvideos.com/*
// @match          *://*.xv-ru.com/*
// @match          *://*.pornhub.com/*
// @match          *://*.vk.com/*
// @match          *://*.vk.ru/*
// @match          *://*.vimeo.com/*
// @match          *://*.9gag.com/*
// @match          *://*.twitter.com/*
// @match          *://*.x.com/*
// @match          *://*.facebook.com/*
// @match          *://*.rutube.ru/*
// @match          *://*.bilibili.com/*
// @match          *://my.mail.ru/*
// @match          *://*.bitchute.com/*
// @match          *://*.coursera.org/learn/*
// @match          *://*.udemy.com/course/*
// @match          *://*.tiktok.com/*
// @match          *://rumble.com/*
// @match          *://*.eporner.com/*
// @match          *://*.dailymotion.com/*
// @match          *://*.ok.ru/*
// @match          *://trovo.live/*
// @match          *://disk.yandex.ru/*
// @match          *://youtube.googleapis.com/embed/*
// @match          *://*.banned.video/*
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
// @match          *://9animetv.to/*
// @match          *://odysee.com/*
// @match          *://learning.sap.com/*
// @match          *://*.watchporn.to/*
// @match          *://*.linkedin.com/*
// @match          *://*.ricktube.ru/*
// @match          *://*.incestflix.net/*
// @match          *://*.incestflix.to/*
// @match          *://*.porntn.com/*
// @match          *://*.dzen.ru/*
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
// @match          *://*.coursehunter.net/*
// @match          *://*.coursetrain.net/*
// @exclude        file://*/*.mp4*
// @exclude        file://*/*.webm*
// @exclude        *://accounts.youtube.com/*
// @connect        yandex.ru
// @connect        yandex.net
// @connect        timeweb.cloud
// @connect        raw.githubusercontent.com
// @connect        9animetv.to
// @connect        vimeo.com
// @connect        toil.cc
// @connect        deno.dev
// @connect        onrender.com
// @connect        workers.dev
// @connect        porntn.com
// @namespace      vot
// @version        1.7.2
// @icon           https://translate.yandex.ru/icons/favicon.ico
// @author         sodapng, mynovelhost, Toil, SashaXser, MrSoczekXD
// @homepageURL    https://github.com/ilyhalight/voice-over-translation
// @updateURL      https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
// @downloadURL    https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
// @supportURL     https://github.com/ilyhalight/voice-over-translation/issues
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/styles/main.scss":
/***/ (() => {

GM_addStyle(".vot-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-ontheme));background-color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:pointer;border:none;border-radius:4px;outline:none;padding:0 16px;font-size:14px;font-weight:500;line-height:36px;transition:box-shadow .2s;display:inline-block;position:relative;box-shadow:0 3px 1px -2px #0003,0 2px 2px #00000024,0 1px 5px #0000001f}.vot-button[hidden]{display:none!important}.vot-button::-moz-focus-inner{border:none}.vot-button:before,.vot-button:after{content:\"\";border-radius:inherit;opacity:0;position:absolute;top:0;bottom:0;left:0;right:0}.vot-button:before{background-color:rgb(var(--vot-helper-ontheme));transition:opacity .2s}.vot-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-button:hover{box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f}.vot-button:hover:before{opacity:.08}.vot-button:active{box-shadow:0 5px 5px -3px #0003,0 8px 10px 1px #00000024,0 3px 14px 2px #0000001f}.vot-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size}.vot-button[disabled=true]{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.12);color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);box-shadow:none;cursor:initial}.vot-button[disabled=true]:before,.vot-button[disabled=true]:after{opacity:0}.vot-outlined-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;border:1px solid;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.24);vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:pointer;background-color:#0000;border-radius:4px;outline:none;margin:0;padding:0 16px;font-size:14px;font-weight:500;line-height:34px;display:inline-block;position:relative}.vot-outlined-button[hidden]{display:none!important}.vot-outlined-button::-moz-focus-inner{border:none}.vot-outlined-button:before,.vot-outlined-button:after{content:\"\";opacity:0;border-radius:3px;position:absolute;top:0;bottom:0;left:0;right:0}.vot-outlined-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-outlined-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-outlined-button:hover:before{opacity:.04}.vot-outlined-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-outlined-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-outlined-button[disabled=true]:before,.vot-outlined-button[disabled=true]:after{opacity:0}.vot-text-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:pointer;background-color:#0000;border:none;border-radius:4px;outline:none;margin:0;padding:0 8px;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative}.vot-text-button[hidden]{display:none!important}.vot-text-button::-moz-focus-inner{border:none}.vot-text-button:before,.vot-text-button:after{content:\"\";border-radius:inherit;opacity:0;position:absolute;top:0;bottom:0;left:0;right:0}.vot-text-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-text-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-text-button:hover:before{opacity:.04}.vot-text-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-text-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-text-button[disabled=true]:before,.vot-text-button[disabled=true]:after{opacity:0}.vot-icon-button{--vot-helper-onsurface:rgba(var(--vot-onsurface-rgb,0,0,0),.87);box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;width:36px;height:36px;fill:var(--vot-helper-onsurface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:pointer;background-color:#0000;border:none;border-radius:50%;outline:none;margin:0;padding:0;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative}.vot-icon-button[hidden]{display:none!important}.vot-icon-button::-moz-focus-inner{border:none}.vot-icon-button:before,.vot-icon-button:after{content:\"\";border-radius:inherit;opacity:0;position:absolute;top:0;bottom:0;left:0;right:0}.vot-icon-button:before{background-color:var(--vot-helper-onsurface);transition:opacity .2s}.vot-icon-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity .3s,background-size .4s}.vot-icon-button:hover:before{opacity:.04}.vot-icon-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size,opacity}.vot-icon-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);fill:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-icon-button[disabled=true]:before,.vot-icon-button[disabled=true]:after{opacity:0}.vot-textfield{display:inline-block;--vot-helper-theme:rgb(var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243)))!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari3:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system)!important;text-align:start!important;padding-top:6px!important;font-size:16px!important;line-height:1.5!important;position:relative!important}.vot-textfield[hidden]{display:none!important}.vot-textfield>input,.vot-textfield>textarea{box-sizing:border-box!important;border-style:solid!important;border-width:1px!important;border-color:transparent var(--vot-helper-safari2)var(--vot-helper-safari2)!important;width:100%!important;height:inherit!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;-webkit-text-fill-color:currentColor!important;font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;caret-color:var(--vot-helper-theme)!important;background-color:#0000!important;border-radius:4px!important;margin:0!important;padding:15px 13px!important;transition:border .2s,box-shadow .2s!important;box-shadow:inset 1px 0 #0000,inset -1px 0 #0000,inset 0 -1px #0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):placeholder-shown,.vot-textfield>textarea:not(:focus):placeholder-shown{border-top-color:var(--vot-helper-safari2)!important}.vot-textfield>input+span,.vot-textfield>textarea+span{width:100%!important;max-height:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;cursor:text!important;pointer-events:none!important;font-size:75%!important;line-height:15px!important;transition:color .2s,font-size .2s,line-height .2s!important;display:flex!important;position:absolute!important;top:0!important;left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span,.vot-textfield>textarea:not(:focus):placeholder-shown+span{font-size:inherit!important;line-height:68px!important}.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{content:\"\"!important;box-sizing:border-box!important;border-top:solid 1px var(--vot-helper-safari2)!important;pointer-events:none!important;min-width:10px!important;height:8px!important;margin-top:6px!important;transition:border .2s,box-shadow .2s!important;display:block!important;box-shadow:inset 0 1px #0000!important}.vot-textfield>input+span:before,.vot-textfield>textarea+span:before{border-left:1px solid #0000!important;border-radius:4px 0!important;margin-right:4px!important}.vot-textfield>input+span:after,.vot-textfield>textarea+span:after{border-right:1px solid #0000!important;border-radius:0 4px!important;flex-grow:1!important;margin-left:4px!important}.vot-textfield>input.vot-show-placeholer+span:before,.vot-textfield>textarea.vot-show-placeholer+span:before{margin-right:0!important}.vot-textfield>input.vot-show-placeholer+span:after,.vot-textfield>textarea.vot-show-placeholer+span:after{margin-left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span:before,.vot-textfield>input:not(:focus):placeholder-shown+span:after,.vot-textfield>textarea:not(:focus):placeholder-shown+span:before,.vot-textfield>textarea:not(:focus):placeholder-shown+span:after{border-top-color:#0000!important}.vot-textfield:hover>input:not(:disabled),.vot-textfield:hover>textarea:not(:disabled){border-color:transparent var(--vot-helper-safari3)var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled)+span:before,.vot-textfield:hover>input:not(:disabled)+span:after,.vot-textfield:hover>textarea:not(:disabled)+span:before,.vot-textfield:hover>textarea:not(:disabled)+span:after{border-top-color:var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled):not(:focus):placeholder-shown,.vot-textfield:hover>textarea:not(:disabled):not(:focus):placeholder-shown{border-color:var(--vot-helper-safari3)!important}.vot-textfield>input:focus,.vot-textfield>textarea:focus{border-color:transparent var(--vot-helper-theme)var(--vot-helper-theme)!important;box-shadow:inset 1px 0 var(--vot-helper-theme),inset -1px 0 var(--vot-helper-theme),inset 0 -1px var(--vot-helper-theme)!important;outline:none!important}.vot-textfield>input:focus+span,.vot-textfield>textarea:focus+span{color:var(--vot-helper-theme)!important}.vot-textfield>input:focus+span:before,.vot-textfield>input:focus+span:after,.vot-textfield>textarea:focus+span:before,.vot-textfield>textarea:focus+span:after{border-top-color:var(--vot-helper-theme)!important;box-shadow:inset 0 1px var(--vot-helper-theme)!important}.vot-textfield>input:disabled,.vot-textfield>input:disabled+span,.vot-textfield>textarea:disabled,.vot-textfield>textarea:disabled+span{border-color:transparent var(--vot-helper-safari1)var(--vot-helper-safari1)!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;pointer-events:none!important}.vot-textfield>input:disabled+span:before,.vot-textfield>input:disabled+span:after,.vot-textfield>textarea:disabled+span:before,.vot-textfield>textarea:disabled+span:after,.vot-textfield>input:disabled:placeholder-shown,.vot-textfield>input:disabled:placeholder-shown+span,.vot-textfield>textarea:disabled:placeholder-shown,.vot-textfield>textarea:disabled:placeholder-shown+span{border-top-color:var(--vot-helper-safari1)!important}.vot-textfield>input:disabled:placeholder-shown+span:before,.vot-textfield>input:disabled:placeholder-shown+span:after,.vot-textfield>textarea:disabled:placeholder-shown+span:before,.vot-textfield>textarea:disabled:placeholder-shown+span:after{border-top-color:#0000!important}@media not all and (-webkit-min-device-pixel-ratio:.0000264583),not all and (min-resolution:.001dpcm){@supports ((-webkit-appearance:none)){.vot-textfield>input,.vot-textfield>input+span,.vot-textfield>textarea,.vot-textfield>textarea+span,.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{transition-duration:.1s!important}}}.vot-checkbox{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));z-index:0;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);text-align:start;font-size:16px;line-height:1.5;display:inline-block;position:relative}.vot-checkbox-sub{padding-left:16px}.vot-checkbox[hidden]{display:none!important}.vot-checkbox>input{-webkit-appearance:none;appearance:none;z-index:10000;box-sizing:border-box;border:2px solid;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6);cursor:pointer;background:0 0;border-radius:2px;outline:none;width:18px;height:18px;margin:3px 1px;padding:0;transition:border-color .2s,background-color .2s;display:block;position:absolute}.vot-checkbox>input+span{box-sizing:border-box;width:inherit;cursor:pointer;padding-left:30px;font-weight:400;display:inline-block;position:relative}.vot-checkbox>input+span:before{content:\"\";background-color:rgb(var(--vot-onsurface-rgb,0,0,0));opacity:0;pointer-events:none;border-radius:50%;width:40px;height:40px;transition:opacity .3s,transform .2s;display:block;position:absolute;top:-8px;left:-10px;transform:scale(1)}.vot-checkbox>input+span:after{content:\"\";z-index:10000;pointer-events:none;border:0 solid #0000;border-width:0 0 2px 2px;width:10px;height:5px;transition:border-color .2s;display:block;position:absolute;top:3px;left:1px;transform:translate(3px,4px)rotate(-45deg);box-sizing:content-box!important}.vot-checkbox>input:checked,.vot-checkbox>input:indeterminate{border-color:rgb(var(--vot-helper-theme));background-color:rgb(var(--vot-helper-theme))}.vot-checkbox>input:checked+span:before,.vot-checkbox>input:indeterminate+span:before{background-color:rgb(var(--vot-helper-theme))}.vot-checkbox>input:checked+span:after,.vot-checkbox>input:indeterminate+span:after{border-color:rgb(var(--vot-helper-ontheme,255,255,255))}.vot-checkbox>input:indeterminate+span:after{border-left-width:0;transform:translate(4px,3px)}.vot-checkbox:hover>input+span:before{opacity:.04}.vot-checkbox:active>input,.vot-checkbox:active:hover>input:not(:disabled){border-color:rgb(var(--vot-helper-theme))}.vot-checkbox:active>input:checked{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6);border-color:#0000}.vot-checkbox:active>input+span:before{opacity:1;transition:transform,opacity;transform:scale(0)}.vot-checkbox>input:disabled{border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial}.vot-checkbox>input:disabled:checked,.vot-checkbox>input:disabled:indeterminate{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);border-color:#0000}.vot-checkbox>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial}.vot-checkbox>input:disabled+span:before{opacity:0;transform:scale(0)}.vot-slider{display:inline-block;--vot-safari-helper1:rgba(var(--vot-primary-rgb,33,150,243),.04)!important;--vot-safari-helper2:rgba(var(--vot-primary-rgb,33,150,243),.12)!important;--vot-safari-helper3:rgba(var(--vot-primary-rgb,33,150,243),.16)!important;--vot-safari-helper4:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;width:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system)!important;text-align:start!important;font-size:16px!important;line-height:1.5!important}.vot-slider[hidden]{display:none!important}.vot-slider>input{-webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;background-color:#0000!important;border:none!important;width:100%!important;height:36px!important;margin:0 0 -36px!important;padding:0!important;display:block!important;position:relative!important;top:24px!important}.vot-slider>input:last-child{margin:0!important;position:static!important}.vot-slider>input:before{content:\"\"!important;width:calc(100%*var(--vot-progress,0))!important;background:rgb(var(--vot-primary-rgb,33,150,243))!important;height:2px!important;display:block!important;position:absolute!important;top:calc(50% - 1px)!important}.vot-slider>input:disabled{cursor:default!important;opacity:.38!important}.vot-slider>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-webkit-slider-runnable-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-lower{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-upper{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-webkit-slider-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-fill-upper{opacity:.38!important}.vot-slider>input:disabled::-moz-range-progress{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-slider>input:disabled:-webkit-slider-thumb{color:rgb(var(--vot-surface-rgb,255,255,255))!important}.vot-slider>input:active::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper4)!important}.vot-slider>input:active::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:active::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:focus{outline:none!important}.vot-slider>input::-webkit-slider-runnable-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-moz-range-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-ms-track{box-sizing:border-box!important;background-color:#0000!important;border:none!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important;padding:0 17px!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-moz-range-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-ms-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;margin:0!important}.vot-slider>input::-moz-range-thumb{-moz-appearance:none!important}.vot-slider>input::-ms-thumb{margin:0 17px!important}.vot-slider>input::-moz-range-progress{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-lower{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-upper{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-moz-focus-outer{border:none!important}.vot-slider>span{margin-bottom:36px!important;display:inline-block!important}.vot-slider:hover>input::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper1)!important}.vot-slider:hover>input::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-slider:hover>input:hover::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-select{font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);text-align:start;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;font-size:14px;font-weight:400;line-height:1.5;display:flex;--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0)!important;--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87)!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-select[hidden]{display:none!important}.vot-select-label{font-size:16px}.vot-select-outer{cursor:pointer;justify-content:space-between;align-items:center;width:120px;max-width:120px;padding:0 5px;display:flex;border-style:solid!important;border-width:1px!important;border-color:var(--vot-helper-safari1)!important;border-radius:4px!important;transition:border .2s!important}.vot-select-outer:hover{border-color:var(--vot-helper-safari2)!important}.vot-select-title{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.vot-select-arrow-icon{justify-content:center;align-items:center;width:20px;height:32px;display:flex}.vot-select-content-list{flex-direction:column;display:flex}.vot-select-content-list .vot-select-content-item{cursor:pointer;border-radius:8px;padding:5px 10px}.vot-select-content-list .vot-select-content-item:not([inert]):hover{background-color:#2a2c31}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]{color:rgb(var(--vot-primary-rgb,33,150,243));background-color:rgba(var(--vot-primary-rgb,33,150,243),.2)}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]:hover{background-color:rgba(var(--vot-primary-rgb,33,150,243),.1)!important}.vot-select-content-list .vot-select-content-item[data-vot-disabled=true]{cursor:default}.vot-select-content-list .vot-select-content-item[hidden]{display:none!important}.vot-header{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);text-align:start;font-weight:700;line-height:1.5}.vot-header[hidden]{display:none!important}.vot-header:not(:first-child){padding-top:8px}.vot-header-level-1{font-size:2em}.vot-header-level-2{font-size:1.5em}.vot-header-level-3{font-size:1.17em}.vot-header-level-4{font-size:1em}.vot-header-level-5{font-size:.83em}.vot-header-level-6{font-size:.67em}.vot-info{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);text-align:start;-webkit-user-select:text;user-select:text;font-size:16px;line-height:1.5;display:flex}.vot-info[hidden]{display:none!important}.vot-info>:not(:first-child){color:rgba(var(--vot-helper-onsurface-rgb),.5);flex:1;margin-left:8px}.vot-details{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);text-align:start;cursor:pointer;border-radius:.5em;justify-content:space-between;align-items:center;margin:0 -.5em;padding:.5em;font-size:16px;line-height:1.5;transition:background .5s;display:flex}.vot-details[hidden]{display:none!important}.vot-details-arrow-icon{width:20px;height:32px;fill:rgba(var(--vot-helper-onsurface-rgb),.87);justify-content:center;align-items:center;display:flex;transform:scale(1.25)rotate(-90deg)}.vot-details:hover{background:rgba(var(--vot-onsurface-rgb,0,0,0),.04)}.vot-lang-select{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;display:flex}.vot-lang-select[hidden]{display:none!important}.vot-lang-select-icon{justify-content:center;align-items:center;width:32px;height:32px;display:flex}.vot-segmented-button{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);-webkit-user-select:none;user-select:none;background:rgb(var(--vot-surface-rgb,255,255,255));max-width:100vw;height:32px;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:default;z-index:2147483647;border-radius:4px;align-items:center;font-size:16px;line-height:1.5;transition:opacity .5s;display:flex;position:absolute;top:5rem;left:50%;overflow:hidden;transform:translate(-50%)}.vot-segmented-button[hidden]{display:none!important}.vot-segmented-button *{box-sizing:border-box!important}.vot-segmented-button .vot-separator{background:rgba(var(--vot-helper-theme-rgb),.1);width:1px;height:50%}.vot-segmented-button .vot-separator[hidden]{display:none!important}.vot-segmented-button .vot-segment,.vot-segmented-button .vot-segment-only-icon{height:100%;color:inherit;background-color:#0000;border:none;justify-content:center;align-items:center;padding:0 8px;transition:background-color .1s ease-in-out;display:flex;position:relative;overflow:hidden}.vot-segmented-button .vot-segment[hidden],.vot-segmented-button [hidden].vot-segment-only-icon{display:none!important}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before,.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{content:\"\";border-radius:inherit;opacity:0;position:absolute;top:0;bottom:0;left:0;right:0}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before{background-color:rgb(var(--vot-helper-theme-rgb));transition:opacity .2s}.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-segmented-button .vot-segment:hover:before,.vot-segmented-button .vot-segment-only-icon:hover:before{opacity:.04}.vot-segmented-button .vot-segment:active:after,.vot-segmented-button .vot-segment-only-icon:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-segmented-button .vot-segment-only-icon{min-width:32px;padding:0}.vot-segmented-button .vot-segment-label{white-space:nowrap;color:inherit;margin-left:8px;font-weight:400}.vot-segmented-button[data-status=success] .vot-translate-button{color:rgb(var(--vot-primary-rgb,33,150,243));fill:rgb(var(--vot-primary-rgb,33,150,243))}.vot-segmented-button[data-status=error] .vot-translate-button{color:#f28b82;fill:#f28b82}.vot-segmented-button[data-loading=true] #vot-loading-icon{display:block!important}.vot-segmented-button[data-loading=true] #vot-translate-icon{display:none!important}.vot-segmented-button[data-direction=column]{flex-direction:column;height:fit-content}.vot-segmented-button[data-direction=column] .vot-segment-label{display:none}.vot-segmented-button[data-direction=column]>.vot-segment-only-icon,.vot-segmented-button[data-direction=column]>.vot-segment{padding:8px}.vot-segmented-button[data-direction=column] .vot-separator{width:50%;height:1px}.vot-segmented-button[data-position=left]{top:12.5vh;left:50px}.vot-segmented-button[data-position=right]{top:12.5vh;left:auto;right:0}.vot-segmented-button svg{width:24px}.vot-menu{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);-webkit-user-select:none;user-select:none;background-color:var(--vot-helper-surface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);cursor:default;z-index:2147483647;visibility:visible;opacity:1;transform-origin:top;border-radius:8px;min-width:300px;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;position:absolute;top:calc(5rem + 48px);left:50%;overflow:hidden;transform:translate(-50%)scale(1)}.vot-menu *{box-sizing:border-box!important}.vot-menu[hidden]{pointer-events:none;visibility:hidden;opacity:0;transform:translate(-50%)scale(0);display:block!important}.vot-menu-content-wrapper{min-height:100px;max-height:calc(var(--vot-container-height,75vh) - (5rem + 32px + 16px)*2);flex-direction:column;display:flex;overflow:auto}.vot-menu-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-menu-header-container:empty{padding:0 0 16px}.vot-menu-header-container>.vot-icon-button{margin-inline-end:4px;margin-top:4px}.vot-menu-title-container{font-size:inherit;font-weight:inherit;text-align:start;outline:0;flex:1;margin:0;display:flex}.vot-menu-title{padding-bottom:16px;padding-inline-start:16px;padding-inline-end:16px;flex:1;padding-top:16px;font-size:16px;font-weight:400;line-height:1}.vot-menu-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:8px;min-height:1.375rem;padding:0 16px;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important}.vot-menu-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-menu-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-menu-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-menu-footer-container{padding-bottom:16px;padding-inline-start:16px;padding-inline-end:16px;flex-shrink:0;justify-content:flex-end;padding-top:16px;display:flex}.vot-menu-footer-container:empty{padding:16px 0 0}.vot-menu[data-position=left]{top:12.5vh;left:240px}.vot-menu[data-position=right]{top:12.5vh;left:auto;right:-80px}.vot-dialog{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);max-width:initial;max-height:initial;width:min(var(--vot-dialog-width,512px),100%);top:50%;bottom:50%;background-color:var(--vot-helper-surface);height:fit-content;color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system);-webkit-user-select:none;user-select:none;visibility:visible;opacity:1;transform-origin:50%;border-radius:8px;margin:auto;padding:0;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;display:block;position:fixed;top:0;bottom:0;left:0;right:0;overflow-x:auto;overflow-y:hidden;transform:scale(1);box-shadow:0 0 16px #0000001f,0 16px 16px #0000003d}[hidden]>.vot-dialog{pointer-events:none;opacity:0;transition:opacity .1s,transform .2s;transform:scale(.5)}.vot-dialog-container{visibility:visible;z-index:2147483647;position:absolute}.vot-dialog-container[hidden]{pointer-events:none;visibility:hidden;display:block!important}.vot-dialog-container *{box-sizing:border-box!important}.vot-dialog-backdrop{opacity:1;background-color:#0009;transition:opacity .3s;position:fixed;top:0;bottom:0;left:0;right:0}[hidden]>.vot-dialog-backdrop{pointer-events:none;opacity:0}.vot-dialog-content-wrapper{flex-direction:column;max-height:75vh;display:flex;overflow:auto}.vot-dialog-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-dialog-header-container:empty{padding:0 0 20px}.vot-dialog-header-container>.vot-icon-button{margin-inline-end:4px;margin-top:4px}.vot-dialog-title-container{font-size:inherit;font-weight:inherit;outline:0;flex:1;margin:0;display:flex}.vot-dialog-title{padding-bottom:16px;padding-inline-start:20px;padding-inline-end:20px;flex:1;padding-top:20px;font-size:115.385%;font-weight:700;line-height:1}.vot-dialog-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:16px;min-height:1.375rem;padding:0 20px;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important}.vot-dialog-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-dialog-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-dialog-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-dialog-footer-container{padding-bottom:16px;padding-inline-start:16px;padding-inline-end:16px;flex-shrink:0;justify-content:flex-end;padding-top:16px;display:flex}.vot-dialog-footer-container:empty{padding:20px 0 0}.vot-subtitles-widget{z-index:2147483647;pointer-events:none;justify-content:center;align-items:center;width:50%;min-height:20%;max-height:100%;display:flex;position:absolute;top:75%;left:25%}.vot-subtitles{--vot-subtitles-background:rgba(var(--vot-surface-rgb,46,47,52),var(--vot-subtitles-opacity,.8));background:var(--vot-subtitles-background,#2e2f34cc);width:max-content;max-width:100%;max-height:100%;color:var(--vot-subtitles-color,#e3e3e3);pointer-events:all;box-sizing:border-box;-webkit-user-select:none;user-select:none;border-radius:.5em;padding:.5em;font-size:20px;line-height:normal;position:relative}.vot-subtitles span{-webkit-user-select:text;user-select:text;font-size:inherit!important;line-height:normal!important}.vot-subtitles .passed{color:var(--vot-subtitles-passed-color,#2196f3)}:root{--vot-font-family:\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system;--vot-primary-rgb:139,180,245;--vot-onprimary-rgb:32,33,36;--vot-surface-rgb:32,33,36;--vot-onsurface-rgb:227,227,227;--vot-subtitles-color:rgb(var(--vot-onsurface-rgb,227,227,227));--vot-subtitles-passed-color:rgb(var(--vot-primary-rgb,33,150,243))}vot-block{display:block;visibility:visible!important}")

/***/ }),

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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";

// EXTERNAL MODULE: ./node_modules/bowser/es5.js
var es5 = __webpack_require__("./node_modules/bowser/es5.js");
;// ./node_modules/@vot.js/shared/dist/data/config.js
/* harmony default export */ const config = ({
    host: "api.browser.yandex.ru",
    hostVOT: "vot-api.toil.cc/v1",
    mediaProxy: "media-proxy.toil.cc",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36",
    componentVersion: "24.10.3.810",
    hmac: "bt8xH3VOlb4mqf0nqAibnDOoiPlXsisf",
    defaultDuration: 343,
    minChunkSize: 5295308,
    loggerLevel: 1,
    version: "2.0.3",
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
    static prefix = `[vot.js v${config.version}]`;
    static canLog(level) {
        return config.loggerLevel <= level;
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

;// ./node_modules/@vot.js/shared/dist/protos/yandex.js
const _m0 = protobuf;
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.target !== "") {
            writer.uint32(10).string(message.target);
        }
        if (message.targetUrl !== "") {
            writer.uint32(18).string(message.targetUrl);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationHelpObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.target = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.targetUrl = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
        responseLanguage: "",
        unknown2: 0,
        unknown3: 0,
        bypassCache: false,
        useNewModel: false,
    };
}
const VideoTranslationRequest = {
    encode(message, writer = _m0.Writer.create()) {
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
            VideoTranslationHelpObject.encode(v, writer.uint32(90).fork()).ldelim();
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
        if (message.useNewModel !== false) {
            writer.uint32(144).bool(message.useNewModel);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 3:
                    if (tag !== 26) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 4:
                    if (tag !== 34) {
                        break;
                    }
                    message.deviceId = reader.string();
                    continue;
                case 5:
                    if (tag !== 40) {
                        break;
                    }
                    message.firstRequest = reader.bool();
                    continue;
                case 6:
                    if (tag !== 49) {
                        break;
                    }
                    message.duration = reader.double();
                    continue;
                case 7:
                    if (tag !== 56) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                case 8:
                    if (tag !== 66) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                case 9:
                    if (tag !== 72) {
                        break;
                    }
                    message.forceSourceLang = reader.bool();
                    continue;
                case 10:
                    if (tag !== 80) {
                        break;
                    }
                    message.unknown1 = reader.int32();
                    continue;
                case 11:
                    if (tag !== 90) {
                        break;
                    }
                    message.translationHelp.push(VideoTranslationHelpObject.decode(reader, reader.uint32()));
                    continue;
                case 14:
                    if (tag !== 114) {
                        break;
                    }
                    message.responseLanguage = reader.string();
                    continue;
                case 15:
                    if (tag !== 120) {
                        break;
                    }
                    message.unknown2 = reader.int32();
                    continue;
                case 16:
                    if (tag !== 128) {
                        break;
                    }
                    message.unknown3 = reader.int32();
                    continue;
                case 17:
                    if (tag !== 136) {
                        break;
                    }
                    message.bypassCache = reader.bool();
                    continue;
                case 18:
                    if (tag !== 144) {
                        break;
                    }
                    message.useNewModel = reader.bool();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
            responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
            unknown2: isSet(object.unknown2) ? globalThis.Number(object.unknown2) : 0,
            unknown3: isSet(object.unknown3) ? globalThis.Number(object.unknown3) : 0,
            bypassCache: isSet(object.bypassCache) ? globalThis.Boolean(object.bypassCache) : false,
            useNewModel: isSet(object.useNewModel) ? globalThis.Boolean(object.useNewModel) : false,
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
        if (message.useNewModel !== false) {
            obj.useNewModel = message.useNewModel;
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
        message.responseLanguage = object.responseLanguage ?? "";
        message.unknown2 = object.unknown2 ?? 0;
        message.unknown3 = object.unknown3 ?? 0;
        message.bypassCache = object.bypassCache ?? false;
        message.useNewModel = object.useNewModel ?? false;
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
    };
}
const VideoTranslationResponse = {
    encode(message, writer = _m0.Writer.create()) {
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
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 2:
                    if (tag !== 17) {
                        break;
                    }
                    message.duration = reader.double();
                    continue;
                case 4:
                    if (tag !== 32) {
                        break;
                    }
                    message.status = reader.int32();
                    continue;
                case 5:
                    if (tag !== 40) {
                        break;
                    }
                    message.remainingTime = reader.int32();
                    continue;
                case 6:
                    if (tag !== 48) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                case 7:
                    if (tag !== 58) {
                        break;
                    }
                    message.translationId = reader.string();
                    continue;
                case 8:
                    if (tag !== 66) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                case 9:
                    if (tag !== 74) {
                        break;
                    }
                    message.message = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
        return message;
    },
};
function createBaseAudioBufferObject() {
    return { audioFile: new Uint8Array(0), fileId: "" };
}
const AudioBufferObject = {
    encode(message, writer = _m0.Writer.create()) {
        if (message.audioFile.length !== 0) {
            writer.uint32(18).bytes(message.audioFile);
        }
        if (message.fileId !== "") {
            writer.uint32(10).string(message.fileId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAudioBufferObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.audioFile = reader.bytes();
                    continue;
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.fileId = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.audioPartsLength !== 0) {
            writer.uint32(16).int32(message.audioPartsLength);
        }
        if (message.audioBuffer !== undefined) {
            AudioBufferObject.encode(message.audioBuffer, writer.uint32(10).fork()).ldelim();
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
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseChunkAudioObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 2:
                    if (tag !== 16) {
                        break;
                    }
                    message.audioPartsLength = reader.int32();
                    continue;
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.audioBuffer = AudioBufferObject.decode(reader, reader.uint32());
                    continue;
                case 3:
                    if (tag !== 26) {
                        break;
                    }
                    message.fileId = reader.string();
                    continue;
                case 4:
                    if (tag !== 32) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.translationId !== "") {
            writer.uint32(10).string(message.translationId);
        }
        if (message.url !== "") {
            writer.uint32(18).string(message.url);
        }
        if (message.partialAudioInfo !== undefined) {
            ChunkAudioObject.encode(message.partialAudioInfo, writer.uint32(34).fork()).ldelim();
        }
        if (message.audioInfo !== undefined) {
            AudioBufferObject.encode(message.audioInfo, writer.uint32(50).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationAudioRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.translationId = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 4:
                    if (tag !== 34) {
                        break;
                    }
                    message.partialAudioInfo = ChunkAudioObject.decode(reader, reader.uint32());
                    continue;
                case 6:
                    if (tag !== 50) {
                        break;
                    }
                    message.audioInfo = AudioBufferObject.decode(reader, reader.uint32());
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.status !== 0) {
            writer.uint32(8).int32(message.status);
        }
        for (const v of message.remainingChunks) {
            writer.uint32(18).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseVideoTranslationAudioResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 8) {
                        break;
                    }
                    message.status = reader.int32();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.remainingChunks.push(reader.string());
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
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
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 3:
                    if (tag !== 24) {
                        break;
                    }
                    message.unknown0 = reader.int32();
                    continue;
                case 4:
                    if (tag !== 34) {
                        break;
                    }
                    message.translatedLanguage = reader.string();
                    continue;
                case 5:
                    if (tag !== 42) {
                        break;
                    }
                    message.translatedUrl = reader.string();
                    continue;
                case 6:
                    if (tag !== 48) {
                        break;
                    }
                    message.unknown1 = reader.int32();
                    continue;
                case 7:
                    if (tag !== 56) {
                        break;
                    }
                    message.unknown2 = reader.int32();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.language !== "") {
            writer.uint32(18).string(message.language);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.waiting !== false) {
            writer.uint32(8).bool(message.waiting);
        }
        for (const v of message.subtitles) {
            SubtitlesObject.encode(v, writer.uint32(18).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseSubtitlesResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 8) {
                        break;
                    }
                    message.waiting = reader.bool();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.subtitles.push(SubtitlesObject.decode(reader, reader.uint32()));
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.timestamp !== "") {
            writer.uint32(18).string(message.timestamp);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationObject();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.timestamp = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    return { url: "", language: "", responseLanguage: "" };
}
const StreamTranslationRequest = {
    encode(message, writer = _m0.Writer.create()) {
        if (message.url !== "") {
            writer.uint32(10).string(message.url);
        }
        if (message.language !== "") {
            writer.uint32(18).string(message.language);
        }
        if (message.responseLanguage !== "") {
            writer.uint32(26).string(message.responseLanguage);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.url = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.language = reader.string();
                    continue;
                case 3:
                    if (tag !== 26) {
                        break;
                    }
                    message.responseLanguage = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            url: isSet(object.url) ? globalThis.String(object.url) : "",
            language: isSet(object.language) ? globalThis.String(object.language) : "",
            responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
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
        return message;
    },
};
function createBaseStreamTranslationResponse() {
    return { interval: 0, translatedInfo: undefined, pingId: undefined };
}
const StreamTranslationResponse = {
    encode(message, writer = _m0.Writer.create()) {
        if (message.interval !== 0) {
            writer.uint32(8).int32(message.interval);
        }
        if (message.translatedInfo !== undefined) {
            StreamTranslationObject.encode(message.translatedInfo, writer.uint32(18).fork()).ldelim();
        }
        if (message.pingId !== undefined) {
            writer.uint32(24).int32(message.pingId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamTranslationResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 8) {
                        break;
                    }
                    message.interval = reader.int32();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.translatedInfo = StreamTranslationObject.decode(reader, reader.uint32());
                    continue;
                case 3:
                    if (tag !== 24) {
                        break;
                    }
                    message.pingId = reader.int32();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.pingId !== 0) {
            writer.uint32(8).int32(message.pingId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseStreamPingRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 8) {
                        break;
                    }
                    message.pingId = reader.int32();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.uuid !== "") {
            writer.uint32(10).string(message.uuid);
        }
        if (message.module !== "") {
            writer.uint32(18).string(message.module);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseYandexSessionRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.uuid = reader.string();
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.module = reader.string();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    encode(message, writer = _m0.Writer.create()) {
        if (message.secretKey !== "") {
            writer.uint32(10).string(message.secretKey);
        }
        if (message.expires !== 0) {
            writer.uint32(16).int32(message.expires);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseYandexSessionResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.secretKey = reader.string();
                    continue;
                case 2:
                    if (tag !== 16) {
                        break;
                    }
                    message.expires = reader.int32();
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
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
    const signature = await signHMAC("SHA-256", config.hmac, body);
    return new Uint8Array(signature).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}
async function getSecYaHeaders(secType, session, body, path) {
    const { secretKey, uuid } = session;
    const sign = await getSignature(body);
    const token = `${uuid}:${path}:${config.componentVersion}`;
    const tokenBody = utf8Encoder.encode(token);
    const tokenSign = await getSignature(tokenBody);
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
        "User-Agent": config.userAgent,
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
    const generalUrl = `https://${config.mediaProxy}/v1/proxy/video.${format}?format=base64&force=true`;
    if (!(url instanceof URL)) {
        return `${generalUrl}&url=${btoa(url)}`;
    }
    return `${generalUrl}&url=${btoa(encodeURIComponent(url.href))}&origin=${url.origin}&referer=${url.origin}`;
}

;// ./node_modules/@vot.js/core/dist/protobuf.js

const yandexProtobuf = {
    encodeTranslationRequest(url, duration, requestLang, responseLang, translationHelp, { forceSourceLang = false, bypassCache = false, useNewModel = true, } = {}) {
        return VideoTranslationRequest.encode({
            url,
            firstRequest: true,
            duration,
            unknown0: 1,
            language: requestLang,
            forceSourceLang,
            unknown1: 0,
            translationHelp: translationHelp ? translationHelp : [],
            responseLanguage: responseLang,
            unknown2: 1,
            unknown3: 1,
            bypassCache,
            useNewModel,
        }).finish();
    },
    decodeTranslationResponse(response) {
        return VideoTranslationResponse.decode(new Uint8Array(response));
    },
    encodeTranslationAudioRequest(url, translationId, audioBuffer, partialAudio) {
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
    },
    decodeTranslationAudioResponse(response) {
        return VideoTranslationAudioResponse.decode(new Uint8Array(response));
    },
    encodeSubtitlesRequest(url, requestLang) {
        return SubtitlesRequest.encode({
            url,
            language: requestLang,
        }).finish();
    },
    decodeSubtitlesResponse(response) {
        return SubtitlesResponse.decode(new Uint8Array(response));
    },
    encodeStreamPingRequest(pingId) {
        return StreamPingRequest.encode({
            pingId,
        }).finish();
    },
    encodeStreamRequest(url, requestLang, responseLang) {
        return StreamTranslationRequest.encode({
            url,
            language: requestLang,
            responseLanguage: responseLang,
        }).finish();
    },
    decodeStreamResponse(response) {
        return StreamTranslationResponse.decode(new Uint8Array(response));
    },
    encodeYandexSessionRequest(uuid, module) {
        return YandexSessionRequest.encode({
            uuid,
            module,
        }).finish();
    },
    decodeYandexSessionResponse(response) {
        return YandexSessionResponse.decode(new Uint8Array(response));
    },
};

;// ./node_modules/@vot.js/core/dist/types/yandex.js
var VideoTranslationStatus;
(function (VideoTranslationStatus) {
    VideoTranslationStatus[VideoTranslationStatus["FAILED"] = 0] = "FAILED";
    VideoTranslationStatus[VideoTranslationStatus["FINISHED"] = 1] = "FINISHED";
    VideoTranslationStatus[VideoTranslationStatus["WAITING"] = 2] = "WAITING";
    VideoTranslationStatus[VideoTranslationStatus["LONG_WAITING"] = 3] = "LONG_WAITING";
    VideoTranslationStatus[VideoTranslationStatus["PART_CONTENT"] = 5] = "PART_CONTENT";
    VideoTranslationStatus[VideoTranslationStatus["AUDIO_REQUESTED"] = 6] = "AUDIO_REQUESTED";
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
    VideoService["nineanimetv"] = "nineanimetv";
    VideoService["odysee"] = "odysee";
    VideoService["coursehunterLike"] = "coursehunterLike";
    VideoService["sap"] = "sap";
    VideoService["watchpornto"] = "watchpornto";
    VideoService["linkedin"] = "linkedin";
    VideoService["ricktube"] = "ricktube";
    VideoService["incestflix"] = "incestflix";
    VideoService["porntn"] = "porntn";
    VideoService["dzen"] = "dzen";
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
const en_namespaceObject = /*#__PURE__*/JSON.parse('{"__version__":5,"recommended":"recommended","translateVideo":"Translate video","disableTranslate":"Turn off","translationSettings":"Translation settings","subtitlesSettings":"Subtitles settings","about":"About extension","resetSettings":"Reset settings","videoBeingTranslated":"The video is being translated","videoLanguage":"Video language","translationLanguage":"Translation language","translationTake":"The translation will take","translationTakeMoreThanHour":"The translation will take more than an hour","translationTakeAboutMinute":"The translation will take about a minute","translationTakeFewMinutes":"The translation will take a few minutes","translationTakeApproximatelyMinutes":"The translation will take approximately {0} minutes","translationTakeApproximatelyMinute":"The translation will take approximately {0} minutes","unSupportedExtensionError":"Error! {0} is not supported by this version of the extension!\\n\\nPlease use the cloudflare version of the VOT extension.","requestTranslationFailed":"Failed to request video translation","audioNotReceived":"Audio link not received","grantPermissionToAutoPlay":"Grant permission to autoplay","audioFormatNotSupported":"The audio format is not supported","VOTAutoTranslate":"Translate on open","VOTDontTranslateYourLang":"Do not translate from my language","VOTVolume":"Video volume","VOTVolumeTranslation":"Translation Volume","VOTAutoSetVolume":"Reduce video volume to ","VOTShowVideoSlider":"Video volume slider","VOTSyncVolume":"Link translation and video volume","VOTAudioProxy":"Proxy received audio","VOTDisableFromYourLang":"You have disabled the translation of the video in your language","VOTLiveNotSupported":"Translation of live streams is not supported","VOTPremiere":"Wait for the premiere to end before translating","VOTVideoIsTooLong":"Video is too long","VOTNoVideoIDFound":"No video ID found","VOTSubtitles":"Subtitles","VOTSubtitlesDisabled":"Disabled","VOTSubtitlesMaxLength":"Subtitles max length","VOTHighlightWords":"Highlight words","VOTTranslatedFrom":"translated from","VOTAutogenerated":"autogenerated","VOTSettings":"VOT Settings","VOTMenuLanguage":"Menu language","VOTAuthors":"Authors","VOTVersion":"Version","VOTLoader":"Loader","VOTBrowser":"Browser","VOTShowPiPButton":"Show PiP button","langs":{"auto":"Auto","af":"Afrikaans","ak":"Akan","sq":"Albanian","am":"Amharic","ar":"Arabic","hy":"Armenian","as":"Assamese","ay":"Aymara","az":"Azerbaijani","bn":"Bangla","eu":"Basque","be":"Belarusian","bho":"Bhojpuri","bs":"Bosnian","bg":"Bulgarian","my":"Burmese","ca":"Catalan","ceb":"Cebuano","zh":"Chinese","zh-Hans":"Chinese (Simplified)","zh-Hant":"Chinese (Traditional)","co":"Corsican","hr":"Croatian","cs":"Czech","da":"Danish","dv":"Divehi","nl":"Dutch","en":"English","eo":"Esperanto","et":"Estonian","ee":"Ewe","fil":"Filipino","fi":"Finnish","fr":"French","gl":"Galician","lg":"Ganda","ka":"Georgian","de":"German","el":"Greek","gn":"Guarani","gu":"Gujarati","ht":"Haitian Creole","ha":"Hausa","haw":"Hawaiian","iw":"Hebrew","hi":"Hindi","hmn":"Hmong","hu":"Hungarian","is":"Icelandic","ig":"Igbo","id":"Indonesian","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kn":"Kannada","kk":"Kazakh","km":"Khmer","rw":"Kinyarwanda","ko":"Korean","kri":"Krio","ku":"Kurdish","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","ln":"Lingala","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mi":"Māori","mr":"Marathi","mn":"Mongolian","ne":"Nepali","nso":"Northern Sotho","no":"Norwegian","ny":"Nyanja","or":"Odia","om":"Oromo","ps":"Pashto","fa":"Persian","pl":"Polish","pt":"Portuguese","pa":"Punjabi","qu":"Quechua","ro":"Romanian","ru":"Russian","sm":"Samoan","sa":"Sanskrit","gd":"Scottish Gaelic","sr":"Serbian","sn":"Shona","sd":"Sindhi","si":"Sinhala","sk":"Slovak","sl":"Slovenian","so":"Somali","st":"Southern Sotho","es":"Spanish","su":"Sundanese","sw":"Swahili","sv":"Swedish","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","ti":"Tigrinya","ts":"Tsonga","tr":"Turkish","tk":"Turkmen","uk":"Ukrainian","ur":"Urdu","ug":"Uyghur","uz":"Uzbek","vi":"Vietnamese","cy":"Welsh","fy":"Western Frisian","xh":"Xhosa","yi":"Yiddish","yo":"Yoruba","zu":"Zulu"},"udemyModuleArgsNotFound":"Could not get udemy module data due to the fact that ModuleArgs was not found","VOTTranslationHelpNull":"Could not get the data required for the translate","streamNoConnectionToServer":"There is no connection to the server","searchField":"Search...","VOTTranslateAPIErrors":"Translate errors from the API","VOTTranslationService":"Translation Service","VOTDetectService":"Detect Service","VOTTranslatingError":"Translating the error","VOTProxyWorkerHost":"Enter the proxy worker address","VOTM3u8ProxyHost":"Enter the address of the m3u8 proxy worker","proxySettings":"Proxy Settings","translationTakeApproximatelyMinute2":"The translation will take approximately {0} minutes","VOTAudioBooster":"Extended translation volume increase","VOTSubtitlesDesign":"Subtitles design","VOTSubtitlesFontSize":"Font size of subtitles","VOTSubtitlesOpacity":"Transparency of the subtitle background","VOTPressNewHotkey":"Press the new hotkey...","VOTCreateTranslationHotkey":"Create Hotkey for Translation","VOTChangeHotkeyWithCurrent":"Change Hotkey (Current: {0})","VOTSubtitlesDownloadFormat":"The format for downloading subtitles","VOTDownloadWithName":"Download files with the video name","VOTUpdateLocaleFiles":"Update localization files","VOTLocaleHash":"Locale hash","VOTUpdatedAt":"Updated at","VOTNeedWebAudioAPI":"To enable this, you must have a Web Audio API","VOTMediaCSPEnabledOnSite":"Media CSP is enabled on this site","VOTOnlyBypassMediaCSP":"Use it only for bypassing Media CSP","VOTNewAudioPlayer":"Use the new audio player","VOTUseNewModel":"Use an experimental variation of Yandex voices for some videos"}');
;// ./src/utils/debug.ts
/* harmony default export */ const debug = ({
    log: (...text) => {
        if (false) {}
        return console.log("%c[VOT DEBUG]", "background: #F2452D; color: #fff; padding: 5px;", ...text);
    },
});

;// ./src/config/config.js
// CONFIGURATION
const workerHost = "api.browser.yandex.ru";
const m3u8ProxyHost = "media-proxy.toil.cc/v1/proxy/m3u8"; // used for streaming
const proxyWorkerHost = "vot-worker.toil.cc";
const votBackendUrl = "https://vot.toil.cc/v1";
const contentUrl =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation";
const repositoryUrl = "https://github.com/ilyhalight/voice-over-translation";

const defaultAutoVolume = 0.15; // 0.0 - 1.0 (0% - 100%) - default volume of the video with the translation
const maxAudioVolume = 900;
const defaultTranslationService = "yandex";
const defaultDetectService = "yandex";

const detectUrls = {
  yandex: "https://translate.toil.cc/detect",
  rustServer: "https://rust-server-531j.onrender.com/detect",
};

const translateUrls = {
  yandex: "https://translate.toil.cc/translate",
  deepl: "https://translate-deepl.toil.cc/translate",
};

const proxyOnlyExtensions = [
  "Violentmonkey",
  "FireMonkey",
  "Greasemonkey",
  "AdGuard",
  "OrangeMonkey",
];



;// ./src/utils/storage.js


const votStorage = new (class {
  constructor() {
    this.gmSupport = typeof GM_getValue === "function";
    debug.log(`GM Storage Status: ${this.gmSupport}`);
  }

  syncGet(name, def = undefined) {
    if (this.gmSupport) {
      return GM_getValue(name, def);
    }

    const toNumber = typeof def === "number";
    let val = window.localStorage.getItem(name);

    const result = val ?? def;
    return toNumber ? Number(result) : result;
  }

  async get(name, def = undefined) {
    if (this.gmSupport) {
      return await GM_getValue(name, def);
    }

    const toNumber = typeof def === "number";
    return Promise.resolve(this.syncGet(name, def, toNumber));
  }

  syncSet(name, value) {
    if (this.gmSupport) {
      return GM_setValue(name, value);
    }

    return window.localStorage.setItem(name, value);
  }

  async set(name, value) {
    if (this.gmSupport) {
      return await GM_setValue(name, value);
    }

    return Promise.resolve(this.syncSet(name, value));
  }

  syncDelete(name) {
    if (this.gmSupport) {
      return GM_deleteValue(name);
    }

    return window.localStorage.removeItem(name);
  }

  async delete(name) {
    if (this.gmSupport) {
      return await GM_deleteValue(name);
    }

    return Promise.resolve(this.syncDelete(name));
  }

  syncList() {
    if (this.gmSupport) {
      return GM_listValues();
    }

    return [
      "autoTranslate",
      "dontTranslateLanguage",
      "dontTranslateYourLang",
      "autoSetVolumeYandexStyle",
      "autoVolume",
      "buttonPos",
      "showVideoSlider",
      "syncVolume",
      "subtitlesMaxLength",
      "highlightWords",
      "responseLanguage",
      "defaultVolume",
      "audioProxy",
      "showPiPButton",
      "translateAPIErrors",
      "translationService",
      "detectService",
      "m3u8ProxyHost",
      "translateProxyEnabled",
      "hotkeyButton",
      "proxyWorkerHost",
      "audioBooster",
      "locale-version",
      "locale-lang",
      "locale-phrases",
    ];
  }

  async list() {
    if (this.gmSupport) {
      return await GM_listValues();
    }

    return Promise.resolve(this.syncList());
  }
})();

;// ./src/utils/utils.js



const userlang = navigator.language || navigator.userLanguage;
const MAX_SECS_FRACTION = 0.66;
const lang = userlang?.substr(0, 2)?.toLowerCase() ?? "en";

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
        debug: true, // turn it on manually if necessary
        lowLatencyMode: true,
        backBufferLength: 90,
      })
    : undefined;
}

const deletefilter = [
  /(?:https?|ftp):\/\/\S+/g,
  /https?:\/\/\S+|www\.\S+/gm,
  /\b\S+\.\S+/gm,
  /#[^\s#]+/g,
  /Auto-generated by YouTube/g,
  /Provided to YouTube by/g,
  /Released on/g,
  /0x[a-fA-F0-9]{40}/g,
  /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
  /4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}/g,
  /Paypal/g,
];

const combinedRegex = new RegExp(
  deletefilter.map((regex) => regex.source).join("|"),
);

function cleanText(title, description) {
  const cleanedDescription = description
    ? description
        .split("\n")
        .filter((line) => !combinedRegex.test(line))
        .join(" ")
    : "";

  const fullText = `${title} ${cleanedDescription}`.slice(0, 450);
  return fullText.replace(/[^\p{L}\s]+|\s+/gu, " ").trim();
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

    const response = await fetch(url, {
      signal: controller.signal,
      ...fetchOptions,
    });
    return response;
  } catch (err) {
    // Если fetch завершился ошибкой, используем GM_xmlhttpRequest
    // https://greasyfork.org/ru/scripts/421384-gm-fetch/code
    debug.log("GM_fetch preventing cors by GM_xmlhttpRequest", err.message);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: fetchOptions.method || "GET",
        url,
        responseType: "blob",
        ...fetchOptions,
        data: fetchOptions.body,
        timeout,
        onload: (resp) => {
          // chrome \n and ":", firefox \r\n and ": " (Only in GM_xmlhttpRequest)
          // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders#examples
          const headers = Object.fromEntries(
            resp.responseHeaders
              .trim()
              .split(/\r?\n/)
              .map((line) => line.split(/: (.+)/))
              .filter(([key]) => key && /^[\w-]+$/.test(key)),
          );

          const response = new Response(resp.response, {
            status: resp.status,
            headers: headers,
          });
          Object.defineProperty(response, "url", {
            value: resp.finalUrl ?? "",
          });

          resolve(response);
        },
        ontimeout: () => reject(new Error("Timeout")),
        onerror: (error) => reject(error),
        onabort: () => reject(new Error("AbortError")),
      });
    });
  }
}

function utils_getTimestamp() {
  return Math.floor(Date.now() / 1000);
}



;// ./src/localization/localizationProvider.js







const localeCacheTTL = 7200;
const localizationUrl = `${contentUrl}/${
   true ? "dev" : 0
}/src/localization`;

// TODO: add get from hashes.json or use DEFAULT_LOCALES
const availableLocales = ["auto","en","ru","af","am","ar","az","bg","bn","bs","ca","cs","cy","da","de","el","es","et","eu","fa","fi","fr","gl","hi","hr","hu","hy","id","it","ja","jv","kk","km","kn","ko","lo","mk","ml","mn","ms","mt","my","ne","nl","pa","pl","pt","ro","si","sk","sl","sq","sr","su","sv","sw","tr","uk","ur","uz","vi","zh","zu"];

const localizationProvider = new (class {
  lang = "en";
  locale = {};
  gmValues = [
    "locale-phrases",
    "locale-lang",
    "locale-hash",
    "locale-updated-at",
    "locale-lang-override",
  ];

  constructor() {
    const langOverride = votStorage.syncGet("locale-lang-override", "auto");
    this.lang =
      langOverride && langOverride !== "auto"
        ? langOverride
        : (navigator.language || navigator.userLanguage)
            ?.substr(0, 2)
            ?.toLowerCase() ?? "en";
    this.setLocaleFromJsonString(votStorage.syncGet("locale-phrases", ""));
  }

  reset() {
    for (let i = 0; i < this.gmValues.length; i++) {
      votStorage.syncDelete(this.gmValues[i]);
    }
  }

  async checkUpdates(force = false) {
    debug.log("Check locale updates...");
    try {
      const res = await GM_fetch(
        `${localizationUrl}/hashes.json${
          force ? `?timestamp=${utils_getTimestamp()}` : ""
        }`,
      );
      if (res.status !== 200) {
        throw res.status;
      }

      const hashes = await res.json();
      const localeHash = await votStorage.get("locale-hash");
      const actualHash = hashes[this.lang];

      return localeHash !== actualHash ? actualHash : false;
    } catch (err) {
      console.error(
        "[VOT] [localizationProvider] Failed to get locales hash, cause:",
        err,
      );

      return false;
    }
  }

  async update(force = false) {
    const localeUpdatedAt = await votStorage.get("locale-updated-at", 0);
    const localeLang = await votStorage.get("locale-lang");
    const timestamp = utils_getTimestamp();
    if (
      !force &&
      localeUpdatedAt + localeCacheTTL > timestamp &&
      localeLang === this.lang
    ) {
      return;
    }

    const hash = await this.checkUpdates(force);
    await votStorage.set("locale-updated-at", timestamp);
    if (!hash) {
      return;
    }

    debug.log("Updating locale...");
    try {
      const res = await GM_fetch(
        `${localizationUrl}/locales/${this.lang}.json${
          force ? `?timestamp=${timestamp}` : ""
        }`,
      );
      if (res.status !== 200) {
        throw res.status;
      }

      // We use it .text() in order for there to be a single logic for GM_Storage and localStorage
      const text = await res.text();
      await votStorage.set("locale-phrases", text);
      this.setLocaleFromJsonString(text);

      await votStorage.set("locale-hash", hash);
      await votStorage.set("locale-lang", this.lang);
    } catch (err) {
      console.error(
        "[VOT] [localizationProvider] Failed to get locale, cause:",
        err,
      );
      this.setLocaleFromJsonString(await votStorage.get("locale-phrases", ""));
    }
  }

  setLocaleFromJsonString(json) {
    try {
      this.locale = JSON.parse(json) ?? {};
    } catch (exception) {
      console.error("[VOT] [localizationProvider]", exception);
      this.locale = {};
    }
  }

  getFromLocale(locale, key) {
    const result = key.split(".").reduce((locale, key) => {
      if (typeof locale === "object" && locale) return locale[key];
      return undefined;
    }, locale);
    if (result === undefined) {
      console.warn(
        "[VOT] [localizationProvider] locale",
        locale,
        "doesn't contain key",
        key,
      );
    }
    return result;
  }

  getDefault(key) {
    return this.getFromLocale(en_namespaceObject, key) ?? key;
  }

  get(key) {
    return (
      this.getFromLocale(this.locale, key) ??
      this.getFromLocale(en_namespaceObject, key) ??
      key
    );
  }
})();

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
class client_VOTClient {
    host;
    hostVOT;
    schema;
    schemaVOT;
    fetch;
    fetchOpts;
    sessions = {};
    requestLang;
    responseLang;
    userAgent = config.userAgent;
    paths = {
        videoTranslation: "/video-translation/translate",
        videoTranslationFailAudio: "/video-translation/fail-audio-js",
        videoTranslationAudio: "/video-translation/audio",
        videoSubtitles: "/video-subtitles/get-subtitles",
        streamPing: "/stream-translation/ping-stream",
        streamTranslation: "/stream-translation/translate-stream",
        createSession: "/session/create",
    };
    isCustomLink(url) {
        return !!(/\.(m3u8|m4(a|v)|mpd)/.exec(url) ??
            /^https:\/\/cdn\.qstv\.on\.epicgames\.com/.exec(url));
    }
    headers = {
        "User-Agent": this.userAgent,
        Accept: "application/x-protobuf",
        "Accept-Language": "en",
        "Content-Type": "application/x-protobuf",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Mode": "no-cors",
    };
    headersVOT = {
        "User-Agent": `vot.js/${config.version}`,
        "Content-Type": "application/json",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
    };
    constructor({ host = config.host, hostVOT = config.hostVOT, fetchFn = fetchWithTimeout, fetchOpts = {}, requestLang = "en", responseLang = "ru", headers = {}, } = {}) {
        const schemaRe = /(http(s)?):\/\//;
        const schema = schemaRe.exec(host)?.[1];
        this.host = schema ? host.replace(`${schema}://`, "") : host;
        this.schema = schema ?? "https";
        const schemaVOT = schemaRe.exec(hostVOT)?.[1];
        this.hostVOT = schemaVOT ? hostVOT.replace(`${schemaVOT}://`, "") : hostVOT;
        this.schemaVOT = schemaVOT ?? "https";
        this.fetch = fetchFn;
        this.fetchOpts = fetchOpts;
        this.requestLang = requestLang;
        this.responseLang = responseLang;
        this.headers = { ...this.headers, ...headers };
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
    async translateVideoYAImpl({ videoData, requestLang = this.requestLang, responseLang = this.responseLang, translationHelp = null, headers = {}, extraOpts = {}, shouldSendFailedAudio = true, }) {
        const { url, duration = config.defaultDuration } = videoData;
        const session = await this.getSession("video-translation");
        const body = yandexProtobuf.encodeTranslationRequest(url, duration, requestLang, responseLang, translationHelp, extraOpts);
        const path = this.paths.videoTranslation;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTLocalizedError("requestTranslationFailed");
        }
        const translationData = yandexProtobuf.decodeTranslationResponse(res.data);
        debug.log("translateVideo", translationData);
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
            videoId: votData.videoId,
            fromLang: requestLang,
            toLang: responseLang,
            rawVideo: url,
        }, headers);
        if (!res.success) {
            throw new VOTLocalizedError("requestTranslationFailed");
        }
        const translationData = res.data;
        switch (translationData.status) {
            case "failed":
                throw new VOTJSError("Yandex couldn't translate video", translationData);
            case "success":
                if (!translationData.translatedUrl) {
                    throw new VOTLocalizedError("audioNotReceived");
                }
                return {
                    translationId: String(translationData.id),
                    translated: true,
                    url: translationData.translatedUrl,
                    status: 1,
                    remainingTime: -1,
                };
            case "waiting":
                return {
                    translationId: "",
                    translated: false,
                    remainingTime: translationData.remainingTime,
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
        const body = yandexProtobuf.encodeTranslationAudioRequest(url, translationId, audioBuffer, partialAudio);
        const path = this.paths.videoTranslationAudio;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        }, "PUT");
        if (!res.success) {
            throw new VOTJSError("Failed to request video translation audio", res);
        }
        return yandexProtobuf.decodeTranslationAudioResponse(res.data);
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
    async getSubtitles({ videoData, requestLang = this.requestLang, headers = {}, }) {
        const { url } = videoData;
        if (this.isCustomLink(url)) {
            return {
                waiting: false,
                subtitles: []
            }
        }
        const session = await this.getSession("video-translation");
        const body = yandexProtobuf.encodeSubtitlesRequest(url, requestLang);
        const path = this.paths.videoSubtitles;
        const vsubsHeaders = await getSecYaHeaders("Vsubs", session, body, path);
        const res = await this.request(path, body, {
            ...vsubsHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request video subtitles", res);
        }
        return yandexProtobuf.decodeSubtitlesResponse(res.data);
    }
    async pingStream({ pingId, headers = {} }) {
        const session = await this.getSession("video-translation");
        const body = yandexProtobuf.encodeStreamPingRequest(pingId);
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
        const body = yandexProtobuf.encodeStreamRequest(url, requestLang, responseLang);
        const path = this.paths.streamTranslation;
        const vtransHeaders = await getSecYaHeaders("Vtrans", session, body, path);
        const res = await this.request(path, body, {
            ...vtransHeaders,
            ...headers,
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request stream translation", res);
        }
        const translateResponse = yandexProtobuf.decodeStreamResponse(res.data);
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
    async createSession(module) {
        const uuid = getUUID();
        const body = yandexProtobuf.encodeYandexSessionRequest(uuid, module);
        const res = await this.request(this.paths.createSession, body, {
            "Vtrans-Signature": await getSignature(body),
        });
        if (!res.success) {
            throw new VOTJSError("Failed to request create session", res);
        }
        const sessionResponse = yandexProtobuf.decodeYandexSessionResponse(res.data);
        return {
            ...sessionResponse,
            uuid,
        };
    }
}
class client_VOTWorkerClient extends client_VOTClient {
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
    }
}
class VOTWorkerClient extends client_VOTWorkerClient {
    constructor(opts) {
        super(opts);
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
})(ExtVideoService || (ExtVideoService = {}));

;// ./node_modules/@vot.js/ext/dist/data/sites.js



/* harmony default export */ const sites = ([
    {
        additionalData: "mobile",
        host: VideoService.youtube,
        url: "https://youtu.be/",
        match: /^m.youtube.com$/,
        selector: "shorts-video #player",
    },
    {
        additionalData: "mobile",
        host: VideoService.youtube,
        url: "https://youtu.be/",
        match: /^m.youtube.com$/,
        selector: ".player-container",
    },
    {
        host: VideoService.youtube,
        url: "https://youtu.be/",
        match: /^(www.)?youtube(-nocookie|kids)?.com$/,
        selector: ".html5-video-container:not(#inline-player *)",
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
        match: /^m.vk.(com|ru)$/,
        selector: "vk-video-player",
        shadowRoot: true,
    },
    {
        additionalData: "clips",
        host: VideoService.vk,
        url: "https://vk.com/video?z=",
        match: /^(www.|m.)?vk.(com|ru)$/,
        selector: 'div[data-testid="clipcontainer-video"]',
    },
    {
        host: VideoService.vk,
        url: "https://vk.com/video?z=",
        match: /^(www.|m.)?vk.(com|ru)$/,
        selector: ".videoplayer_media",
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
        match: /^(www.)?(xvideos|xv-ru).com$/,
        selector: ".video-bg-pic",
        needBypassCSP: true,
    },
    {
        host: VideoService.pornhub,
        url: "https://rt.pornhub.com/view_video.php?viewkey=",
        match: /^[a-z]+.pornhub.com$/,
        selector: ".mainPlayerDiv > .video-element-wrapper-js > div",
        eventSelector: ".mgp_eventCatcher",
    },
    {
        additionalData: "embed",
        host: VideoService.pornhub,
        url: "https://rt.pornhub.com/view_video.php?viewkey=",
        match: (url) => url.host.includes("pornhub.com") && url.pathname.startsWith("/embed/"),
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
        match: /^disk.yandex.ru$/,
        selector: ".video-player__player > div:nth-child(1)",
        eventSelector: ".video-player__player",
        needBypassCSP: true,
        needExtraData: true,
    },
    {
        host: VideoService.okru,
        url: "https://ok.ru/video/",
        match: /^ok.ru$/,
        selector: ".html5-vpl_vid",
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
        host: VideoService.nineanimetv,
        url: "https://9animetv.to/watch/",
        match: /^rapid-cloud.co$/,
        selector: ".jw-media",
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
    constructor({ fetchFn = fetchWithTimeout, extraInfo = true, referer = document.referrer ?? window.location.origin + "/", origin = window.location.origin, service, } = {}) {
        this.fetch = fetchFn;
        this.extraInfo = extraInfo;
        this.referer = referer;
        this.origin = /^(http(s)?):\/\//.test(String(origin))
            ? origin
            : window.location.origin;
        this.service = service;
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
    async getSecureData(videoPath) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}${videoPath}`, {
                headers: {
                    "User-Agent": config.userAgent,
                    Origin: this.API_ORIGIN,
                    Referer: this.API_ORIGIN,
                },
            });
            const content = await res.text();
            const [videoType, videoId, hash] = videoPath.split("/").filter((a) => a);
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            const secureScript = Array.from(doc.getElementsByTagName("script")).filter((s) => s.innerHTML.includes(`videoId = "${videoId}"`));
            if (!secureScript.length) {
                throw new VideoHelperError("Failed to find secure script");
            }
            const secureContent = /'{[^']+}'/.exec(secureScript[0].textContent.trim())?.[0];
            if (!secureContent) {
                throw new VideoHelperError("Secure json wasn't found in secure script");
            }
            const secureJSON = JSON.parse(secureContent.replaceAll("'", ""));
            return {
                videoType: videoType,
                videoId,
                hash,
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
                    "User-Agent": config.userAgent,
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
            const charCode = e.charCodeAt(0) + 13;
            const pos = e <= "Z" ? 90 : 122;
            return String.fromCharCode(pos >= charCode ? charCode : charCode - 26);
        }));
        return "https:" + decryptedUrl;
    }
    async getVideoData(videoId) {
        const secureData = await this.getSecureData(videoId);
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
            url: this.decryptUrl(videoLink.src),
        };
    }
    async getVideoId(url) {
        return /\/(seria|video)\/([^/]+)\/([^/]+)\/([\d]+)p/.exec(url.pathname)?.[0];
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
        if (!this.service.additionalData ||
            this.service.additionalData !== "old") {
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
    async getVideoData(videoId) {
        const postInfo = await this.getPostInfo(videoId);
        if (!postInfo) {
            return undefined;
        }
        const videoBlock = postInfo.blocks.find((block) => block.type === "video");
        const playlistUrl = videoBlock?.video_url?.replace("qsep://", "https://");
        if (!playlistUrl) {
            return undefined;
        }
        const { title, description } = postInfo;
        const subtitles = videoBlock?.video_captions?.map((caption) => ({
            language: normalizeLang(caption.locale),
            format: "vtt",
            url: caption.signed_url,
        }));
        return {
            url: playlistUrl,
            title,
            description,
            subtitles,
        };
    }
    async getVideoId(url) {
        return /\/(\w{3,5})\/[^/]+$/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/nineanimetv.js



class NineAnimeTVHelper extends BaseHelper {
    API_ORIGIN = "https://9animetv.to/ajax/episode";
    RAPID_CLOUD_ORIGIN = "https://rapid-cloud.co/ajax/embed-6-v2";
    async getSourceId(episodeId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/servers?episodeId=${episodeId}`);
            const content = (await res.json());
            if (!content.html) {
                return false;
            }
            return /data-id="(\d+)"/.exec(content.html)?.[1];
        }
        catch (err) {
            Logger.error(`Failed to get 9animetv servers info by episodeId: ${episodeId}.`, err.message);
            return false;
        }
    }
    async getPlayerLink(sourceId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/sources?id=${sourceId}`);
            const content = (await res.json());
            if (!content.link.includes("rapid-cloud.co")) {
                return false;
            }
            return content.link;
        }
        catch (err) {
            Logger.error(`Failed to get player link by sourceId: ${sourceId}.`, err.message);
            return false;
        }
    }
    async getRapidCloudData(rapidId) {
        try {
            const res = await this.fetch(`${this.RAPID_CLOUD_ORIGIN}/getSources?id=${rapidId}`);
            const content = (await res.json());
            if (content.encrypted) {
                Logger.warn("Encrypted RapidCloud data found. Let us know about it", content);
                return false;
            }
            return content;
        }
        catch (err) {
            Logger.error(`Failed to get rapid cloud data by rapidId: ${rapidId}.`, err.message);
            return false;
        }
    }
    async getVideoData(videoId) {
        const episodeId = videoId.split("?ep=")[1];
        const sourceId = await this.getSourceId(episodeId);
        if (!sourceId) {
            return undefined;
        }
        const playerLink = await this.getPlayerLink(sourceId);
        if (!playerLink) {
            return undefined;
        }
        const rapidCloudId = /\/([^/?]+)\?/.exec(playerLink)?.[1];
        if (!rapidCloudId) {
            return undefined;
        }
        const rapidData = await this.getRapidCloudData(rapidCloudId);
        if (!rapidData) {
            return undefined;
        }
        const videoUrl = rapidData.sources.find((file) => file.type === "hls")?.file;
        if (!videoUrl) {
            return undefined;
        }
        const subtitles = rapidData.tracks.reduce((result, track) => {
            const fileName = /([\w+]+)(-\d)?\.vtt/.exec(track.file)?.[1];
            if (!fileName) {
                return result;
            }
            const lang = fileName.length === 3 ? fileName : track.label;
            const language = normalizeLang(lang);
            if (result.find((t) => t.language === language)) {
                return result;
            }
            result.push({
                language,
                format: "vtt",
                url: track.file,
            });
            return result;
        }, []);
        return {
            url: videoUrl,
            subtitles,
        };
    }
    async getVideoId(url) {
        return new Promise((resolve) => {
            const origin = "https://9animetv.to";
            window.addEventListener("message", (e) => {
                if (e.origin !== origin) {
                    return undefined;
                }
                if (e.data?.startsWith("getVideoId:")) {
                    const videoId = e.data.replace("getVideoId:", "");
                    return resolve(videoId);
                }
                return undefined;
            });
            window.top.postMessage("getVideoId", origin);
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
                throw new Error("Odysee url doesn't parsed");
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
        const inputEl = document.querySelector('input[name="course_id"]');
        return inputEl ? inputEl.value : undefined;
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
        return /(?:videos)\/([^/]+)/.exec(pathname)?.[0];
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

;// ./node_modules/@vot.js/ext/dist/helpers/linkedin.js



class LinkedinHelper extends BaseHelper {
    API_ORIGIN = "https://www.linkedin.com/learning";
    async getVideoData(videoId) {
        try {
            const videoEl = document.querySelector(".video-js");
            if (!videoEl) {
                throw new VideoHelperError(`Failed to find video element for videoID ${videoId}`);
            }
            const dataSource = (videoEl.getAttribute("data-sources") ?? "[]")
                .replaceAll("&quot;", '"')
                .replaceAll("&amp;", "&");
            const sources = JSON.parse(dataSource);
            const videoUrl = sources.find((source) => source.src.includes(".mp4"));
            if (!videoUrl) {
                throw new Error(`Failed to find video url for videoID ${videoId}`);
            }
            const url = new URL(videoUrl.src);
            const captionUrl = videoEl.getAttribute("data-captions-url");
            const subtitles = captionUrl
                ? [
                    {
                        language: "en",
                        format: "vtt",
                        url: captionUrl,
                    },
                ]
                : undefined;
            return {
                url: proxyMedia(url),
                subtitles,
            };
        }
        catch (err) {
            Logger.error("Failed to get linkedin video data", err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        return /\/learning\/(([^/]+)\/([^/]+))/.exec(url.pathname)?.[1];
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/vimeo.js



class VimeoHelper extends BaseHelper {
    API_KEY = "";
    DEFAULT_SITE_ORIGIN = "https://vimeo.com";
    SITE_ORIGIN = this.isPrivatePlayer()
        ? (this.service?.url?.slice(0, -1) ?? this.DEFAULT_SITE_ORIGIN)
        : this.DEFAULT_SITE_ORIGIN;
    isErrorData(data) {
        return Object.hasOwn(data, "error");
    }
    isPrivatePlayer() {
        return this.referer && !this.referer.includes("vimeo.com");
    }
    async getViewerData() {
        try {
            const res = await this.fetch(`https://vimeo.com/_next/viewer`);
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
            const baseUrl = new URL(cdnUrl);
            const pathLength = Array.from(data.base_url.matchAll(/\.\.\//g)).length + 1;
            const pathFragments = baseUrl.pathname.split("/");
            let extraPath = data.base_url.replaceAll("../", "");
            extraPath =
                extraPath && !extraPath.startsWith("/") ? `/${extraPath}` : extraPath;
            baseUrl.pathname =
                pathFragments.slice(0, pathFragments.length - pathLength).join("/") +
                    extraPath;
            if (!baseUrl.pathname.endsWith("/")) {
                baseUrl.pathname += "/";
            }
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
            baseUrl.pathname += `${videoData.base_url}${videoName}`;
            baseUrl.href = baseUrl.href.split("?")[0] + "?" + params.toString();
            return baseUrl.href;
        }
        catch (err) {
            Logger.error(`Failed to get private video source`, err.message);
            return false;
        }
    }
    async getPrivateVideoInfo(videoId) {
        try {
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
            const data = (await res.json());
            if (this.isErrorData(data)) {
                throw new Error(data.developer_message ?? data.error);
            }
            return data;
        }
        catch (err) {
            Logger.error(`Failed to get subtitles info by video ID: ${videoId}`, err.message);
            return false;
        }
    }
    async getVideoData(videoId) {
        const isPrivate = this.isPrivatePlayer();
        if (!this.extraInfo) {
            return this.returnBaseData(videoId);
        }
        if (isPrivate) {
            const videoInfo = await this.getPrivateVideoInfo(videoId);
            if (!videoInfo) {
                return undefined;
            }
            const { url, subs, video_url, title, duration } = videoInfo;
            const subtitles = subs.map((sub) => ({
                language: normalizeLang(sub.lang),
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
        if (videoId.startsWith("video/")) {
            videoId = videoId.replace("video/", "");
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
        const subtitles = subsData
            ? subsData.data.map((caption) => ({
                language: normalizeLang(caption.language),
                format: "vtt",
                url: caption.link,
                isAutoGenerated: caption.language.includes("autogen"),
            }))
            : [];
        const { link, duration, name: title, description } = videoInfo;
        return {
            url: link,
            title,
            description,
            subtitles,
            duration,
        };
    }
    async getVideoId(url) {
        const embedId = /[^/]+\/[^/]+$/.exec(url.pathname)?.[0];
        if (this.isPrivatePlayer()) {
            return embedId;
        }
        return embedId?.startsWith("video/")
            ? embedId.replace("video/", "")
            : (embedId ?? /[^/]+$/.exec(url.pathname)?.[0]);
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/yandexdisk.js

class YandexDiskHelper extends BaseHelper {
    API_ORIGIN = "https://disk.yandex.ru";
    CLIENT_PREFIX = "/client/disk";
    isErrorData(data) {
        return Object.hasOwn(data, "error");
    }
    async getVideoData(videoId) {
        if (!videoId.startsWith(this.CLIENT_PREFIX)) {
            return {
                url: this.service.url + videoId,
            };
        }
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
            const res = await this.fetch(this.API_ORIGIN + "/models/?_m=resource", {
                method: "POST",
                body: new URLSearchParams({
                    idClient,
                    sk,
                    "_model.0": "resource",
                    "id.0": dialogId.replaceAll(" ", "+"),
                })
                    .toString()
                    .replaceAll(/%2B/g, "+"),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
            });
            const data = (await res.json());
            if (!data.models) {
                throw new VideoHelperError("Failed to get resource info");
            }
            const model = data.models[0];
            const modelData = model.data;
            if (this.isErrorData(modelData)) {
                throw new VideoHelperError(modelData.error?.message);
            }
            const { meta: { short_url, video_info }, name, } = modelData;
            if (!video_info) {
                throw new VideoHelperError("There's no video open right now");
            }
            if (!short_url) {
                throw new VideoHelperError("Access to the video is limited");
            }
            const title = name.replace(/(\.[^.]+)$/, "");
            return {
                url: short_url,
                title,
                duration: video_info.duration,
            };
        }
        catch (err) {
            console.error(`Failed to get yandex disk video data by video ID: ${videoId}`, err.message);
            return undefined;
        }
    }
    async getVideoId(url) {
        const fileId = /\/i\/([^/]+)/.exec(url.pathname)?.[1];
        if (fileId) {
            return `i/${fileId}`;
        }
        return url.pathname.startsWith(this.CLIENT_PREFIX)
            ? url.pathname + url.search
            : undefined;
    }
}

;// ./node_modules/@vot.js/ext/dist/helpers/vk.js

class VKHelper extends BaseHelper {
    async getVideoId(url) {
        const pathID = /^\/(video|clip)-?\d{8,9}_\d{9}$/.exec(url.pathname);
        if (pathID) {
            return pathID[0].slice(1);
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
            const { rnd, video_url: source, video_title: title, } = flashvars;
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
        return /status\/([^/]+)/.exec(url.pathname)?.[1];
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
    async getVideoId(url) {
        if (url.hostname === "youtu.be") {
            url.search = `?v=${url.pathname.replace("/", "")}`;
            url.pathname = "/watch";
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
    async getLectureData(courseId, lectureId) {
        try {
            const res = await this.fetch(`${this.API_ORIGIN}/users/me/subscribed-courses/${courseId}/lectures/${lectureId}/?` +
                new URLSearchParams({
                    "fields[lecture]": "title,description,asset",
                    "fields[asset]": "length,media_sources,captions",
                }).toString());
            return (await res.json());
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
            return (await res.json());
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




class CourseraHelper extends BaseHelper {
    API_ORIGIN = "https://www.coursera.org/api";
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
    getPlayer() {
        return document.querySelector(".vjs-v8");
    }
    getPlayerData() {
        return this.getPlayer()?.player;
    }
    findVideoUrl(sources) {
        return sources?.find((src) => src.type === "video/mp4")?.src;
    }
    findSubtitleUrl(captions, detectedLanguage) {
        let subtitle = captions?.find((caption) => normalizeLang(caption.srclang) === detectedLanguage);
        if (!subtitle) {
            subtitle =
                captions?.find((caption) => normalizeLang(caption.srclang) === "en") ||
                    captions?.[0];
        }
        return subtitle?.src;
    }
    async getVideoData(videoId) {
        const playerData = this.getPlayerData();
        if (!playerData) {
            Logger.error("Failed to find player data");
            return undefined;
        }
        const { cache_: { duration }, options_: { courseId, tracks, sources }, } = playerData;
        const videoUrl = this.findVideoUrl(sources);
        if (!videoUrl) {
            Logger.error("Failed to find .mp4 video file in sources", sources);
            return undefined;
        }
        let courseLang = "en";
        const courseData = await this.getCourseData(courseId);
        if (courseData) {
            const { primaryLanguageCodes: [primaryLangauge], } = courseData;
            courseLang = primaryLangauge ? normalizeLang(primaryLangauge) : "en";
        }
        if (!availableLangs.includes(courseLang)) {
            courseLang = "en";
        }
        const subtitleUrl = this.findSubtitleUrl(tracks, courseLang);
        if (!subtitleUrl) {
            Logger.warn("Failed to find subtitle file in tracks", tracks);
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
                }
                : {
                    url: videoUrl,
                    translationHelp: null,
                }),
            detectedLanguage: courseLang,
            duration,
        };
    }
    async getVideoId(url) {
        return /learn\/([^/]+)\/lecture\/([^/]+)/.exec(url.pathname)?.[0];
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
    [VideoService.nineanimetv]: NineAnimeTVHelper,
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
    [ExtVideoService.udemy]: UdemyHelper,
    [ExtVideoService.coursera]: CourseraHelper,
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
async function getVideoID(service, video, opts = {}) {
    const url = new URL(window.location.href);
    const serviceHost = service.host;
    if (Object.keys(availableHelpers).includes(serviceHost)) {
        const helper = new VideoHelper(opts).getHelper(serviceHost);
        return await helper.getVideoId(url);
    }
    return serviceHost === VideoService.custom ? url.href : undefined;
}
async function getVideoData(service, video, opts = {}) {
    const videoId = await getVideoID(service, video, opts);
    if (!videoId) {
        throw new VideoDataError(`Entered unsupported link: "${service.host}"`);
    }
    const origin = window.location.origin;
    if ([VideoService.peertube, VideoService.coursehunterLike].includes(service.host)) {
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
    if (/(WEBVTT)(\r?\n\r?\n)/.exec(data)) {
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

;// ./node_modules/lit-html/lit-html.js
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const n=globalThis,c=n.trustedTypes,h=c?c.createPolicy("lit-html",{createHTML:t=>t}):void 0,f="$lit$",v=`lit$${Math.random().toFixed(9).slice(2)}$`,m="?"+v,_=`<${m}>`,w=document,lt=()=>w.createComment(""),st=t=>null===t||"object"!=typeof t&&"function"!=typeof t,g=Array.isArray,$=t=>g(t)||"function"==typeof t?.[Symbol.iterator],x="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,E=/-->/g,k=/>/g,O=RegExp(`>|${x}(?:([^\\s"'>=/]+)(${x}*=${x}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),S=/'/g,j=/"/g,M=/^(?:script|style|textarea|title)$/i,P=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),ke=P(1),Oe=P(2),Se=P(3),R=Symbol.for("lit-noChange"),D=Symbol.for("lit-nothing"),V=new WeakMap,I=w.createTreeWalker(w,129);function N(t,i){if(!g(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==h?h.createHTML(i):i}const U=(t,i)=>{const s=t.length-1,e=[];let h,o=2===i?"<svg>":3===i?"<math>":"",n=T;for(let i=0;i<s;i++){const s=t[i];let r,l,c=-1,a=0;for(;a<s.length&&(n.lastIndex=a,l=n.exec(s),null!==l);)a=n.lastIndex,n===T?"!--"===l[1]?n=E:void 0!==l[1]?n=k:void 0!==l[2]?(M.test(l[2])&&(h=RegExp("</"+l[2],"g")),n=O):void 0!==l[3]&&(n=O):n===O?">"===l[0]?(n=h??T,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,r=l[1],n=void 0===l[3]?O:'"'===l[3]?j:S):n===j||n===S?n=O:n===E||n===k?n=T:(n=O,h=void 0);const u=n===O&&t[i+1].startsWith("/>")?" ":"";o+=n===T?s+_:c>=0?(e.push(r),s.slice(0,c)+f+s.slice(c)+v+u):s+v+(-2===c?i:u)}return[N(t,o+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class B{constructor({strings:t,_$litType$:i},s){let e;this.parts=[];let h=0,o=0;const n=t.length-1,r=this.parts,[l,a]=U(t,i);if(this.el=B.createElement(l,s),I.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(e=I.nextNode())&&r.length<n;){if(1===e.nodeType){if(e.hasAttributes())for(const t of e.getAttributeNames())if(t.endsWith(f)){const i=a[o++],s=e.getAttribute(t).split(v),n=/([.?@])?(.*)/.exec(i);r.push({type:1,index:h,name:n[2],strings:s,ctor:"."===n[1]?Y:"?"===n[1]?Z:"@"===n[1]?q:G}),e.removeAttribute(t)}else t.startsWith(v)&&(r.push({type:6,index:h}),e.removeAttribute(t));if(M.test(e.tagName)){const t=e.textContent.split(v),i=t.length-1;if(i>0){e.textContent=c?c.emptyScript:"";for(let s=0;s<i;s++)e.append(t[s],lt()),I.nextNode(),r.push({type:2,index:++h});e.append(t[i],lt())}}}else if(8===e.nodeType)if(e.data===m)r.push({type:2,index:h});else{let t=-1;for(;-1!==(t=e.data.indexOf(v,t+1));)r.push({type:7,index:h}),t+=v.length-1}h++}}static createElement(t,i){const s=w.createElement("template");return s.innerHTML=t,s}}function z(t,i,s=t,e){if(i===R)return i;let h=void 0!==e?s.o?.[e]:s.l;const o=st(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s.o??=[])[e]=h:s.l=h),void 0!==h&&(i=z(t,h._$AS(t,i.values),h,e)),i}class F{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??w).importNode(i,!0);I.currentNode=e;let h=I.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new et(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new K(h,this,t)),this._$AV.push(i),r=s[++n]}o!==r?.index&&(h=I.nextNode(),o++)}return I.currentNode=w,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++}}class et{get _$AU(){return this._$AM?._$AU??this.v}constructor(t,i,s,e){this.type=2,this._$AH=D,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this.v=e?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=z(this,t,i),st(t)?t===D||null==t||""===t?(this._$AH!==D&&this._$AR(),this._$AH=D):t!==this._$AH&&t!==R&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):$(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==D&&st(this._$AH)?this._$AA.nextSibling.data=t:this.T(w.createTextNode(t)),this._$AH=t}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=B.createElement(N(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else{const t=new F(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t}}_$AC(t){let i=V.get(t.strings);return void 0===i&&V.set(t.strings,i=new B(t)),i}k(t){g(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new et(this.O(lt()),this.O(lt()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e)}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){void 0===this._$AM&&(this.v=t,this._$AP?.(t))}}class G{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=D,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=D}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=z(this,t,i,0),o=!st(t)||t!==this._$AH&&t!==R,o&&(this._$AH=t);else{const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=z(this,e[s+n],i,n),r===R&&(r=this._$AH[n]),o||=!st(r)||r!==this._$AH[n],r===D?t=D:t!==D&&(t+=(r??"")+h[n+1]),this._$AH[n]=r}o&&!e&&this.j(t)}j(t){t===D?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Y extends G{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===D?void 0:t}}class Z extends G{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==D)}}class q extends G{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5}_$AI(t,i=this){if((t=z(this,t,i,0)??D)===R)return;const s=this._$AH,e=t===D&&s!==D||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==D&&(s===D||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class K{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){z(this,t)}}const si={M:f,P:v,A:m,C:1,L:U,R:F,D:$,V:z,I:et,H:G,N:Z,U:q,B:Y,F:K},Re=n.litHtmlPolyfillSupport;Re?.(B,et),(n.litHtmlVersions??=[]).push("3.2.0");const Q=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new et(i.insertBefore(lt(),t),t,void 0,s??{})}return h._$AI(t),h};
//# sourceMappingURL=lit-html.js.map

;// ./node_modules/browser-id3-writer/dist/browser-id3-writer.mjs
function e(e){return String(e).split("").map((e=>e.charCodeAt(0)))}function t(t){return new Uint8Array(e(t))}function a(t){const a=new ArrayBuffer(2*t.length),r=new Uint8Array(a);return new Uint16Array(a).set(e(t)),r}function r(e){const t=255;return[e>>>24&t,e>>>16&t,e>>>8&t,e&t]}function browser_id3_writer_n(e){return 11+e}function s(e,t,a,r){return 11+t+1+1+(r?2+2*(a+1):a+1)+e}function i(e){let t=0;return e.forEach((e=>{t+=2+2*e[0].length+2+2+2*e[1].length+2})),11+t}function browser_id3_writer_c(e,t){const a=2*t;let r=0;return e.forEach((e=>{r+=2+2*e[0].length+2+4})),18+a+2+r}class o{_setIntegerFrame(e,t){const a=parseInt(t,10);this.frames.push({name:e,value:a,size:browser_id3_writer_n(a.toString().length)})}_setStringFrame(e,t){const a=t.toString();let r=13+2*a.length;"TDAT"===e&&(r=browser_id3_writer_n(a.length)),this.frames.push({name:e,value:a,size:r})}_setPictureFrame(e,t,a,r){const n=function(e){if(!e||!e.length)return null;if(255===e[0]&&216===e[1]&&255===e[2])return"image/jpeg";if(137===e[0]&&80===e[1]&&78===e[2]&&71===e[3])return"image/png";if(71===e[0]&&73===e[1]&&70===e[2])return"image/gif";if(87===e[8]&&69===e[9]&&66===e[10]&&80===e[11])return"image/webp";const t=73===e[0]&&73===e[1]&&42===e[2]&&0===e[3],a=77===e[0]&&77===e[1]&&0===e[2]&&42===e[3];return t||a?"image/tiff":66===e[0]&&77===e[1]?"image/bmp":0===e[0]&&0===e[1]&&1===e[2]&&0===e[3]?"image/x-icon":null}(new Uint8Array(t)),i=a.toString();if(!n)throw new Error("Unknown picture MIME type");a||(r=!1),this.frames.push({name:"APIC",value:t,pictureType:e,mimeType:n,useUnicodeEncoding:r,description:i,size:s(t.byteLength,n.length,i.length,r)})}_setLyricsFrame(e,t,a){const r=e.split("").map((e=>e.charCodeAt(0))),n=t.toString(),s=a.toString();var i,c;this.frames.push({name:"USLT",value:s,language:r,description:n,size:(i=n.length,c=s.length,16+2*i+2+2+2*c)})}_setCommentFrame(e,t,a){const r=e.split("").map((e=>e.charCodeAt(0))),n=t.toString(),s=a.toString();var i,c;this.frames.push({name:"COMM",value:s,language:r,description:n,size:(i=n.length,c=s.length,16+2*i+2+2+2*c)})}_setPrivateFrame(e,t){const a=e.toString();var r,n;this.frames.push({name:"PRIV",value:t,id:a,size:(r=a.length,n=t.byteLength,10+r+1+n)})}_setUserStringFrame(e,t){const a=e.toString(),r=t.toString();var n,s;this.frames.push({name:"TXXX",description:a,value:r,size:(n=a.length,s=r.length,13+2*n+2+2+2*s)})}_setUrlLinkFrame(e,t){const a=t.toString();var r;this.frames.push({name:e,value:a,size:(r=a.length,10+r)})}_setPairedTextFrame(e,t){this.frames.push({name:e,value:t,size:i(t)})}_setSynchronisedLyricsFrame(e,t,a,r,n){const s=n.toString(),i=r.split("").map((e=>e.charCodeAt(0)));this.frames.push({name:"SYLT",value:t,language:i,description:s,type:e,timestampFormat:a,size:browser_id3_writer_c(t,s.length)})}constructor(e){if(!e||"object"!=typeof e||!("byteLength"in e))throw new Error("First argument should be an instance of ArrayBuffer or Buffer");this.arrayBuffer=e,this.padding=4096,this.frames=[],this.url=""}setFrame(e,t){switch(e){case"TPE1":case"TCOM":case"TCON":{if(!Array.isArray(t))throw new Error(`${e} frame value should be an array of strings`);const a="TCON"===e?";":"/",r=t.join(a);this._setStringFrame(e,r);break}case"TLAN":case"TIT1":case"TIT2":case"TIT3":case"TALB":case"TPE2":case"TPE3":case"TPE4":case"TRCK":case"TPOS":case"TMED":case"TPUB":case"TCOP":case"TKEY":case"TEXT":case"TDAT":case"TSRC":this._setStringFrame(e,t);break;case"TBPM":case"TLEN":case"TYER":this._setIntegerFrame(e,t);break;case"USLT":if(t.language=t.language||"eng","object"!=typeof t||!("description"in t)||!("lyrics"in t))throw new Error("USLT frame value should be an object with keys description and lyrics");if(t.language&&!t.language.match(/[a-z]{3}/i))throw new Error("Language must be coded following the ISO 639-2 standards");this._setLyricsFrame(t.language,t.description,t.lyrics);break;case"APIC":if("object"!=typeof t||!("type"in t)||!("data"in t)||!("description"in t))throw new Error("APIC frame value should be an object with keys type, data and description");if(t.type<0||t.type>20)throw new Error("Incorrect APIC frame picture type");this._setPictureFrame(t.type,t.data,t.description,!!t.useUnicodeEncoding);break;case"TXXX":if("object"!=typeof t||!("description"in t)||!("value"in t))throw new Error("TXXX frame value should be an object with keys description and value");this._setUserStringFrame(t.description,t.value);break;case"WCOM":case"WCOP":case"WOAF":case"WOAR":case"WOAS":case"WORS":case"WPAY":case"WPUB":this._setUrlLinkFrame(e,t);break;case"COMM":if(t.language=t.language||"eng","object"!=typeof t||!("description"in t)||!("text"in t))throw new Error("COMM frame value should be an object with keys description and text");if(t.language&&!t.language.match(/[a-z]{3}/i))throw new Error("Language must be coded following the ISO 639-2 standards");this._setCommentFrame(t.language,t.description,t.text);break;case"PRIV":if("object"!=typeof t||!("id"in t)||!("data"in t))throw new Error("PRIV frame value should be an object with keys id and data");this._setPrivateFrame(t.id,t.data);break;case"IPLS":if(!Array.isArray(t)||!Array.isArray(t[0]))throw new Error("IPLS frame value should be an array of pairs");this._setPairedTextFrame(e,t);break;case"SYLT":if("object"!=typeof t||!("type"in t)||!("text"in t)||!("timestampFormat"in t))throw new Error("SYLT frame value should be an object with keys type, text and timestampFormat");if(!Array.isArray(t.text)||!Array.isArray(t.text[0]))throw new Error("SYLT frame text value should be an array of pairs");if(t.type<0||t.type>6)throw new Error("Incorrect SYLT frame content type");if(t.timestampFormat<1||t.timestampFormat>2)throw new Error("Incorrect SYLT frame time stamp format");t.language=t.language||"eng",t.description=t.description||"",this._setSynchronisedLyricsFrame(t.type,t.text,t.timestampFormat,t.language,t.description);break;default:throw new Error(`Unsupported frame ${e}`)}return this}removeTag(){if(this.arrayBuffer.byteLength<10)return;const e=new Uint8Array(this.arrayBuffer),t=e[3],a=((r=[e[6],e[7],e[8],e[9]])[0]<<21)+(r[1]<<14)+(r[2]<<7)+r[3]+10;var r,n;73!==(n=e)[0]||68!==n[1]||51!==n[2]||t<2||t>4||(this.arrayBuffer=new Uint8Array(e.subarray(a)).buffer)}addTag(){this.removeTag();const e=[255,254],n=10+this.frames.reduce(((e,t)=>e+t.size),0)+this.padding,s=new ArrayBuffer(this.arrayBuffer.byteLength+n),i=new Uint8Array(s);let c=0,o=[];return o=[73,68,51,3],i.set(o,c),c+=o.length,c++,c++,o=function(e){const t=127;return[e>>>21&t,e>>>14&t,e>>>7&t,e&t]}(n-10),i.set(o,c),c+=o.length,this.frames.forEach((n=>{switch(o=t(n.name),i.set(o,c),c+=o.length,o=r(n.size-10),i.set(o,c),c+=o.length,c+=2,n.name){case"WCOM":case"WCOP":case"WOAF":case"WOAR":case"WOAS":case"WORS":case"WPAY":case"WPUB":o=t(n.value),i.set(o,c),c+=o.length;break;case"TPE1":case"TCOM":case"TCON":case"TLAN":case"TIT1":case"TIT2":case"TIT3":case"TALB":case"TPE2":case"TPE3":case"TPE4":case"TRCK":case"TPOS":case"TKEY":case"TMED":case"TPUB":case"TCOP":case"TEXT":case"TSRC":o=[1].concat(e),i.set(o,c),c+=o.length,o=a(n.value),i.set(o,c),c+=o.length;break;case"TXXX":case"USLT":case"COMM":o=[1],"USLT"!==n.name&&"COMM"!==n.name||(o=o.concat(n.language)),o=o.concat(e),i.set(o,c),c+=o.length,o=a(n.description),i.set(o,c),c+=o.length,o=[0,0].concat(e),i.set(o,c),c+=o.length,o=a(n.value),i.set(o,c),c+=o.length;break;case"TBPM":case"TLEN":case"TDAT":case"TYER":c++,o=t(n.value),i.set(o,c),c+=o.length;break;case"PRIV":o=t(n.id),i.set(o,c),c+=o.length,c++,i.set(new Uint8Array(n.value),c),c+=n.value.byteLength;break;case"APIC":o=[n.useUnicodeEncoding?1:0],i.set(o,c),c+=o.length,o=t(n.mimeType),i.set(o,c),c+=o.length,o=[0,n.pictureType],i.set(o,c),c+=o.length,n.useUnicodeEncoding?(o=[].concat(e),i.set(o,c),c+=o.length,o=a(n.description),i.set(o,c),c+=o.length,c+=2):(o=t(n.description),i.set(o,c),c+=o.length,c++),i.set(new Uint8Array(n.value),c),c+=n.value.byteLength;break;case"IPLS":o=[1],i.set(o,c),c+=o.length,n.value.forEach((t=>{o=[].concat(e),i.set(o,c),c+=o.length,o=a(t[0].toString()),i.set(o,c),c+=o.length,o=[0,0].concat(e),i.set(o,c),c+=o.length,o=a(t[1].toString()),i.set(o,c),c+=o.length,o=[0,0],i.set(o,c),c+=o.length}));break;case"SYLT":o=[1].concat(n.language).concat(n.timestampFormat).concat(n.type),i.set(o,c),c+=o.length,o=[].concat(e),i.set(o,c),c+=o.length,o=a(n.description),i.set(o,c),c+=o.length,c+=2,n.value.forEach((t=>{o=[].concat(e),i.set(o,c),c+=o.length,o=a(t[0].toString()),i.set(o,c),c+=o.length,o=[0,0],i.set(o,c),c+=o.length,o=r(t[1]),i.set(o,c),c+=o.length}))}})),c+=this.padding,i.set(new Uint8Array(this.arrayBuffer),c),this.arrayBuffer=s,s}getBlob(){return new Blob([this.arrayBuffer],{type:"audio/mpeg"})}getURL(){return this.url||(this.url=URL.createObjectURL(this.getBlob())),this.url}revokeURL(){URL.revokeObjectURL(this.url)}}
;// ./src/utils/translateApis.js




const YandexTranslateAPI = {
  async translate(text, lang) {
    // Limit: 10k symbols
    //
    // Lang examples:
    // en-ru, uk-ru, ru-en...
    // ru, en (instead of auto-ru, auto-en)

    try {
      const response = await GM_fetch(
        `${translateUrls.yandex}?${new URLSearchParams({
          text,
          lang,
        })}`,
        { timeout: 3000 },
      );

      if (response instanceof Error) {
        throw response;
      }

      const content = await response.json();

      if (content.code !== 200) {
        throw content.message;
      }

      return content.text[0];
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  },

  async detect(text) {
    // Limit: 10k symbols
    try {
      const response = await GM_fetch(
        `${detectUrls.yandex}?${new URLSearchParams({
          text,
        })}`,
        { timeout: 3000 },
      );

      if (response instanceof Error) {
        throw response;
      }

      const content = await response.json();
      if (content.code !== 200) {
        throw content.message;
      }

      return content.lang ?? "en";
    } catch (error) {
      console.error("Error getting lang from text:", error);
      return "en";
    }
  },
};

const RustServerAPI = {
  async detect(text) {
    try {
      const response = await GM_fetch(
        detectUrls.rustServer,
        {
          method: "POST",
          body: text,
        },
        { timeout: 3000 },
      );

      if (response instanceof Error) {
        throw response;
      }

      return await response.text();
    } catch (error) {
      console.error("Error getting lang from text:", error);
      return "en";
    }
  },
};

const DeeplServerAPI = {
  async translate(text, fromLang = "auto", toLang = "ru") {
    try {
      const response = await GM_fetch(
        translateUrls.deepl,
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            text,
            source_lang: fromLang,
            target_lang: toLang,
          }),
        },
        { timeout: 3000 },
      );

      if (response instanceof Error) {
        throw response;
      }

      const content = await response.json();

      if (content.code !== 200) {
        throw content.message;
      }

      return content.data;
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  },
};

async function translate(text, fromLang = "", toLang = "ru") {
  const service = await votStorage.get(
    "translationService",
    defaultTranslationService,
  );
  switch (service) {
    case "yandex": {
      const langPair = fromLang && toLang ? `${fromLang}-${toLang}` : toLang;
      return await YandexTranslateAPI.translate(text, langPair);
    }
    case "deepl": {
      return await DeeplServerAPI.translate(text, fromLang, toLang);
    }
    default:
      return text;
  }
}

async function detect(text) {
  const service = await votStorage.get("detectService", defaultDetectService);
  switch (service) {
    case "yandex":
      return await YandexTranslateAPI.detect(text);
    case "rust-server":
      return await RustServerAPI.detect(text);
    default:
      return "en";
  }
}

const translateServices = Object.keys(translateUrls);
const detectServices = Object.keys(detectUrls).map((k) =>
  k === "rustServer" ? "rust-server" : k,
);



;// ./src/utils/youtubeUtils.js








// Get the language code from the response or the text
async function getLanguage(player, response, title, description) {
  if (
    !window.location.hostname.includes("m.youtube.com") &&
    player?.getAudioTrack
  ) {
    // ! Experimental ! get lang from selected audio track if availabled
    const audioTracks = player.getAudioTrack();
    const trackInfo = audioTracks?.getLanguageInfo(); // get selected track info (id === "und" if tracks are not available)
    if (trackInfo?.id !== "und") {
      return normalizeLang(trackInfo.id.split(".")[0]);
    }
  }

  // TODO: If the audio tracks will work fine, transfer the receipt of captions to the audioTracks variable
  // Check if there is an automatic caption track in the response
  const captionTracks =
    response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (captionTracks?.length) {
    const autoCaption = captionTracks.find((caption) => caption.kind === "asr");
    if (autoCaption && autoCaption.languageCode) {
      return normalizeLang(autoCaption.languageCode);
    }
  }

  // If there is no caption track, use detect to get the language code from the description

  const text = cleanText(title, description);

  debug.log(`Detecting language text: ${text}`);

  return detect(text);
}

function isMobile() {
  return /^m\.youtube\.com$/.test(window.location.hostname);
}

function getPlayer() {
  if (window.location.pathname.startsWith("/shorts/") && !isMobile()) {
    return document.querySelector("#shorts-player");
  }

  return document.querySelector("#movie_player");
}

function getPlayerResponse() {
  const player = getPlayer();
  if (player?.getPlayerResponse)
    return player?.getPlayerResponse?.call() ?? null;
  return player?.data?.playerResponse ?? null;
}

function getPlayerData() {
  const player = getPlayer();
  if (player?.getVideoData) return player?.getVideoData?.call() ?? null;
  return player?.data?.playerResponse?.videoDetails ?? null;
}

function getVideoVolume() {
  const player = getPlayer();
  if (player?.getVolume) {
    return player.getVolume.call() / 100;
  }

  return 1;
}

function setVideoVolume(volume) {
  const player = getPlayer();
  if (player?.setVolume) {
    player.setVolume(Math.round(volume * 100));
    return true;
  }
}

function isMuted() {
  const player = getPlayer();
  if (player?.isMuted) {
    return player.isMuted.call();
  }

  return false;
}

function videoSeek(video, time) {
  // * TIME IN MS
  debug.log("videoSeek", time);
  const preTime =
    getPlayer()?.getProgressState()?.seekableEnd || video.currentTime;
  const finalTime = preTime - time; // we always throw it to the end of the stream - time
  video.currentTime = finalTime;
}

function getSubtitles() {
  const response = getPlayerResponse();
  const playerCaptions = response?.captions?.playerCaptionsTracklistRenderer;
  if (!playerCaptions) {
    return [];
  }

  let captionTracks = playerCaptions.captionTracks ?? [];
  const translationLanguages = playerCaptions.translationLanguages ?? [];
  const userLang = localizationProvider.lang;
  const userLangSupported = translationLanguages.find(
    (language) => language.languageCode === userLang,
  );
  const asrLang =
    captionTracks.find((captionTrack) => captionTrack?.kind === "asr")
      ?.languageCode ?? "en";
  captionTracks = captionTracks.reduce((result, captionTrack) => {
    if (!("languageCode" in captionTrack)) {
      return result;
    }

    const language = captionTrack.languageCode
      ? normalizeLang(captionTrack.languageCode)
      : undefined;
    const url = captionTrack?.url || captionTrack?.baseUrl;
    if (!language || !url) {
      return result;
    }

    const captionUrl = `${
      url.startsWith("http") ? url : `${window.location.origin}/${url}`
    }&fmt=json3`;
    result.push({
      source: "youtube",
      language,
      isAutoGenerated: captionTrack?.kind === "asr",
      url: captionUrl,
    });

    if (
      userLangSupported &&
      captionTrack.isTranslatable &&
      captionTrack.languageCode === asrLang &&
      userLang !== language
    ) {
      // add translated youtube subtitles (if it possible)
      result.push({
        source: "youtube",
        language: userLang,
        isAutoGenerated: captionTrack?.kind === "asr",
        translatedFromLanguage: language,
        url: `${captionUrl}&tlang=${userLang}`,
      });
    }

    return result;
  }, []);
  debug.log("youtube subtitles:", captionTracks);
  return captionTracks;
}

// Get the video data from the player
async function youtubeUtils_getVideoData() {
  const player = getPlayer();
  const response = getPlayerResponse();
  const data = getPlayerData();
  const { title: localizedTitle } = data ?? {};
  const {
    shortDescription: description,
    isLive,
    title,
  } = response?.videoDetails ?? {};
  let detectedLanguage = title
    ? await getLanguage(player, response, title, description)
    : "en";
  detectedLanguage = availableLangs.includes(detectedLanguage)
    ? detectedLanguage
    : "en";
  const videoData = {
    isLive: !!isLive,
    title,
    localizedTitle,
    description,
    detectedLanguage,
  };
  debug.log("youtube video data:", videoData);
  console.log("[VOT] Detected language: ", videoData.detectedLanguage);
  return videoData;
}

/* harmony default export */ const youtubeUtils = ({
  isMobile,
  getPlayer,
  getPlayerResponse,
  getPlayerData,
  getVideoVolume,
  getSubtitles,
  getVideoData: youtubeUtils_getVideoData,
  setVideoVolume,
  videoSeek,
  isMuted,
});

;// ./src/subtitles.js






function formatYandexSubtitlesTokens(line) {
  const lineEndMs = line.startMs + line.durationMs;
  return line.tokens.reduce((result, token, index) => {
    const nextToken = line.tokens[index + 1];
    let lastToken;
    if (result.length > 0) {
      lastToken = result[result.length - 1];
    }
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

function createSubtitlesTokens(line, previousLineLastToken) {
  const tokens = line.text.split(/([\n \t])/).reduce((result, tokenText) => {
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
    return {
      ...token,
      startMs,
      durationMs,
    };
  });
}

function getSubtitlesTokens(subtitles, subtitlesObject) {
  const result = [];
  let lastToken;
  const { source, isAutoGenerated } = subtitlesObject;
  for (let i = 0; i < subtitles.subtitles.length; i++) {
    const line = subtitles.subtitles[i];
    const hasTokens = line?.tokens?.length;

    let tokens =
      hasTokens &&
      (source === "yandex" || (source === "youtube" && isAutoGenerated))
        ? formatYandexSubtitlesTokens(line)
        : createSubtitlesTokens(line, lastToken);
    lastToken = tokens[tokens.length - 1];
    result.push({
      ...line,
      tokens,
    });
  }
  subtitles.containsTokens = true;
  return result;
}

function formatYoutubeSubtitles(subtitles, isAsr = false) {
  const result = {
    containsTokens: isAsr,
    subtitles: [],
  };
  if (typeof subtitles !== "object" || !Array.isArray(subtitles.events)) {
    console.error("[VOT] Failed to format youtube subtitles", subtitles);
    return result;
  }

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
      if (text === "\n") {
        continue;
      }

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
        ...(isAsr ? { tokens } : {}),
      });
    }
  }
  return result;
}

async function fetchSubtitles(subtitlesObject) {
  const { source, isAutoGenerated, format, url } = subtitlesObject;
  const fetchPromise = (async () => {
    try {
      const response = await GM_fetch(url, { timeout: 5000 });
      if (["vtt", "srt"].includes(format)) {
        const plain = await response.text();
        return convertSubs(plain, "json");
      }
      return await response.json();
    } catch (error) {
      console.error("[VOT] Failed to fetch subtitles.", error);
      return {
        containsTokens: false,
        subtitles: [],
      };
    }
  })();

  let subtitles = await fetchPromise;
  if (source === "youtube") {
    subtitles = formatYoutubeSubtitles(subtitles, isAutoGenerated);
  }

  subtitles.subtitles = getSubtitlesTokens(subtitles, subtitlesObject);
  console.log("[VOT] subtitles:", subtitles);
  return subtitles;
}

async function subtitles_getSubtitles(client, videoData) {
  const {
    host,
    url,
    detectedLanguage: requestLang,
    videoId,
    duration,
    subtitles,
  } = videoData;
  const extraSubtitles =
    host === "youtube" ? youtubeUtils.getSubtitles() : (subtitles ?? []);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000),
  );

  try {
    const res = await Promise.race([
      client.getSubtitles({
        videoData: { host, url, videoId, duration },
        requestLang,
      }),
      timeoutPromise,
    ]);

    console.log("[VOT] Subtitles response: ", res);

    if (res.waiting) {
      console.error("[VOT] Failed to get yandex subtitles");
    }

    // Обработка субтитров
    let subtitles = res.subtitles ?? [];
    subtitles = subtitles.reduce((result, yaSubtitlesObject) => {
      if (
        yaSubtitlesObject.language &&
        !result.find(
          (e) =>
            e.source === "yandex" &&
            e.language === yaSubtitlesObject.language &&
            !e.translatedFromLanguage,
        )
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

    return [...subtitles, ...extraSubtitles].sort((a, b) => {
      if (a.source !== b.source) return a.source === "yandex" ? -1 : 1;
      if (
        a.language !== b.language &&
        (a.language === lang || b.language === lang)
      )
        return a.language === lang ? -1 : 1;
      if (a.source === "yandex") {
        // sort by translation
        if (a.translatedFromLanguage !== b.translatedFromLanguage) {
          // sort by translatedFromLanguage
          if (!a.translatedFromLanguage || !b.translatedFromLanguage) {
            // sort by isTranslated
            if (a.language === b.language)
              return a.translatedFromLanguage ? 1 : -1;
            return !a.translatedFromLanguage ? 1 : -1;
          }
          return a.translatedFromLanguage === requestLang ? -1 : 1;
        }
        // sort non translated by language
        if (!a.translatedFromLanguage)
          return a.language === requestLang ? -1 : 1;
      }
      // sort by isAutoGenerated
      if (a.source !== "yandex" && a.isAutoGenerated !== b.isAutoGenerated)
        return a.isAutoGenerated ? 1 : -1;
      return 0;
    });
  } catch (error) {
    if (error.message === "Timeout") {
      console.error("[VOT] Failed to get yandex subtitles. Reason: timeout");
    } else {
      console.error("[VOT] Error in getSubtitles function", error);
    }
    // на сайтах, где нет сабов всегда красит кнопку
    throw error;
  }
}

class SubtitlesWidget {
  constructor(video, container, site) {
    this.video = video;
    this.container =
      site.host === "youtube" && site.additionalData !== "mobile"
        ? container.parentElement
        : container;
    this.site = site;

    this.subtitlesContainer = this.createSubtitlesContainer();
    this.position = { left: 25, top: 75 };
    this.dragging = { active: false, offset: { x: 0, y: 0 } };

    this.subtitles = null;
    this.lastContent = null;
    this.highlightWords = false;
    this.fontSize = 20;
    this.opacity = 0.2;
    this.maxLength = 300;
    this.maxLengthRegexp = /.{1,300}(?:\s|$)/g;

    this.abortController = new AbortController();
    this.bindEvents();
    this.updateContainerRect();
  }

  createSubtitlesContainer() {
    const container = document.createElement("vot-block");
    container.classList.add("vot-subtitles-widget");
    this.container.appendChild(container);
    return container;
  }

  bindEvents() {
    const { signal } = this.abortController;

    this.onMouseDownBound = (e) => this.onMouseDown(e);
    this.onMouseUpBound = () => this.onMouseUp();
    this.onMouseMoveBound = (e) => this.onMouseMove(e);
    this.onTimeUpdateBound = this.debounce(() => this.update(), 100);

    document.addEventListener("mousedown", this.onMouseDownBound, { signal });
    document.addEventListener("mouseup", this.onMouseUpBound, { signal });
    document.addEventListener("mousemove", this.onMouseMoveBound, { signal });
    this.video?.addEventListener("timeupdate", this.onTimeUpdateBound, {
      signal,
    });

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  onMouseDown(e) {
    if (this.subtitlesContainer.contains(e.target)) {
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
  }

  onMouseUp() {
    this.dragging.active = false;
  }

  onMouseMove(e) {
    if (this.dragging.active) {
      e.preventDefault();
      const { width, height } = this.container.getBoundingClientRect();
      const containerOffset = this.dragging.containerOffset;
      this.position = {
        left:
          ((e.clientX - this.dragging.offset.x - containerOffset.x) / width) *
          100,
        top:
          ((e.clientY - this.dragging.offset.y - containerOffset.y) / height) *
          100,
      };
      this.applySubtitlePosition();
    }
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
  }

  setContent(subtitles) {
    if (subtitles && this.video) {
      this.subtitles = subtitles;
      this.update();
    } else {
      this.subtitles = null;
      Q(null, this.subtitlesContainer);
    }
  }

  setMaxLength(len) {
    if (typeof len === "number" && len) {
      this.maxLength = len;
      this.maxLengthRegexp = new RegExp(`.{1,${len}}(?:\\s|$)`, "g");
      this.update();
    }
  }

  setHighlightWords(value) {
    this.highlightWords = Boolean(value);
    this.update();
  }

  setFontSize(size) {
    this.fontSize = size;
    const subtitlesEl =
      this.subtitlesContainer?.querySelector(".vot-subtitles");
    if (subtitlesEl) {
      subtitlesEl.style.fontSize = `${this.fontSize}px`;
    }
  }

  /**
   * Set subtitles opacity by percentage where 100 - full transparent, 0 - not transparent
   *
   * @param {number} rate - 0-100 percent of opacity
   */
  setOpacity(rate) {
    this.opacity = ((100 - +rate) / 100).toFixed(2);
    const subtitlesEl =
      this.subtitlesContainer?.querySelector(".vot-subtitles");
    if (subtitlesEl) {
      subtitlesEl.style.setProperty("--vot-subtitles-opacity", this.opacity);
    }
  }

  update() {
    if (!this.video || !this.subtitles) return;

    const time = this.video.currentTime * 1000;
    const line = this.subtitles.subtitles?.findLast(
      (e) => e.startMs < time && time < e.startMs + e.durationMs,
    );

    if (!line) {
      Q(null, this.subtitlesContainer);
      return;
    }

    let tokens = this.processTokens(line.tokens);
    const content = this.renderTokens(tokens, time);
    const stringContent = JSON.stringify(content);
    if (stringContent !== this.lastContent) {
      this.lastContent = stringContent;
      Q(
        ke`<vot-block
          class="vot-subtitles"
          style="font-size: ${this.fontSize}px; --vot-subtitles-opacity: ${this
            .opacity}"
          >${content}</vot-block
        >`,
        this.subtitlesContainer,
      );
    }
  }

  processTokens(tokens) {
    if (tokens.at(-1).alignRange.end <= this.maxLength) return tokens;

    let chunks = [];
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
    if (tokens[0].text === " ") tokens.shift();
    if (tokens.at(-1).text === " ") tokens.pop();
    return tokens;
  }

  renderTokens(tokens, time) {
    return tokens.map((token) => {
      const passed =
        this.highlightWords &&
        (time > token.startMs + token.durationMs / 2 ||
          (time > token.startMs - 100 &&
            token.startMs + token.durationMs / 2 - time < 275));
      return ke`<span class="${passed ? "passed" : D}"
        >${token.text.replace("\\n", "<br>")}</span
      >`;
    });
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  release() {
    this.abortController.abort();
    this.resizeObserver.disconnect();
    this.subtitlesContainer.remove();
  }
}

// EXTERNAL MODULE: ./src/styles/main.scss
var main = __webpack_require__("./src/styles/main.scss");
;// ./src/ui.js






const undefinedPhrase = "#UNDEFINED";
const arrowIconRaw = Oe`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
>
  <path
    d="M12 14.975q-.2 0-.375-.062T11.3 14.7l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062Z"
  />
</svg>`;
const animeOpts = {
  easing: "linear",
  delay: function (el, i) {
    return i * 200;
  },
};

/**
 * Create header element
 *
 * @param {HTMLElement|string} html - header content
 * @param {1|2|3|4|5|6} level - header level
 * @return {HTMLElement} HTML header element
 */
function createHeader(html, level = 4) {
  const header = document.createElement("vot-block");
  header.classList.add("vot-header", `vot-header-level-${level}`);
  header.append(html);

  return header;
}

/**
 * Create information element
 *
 * @param {HTMLElement|string} labelHtml - label content
 * @param {HTMLElement|string} valueHtml - value content
 * @return {{
 *  container: HTMLElement,
 *  header: HTMLElement,
 *  value: HTMLElement
 * }} information elements
 */
function createInformation(labelHtml, valueHtml) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-info");

  const header = document.createElement("vot-block");
  Q(labelHtml, header);

  const value = document.createElement("vot-block");
  Q(valueHtml, value);

  container.append(header, value);

  return {
    container,
    header,
    value,
  };
}

/**
 * Create button
 *
 * @param {HTMLElement|string} html - button content
 * @return {HTMLElement} HTML button element
 */
function createButton(html) {
  const button = document.createElement("vot-block");
  button.classList.add("vot-button");
  button.append(html);

  return button;
}

/**
 * Create text button
 *
 * @param {HTMLElement|string} html - button content
 * @return {HTMLElement} HTML text button element
 */
function createTextButton(html) {
  const button = document.createElement("vot-block");
  button.classList.add("vot-text-button");
  button.append(html);

  return button;
}

/**
 * Create outlined button
 *
 * @param {HTMLElement|string} html - button content
 * @return {HTMLElement} HTML outlined button element
 */
function createOutlinedButton(html) {
  const button = document.createElement("vot-block");
  button.classList.add("vot-outlined-button");
  button.append(html);

  return button;
}

/**
 * Create icon button
 *
 * @param {TemplateResult} templateHtml - icon svg lit template
 * @return {HTMLElement} HTML icon button element
 */
function createIconButton(templateHtml) {
  const button = document.createElement("vot-block");
  button.classList.add("vot-icon-button");
  Q(templateHtml, button);

  return button;
}

/**
 * Create checkbox
 *
 * @param {string|HTMLElement} html - label content
 * @param {boolean} value - checkbox state
 * @return {{
 *  container: HTMLElement,
 *  input: HTMLInputElement,
 *  label: HTMLSpanElement
 * }} checkbox elements
 */
function createCheckbox(html, value = false) {
  const container = document.createElement("label");
  container.classList.add("vot-checkbox");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(value);

  const label = document.createElement("span");
  label.append(html);

  container.append(input, label);

  return { container, input, label };
}

/**
 * Update slider value
 *
 * @param {HTMLInputElement} input - slider input element
 */
function updateSlider(input) {
  const value = +input.value;
  const min = +input.min;
  const max = +input.max;
  const progress = (value - min) / (max - min);
  input.parentElement.setAttribute("style", `--vot-progress: ${progress}`);
}

/**
 * Create slider
 *
 * @param {string|HTMLElement} html - label content
 * @param {number} value - default value
 * @param {number} min - min value
 * @param {number} max - max value
 * @return {{
 *  container: HTMLElement,
 *  input: HTMLInputElement,
 *  label: HTMLSpanElement
 * }} slider elements
 */
function createSlider(labelHtml, value = 50, min = 0, max = 100) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-slider");

  const input = document.createElement("input");
  input.type = "range";
  input.min = min;
  input.max = max;
  input.value = value;

  const label = document.createElement("span");
  Q(labelHtml, label);

  container.append(input, label);

  input.addEventListener("input", (e) => updateSlider(e.target));
  updateSlider(input);

  return {
    container,
    input,
    label,
  };
}

/**
 * Create textfield
 *
 * @param {string|HTMLElement} html - label content
 * @param {string} value - default value
 * @param {string} placeholder - textfield placeholder
 * @param {boolean} multiline - multiline textfield
 * @return {{
 *  container: HTMLElement,
 *  input: HTMLInputElement,
 *  label: HTMLSpanElement
 * }} textfield elements
 */
function createTextfield(
  html,
  value = "",
  placeholder = " ",
  multiline = false,
) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-textfield");

  const input = document.createElement(multiline ? "textarea" : "input");
  input.placeholder = placeholder;
  input.value = value;
  if (!html) {
    input.classList.add("vot-show-placeholer");
  }

  const label = document.createElement("span");
  label.append(html);

  container.append(input, label);

  return {
    container,
    input,
    label,
  };
}

/**
 * Create dialog
 *
 * @param {string|HTMLElement} html - title content
 * @return {{
 *  container: HTMLElement,
 *  backdrop: HTMLElement,
 *  dialog: HTMLElement,
 *  contentWrapper: HTMLElement,
 *  headerContainer: HTMLElement,
 *  bodyContainer: HTMLElement,
 *  footerContainer: HTMLElement,
 *  titleContainer: HTMLElement,
 *  closeButton: HTMLElement,
 *  title: HTMLElement,
 * }} dialog elements
 */
function createDialog(html) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-dialog-container");
  container.hidden = true;

  const backdrop = document.createElement("vot-block");
  backdrop.classList.add("vot-dialog-backdrop");

  const dialog = document.createElement("vot-block");
  dialog.classList.add("vot-dialog");

  const contentWrapper = document.createElement("vot-block");
  contentWrapper.classList.add("vot-dialog-content-wrapper");

  const headerContainer = document.createElement("vot-block");
  headerContainer.classList.add("vot-dialog-header-container");

  const bodyContainer = document.createElement("vot-block");
  bodyContainer.classList.add("vot-dialog-body-container");

  const footerContainer = document.createElement("vot-block");
  footerContainer.classList.add("vot-dialog-footer-container");

  const titleContainer = document.createElement("vot-block");
  titleContainer.classList.add("vot-dialog-title-container");

  const closeButton = createIconButton(
    Oe`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="100%"
      viewBox="0 -960 960 960"
    >
      <path
        d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"
      />
    </svg>`,
  );
  closeButton.classList.add("vot-dialog-close-button");

  backdrop.onclick = closeButton.onclick = () => {
    container.hidden = true;
  };

  const title = document.createElement("vot-block");
  title.classList.add("vot-dialog-title");
  title.append(html);

  container.append(backdrop, dialog);
  dialog.append(contentWrapper);
  contentWrapper.append(headerContainer, bodyContainer, footerContainer);
  headerContainer.append(titleContainer, closeButton);
  titleContainer.append(title);

  return {
    container,
    backdrop,
    dialog,
    contentWrapper,
    headerContainer,
    bodyContainer,
    footerContainer,
    titleContainer,
    closeButton,
    title,
  };
}

/**
 * Create VOTButton
 *
 * @param {string|HTMLElement} label - label content
 * @return {{
 *  container: HTMLElement,
 *  translateButton: HTMLElement,
 *  separator: HTMLElement,
 *  pipButton: HTMLElement,
 *  separator2: HTMLElement,
 *  menuButton: HTMLElement,
 *  label: HTMLSpanElement,
 * }} VOTButton elements
 */
function createVOTButton(labelHtml) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-segmented-button");

  const translateButton = document.createElement("vot-block");
  translateButton.classList.add("vot-segment");
  translateButton.classList.add("vot-translate-button");
  Q(
    Oe`<svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
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
    </svg>`,
    translateButton,
  );

  const separator = document.createElement("vot-block");
  separator.classList.add("vot-separator");

  const pipButton = document.createElement("vot-block");
  pipButton.classList.add("vot-segment-only-icon");
  Q(
    Oe`<svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
    >
      <path
        d="M120-520q-17 0-28.5-11.5T80-560q0-17 11.5-28.5T120-600h104L80-743q-12-12-12-28.5T80-800q12-12 28.5-12t28.5 12l143 144v-104q0-17 11.5-28.5T320-800q17 0 28.5 11.5T360-760v200q0 17-11.5 28.5T320-520H120Zm40 360q-33 0-56.5-23.5T80-240v-160q0-17 11.5-28.5T120-440q17 0 28.5 11.5T160-400v160h280q17 0 28.5 11.5T480-200q0 17-11.5 28.5T440-160H160Zm680-280q-17 0-28.5-11.5T800-480v-240H480q-17 0-28.5-11.5T440-760q0-17 11.5-28.5T480-800h320q33 0 56.5 23.5T880-720v240q0 17-11.5 28.5T840-440ZM600-160q-17 0-28.5-11.5T560-200v-120q0-17 11.5-28.5T600-360h240q17 0 28.5 11.5T880-320v120q0 17-11.5 28.5T840-160H600Z"
      />
    </svg>`,
    pipButton,
  );

  const separator2 = document.createElement("vot-block");
  separator2.classList.add("vot-separator");

  const menuButton = document.createElement("vot-block");
  menuButton.classList.add("vot-segment-only-icon");
  Q(
    Oe`<svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
    >
      <path
        d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"
      />
    </svg>`,
    menuButton,
  );

  const label = document.createElement("span");
  label.classList.add("vot-segment-label");
  label.append(labelHtml);

  container.append(
    translateButton,
    separator,
    pipButton,
    separator2,
    menuButton,
  );
  translateButton.append(label);

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

/**
 * Create VOTMenu
 *
 * @param {string|HTMLElement} html - title content
 * @return {{
 *  container: HTMLElement,
 *  contentWrapper: HTMLElement,
 *  headerContainer: HTMLElement,
 *  bodyContainer: HTMLElement,
 *  footerContainer: HTMLElement,
 *  titleContainer: HTMLElement,
 *  title: HTMLSpanElement,
 * }} VOTMenu elements
 */
function createVOTMenu(html) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-menu");
  container.hidden = true;

  const contentWrapper = document.createElement("vot-block");
  contentWrapper.classList.add("vot-menu-content-wrapper");

  const headerContainer = document.createElement("vot-block");
  headerContainer.classList.add("vot-menu-header-container");

  const bodyContainer = document.createElement("vot-block");
  bodyContainer.classList.add("vot-menu-body-container");

  const footerContainer = document.createElement("vot-block");
  footerContainer.classList.add("vot-menu-footer-container");

  const titleContainer = document.createElement("vot-block");
  titleContainer.classList.add("vot-menu-title-container");

  const title = document.createElement("vot-block");
  title.classList.add("vot-menu-title");
  title.append(html);

  container.append(contentWrapper);
  contentWrapper.append(headerContainer, bodyContainer, footerContainer);
  headerContainer.append(titleContainer);
  titleContainer.append(title);

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

/**
 * Create VOTSelectLabel
 *
 * @param {string} text - label text
 * @return {HTMLSpanElement} VOTSelectLabel element
 */
function createVOTSelectLabel(text) {
  const label = document.createElement("span");
  label.classList.add("vot-select-label");
  label.textContent = text;
  return label;
}

/**
 * Create VOTSelect
 *
 * @param {string} selectTitle - select title
 * @param {string} dialogTitle - dialog title
 * @param {{label: string, value: string, selected: boolean}[]} items - items to select
 * @param {{onSelectCb: function, labelElement: string}} options - items to select
 * @return {{
 *  container: HTMLElement,
 *  title: HTMLSpanElement,
 *  arrowIcon: HTMLElement,
 *  labelElement: HTMLElement,
 *  setTitle: (newTitle: string) => void,
 *  setSelected: (val: string) => void,
 *  updateItems: (newItems: {label: string, value: string, selected: boolean}[]) => void,
 * }} VOTSelect elements
 */
function createVOTSelect(selectTitle, dialogTitle, items, options = {}) {
  const { onSelectCb = function () {}, labelElement = "" } = options;
  let selectedItems = [];

  const container = document.createElement("vot-block");
  container.classList.add("vot-select");

  if (labelElement) {
    container.append(labelElement);
  }

  const outer = document.createElement("vot-block");
  outer.classList.add("vot-select-outer");

  const title = document.createElement("span");
  title.classList.add("vot-select-title");
  title.textContent = selectTitle;

  if (selectTitle === undefined) {
    title.textContent = items.find((i) => i.selected === true)?.label;
  }

  const arrowIcon = document.createElement("vot-block");
  arrowIcon.classList.add("vot-select-arrow-icon");
  Q(arrowIconRaw, arrowIcon);

  outer.append(title, arrowIcon);
  outer.onclick = () => {
    const votSelectDialog = createDialog(dialogTitle);
    votSelectDialog.container.classList.add("vot-dialog-temp");
    votSelectDialog.container.hidden = false;
    document.documentElement.appendChild(votSelectDialog.container);

    const contentList = document.createElement("vot-block");
    contentList.classList.add("vot-select-content-list");

    for (const item of items) {
      const contentItem = document.createElement("vot-block");
      contentItem.classList.add("vot-select-content-item");
      contentItem.textContent = item.label;
      contentItem.dataset.votSelected = item.selected;
      contentItem.dataset.votValue = item.value;
      if (item.disabled) {
        contentItem.inert = true;
      }

      contentItem.onclick = async (e) => {
        if (e.target.inert) return;

        // removing the selected value for updating
        const contentItems = contentList.childNodes;
        for (let ci of contentItems) {
          ci.dataset.votSelected = false;
        }
        // fixed selection after closing the modal and opening again
        for (let i of items) {
          i.selected = i.value === item.value;
        }

        contentItem.dataset.votSelected = true;
        title.textContent = item.label;

        // !!! use e.target.dataset.votValue instead of e.target.value !!!
        await onSelectCb(e);
      };
      contentList.appendChild(contentItem);
    }

    // search logic
    const votSearchLangTextfield = createTextfield(
      localizationProvider.get("searchField"),
    );

    votSearchLangTextfield.input.oninput = (e) => {
      const searchText = e.target.value.toLowerCase();
      // check if there are lovercase characters in the string. used for smarter search
      for (let i = 0; i < selectedItems.length; i++) {
        const ci = selectedItems[i];
        ci.hidden = !ci.textContent.toLowerCase().includes(searchText);
      }
    };

    votSelectDialog.bodyContainer.append(
      votSearchLangTextfield.container,
      contentList,
    );
    selectedItems = contentList.childNodes;

    // remove the modal so that they do not accumulate
    votSelectDialog.backdrop.onclick = votSelectDialog.closeButton.onclick =
      () => {
        votSelectDialog.container.remove();
        selectedItems = [];
      };
  };

  container.append(outer);

  const setTitle = (newTitle) => {
    title.textContent = newTitle;
  };

  const setSelected = (val) => {
    const selectedItemsArray = Array.from(selectedItems).filter(
      (ci) => !ci.inert,
    );
    for (let i = 0; i < selectedItemsArray.length; i++) {
      const ci = selectedItemsArray[i];
      ci.dataset.votSelected = ci.dataset.votValue === val;
    }

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      currentItem.selected = String(currentItem.value) === val;
    }
  };

  const updateItems = (newItems) => {
    items = newItems;
  };

  return {
    container,
    title,
    arrowIcon,
    labelElement,
    setTitle,
    setSelected,
    updateItems,
  };
}

function createVOTLanguageSelect(options) {
  const {
    fromTitle = undefinedPhrase,
    fromDialogTitle = undefinedPhrase,
    fromItems = [],
    fromOnSelectCB = null,
    toTitle = undefinedPhrase,
    toDialogTitle = undefinedPhrase,
    toItems = [],
    toOnSelectCB = null,
  } = options;

  const container = document.createElement("vot-block");
  container.classList.add("vot-lang-select");

  const fromSelect = createVOTSelect(fromTitle, fromDialogTitle, fromItems, {
    onSelectCb: fromOnSelectCB,
  });

  const icon = document.createElement("vot-block");
  icon.classList.add("vot-lang-select-icon");
  Q(
    Oe`<svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
    >
      <path
        d="M647-440H200q-17 0-28.5-11.5T160-480q0-17 11.5-28.5T200-520h447L451-716q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l264 264q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L508-188q-11 11-27.5 11T452-188q-12-12-12-28.5t12-28.5l195-195Z"
      />
    </svg>`,
    icon,
  );

  const toSelect = createVOTSelect(toTitle, toDialogTitle, toItems, {
    onSelectCb: toOnSelectCB,
  });

  container.append(fromSelect.container, icon, toSelect.container);

  return {
    container,
    fromSelect,
    icon,
    toSelect,
  };
}

function createDetails(titleHtml) {
  const container = document.createElement("vot-block");
  container.classList.add("vot-details");

  const header = document.createElement("vot-block");
  header.append(titleHtml);

  const arrowIcon = document.createElement("vot-block");
  arrowIcon.classList.add("vot-details-arrow-icon");
  Q(arrowIconRaw, arrowIcon);

  container.append(header, arrowIcon);

  return {
    container,
    header,
    arrowIcon,
  };
}

/**
 *
 * @export
 * @param {SVGElement} votLoader
 * @param {string} [primaryColor="139, 180, 245"]
 * @return {Function} Update animation function
 */
function animateLoader(votLoader, primaryColor = "139, 180, 245") {
  const votLoaderHelper = votLoader.querySelector(".vot-loader-helper");
  const votLoaderMain = votLoader.querySelector(".vot-loader-main");
  anime
    .timeline({
      ...animeOpts,
      targets: [votLoaderHelper, votLoaderMain],
      duration: 250,
    })
    .add({
      "fill-opacity": 0,
      "stroke-width": 2,
      d: "M 12 1.5 C 17.799 1.5 22.5 6.201 22.5 12 C 22.5 17.799 17.799 22.5 12 22.5 C 6.201 22.5 1.5 17.799 1.5 12 C 1.5 6.201 6.201 1.5 12 1.5 Z",
      duration: 0,
    })
    .add(
      {
        targets: votLoaderHelper,
        stroke: `rgb(${primaryColor})`,
        // make empty by default
        "stroke-opacity": 0,
        duration: 0,
      },
      0,
    )
    .add(
      {
        targets: votLoaderMain,
        stroke: "#888888",
        "stroke-opacity": 0.25,
      },
      0,
    );
  const animation = anime
    .timeline({
      targets: votLoaderHelper,
      easing: "easeInOutSine",
      duration: 1000,
      autoplay: false,
    })
    .add(
      {
        // prevent full fill on 0%
        strokeOpacity: 1,
        duration: 0,
      },
      0,
    )
    .add(
      {
        strokeDashoffset: [anime.setDashoffset, 0],
      },
      0,
    );

  return (percentage) => {
    animation.seek(animation.duration * (percentage / 100));
  };
}

function afterAnimateLoader(votLoader, primaryColor = "139, 180, 245") {
  const votLoaderHelper = votLoader.querySelector(".vot-loader-helper");
  const votLoaderMain = votLoader.querySelector(".vot-loader-main");
  anime
    .timeline({
      ...animeOpts,
      targets: votLoaderMain,
      duration: 600,
    })
    .add({
      d: "M 9.0596 14.8571 L 9.7667 15.5642 L 10.4738 14.8571 L 17.0071 8.3238 C 17.0457 8.2852 17.0937 8.25 17.2333 8.25 C 17.373 8.25 17.421 8.2852 17.4596 8.3238 C 17.4981 8.3624 17.5333 8.4104 17.5333 8.55 C 17.5333 8.6896 17.4981 8.7376 17.4596 8.7762 L 9.9929 16.2429 C 9.9011 16.3346 9.8397 16.35 9.7667 16.35 C 9.6937 16.35 9.6322 16.3346 9.5404 16.2429 L 6.0738 12.7762 C 6.0352 12.7376 6 12.6897 6 12.55 C 6 12.4103 6.0352 12.3624 6.0738 12.3238 C 6.1124 12.2852 6.1603 12.25 6.3 12.25 C 6.4397 12.25 6.4876 12.2852 6.5262 12.3238 L 9.0596 14.8571 Z",
      duration: 0,
    })
    .add({
      strokeDashoffset: [anime.setDashoffset, 0],
      stroke: `rgb(${primaryColor})`,
      "stroke-opacity": 1,
    });

  setTimeout(() => {
    anime
      .timeline({
        ...animeOpts,
        targets: votLoaderMain,
        duration: 600,
      })
      .add({
        d: "M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z",
        duration: 100,
      })
      .add(
        {
          targets: votLoaderHelper,
          d: "",
          duration: 200,
        },
        0,
      )
      .add({
        targets: votLoaderMain,
        "stroke-width": "0",
        stroke: `rgba(${primaryColor}), 0)`,
        "fill-opacity": "1",
        "stroke-dasharray": "0",
        "stroke-dashoffset": "0",
        duration: 0,
      });
  }, 2000);
}

/* harmony default export */ const ui = ({
  createHeader,
  createInformation,
  createButton,
  createTextButton,
  createOutlinedButton,
  createIconButton,
  createCheckbox,
  createSlider,
  createTextfield,
  createDialog,
  createVOTButton,
  createVOTMenu,
  createVOTSelectLabel,
  createVOTSelect,
  createVOTLanguageSelect,
  updateSlider,
  animateLoader,
  afterAnimateLoader,
  createDetails,
});

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
;// ./src/utils/EventImpl.js
class EventImpl {
  constructor() {
    this.listeners = new Set();
  }

  hasListener(e) {
    return this.listeners.has(e);
  }

  dispatchToListener(handler, ...args) {
    try {
      handler(...args);
    } catch (exception) {
      console.error("[VOT]", exception);
    }
  }

  addListener(handler) {
    if (this.hasListener(handler)) {
      throw new Error("[VOT] The listener has already been added.");
    }
    this.listeners.add(handler);
  }

  removeListener(handler) {
    if (!this.hasListener(handler)) {
      throw new Error("[VOT] The listener has not been added yet.");
    }
    this.listeners.delete(handler);
  }

  dispatch(...args) {
    for (const handler of Array.from(this.listeners)) {
      this.dispatchToListener(handler, ...args);
    }
  }
}

;// ./src/utils/VideoObserver.js




const adKeywords = new Set([
  "advertise",
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

const adKeywordsRegex = (() => {
  const pattern = Array.from(adKeywords).join("|");
  return new RegExp(pattern, "i");
})();

const filterVideoNodes = (nodes) => {
  const result = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node instanceof HTMLVideoElement) {
      result.push(node);
    } else if (node instanceof HTMLElement) {
      const videos = node.querySelectorAll("video");
      for (let j = 0; j < videos.length; j++) {
        result.push(videos[j]);
      }
    }
  }
  return result;
};

const isAdVideo = (video) => {
  if (
    adKeywordsRegex.test(video.className) ||
    adKeywordsRegex.test(video.title)
  )
    return true;

  let parent = video.parentElement;
  while (parent) {
    if (
      adKeywordsRegex.test(parent.className) ||
      adKeywordsRegex.test(parent.id)
    )
      return true;
    parent = parent.parentElement;
  }

  return false;
};

const isMutedVideo = (video) => {
  return (
    video.hasAttribute("muted") &&
    !video.classList.contains("vjs-tech") &&
    !video.preload
  );
};

const isVideoReady = (video) => video.readyState >= 3;

const waitForVideoReady = (video, callback) => {
  const checkVideoState = () => {
    if (isVideoReady(video)) {
      callback(video);
    } else {
      requestAnimationFrame(checkVideoState);
    }
  };

  checkVideoState();
};

class VideoObserver {
  constructor() {
    this.videoCache = new Set();
    this.onVideoAdded = new EventImpl();
    this.onVideoRemoved = new EventImpl();

    this.observer = new MutationObserver(this.handleMutations);
    this.patchAttachShadow();
  }

  patchAttachShadow() {
    const originalAttachShadow = Element.prototype.attachShadow;
    const self = this;
    Element.prototype.attachShadow = function (...args) {
      const shadowRoot = originalAttachShadow.apply(this, args);
      self.searchInRoot(shadowRoot);
      self.observeShadowRoot(shadowRoot);
      return shadowRoot;
    };
  }

  observeShadowRoot(shadowRoot) {
    const shadowObserver = new MutationObserver(this.handleMutations);
    shadowObserver.observe(shadowRoot, { childList: true, subtree: true });
  }

  handleMutations = (mutationsList) => {
    window.requestIdleCallback(
      () => {
        for (let i = 0; i < mutationsList.length; i++) {
          const mutation = mutationsList[i];
          if (mutation.type !== "childList") continue;

          const addedVideos = filterVideoNodes(mutation.addedNodes);
          for (let j = 0; j < addedVideos.length; j++) {
            this.checkAndHandleVideo(addedVideos[j]);
          }

          const removedVideos = filterVideoNodes(mutation.removedNodes);
          for (let k = 0; k < removedVideos.length; k++) {
            this.handleVideoRemoved(removedVideos[k]);
          }
        }
      },
      { timeout: 1000 },
    );
  };

  searchInRoot(root) {
    const findVideosInRoot = (currentRoot) => {
      const videos = new Set();

      const searchNode = (node) => {
        if (node instanceof HTMLVideoElement) {
          videos.add(node);
        }

        if (node instanceof Element) {
          const directVideos = node.querySelectorAll("video");
          for (let i = 0; i < directVideos.length; i++) {
            videos.add(directVideos[i]);
          }

          const children = node.children;
          if (children) {
            for (let i = 0; i < children.length; i++) {
              searchNode(children[i]);
            }
          }
        }
      };

      searchNode(currentRoot);
      return Array.from(videos);
    };

    const foundVideos = findVideosInRoot(root);
    for (let i = 0; i < foundVideos.length; i++) {
      this.checkAndHandleVideo(foundVideos[i]);
    }
  }

  enable() {
    this.observer.observe(document, { childList: true, subtree: true });

    const regularVideos = document.querySelectorAll("video");
    for (let i = 0; i < regularVideos.length; i++) {
      this.checkAndHandleVideo(regularVideos[i]);
    }
  }

  disable() {
    this.observer.disconnect();
  }

  checkAndHandleVideo = (video) => {
    if (this.videoCache.has(video)) return;
    this.videoCache.add(video);

    if (isAdVideo(video) || isMutedVideo(video)) {
      debug.log("The promotional/muted video was ignored", video);
      return;
    }
    waitForVideoReady(video, this.handleVideoAdded);
  };

  handleVideoAdded = (video) => {
    this.onVideoAdded.dispatch(video);
  };

  handleVideoRemoved = (video) => {
    if (!document.contains(video)) {
      this.videoCache.delete(video);
      this.onVideoRemoved.dispatch(video);
    }
  };
}

;// ./node_modules/chaimu/dist/config.js
/* harmony default export */ const dist_config = ({
    version: "1.0.3",
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

/* harmony default export */ const dist_debug = ({
    log: (...text) => {
        if (!dist_config.debug) {
            return;
        }
        return console.log(`%c✦ chaimu.js v${dist_config.version} ✦`, "background: #000; color: #fff; padding: 0 8px", ...text);
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
    _src;
    fetch;
    constructor(chaimu, src) {
        this.chaimu = chaimu;
        this._src = src;
        this.fetch = dist_config.fetchFn;
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
        dist_debug.log(`handle video ${event.type}`);
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
        dist_debug.log("[AudioPlayer] lipsync video", this.chaimu.video);
        if (!this.chaimu.video) {
            return this;
        }
        this.audio.currentTime = this.chaimu.video.currentTime;
        this.audio.playbackRate = this.chaimu.video.playbackRate;
        if (!mode) {
            dist_debug.log("[AudioPlayer] lipsync mode isn't set");
            return this;
        }
        dist_debug.log(`[AudioPlayer] lipsync mode is ${mode}`);
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
        dist_debug.log("[AudioPlayer] sync play called");
        this.audio.play().catch(this.audioErrorHandle);
        return this;
    }
    async play() {
        dist_debug.log("[AudioPlayer] play called");
        await this.audio.play().catch(this.audioErrorHandle);
        return this;
    }
    async pause() {
        return new Promise((resolve) => {
            dist_debug.log("[AudioPlayer] pause called");
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
        dist_debug.log(`[ChaimuPlayer] Fetching audio from ${this._src}...`);
        try {
            const res = await this.fetch(this._src);
            dist_debug.log(`[ChaimuPlayer] Decoding fetched audio...`);
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
        dist_debug.log("[ChaimuPlayer] lipsync video", this.chaimu.video, this);
        if (!this.chaimu.video) {
            return this;
        }
        if (!mode) {
            dist_debug.log("[ChaimuPlayer] lipsync mode isn't set");
            return this;
        }
        dist_debug.log(`[ChaimuPlayer] lipsync mode is ${mode}`);
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
        dist_debug.log("clear audio context");
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
            dist_debug.log("Skip starting player");
            return this;
        }
        if (this.cleanerRunned) {
            dist_debug.log("The other cleaner is still running, waiting...");
            return this;
        }
        dist_debug.log("starting audio");
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
    constructor({ url, video, debug = false, fetchFn = dist_config.fetchFn, preferAudio = false, }) {
        this._debug = dist_config.debug = debug;
        dist_config.fetchFn = fetchFn;
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
        this._debug = dist_config.debug = value;
    }
    get debug() {
        return this._debug;
    }
}

;// ./node_modules/chaimu/dist/index.js




;// ./node_modules/@vot.js/shared/dist/types/helpers/bannedvideo.js
var TypeName;
(function (TypeName) {
    TypeName["Channel"] = "Channel";
    TypeName["Video"] = "Video";
})(TypeName || (TypeName = {}));

;// ./node_modules/@vot.js/shared/dist/types/index.js





















;// ./node_modules/@vot.js/shared/dist/index.js









;// ./src/utils/AudioDownloader.ts





const desktopAudioItag = 251;
const signatureCipherKeys = ["sp", "s", "url"];
const MIN_CONTENT_LENGTH_MULTIPLAIER = 0.9;
const CHUNK_STEPS = [6e4, 8e4, 15e4, 33e4, 46e4];
const ACCEPTABLE_REQUEST_AND_RESPONSE_LENGTHS_DIFF = 0.9;
const MIN_ARRAY_BUFFER_LENGTH = 15e3;
class YouTubeAudioDownloader {
    minChunkSize;
    nr = 1;
    constructor({ minChunkSize = config.minChunkSize } = {}) {
        this.minChunkSize = minChunkSize;
    }
    isSignatureCipherKey(key) {
        return signatureCipherKeys.includes(key);
    }
    getAudioAdaptiveFormat() {
        const playerResponse = youtubeUtils.getPlayerResponse();
        if (!playerResponse) {
            return;
        }
        const { streamingData: { adaptiveFormats }, } = playerResponse;
        const formatsWithItag = adaptiveFormats.filter((format) => format.itag === desktopAudioItag);
        debug.log("formatsWithItag", formatsWithItag);
        if (formatsWithItag.length < 2) {
            return adaptiveFormats[0];
        }
        const hasAudioTrack = formatsWithItag.some((format) => Object.hasOwn(format, "audioTrack"));
        debug.log("hasAudioTrack", hasAudioTrack);
        if (!hasAudioTrack) {
            return formatsWithItag[0];
        }
        const { captions: { playerCaptionsTracklistRenderer: { audioTracks, defaultAudioTrackIndex, }, }, } = playerResponse;
        const hasMultiTracks = audioTracks.some((track) => Object.hasOwn(track, "hasDefaultTrack"));
        debug.log("hasMultiTracks", hasMultiTracks);
        if (!hasMultiTracks) {
            return formatsWithItag[0];
        }
        const defaultAudioTrack = audioTracks?.[defaultAudioTrackIndex];
        debug.log("defaultAudioTrack", defaultAudioTrack);
        if (!defaultAudioTrack) {
            return formatsWithItag[0];
        }
        return (formatsWithItag.find((format) => format.audioTrack?.id ===
            defaultAudioTrack.audioTrackId) ?? formatsWithItag[0]);
    }
    makeFileId(fileSize) {
        return JSON.stringify({
            downloadType: AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
            itag: desktopAudioItag,
            minChunkSize: this.minChunkSize,
            fileSize,
        });
    }
    getContentLength(adaptiveFormat) {
        const { contentLength } = adaptiveFormat;
        const numericContentLength = parseInt(contentLength);
        if (!Number.isFinite(numericContentLength)) {
            throw new Error("Content length number isn't finite");
        }
        return numericContentLength;
    }
    fetchLocationOriginText = async () => {
        let response, textContent;
        try {
            response = await GM_fetch(location.origin);
            textContent = await response.text();
        }
        catch (err) {
            throw new Error(`Can't get text from ${location.origin}, because ${err.message}`);
        }
        return textContent;
    };
    getUrlFromAdaptiveFormat(adaptiveFormat) {
        const { url } = adaptiveFormat;
        if (typeof url === "string" && url) {
            return url;
        }
        // decryptSignatureCipher...
        console.error("[VOT] SignatureCipher not supported yet");
        return undefined;
    }
    calcChunkRangesParts(contentLength) {
        if (contentLength < 1) {
            throw new Error("Content length can't be less than 1");
        }
        const minimumChunkSize = Math.round(contentLength * MIN_CONTENT_LENGTH_MULTIPLAIER);
        const chunkRanges = [];
        let currentChunk = [];
        let accumulatedSize = 0;
        let stepIndex = 0;
        let start = 0;
        let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
        while (end < contentLength) {
            const mustExist = end < minimumChunkSize;
            currentChunk.push({
                start,
                end,
                mustExist,
            });
            accumulatedSize += end - start;
            if (accumulatedSize >= this.minChunkSize) {
                chunkRanges.push(currentChunk);
                currentChunk = [];
                accumulatedSize = 0;
            }
            if (stepIndex !== CHUNK_STEPS.length - 1)
                stepIndex++;
            start = end + 1;
            end += CHUNK_STEPS[stepIndex];
        }
        end = contentLength;
        currentChunk.push({
            start,
            end,
            mustExist: false,
        });
        chunkRanges.push(currentChunk);
        return chunkRanges;
    }
    calcChunkRanges(contentLength) {
        if (contentLength < 1) {
            throw new Error("Content length can't be less than 1");
        }
        const minimumChunkSize = Math.round(contentLength * MIN_CONTENT_LENGTH_MULTIPLAIER);
        const chunkRanges = [];
        let stepIndex = 0;
        let start = 0;
        let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
        while (end < contentLength) {
            const mustExist = end < minimumChunkSize;
            chunkRanges.push({
                start: start,
                end: end,
                mustExist: mustExist,
            });
            if (stepIndex !== CHUNK_STEPS.length - 1)
                stepIndex++;
            start = end + 1;
            end += CHUNK_STEPS[stepIndex];
        }
        end = contentLength;
        chunkRanges.push({
            start: start,
            end: end,
            mustExist: false,
        });
        return chunkRanges;
    }
    mergeBuffers(buffers) {
        const totalByteLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
        const mergedArray = new Uint8Array(totalByteLength);
        let offset = 0;
        for (const buffer of buffers) {
            mergedArray.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }
        return mergedArray;
    }
    getChunkRanges(adaptiveFormat, isPartialMode = false) {
        // 12044969
        const contentLength = this.getContentLength(adaptiveFormat);
        debug.log(`[getChunkRanges (isPartialMode: ${isPartialMode})] contentLength: ${contentLength}`);
        const chunkRanges = isPartialMode
            ? this.calcChunkRangesParts(contentLength)
            : this.calcChunkRanges(contentLength);
        debug.log("[getChunkRanges] chunkRanges: ", chunkRanges);
        if (!chunkRanges.length) {
            throw new Error("Empty chunk ranges");
        }
        return chunkRanges;
    }
    async *getPartialAudioBuffers(audioAdaptiveFormat, currentUrl, fetchOpts = {}) {
        const chunkRangesParts = this.getChunkRanges(audioAdaptiveFormat, true);
        for (const chunkRange of chunkRangesParts) {
            const { audio, url, isAcceptableLast } = await this.fetchAudioWithMetaByChunkRanges(currentUrl, fetchOpts, chunkRange);
            if (url) {
                currentUrl = url;
            }
            yield audio;
            if (isAcceptableLast) {
                break;
            }
        }
    }
    changeRangeAndNrInUrl(audioUrl, { start, end }) {
        const url = new URL(audioUrl);
        url.searchParams.set("range", `${start}-${end}`);
        url.searchParams.set("nr", String(this.nr++));
        url.searchParams.delete("ump");
        return url.toString();
    }
    checkIsChunkLengthOk(buffer, { start, end }) {
        const rangeLength = end - start;
        if (rangeLength > MIN_ARRAY_BUFFER_LENGTH &&
            buffer.byteLength < MIN_ARRAY_BUFFER_LENGTH) {
            return false;
        }
        return (Math.min(rangeLength, buffer.byteLength) /
            Math.max(rangeLength, buffer.byteLength) >
            ACCEPTABLE_REQUEST_AND_RESPONSE_LENGTHS_DIFF);
    }
    convertArrayBufferToString(buffer) {
        return new TextDecoder("ascii").decode(buffer);
    }
    getUrlFromArrayBuffer(buffer) {
        const urlMatch = this.convertArrayBufferToString(buffer).match(/https:\/\/.*$/);
        return urlMatch ? urlMatch[0] : null;
    }
    async fetchAudioWithMeta({ audioUrl, chunkRange, fetchOpts, isUrlChanged = false, }) {
        const updatedUrl = this.changeRangeAndNrInUrl(audioUrl, chunkRange);
        let response, audioBuffer;
        try {
            response = await GM_fetch(updatedUrl, fetchOpts);
        }
        catch (error) {
            throw new Error(`Can't fetch audio URL ${updatedUrl}, because: ${error.message}`);
        }
        try {
            audioBuffer = await response.arrayBuffer();
        }
        catch (error) {
            throw new Error(`Can't get array buffer from audio URL ${updatedUrl}, because: ${error.message}`);
        }
        debug.log("[fetchAudioWithMeta] before checkIsChunkLengthOk", audioBuffer, chunkRange);
        if (this.checkIsChunkLengthOk(audioBuffer, chunkRange)) {
            return {
                audio: audioBuffer,
                url: isUrlChanged ? audioUrl : null,
                isAcceptableLast: false,
            };
        }
        const redirectedUrl = this.getUrlFromArrayBuffer(audioBuffer);
        debug.log("[fetchAudioWithMeta] getUrlFromArrayBuffer", redirectedUrl);
        if (redirectedUrl) {
            return await this.fetchAudioWithMeta({
                audioUrl: redirectedUrl,
                chunkRange,
                fetchOpts,
                isUrlChanged: true,
            });
        }
        if (!chunkRange.mustExist) {
            return {
                audio: audioBuffer,
                url: null,
                isAcceptableLast: true,
            };
        }
        throw new Error(`Can't get redirected audio URL: ${updatedUrl}`);
    }
    async fetchAudioWithMetaByChunkRanges(audioUrl, fetchOpts, chunkRanges) {
        let currentUrl = audioUrl;
        const audioBuffers = [];
        let isAcceptableLast = false;
        for await (const chunkRange of chunkRanges) {
            const res = await this.fetchAudioWithMeta({
                audioUrl: currentUrl,
                chunkRange,
                fetchOpts,
            });
            debug.log("[fetchAudioWithMetaByChunkRanges] fetchAudioWithMeta result", res);
            if (res.url) {
                currentUrl = res.url;
            }
            audioBuffers.push(res.audio);
            isAcceptableLast = res.isAcceptableLast;
            if (isAcceptableLast) {
                break;
            }
        }
        return {
            audio: this.mergeBuffers(audioBuffers),
            url: currentUrl,
            isAcceptableLast,
        };
    }
    async *getAudioBuffers(audioAdaptiveFormat, currentUrl, fetchOpts = {}) {
        const chunkRanges = this.getChunkRanges(audioAdaptiveFormat, false);
        const { audio } = await this.fetchAudioWithMetaByChunkRanges(currentUrl, fetchOpts, chunkRanges);
        yield audio;
    }
    async download(isPartialMode = false) {
        const audioAdaptiveFormat = this.getAudioAdaptiveFormat();
        debug.log("[download] audioAdaptiveFormat", audioAdaptiveFormat);
        if (!audioAdaptiveFormat) {
            throw new Error("Failed to get audioAdaptiveFormat");
        }
        const audioUrl = this.getUrlFromAdaptiveFormat(audioAdaptiveFormat);
        if (!audioUrl) {
            throw new Error("Failed to get audioUrl");
        }
        const fileId = this.makeFileId(audioAdaptiveFormat.contentLength);
        debug.log("[download] audioAdaptiveFormat", audioAdaptiveFormat);
        return {
            fileId,
            audioPartsLength: isPartialMode
                ? this.getChunkRanges(audioAdaptiveFormat, true).length
                : 1,
            getAudioBuffers: async function* () {
                yield* isPartialMode
                    ? this.getPartialAudioBuffers(audioAdaptiveFormat, audioUrl)
                    : this.getAudioBuffers(audioAdaptiveFormat, audioUrl);
            }.bind(this),
        };
    }
}

;// ./src/index.js


























const browserInfo = es5.getParser(window.navigator.userAgent).getResult();

function genOptionsByOBJ(obj, conditionString) {
  return obj.map((code) => ({
    label: localizationProvider.get("langs")[code] ?? code.toUpperCase(),
    value: code,
    selected: conditionString === code,
  }));
}

const createHotkeyText = (hotkey) =>
  hotkey
    ? localizationProvider
        .get("VOTChangeHotkeyWithCurrent")
        .replace("{0}", hotkey.replace("Key", ""))
    : localizationProvider.get("VOTCreateTranslationHotkey");

class VideoHandler {
  /**
   * default language of video
   *
   * @type {import("./index").VideoHandler['translateFromLang']}
   */
  translateFromLang = "en";

  /**
   * default language of audio response
   *
   * @type {import("./index").VideoHandler['translateToLang']}
   */
  translateToLang = lang;

  /**
   * @type {import("./index").VideoHandler['timer']}
   */
  timer;

  /**
   * @type {import("./index").VideoHandler['videoData']}
   */
  videoData = "";

  /**
   * @type {import("./index").VideoHandler['firstPlay']}
   */
  firstPlay = true;

  /**
   * @type {import("./index").VideoHandler['audioContext']}
   */
  audioContext = initAudioContext();

  hls = initHls(); // debug enabled only in dev mode
  /**
   * @type {import("@vot.js/ext").default}
   */
  votClient;

  /**
   * @type {import("chaimu").default}
   */
  audioPlayer;

  videoTranslations = [];
  videoTranslationTTL = 7200;
  cachedTranslation;

  downloadTranslationUrl = null;

  autoRetry;
  streamPing;
  votOpts;
  volumeOnStart;
  tempOriginalVolume; // temp video volume for syncing
  tempVolume; // temp translation volume for syncing
  firstSyncVolume = true; // used for skip 1st syncing with observer

  subtitlesList = [];
  subtitlesListVideoId = null;

  /**
   * button move
   *
   * @type {import("./index").VideoHandler['dragging']}
   */
  dragging;

  /**
   * Constructor function for VideoHandler class.
   *
   * @param {Object} video - The video element to handle.
   * @param {Object} container - The container element for the video.
   * @param {Object} site - The site object associated with the video.
   */
  constructor(video, container, site) {
    debug.log(
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
    this.init();
  }

  /**
   * Translate a video based on the specified languages.
   *
   * @param {Object} videoData - The data of the video to be translated.
   * @param {string} requestLang - The language code for the requested translation.
   * @param {string} responseLang - The language code for the desired translated output.
   * @param {Object} [translationHelp=null] - Additional translation help data (optional).
   * @return {Promise} A Promise that resolves to the translated video data.
   */
  async translateVideoImpl(
    videoData,
    requestLang,
    responseLang,
    translationHelp = null,
  ) {
    clearTimeout(this.autoRetry);
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );

    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) !==
      videoData.videoId
    ) {
      return null;
    }

    try {
      const res = await this.votClient.translateVideo({
        videoData,
        requestLang,
        responseLang,
        translationHelp,
        extraOpts: {
          useNewModel: this.data?.useNewModel,
        },
      });
      debug.log("Translate video result", res);
      if (res.translated && res.remainingTime < 1) {
        debug.log("Video translation finished with this data: ", res);
        return res;
      }

      await this.updateTranslationErrorMsg(
        res.remainingTime > 0
          ? secsToStrTime(res.remainingTime)
          : res.message ??
              localizationProvider.get("translationTakeFewMinutes"),
      );
    } catch (err) {
      console.error("[VOT] Failed to translate video", err);
      await this.updateTranslationErrorMsg(err.data?.message ?? err);
      return null;
    }

    return new Promise((resolve) => {
      const timeoutDuration = this.subtitlesList.some(
        (item) => item.source === "yandex",
      )
        ? 20_000
        : 30_000;
      this.autoRetry = setTimeout(async () => {
        const res = await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
        );
        if (!res || (res.translated && res.remainingTime < 1)) {
          resolve(res);
        }
      }, timeoutDuration);
    });
  }

  /**
   * Translate a video stream based on the specified languages.
   *
   * @param {Object} videoData - The data of the video stream to be translated.
   * @param {string} requestLang - The language code for the requested translation.
   * @param {string} responseLang - The language code for the desired translated output.
   * @return {Promise} A Promise that resolves to the translated video stream data.
   */
  async translateStreamImpl(videoData, requestLang, responseLang) {
    clearTimeout(this.autoRetry);
    debug.log(
      videoData,
      `Translate stream (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );

    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) !==
      videoData.videoId
    ) {
      return null;
    }

    try {
      const res = await this.votClient.translateStream({
        videoData,
        requestLang,
        responseLang,
      });
      debug.log("Translate stream result", res);
      if (!res.translated && res.interval === 10) {
        await this.updateTranslationErrorMsg(
          localizationProvider.get("translationTakeFewMinutes"),
        );
        return new Promise((resolve) => {
          this.autoRetry = setTimeout(async () => {
            const res = await this.translateStreamImpl(
              videoData,
              requestLang,
              responseLang,
            );
            if (!res || !(!res.translated && res.interval === 10)) {
              resolve(res);
            }
          }, res.interval * 1000);
        });
      }

      if (res.message) {
        debug.log(`Stream translation aborted! Message: ${res.message}`);
        throw new VOTLocalizedError("streamNoConnectionToServer");
      }

      if (!res.result) {
        debug.log("Failed to find translation result! Data:", res);
        throw new VOTLocalizedError("audioNotReceived");
      }

      debug.log("Stream translated successfully. Running...", res);

      this.streamPing = setInterval(async () => {
        debug.log("Ping stream translation", res.pingId);
        this.votClient.pingStream({
          pingId: res.pingId,
        });
      }, res.interval * 1000);

      return res;
    } catch (err) {
      console.error("[VOT] Failed to translate stream", err);
      await this.updateTranslationErrorMsg(err.data?.message ?? err);
      return null;
    }
  }

  async autoTranslate() {
    if (
      !(
        this.firstPlay &&
        this.data.autoTranslate === 1 &&
        this.videoData.videoId
      )
    )
      return;
    this.firstPlay = false;
    try {
      await this.translateExecutor(this.videoData.videoId);
    } catch (err) {
      console.error("[VOT]", err);
      this.transformBtn(
        "error",
        err?.name === "VOTLocalizedError" ? err.localizedMessage : err,
      );
    }
  }

  getPreferAudio() {
    if (!this.audioContext) {
      return true;
    }

    if (!this.data.newAudioPlayer) {
      return true;
    }

    if (this.videoData.isStream) {
      // streams use old player for work with hls
      return true;
    }

    if (this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP) {
      return false;
    }

    return !this.site.needBypassCSP;
  }

  createPlayer() {
    const preferAudio = this.getPreferAudio();
    debug.log("preferAudio:", preferAudio);
    this.audioPlayer = new Chaimu({
      video: this.video,
      debug: true,
      fetchFn: GM_fetch,
      preferAudio,
    });
    return this;
  }

  /**
   * Initializes the VideoHandler class by setting up data promises, fetching data, initializing UI elements, and setting up event listeners.
   */
  async init() {
    if (this.initialized) return;

    const dataPromises = {
      autoTranslate: votStorage.get("autoTranslate", 0),
      dontTranslateLanguage: votStorage.get("dontTranslateLanguage", lang),
      dontTranslateYourLang: votStorage.get("dontTranslateYourLang", 1),
      autoSetVolumeYandexStyle: votStorage.get("autoSetVolumeYandexStyle", 1),
      autoVolume: votStorage.get("autoVolume", defaultAutoVolume),
      buttonPos: votStorage.get("buttonPos", "default"),
      showVideoSlider: votStorage.get("showVideoSlider", 1),
      syncVolume: votStorage.get("syncVolume", 0),
      downloadWithName: votStorage.get("downloadWithName", 1),
      subtitlesMaxLength: votStorage.get("subtitlesMaxLength", 300),
      highlightWords: votStorage.get("highlightWords", 0),
      subtitlesFontSize: votStorage.get("subtitlesFontSize", 20),
      subtitlesOpacity: votStorage.get("subtitlesOpacity", 20),
      subtitlesDownloadFormat: votStorage.get("subtitlesDownloadFormat", "srt"),
      responseLanguage: votStorage.get("responseLanguage", lang),
      defaultVolume: votStorage.get("defaultVolume", 100),
      audioProxy: votStorage.get("audioProxy", 0),
      onlyBypassMediaCSP: votStorage.get(
        "onlyBypassMediaCSP",
        Number(!!this.audioContext),
      ),
      newAudioPlayer: votStorage.get(
        "newAudioPlayer",
        Number(!!this.audioContext),
      ),
      showPiPButton: votStorage.get("showPiPButton", 0),
      translateAPIErrors: votStorage.get("translateAPIErrors", 1),
      translationService: votStorage.get(
        "translationService",
        defaultTranslationService,
      ),
      detectService: votStorage.get("detectService", defaultDetectService),
      hotkeyButton: votStorage.get("hotkeyButton", null),
      m3u8ProxyHost: votStorage.get("m3u8ProxyHost", m3u8ProxyHost),
      translateProxyEnabled: votStorage.get("translateProxyEnabled", 0),
      proxyWorkerHost: votStorage.get("proxyWorkerHost", proxyWorkerHost),
      audioBooster: votStorage.get("audioBooster", 0),
      useNewModel: votStorage.get("useNewModel", 1),
      localeHash: votStorage.get("locale-hash", ""),
      localeUpdatedAt: votStorage.get("locale-updated-at", 0),
    };

    this.data = Object.fromEntries(
      await Promise.all(
        Object.entries(dataPromises).map(async ([key, promise]) => [
          key,
          await promise,
        ]),
      ),
    );

    console.log("[VOT] data from db: ", this.data);

    // convert old m3u8-proxy-worker to new media-proxy
    if (this.data.m3u8ProxyHost === "m3u8-proxy.toil.cc") {
      this.data.m3u8ProxyHost = m3u8ProxyHost;
      await votStorage.set("m3u8ProxyHost", m3u8ProxyHost);
      console.log(
        `[VOT] Old m3u8 proxy host converted to new ${this.data.m3u8ProxyHost} media-proxy`,
      );
    }

    // convert old vot-worker domain to actual
    // TODO: remove converter in one of the next versions after release 1.7.0
    if (this.data.proxyWorkerHost === "vot.toil.cc") {
      this.data.proxyWorkerHost = proxyWorkerHost;
      await votStorage.set("proxyWorkerHost", proxyWorkerHost);
      console.log(
        `[VOT] Old proxy worker host converted to new ${this.data.proxyWorkerHost}`,
      );
    }

    if (
      !this.data.translateProxyEnabled &&
      GM_info?.scriptHandler &&
      proxyOnlyExtensions.includes(GM_info.scriptHandler)
    ) {
      this.data.translateProxyEnabled = 1;
      await votStorage.set("translateProxyEnabled", 1);
      debug.log("translateProxyEnabled", this.data.translateProxyEnabled);
    }

    debug.log("Extension compatibility passed...");

    this.votOpts = {
      headers: this.data.translateProxyEnabled
        ? {}
        : {
            "sec-ch-ua": null,
            "sec-ch-ua-mobile": null,
            "sec-ch-ua-platform": null,
            // "sec-ch-ua-model": null,
            // "sec-ch-ua-platform-version": null,
            // "sec-ch-ua-wow64": null,
            // "sec-ch-ua-arch": null,
            // "sec-ch-ua-bitness": null,
            // "sec-ch-ua-full-version": null,
            // "sec-ch-ua-full-version-list": null,
          },
      fetchFn: GM_fetch,
      hostVOT: votBackendUrl,
      host: this.data.translateProxyEnabled
        ? this.data.proxyWorkerHost
        : workerHost,
    };

    this.votClient = new (
      this.data.translateProxyEnabled ? VOTWorkerClient : VOTClient
    )(this.votOpts);

    this.subtitlesWidget = new SubtitlesWidget(
      this.video,
      this.container,
      this.site,
    );
    this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
    this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
    this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
    this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);

    this.initUI();
    this.initUIEvents();

    this.videoData = await this.getVideoData();
    this.createPlayer();
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.data.responseLanguage ?? "ru",
    );

    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.initExtraEvents();

    await Promise.all([this.updateSubtitles(), this.autoTranslate()]);

    this.initialized = true;
  }

  /**
   * Set translation button status and text
   *
   * @type {import('./index').VideoHandler['transformBtn']}
   */
  transformBtn(status, text) {
    this.votButton.container.dataset.status = status;
    const isLoading =
      status === "error" &&
      text.includes(localizationProvider.get("translationTake"));
    this.setLoadingBtn(isLoading);
    this.votButton.label.textContent = text;
    this.votButton.container.title = status === "error" ? text : "";
    return this;
  }

  /**
   * Set loading icon to translation button
   *
   * @type {import('./index').VideoHandler['setLoadingBtn']}
   */
  setLoadingBtn(loading = false) {
    this.votButton.container.dataset.loading = loading;
    return this;
  }

  initUI() {
    // VOT Button
    {
      this.votButton = ui.createVOTButton(
        localizationProvider.get("translateVideo"),
      );
      this.votButton.container.style.opacity = 0;

      // use an additional check because sometimes this.video.clientWidth = 0
      if (
        this.data?.buttonPos &&
        this.data?.buttonPos !== "default" &&
        this.container.clientWidth > 550
      ) {
        this.votButton.container.dataset.direction = "column";
        this.votButton.container.dataset.position = this.data?.buttonPos;
      } else {
        this.votButton.container.dataset.direction = "row";
        this.votButton.container.dataset.position = "default";
      }
      this.container.appendChild(this.votButton.container);

      this.votButton.pipButton.hidden =
        !isPiPAvailable() || !this.data?.showPiPButton;
      this.votButton.separator2.hidden =
        !isPiPAvailable() || !this.data?.showPiPButton;

      this.votButton.container.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }

    // VOT Menu
    {
      this.votMenu = ui.createVOTMenu(localizationProvider.get("VOTSettings"));
      this.votMenu.container.dataset.position =
        this.container.clientWidth && this.container.clientWidth > 550
          ? this.data?.buttonPos
          : "default";
      this.container.appendChild(this.votMenu.container);

      this.votDownloadButton = ui.createIconButton(
        Oe`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 0 24 24"
          class="vot-loader"
          id="vot-loader-download"
        >
          <path
            class="vot-loader-main"
            d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"
          />
          <path class="vot-loader-helper" d="" />
        </svg>`,
      );
      this.votDownloadButton.hidden = true;
      this.votMenu.headerContainer.appendChild(this.votDownloadButton);

      this.votDownloadSubtitlesButton = ui.createIconButton(
        Oe`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.588 1.413T20 20H4Zm2-4h8v-2H6v2Zm10 0h2v-2h-2v2ZM6 12h2v-2H6v2Zm4 0h8v-2h-8v2Z"
          />
        </svg>`,
      );
      this.votDownloadSubtitlesButton.hidden = true;
      this.votMenu.headerContainer.appendChild(this.votDownloadSubtitlesButton);

      this.votSettingsButton = ui.createIconButton(
        Oe`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 -960 960 960"
        >
          <path
            d="M555-80H405q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-344q-8-13-5-28t15-24l75-57q-1-7-1-13.5v-27q0-6.5 1-13.5l-75-57q-12-9-15-24t5-28l74-129q7-14 21.5-17.5T220-761l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 129q8 13 5 28t-15 24l-75 57q1 7 1 13.5v27q0 6.5-2 13.5l75 57q12 9 15 24t-5 28l-74 128q-8 13-22.5 17.5T738-199l-85-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10Zm-73-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm0-80q-25 0-42.5-17.5T422-480q0-25 17.5-42.5T482-540q25 0 42.5 17.5T542-480q0 25-17.5 42.5T482-420Zm-2-60Zm-40 320h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Z"
          />
        </svg>`,
      );
      this.votMenu.headerContainer.appendChild(this.votSettingsButton);

      this.votTranslationLanguageSelect = ui.createVOTLanguageSelect({
        fromTitle:
          localizationProvider.get("langs")[this.video.detectedLanguage],
        fromDialogTitle: localizationProvider.get("videoLanguage"),
        fromItems: genOptionsByOBJ(
          availableLangs,
          this.videoData.detectedLanguage,
        ),
        fromOnSelectCB: async (e) => {
          debug.log(
            "[fromOnSelectCB] select from language",
            e.target.dataset.votValue,
          );
          this.videoData = await this.getVideoData();
          this.setSelectMenuValues(
            e.target.dataset.votValue,
            this.videoData.responseLanguage,
          );
        },
        toTitle: localizationProvider.get("langs")[this.video.responseLanguage],
        toDialogTitle: localizationProvider.get("translationLanguage"),
        toItems: genOptionsByOBJ(availableTTS, this.videoData.responseLanguage),
        toOnSelectCB: async (e) => {
          const newLang = e.target.dataset.votValue;
          debug.log("[toOnSelectCB] select to language", newLang);
          this.data.responseLanguage = this.translateToLang = newLang;
          await votStorage.set("responseLanguage", this.data.responseLanguage);
          debug.log(
            "Response Language value changed. New value: ",
            this.data.responseLanguage,
          );
          this.videoData = await this.getVideoData();
          this.setSelectMenuValues(
            this.videoData.detectedLanguage,
            this.data.responseLanguage,
          );
        },
      });

      this.votMenu.bodyContainer.appendChild(
        this.votTranslationLanguageSelect.container,
      );

      this.votSubtitlesSelect = ui.createVOTSelect(
        localizationProvider.get("VOTSubtitlesDisabled"),
        localizationProvider.get("VOTSubtitles"),
        [
          {
            label: localizationProvider.get("VOTSubtitlesDisabled"),
            value: "disabled",
            selected: true,
            disabled: false,
          },
        ],
        {
          onSelectCb: async (e) => {
            await this.changeSubtitlesLang(e.target.dataset.votValue);
          },
          labelElement: ui.createVOTSelectLabel(
            localizationProvider.get("VOTSubtitles"),
          ),
        },
      );

      this.votMenu.bodyContainer.appendChild(this.votSubtitlesSelect.container);

      this.votVideoVolumeSlider = ui.createSlider(
        ke`${localizationProvider.get("VOTVolume")}:
          <strong>${this.getVideoVolume() * 100}%</strong>`,
        this.getVideoVolume() * 100,
      );
      this.votVideoVolumeSlider.container.hidden =
        this.data.showVideoSlider !== 1 ||
        this.votButton.container.dataset.status !== "success";
      this.votMenu.bodyContainer.appendChild(
        this.votVideoVolumeSlider.container,
      );

      this.votVideoTranslationVolumeSlider = ui.createSlider(
        ke`${localizationProvider.get("VOTVolumeTranslation")}:
          <strong>${this.data?.defaultVolume ?? 100}%</strong>`,
        this.data?.defaultVolume ?? 100,
        0,
        this.data.audioBooster ? maxAudioVolume : 100,
      );
      this.votVideoTranslationVolumeSlider.container.hidden =
        this.votButton.container.dataset.status !== "success";
      this.votMenu.bodyContainer.appendChild(
        this.votVideoTranslationVolumeSlider.container,
      );

      this.votMenu.container.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }

    // VOT Settings
    {
      this.votSettingsDialog = ui.createDialog(
        localizationProvider.get("VOTSettings"),
      );
      document.documentElement.appendChild(this.votSettingsDialog.container);

      this.votTranslationHeader = ui.createHeader(
        localizationProvider.get("translationSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votTranslationHeader,
      );

      this.votAutoTranslateCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTAutoTranslate"),
        this.data?.autoTranslate ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoTranslateCheckbox.container,
      );

      this.votDontTranslateYourLangSelect = ui.createVOTSelect(
        localizationProvider.get("langs")[this.data.dontTranslateLanguage],
        localizationProvider.get("VOTDontTranslateYourLang"),
        genOptionsByOBJ(availableLangs, this.data.dontTranslateLanguage),
        {
          onSelectCb: async (e) => {
            this.data.dontTranslateLanguage = e.target.dataset.votValue;
            await votStorage.set(
              "dontTranslateLanguage",
              this.data.dontTranslateLanguage,
            );
          },
          labelElement: ui.createCheckbox(
            localizationProvider.get("VOTDontTranslateYourLang"),
            this.data?.dontTranslateYourLang ?? true,
          ).container,
        },
      );

      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDontTranslateYourLangSelect.container,
      );

      this.changehotkeyButton = ui.createOutlinedButton(
        createHotkeyText(this.data.hotkeyButton),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.changehotkeyButton);

      this.votAutoSetVolumeCheckbox = ui.createCheckbox(
        `${localizationProvider.get("VOTAutoSetVolume")}`,
        this.data?.autoSetVolumeYandexStyle ?? true,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoSetVolumeCheckbox.container,
      );
      this.votAutoSetVolumeSlider = ui.createSlider(
        ke`<strong
          >${Math.round(
            (this.data?.autoVolume ?? defaultAutoVolume) * 100,
          )}%</strong
        >`,
        Math.round((this.data?.autoVolume ?? defaultAutoVolume) * 100),
        0,
        100,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoSetVolumeSlider.container,
      );

      this.votShowVideoSliderCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTShowVideoSlider"),
        this.data?.showVideoSlider ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votShowVideoSliderCheckbox.container,
      );

      this.votAudioBoosterCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTAudioBooster"),
        this.data?.audioBooster ?? false,
      );
      if (!this.audioContext) {
        this.votAudioBoosterCheckbox.input.disabled = true;
        this.votAudioBoosterCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAudioBoosterCheckbox.container,
      );

      this.votSyncVolumeCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTSyncVolume"),
        this.data?.syncVolume ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votSyncVolumeCheckbox.container,
      );

      this.votDownloadWithNameCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTDownloadWithName"),
        this.data?.downloadWithName ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDownloadWithNameCheckbox.container,
      );

      this.votUseNewModelCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTUseNewModel"),
        this.data?.useNewModel ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votUseNewModelCheckbox.container,
      );

      this.votTranslationServiceSelect = ui.createVOTSelect(
        this.data.translationService.toUpperCase(),
        localizationProvider.get("VOTTranslationService"),
        genOptionsByOBJ(translateServices, this.data.translationService),
        {
          onSelectCb: async (e) => {
            this.data.translationService = e.target.dataset.votValue;
            await votStorage.set(
              "translationService",
              this.data.translationService,
            );
          },
          labelElement: ui.createCheckbox(
            localizationProvider.get("VOTTranslateAPIErrors"),
            this.data.translateAPIErrors ?? true,
          ).container,
        },
      );
      this.votTranslationServiceSelect.container.hidden =
        localizationProvider.lang === "ru";
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votTranslationServiceSelect.container,
      );

      this.votDetectServiceSelect = ui.createVOTSelect(
        this.data.detectService.toUpperCase(),
        localizationProvider.get("VOTDetectService"),
        genOptionsByOBJ(detectServices, this.data.detectService),
        {
          onSelectCb: async (e) => {
            this.data.detectService = e.target.dataset.votValue;
            await votStorage.set("detectService", this.data.detectService);
          },
          labelElement: ui.createVOTSelectLabel(
            localizationProvider.get("VOTDetectService"),
          ),
        },
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDetectServiceSelect.container,
      );

      // SUBTITLES

      this.votSubtitlesHeader = ui.createHeader(
        localizationProvider.get("subtitlesSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.votSubtitlesHeader);

      this.votSubtitlesDetails = ui.createDetails(
        localizationProvider.get("VOTSubtitlesDesign"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votSubtitlesDetails.container,
      );

      // PROXY

      this.votProxyHeader = ui.createHeader(
        localizationProvider.get("proxySettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.votProxyHeader);

      this.votM3u8ProxyHostTextfield = ui.createTextfield(
        localizationProvider.get("VOTM3u8ProxyHost"),
        this.data?.m3u8ProxyHost,
        m3u8ProxyHost,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votM3u8ProxyHostTextfield.container,
      );

      this.votProxyWorkerHostTextfield = ui.createTextfield(
        localizationProvider.get("VOTProxyWorkerHost"),
        this.data?.proxyWorkerHost,
        proxyWorkerHost,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votProxyWorkerHostTextfield.container,
      );

      this.votAudioProxyCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTAudioProxy"),
        this.data?.audioProxy ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAudioProxyCheckbox.container,
      );

      this.votNewAudioPlayerCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTNewAudioPlayer"),
        this.data?.newAudioPlayer ?? false,
      );
      if (!this.audioContext) {
        this.votNewAudioPlayerCheckbox.input.disabled = true;
        this.votNewAudioPlayerCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votNewAudioPlayerCheckbox.container,
      );

      this.votOnlyBypassMediaCSPCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTOnlyBypassMediaCSP") +
          (this.site.needBypassCSP
            ? ` (${localizationProvider.get("VOTMediaCSPEnabledOnSite")})`
            : ""),
        this.data?.onlyBypassMediaCSP ?? false,
      );
      this.votOnlyBypassMediaCSPCheckbox.container.classList.add(
        "vot-checkbox-sub",
      );
      if (!this.audioContext) {
        this.votOnlyBypassMediaCSPCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votOnlyBypassMediaCSPCheckbox.input.disabled =
        !this.data.newAudioPlayer && this.audioContext;
      if (!this.data.newAudioPlayer) {
        this.votOnlyBypassMediaCSPCheckbox.container.hidden = true;
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votOnlyBypassMediaCSPCheckbox.container,
      );

      // ABOUT

      this.votAboutHeader = ui.createHeader(localizationProvider.get("about"));
      this.votSettingsDialog.bodyContainer.appendChild(this.votAboutHeader);

      this.votLanguageSelect = ui.createVOTSelect(
        localizationProvider.get("langs")[
          votStorage.syncGet("locale-lang-override", "auto")
        ],
        localizationProvider.get("VOTMenuLanguage"),
        genOptionsByOBJ(
          availableLocales,
          votStorage.syncGet("locale-lang-override", "auto"),
        ),
        {
          onSelectCb: async (e) => {
            await votStorage.set(
              "locale-lang-override",
              e.target.dataset.votValue,
            );
          },
          labelElement: ui.createVOTSelectLabel(
            localizationProvider.get("VOTMenuLanguage"),
          ),
        },
      );

      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLanguageSelect.container,
      );

      this.votShowPiPButtonCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTShowPiPButton"),
        this.data?.showPiPButton ?? false,
      );
      this.votShowPiPButtonCheckbox.container.hidden = !isPiPAvailable();
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votShowPiPButtonCheckbox.container,
      );

      this.votVersionInfo = ui.createInformation(
        `${localizationProvider.get("VOTVersion")}:`,
        GM_info.script.version,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votVersionInfo.container,
      );

      this.votAuthorsInfo = ui.createInformation(
        `${localizationProvider.get("VOTAuthors")}:`,
        GM_info.script.author,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAuthorsInfo.container,
      );

      this.votLoaderInfo = ui.createInformation(
        `${localizationProvider.get("VOTLoader")}:`,
        `${GM_info.scriptHandler} v${GM_info.version}`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLoaderInfo.container,
      );

      this.votBrowserInfo = ui.createInformation(
        `${localizationProvider.get("VOTBrowser")}:`,
        `${browserInfo.browser.name} ${browserInfo.browser.version} (${browserInfo.os.name} ${browserInfo.os.version})`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votBrowserInfo.container,
      );

      this.votLocaleInfo = ui.createInformation(
        `${localizationProvider.get("VOTLocaleHash")}:`,
        ke`${this.data.localeHash}<br />(${localizationProvider.get(
            "VOTUpdatedAt",
          )}
          ${new Date(this.data.localeUpdatedAt * 1000).toLocaleString()})`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLocaleInfo.container,
      );

      this.votUpdateLocaleFilesButton = ui.createOutlinedButton(
        localizationProvider.get("VOTUpdateLocaleFiles"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votUpdateLocaleFilesButton,
      );

      this.votResetSettingsButton = ui.createButton(
        localizationProvider.get("resetSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votResetSettingsButton,
      );
    }
  }

  async handleTranslationBtnClick() {
    debug.log(
      "[click translationBtn]",
      this.audioPlayer,
      this.audioPlayer.player,
    );
    if (this.audioPlayer.player.src) {
      debug.log(
        "[click translationBtn] audio.src is not empty",
        this.audioPlayer.player.src,
      );
      this.stopTranslate();
      return;
    }

    if (this.hls.url) {
      debug.log("[click translationBtn] hls is not empty", this.hls.url);
      this.stopTranslate();
      return;
    }

    try {
      debug.log("[click translationBtn] trying execute translation");

      if (!this.videoData.videoId) {
        throw new VOTLocalizedError("VOTNoVideoIDFound");
      }

      // при скролле ленты клипов в вк сохраняется старый айди видео для перевода,
      // но для субтитров используется новый, поэтому перед запуском перевода необходимо получить актуальный айди
      if (this.site.host === "vk" && this.site.additionalData === "clips") {
        this.videoData = await this.getVideoData();
      }
      await this.translateExecutor(this.videoData.videoId);
    } catch (err) {
      console.error("[VOT]", err);
      if (err?.name === "VOTLocalizedError") {
        this.transformBtn("error", err.localizedMessage);
      } else {
        this.transformBtn("error", err?.message);
      }
    }
  }

  initUIEvents() {
    // VOT Button
    {
      this.votButton.translateButton.addEventListener("click", async () => {
        await this.handleTranslationBtnClick();
      });

      this.votButton.pipButton.addEventListener("click", () => {
        (async () => {
          if (this.video !== document.pictureInPictureElement) {
            await this.video.requestPictureInPicture();
          } else {
            await document.exitPictureInPicture();
          }
        })();
      });

      this.votButton.menuButton.addEventListener("click", () => {
        this.votMenu.container.hidden = !this.votMenu.container.hidden;
      });

      this.votButton.container.addEventListener("mousedown", () => {
        this.dragging = true;
      });

      this.container.addEventListener("mouseup", () => {
        this.dragging = false;
      });

      this.container.addEventListener("mousemove", async (e) => {
        if (this.dragging) {
          e.preventDefault();

          const percentX = (e.clientX / this.container.clientWidth) * 100;
          // const percentY = (e.clientY / this.video.clientHeight) * 100;
          const isBigContainer = this.container.clientWidth > 550;
          const isLeft = percentX <= 44;
          const isRightSide = percentX >= 66 ? "right" : "default";
          const side = isLeft ? "left" : isRightSide;

          this.data.buttonPos = isBigContainer ? side : "default";
          this.votButton.container.dataset.direction =
            this.data.buttonPos === "default" ? "row" : "column";
          this.votButton.container.dataset.position = this.data.buttonPos;
          this.votMenu.container.dataset.position = this.data.buttonPos;
          if (isBigContainer) {
            await votStorage.set("buttonPos", this.data.buttonPos);
          }
        }
      });
    }

    // VOT Menu
    {
      this.votDownloadButton.addEventListener("click", async () => {
        if (!this.downloadTranslationUrl) {
          return;
        }

        if (!this.data.downloadWithName) {
          return window.open(this.downloadTranslationUrl, "_blank").focus();
        }

        const votLoader = document.querySelector("#vot-loader-download");
        const primaryColor = getComputedStyle(
          this.votMenu.container,
        ).getPropertyValue("--vot-primary-rgb");
        const updateAnimation = ui.animateLoader(votLoader, primaryColor);

        const res = await GM_fetch(this.downloadTranslationUrl);
        const reader = res.body.getReader();
        const contentLength = +res.headers.get("Content-Length");

        let receivedLength = 0;
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;
          updateAnimation(Math.round((receivedLength / contentLength) * 100));
        }

        ui.afterAnimateLoader(votLoader, primaryColor);
        const blob = new Blob(chunks);
        const filename = clearFileName(
          this.videoData.title ?? this.videoData.videoId,
        );
        const arrayBuffer = await blob.arrayBuffer();
        const writer = new o(arrayBuffer);
        writer.setFrame("TIT2", filename);
        writer.addTag();
        downloadBlob(writer.getBlob(), `${filename}.mp3`);
      });

      this.votDownloadSubtitlesButton.addEventListener("click", async () => {
        const format = this.data.subtitlesDownloadFormat;
        const subsContent = convertSubs(this.yandexSubtitles, format);
        const blob = new Blob(
          [format === "json" ? JSON.stringify(subsContent) : subsContent],
          {
            type: "text/plain",
          },
        );

        const filename = this.data.downloadWithName
          ? clearFileName(this.videoData.title ?? this.videoData.videoId)
          : `subtitles_${this.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${format}`);
      });

      this.votSettingsButton.addEventListener("click", () => {
        this.votSettingsDialog.container.hidden =
          !this.votSettingsDialog.container.hidden;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          document.webkitExitFullscreen && document.webkitExitFullscreen();
          document.exitFullscreen && document.exitFullscreen();
        }
      });

      this.votVideoVolumeSlider.input.addEventListener("input", (e) => {
        const value = Number(e.target.value);
        this.votVideoVolumeSlider.label.querySelector(
          "strong",
        ).textContent = `${value}%`;
        this.setVideoVolume(value / 100);
        if (this.data.syncVolume) {
          this.syncVolumeWrapper("video", value);
        }
      });

      this.votVideoTranslationVolumeSlider.input.addEventListener(
        "input",
        (e) => {
          (async () => {
            this.data.defaultVolume = Number(e.target.value);
            await votStorage.set("defaultVolume", this.data.defaultVolume);
            this.votVideoTranslationVolumeSlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.defaultVolume}%`;
            this.audioPlayer.player.volume = this.data.defaultVolume / 100;
            if (!this.data.syncVolume) {
              return;
            }

            this.syncVolumeWrapper("translation", this.data.defaultVolume);
            if (
              ["youtube", "googledrive"].includes(this.site.host) &&
              this.site.additionalData !== "mobile"
            ) {
              // fix update youtube volume slider
              this.setVideoVolume(this.tempOriginalVolume / 100);
            }
          })();
        },
      );
    }

    // VOT Settings
    {
      this.votAutoTranslateCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.autoTranslate = Number(e.target.checked);
          await Promise.all([
            votStorage.set("autoTranslate", this.data.autoTranslate),
            this.autoTranslate(),
          ]);
          debug.log(
            "autoTranslate value changed. New value: ",
            this.data.autoTranslate,
          );
        })();
      });

      this.votDontTranslateYourLangSelect.labelElement.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.dontTranslateYourLang = Number(e.target.checked);
            await votStorage.set(
              "dontTranslateYourLang",
              this.data.dontTranslateYourLang,
            );
            debug.log(
              "dontTranslateYourLang value changed. New value: ",
              this.data.dontTranslateYourLang,
            );
          })();
        },
      );

      const updateHotkey = async (newKey) => {
        await votStorage.set("hotkeyButton", newKey);
        this.data.hotkeyButton = newKey;
        this.changehotkeyButton.textContent = createHotkeyText(newKey);
      };

      const keydownHandler = (e) => {
        const newKey = e.code === "Escape" ? null : e.code;
        updateHotkey(newKey);
        document.removeEventListener("keydown", keydownHandler);
      };

      this.changehotkeyButton.addEventListener("click", () => {
        this.changehotkeyButton.textContent =
          localizationProvider.get("VOTPressNewHotkey");
        document.addEventListener("keydown", keydownHandler);
      });

      this.votAutoSetVolumeCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.autoSetVolumeYandexStyle = Number(e.target.checked);
          await votStorage.set(
            "autoSetVolumeYandexStyle",
            this.data.autoSetVolumeYandexStyle,
          );
          debug.log(
            "autoSetVolumeYandexStyle value changed. New value: ",
            this.data.autoSetVolumeYandexStyle,
          );
        })();
      });

      this.votAutoSetVolumeSlider.input.addEventListener("input", (e) => {
        (async () => {
          const presetAutoVolume = Number(e.target.value);
          this.data.autoVolume = (presetAutoVolume / 100).toFixed(2);
          await votStorage.set("autoVolume", this.data.autoVolume);
          this.votAutoSetVolumeSlider.label.querySelector(
            "strong",
          ).textContent = `${presetAutoVolume}%`;
        })();
      });

      this.votShowVideoSliderCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.showVideoSlider = Number(e.target.checked);
          await votStorage.set("showVideoSlider", this.data.showVideoSlider);
          debug.log(
            "showVideoSlider value changed. New value: ",
            this.data.showVideoSlider,
          );
          this.votVideoVolumeSlider.container.hidden =
            this.data.showVideoSlider !== 1 ||
            this.votButton.container.dataset.status !== "success";
        })();
      });

      this.votAudioBoosterCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.audioBooster = Number(e.target.checked);
          await votStorage.set("audioBooster", this.data.audioBooster);
          debug.log(
            "audioBooster value changed. New value: ",
            this.data.audioBooster,
          );

          const currentAudioVolume =
            this.votVideoTranslationVolumeSlider.input.value;
          this.votVideoTranslationVolumeSlider.input.max = this.data
            .audioBooster
            ? maxAudioVolume
            : 100;
          if (!this.data.audioBooster) {
            this.votVideoTranslationVolumeSlider.input.value =
              currentAudioVolume > 100 ? 100 : currentAudioVolume;
            this.votVideoTranslationVolumeSlider.input.dispatchEvent(
              new Event("input"),
            );
          }
        })();
      });

      this.votSyncVolumeCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.syncVolume = Number(e.target.checked);
          await votStorage.set("syncVolume", this.data.syncVolume);
          debug.log(
            "syncVolume value changed. New value: ",
            this.data.syncVolume,
          );
        })();
      });

      this.votDownloadWithNameCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.downloadWithName = Number(e.target.checked);
          await votStorage.set("downloadWithName", this.data.downloadWithName);
          debug.log(
            "downloadWithName value changed. New value: ",
            this.data.downloadWithName,
          );
        })();
      });

      this.votUseNewModelCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.useNewModel = Number(e.target.checked);
          await votStorage.set("useNewModel", this.data.useNewModel);
          debug.log(
            "useNewModel value changed. New value: ",
            this.data.useNewModel,
          );
          this.stopTranslate();
        })();
      });

      this.votTranslationServiceSelect.labelElement.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.translateAPIErrors = Number(e.target.checked);
            await votStorage.set(
              "translateAPIErrors",
              this.data.translateAPIErrors,
            );
            debug.log(
              "translateAPIErrors value changed. New value: ",
              this.data.translateAPIErrors,
            );
          })();
        },
      );

      // SUBTITLES

      this.votSubtitlesDetails.container.addEventListener("click", () => {
        this.votSubtitlesDialog = ui.createDialog(
          localizationProvider.get("VOTSubtitlesDesign"),
        );
        this.votSubtitlesDialog.container.classList.add("vot-dialog-temp");
        this.votSubtitlesDialog.container.hidden = false;
        // remove the modal so that they do not accumulate
        this.votSubtitlesDialog.backdrop.onclick =
          this.votSubtitlesDialog.closeButton.onclick = () => {
            this.votSubtitlesDialog.container.remove();
          };

        // subtitles elements
        this.votSubtitlesHighlightWordsCheckbox = ui.createCheckbox(
          localizationProvider.get("VOTHighlightWords"),
          this.data?.highlightWords ?? false,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesHighlightWordsCheckbox.container,
        );

        this.votSubtitlesDownloadFormatSelect = ui.createVOTSelect(
          this.data.subtitlesDownloadFormat.toUpperCase(),
          localizationProvider.get("VOTSubtitlesDownloadFormat"),
          genOptionsByOBJ(subtitlesFormats, this.data.subtitlesDownloadFormat),
          {
            onSelectCb: async (e) => {
              this.data.subtitlesDownloadFormat = e.target.dataset.votValue;
              await votStorage.set(
                "subtitlesDownloadFormat",
                this.data.subtitlesDownloadFormat,
              );
            },
            labelElement: ui.createVOTSelectLabel(
              localizationProvider.get("VOTSubtitlesDownloadFormat"),
            ),
          },
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesDownloadFormatSelect.container,
        );

        this.votSubtitlesMaxLengthSlider = ui.createSlider(
          ke`${localizationProvider.get("VOTSubtitlesMaxLength")}:
            <strong>${this.data?.subtitlesMaxLength ?? 300}</strong>`,
          this.data?.subtitlesMaxLength ?? 300,
          50,
          300,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesMaxLengthSlider.container,
        );

        this.votSubtitlesFontSizeSlider = ui.createSlider(
          ke`${localizationProvider.get("VOTSubtitlesFontSize")}:
            <strong>${this.data?.subtitlesFontSize ?? 20}</strong>`,
          this.data?.subtitlesFontSize ?? 20,
          8,
          50,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesFontSizeSlider.container,
        );

        this.votSubtitlesOpacitySlider = ui.createSlider(
          ke`${localizationProvider.get("VOTSubtitlesOpacity")}:
            <strong>${this.data?.subtitlesOpacity ?? 20}</strong>`,
          this.data?.subtitlesOpacity ?? 20,
          0,
          100,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesOpacitySlider.container,
        );

        // subtitles events
        this.votSubtitlesHighlightWordsCheckbox.input.addEventListener(
          "change",
          (e) => {
            (async () => {
              this.data.highlightWords = Number(e.target.checked);
              await votStorage.set("highlightWords", this.data.highlightWords);
              debug.log(
                "highlightWords value changed. New value: ",
                this.data.highlightWords,
              );
              this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
            })();
          },
        );

        this.votSubtitlesMaxLengthSlider.input.addEventListener(
          "input",
          (e) => {
            (async () => {
              this.data.subtitlesMaxLength = Number(e.target.value);
              await votStorage.set(
                "subtitlesMaxLength",
                this.data.subtitlesMaxLength,
              );
              this.votSubtitlesMaxLengthSlider.label.querySelector(
                "strong",
              ).textContent = `${this.data.subtitlesMaxLength}`;
              this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
            })();
          },
        );

        this.votSubtitlesFontSizeSlider.input.addEventListener("input", (e) => {
          (async () => {
            this.data.subtitlesFontSize = Number(e.target.value);
            await votStorage.set(
              "subtitlesFontSize",
              this.data.subtitlesFontSize,
            );
            this.votSubtitlesFontSizeSlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.subtitlesFontSize}`;
            this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
          })();
        });

        this.votSubtitlesOpacitySlider.input.addEventListener("input", (e) => {
          (async () => {
            this.data.subtitlesOpacity = Number(e.target.value);
            await votStorage.set(
              "subtitlesOpacity",
              this.data.subtitlesOpacity,
            );
            this.votSubtitlesOpacitySlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.subtitlesOpacity}`;
            this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);
          })();
        });

        document.documentElement.appendChild(this.votSubtitlesDialog.container);
      });

      // OTHER

      this.votShowPiPButtonCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.showPiPButton = Number(e.target.checked);
          await votStorage.set("showPiPButton", this.data.showPiPButton);
          debug.log(
            "showPiPButton value changed. New value: ",
            this.data.showPiPButton,
          );
          this.votButton.pipButton.hidden =
            !isPiPAvailable() || !this.data.showPiPButton;
          this.votButton.separator2.hidden =
            !isPiPAvailable() || !this.data.showPiPButton;
        })();
      });

      // PROXY

      this.votM3u8ProxyHostTextfield.input.addEventListener("change", (e) => {
        (async () => {
          this.data.m3u8ProxyHost = e.target.value || m3u8ProxyHost;
          await votStorage.set("m3u8ProxyHost", this.data.m3u8ProxyHost);
          debug.log(
            "m3u8ProxyHost value changed. New value: ",
            this.data.m3u8ProxyHost,
          );
        })();
      });

      this.votProxyWorkerHostTextfield.input.addEventListener("change", (e) => {
        (async () => {
          this.data.proxyWorkerHost = e.target.value || proxyWorkerHost;
          await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
          debug.log(
            "proxyWorkerHost value changed. New value: ",
            this.data.proxyWorkerHost,
          );
          if (this.data.translateProxyEnabled) {
            this.votClient.host = this.data.proxyWorkerHost;
          }
        })();
      });

      this.votAudioProxyCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.audioProxy = Number(e.target.checked);
          await votStorage.set("audioProxy", this.data.audioProxy);
          debug.log(
            "audioProxy value changed. New value: ",
            this.data.audioProxy,
          );
        })();
      });

      this.votOnlyBypassMediaCSPCheckbox.input.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.onlyBypassMediaCSP = Number(e.target.checked);
            await votStorage.set(
              "onlyBypassMediaCSP",
              this.data.onlyBypassMediaCSP,
            );
            debug.log(
              "onlyBypassMediaCSP value changed. New value: ",
              this.data.onlyBypassMediaCSP,
            );
            this.stopTranslate();
            this.createPlayer();
          })();
        },
      );

      this.votNewAudioPlayerCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          const checked = e.target.checked;
          this.data.newAudioPlayer = Number(checked);
          await votStorage.set("newAudioPlayer", this.data.newAudioPlayer);
          debug.log(
            "newAudioPlayer value changed. New value: ",
            this.data.newAudioPlayer,
          );
          this.stopTranslate();
          this.createPlayer();

          this.votOnlyBypassMediaCSPCheckbox.input.disabled =
            this.votOnlyBypassMediaCSPCheckbox.container.hidden = !checked;
        })();
      });

      this.votUpdateLocaleFilesButton.addEventListener("click", () => {
        (async () => {
          await votStorage.set("locale-hash", "");
          await localizationProvider.update(true);
          window.location.reload();
        })();
      });

      this.votResetSettingsButton.addEventListener("click", () => {
        (async () => {
          localizationProvider.reset();
          const valuesForClear = await votStorage.list();
          for (let i = 0; i < valuesForClear.length; i++) {
            const v = valuesForClear[i];
            if (!localizationProvider.gmValues.includes(v)) {
              votStorage.syncDelete(v);
            }
          }
          window.location.reload();
        })();
      });
    }
  }

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

  initExtraEvents() {
    const { signal } = this.abortController;

    const addExtraEventListener = (element, event, handler) => {
      this.extraEvents.push({
        element,
        event,
        handler,
      });
      element.addEventListener(event, handler, { signal });
    };

    const addExtraEventListeners = (element, events, handler) => {
      for (const event of events) {
        addExtraEventListener(element, event, handler);
      }
    };

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        this.votMenu.container.setAttribute(
          "style",
          `--vot-container-height: ${e.contentRect.height}px`,
        );
      }

      const isBigWidth = this.container.clientWidth > 550;
      this.votButton.container.dataset.position =
        this.votMenu.container.dataset.position = isBigWidth
          ? this.data?.buttonPos
          : "default";
      this.votButton.container.dataset.direction =
        this.data?.buttonPos && this.data?.buttonPos !== "default" && isBigWidth
          ? "column"
          : "row";
    });

    this.resizeObserver.observe(this.video);
    this.votMenu.container.setAttribute(
      "style",
      `--vot-container-height: ${this.video.getBoundingClientRect().height}px`,
    );
    // Sync menu volume slider with youtube original video (youtube only)
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver = new MutationObserver((mutations) => {
        if (!this.audioPlayer.player.src || !this.data.syncVolume) {
          return;
        }

        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "aria-valuenow"
          ) {
            if (this.firstSyncVolume) {
              // disable sync if it's sync when the translation is enabled
              this.firstSyncVolume = false;
              return;
            }

            // youtube sets setMuted and returns the old value if the slider is moved to 0
            // also fixes the operation if the video is muted via the hotkey
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
          childList: false,
          subtree: true,
          attributeOldValue: true,
        });
      }
    }

    document.addEventListener(
      "click",
      (event) => {
        const e = event.target;

        const button = this.votButton.container;
        const menu = this.votMenu.container;
        const container = this.container;
        const settings = this.votSettingsDialog.container;
        const tempDialog = document.querySelector(".vot-dialog-temp");

        const isButton = button.contains(e);
        const isMenu = menu.contains(e);
        const isVideo = container.contains(e);
        const isSettings = settings.contains(e);
        const isTempDialog = tempDialog?.contains(e) ?? false;

        debug.log(
          `[document click] ${isButton} ${isMenu} ${isVideo} ${isSettings} ${isTempDialog}`,
        );
        if (!(!isButton && !isMenu && !isSettings && !isTempDialog)) return;
        if (!isVideo) this.logout(0);

        this.votMenu.container.hidden = true;
      },
      { signal },
    );

    document.addEventListener(
      "keydown",
      async (event) => {
        const code = event.code;
        // Проверка, если активный элемент - это вводимый элемент
        const activeElement = document.activeElement;
        const isInputElement =
          ["input", "textarea"].includes(activeElement.tagName.toLowerCase()) ||
          activeElement.isContentEditable;
        if (!isInputElement && code === this.data.hotkeyButton) {
          await this.handleTranslationBtnClick();
        }
      },
      { signal },
    );

    let eventContainer = this.site.eventSelector
      ? document.querySelector(this.site.eventSelector)
      : this.container;
    if (eventContainer)
      addExtraEventListeners(
        eventContainer,
        ["mousemove", "mouseout"],
        this.resetTimer,
      );

    addExtraEventListener(
      this.votButton.container,
      "mousemove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListener(
      this.votMenu.container,
      "mousemove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListeners(
      document,
      ["touchstart", "touchmove", "touchend"],
      this.changeOpacityOnEvent,
    );

    // fix youtube hold to fast
    addExtraEventListener(this.votButton.container, "mousedown", (e) => {
      e.stopImmediatePropagation();
    });
    addExtraEventListener(this.votMenu.container, "mousedown", (e) => {
      e.stopImmediatePropagation();
    });

    // fix draggable menu in youtube (#394, #417)
    if (this.site.host === "youtube") {
      this.container.draggable = false;
    }

    if (this.site.host === "googledrive") {
      this.container.style.height = "100%";
    }

    addExtraEventListener(this.video, "canplay", async () => {
      // Временное решение
      if (this.site.host === "rutube" && this.video.src) {
        return;
      }
      await this.setCanPlay();
    });

    addExtraEventListener(this.video, "emptied", async () => {
      if (
        this.video.src &&
        (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) ===
          this.videoData.videoId
      )
        return;
      debug.log("lipsync mode is emptied");
      this.videoData = "";
      this.stopTranslation();
    });

    if (!["rutube", "ok"].includes(this.site.host)) {
      addExtraEventListener(this.video, "volumechange", () => {
        this.syncVideoVolumeSlider();
      });
    }

    if (this.site.host === "youtube" && !this.site.additionalData) {
      addExtraEventListener(document, "yt-page-data-updated", async () => {
        debug.log("yt-page-data-updated");
        // fix #802
        if (!window.location.pathname.includes("/shorts/")) {
          return;
        }
        await this.setCanPlay();
      });
    }
  }

  async setCanPlay() {
    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) ===
      this.videoData.videoId
    )
      return;
    await this.handleSrcChanged();
    await this.autoTranslate();
    debug.log("lipsync mode is canplay");
  }

  logout(n) {
    if (!this.votMenu.container.hidden) return;
    this.votButton.container.style.opacity = n;
  }

  resetTimer = () => {
    clearTimeout(this.timer);
    this.logout(1);
    this.timer = setTimeout(() => {
      this.logout(0);
    }, 1000);
  };

  changeOpacityOnEvent = (event) => {
    clearTimeout(this.timer);
    this.logout(1);
    event.stopPropagation();
  };

  async changeSubtitlesLang(subs) {
    debug.log("[onchange] subtitles", subs);
    this.votSubtitlesSelect.setSelected(subs);
    if (subs === "disabled") {
      this.votSubtitlesSelect.setTitle(
        localizationProvider.get("VOTSubtitlesDisabled"),
      );
      this.subtitlesWidget.setContent(null);
      this.votDownloadSubtitlesButton.hidden = true;
      this.yandexSubtitles = null;
    } else {
      const subtitlesObj = this.subtitlesList.at(parseInt(subs));
      if (
        this.data.audioProxy === 1 &&
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

      this.yandexSubtitles = await fetchSubtitles(subtitlesObj);
      this.subtitlesWidget.setContent(this.yandexSubtitles);
      this.votDownloadSubtitlesButton.hidden = false;
    }
  }

  async updateSubtitlesLangSelect() {
    const updatedOptions = [
      {
        label: localizationProvider.get("VOTSubtitlesDisabled"),
        value: "disabled",
        selected: true,
        disabled: false,
      },
      ...this.subtitlesList.map((s, idx) => ({
        label:
          (localizationProvider.get("langs")[s.language] ??
            s.language.toUpperCase()) +
          (s.translatedFromLanguage
            ? ` ${localizationProvider.get("VOTTranslatedFrom")} ${
                localizationProvider.get("langs")[s.translatedFromLanguage] ??
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

    this.votSubtitlesSelect.updateItems(updatedOptions);

    await this.changeSubtitlesLang(updatedOptions[0].value);
  }

  async updateSubtitles() {
    await this.changeSubtitlesLang("disabled");

    if (!this.videoData.videoId) {
      console.error(
        `[VOT] ${localizationProvider.getDefault("VOTNoVideoIDFound")}`,
      );
      this.subtitlesList = [];
      this.subtitlesListVideoId = null;
      this.votButton.container.hidden = true;
      await this.updateSubtitlesLangSelect();
      return;
    }

    this.votButton.container.hidden = false;

    if (this.subtitlesListVideoId === this.videoData.videoId) {
      return;
    }

    try {
      this.subtitlesList = await subtitles_getSubtitles(this.votClient, this.videoData);
    } catch (err) {
      debug.log("Error with yandex server, try auto-fix...", err);
      this.votOpts = {
        fetchFn: GM_fetch,
        hostVOT: votBackendUrl,
        host: this.data.proxyWorkerHost,
      };
      this.votClient = new VOTWorkerClient(this.votOpts);
      this.subtitlesList = await subtitles_getSubtitles(this.votClient, this.videoData);
      await votStorage.set("translateProxyEnabled", 1);
    }

    if (!this.subtitlesList) {
      await this.changeSubtitlesLang("disabled");
    } else {
      this.subtitlesListVideoId = this.videoData.videoId;
    }
    await this.updateSubtitlesLangSelect();
  }

  /**
   * Get video volume in 0.00-1.00 format
   *
   * @type {import('./index').VideoHandler['getVideoVolume']}
   */
  getVideoVolume() {
    let videoVolume = this.video?.volume;
    if (["youtube", "googledrive"].includes(this.site.host)) {
      videoVolume = youtubeUtils.getVideoVolume() ?? videoVolume;
    }

    return videoVolume;
  }

  /**
   * Set video volume in 0.00-1.00 format
   *
   * @type {import('./index').VideoHandler['setVideoVolume']}
   */
  setVideoVolume(volume) {
    if (["youtube", "googledrive"].includes(this.site.host)) {
      const videoVolume = youtubeUtils.setVideoVolume(volume);
      if (videoVolume) {
        return this;
      }
    }

    this.video.volume = volume;
    return this;
  }

  /**
   * @type {import('./index').VideoHandler['isMuted']}
   */
  isMuted() {
    return ["youtube", "googledrive"].includes(this.site.host)
      ? youtubeUtils.isMuted()
      : this.video?.muted;
  }

  // Sync volume slider with original video
  syncVideoVolumeSlider() {
    const videoVolume = this.isMuted() ? 0 : this.getVideoVolume() * 100;
    const newSlidersVolume = Math.round(videoVolume);

    this.votVideoVolumeSlider.input.value = newSlidersVolume;
    this.votVideoVolumeSlider.label.querySelector(
      "strong",
    ).textContent = `${newSlidersVolume}%`;
    ui.updateSlider(this.votVideoVolumeSlider.input);

    if (this.data.syncVolume === 1) {
      this.tempOriginalVolume = Number(newSlidersVolume);
    }
  }

  setSelectMenuValues(from, to) {
    this.votTranslationLanguageSelect.fromSelect.setTitle(
      localizationProvider.get("langs")[from],
    );
    this.votTranslationLanguageSelect.toSelect.setTitle(
      localizationProvider.get("langs")[to],
    );
    this.votTranslationLanguageSelect.fromSelect.setSelected(from);
    this.votTranslationLanguageSelect.toSelect.setSelected(to);
    console.log(`[VOT] Set translation from ${from} to ${to}`);
    this.videoData.detectedLanguage = from;
    this.videoData.responseLanguage = to;
  }

  /**
   * wrap over syncVolume to make it easier to work with sliders
   * @constructor
   * @param {"translation" | "video"} fromType - the initiator of sync
   * @param {number} newVolume - new volume of sliders
   */
  syncVolumeWrapper(fromType, newVolume) {
    const slider =
      fromType === "translation"
        ? this.votVideoVolumeSlider
        : this.votVideoTranslationVolumeSlider;

    const currentSliderValue = Number(slider.input.value);

    const finalValue = syncVolume(
      fromType === "translation" ? this.video : this.audioPlayer.player,
      newVolume,
      currentSliderValue,
      fromType === "translation" ? this.tempVolume : this.tempOriginalVolume,
    );

    slider.input.value = finalValue;
    slider.label.querySelector("strong").textContent = `${finalValue}%`;
    ui.updateSlider(slider.input);

    // Update the temp variables for future syncing
    this.tempOriginalVolume =
      fromType === "translation" ? finalValue : newVolume;
    this.tempVolume = fromType === "translation" ? newVolume : finalValue;
  }

  /**
   * Asynchronously retrieves video data from the current page's URL.
   * If the video is hosted on YouTube, it also retrieves additional data.
   *
   * @return {Promise<Object>} An object containing the video's duration, URL, video ID, host,
   * detected language, response language, and translation help.
   */
  async getVideoData() {
    const {
      duration,
      url,
      videoId,
      host,
      title,
      translationHelp,
      detectedLanguage,
      subtitles,
    } = await getVideoData(this.site, this.video, {
      fetchFn: GM_fetch,
    });
    const videoData = {
      translationHelp: translationHelp ?? null,
      // by default, we request the translation of the video
      isStream: false,
      // ! if 0 - we get 400 error
      duration: this.video?.duration || duration || config.defaultDuration,
      videoId,
      url,
      host,
      detectedLanguage: detectedLanguage ?? this.translateFromLang,
      responseLanguage: this.translateToLang,
      subtitles,
      title,
    };

    if (this.site.host === "youtube") {
      const youtubeData = await youtubeUtils.getVideoData();
      videoData.isStream = youtubeData.isLive;
      if (youtubeData.title) {
        videoData.detectedLanguage = youtubeData.detectedLanguage;
        videoData.title = youtubeData.localizedTitle;
      }
    } else if (["rutube", "ok.ru", "mail_ru"].includes(this.site.host)) {
      videoData.detectedLanguage = "ru";
    } else if (this.site.host === "youku") {
      videoData.detectedLanguage = "zh";
    } else if (this.site.host === "vk") {
      const trackLang = document.getElementsByTagName("track")?.[0]?.srclang;
      videoData.detectedLanguage = trackLang || "auto";
    } else if (this.site.host === "weverse") {
      videoData.detectedLanguage = "ko";
    } else {
      videoData.detectedLanguage = "auto";
    }
    return videoData;
  }

  videoValidator() {
    if (["youtube", "ok.ru", "vk"].includes(this.site.host)) {
      debug.log("VideoValidator videoData: ", this.videoData);
      if (
        this.data.dontTranslateYourLang === 1 &&
        this.videoData.detectedLanguage === this.data.dontTranslateLanguage
      ) {
        throw new VOTLocalizedError("VOTDisableFromYourLang");
      }
    }

    if (!this.videoData.isStream && this.videoData.duration > 14_400) {
      throw new VOTLocalizedError("VOTVideoIsTooLong");
    }

    return true;
  }

  // Default actions on stop translate
  stopTranslate() {
    this.audioPlayer.player.removeVideoEvents();
    this.audioPlayer.player.clear();
    this.audioPlayer.player.src = undefined;
    debug.log("audioPlayer after stopTranslate", this.audioPlayer);

    this.votVideoVolumeSlider.container.hidden = true;
    this.votVideoTranslationVolumeSlider.container.hidden = true;
    this.votDownloadButton.hidden = true;
    this.downloadTranslationUrl = null;
    this.transformBtn("none", localizationProvider.get("translateVideo"));
    debug.log(`Volume on start: ${this.volumeOnStart}`);
    if (this.volumeOnStart) {
      this.setVideoVolume(this.volumeOnStart);
    }
    clearInterval(this.streamPing);
    clearTimeout(this.autoRetry);
    this.hls?.destroy();
    this.hls = initHls();
    this.firstSyncVolume = true;
  }

  async translateExecutor(VIDEO_ID) {
    debug.log("Run translateFunc", VIDEO_ID);
    const audioDownloader = new YouTubeAudioDownloader();
    const result = await audioDownloader.download(true);
    console.log(result);
    for await (const res of result.getAudioBuffers()) {
      console.log(await res);
    }
    await this.translateFunc(
      VIDEO_ID,
      this.videoData.isStream,
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
      this.videoData.translationHelp,
    );
  }

  async updateTranslationErrorMsg(errorMessage) {
    const translationTake = localizationProvider.get("translationTake");
    const lang = localizationProvider.lang;

    if (errorMessage?.name === "VOTLocalizedError") {
      this.transformBtn("error", errorMessage.localizedMessage);
    } else if (errorMessage instanceof Error) {
      // to prevent pass Error as text
      this.transformBtn("error", errorMessage?.message);
    } else if (
      this.data.translateAPIErrors === 1 &&
      !errorMessage.includes(translationTake) &&
      lang !== "ru"
    ) {
      // adds a stub text until a text translation is received to avoid a long delay with long text
      this.setLoadingBtn(true);
      const translatedMessage = await translate(errorMessage, "ru", lang);
      this.transformBtn("error", translatedMessage);
    } else {
      this.transformBtn("error", errorMessage);
    }

    // it must be at the very bottom of the function, otherwise it will be overwritten in the transformBtn
    if (
      [
        "Подготавливаем перевод",
        "Видео передано в обработку",
        "Ожидаем перевод видео",
        "Загружаем переведенное аудио",
      ].includes(errorMessage)
    ) {
      this.setLoadingBtn(true);
    }
  }

  afterUpdateTranslation(audioUrl) {
    this.votVideoVolumeSlider.container.hidden =
      this.data.showVideoSlider !== 1 ||
      this.votButton.container.dataset.status !== "success";
    this.votVideoTranslationVolumeSlider.container.hidden =
      this.votButton.container.dataset.status !== "success";

    if (this.data.autoSetVolumeYandexStyle === 1) {
      this.votVideoVolumeSlider.input.value = this.data.autoVolume * 100;
      this.votVideoVolumeSlider.label.querySelector("strong").textContent = `${
        this.data.autoVolume * 100
      }%`;
      ui.updateSlider(this.votVideoVolumeSlider.input);
    }

    this.votDownloadButton.hidden = false;
    this.downloadTranslationUrl = audioUrl;
    debug.log(
      "afterUpdateTranslation downloadTranslationUrl",
      this.downloadTranslationUrl,
    );
  }

  async validateAudioUrl(audioUrl) {
    try {
      const response = await GM_fetch(audioUrl, {
        method: "HEAD",
        timeout: 5000,
      });
      debug.log("Test audio response", response);
      if (response.status !== 404) {
        debug.log("Valid audioUrl", audioUrl);
        return audioUrl;
      }

      debug.log("Yandex returned not valid audio, trying to fix...");
      let translateRes = await this.translateVideoImpl(
        this.videoData,
        (this.videoData.detectedLanguage = "auto"),
        this.videoData.responseLanguage,
        this.videoData.translationHelp,
      );
      this.setSelectMenuValues(
        this.videoData.detectedLanguage,
        this.videoData.responseLanguage,
      );
      audioUrl = translateRes.url;
      debug.log("Fixed audio audioUrl", audioUrl);
    } catch (err) {
      if (err.message === "Timeout") {
        debug.log("Request timed out. Handling timeout error...");
        this.data.audioProxy = 1;
        await votStorage.set("audioProxy", 1);
      } else {
        debug.log("Test audio error:", err);
      }
    }

    return audioUrl;
  }

  // update translation audio src
  async updateTranslation(audioUrl) {
    // ! Don't use this function for streams
    debug.log(
      audioUrl,
      this.cachedTranslation,
      this.audioPlayer.player.currentSrc,
    );
    if (this.cachedTranslation?.url !== this.audioPlayer.player.currentSrc) {
      audioUrl = await this.validateAudioUrl(audioUrl);
    }

    if (
      this.data.audioProxy === 1 &&
      audioUrl.startsWith("https://vtrans.s3-private.mds.yandex.net/tts/prod/")
    ) {
      const audioPath = audioUrl.replace(
        "https://vtrans.s3-private.mds.yandex.net/tts/prod/",
        "",
      );
      audioUrl = `https://${this.data.proxyWorkerHost}/video-translation/audio-proxy/${audioPath}`;
      console.log(`[VOT] Audio proxied via ${audioUrl}`);
    }

    if (this.audioPlayer.player.src !== audioUrl) {
      this.audioPlayer.player.src = audioUrl;
    }

    try {
      this.audioPlayer.init();
    } catch (err) {
      debug.log("this.audioPlayer.init() error", err);
      if (err.message.includes("Failed to fetch audio file")) {
        this.videoHandler.data.audioProxy = 1;
        await votStorage.set("audioProxy", 1);
      } else {
        this.videoHandler.transformBtn("error", err.message);
      }
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

  // Define a function to translate a video and handle the callback
  async translateFunc(
    VIDEO_ID,
    isStream,
    requestLang,
    responseLang,
    translationHelp,
  ) {
    console.log("[VOT] Video Data: ", this.videoData);
    // fix enabling the old requested voiceover when changing the language to the native language (#414)
    debug.log("Run videoValidator");
    this.videoValidator();
    this.setLoadingBtn(true);
    this.volumeOnStart = this.getVideoVolume();

    if (isStream) {
      let translateRes = await this.translateStreamImpl(
        this.videoData,
        requestLang,
        responseLang,
      );

      if (!translateRes) {
        debug.log("Skip translation");
        return;
      }

      this.transformBtn(
        "success",
        localizationProvider.get("disableTranslate"),
      );
      const streamURL = this.setHLSSource(translateRes.result.url);
      if (this.site.host === "youtube") {
        youtubeUtils.videoSeek(this.video, 10); // 10 is the most successful number for streaming. With it, the audio is not so far behind the original
      }

      this.setupAudioSettings();
      if (!this.video.src && !this.video.currentSrc && !this.video.srcObject) {
        return this.stopTranslation();
      }

      return this.afterUpdateTranslation(streamURL);
    }

    this.cachedTranslation = this.videoTranslations.find(
      (t) =>
        t.videoId === VIDEO_ID &&
        t.expires > utils_getTimestamp() &&
        t.from === requestLang &&
        t.to === responseLang &&
        t.useNewModel === this.data.useNewModel,
    );

    if (this.cachedTranslation) {
      await this.updateTranslation(this.cachedTranslation.url);
      debug.log("[translateFunc] Cached translation was received");
      return;
    }

    let translateRes = await this.translateVideoImpl(
      this.videoData,
      requestLang,
      responseLang,
      translationHelp,
    );

    debug.log("[translateRes]", translateRes);
    if (!translateRes) {
      debug.log("Skip translation");
      return;
    }

    await this.updateTranslation(translateRes.url);

    if (
      !this.subtitlesList.some(
        (item) =>
          item.source === "yandex" &&
          item.translatedFromLanguage === this.videoData.detectedLanguage &&
          item.language === this.videoData.responseLanguage,
      )
    ) {
      this.subtitlesList = await subtitles_getSubtitles(this.votClient, this.videoData);
      await this.updateSubtitlesLangSelect();
    }

    debug.log(this.downloadTranslationUrl, translateRes);
    this.videoTranslations.push({
      videoId: VIDEO_ID,
      from: requestLang,
      to: responseLang,
      url: this.downloadTranslationUrl,
      expires: utils_getTimestamp() + this.videoTranslationTTL,
      useNewModel: this.data?.useNewModel,
    });
  }

  // Вспомогательные методы
  setupHLS(streamURL) {
    this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      debug.log("audio and hls.js are now bound together !");
    });
    this.hls.on(Hls.Events.MANIFEST_PARSED, function (data) {
      debug.log(
        "manifest loaded, found " + data?.levels?.length + " quality level",
      );
    });
    this.hls.loadSource(streamURL);
    // doesn't work
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
            // All retries and media options have been exhausted.
            // Immediately trying to restart loading could cause loop loading.
            // Consider modifying loading policies to best fit your asset and network
            // conditions (manifestLoadPolicy, playlistLoadPolicy, fragLoadPolicy).
            break;
          default:
            // cannot recover
            this.hls.destroy();
            break;
        }
      }
    });
    debug.log(this.hls);
  }

  setHLSSource(url) {
    const streamURL = `https://${
      this.data.m3u8ProxyHost
    }/?all=yes&origin=${encodeURIComponent(
      "https://strm.yandex.ru",
    )}&referer=${encodeURIComponent(
      "https://strm.yandex.ru",
    )}&url=${encodeURIComponent(url)}`;
    if (this.hls) {
      this.setupHLS(streamURL);
    } else if (
      this.audioPlayer.player.audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // safari
      this.audioPlayer.player.src = streamURL; // TODO: make class for HLS audio player
    } else {
      // browser doesn't support m3u8 (hls unsupported and it isn't a safari)
      throw new VOTLocalizedError("audioFormatNotSupported");
    }

    return streamURL;
  }

  setupAudioSettings() {
    if (typeof this.data.defaultVolume === "number") {
      this.audioPlayer.player.volume = this.data.defaultVolume / 100;
    }

    if (
      typeof this.data.autoSetVolumeYandexStyle === "number" &&
      this.data.autoSetVolumeYandexStyle
    ) {
      this.setVideoVolume(this.data.autoVolume);
    }
  }

  // Define a function to stop translation and clean up
  stopTranslation = () => {
    this.stopTranslate();
    this.syncVideoVolumeSlider();
  };

  async handleSrcChanged() {
    debug.log("[VideoHandler] src changed", this);
    this.firstPlay = true;
    this.stopTranslation();

    const hide =
      !this.video.src && !this.video.currentSrc && !this.video.srcObject;
    this.votButton.container.hidden = hide;
    if (hide) {
      this.votMenu.container.hidden = hide;
    }

    if (!this.site.selector) {
      this.container = this.video.parentElement;
    }

    if (!this.container.contains(this.votButton.container)) {
      this.container.append(this.votButton.container, this.votMenu.container);
    }

    this.videoData = await this.getVideoData();
    await this.updateSubtitles();
    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
    );
  }

  async release() {
    debug.log("[VideoHandler] release");

    this.initialized = false;
    this.releaseExtraEvents();
    this.subtitlesWidget.release();
    this.votButton.container.remove();
    this.votMenu.container.remove();
  }
}

const videoObserver = new VideoObserver();
const videosWrappers = new WeakMap();

/**
 * Finds the parent element of a given element that matches a specified selector.
 *
 * @param {HTMLElement} el - The element to start searching from.
 * @param {string} selector - The CSS selector to match.
 * @returns {HTMLElement|null} The parent element that matches the selector, or null if no match is found.
 */
function climb(el, selector) {
  if (!el || !selector) {
    return null;
  }

  if (el instanceof Document) {
    return el.querySelector(selector);
  }

  const foundEl = el.closest(selector);
  if (foundEl) {
    return foundEl;
  }

  const root = el.getRootNode();
  return climb(root instanceof Document ? root : root.host, selector);
}

/**
 * Finds the container element for a given video element and site object.
 *
 * @param {Object} site - The site object.
 * @param {Object} video - The video element.
 * @return {Object|null} The container element or null if not found.
 */
function findContainer(site, video) {
  debug.log("findContainer", site, video);
  if (site.shadowRoot) {
    let container = climb(video, site.selector);

    debug.log("findContainer with site.shadowRoot", container);
    return container ?? video.parentElement;
  }

  debug.log("findContainer without shadowRoot");

  const browserVersion = browserInfo.browser.version?.split(".")?.[0];
  if (
    site.selector?.includes(":not") &&
    site.selector?.includes("*") &&
    browserVersion &&
    ((browserInfo.browser.name === "Chrome" && Number(browserVersion) < 88) ||
      (browserInfo.browser.name === "Firefox" && Number(browserVersion) < 84))
  ) {
    const selector = site.selector.split(" *")[0];
    return selector
      ? Array.from(document.querySelectorAll(selector)).find((e) =>
          e.contains(video),
        )
      : video.parentElement;
  }

  return site.selector
    ? Array.from(document.querySelectorAll(site.selector)).find((e) =>
        e.contains(video),
      )
    : video.parentElement;
}

async function src_main() {
  debug.log("Loading extension...");

  await localizationProvider.update();

  debug.log(`Selected menu language: ${localizationProvider.lang}`);

  // I haven't figured out how to do it any other way
  if (window.location.origin === "https://9animetv.to") {
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://rapid-cloud.co") {
        return;
      }

      if (e.data === "getVideoId") {
        const videoId = /[^/]+$/.exec(window.location.href)?.[0];
        const iframeWin =
          document.querySelector("#iframe-embed")?.contentWindow;

        iframeWin.postMessage(
          `getVideoId:${videoId}`,
          "https://rapid-cloud.co/",
        );
      }
    });
  }

  videoObserver.onVideoAdded.addListener((video) => {
    for (const site of getService()) {
      if (!site) continue;

      let container = findContainer(site, video);
      if (!container) continue;

      if (site.host === "rumble" && !video.style.display) {
        continue; // fix multiply translation buttons in rumble.com
      }

      // if (
      //   site.host === "youku" &&
      //   !video.parentElement?.classList.contains("video-layer")
      // ) {
      //   continue;
      // }

      if (["peertube", "directlink"].includes(site.host)) {
        site.url = window.location.origin; // set the url of the current site for peertube and directlink
      }

      if (!videosWrappers.has(video)) {
        videosWrappers.set(video, new VideoHandler(video, container, site));
        break;
      }
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