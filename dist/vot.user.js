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
// @match          *://t2mc.toil.cc/*
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

(() => {
	var t = {
		"./node_modules/bowser/es5.js": function(t) {
			(function(n, i) {
				t.exports = i();
			})(this, function() {
				return function(t) {
					var n = {};
					function r(i) {
						if (n[i]) return n[i].exports;
						var s = n[i] = {
							i,
							l: !1,
							exports: {}
						};
						return t[i].call(s.exports, s, s.exports, r), s.l = !0, s.exports;
					}
					return r.m = t, r.c = n, r.d = function(t, n, i) {
						r.o(t, n) || Object.defineProperty(t, n, {
							enumerable: !0,
							get: i
						});
					}, r.r = function(t) {
						typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t, "__esModule", { value: !0 });
					}, r.t = function(t, n) {
						if (1 & n && (t = r(t)), 8 & n || 4 & n && typeof t == "object" && t && t.__esModule) return t;
						var i = Object.create(null);
						if (r.r(i), Object.defineProperty(i, "default", {
							enumerable: !0,
							value: t
						}), 2 & n && typeof t != "string") for (var s in t) r.d(i, s, function(n) {
							return t[n];
						}.bind(null, s));
						return i;
					}, r.n = function(t) {
						var n = t && t.__esModule ? function() {
							return t.default;
						} : function() {
							return t;
						};
						return r.d(n, "a", n), n;
					}, r.o = function(t, n) {
						return Object.prototype.hasOwnProperty.call(t, n);
					}, r.p = "", r(r.s = 90);
				}({
					17: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s = i(18), d = function() {
							function e() {}
							return e.getFirstMatch = function(t, n) {
								var i = n.match(t);
								return i && i.length > 0 && i[1] || "";
							}, e.getSecondMatch = function(t, n) {
								var i = n.match(t);
								return i && i.length > 1 && i[2] || "";
							}, e.matchAndReturnConst = function(t, n, i) {
								if (t.test(n)) return i;
							}, e.getWindowsVersionName = function(t) {
								switch (t) {
									case "NT": return "NT";
									case "XP": return "XP";
									case "NT 5.0": return "2000";
									case "NT 5.1": return "XP";
									case "NT 5.2": return "2003";
									case "NT 6.0": return "Vista";
									case "NT 6.1": return "7";
									case "NT 6.2": return "8";
									case "NT 6.3": return "8.1";
									case "NT 10.0": return "10";
									default: return;
								}
							}, e.getMacOSVersionName = function(t) {
								var n = t.split(".").splice(0, 2).map(function(t) {
									return parseInt(t, 10) || 0;
								});
								if (n.push(0), n[0] === 10) switch (n[1]) {
									case 5: return "Leopard";
									case 6: return "Snow Leopard";
									case 7: return "Lion";
									case 8: return "Mountain Lion";
									case 9: return "Mavericks";
									case 10: return "Yosemite";
									case 11: return "El Capitan";
									case 12: return "Sierra";
									case 13: return "High Sierra";
									case 14: return "Mojave";
									case 15: return "Catalina";
									default: return;
								}
							}, e.getAndroidVersionName = function(t) {
								var n = t.split(".").splice(0, 2).map(function(t) {
									return parseInt(t, 10) || 0;
								});
								if (n.push(0), !(n[0] === 1 && n[1] < 5)) return n[0] === 1 && n[1] < 6 ? "Cupcake" : n[0] === 1 && n[1] >= 6 ? "Donut" : n[0] === 2 && n[1] < 2 ? "Eclair" : n[0] === 2 && n[1] === 2 ? "Froyo" : n[0] === 2 && n[1] > 2 ? "Gingerbread" : n[0] === 3 ? "Honeycomb" : n[0] === 4 && n[1] < 1 ? "Ice Cream Sandwich" : n[0] === 4 && n[1] < 4 ? "Jelly Bean" : n[0] === 4 && n[1] >= 4 ? "KitKat" : n[0] === 5 ? "Lollipop" : n[0] === 6 ? "Marshmallow" : n[0] === 7 ? "Nougat" : n[0] === 8 ? "Oreo" : n[0] === 9 ? "Pie" : void 0;
							}, e.getVersionPrecision = function(t) {
								return t.split(".").length;
							}, e.compareVersions = function(t, n, i) {
								i === void 0 && (i = !1);
								var s = e.getVersionPrecision(t), d = e.getVersionPrecision(n), f = Math.max(s, d), p = 0, m = e.map([t, n], function(t) {
									var n = f - e.getVersionPrecision(t), i = t + Array(n + 1).join(".0");
									return e.map(i.split("."), function(t) {
										return Array(20 - t.length).join("0") + t;
									}).reverse();
								});
								for (i && (p = f - Math.min(s, d)), --f; f >= p;) {
									if (m[0][f] > m[1][f]) return 1;
									if (m[0][f] === m[1][f]) {
										if (f === p) return 0;
										--f;
									} else if (m[0][f] < m[1][f]) return -1;
								}
							}, e.map = function(t, n) {
								var i, s = [];
								if (Array.prototype.map) return Array.prototype.map.call(t, n);
								for (i = 0; i < t.length; i += 1) s.push(n(t[i]));
								return s;
							}, e.find = function(t, n) {
								var i, s;
								if (Array.prototype.find) return Array.prototype.find.call(t, n);
								for (i = 0, s = t.length; i < s; i += 1) {
									var d = t[i];
									if (n(d, i)) return d;
								}
							}, e.assign = function(t) {
								for (var n, i, s = t, d = arguments.length, f = Array(d > 1 ? d - 1 : 0), p = 1; p < d; p++) f[p - 1] = arguments[p];
								if (Object.assign) return Object.assign.apply(Object, [t].concat(f));
								var o = function() {
									var t = f[n];
									typeof t == "object" && t && Object.keys(t).forEach(function(n) {
										s[n] = t[n];
									});
								};
								for (n = 0, i = f.length; n < i; n += 1) o();
								return t;
							}, e.getBrowserAlias = function(t) {
								return s.BROWSER_ALIASES_MAP[t];
							}, e.getBrowserTypeByAlias = function(t) {
								return s.BROWSER_MAP[t] || "";
							}, e;
						}();
						n.default = d, t.exports = n.default;
					},
					18: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.ENGINE_MAP = n.OS_MAP = n.PLATFORMS_MAP = n.BROWSER_MAP = n.BROWSER_ALIASES_MAP = void 0, n.BROWSER_ALIASES_MAP = {
							"Amazon Silk": "amazon_silk",
							"Android Browser": "android",
							Bada: "bada",
							BlackBerry: "blackberry",
							Chrome: "chrome",
							Chromium: "chromium",
							Electron: "electron",
							Epiphany: "epiphany",
							Firefox: "firefox",
							Focus: "focus",
							Generic: "generic",
							"Google Search": "google_search",
							Googlebot: "googlebot",
							"Internet Explorer": "ie",
							"K-Meleon": "k_meleon",
							Maxthon: "maxthon",
							"Microsoft Edge": "edge",
							"MZ Browser": "mz",
							"NAVER Whale Browser": "naver",
							Opera: "opera",
							"Opera Coast": "opera_coast",
							PhantomJS: "phantomjs",
							Puffin: "puffin",
							QupZilla: "qupzilla",
							QQ: "qq",
							QQLite: "qqlite",
							Safari: "safari",
							Sailfish: "sailfish",
							"Samsung Internet for Android": "samsung_internet",
							SeaMonkey: "seamonkey",
							Sleipnir: "sleipnir",
							Swing: "swing",
							Tizen: "tizen",
							"UC Browser": "uc",
							Vivaldi: "vivaldi",
							"WebOS Browser": "webos",
							WeChat: "wechat",
							"Yandex Browser": "yandex",
							Roku: "roku"
						}, n.BROWSER_MAP = {
							amazon_silk: "Amazon Silk",
							android: "Android Browser",
							bada: "Bada",
							blackberry: "BlackBerry",
							chrome: "Chrome",
							chromium: "Chromium",
							electron: "Electron",
							epiphany: "Epiphany",
							firefox: "Firefox",
							focus: "Focus",
							generic: "Generic",
							googlebot: "Googlebot",
							google_search: "Google Search",
							ie: "Internet Explorer",
							k_meleon: "K-Meleon",
							maxthon: "Maxthon",
							edge: "Microsoft Edge",
							mz: "MZ Browser",
							naver: "NAVER Whale Browser",
							opera: "Opera",
							opera_coast: "Opera Coast",
							phantomjs: "PhantomJS",
							puffin: "Puffin",
							qupzilla: "QupZilla",
							qq: "QQ Browser",
							qqlite: "QQ Browser Lite",
							safari: "Safari",
							sailfish: "Sailfish",
							samsung_internet: "Samsung Internet for Android",
							seamonkey: "SeaMonkey",
							sleipnir: "Sleipnir",
							swing: "Swing",
							tizen: "Tizen",
							uc: "UC Browser",
							vivaldi: "Vivaldi",
							webos: "WebOS Browser",
							wechat: "WeChat",
							yandex: "Yandex Browser"
						}, n.PLATFORMS_MAP = {
							tablet: "tablet",
							mobile: "mobile",
							desktop: "desktop",
							tv: "tv"
						}, n.OS_MAP = {
							WindowsPhone: "Windows Phone",
							Windows: "Windows",
							MacOS: "macOS",
							iOS: "iOS",
							Android: "Android",
							WebOS: "WebOS",
							BlackBerry: "BlackBerry",
							Bada: "Bada",
							Tizen: "Tizen",
							Linux: "Linux",
							ChromeOS: "Chrome OS",
							PlayStation4: "PlayStation 4",
							Roku: "Roku"
						}, n.ENGINE_MAP = {
							EdgeHTML: "EdgeHTML",
							Blink: "Blink",
							Trident: "Trident",
							Presto: "Presto",
							Gecko: "Gecko",
							WebKit: "WebKit"
						};
					},
					90: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s, d = (s = i(91)) && s.__esModule ? s : { default: s }, f = i(18);
						function a(t, n) {
							for (var i = 0; i < n.length; i++) {
								var s = n[i];
								s.enumerable = s.enumerable || !1, s.configurable = !0, "value" in s && (s.writable = !0), Object.defineProperty(t, s.key, s);
							}
						}
						var p = function() {
							function e() {}
							var t, n, i;
							return e.getParser = function(t, n) {
								if (n === void 0 && (n = !1), typeof t != "string") throw Error("UserAgent should be a string");
								return new d.default(t, n);
							}, e.parse = function(t) {
								return new d.default(t).getResult();
							}, t = e, i = [
								{
									key: "BROWSER_MAP",
									get: function() {
										return f.BROWSER_MAP;
									}
								},
								{
									key: "ENGINE_MAP",
									get: function() {
										return f.ENGINE_MAP;
									}
								},
								{
									key: "OS_MAP",
									get: function() {
										return f.OS_MAP;
									}
								},
								{
									key: "PLATFORMS_MAP",
									get: function() {
										return f.PLATFORMS_MAP;
									}
								}
							], (n = null) && a(t.prototype, n), i && a(t, i), e;
						}();
						n.default = p, t.exports = n.default;
					},
					91: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s = u(i(92)), d = u(i(93)), f = u(i(94)), p = u(i(95)), m = u(i(17));
						function u(t) {
							return t && t.__esModule ? t : { default: t };
						}
						var h = function() {
							function e(t, n) {
								if (n === void 0 && (n = !1), t == null || t === "") throw Error("UserAgent parameter can't be empty");
								this._ua = t, this.parsedResult = {}, !0 !== n && this.parse();
							}
							var t = e.prototype;
							return t.getUA = function() {
								return this._ua;
							}, t.test = function(t) {
								return t.test(this._ua);
							}, t.parseBrowser = function() {
								var t = this;
								this.parsedResult.browser = {};
								var n = m.default.find(s.default, function(n) {
									if (typeof n.test == "function") return n.test(t);
									if (n.test instanceof Array) return n.test.some(function(n) {
										return t.test(n);
									});
									throw Error("Browser's test function is not valid");
								});
								return n && (this.parsedResult.browser = n.describe(this.getUA())), this.parsedResult.browser;
							}, t.getBrowser = function() {
								return this.parsedResult.browser ? this.parsedResult.browser : this.parseBrowser();
							}, t.getBrowserName = function(t) {
								return t ? String(this.getBrowser().name).toLowerCase() || "" : this.getBrowser().name || "";
							}, t.getBrowserVersion = function() {
								return this.getBrowser().version;
							}, t.getOS = function() {
								return this.parsedResult.os ? this.parsedResult.os : this.parseOS();
							}, t.parseOS = function() {
								var t = this;
								this.parsedResult.os = {};
								var n = m.default.find(d.default, function(n) {
									if (typeof n.test == "function") return n.test(t);
									if (n.test instanceof Array) return n.test.some(function(n) {
										return t.test(n);
									});
									throw Error("Browser's test function is not valid");
								});
								return n && (this.parsedResult.os = n.describe(this.getUA())), this.parsedResult.os;
							}, t.getOSName = function(t) {
								var n = this.getOS().name;
								return t ? String(n).toLowerCase() || "" : n || "";
							}, t.getOSVersion = function() {
								return this.getOS().version;
							}, t.getPlatform = function() {
								return this.parsedResult.platform ? this.parsedResult.platform : this.parsePlatform();
							}, t.getPlatformType = function(t) {
								t === void 0 && (t = !1);
								var n = this.getPlatform().type;
								return t ? String(n).toLowerCase() || "" : n || "";
							}, t.parsePlatform = function() {
								var t = this;
								this.parsedResult.platform = {};
								var n = m.default.find(f.default, function(n) {
									if (typeof n.test == "function") return n.test(t);
									if (n.test instanceof Array) return n.test.some(function(n) {
										return t.test(n);
									});
									throw Error("Browser's test function is not valid");
								});
								return n && (this.parsedResult.platform = n.describe(this.getUA())), this.parsedResult.platform;
							}, t.getEngine = function() {
								return this.parsedResult.engine ? this.parsedResult.engine : this.parseEngine();
							}, t.getEngineName = function(t) {
								return t ? String(this.getEngine().name).toLowerCase() || "" : this.getEngine().name || "";
							}, t.parseEngine = function() {
								var t = this;
								this.parsedResult.engine = {};
								var n = m.default.find(p.default, function(n) {
									if (typeof n.test == "function") return n.test(t);
									if (n.test instanceof Array) return n.test.some(function(n) {
										return t.test(n);
									});
									throw Error("Browser's test function is not valid");
								});
								return n && (this.parsedResult.engine = n.describe(this.getUA())), this.parsedResult.engine;
							}, t.parse = function() {
								return this.parseBrowser(), this.parseOS(), this.parsePlatform(), this.parseEngine(), this;
							}, t.getResult = function() {
								return m.default.assign({}, this.parsedResult);
							}, t.satisfies = function(t) {
								var n = this, i = {}, s = 0, d = {}, f = 0;
								if (Object.keys(t).forEach(function(n) {
									var p = t[n];
									typeof p == "string" ? (d[n] = p, f += 1) : typeof p == "object" && (i[n] = p, s += 1);
								}), s > 0) {
									var p = Object.keys(i), h = m.default.find(p, function(t) {
										return n.isOS(t);
									});
									if (h) {
										var g = this.satisfies(i[h]);
										if (g !== void 0) return g;
									}
									var _ = m.default.find(p, function(t) {
										return n.isPlatform(t);
									});
									if (_) {
										var v = this.satisfies(i[_]);
										if (v !== void 0) return v;
									}
								}
								if (f > 0) {
									var b = Object.keys(d), x = m.default.find(b, function(t) {
										return n.isBrowser(t, !0);
									});
									if (x !== void 0) return this.compareVersion(d[x]);
								}
							}, t.isBrowser = function(t, n) {
								n === void 0 && (n = !1);
								var i = this.getBrowserName().toLowerCase(), s = t.toLowerCase(), d = m.default.getBrowserTypeByAlias(s);
								return n && d && (s = d.toLowerCase()), s === i;
							}, t.compareVersion = function(t) {
								var n = [0], i = t, s = !1, d = this.getBrowserVersion();
								if (typeof d == "string") return t[0] === ">" || t[0] === "<" ? (i = t.substr(1), t[1] === "=" ? (s = !0, i = t.substr(2)) : n = [], t[0] === ">" ? n.push(1) : n.push(-1)) : t[0] === "=" ? i = t.substr(1) : t[0] === "~" && (s = !0, i = t.substr(1)), n.indexOf(m.default.compareVersions(d, i, s)) > -1;
							}, t.isOS = function(t) {
								return this.getOSName(!0) === String(t).toLowerCase();
							}, t.isPlatform = function(t) {
								return this.getPlatformType(!0) === String(t).toLowerCase();
							}, t.isEngine = function(t) {
								return this.getEngineName(!0) === String(t).toLowerCase();
							}, t.is = function(t, n) {
								return n === void 0 && (n = !1), this.isBrowser(t, n) || this.isOS(t) || this.isPlatform(t);
							}, t.some = function(t) {
								var n = this;
								return t === void 0 && (t = []), t.some(function(t) {
									return n.is(t);
								});
							}, e;
						}();
						n.default = h, t.exports = n.default;
					},
					92: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s, d = (s = i(17)) && s.__esModule ? s : { default: s }, f = /version\/(\d+(\.?_?\d+)+)/i, p = [
							{
								test: [/googlebot/i],
								describe: function(t) {
									var n = { name: "Googlebot" }, i = d.default.getFirstMatch(/googlebot\/(\d+(\.\d+))/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/opera/i],
								describe: function(t) {
									var n = { name: "Opera" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/opr\/|opios/i],
								describe: function(t) {
									var n = { name: "Opera" }, i = d.default.getFirstMatch(/(?:opr|opios)[\s/](\S+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/SamsungBrowser/i],
								describe: function(t) {
									var n = { name: "Samsung Internet for Android" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:SamsungBrowser)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/Whale/i],
								describe: function(t) {
									var n = { name: "NAVER Whale Browser" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:whale)[\s/](\d+(?:\.\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/MZBrowser/i],
								describe: function(t) {
									var n = { name: "MZ Browser" }, i = d.default.getFirstMatch(/(?:MZBrowser)[\s/](\d+(?:\.\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/focus/i],
								describe: function(t) {
									var n = { name: "Focus" }, i = d.default.getFirstMatch(/(?:focus)[\s/](\d+(?:\.\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/swing/i],
								describe: function(t) {
									var n = { name: "Swing" }, i = d.default.getFirstMatch(/(?:swing)[\s/](\d+(?:\.\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/coast/i],
								describe: function(t) {
									var n = { name: "Opera Coast" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:coast)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/opt\/\d+(?:.?_?\d+)+/i],
								describe: function(t) {
									var n = { name: "Opera Touch" }, i = d.default.getFirstMatch(/(?:opt)[\s/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/yabrowser/i],
								describe: function(t) {
									var n = { name: "Yandex Browser" }, i = d.default.getFirstMatch(/(?:yabrowser)[\s/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/ucbrowser/i],
								describe: function(t) {
									var n = { name: "UC Browser" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:ucbrowser)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/Maxthon|mxios/i],
								describe: function(t) {
									var n = { name: "Maxthon" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:Maxthon|mxios)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/epiphany/i],
								describe: function(t) {
									var n = { name: "Epiphany" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:epiphany)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/puffin/i],
								describe: function(t) {
									var n = { name: "Puffin" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:puffin)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/sleipnir/i],
								describe: function(t) {
									var n = { name: "Sleipnir" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:sleipnir)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/k-meleon/i],
								describe: function(t) {
									var n = { name: "K-Meleon" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/(?:k-meleon)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/micromessenger/i],
								describe: function(t) {
									var n = { name: "WeChat" }, i = d.default.getFirstMatch(/(?:micromessenger)[\s/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/qqbrowser/i],
								describe: function(t) {
									var n = { name: /qqbrowserlite/i.test(t) ? "QQ Browser Lite" : "QQ Browser" }, i = d.default.getFirstMatch(/(?:qqbrowserlite|qqbrowser)[/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/msie|trident/i],
								describe: function(t) {
									var n = { name: "Internet Explorer" }, i = d.default.getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/\sedg\//i],
								describe: function(t) {
									var n = { name: "Microsoft Edge" }, i = d.default.getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/edg([ea]|ios)/i],
								describe: function(t) {
									var n = { name: "Microsoft Edge" }, i = d.default.getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/vivaldi/i],
								describe: function(t) {
									var n = { name: "Vivaldi" }, i = d.default.getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/seamonkey/i],
								describe: function(t) {
									var n = { name: "SeaMonkey" }, i = d.default.getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/sailfish/i],
								describe: function(t) {
									var n = { name: "Sailfish" }, i = d.default.getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/silk/i],
								describe: function(t) {
									var n = { name: "Amazon Silk" }, i = d.default.getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/phantom/i],
								describe: function(t) {
									var n = { name: "PhantomJS" }, i = d.default.getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/slimerjs/i],
								describe: function(t) {
									var n = { name: "SlimerJS" }, i = d.default.getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
								describe: function(t) {
									var n = { name: "BlackBerry" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/(web|hpw)[o0]s/i],
								describe: function(t) {
									var n = { name: "WebOS Browser" }, i = d.default.getFirstMatch(f, t) || d.default.getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/bada/i],
								describe: function(t) {
									var n = { name: "Bada" }, i = d.default.getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/tizen/i],
								describe: function(t) {
									var n = { name: "Tizen" }, i = d.default.getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/qupzilla/i],
								describe: function(t) {
									var n = { name: "QupZilla" }, i = d.default.getFirstMatch(/(?:qupzilla)[\s/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/firefox|iceweasel|fxios/i],
								describe: function(t) {
									var n = { name: "Firefox" }, i = d.default.getFirstMatch(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/electron/i],
								describe: function(t) {
									var n = { name: "Electron" }, i = d.default.getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/MiuiBrowser/i],
								describe: function(t) {
									var n = { name: "Miui" }, i = d.default.getFirstMatch(/(?:MiuiBrowser)[\s/](\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/chromium/i],
								describe: function(t) {
									var n = { name: "Chromium" }, i = d.default.getFirstMatch(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i, t) || d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/chrome|crios|crmo/i],
								describe: function(t) {
									var n = { name: "Chrome" }, i = d.default.getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/GSA/i],
								describe: function(t) {
									var n = { name: "Google Search" }, i = d.default.getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: function(t) {
									var n = !t.test(/like android/i), i = t.test(/android/i);
									return n && i;
								},
								describe: function(t) {
									var n = { name: "Android Browser" }, i = d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/playstation 4/i],
								describe: function(t) {
									var n = { name: "PlayStation 4" }, i = d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/safari|applewebkit/i],
								describe: function(t) {
									var n = { name: "Safari" }, i = d.default.getFirstMatch(f, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/.*/i],
								describe: function(t) {
									var n = t.search("\\(") === -1 ? /^(.*)\/(.*) / : /^(.*)\/(.*)[ \t]\((.*)/;
									return {
										name: d.default.getFirstMatch(n, t),
										version: d.default.getSecondMatch(n, t)
									};
								}
							}
						];
						n.default = p, t.exports = n.default;
					},
					93: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s, d = (s = i(17)) && s.__esModule ? s : { default: s }, f = i(18), p = [
							{
								test: [/Roku\/DVP/],
								describe: function(t) {
									var n = d.default.getFirstMatch(/Roku\/DVP-(\d+\.\d+)/i, t);
									return {
										name: f.OS_MAP.Roku,
										version: n
									};
								}
							},
							{
								test: [/windows phone/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i, t);
									return {
										name: f.OS_MAP.WindowsPhone,
										version: n
									};
								}
							},
							{
								test: [/windows /i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i, t), i = d.default.getWindowsVersionName(n);
									return {
										name: f.OS_MAP.Windows,
										version: n,
										versionName: i
									};
								}
							},
							{
								test: [/Macintosh(.*?) FxiOS(.*?)\//],
								describe: function(t) {
									var n = { name: f.OS_MAP.iOS }, i = d.default.getSecondMatch(/(Version\/)(\d[\d.]+)/, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/macintosh/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/mac os x (\d+(\.?_?\d+)+)/i, t).replace(/[_\s]/g, "."), i = d.default.getMacOSVersionName(n), s = {
										name: f.OS_MAP.MacOS,
										version: n
									};
									return i && (s.versionName = i), s;
								}
							},
							{
								test: [/(ipod|iphone|ipad)/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i, t).replace(/[_\s]/g, ".");
									return {
										name: f.OS_MAP.iOS,
										version: n
									};
								}
							},
							{
								test: function(t) {
									var n = !t.test(/like android/i), i = t.test(/android/i);
									return n && i;
								},
								describe: function(t) {
									var n = d.default.getFirstMatch(/android[\s/-](\d+(\.\d+)*)/i, t), i = d.default.getAndroidVersionName(n), s = {
										name: f.OS_MAP.Android,
										version: n
									};
									return i && (s.versionName = i), s;
								}
							},
							{
								test: [/(web|hpw)[o0]s/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/(?:web|hpw)[o0]s\/(\d+(\.\d+)*)/i, t), i = { name: f.OS_MAP.WebOS };
									return n && n.length && (i.version = n), i;
								}
							},
							{
								test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i, t) || d.default.getFirstMatch(/blackberry\d+\/(\d+([_\s]\d+)*)/i, t) || d.default.getFirstMatch(/\bbb(\d+)/i, t);
									return {
										name: f.OS_MAP.BlackBerry,
										version: n
									};
								}
							},
							{
								test: [/bada/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/bada\/(\d+(\.\d+)*)/i, t);
									return {
										name: f.OS_MAP.Bada,
										version: n
									};
								}
							},
							{
								test: [/tizen/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/tizen[/\s](\d+(\.\d+)*)/i, t);
									return {
										name: f.OS_MAP.Tizen,
										version: n
									};
								}
							},
							{
								test: [/linux/i],
								describe: function() {
									return { name: f.OS_MAP.Linux };
								}
							},
							{
								test: [/CrOS/],
								describe: function() {
									return { name: f.OS_MAP.ChromeOS };
								}
							},
							{
								test: [/PlayStation 4/],
								describe: function(t) {
									var n = d.default.getFirstMatch(/PlayStation 4[/\s](\d+(\.\d+)*)/i, t);
									return {
										name: f.OS_MAP.PlayStation4,
										version: n
									};
								}
							}
						];
						n.default = p, t.exports = n.default;
					},
					94: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s, d = (s = i(17)) && s.__esModule ? s : { default: s }, f = i(18), p = [
							{
								test: [/googlebot/i],
								describe: function() {
									return {
										type: "bot",
										vendor: "Google"
									};
								}
							},
							{
								test: [/huawei/i],
								describe: function(t) {
									var n = d.default.getFirstMatch(/(can-l01)/i, t) && "Nova", i = {
										type: f.PLATFORMS_MAP.mobile,
										vendor: "Huawei"
									};
									return n && (i.model = n), i;
								}
							},
							{
								test: [/nexus\s*(?:7|8|9|10).*/i],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.tablet,
										vendor: "Nexus"
									};
								}
							},
							{
								test: [/ipad/i],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.tablet,
										vendor: "Apple",
										model: "iPad"
									};
								}
							},
							{
								test: [/Macintosh(.*?) FxiOS(.*?)\//],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.tablet,
										vendor: "Apple",
										model: "iPad"
									};
								}
							},
							{
								test: [/kftt build/i],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.tablet,
										vendor: "Amazon",
										model: "Kindle Fire HD 7"
									};
								}
							},
							{
								test: [/silk/i],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.tablet,
										vendor: "Amazon"
									};
								}
							},
							{
								test: [/tablet(?! pc)/i],
								describe: function() {
									return { type: f.PLATFORMS_MAP.tablet };
								}
							},
							{
								test: function(t) {
									var n = t.test(/ipod|iphone/i), i = t.test(/like (ipod|iphone)/i);
									return n && !i;
								},
								describe: function(t) {
									var n = d.default.getFirstMatch(/(ipod|iphone)/i, t);
									return {
										type: f.PLATFORMS_MAP.mobile,
										vendor: "Apple",
										model: n
									};
								}
							},
							{
								test: [/nexus\s*[0-6].*/i, /galaxy nexus/i],
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.mobile,
										vendor: "Nexus"
									};
								}
							},
							{
								test: [/[^-]mobi/i],
								describe: function() {
									return { type: f.PLATFORMS_MAP.mobile };
								}
							},
							{
								test: function(t) {
									return t.getBrowserName(!0) === "blackberry";
								},
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.mobile,
										vendor: "BlackBerry"
									};
								}
							},
							{
								test: function(t) {
									return t.getBrowserName(!0) === "bada";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.mobile };
								}
							},
							{
								test: function(t) {
									return t.getBrowserName() === "windows phone";
								},
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.mobile,
										vendor: "Microsoft"
									};
								}
							},
							{
								test: function(t) {
									var n = Number(String(t.getOSVersion()).split(".")[0]);
									return t.getOSName(!0) === "android" && n >= 3;
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.tablet };
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "android";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.mobile };
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "macos";
								},
								describe: function() {
									return {
										type: f.PLATFORMS_MAP.desktop,
										vendor: "Apple"
									};
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "windows";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.desktop };
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "linux";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.desktop };
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "playstation 4";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.tv };
								}
							},
							{
								test: function(t) {
									return t.getOSName(!0) === "roku";
								},
								describe: function() {
									return { type: f.PLATFORMS_MAP.tv };
								}
							}
						];
						n.default = p, t.exports = n.default;
					},
					95: function(t, n, i) {
						"use strict";
						n.__esModule = !0, n.default = void 0;
						var s, d = (s = i(17)) && s.__esModule ? s : { default: s }, f = i(18), p = [
							{
								test: function(t) {
									return t.getBrowserName(!0) === "microsoft edge";
								},
								describe: function(t) {
									if (/\sedg\//i.test(t)) return { name: f.ENGINE_MAP.Blink };
									var n = d.default.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i, t);
									return {
										name: f.ENGINE_MAP.EdgeHTML,
										version: n
									};
								}
							},
							{
								test: [/trident/i],
								describe: function(t) {
									var n = { name: f.ENGINE_MAP.Trident }, i = d.default.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: function(t) {
									return t.test(/presto/i);
								},
								describe: function(t) {
									var n = { name: f.ENGINE_MAP.Presto }, i = d.default.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: function(t) {
									var n = t.test(/gecko/i), i = t.test(/like gecko/i);
									return n && !i;
								},
								describe: function(t) {
									var n = { name: f.ENGINE_MAP.Gecko }, i = d.default.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							},
							{
								test: [/(apple)?webkit\/537\.36/i],
								describe: function() {
									return { name: f.ENGINE_MAP.Blink };
								}
							},
							{
								test: [/(apple)?webkit/i],
								describe: function(t) {
									var n = { name: f.ENGINE_MAP.WebKit }, i = d.default.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i, t);
									return i && (n.version = i), n;
								}
							}
						];
						n.default = p, t.exports = n.default;
					}
				});
			});
		},
		"./node_modules/requestidlecallback-polyfill/index.js": () => {
			window.requestIdleCallback = window.requestIdleCallback || function(t) {
				var n = Date.now();
				return setTimeout(function() {
					t({
						didTimeout: !1,
						timeRemaining: function() {
							return Math.max(0, 50 - (Date.now() - n));
						}
					});
				}, 1);
			}, window.cancelIdleCallback = window.cancelIdleCallback || function(t) {
				clearTimeout(t);
			};
		},
		"./src/styles/main.scss": () => {
			GM_addStyle(".vot-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-ontheme));background-color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;outline:none;font-size:14px;font-weight:500;line-height:36px;transition:box-shadow .2s;display:inline-block;position:relative;box-shadow:0 3px 1px -2px #0003,0 2px 2px #00000024,0 1px 5px #0000001f;border:none!important;border-radius:4px!important;padding:0 16px!important}.vot-button[hidden]{display:none!important}.vot-button::-moz-focus-inner{border:none!important}.vot-button:before,.vot-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-button:before{background-color:rgb(var(--vot-helper-ontheme));transition:opacity .2s}.vot-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-button:hover{box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f}.vot-button:hover:before{opacity:.08}.vot-button:active{box-shadow:0 5px 5px -3px #0003,0 8px 10px 1px #00000024,0 3px 14px 2px #0000001f}.vot-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size}.vot-button[disabled=true]{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.12);color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);box-shadow:none;cursor:initial}.vot-button[disabled=true]:before,.vot-button[disabled=true]:after{opacity:0}.vot-outlined-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:34px;display:inline-block;position:relative;border:solid 1px rgba(var(--vot-onsurface-rgb,0,0,0),.24)!important;border-radius:4px!important;margin:0!important;padding:0 16px!important}.vot-outlined-button[hidden]{display:none!important}.vot-outlined-button::-moz-focus-inner{border:none!important}.vot-outlined-button:before,.vot-outlined-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:3px!important}.vot-outlined-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-outlined-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-outlined-button:hover:before{opacity:.04}.vot-outlined-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-outlined-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-outlined-button[disabled=true]:before,.vot-outlined-button[disabled=true]:after{opacity:0}.vot-text-button{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;min-width:64px;height:36px;color:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative;border:none!important;border-radius:4px!important;margin:0!important;padding:0 8px!important}.vot-text-button[hidden]{display:none!important}.vot-text-button::-moz-focus-inner{border:none!important}.vot-text-button:before,.vot-text-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-text-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-text-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-text-button:hover:before{opacity:.04}.vot-text-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-text-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-text-button[disabled=true]:before,.vot-text-button[disabled=true]:after{opacity:0}.vot-icon-button{--vot-helper-onsurface:rgba(var(--vot-onsurface-rgb,0,0,0),.87);box-sizing:border-box;vertical-align:middle;text-align:center;text-overflow:ellipsis;width:36px;height:36px;fill:var(--vot-helper-onsurface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:14px;font-weight:500;line-height:36px;display:inline-block;position:relative;border:none!important;border-radius:50%!important;margin:0!important;padding:0!important}.vot-icon-button[hidden]{display:none!important}.vot-icon-button::-moz-focus-inner{border:none!important}.vot-icon-button:before,.vot-icon-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-icon-button:before{background-color:var(--vot-helper-onsurface);transition:opacity .2s}.vot-icon-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity .3s,background-size .4s}.vot-icon-button:hover:before{opacity:.04}.vot-icon-button:active:after{opacity:.32;background-size:100% 100%;transition:background-size,opacity}.vot-icon-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);fill:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-icon-button[disabled=true]:before,.vot-icon-button[disabled=true]:after{opacity:0}.vot-icon-button svg{fill:inherit;stroke:inherit;width:24px;height:36px}.vot-hotkey{justify-content:space-between;align-items:start;display:flex}.vot-hotkey-label{word-break:break-word;max-width:80%}.vot-hotkey-button{--vot-helper-surface:rgba(var(--vot-onsurface-rgb),.2);--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));box-sizing:border-box;vertical-align:middle;text-align:center;width:fit-content;min-width:32px;height:fit-content;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:pointer;background-color:#0000;outline:none;font-size:15px;line-height:1.5;display:inline-block;position:relative;border:solid 1px rgba(var(--vot-onsurface-rgb,0,0,0),.24)!important;border-radius:4px!important;margin:0!important;padding:0 8px!important}.vot-hotkey-button[hidden]{display:none!important}.vot-hotkey-button::-moz-focus-inner{border:none!important}.vot-hotkey-button:before,.vot-hotkey-button:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:3px!important}.vot-hotkey-button:before{background-color:rgb(var(--vot-helper-theme));transition:opacity .2s}.vot-hotkey-button:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-hotkey-button:hover:before{opacity:.04}.vot-hotkey-button:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-hotkey-button[data-status=active]{color:rgb(var(--vot-helper-theme))}.vot-hotkey-button[data-status=active]:before{opacity:.04}.vot-hotkey-button[disabled=true]{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial;background-color:#0000}.vot-hotkey-button[disabled=true]:before,.vot-hotkey-button[disabled=true]:after{opacity:0}.vot-textfield{display:inline-block;--vot-helper-theme:rgb(var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243)))!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari3:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif)!important;text-align:start!important;padding-top:6px!important;font-size:16px!important;line-height:1.5!important;position:relative!important}.vot-textfield[hidden]{display:none!important}.vot-textfield>input,.vot-textfield>textarea{box-sizing:border-box!important;border-style:solid!important;border-width:1px!important;border-color:transparent var(--vot-helper-safari2)var(--vot-helper-safari2)!important;width:100%!important;height:inherit!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;-webkit-text-fill-color:currentColor!important;font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;caret-color:var(--vot-helper-theme)!important;background-color:#0000!important;border-radius:4px!important;margin:0!important;padding:15px 13px!important;transition:border .2s,box-shadow .2s!important;box-shadow:inset 1px 0 #0000,inset -1px 0 #0000,inset 0 -1px #0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-moz-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>textarea:not(:focus):not(.vot-show-placeholer)::-webkit-input-placeholder{color:#0000!important}.vot-textfield>input:not(:focus):placeholder-shown,.vot-textfield>textarea:not(:focus):placeholder-shown{border-top-color:var(--vot-helper-safari2)!important}.vot-textfield>input+span,.vot-textfield>textarea+span{font-family:inherit;width:100%!important;max-height:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;cursor:text!important;pointer-events:none!important;font-size:75%!important;line-height:15px!important;transition:color .2s,font-size .2s,line-height .2s!important;display:flex!important;position:absolute!important;top:0!important;left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span,.vot-textfield>textarea:not(:focus):placeholder-shown+span{font-size:inherit!important;line-height:68px!important}.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{content:\"\"!important;box-sizing:border-box!important;border-top:solid 1px var(--vot-helper-safari2)!important;pointer-events:none!important;min-width:10px!important;height:8px!important;margin-top:6px!important;transition:border .2s,box-shadow .2s!important;display:block!important;box-shadow:inset 0 1px #0000!important}.vot-textfield>input+span:before,.vot-textfield>textarea+span:before{border-left:1px solid #0000!important;border-radius:4px 0!important;margin-right:4px!important}.vot-textfield>input+span:after,.vot-textfield>textarea+span:after{border-right:1px solid #0000!important;border-radius:0 4px!important;flex-grow:1!important;margin-left:4px!important}.vot-textfield>input.vot-show-placeholer+span:before,.vot-textfield>textarea.vot-show-placeholer+span:before{margin-right:0!important}.vot-textfield>input.vot-show-placeholer+span:after,.vot-textfield>textarea.vot-show-placeholer+span:after{margin-left:0!important}.vot-textfield>input:not(:focus):placeholder-shown+span:before,.vot-textfield>input:not(:focus):placeholder-shown+span:after,.vot-textfield>textarea:not(:focus):placeholder-shown+span:before,.vot-textfield>textarea:not(:focus):placeholder-shown+span:after{border-top-color:#0000!important}.vot-textfield:hover>input:not(:disabled),.vot-textfield:hover>textarea:not(:disabled){border-color:transparent var(--vot-helper-safari3)var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled)+span:before,.vot-textfield:hover>input:not(:disabled)+span:after,.vot-textfield:hover>textarea:not(:disabled)+span:before,.vot-textfield:hover>textarea:not(:disabled)+span:after{border-top-color:var(--vot-helper-safari3)!important}.vot-textfield:hover>input:not(:disabled):not(:focus):placeholder-shown,.vot-textfield:hover>textarea:not(:disabled):not(:focus):placeholder-shown{border-color:var(--vot-helper-safari3)!important}.vot-textfield>input:focus,.vot-textfield>textarea:focus{border-color:transparent var(--vot-helper-theme)var(--vot-helper-theme)!important;box-shadow:inset 1px 0 var(--vot-helper-theme),inset -1px 0 var(--vot-helper-theme),inset 0 -1px var(--vot-helper-theme)!important;outline:none!important}.vot-textfield>input:focus+span,.vot-textfield>textarea:focus+span{color:var(--vot-helper-theme)!important}.vot-textfield>input:focus+span:before,.vot-textfield>input:focus+span:after,.vot-textfield>textarea:focus+span:before,.vot-textfield>textarea:focus+span:after{border-top-color:var(--vot-helper-theme)!important;box-shadow:inset 0 1px var(--vot-helper-theme)!important}.vot-textfield>input:disabled,.vot-textfield>input:disabled+span,.vot-textfield>textarea:disabled,.vot-textfield>textarea:disabled+span{border-color:transparent var(--vot-helper-safari1)var(--vot-helper-safari1)!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important;pointer-events:none!important}.vot-textfield>input:disabled+span:before,.vot-textfield>input:disabled+span:after,.vot-textfield>textarea:disabled+span:before,.vot-textfield>textarea:disabled+span:after,.vot-textfield>input:disabled:placeholder-shown,.vot-textfield>input:disabled:placeholder-shown+span,.vot-textfield>textarea:disabled:placeholder-shown,.vot-textfield>textarea:disabled:placeholder-shown+span{border-top-color:var(--vot-helper-safari1)!important}.vot-textfield>input:disabled:placeholder-shown+span:before,.vot-textfield>input:disabled:placeholder-shown+span:after,.vot-textfield>textarea:disabled:placeholder-shown+span:before,.vot-textfield>textarea:disabled:placeholder-shown+span:after{border-top-color:#0000!important}@media not all and (-webkit-min-device-pixel-ratio:.0000264583),not all and (min-resolution:.001dpcm){@supports ((-webkit-appearance:none)){.vot-textfield>input,.vot-textfield>input+span,.vot-textfield>textarea,.vot-textfield>textarea+span,.vot-textfield>input+span:before,.vot-textfield>input+span:after,.vot-textfield>textarea+span:before,.vot-textfield>textarea+span:after{transition-duration:.1s!important}}}.vot-checkbox{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));--vot-helper-ontheme:var(--vot-ontheme-rgb,var(--vot-onprimary-rgb,255,255,255));z-index:0;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;font-size:16px;line-height:1.5;display:inline-block;position:relative}.vot-checkbox-sub{padding-left:28px!important}.vot-checkbox[hidden]{display:none!important}.vot-checkbox>input{-webkit-appearance:none;appearance:none;z-index:10000;box-sizing:border-box;opacity:1;cursor:pointer;background:0 0;outline:none;width:18px;height:18px;transition:border-color .2s,background-color .2s;display:block;position:absolute;border:2px solid!important;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;border-radius:2px!important;margin:3px 1px!important;padding:0!important}.vot-checkbox>input+span{box-sizing:border-box;width:inherit;cursor:pointer;font-family:inherit;font-weight:400;display:inline-block;position:relative;padding-left:30px!important}.vot-checkbox>input+span:before{content:\"\";background-color:rgb(var(--vot-onsurface-rgb,0,0,0));opacity:0;pointer-events:none;width:40px;height:40px;transition:opacity .3s,transform .2s;display:block;position:absolute;top:-8px;left:-10px;transform:scale(1);border-radius:50%!important}.vot-checkbox>input+span:after{content:\"\";z-index:10000;pointer-events:none;width:10px;height:5px;transition:border-color .2s;display:block;position:absolute;top:3px;left:1px;transform:translate(3px,4px)rotate(-45deg);box-sizing:content-box!important;border:0 solid #0000!important;border-width:0 0 2px 2px!important}.vot-checkbox>input:checked,.vot-checkbox>input:indeterminate{background-color:rgb(var(--vot-helper-theme));border-color:rgb(var(--vot-helper-theme))!important}.vot-checkbox>input:checked+span:before,.vot-checkbox>input:indeterminate+span:before{background-color:rgb(var(--vot-helper-theme))}.vot-checkbox>input:checked+span:after,.vot-checkbox>input:indeterminate+span:after{border-color:rgb(var(--vot-helper-ontheme,255,255,255))!important}.vot-checkbox>input:hover{box-shadow:none!important}.vot-checkbox>input:indeterminate+span:after{transform:translate(4px,3px);border-left-width:0!important}.vot-checkbox:hover>input+span:before{opacity:.04}.vot-checkbox:active>input,.vot-checkbox:active:hover>input:not(:disabled){border-color:rgb(var(--vot-helper-theme))!important}.vot-checkbox:active>input:checked{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.6);border-color:#0000!important}.vot-checkbox:active>input+span:before{opacity:1;transition:transform,opacity;transform:scale(0)}.vot-checkbox>input:disabled{cursor:initial;border-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-checkbox>input:disabled:checked,.vot-checkbox>input:disabled:indeterminate{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);border-color:#0000!important}.vot-checkbox>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38);cursor:initial}.vot-checkbox>input:disabled+span:before{opacity:0;transform:scale(0)}.vot-slider{display:inline-block;--vot-safari-helper1:rgba(var(--vot-primary-rgb,33,150,243),.04)!important;--vot-safari-helper2:rgba(var(--vot-primary-rgb,33,150,243),.12)!important;--vot-safari-helper3:rgba(var(--vot-primary-rgb,33,150,243),.16)!important;--vot-safari-helper4:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;width:100%!important;color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important;font-family:var(--vot-font,\"Roboto\",\"Segoe UI\",BlinkMacSystemFont,system-ui,-apple-system)!important;text-align:start!important;font-size:16px!important;line-height:1.5!important}.vot-slider[hidden]{display:none!important}.vot-slider>input{-webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;background-color:#0000!important;border:none!important;width:100%!important;height:36px!important;margin:0 0 -36px!important;padding:0!important;display:block!important;position:relative!important;top:24px!important}.vot-slider>input:hover{box-shadow:none!important}.vot-slider>input:last-child{margin:0!important;position:static!important}.vot-slider>input:before{content:\"\"!important;width:calc(100%*var(--vot-progress,0))!important;background:rgb(var(--vot-primary-rgb,33,150,243))!important;height:2px!important;display:block!important;position:absolute!important;top:calc(50% - 1px)!important}.vot-slider>input:disabled{cursor:default!important;opacity:.38!important}.vot-slider>input:disabled+span{color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-webkit-slider-runnable-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-track{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-lower{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-ms-fill-upper{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)!important}.vot-slider>input:disabled::-moz-range-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-webkit-slider-thumb{background-color:rgb(var(--vot-onsurface-rgb,0,0,0))!important;box-shadow:0 0 0 1px rgb(var(--vot-surface-rgb,255,255,255))!important;transform:scale(4)!important}.vot-slider>input:disabled::-ms-fill-upper{opacity:.38!important}.vot-slider>input:disabled::-moz-range-progress{background-color:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-slider>input:disabled:-webkit-slider-thumb{color:rgb(var(--vot-surface-rgb,255,255,255))!important}.vot-slider>input:active::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper4)!important}.vot-slider>input:active::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:active::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.24)!important}.vot-slider>input:focus{outline:none!important}.vot-slider>input::-webkit-slider-runnable-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-moz-range-track{background-color:rgba(var(--vot-primary-rgb,33,150,243),.24)!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important}.vot-slider>input::-ms-track{box-sizing:border-box!important;background-color:#0000!important;border:none!important;border-radius:1px!important;width:100%!important;height:2px!important;margin:17px 0!important;padding:0 17px!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-moz-range-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-ms-thumb{-webkit-appearance:none!important;appearance:none!important;background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border:none!important;border-radius:50%!important;width:2px!important;height:2px!important;transition:box-shadow .2s!important;transform:scale(6)!important}.vot-slider>input::-webkit-slider-thumb{-webkit-appearance:none!important;margin:0!important}.vot-slider>input::-moz-range-thumb{-moz-appearance:none!important}.vot-slider>input::-ms-thumb{margin:0 17px!important}.vot-slider>input::-moz-range-progress{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-lower{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-ms-fill-upper{background-color:rgb(var(--vot-primary-rgb,33,150,243))!important;border-radius:1px!important;height:2px!important}.vot-slider>input::-moz-focus-outer{border:none!important}.vot-slider>span{margin-bottom:36px!important;display:inline-block!important}.vot-slider:hover>input::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--vot-safari-helper1)!important}.vot-slider:hover>input::-ms-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-slider:hover>input:hover::-moz-range-thumb{box-shadow:0 0 0 2px rgba(var(--vot-primary-rgb,33,150,243),.04)!important}.vot-slider-label-value{margin-left:4px!important}.vot-select{font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;font-size:14px;font-weight:400;line-height:1.5;display:flex;--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0)!important;--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87)!important;--vot-helper-safari1:rgba(var(--vot-onsurface-rgb,0,0,0),.6)!important;--vot-helper-safari2:rgba(var(--vot-onsurface-rgb,0,0,0),.87)!important}.vot-select[hidden]{display:none!important}.vot-select-outer{cursor:pointer;justify-content:space-between;align-items:center;width:120px;max-width:120px;display:flex;border:1px solid var(--vot-helper-safari1)!important;border-radius:4px!important;padding:0 5px!important;transition:border .2s!important}.vot-select-outer:hover{border-color:var(--vot-helper-safari2)!important}.vot-select-title{text-overflow:ellipsis;white-space:nowrap;font-family:inherit;overflow:hidden}.vot-select-arrow-icon{justify-content:center;align-items:center;width:20px;height:32px;display:flex}.vot-select-arrow-icon svg{fill:inherit;stroke:inherit}.vot-select-content-list{flex-direction:column;display:flex}.vot-select-content-list .vot-select-content-item{cursor:pointer;border-radius:8px!important;padding:5px 10px!important}.vot-select-content-list .vot-select-content-item:not([inert]):hover{background-color:#2a2c31}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]{color:rgb(var(--vot-primary-rgb,33,150,243));background-color:rgba(var(--vot-primary-rgb,33,150,243),.2)}.vot-select-content-list .vot-select-content-item[data-vot-selected=true]:hover{background-color:rgba(var(--vot-primary-rgb,33,150,243),.1)!important}.vot-select-content-list .vot-select-content-item[inert]{cursor:default;color:rgba(var(--vot-onsurface-rgb,0,0,0),.38)}.vot-select-content-list .vot-select-content-item[hidden]{display:none!important}.vot-header{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;font-weight:700;line-height:1.5}.vot-header[hidden]{display:none!important}.vot-header:not(:first-child){padding-top:8px}.vot-header-level-1{font-size:2em}.vot-header-level-2{font-size:1.5em}.vot-header-level-3{font-size:1.17em}.vot-header-level-4{font-size:1em}.vot-header-level-5{font-size:.83em}.vot-header-level-6{font-size:.67em}.vot-info{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;-webkit-user-select:text;user-select:text;font-size:16px;line-height:1.5;display:flex}.vot-info[hidden]{display:none!important}.vot-info>:not(:first-child){color:rgba(var(--vot-helper-onsurface-rgb),.5);flex:1;margin-left:8px!important}.vot-details{color:rgba(var(--vot-helper-onsurface-rgb),.87);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);text-align:start;cursor:pointer;justify-content:space-between;align-items:center;font-size:16px;line-height:1.5;transition:background .5s;display:flex;border-radius:.5em!important;margin:-.5em!important;padding:.5em!important}.vot-details[hidden]{display:none!important}.vot-details-arrow-icon{width:20px;height:32px;fill:rgba(var(--vot-helper-onsurface-rgb),.87);justify-content:center;align-items:center;display:flex;transform:scale(1.25)rotate(-90deg)}.vot-details:hover{background:rgba(var(--vot-onsurface-rgb,0,0,0),.04)}.vot-lang-select{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);color:var(--vot-helper-theme);fill:var(--vot-helper-theme);justify-content:space-between;align-items:center;display:flex}.vot-lang-select[hidden]{display:none!important}.vot-lang-select-icon{justify-content:center;align-items:center;width:32px;height:32px;display:flex}.vot-lang-select-icon svg{fill:inherit;stroke:inherit}.vot-segmented-button{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);-webkit-user-select:none;user-select:none;background:rgb(var(--vot-surface-rgb,255,255,255));max-width:100vw;height:32px;color:var(--vot-helper-theme);fill:var(--vot-helper-theme);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;align-items:center;font-size:16px;line-height:1.5;transition:opacity .5s;display:flex;position:absolute;top:5rem;left:50%;overflow:hidden;transform:translate(-50%);border-radius:4px!important}.vot-segmented-button[hidden]{display:none!important}.vot-segmented-button *{box-sizing:border-box!important}.vot-segmented-button .vot-separator{background:rgba(var(--vot-helper-theme-rgb),.1);width:1px;height:50%}.vot-segmented-button .vot-separator[hidden]{display:none!important}.vot-segmented-button .vot-segment,.vot-segmented-button .vot-segment-only-icon{height:100%;color:inherit;background-color:#0000;justify-content:center;align-items:center;transition:background-color .1s ease-in-out;display:flex;position:relative;overflow:hidden;border:none!important;padding:0 8px!important}.vot-segmented-button .vot-segment[hidden],.vot-segmented-button [hidden].vot-segment-only-icon{display:none!important}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before,.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{content:\"\";opacity:0;position:absolute;top:0;bottom:0;left:0;right:0;border-radius:inherit!important}.vot-segmented-button .vot-segment:before,.vot-segmented-button .vot-segment-only-icon:before{background-color:rgb(var(--vot-helper-theme-rgb));transition:opacity .2s}.vot-segmented-button .vot-segment:after,.vot-segmented-button .vot-segment-only-icon:after{background:radial-gradient(circle,currentColor 1%,#0000 1%) 50%/10000% 10000% no-repeat;transition:opacity 1s,background-size .5s}.vot-segmented-button .vot-segment:hover:before,.vot-segmented-button .vot-segment-only-icon:hover:before{opacity:.04}.vot-segmented-button .vot-segment:active:after,.vot-segmented-button .vot-segment-only-icon:active:after{opacity:.16;background-size:100% 100%;transition:background-size}.vot-segmented-button .vot-segment-only-icon{min-width:32px;padding:0!important}.vot-segmented-button .vot-segment-label{white-space:nowrap;color:inherit;font-weight:400;margin-left:8px!important}.vot-segmented-button[data-status=success] .vot-translate-button{color:rgb(var(--vot-primary-rgb,33,150,243));fill:rgb(var(--vot-primary-rgb,33,150,243))}.vot-segmented-button[data-status=error] .vot-translate-button{color:#f28b82;fill:#f28b82}.vot-segmented-button[data-loading=true] #vot-loading-icon{display:block!important}.vot-segmented-button[data-loading=true] #vot-translate-icon{display:none!important}.vot-segmented-button[data-direction=column]{flex-direction:column;height:fit-content}.vot-segmented-button[data-direction=column] .vot-segment-label{display:none}.vot-segmented-button[data-direction=column]>.vot-segment-only-icon,.vot-segmented-button[data-direction=column]>.vot-segment{padding:8px!important}.vot-segmented-button[data-direction=column] .vot-separator{width:50%;height:1px}.vot-segmented-button[data-position=left]{top:12.5vh;left:50px}.vot-segmented-button[data-position=right]{top:12.5vh;left:auto;right:0}.vot-segmented-button svg{width:24px;fill:inherit;stroke:inherit}.vot-tooltip{--vot-helper-theme-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-theme:rgba(var(--vot-helper-theme-rgb),.87);--vot-helper-ondialog:rgb(var(--vot-ondialog-rgb,37,38,40));--vot-helper-border:rgb(var(--vot-tooltip-border,69,69,69));-webkit-user-select:none;user-select:none;background:rgb(var(--vot-surface-rgb,255,255,255));color:var(--vot-helper-theme);fill:var(--vot-helper-theme);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;opacity:0;align-items:center;width:max-content;max-width:calc(100vw - 10px);height:max-content;font-size:14px;line-height:1.5;transition:opacity .5s;display:flex;position:absolute;top:0;bottom:0;left:0;right:0;overflow:hidden;box-shadow:0 1px 3px #0000001f;border-radius:4px!important;padding:4px 8px!important}.vot-tooltip[hidden]{display:none!important}.vot-tooltip[data-trigger=click]{-webkit-user-select:text;user-select:text}.vot-tooltip.vot-tooltip-bordered{border:1px solid var(--vot-helper-border)}.vot-tooltip *{box-sizing:border-box!important}.vot-menu{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);-webkit-user-select:none;user-select:none;background-color:var(--vot-helper-surface);color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);cursor:default;z-index:2147483647;visibility:visible;opacity:1;transform-origin:top;min-width:300px;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;position:absolute;top:calc(5rem + 48px);left:50%;overflow:hidden;transform:translate(-50%)scale(1);border-radius:8px!important}.vot-menu *{box-sizing:border-box!important}.vot-menu[hidden]{pointer-events:none;visibility:hidden;opacity:0;transform:translate(-50%)scale(0);display:block!important}.vot-menu-content-wrapper{min-height:100px;max-height:calc(var(--vot-container-height,75vh) - (5rem + 32px + 16px)*2);flex-direction:column;display:flex;overflow:auto}.vot-menu-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-menu-header-container:empty{padding:0 0 16px!important}.vot-menu-header-container>.vot-icon-button{margin-inline-end:4px!important;margin-top:4px!important}.vot-menu-title-container{font-size:inherit;font-weight:inherit;text-align:start;outline:0;flex:1;display:flex;margin:0!important}.vot-menu-title{flex:1;font-size:16px;font-weight:400;line-height:1;padding:16px!important}.vot-menu-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:8px;min-height:1.375rem;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important;padding:0 16px!important}.vot-menu-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-menu-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-menu-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-menu-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-menu-footer-container{flex-shrink:0;justify-content:flex-end;display:flex;padding:16px!important}.vot-menu-footer-container:empty{padding:16px 0 0!important}.vot-menu[data-position=left]{transform-origin:0;top:12.5vh;left:240px}.vot-menu[data-position=right]{transform-origin:100%;top:12.5vh;left:auto;right:-80px}.vot-dialog{--vot-helper-surface-rgb:var(--vot-surface-rgb,255,255,255);--vot-helper-surface:rgb(var(--vot-helper-surface-rgb));--vot-helper-onsurface-rgb:var(--vot-onsurface-rgb,0,0,0);--vot-helper-onsurface:rgba(var(--vot-helper-onsurface-rgb),.87);max-width:initial;max-height:initial;width:min(var(--vot-dialog-width,512px),100%);top:50%;bottom:50%;background-color:var(--vot-helper-surface);height:fit-content;color:var(--vot-helper-onsurface);font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);-webkit-user-select:none;user-select:none;visibility:visible;opacity:1;transform-origin:50%;border-radius:8px;font-size:16px;line-height:1.5;transition:opacity .3s,transform .1s;display:block;position:fixed;top:0;bottom:0;left:0;right:0;overflow-x:auto;overflow-y:hidden;transform:scale(1);box-shadow:0 0 16px #0000001f,0 16px 16px #0000003d;margin:auto!important;padding:0!important}[hidden]>.vot-dialog{pointer-events:none;opacity:0;transition:opacity .1s,transform .2s;transform:scale(.5)}.vot-dialog-container{visibility:visible;z-index:2147483647;position:absolute}.vot-dialog-container[hidden]{pointer-events:none;visibility:hidden;display:block!important}.vot-dialog-container *{box-sizing:border-box!important}.vot-dialog-backdrop{opacity:1;background-color:#0009;transition:opacity .3s;position:fixed;top:0;bottom:0;left:0;right:0}[hidden]>.vot-dialog-backdrop{pointer-events:none;opacity:0}.vot-dialog-content-wrapper{flex-direction:column;max-height:75vh;display:flex;overflow:auto}.vot-dialog-header-container{flex-shrink:0;align-items:flex-start;min-height:31px;display:flex}.vot-dialog-header-container:empty{padding:0 0 20px}.vot-dialog-header-container>.vot-icon-button{margin-inline-end:4px!important;margin-top:4px!important}.vot-dialog-title-container{font-size:inherit;font-weight:inherit;outline:0;flex:1;display:flex;margin:0!important}.vot-dialog-title{flex:1;font-size:115.385%;font-weight:700;line-height:1;padding:20px 20px 16px!important}.vot-dialog-body-container{box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;gap:16px;min-height:1.375rem;display:flex;overflow:auto;scrollbar-color:rgba(var(--vot-helper-onsurface-rgb),.1)var(--vot-helper-surface)!important;padding:0 20px!important}.vot-dialog-body-container::-webkit-scrollbar{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-track{background:var(--vot-helper-surface)!important;width:12px!important;height:12px!important}.vot-dialog-body-container::-webkit-scrollbar-thumb{background:rgba(var(--vot-helper-onsurface-rgb),.1)!important;border:5px solid var(--vot-helper-surface)!important;-webkit-border-radius:1ex!important}.vot-dialog-body-container::-webkit-scrollbar-thumb:hover{border:3px solid var(--vot-helper-surface)!important}.vot-dialog-body-container::-webkit-scrollbar-corner{background:var(--vot-helper-surface)!important}.vot-dialog-footer-container{flex-shrink:0;justify-content:flex-end;display:flex;padding:16px!important}.vot-dialog-footer-container:empty{padding:20px 0 0!important}.vot-inline-loader{aspect-ratio:5;--vot-loader-bg:no-repeat radial-gradient(farthest-side,rgba(var(--vot-onsurface-rgb,0,0,0),.38)94%,transparent);background:var(--vot-loader-bg),var(--vot-loader-bg),var(--vot-loader-bg),var(--vot-loader-bg);background-size:20% 100%;height:8px;animation:.75s infinite alternate dotsSlide,1.5s infinite alternate dotsFlip}.vot-loader-text{--vot-helper-theme:var(--vot-theme-rgb,var(--vot-primary-rgb,33,150,243));fill:rgb(var(--vot-helper-theme));font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);font-size:12px;font-weight:500}@keyframes dotsSlide{0%,10%{background-position:0 0,0 0,0 0,0 0}33%{background-position:0 0,33.3333% 0,33.3333% 0,33.3333% 0}66%{background-position:0 0,33.3333% 0,66.6667% 0,66.6667% 0}90%,to{background-position:0 0,33.3333% 0,66.6667% 0,100% 0}}@keyframes dotsFlip{0%,49.99%{transform:scale(1)}50%,to{transform:scale(-1)}}.vot-label{align-items:center;gap:4px;font-family:inherit;font-size:16px;display:flex}.vot-label-icon{width:20px;height:20px;margin-top:2px}.vot-label-icon>svg{width:20px;height:20px}.vot-account{justify-content:space-between;align-items:center;gap:1rem;display:flex}.vot-account-container,.vot-account-wrapper,.vot-account-buttons{align-items:center;gap:1rem;display:flex}.vot-account-avatar{min-width:36px;max-width:36px;min-height:36px;max-height:36px;overflow:hidden}.vot-account-avatar-img{object-fit:cover;border-radius:50%;width:36px;height:36px}.vot-account [hidden]{display:none!important}.vot-subtitles{--vot-subtitles-background:rgba(var(--vot-surface-rgb,46,47,52),var(--vot-subtitles-opacity,.8));background:var(--vot-subtitles-background,#2e2f34cc);width:max-content;max-width:100%;max-height:100%;color:var(--vot-subtitles-color,#e3e3e3);pointer-events:all;font-size:20px;font-family:var(--vot-font-family,\"Roboto\",\"Segoe UI\",system-ui,sans-serif);box-sizing:border-box;-webkit-user-select:none;user-select:none;flex-wrap:wrap;gap:0 3px;line-height:normal;display:flex;position:relative;border-radius:.5em!important;padding:.5em!important}.vot-subtitles-widget{z-index:2147483647;pointer-events:none;justify-content:center;align-items:center;width:50%;min-height:20%;max-height:100%;display:flex;position:absolute;top:75%;left:25%}.vot-subtitles-info{flex-direction:column;gap:2px;display:flex;padding:6px!important}.vot-subtitles-info-service{color:var(--vot-subtitles-context-color,#86919b);margin-bottom:8px!important;font-size:10px!important;line-height:1!important}.vot-subtitles-info-header{color:var(--vot-subtitles-header-color,#fff);margin-bottom:6px!important;font-size:20px!important;font-weight:500!important;line-height:1!important}.vot-subtitles-info-context{color:var(--vot-subtitles-context-color,#86919b);font-size:12px!important;line-height:1.2!important}.vot-subtitles span{cursor:pointer;position:relative;font-size:inherit!important;font-family:inherit!important;line-height:normal!important}.vot-subtitles span.passed{color:var(--vot-subtitles-passed-color,#2196f3)}.vot-subtitles span:before{content:\"\";z-index:-1;width:100%;height:100%;position:absolute;top:2px;bottom:2px;left:-2px;right:-2px;border-radius:4px!important;padding:0 2px!important}.vot-subtitles span:hover:before{background:var(--vot-subtitles-hover-color,#ffffff8c)}.vot-subtitles span.selected:before{background:var(--vot-subtitles-passed-color,#2196f3)}#vot-subtitles-info.vot-subtitles-info *{-webkit-user-select:text!important;user-select:text!important}:root{--vot-font-family:\"Roboto\",\"Segoe UI\",system-ui,sans-serif;--vot-primary-rgb:139,180,245;--vot-onprimary-rgb:32,33,36;--vot-surface-rgb:32,33,36;--vot-onsurface-rgb:227,227,227;--vot-subtitles-color:rgb(var(--vot-onsurface-rgb,227,227,227));--vot-subtitles-passed-color:rgb(var(--vot-primary-rgb,33,150,243))}vot-block{font-family:inherit;display:block;visibility:visible!important}.vot-portal{display:inline}.vot-portal-local{z-index:2147483647;position:fixed;top:0;left:0}");
		}
	}, n = {};
	function __webpack_require__(i) {
		var s = n[i];
		if (s !== void 0) return s.exports;
		var d = n[i] = { exports: {} };
		return t[i].call(d.exports, d, d.exports, __webpack_require__), d.exports;
	}
	__webpack_require__.d = (exports, n) => {
		for (var i in n) __webpack_require__.o(n, i) && !__webpack_require__.o(exports, i) && Object.defineProperty(exports, i, {
			enumerable: !0,
			get: n[i]
		});
	}, __webpack_require__.o = (t, n) => Object.prototype.hasOwnProperty.call(t, n);
	var i = {};
	(() => {
		"use strict";
		__webpack_require__.d(i, { k: () => Ln });
		let t = {
			version: "1.0.4",
			debug: !1,
			fetchFn: fetch.bind(window)
		};
		class FifoSampleBuffer {
			constructor() {
				this._vector = new Float32Array(), this._position = 0, this._frameCount = 0;
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
				this.receive(this._frameCount), this.rewind();
			}
			put(t) {
				this._frameCount += t;
			}
			putSamples(t, n, i = 0) {
				n ||= 0;
				let s = n * 2;
				i >= 0 || (i = (t.length - s) / 2);
				let d = i * 2;
				this.ensureCapacity(i + this._frameCount);
				let f = this.endIndex;
				this.vector.set(t.subarray(s, s + d), f), this._frameCount += i;
			}
			putBuffer(t, n, i = 0) {
				n ||= 0, i >= 0 || (i = t.frameCount - n), this.putSamples(t.vector, t.position + n, i);
			}
			receive(t) {
				(!(t >= 0) || t > this._frameCount) && (t = this.frameCount), this._frameCount -= t, this._position += t;
			}
			receiveSamples(t, n = 0) {
				let i = n * 2, s = this.startIndex;
				t.set(this._vector.subarray(s, s + i)), this.receive(n);
			}
			extract(t, n = 0, i = 0) {
				let s = this.startIndex + n * 2, d = i * 2;
				t.set(this._vector.subarray(s, s + d));
			}
			ensureCapacity(t = 0) {
				let n = parseInt(t * 2);
				if (this._vector.length < n) {
					let t = new Float32Array(n);
					t.set(this._vector.subarray(this.startIndex, this.endIndex)), this._vector = t, this._position = 0;
				} else this.rewind();
			}
			ensureAdditionalCapacity(t = 0) {
				this.ensureCapacity(this._frameCount + t);
			}
			rewind() {
				this._position > 0 && (this._vector.set(this._vector.subarray(this.startIndex, this.endIndex)), this._position = 0);
			}
		}
		class AbstractFifoSamplePipe {
			constructor(t) {
				t ? (this._inputBuffer = new FifoSampleBuffer(), this._outputBuffer = new FifoSampleBuffer()) : this._inputBuffer = this._outputBuffer = null;
			}
			get inputBuffer() {
				return this._inputBuffer;
			}
			set inputBuffer(t) {
				this._inputBuffer = t;
			}
			get outputBuffer() {
				return this._outputBuffer;
			}
			set outputBuffer(t) {
				this._outputBuffer = t;
			}
			clear() {
				this._inputBuffer.clear(), this._outputBuffer.clear();
			}
		}
		class RateTransposer extends AbstractFifoSamplePipe {
			constructor(t) {
				super(t), this.reset(), this._rate = 1;
			}
			set rate(t) {
				this._rate = t;
			}
			reset() {
				this.slopeCount = 0, this.prevSampleL = 0, this.prevSampleR = 0;
			}
			clone() {
				let t = new RateTransposer();
				return t.rate = this._rate, t;
			}
			process() {
				let t = this._inputBuffer.frameCount;
				this._outputBuffer.ensureAdditionalCapacity(t / this._rate + 1);
				let n = this.transpose(t);
				this._inputBuffer.receive(), this._outputBuffer.put(n);
			}
			transpose(t = 0) {
				if (t === 0) return 0;
				let n = this._inputBuffer.vector, i = this._inputBuffer.startIndex, s = this._outputBuffer.vector, d = this._outputBuffer.endIndex, f = 0, p = 0;
				for (; this.slopeCount < 1;) s[d + 2 * p] = (1 - this.slopeCount) * this.prevSampleL + this.slopeCount * n[i], s[d + 2 * p + 1] = (1 - this.slopeCount) * this.prevSampleR + this.slopeCount * n[i + 1], p += 1, this.slopeCount += this._rate;
				if (--this.slopeCount, t !== 1) out: for (;;) {
					for (; this.slopeCount > 1;) if (--this.slopeCount, f += 1, f >= t - 1) break out;
					let m = i + 2 * f;
					s[d + 2 * p] = (1 - this.slopeCount) * n[m] + this.slopeCount * n[m + 2], s[d + 2 * p + 1] = (1 - this.slopeCount) * n[m + 1] + this.slopeCount * n[m + 3], p += 1, this.slopeCount += this._rate;
				}
				return this.prevSampleL = n[i + 2 * t - 2], this.prevSampleR = n[i + 2 * t - 1], p;
			}
		}
		class FilterSupport {
			constructor(t) {
				this._pipe = t;
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
				throw Error("fillInputBuffer() not overridden");
			}
			fillOutputBuffer(t = 0) {
				for (; this.outputBuffer.frameCount < t;) {
					let t = 8192 * 2 - this.inputBuffer.frameCount;
					if (this.fillInputBuffer(t), this.inputBuffer.frameCount < 8192 * 2) break;
					this._pipe.process();
				}
			}
			clear() {
				this._pipe.clear();
			}
		}
		let noop = function() {};
		class SimpleFilter extends FilterSupport {
			constructor(t, n, i = noop) {
				super(n), this.callback = i, this.sourceSound = t, this.historyBufferSize = 22050, this._sourcePosition = 0, this.outputBufferPosition = 0, this._position = 0;
			}
			get position() {
				return this._position;
			}
			set position(t) {
				if (t > this._position) throw RangeError("New position may not be greater than current position");
				let n = this.outputBufferPosition - (this._position - t);
				if (n < 0) throw RangeError("New position falls outside of history buffer");
				this.outputBufferPosition = n, this._position = t;
			}
			get sourcePosition() {
				return this._sourcePosition;
			}
			set sourcePosition(t) {
				this.clear(), this._sourcePosition = t;
			}
			onEnd() {
				this.callback();
			}
			fillInputBuffer(t = 0) {
				let n = new Float32Array(t * 2), i = this.sourceSound.extract(n, t, this._sourcePosition);
				this._sourcePosition += i, this.inputBuffer.putSamples(n, 0, i);
			}
			extract(t, n = 0) {
				this.fillOutputBuffer(this.outputBufferPosition + n);
				let i = Math.min(n, this.outputBuffer.frameCount - this.outputBufferPosition);
				this.outputBuffer.extract(t, this.outputBufferPosition, i);
				let s = this.outputBufferPosition + i;
				return this.outputBufferPosition = Math.min(this.historyBufferSize, s), this.outputBuffer.receive(Math.max(s - this.historyBufferSize, 0)), this._position += i, i;
			}
			handleSampleData(t) {
				this.extract(t.data, 4096);
			}
			clear() {
				super.clear(), this.outputBufferPosition = 0;
			}
		}
		let n = 0, s = n, d = 0, f = d, p = 8, m = [
			[
				124,
				186,
				248,
				310,
				372,
				434,
				496,
				558,
				620,
				682,
				744,
				806,
				868,
				930,
				992,
				1054,
				1116,
				1178,
				1240,
				1302,
				1364,
				1426,
				1488,
				0
			],
			[
				-100,
				-75,
				-50,
				-25,
				25,
				50,
				75,
				100,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			],
			[
				-20,
				-15,
				-10,
				-5,
				5,
				10,
				15,
				20,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			],
			[
				-4,
				-3,
				-2,
				-1,
				1,
				2,
				3,
				4,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			]
		], h = .5, g = 2, _ = 125, v = 50, b = (v - _) / (g - h), x = _ - b * h, C = 25, w = 15, ee = (w - C) / (g - h), te = C - ee * h;
		class Stretch extends AbstractFifoSamplePipe {
			constructor(t) {
				super(t), this._quickSeek = !0, this.midBufferDirty = !1, this.midBuffer = null, this.overlapLength = 0, this.autoSeqSetting = !0, this.autoSeekSetting = !0, this._tempo = 1, this.setParameters(44100, s, f, p);
			}
			clear() {
				super.clear(), this.clearMidBuffer();
			}
			clearMidBuffer() {
				this.midBufferDirty && (this.midBufferDirty = !1, this.midBuffer = null);
			}
			setParameters(t, n, i, s) {
				t > 0 && (this.sampleRate = t), s > 0 && (this.overlapMs = s), n > 0 ? (this.sequenceMs = n, this.autoSeqSetting = !1) : this.autoSeqSetting = !0, i > 0 ? (this.seekWindowMs = i, this.autoSeekSetting = !1) : this.autoSeekSetting = !0, this.calculateSequenceParameters(), this.calculateOverlapLength(this.overlapMs), this.tempo = this._tempo;
			}
			set tempo(t) {
				let n;
				this._tempo = t, this.calculateSequenceParameters(), this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength), this.skipFract = 0, n = Math.floor(this.nominalSkip + .5), this.sampleReq = Math.max(n + this.overlapLength, this.seekWindowLength) + this.seekLength;
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
			calculateOverlapLength(t = 0) {
				let n;
				n = this.sampleRate * t / 1e3, n = n < 16 ? 16 : n, n -= n % 8, this.overlapLength = n, this.refMidBuffer = new Float32Array(this.overlapLength * 2), this.midBuffer = new Float32Array(this.overlapLength * 2);
			}
			checkLimits(t, n, i) {
				return t < n ? n : t > i ? i : t;
			}
			calculateSequenceParameters() {
				let t, n;
				this.autoSeqSetting && (t = x + b * this._tempo, t = this.checkLimits(t, v, _), this.sequenceMs = Math.floor(t + .5)), this.autoSeekSetting && (n = te + ee * this._tempo, n = this.checkLimits(n, w, C), this.seekWindowMs = Math.floor(n + .5)), this.seekWindowLength = Math.floor(this.sampleRate * this.sequenceMs / 1e3), this.seekLength = Math.floor(this.sampleRate * this.seekWindowMs / 1e3);
			}
			set quickSeek(t) {
				this._quickSeek = t;
			}
			clone() {
				let t = new Stretch();
				return t.tempo = this._tempo, t.setParameters(this.sampleRate, this.sequenceMs, this.seekWindowMs, this.overlapMs), t;
			}
			seekBestOverlapPosition() {
				return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo();
			}
			seekBestOverlapPositionStereo() {
				let t, n, i, s = 0;
				for (this.preCalculateCorrelationReferenceStereo(), t = 0, n = Number.MIN_VALUE; s < this.seekLength; s += 1) i = this.calculateCrossCorrelationStereo(2 * s, this.refMidBuffer), i > n && (n = i, t = s);
				return t;
			}
			seekBestOverlapPositionStereoQuick() {
				let t, n, i, s = 0, d, f;
				for (this.preCalculateCorrelationReferenceStereo(), n = Number.MIN_VALUE, t = 0, d = 0, f = 0; s < 4; s += 1) {
					let p = 0;
					for (; m[s][p] && (f = d + m[s][p], !(f >= this.seekLength));) i = this.calculateCrossCorrelationStereo(2 * f, this.refMidBuffer), i > n && (n = i, t = f), p += 1;
					d = t;
				}
				return t;
			}
			preCalculateCorrelationReferenceStereo() {
				let t = 0, n, i;
				for (; t < this.overlapLength; t += 1) i = t * (this.overlapLength - t), n = t * 2, this.refMidBuffer[n] = this.midBuffer[n] * i, this.refMidBuffer[n + 1] = this.midBuffer[n + 1] * i;
			}
			calculateCrossCorrelationStereo(t, n) {
				let i = this._inputBuffer.vector;
				t += this._inputBuffer.startIndex;
				let s = 0, d = 2, f = 2 * this.overlapLength, p;
				for (; d < f; d += 2) p = d + t, s += i[p] * n[d] + i[p + 1] * n[d + 1];
				return s;
			}
			overlap(t) {
				this.overlapStereo(2 * t);
			}
			overlapStereo(t) {
				let n = this._inputBuffer.vector;
				t += this._inputBuffer.startIndex;
				let i = this._outputBuffer.vector, s = this._outputBuffer.endIndex, d = 0, f, p, m = 1 / this.overlapLength, h, g, _;
				for (; d < this.overlapLength; d += 1) p = (this.overlapLength - d) * m, h = d * m, f = 2 * d, g = f + t, _ = f + s, i[_ + 0] = n[g + 0] * h + this.midBuffer[f + 0] * p, i[_ + 1] = n[g + 1] * h + this.midBuffer[f + 1] * p;
			}
			process() {
				let t, n, i;
				if (this.midBuffer === null) {
					if (this._inputBuffer.frameCount < this.overlapLength) return;
					this.midBuffer = new Float32Array(this.overlapLength * 2), this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength);
				}
				for (; this._inputBuffer.frameCount >= this.sampleReq;) {
					t = this.seekBestOverlapPosition(), this._outputBuffer.ensureAdditionalCapacity(this.overlapLength), this.overlap(Math.floor(t)), this._outputBuffer.put(this.overlapLength), n = this.seekWindowLength - 2 * this.overlapLength, n > 0 && this._outputBuffer.putBuffer(this._inputBuffer, t + this.overlapLength, n);
					let s = this._inputBuffer.startIndex + 2 * (t + this.seekWindowLength - this.overlapLength);
					this.midBuffer.set(this._inputBuffer.vector.subarray(s, s + 2 * this.overlapLength)), this.skipFract += this.nominalSkip, i = Math.floor(this.skipFract), this.skipFract -= i, this._inputBuffer.receive(i);
				}
			}
		}
		let testFloatEqual = function(t, n) {
			return (t > n ? t - n : n - t) > 1e-10;
		};
		class SoundTouch {
			constructor() {
				this.transposer = new RateTransposer(!1), this.stretch = new Stretch(!1), this._inputBuffer = new FifoSampleBuffer(), this._intermediateBuffer = new FifoSampleBuffer(), this._outputBuffer = new FifoSampleBuffer(), this._rate = 0, this._tempo = 0, this.virtualPitch = 1, this.virtualRate = 1, this.virtualTempo = 1, this.calculateEffectiveRateAndTempo();
			}
			clear() {
				this.transposer.clear(), this.stretch.clear();
			}
			clone() {
				let t = new SoundTouch();
				return t.rate = this.rate, t.tempo = this.tempo, t;
			}
			get rate() {
				return this._rate;
			}
			set rate(t) {
				this.virtualRate = t, this.calculateEffectiveRateAndTempo();
			}
			set rateChange(t) {
				this._rate = 1 + .01 * t;
			}
			get tempo() {
				return this._tempo;
			}
			set tempo(t) {
				this.virtualTempo = t, this.calculateEffectiveRateAndTempo();
			}
			set tempoChange(t) {
				this.tempo = 1 + .01 * t;
			}
			set pitch(t) {
				this.virtualPitch = t, this.calculateEffectiveRateAndTempo();
			}
			set pitchOctaves(t) {
				this.pitch = Math.exp(.69314718056 * t), this.calculateEffectiveRateAndTempo();
			}
			set pitchSemitones(t) {
				this.pitchOctaves = t / 12;
			}
			get inputBuffer() {
				return this._inputBuffer;
			}
			get outputBuffer() {
				return this._outputBuffer;
			}
			calculateEffectiveRateAndTempo() {
				let t = this._tempo, n = this._rate;
				this._tempo = this.virtualTempo / this.virtualPitch, this._rate = this.virtualRate * this.virtualPitch, testFloatEqual(this._tempo, t) && (this.stretch.tempo = this._tempo), testFloatEqual(this._rate, n) && (this.transposer.rate = this._rate), this._rate > 1 ? this._outputBuffer != this.transposer.outputBuffer && (this.stretch.inputBuffer = this._inputBuffer, this.stretch.outputBuffer = this._intermediateBuffer, this.transposer.inputBuffer = this._intermediateBuffer, this.transposer.outputBuffer = this._outputBuffer) : this._outputBuffer != this.stretch.outputBuffer && (this.transposer.inputBuffer = this._inputBuffer, this.transposer.outputBuffer = this._intermediateBuffer, this.stretch.inputBuffer = this._intermediateBuffer, this.stretch.outputBuffer = this._outputBuffer);
			}
			process() {
				this._rate > 1 ? (this.stretch.process(), this.transposer.process()) : (this.transposer.process(), this.stretch.process());
			}
		}
		class WebAudioBufferSource {
			constructor(t) {
				this.buffer = t, this._position = 0;
			}
			get dualChannel() {
				return this.buffer.numberOfChannels > 1;
			}
			get position() {
				return this._position;
			}
			set position(t) {
				this._position = t;
			}
			extract(t, n = 0, i = 0) {
				this.position = i;
				let s = this.buffer.getChannelData(0), d = this.dualChannel ? this.buffer.getChannelData(1) : this.buffer.getChannelData(0), f = 0;
				for (; f < n; f++) t[f * 2] = s[f + i], t[f * 2 + 1] = d[f + i];
				return Math.min(n, s.length - i);
			}
		}
		let getWebAudioNode = function(t, n, i = noop, s = 4096) {
			let d = t.createScriptProcessor(s, 2, 2), f = new Float32Array(s * 2);
			return d.onaudioprocess = (t) => {
				let d = t.outputBuffer.getChannelData(0), p = t.outputBuffer.getChannelData(1), m = n.extract(f, s);
				i(n.sourcePosition), m === 0 && n.onEnd();
				let h = 0;
				for (; h < m; h++) d[h] = f[h * 2], p[h] = f[h * 2 + 1];
			}, d;
		}, pad = function(t, n, i) {
			return i ||= "0", t += "", t.length >= n ? t : Array(n - t.length + 1).join(i) + t;
		}, minsSecs = function(t) {
			let n = Math.floor(t / 60), i = t - n * 60;
			return `${n}:${pad(parseInt(i), 2)}`;
		}, onUpdate = function(t) {
			let n = this.timePlayed, i = this.sampleRate;
			if (this.sourcePosition = t, this.timePlayed = t / i, n !== this.timePlayed) {
				let t = new CustomEvent("play", { detail: {
					timePlayed: this.timePlayed,
					formattedTimePlayed: this.formattedTimePlayed,
					percentagePlayed: this.percentagePlayed
				} });
				this._node.dispatchEvent(t);
			}
		};
		class PitchShifter {
			constructor(t, n, i, s = noop) {
				this._soundtouch = new SoundTouch();
				let d = new WebAudioBufferSource(n);
				this.timePlayed = 0, this.sourcePosition = 0, this._filter = new SimpleFilter(d, this._soundtouch, s), this._node = getWebAudioNode(t, this._filter, (t) => onUpdate.call(this, t), i), this.tempo = 1, this.rate = 1, this.duration = n.duration, this.sampleRate = t.sampleRate, this.listeners = [];
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
			set percentagePlayed(t) {
				this._filter.sourcePosition = parseInt(t * this.duration * this.sampleRate), this.sourcePosition = this._filter.sourcePosition, this.timePlayed = this.sourcePosition / this.sampleRate;
			}
			get node() {
				return this._node;
			}
			set pitch(t) {
				this._soundtouch.pitch = t;
			}
			set pitchSemitones(t) {
				this._soundtouch.pitchSemitones = t;
			}
			set rate(t) {
				this._soundtouch.rate = t;
			}
			set tempo(t) {
				this._soundtouch.tempo = t;
			}
			connect(t) {
				this._node.connect(t);
			}
			disconnect() {
				this._node.disconnect();
			}
			on(t, n) {
				this.listeners.push({
					name: t,
					cb: n
				}), this._node.addEventListener(t, (t) => n(t.detail));
			}
			off(t = null) {
				let n = this.listeners;
				t && (n = n.filter((n) => n.name === t)), n.forEach((t) => {
					this._node.removeEventListener(t.name, (n) => t.cb(n.detail));
				});
			}
		}
		let T = { log: (...n) => {
			if (t.debug) return console.log(`%c✦ chaimu.js v${t.version} ✦`, "background: #000; color: #fff; padding: 0 8px", ...n);
		} }, ne = [
			"playing",
			"ratechange",
			"play",
			"waiting",
			"pause",
			"seeked"
		];
		function initAudioContext() {
			let t = window.AudioContext || window.webkitAudioContext;
			return t ? new t() : void 0;
		}
		class BasePlayer {
			static name = "BasePlayer";
			chaimu;
			fetch;
			_src;
			fetchOpts;
			constructor(t, n) {
				this.chaimu = t, this._src = n, this.fetch = this.chaimu.fetchFn, this.fetchOpts = this.chaimu.fetchOpts;
			}
			async init() {
				return new Promise((t) => t(this));
			}
			clear() {
				return new Promise((t) => t(this));
			}
			lipSync(t = !1) {
				return this;
			}
			handleVideoEvent = (t) => (T.log(`handle video ${t.type}`), this.lipSync(t.type), this);
			removeVideoEvents() {
				for (let t of ne) this.chaimu.video.removeEventListener(t, this.handleVideoEvent);
				return this;
			}
			addVideoEvents() {
				for (let t of ne) this.chaimu.video.addEventListener(t, this.handleVideoEvent);
				return this;
			}
			async play() {
				return new Promise((t) => t(this));
			}
			async pause() {
				return new Promise((t) => t(this));
			}
			get name() {
				return this.constructor.name;
			}
			set src(t) {
				this._src = t;
			}
			get src() {
				return this._src;
			}
			get currentSrc() {
				return this._src;
			}
			set volume(t) {}
			get volume() {
				return 0;
			}
			get playbackRate() {
				return 0;
			}
			set playbackRate(t) {}
			get currentTime() {
				return 0;
			}
		}
		class AudioPlayer extends BasePlayer {
			static name = "AudioPlayer";
			audio;
			gainNode;
			audioSource;
			constructor(t, n) {
				super(t, n), this.updateAudio();
			}
			initAudioBooster() {
				return this.chaimu.audioContext ? (this.gainNode && this.audioSource && (this.audioSource.disconnect(this.gainNode), this.gainNode.disconnect()), this.gainNode = this.chaimu.audioContext.createGain(), this.gainNode.connect(this.chaimu.audioContext.destination), this.audioSource = this.chaimu.audioContext.createMediaElementSource(this.audio), this.audioSource.connect(this.gainNode), this) : this;
			}
			updateAudio() {
				return this.audio = new Audio(this.src), this.audio.crossOrigin = "anonymous", this;
			}
			async init() {
				return new Promise((t) => (this.updateAudio(), this.initAudioBooster(), t(this)));
			}
			audioErrorHandle = (t) => {
				console.error("[AudioPlayer]", t);
			};
			lipSync(t = !1) {
				if (T.log("[AudioPlayer] lipsync video", this.chaimu.video), !this.chaimu.video) return this;
				if (this.audio.currentTime = this.chaimu.video.currentTime, this.audio.playbackRate = this.chaimu.video.playbackRate, !t) return T.log("[AudioPlayer] lipsync mode isn't set"), this;
				switch (T.log(`[AudioPlayer] lipsync mode is ${t}`), t) {
					case "play":
					case "playing":
					case "seeked": return this.chaimu.video.paused || this.syncPlay(), this;
					case "pause":
					case "waiting": return this.pause(), this;
					default: return this;
				}
			}
			async clear() {
				return new Promise((t) => (this.audio.pause(), this.audio.src = "", this.audio.removeAttribute("src"), t(this)));
			}
			syncPlay() {
				return T.log("[AudioPlayer] sync play called"), this.audio.play().catch(this.audioErrorHandle), this;
			}
			async play() {
				return T.log("[AudioPlayer] play called"), await this.audio.play().catch(this.audioErrorHandle), this;
			}
			async pause() {
				return new Promise((t) => (T.log("[AudioPlayer] pause called"), this.audio.pause(), t(this)));
			}
			set src(t) {
				if (this._src = t, !t) {
					this.clear();
					return;
				}
				this.audio.src = t;
			}
			get src() {
				return this._src;
			}
			get currentSrc() {
				return this.audio.currentSrc;
			}
			set volume(t) {
				if (this.gainNode) {
					this.gainNode.gain.value = t;
					return;
				}
				this.audio.volume = t;
			}
			get volume() {
				return this.gainNode ? this.gainNode.gain.value : this.audio.volume;
			}
			get playbackRate() {
				return this.audio.playbackRate;
			}
			set playbackRate(t) {
				this.audio.playbackRate = t;
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
			cleanerRunned = !1;
			async fetchAudio() {
				if (!this._src) throw Error("No audio source provided");
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				T.log(`[ChaimuPlayer] Fetching audio from ${this._src}...`);
				try {
					let t = await this.fetch(this._src, this.fetchOpts);
					T.log("[ChaimuPlayer] Decoding fetched audio...");
					let n = await t.arrayBuffer();
					this.audioBuffer = await this.chaimu.audioContext.decodeAudioData(n);
				} catch (t) {
					throw Error(`Failed to fetch audio file, because ${t.message}`);
				}
				return this;
			}
			initAudioBooster() {
				return this.chaimu.audioContext ? (this.gainNode && this.gainNode.disconnect(), this.gainNode = this.chaimu.audioContext.createGain(), this) : this;
			}
			async init() {
				return await this.fetchAudio(), this.initAudioBooster(), this;
			}
			lipSync(t = !1) {
				if (T.log("[ChaimuPlayer] lipsync video", this.chaimu.video, this), !this.chaimu.video) return this;
				if (!t) return T.log("[ChaimuPlayer] lipsync mode isn't set"), this;
				switch (T.log(`[ChaimuPlayer] lipsync mode is ${t}`), t) {
					case "play":
					case "playing":
					case "ratechange":
					case "seeked": return this.chaimu.video.paused || this.start(), this;
					case "pause":
					case "waiting": return this.pause(), this;
					default: return this;
				}
			}
			async reopenCtx() {
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				try {
					await this.chaimu.audioContext.close();
				} catch {}
				return this;
			}
			async clear() {
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				if (T.log("clear audio context"), this.cleanerRunned = !0, await this.pause(), !this.gainNode) return this.cleanerRunned = !1, this;
				this.sourceNode && (this.sourceNode.stop(), this.sourceNode.disconnect(this.gainNode), this.sourceNode = void 0), this.audioShifter && (this.audioShifter._node.disconnect(this.gainNode), this.audioShifter = void 0), this.gainNode.disconnect();
				let t = this.volume;
				return this.gainNode = void 0, await this.reopenCtx(), this.chaimu.audioContext = initAudioContext(), this.initAudioBooster(), this.volume = t, this.cleanerRunned = !1, this;
			}
			async start() {
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				if (!this.audioBuffer) throw Error("The player isn't initialized");
				return !this.gainNode || this.audioShifter && this.audioShifter.duration < this.chaimu.video.currentTime ? (T.log("Skip starting player"), this) : this.cleanerRunned ? (T.log("The other cleaner is still running, waiting..."), this) : (T.log("starting audio"), await this.clear(), await this.play(), this.audioShifter = new PitchShifter(this.chaimu.audioContext, this.audioBuffer, 1024), this.audioShifter.tempo = this.chaimu.video.playbackRate, this.audioShifter.percentagePlayed = this.chaimu.video.currentTime / this.audioShifter.duration, this.sourceNode = this.chaimu.audioContext.createBufferSource(), this.sourceNode.buffer = null, this.sourceNode.connect(this.gainNode), this.audioShifter.connect(this.gainNode), this.gainNode.connect(this.chaimu.audioContext.destination), this.sourceNode.start(void 0, this.chaimu.video.currentTime), this);
			}
			async pause() {
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				return this.chaimu.audioContext.state === "running" && await this.chaimu.audioContext.suspend(), this;
			}
			async play() {
				if (!this.chaimu.audioContext) throw Error("No audio context available");
				return await this.chaimu.audioContext.resume(), this;
			}
			set src(t) {
				this._src = t;
			}
			get src() {
				return this._src;
			}
			get currentSrc() {
				return this._src;
			}
			set volume(t) {
				this.gainNode && (this.gainNode.gain.value = t);
			}
			get volume() {
				return this.gainNode ? this.gainNode.gain.value : 0;
			}
			set playbackRate(t) {
				if (!this.audioShifter) throw Error("No audio source available");
				this.audioShifter.pitch = t;
			}
			get playbackRate() {
				return this.audioShifter?._soundtouch?.tempo ?? 0;
			}
			get currentTime() {
				return this.chaimu.video.currentTime;
			}
		}
		class Chaimu {
			_debug = !1;
			audioContext;
			player;
			video;
			fetchFn;
			fetchOpts;
			constructor({ url: n, video: i, debug: s = !1, fetchFn: d = t.fetchFn, fetchOpts: f = {}, preferAudio: p = !1 }) {
				this._debug = t.debug = s, this.fetchFn = d, this.fetchOpts = f, this.audioContext = initAudioContext(), this.player = this.audioContext && !p ? new ChaimuPlayer(this, n) : new AudioPlayer(this, n), this.video = i;
			}
			async init() {
				await this.player.init(), this.video && !this.video.paused && this.player.lipSync("play"), this.player.addVideoEvents();
			}
			set debug(n) {
				this._debug = t.debug = n;
			}
			get debug() {
				return this._debug;
			}
		}
		let E = {
			host: "api.browser.yandex.ru",
			hostVOT: "vot.toil.cc/v1",
			hostWorker: "vot-worker.toil.cc",
			mediaProxy: "media-proxy.toil.cc",
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 YaBrowser/25.4.0.0 Safari/537.36",
			componentVersion: "25.4.1.991",
			hmac: "bt8xH3VOlb4mqf0nqAibnDOoiPlXsisf",
			defaultDuration: 343,
			minChunkSize: 5295308,
			loggerLevel: 1,
			version: "2.4.5"
		};
		var re;
		(function(t) {
			t[t.DEBUG = 0] = "DEBUG", t[t.INFO = 1] = "INFO", t[t.WARN = 2] = "WARN", t[t.ERROR = 3] = "ERROR", t[t.SILENCE = 4] = "SILENCE";
		})(re ||= {});
		class Logger {
			static prefix = `[vot.js v${E.version}]`;
			static canLog(t) {
				return E.loggerLevel <= t;
			}
			static log(...t) {
				Logger.canLog(re.DEBUG) && console.log(Logger.prefix, ...t);
			}
			static info(...t) {
				Logger.canLog(re.INFO) && console.info(Logger.prefix, ...t);
			}
			static warn(...t) {
				Logger.canLog(re.WARN) && console.warn(Logger.prefix, ...t);
			}
			static error(...t) {
				Logger.canLog(re.ERROR) && console.error(Logger.prefix, ...t);
			}
		}
		function varint64read() {
			let t = 0, n = 0;
			for (let i = 0; i < 28; i += 7) {
				let s = this.buf[this.pos++];
				if (t |= (s & 127) << i, !(s & 128)) return this.assertBounds(), [t, n];
			}
			let i = this.buf[this.pos++];
			if (t |= (i & 15) << 28, n = (i & 112) >> 4, !(i & 128)) return this.assertBounds(), [t, n];
			for (let i = 3; i <= 31; i += 7) {
				let s = this.buf[this.pos++];
				if (n |= (s & 127) << i, !(s & 128)) return this.assertBounds(), [t, n];
			}
			throw Error("invalid varint");
		}
		function varint64write(t, n, i) {
			for (let s = 0; s < 28; s += 7) {
				let d = t >>> s, f = !(!(d >>> 7) && n == 0), p = (f ? d | 128 : d) & 255;
				if (i.push(p), !f) return;
			}
			let s = t >>> 28 & 15 | (n & 7) << 4, d = !!(n >> 3);
			if (i.push((d ? s | 128 : s) & 255), d) {
				for (let t = 3; t < 31; t += 7) {
					let s = n >>> t, d = !!(s >>> 7), f = (d ? s | 128 : s) & 255;
					if (i.push(f), !d) return;
				}
				i.push(n >>> 31 & 1);
			}
		}
		let ie = 4294967296;
		function int64FromString(t) {
			let n = t[0] === "-";
			n && (t = t.slice(1));
			let i = 1e6, s = 0, d = 0;
			function add1e6digit(n, f) {
				let p = Number(t.slice(n, f));
				d *= i, s = s * i + p, s >= ie && (d += s / ie | 0, s %= ie);
			}
			return add1e6digit(-24, -18), add1e6digit(-18, -12), add1e6digit(-12, -6), add1e6digit(-6), n ? negate(s, d) : newBits(s, d);
		}
		function int64ToString(t, n) {
			let i = newBits(t, n), s = i.hi & 2147483648;
			s && (i = negate(i.lo, i.hi));
			let d = uInt64ToString(i.lo, i.hi);
			return s ? "-" + d : d;
		}
		function uInt64ToString(t, n) {
			if ({lo: t, hi: n} = toUnsigned(t, n), n <= 2097151) return String(ie * n + t);
			let i = t & 16777215, s = (t >>> 24 | n << 8) & 16777215, d = n >> 16 & 65535, f = i + s * 6777216 + d * 6710656, p = s + d * 8147497, m = d * 2, h = 1e7;
			return f >= h && (p += Math.floor(f / h), f %= h), p >= h && (m += Math.floor(p / h), p %= h), m.toString() + decimalFrom1e7WithLeadingZeros(p) + decimalFrom1e7WithLeadingZeros(f);
		}
		function toUnsigned(t, n) {
			return {
				lo: t >>> 0,
				hi: n >>> 0
			};
		}
		function newBits(t, n) {
			return {
				lo: t | 0,
				hi: n | 0
			};
		}
		function negate(t, n) {
			return n = ~n, t ? t = ~t + 1 : n += 1, newBits(t, n);
		}
		let decimalFrom1e7WithLeadingZeros = (t) => {
			let n = String(t);
			return "0000000".slice(n.length) + n;
		};
		function varint32write(t, n) {
			if (t >= 0) {
				for (; t > 127;) n.push(t & 127 | 128), t >>>= 7;
				n.push(t);
			} else {
				for (let i = 0; i < 9; i++) n.push(t & 127 | 128), t >>= 7;
				n.push(1);
			}
		}
		function varint32read() {
			let t = this.buf[this.pos++], n = t & 127;
			if (!(t & 128) || (t = this.buf[this.pos++], n |= (t & 127) << 7, !(t & 128)) || (t = this.buf[this.pos++], n |= (t & 127) << 14, !(t & 128)) || (t = this.buf[this.pos++], n |= (t & 127) << 21, !(t & 128))) return this.assertBounds(), n;
			t = this.buf[this.pos++], n |= (t & 15) << 28;
			for (let n = 5; t & 128 && n < 10; n++) t = this.buf[this.pos++];
			if (t & 128) throw Error("invalid varint");
			return this.assertBounds(), n >>> 0;
		}
		let D = makeInt64Support();
		function makeInt64Support() {
			let t = new DataView(new ArrayBuffer(8)), n = typeof BigInt == "function" && typeof t.getBigInt64 == "function" && typeof t.getBigUint64 == "function" && typeof t.setBigInt64 == "function" && typeof t.setBigUint64 == "function" && (typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1");
			if (n) {
				let n = BigInt("-9223372036854775808"), i = BigInt("9223372036854775807"), s = BigInt("0"), d = BigInt("18446744073709551615");
				return {
					zero: BigInt(0),
					supported: !0,
					parse(t) {
						let s = typeof t == "bigint" ? t : BigInt(t);
						if (s > i || s < n) throw Error(`invalid int64: ${t}`);
						return s;
					},
					uParse(t) {
						let n = typeof t == "bigint" ? t : BigInt(t);
						if (n > d || n < s) throw Error(`invalid uint64: ${t}`);
						return n;
					},
					enc(n) {
						return t.setBigInt64(0, this.parse(n), !0), {
							lo: t.getInt32(0, !0),
							hi: t.getInt32(4, !0)
						};
					},
					uEnc(n) {
						return t.setBigInt64(0, this.uParse(n), !0), {
							lo: t.getInt32(0, !0),
							hi: t.getInt32(4, !0)
						};
					},
					dec(n, i) {
						return t.setInt32(0, n, !0), t.setInt32(4, i, !0), t.getBigInt64(0, !0);
					},
					uDec(n, i) {
						return t.setInt32(0, n, !0), t.setInt32(4, i, !0), t.getBigUint64(0, !0);
					}
				};
			}
			return {
				zero: "0",
				supported: !1,
				parse(t) {
					return typeof t != "string" && (t = t.toString()), assertInt64String(t), t;
				},
				uParse(t) {
					return typeof t != "string" && (t = t.toString()), assertUInt64String(t), t;
				},
				enc(t) {
					return typeof t != "string" && (t = t.toString()), assertInt64String(t), int64FromString(t);
				},
				uEnc(t) {
					return typeof t != "string" && (t = t.toString()), assertUInt64String(t), int64FromString(t);
				},
				dec(t, n) {
					return int64ToString(t, n);
				},
				uDec(t, n) {
					return uInt64ToString(t, n);
				}
			};
		}
		function assertInt64String(t) {
			if (!/^-?[0-9]+$/.test(t)) throw Error("invalid int64: " + t);
		}
		function assertUInt64String(t) {
			if (!/^[0-9]+$/.test(t)) throw Error("invalid uint64: " + t);
		}
		let ae = Symbol.for("@bufbuild/protobuf/text-encoding");
		function configureTextEncoding(t) {
			globalThis[ae] = t;
		}
		function getTextEncoding() {
			if (globalThis[ae] == null) {
				let t = new globalThis.TextEncoder(), n = new globalThis.TextDecoder();
				globalThis[ae] = {
					encodeUtf8(n) {
						return t.encode(n);
					},
					decodeUtf8(t) {
						return n.decode(t);
					},
					checkUtf8(t) {
						try {
							return encodeURIComponent(t), !0;
						} catch {
							return !1;
						}
					}
				};
			}
			return globalThis[ae];
		}
		var oe;
		(function(t) {
			t[t.Varint = 0] = "Varint", t[t.Bit64 = 1] = "Bit64", t[t.LengthDelimited = 2] = "LengthDelimited", t[t.StartGroup = 3] = "StartGroup", t[t.EndGroup = 4] = "EndGroup", t[t.Bit32 = 5] = "Bit32";
		})(oe ||= {});
		let se = 34028234663852886e22, ce = -34028234663852886e22, le = 4294967295, ue = 2147483647, de = -2147483648;
		class BinaryWriter {
			constructor(t = getTextEncoding().encodeUtf8) {
				this.encodeUtf8 = t, this.stack = [], this.chunks = [], this.buf = [];
			}
			finish() {
				this.buf.length && (this.chunks.push(new Uint8Array(this.buf)), this.buf = []);
				let t = 0;
				for (let n = 0; n < this.chunks.length; n++) t += this.chunks[n].length;
				let n = new Uint8Array(t), i = 0;
				for (let t = 0; t < this.chunks.length; t++) n.set(this.chunks[t], i), i += this.chunks[t].length;
				return this.chunks = [], n;
			}
			fork() {
				return this.stack.push({
					chunks: this.chunks,
					buf: this.buf
				}), this.chunks = [], this.buf = [], this;
			}
			join() {
				let t = this.finish(), n = this.stack.pop();
				if (!n) throw Error("invalid state, fork stack empty");
				return this.chunks = n.chunks, this.buf = n.buf, this.uint32(t.byteLength), this.raw(t);
			}
			tag(t, n) {
				return this.uint32((t << 3 | n) >>> 0);
			}
			raw(t) {
				return this.buf.length && (this.chunks.push(new Uint8Array(this.buf)), this.buf = []), this.chunks.push(t), this;
			}
			uint32(t) {
				for (assertUInt32(t); t > 127;) this.buf.push(t & 127 | 128), t >>>= 7;
				return this.buf.push(t), this;
			}
			int32(t) {
				return assertInt32(t), varint32write(t, this.buf), this;
			}
			bool(t) {
				return this.buf.push(t ? 1 : 0), this;
			}
			bytes(t) {
				return this.uint32(t.byteLength), this.raw(t);
			}
			string(t) {
				let n = this.encodeUtf8(t);
				return this.uint32(n.byteLength), this.raw(n);
			}
			float(t) {
				assertFloat32(t);
				let n = new Uint8Array(4);
				return new DataView(n.buffer).setFloat32(0, t, !0), this.raw(n);
			}
			double(t) {
				let n = new Uint8Array(8);
				return new DataView(n.buffer).setFloat64(0, t, !0), this.raw(n);
			}
			fixed32(t) {
				assertUInt32(t);
				let n = new Uint8Array(4);
				return new DataView(n.buffer).setUint32(0, t, !0), this.raw(n);
			}
			sfixed32(t) {
				assertInt32(t);
				let n = new Uint8Array(4);
				return new DataView(n.buffer).setInt32(0, t, !0), this.raw(n);
			}
			sint32(t) {
				return assertInt32(t), t = (t << 1 ^ t >> 31) >>> 0, varint32write(t, this.buf), this;
			}
			sfixed64(t) {
				let n = new Uint8Array(8), i = new DataView(n.buffer), s = D.enc(t);
				return i.setInt32(0, s.lo, !0), i.setInt32(4, s.hi, !0), this.raw(n);
			}
			fixed64(t) {
				let n = new Uint8Array(8), i = new DataView(n.buffer), s = D.uEnc(t);
				return i.setInt32(0, s.lo, !0), i.setInt32(4, s.hi, !0), this.raw(n);
			}
			int64(t) {
				let n = D.enc(t);
				return varint64write(n.lo, n.hi, this.buf), this;
			}
			sint64(t) {
				let n = D.enc(t), i = n.hi >> 31, s = n.lo << 1 ^ i, d = (n.hi << 1 | n.lo >>> 31) ^ i;
				return varint64write(s, d, this.buf), this;
			}
			uint64(t) {
				let n = D.uEnc(t);
				return varint64write(n.lo, n.hi, this.buf), this;
			}
		}
		class BinaryReader {
			constructor(t, n = getTextEncoding().decodeUtf8) {
				this.decodeUtf8 = n, this.varint64 = varint64read, this.uint32 = varint32read, this.buf = t, this.len = t.length, this.pos = 0, this.view = new DataView(t.buffer, t.byteOffset, t.byteLength);
			}
			tag() {
				let t = this.uint32(), n = t >>> 3, i = t & 7;
				if (n <= 0 || i < 0 || i > 5) throw Error("illegal tag: field no " + n + " wire type " + i);
				return [n, i];
			}
			skip(t, n) {
				let i = this.pos;
				switch (t) {
					case oe.Varint:
						for (; this.buf[this.pos++] & 128;);
						break;
					case oe.Bit64: this.pos += 4;
					case oe.Bit32:
						this.pos += 4;
						break;
					case oe.LengthDelimited:
						let i = this.uint32();
						this.pos += i;
						break;
					case oe.StartGroup:
						for (;;) {
							let [t, i] = this.tag();
							if (i === oe.EndGroup) {
								if (n !== void 0 && t !== n) throw Error("invalid end group tag");
								break;
							}
							this.skip(i, t);
						}
						break;
					default: throw Error("cant skip wire type " + t);
				}
				return this.assertBounds(), this.buf.subarray(i, this.pos);
			}
			assertBounds() {
				if (this.pos > this.len) throw RangeError("premature EOF");
			}
			int32() {
				return this.uint32() | 0;
			}
			sint32() {
				let t = this.uint32();
				return t >>> 1 ^ -(t & 1);
			}
			int64() {
				return D.dec(...this.varint64());
			}
			uint64() {
				return D.uDec(...this.varint64());
			}
			sint64() {
				let [t, n] = this.varint64(), i = -(t & 1);
				return t = (t >>> 1 | (n & 1) << 31) ^ i, n = n >>> 1 ^ i, D.dec(t, n);
			}
			bool() {
				let [t, n] = this.varint64();
				return t !== 0 || n !== 0;
			}
			fixed32() {
				return this.view.getUint32((this.pos += 4) - 4, !0);
			}
			sfixed32() {
				return this.view.getInt32((this.pos += 4) - 4, !0);
			}
			fixed64() {
				return D.uDec(this.sfixed32(), this.sfixed32());
			}
			sfixed64() {
				return D.dec(this.sfixed32(), this.sfixed32());
			}
			float() {
				return this.view.getFloat32((this.pos += 4) - 4, !0);
			}
			double() {
				return this.view.getFloat64((this.pos += 8) - 8, !0);
			}
			bytes() {
				let t = this.uint32(), n = this.pos;
				return this.pos += t, this.assertBounds(), this.buf.subarray(n, n + t);
			}
			string() {
				return this.decodeUtf8(this.bytes());
			}
		}
		function assertInt32(t) {
			if (typeof t == "string") t = Number(t);
			else if (typeof t != "number") throw Error("invalid int32: " + typeof t);
			if (!Number.isInteger(t) || t > ue || t < de) throw Error("invalid int32: " + t);
		}
		function assertUInt32(t) {
			if (typeof t == "string") t = Number(t);
			else if (typeof t != "number") throw Error("invalid uint32: " + typeof t);
			if (!Number.isInteger(t) || t > le || t < 0) throw Error("invalid uint32: " + t);
		}
		function assertFloat32(t) {
			if (typeof t == "string") {
				let n = t;
				if (t = Number(t), isNaN(t) && n !== "NaN") throw Error("invalid float32: " + n);
			} else if (typeof t != "number") throw Error("invalid float32: " + typeof t);
			if (Number.isFinite(t) && (t > se || t < ce)) throw Error("invalid float32: " + t);
		}
		let fe = "";
		var O;
		(function(t) {
			t[t.NO_CONNECTION = 0] = "NO_CONNECTION", t[t.TRANSLATING = 10] = "TRANSLATING", t[t.STREAMING = 20] = "STREAMING", t[t.UNRECOGNIZED = -1] = "UNRECOGNIZED";
		})(O ||= {});
		function streamIntervalFromJSON(t) {
			switch (t) {
				case 0:
				case "NO_CONNECTION": return O.NO_CONNECTION;
				case 10:
				case "TRANSLATING": return O.TRANSLATING;
				case 20:
				case "STREAMING": return O.STREAMING;
				case -1:
				case "UNRECOGNIZED":
				default: return O.UNRECOGNIZED;
			}
		}
		function streamIntervalToJSON(t) {
			switch (t) {
				case O.NO_CONNECTION: return "NO_CONNECTION";
				case O.TRANSLATING: return "TRANSLATING";
				case O.STREAMING: return "STREAMING";
				case O.UNRECOGNIZED:
				default: return "UNRECOGNIZED";
			}
		}
		function createBaseVideoTranslationHelpObject() {
			return {
				target: "",
				targetUrl: ""
			};
		}
		let pe = {
			encode(t, n = new BinaryWriter()) {
				return t.target !== "" && n.uint32(10).string(t.target), t.targetUrl !== "" && n.uint32(18).string(t.targetUrl), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationHelpObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.target = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.targetUrl = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					target: isSet(t.target) ? globalThis.String(t.target) : "",
					targetUrl: isSet(t.targetUrl) ? globalThis.String(t.targetUrl) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.target !== "" && (n.target = t.target), t.targetUrl !== "" && (n.targetUrl = t.targetUrl), n;
			},
			create(t) {
				return pe.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationHelpObject();
				return n.target = t.target ?? "", n.targetUrl = t.targetUrl ?? "", n;
			}
		};
		function createBaseVideoTranslationRequest() {
			return {
				url: "",
				deviceId: void 0,
				firstRequest: !1,
				duration: 0,
				unknown0: 0,
				language: "",
				forceSourceLang: !1,
				unknown1: 0,
				translationHelp: [],
				wasStream: !1,
				responseLanguage: "",
				unknown2: 0,
				unknown3: 0,
				bypassCache: !1,
				useLivelyVoice: !1,
				videoTitle: ""
			};
		}
		let me = {
			encode(t, n = new BinaryWriter()) {
				t.url !== "" && n.uint32(26).string(t.url), t.deviceId !== void 0 && n.uint32(34).string(t.deviceId), t.firstRequest !== !1 && n.uint32(40).bool(t.firstRequest), t.duration !== 0 && n.uint32(49).double(t.duration), t.unknown0 !== 0 && n.uint32(56).int32(t.unknown0), t.language !== "" && n.uint32(66).string(t.language), t.forceSourceLang !== !1 && n.uint32(72).bool(t.forceSourceLang), t.unknown1 !== 0 && n.uint32(80).int32(t.unknown1);
				for (let i of t.translationHelp) pe.encode(i, n.uint32(90).fork()).join();
				return t.wasStream !== !1 && n.uint32(104).bool(t.wasStream), t.responseLanguage !== "" && n.uint32(114).string(t.responseLanguage), t.unknown2 !== 0 && n.uint32(120).int32(t.unknown2), t.unknown3 !== 0 && n.uint32(128).int32(t.unknown3), t.bypassCache !== !1 && n.uint32(136).bool(t.bypassCache), t.useLivelyVoice !== !1 && n.uint32(144).bool(t.useLivelyVoice), t.videoTitle !== "" && n.uint32(154).string(t.videoTitle), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 3:
							if (t !== 26) break;
							d.url = i.string();
							continue;
						case 4:
							if (t !== 34) break;
							d.deviceId = i.string();
							continue;
						case 5:
							if (t !== 40) break;
							d.firstRequest = i.bool();
							continue;
						case 6:
							if (t !== 49) break;
							d.duration = i.double();
							continue;
						case 7:
							if (t !== 56) break;
							d.unknown0 = i.int32();
							continue;
						case 8:
							if (t !== 66) break;
							d.language = i.string();
							continue;
						case 9:
							if (t !== 72) break;
							d.forceSourceLang = i.bool();
							continue;
						case 10:
							if (t !== 80) break;
							d.unknown1 = i.int32();
							continue;
						case 11:
							if (t !== 90) break;
							d.translationHelp.push(pe.decode(i, i.uint32()));
							continue;
						case 13:
							if (t !== 104) break;
							d.wasStream = i.bool();
							continue;
						case 14:
							if (t !== 114) break;
							d.responseLanguage = i.string();
							continue;
						case 15:
							if (t !== 120) break;
							d.unknown2 = i.int32();
							continue;
						case 16:
							if (t !== 128) break;
							d.unknown3 = i.int32();
							continue;
						case 17:
							if (t !== 136) break;
							d.bypassCache = i.bool();
							continue;
						case 18:
							if (t !== 144) break;
							d.useLivelyVoice = i.bool();
							continue;
						case 19:
							if (t !== 154) break;
							d.videoTitle = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					deviceId: isSet(t.deviceId) ? globalThis.String(t.deviceId) : void 0,
					firstRequest: isSet(t.firstRequest) ? globalThis.Boolean(t.firstRequest) : !1,
					duration: isSet(t.duration) ? globalThis.Number(t.duration) : 0,
					unknown0: isSet(t.unknown0) ? globalThis.Number(t.unknown0) : 0,
					language: isSet(t.language) ? globalThis.String(t.language) : "",
					forceSourceLang: isSet(t.forceSourceLang) ? globalThis.Boolean(t.forceSourceLang) : !1,
					unknown1: isSet(t.unknown1) ? globalThis.Number(t.unknown1) : 0,
					translationHelp: globalThis.Array.isArray(t?.translationHelp) ? t.translationHelp.map((t) => pe.fromJSON(t)) : [],
					wasStream: isSet(t.wasStream) ? globalThis.Boolean(t.wasStream) : !1,
					responseLanguage: isSet(t.responseLanguage) ? globalThis.String(t.responseLanguage) : "",
					unknown2: isSet(t.unknown2) ? globalThis.Number(t.unknown2) : 0,
					unknown3: isSet(t.unknown3) ? globalThis.Number(t.unknown3) : 0,
					bypassCache: isSet(t.bypassCache) ? globalThis.Boolean(t.bypassCache) : !1,
					useLivelyVoice: isSet(t.useLivelyVoice) ? globalThis.Boolean(t.useLivelyVoice) : !1,
					videoTitle: isSet(t.videoTitle) ? globalThis.String(t.videoTitle) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== "" && (n.url = t.url), t.deviceId !== void 0 && (n.deviceId = t.deviceId), t.firstRequest !== !1 && (n.firstRequest = t.firstRequest), t.duration !== 0 && (n.duration = t.duration), t.unknown0 !== 0 && (n.unknown0 = Math.round(t.unknown0)), t.language !== "" && (n.language = t.language), t.forceSourceLang !== !1 && (n.forceSourceLang = t.forceSourceLang), t.unknown1 !== 0 && (n.unknown1 = Math.round(t.unknown1)), t.translationHelp?.length && (n.translationHelp = t.translationHelp.map((t) => pe.toJSON(t))), t.wasStream !== !1 && (n.wasStream = t.wasStream), t.responseLanguage !== "" && (n.responseLanguage = t.responseLanguage), t.unknown2 !== 0 && (n.unknown2 = Math.round(t.unknown2)), t.unknown3 !== 0 && (n.unknown3 = Math.round(t.unknown3)), t.bypassCache !== !1 && (n.bypassCache = t.bypassCache), t.useLivelyVoice !== !1 && (n.useLivelyVoice = t.useLivelyVoice), t.videoTitle !== "" && (n.videoTitle = t.videoTitle), n;
			},
			create(t) {
				return me.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationRequest();
				return n.url = t.url ?? "", n.deviceId = t.deviceId ?? void 0, n.firstRequest = t.firstRequest ?? !1, n.duration = t.duration ?? 0, n.unknown0 = t.unknown0 ?? 0, n.language = t.language ?? "", n.forceSourceLang = t.forceSourceLang ?? !1, n.unknown1 = t.unknown1 ?? 0, n.translationHelp = t.translationHelp?.map((t) => pe.fromPartial(t)) || [], n.wasStream = t.wasStream ?? !1, n.responseLanguage = t.responseLanguage ?? "", n.unknown2 = t.unknown2 ?? 0, n.unknown3 = t.unknown3 ?? 0, n.bypassCache = t.bypassCache ?? !1, n.useLivelyVoice = t.useLivelyVoice ?? !1, n.videoTitle = t.videoTitle ?? "", n;
			}
		};
		function createBaseVideoTranslationResponse() {
			return {
				url: void 0,
				duration: void 0,
				status: 0,
				remainingTime: void 0,
				unknown0: void 0,
				translationId: "",
				language: void 0,
				message: void 0,
				isLivelyVoice: !1,
				unknown2: void 0
			};
		}
		let he = {
			encode(t, n = new BinaryWriter()) {
				return t.url !== void 0 && n.uint32(10).string(t.url), t.duration !== void 0 && n.uint32(17).double(t.duration), t.status !== 0 && n.uint32(32).int32(t.status), t.remainingTime !== void 0 && n.uint32(40).int32(t.remainingTime), t.unknown0 !== void 0 && n.uint32(48).int32(t.unknown0), t.translationId !== "" && n.uint32(58).string(t.translationId), t.language !== void 0 && n.uint32(66).string(t.language), t.message !== void 0 && n.uint32(74).string(t.message), t.isLivelyVoice !== !1 && n.uint32(80).bool(t.isLivelyVoice), t.unknown2 !== void 0 && n.uint32(88).int32(t.unknown2), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.url = i.string();
							continue;
						case 2:
							if (t !== 17) break;
							d.duration = i.double();
							continue;
						case 4:
							if (t !== 32) break;
							d.status = i.int32();
							continue;
						case 5:
							if (t !== 40) break;
							d.remainingTime = i.int32();
							continue;
						case 6:
							if (t !== 48) break;
							d.unknown0 = i.int32();
							continue;
						case 7:
							if (t !== 58) break;
							d.translationId = i.string();
							continue;
						case 8:
							if (t !== 66) break;
							d.language = i.string();
							continue;
						case 9:
							if (t !== 74) break;
							d.message = i.string();
							continue;
						case 10:
							if (t !== 80) break;
							d.isLivelyVoice = i.bool();
							continue;
						case 11:
							if (t !== 88) break;
							d.unknown2 = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : void 0,
					duration: isSet(t.duration) ? globalThis.Number(t.duration) : void 0,
					status: isSet(t.status) ? globalThis.Number(t.status) : 0,
					remainingTime: isSet(t.remainingTime) ? globalThis.Number(t.remainingTime) : void 0,
					unknown0: isSet(t.unknown0) ? globalThis.Number(t.unknown0) : void 0,
					translationId: isSet(t.translationId) ? globalThis.String(t.translationId) : "",
					language: isSet(t.language) ? globalThis.String(t.language) : void 0,
					message: isSet(t.message) ? globalThis.String(t.message) : void 0,
					isLivelyVoice: isSet(t.isLivelyVoice) ? globalThis.Boolean(t.isLivelyVoice) : !1,
					unknown2: isSet(t.unknown2) ? globalThis.Number(t.unknown2) : void 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== void 0 && (n.url = t.url), t.duration !== void 0 && (n.duration = t.duration), t.status !== 0 && (n.status = Math.round(t.status)), t.remainingTime !== void 0 && (n.remainingTime = Math.round(t.remainingTime)), t.unknown0 !== void 0 && (n.unknown0 = Math.round(t.unknown0)), t.translationId !== "" && (n.translationId = t.translationId), t.language !== void 0 && (n.language = t.language), t.message !== void 0 && (n.message = t.message), t.isLivelyVoice !== !1 && (n.isLivelyVoice = t.isLivelyVoice), t.unknown2 !== void 0 && (n.unknown2 = Math.round(t.unknown2)), n;
			},
			create(t) {
				return he.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationResponse();
				return n.url = t.url ?? void 0, n.duration = t.duration ?? void 0, n.status = t.status ?? 0, n.remainingTime = t.remainingTime ?? void 0, n.unknown0 = t.unknown0 ?? void 0, n.translationId = t.translationId ?? "", n.language = t.language ?? void 0, n.message = t.message ?? void 0, n.isLivelyVoice = t.isLivelyVoice ?? !1, n.unknown2 = t.unknown2 ?? void 0, n;
			}
		};
		function createBaseVideoTranslationCacheItem() {
			return {
				status: 0,
				remainingTime: void 0,
				message: void 0,
				unknown0: void 0
			};
		}
		let A = {
			encode(t, n = new BinaryWriter()) {
				return t.status !== 0 && n.uint32(8).int32(t.status), t.remainingTime !== void 0 && n.uint32(16).int32(t.remainingTime), t.message !== void 0 && n.uint32(26).string(t.message), t.unknown0 !== void 0 && n.uint32(32).int32(t.unknown0), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationCacheItem();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 8) break;
							d.status = i.int32();
							continue;
						case 2:
							if (t !== 16) break;
							d.remainingTime = i.int32();
							continue;
						case 3:
							if (t !== 26) break;
							d.message = i.string();
							continue;
						case 4:
							if (t !== 32) break;
							d.unknown0 = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					status: isSet(t.status) ? globalThis.Number(t.status) : 0,
					remainingTime: isSet(t.remainingTime) ? globalThis.Number(t.remainingTime) : void 0,
					message: isSet(t.message) ? globalThis.String(t.message) : void 0,
					unknown0: isSet(t.unknown0) ? globalThis.Number(t.unknown0) : void 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.status !== 0 && (n.status = Math.round(t.status)), t.remainingTime !== void 0 && (n.remainingTime = Math.round(t.remainingTime)), t.message !== void 0 && (n.message = t.message), t.unknown0 !== void 0 && (n.unknown0 = Math.round(t.unknown0)), n;
			},
			create(t) {
				return A.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationCacheItem();
				return n.status = t.status ?? 0, n.remainingTime = t.remainingTime ?? void 0, n.message = t.message ?? void 0, n.unknown0 = t.unknown0 ?? void 0, n;
			}
		};
		function createBaseVideoTranslationCacheRequest() {
			return {
				url: "",
				duration: 0,
				language: "",
				responseLanguage: ""
			};
		}
		let ge = {
			encode(t, n = new BinaryWriter()) {
				return t.url !== "" && n.uint32(10).string(t.url), t.duration !== 0 && n.uint32(17).double(t.duration), t.language !== "" && n.uint32(26).string(t.language), t.responseLanguage !== "" && n.uint32(34).string(t.responseLanguage), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationCacheRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.url = i.string();
							continue;
						case 2:
							if (t !== 17) break;
							d.duration = i.double();
							continue;
						case 3:
							if (t !== 26) break;
							d.language = i.string();
							continue;
						case 4:
							if (t !== 34) break;
							d.responseLanguage = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					duration: isSet(t.duration) ? globalThis.Number(t.duration) : 0,
					language: isSet(t.language) ? globalThis.String(t.language) : "",
					responseLanguage: isSet(t.responseLanguage) ? globalThis.String(t.responseLanguage) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== "" && (n.url = t.url), t.duration !== 0 && (n.duration = t.duration), t.language !== "" && (n.language = t.language), t.responseLanguage !== "" && (n.responseLanguage = t.responseLanguage), n;
			},
			create(t) {
				return ge.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationCacheRequest();
				return n.url = t.url ?? "", n.duration = t.duration ?? 0, n.language = t.language ?? "", n.responseLanguage = t.responseLanguage ?? "", n;
			}
		};
		function createBaseVideoTranslationCacheResponse() {
			return {
				default: void 0,
				cloning: void 0
			};
		}
		let _e = {
			encode(t, n = new BinaryWriter()) {
				return t.default !== void 0 && A.encode(t.default, n.uint32(10).fork()).join(), t.cloning !== void 0 && A.encode(t.cloning, n.uint32(18).fork()).join(), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationCacheResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.default = A.decode(i, i.uint32());
							continue;
						case 2:
							if (t !== 18) break;
							d.cloning = A.decode(i, i.uint32());
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					default: isSet(t.default) ? A.fromJSON(t.default) : void 0,
					cloning: isSet(t.cloning) ? A.fromJSON(t.cloning) : void 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.default !== void 0 && (n.default = A.toJSON(t.default)), t.cloning !== void 0 && (n.cloning = A.toJSON(t.cloning)), n;
			},
			create(t) {
				return _e.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationCacheResponse();
				return n.default = t.default !== void 0 && t.default !== null ? A.fromPartial(t.default) : void 0, n.cloning = t.cloning !== void 0 && t.cloning !== null ? A.fromPartial(t.cloning) : void 0, n;
			}
		};
		function createBaseAudioBufferObject() {
			return {
				audioFile: new Uint8Array(),
				fileId: ""
			};
		}
		let ve = {
			encode(t, n = new BinaryWriter()) {
				return t.audioFile.length !== 0 && n.uint32(18).bytes(t.audioFile), t.fileId !== "" && n.uint32(10).string(t.fileId), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseAudioBufferObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 2:
							if (t !== 18) break;
							d.audioFile = i.bytes();
							continue;
						case 1:
							if (t !== 10) break;
							d.fileId = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					audioFile: isSet(t.audioFile) ? bytesFromBase64(t.audioFile) : new Uint8Array(),
					fileId: isSet(t.fileId) ? globalThis.String(t.fileId) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.audioFile.length !== 0 && (n.audioFile = base64FromBytes(t.audioFile)), t.fileId !== "" && (n.fileId = t.fileId), n;
			},
			create(t) {
				return ve.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseAudioBufferObject();
				return n.audioFile = t.audioFile ?? new Uint8Array(), n.fileId = t.fileId ?? "", n;
			}
		};
		function createBasePartialAudioBufferObject() {
			return {
				audioFile: new Uint8Array(),
				chunkId: 0
			};
		}
		let ye = {
			encode(t, n = new BinaryWriter()) {
				return t.audioFile.length !== 0 && n.uint32(18).bytes(t.audioFile), t.chunkId !== 0 && n.uint32(8).int32(t.chunkId), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBasePartialAudioBufferObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 2:
							if (t !== 18) break;
							d.audioFile = i.bytes();
							continue;
						case 1:
							if (t !== 8) break;
							d.chunkId = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					audioFile: isSet(t.audioFile) ? bytesFromBase64(t.audioFile) : new Uint8Array(),
					chunkId: isSet(t.chunkId) ? globalThis.Number(t.chunkId) : 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.audioFile.length !== 0 && (n.audioFile = base64FromBytes(t.audioFile)), t.chunkId !== 0 && (n.chunkId = Math.round(t.chunkId)), n;
			},
			create(t) {
				return ye.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBasePartialAudioBufferObject();
				return n.audioFile = t.audioFile ?? new Uint8Array(), n.chunkId = t.chunkId ?? 0, n;
			}
		};
		function createBaseChunkAudioObject() {
			return {
				audioBuffer: void 0,
				audioPartsLength: 0,
				fileId: "",
				version: 0
			};
		}
		let be = {
			encode(t, n = new BinaryWriter()) {
				return t.audioBuffer !== void 0 && ye.encode(t.audioBuffer, n.uint32(10).fork()).join(), t.audioPartsLength !== 0 && n.uint32(16).int32(t.audioPartsLength), t.fileId !== "" && n.uint32(26).string(t.fileId), t.version !== 0 && n.uint32(32).int32(t.version), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseChunkAudioObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.audioBuffer = ye.decode(i, i.uint32());
							continue;
						case 2:
							if (t !== 16) break;
							d.audioPartsLength = i.int32();
							continue;
						case 3:
							if (t !== 26) break;
							d.fileId = i.string();
							continue;
						case 4:
							if (t !== 32) break;
							d.version = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					audioBuffer: isSet(t.audioBuffer) ? ye.fromJSON(t.audioBuffer) : void 0,
					audioPartsLength: isSet(t.audioPartsLength) ? globalThis.Number(t.audioPartsLength) : 0,
					fileId: isSet(t.fileId) ? globalThis.String(t.fileId) : "",
					version: isSet(t.version) ? globalThis.Number(t.version) : 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.audioBuffer !== void 0 && (n.audioBuffer = ye.toJSON(t.audioBuffer)), t.audioPartsLength !== 0 && (n.audioPartsLength = Math.round(t.audioPartsLength)), t.fileId !== "" && (n.fileId = t.fileId), t.version !== 0 && (n.version = Math.round(t.version)), n;
			},
			create(t) {
				return be.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseChunkAudioObject();
				return n.audioBuffer = t.audioBuffer !== void 0 && t.audioBuffer !== null ? ye.fromPartial(t.audioBuffer) : void 0, n.audioPartsLength = t.audioPartsLength ?? 0, n.fileId = t.fileId ?? "", n.version = t.version ?? 0, n;
			}
		};
		function createBaseVideoTranslationAudioRequest() {
			return {
				translationId: "",
				url: "",
				partialAudioInfo: void 0,
				audioInfo: void 0
			};
		}
		let xe = {
			encode(t, n = new BinaryWriter()) {
				return t.translationId !== "" && n.uint32(10).string(t.translationId), t.url !== "" && n.uint32(18).string(t.url), t.partialAudioInfo !== void 0 && be.encode(t.partialAudioInfo, n.uint32(34).fork()).join(), t.audioInfo !== void 0 && ve.encode(t.audioInfo, n.uint32(50).fork()).join(), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationAudioRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.translationId = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.url = i.string();
							continue;
						case 4:
							if (t !== 34) break;
							d.partialAudioInfo = be.decode(i, i.uint32());
							continue;
						case 6:
							if (t !== 50) break;
							d.audioInfo = ve.decode(i, i.uint32());
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					translationId: isSet(t.translationId) ? globalThis.String(t.translationId) : "",
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					partialAudioInfo: isSet(t.partialAudioInfo) ? be.fromJSON(t.partialAudioInfo) : void 0,
					audioInfo: isSet(t.audioInfo) ? ve.fromJSON(t.audioInfo) : void 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.translationId !== "" && (n.translationId = t.translationId), t.url !== "" && (n.url = t.url), t.partialAudioInfo !== void 0 && (n.partialAudioInfo = be.toJSON(t.partialAudioInfo)), t.audioInfo !== void 0 && (n.audioInfo = ve.toJSON(t.audioInfo)), n;
			},
			create(t) {
				return xe.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationAudioRequest();
				return n.translationId = t.translationId ?? "", n.url = t.url ?? "", n.partialAudioInfo = t.partialAudioInfo !== void 0 && t.partialAudioInfo !== null ? be.fromPartial(t.partialAudioInfo) : void 0, n.audioInfo = t.audioInfo !== void 0 && t.audioInfo !== null ? ve.fromPartial(t.audioInfo) : void 0, n;
			}
		};
		function createBaseVideoTranslationAudioResponse() {
			return {
				status: 0,
				remainingChunks: []
			};
		}
		let Se = {
			encode(t, n = new BinaryWriter()) {
				t.status !== 0 && n.uint32(8).int32(t.status);
				for (let i of t.remainingChunks) n.uint32(18).string(i);
				return n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseVideoTranslationAudioResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 8) break;
							d.status = i.int32();
							continue;
						case 2:
							if (t !== 18) break;
							d.remainingChunks.push(i.string());
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					status: isSet(t.status) ? globalThis.Number(t.status) : 0,
					remainingChunks: globalThis.Array.isArray(t?.remainingChunks) ? t.remainingChunks.map((t) => globalThis.String(t)) : []
				};
			},
			toJSON(t) {
				let n = {};
				return t.status !== 0 && (n.status = Math.round(t.status)), t.remainingChunks?.length && (n.remainingChunks = t.remainingChunks), n;
			},
			create(t) {
				return Se.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseVideoTranslationAudioResponse();
				return n.status = t.status ?? 0, n.remainingChunks = t.remainingChunks?.map((t) => t) || [], n;
			}
		};
		function createBaseSubtitlesObject() {
			return {
				language: "",
				url: "",
				unknown0: 0,
				translatedLanguage: "",
				translatedUrl: "",
				unknown1: 0,
				unknown2: 0
			};
		}
		let Ce = {
			encode(t, n = new BinaryWriter()) {
				return t.language !== "" && n.uint32(10).string(t.language), t.url !== "" && n.uint32(18).string(t.url), t.unknown0 !== 0 && n.uint32(24).int32(t.unknown0), t.translatedLanguage !== "" && n.uint32(34).string(t.translatedLanguage), t.translatedUrl !== "" && n.uint32(42).string(t.translatedUrl), t.unknown1 !== 0 && n.uint32(48).int32(t.unknown1), t.unknown2 !== 0 && n.uint32(56).int32(t.unknown2), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseSubtitlesObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.language = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.url = i.string();
							continue;
						case 3:
							if (t !== 24) break;
							d.unknown0 = i.int32();
							continue;
						case 4:
							if (t !== 34) break;
							d.translatedLanguage = i.string();
							continue;
						case 5:
							if (t !== 42) break;
							d.translatedUrl = i.string();
							continue;
						case 6:
							if (t !== 48) break;
							d.unknown1 = i.int32();
							continue;
						case 7:
							if (t !== 56) break;
							d.unknown2 = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					language: isSet(t.language) ? globalThis.String(t.language) : "",
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					unknown0: isSet(t.unknown0) ? globalThis.Number(t.unknown0) : 0,
					translatedLanguage: isSet(t.translatedLanguage) ? globalThis.String(t.translatedLanguage) : "",
					translatedUrl: isSet(t.translatedUrl) ? globalThis.String(t.translatedUrl) : "",
					unknown1: isSet(t.unknown1) ? globalThis.Number(t.unknown1) : 0,
					unknown2: isSet(t.unknown2) ? globalThis.Number(t.unknown2) : 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.language !== "" && (n.language = t.language), t.url !== "" && (n.url = t.url), t.unknown0 !== 0 && (n.unknown0 = Math.round(t.unknown0)), t.translatedLanguage !== "" && (n.translatedLanguage = t.translatedLanguage), t.translatedUrl !== "" && (n.translatedUrl = t.translatedUrl), t.unknown1 !== 0 && (n.unknown1 = Math.round(t.unknown1)), t.unknown2 !== 0 && (n.unknown2 = Math.round(t.unknown2)), n;
			},
			create(t) {
				return Ce.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseSubtitlesObject();
				return n.language = t.language ?? "", n.url = t.url ?? "", n.unknown0 = t.unknown0 ?? 0, n.translatedLanguage = t.translatedLanguage ?? "", n.translatedUrl = t.translatedUrl ?? "", n.unknown1 = t.unknown1 ?? 0, n.unknown2 = t.unknown2 ?? 0, n;
			}
		};
		function createBaseSubtitlesRequest() {
			return {
				url: "",
				language: ""
			};
		}
		let we = {
			encode(t, n = new BinaryWriter()) {
				return t.url !== "" && n.uint32(10).string(t.url), t.language !== "" && n.uint32(18).string(t.language), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseSubtitlesRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.url = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.language = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					language: isSet(t.language) ? globalThis.String(t.language) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== "" && (n.url = t.url), t.language !== "" && (n.language = t.language), n;
			},
			create(t) {
				return we.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseSubtitlesRequest();
				return n.url = t.url ?? "", n.language = t.language ?? "", n;
			}
		};
		function createBaseSubtitlesResponse() {
			return {
				waiting: !1,
				subtitles: []
			};
		}
		let Te = {
			encode(t, n = new BinaryWriter()) {
				t.waiting !== !1 && n.uint32(8).bool(t.waiting);
				for (let i of t.subtitles) Ce.encode(i, n.uint32(18).fork()).join();
				return n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseSubtitlesResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 8) break;
							d.waiting = i.bool();
							continue;
						case 2:
							if (t !== 18) break;
							d.subtitles.push(Ce.decode(i, i.uint32()));
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					waiting: isSet(t.waiting) ? globalThis.Boolean(t.waiting) : !1,
					subtitles: globalThis.Array.isArray(t?.subtitles) ? t.subtitles.map((t) => Ce.fromJSON(t)) : []
				};
			},
			toJSON(t) {
				let n = {};
				return t.waiting !== !1 && (n.waiting = t.waiting), t.subtitles?.length && (n.subtitles = t.subtitles.map((t) => Ce.toJSON(t))), n;
			},
			create(t) {
				return Te.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseSubtitlesResponse();
				return n.waiting = t.waiting ?? !1, n.subtitles = t.subtitles?.map((t) => Ce.fromPartial(t)) || [], n;
			}
		};
		function createBaseStreamTranslationObject() {
			return {
				url: "",
				timestamp: ""
			};
		}
		let Ee = {
			encode(t, n = new BinaryWriter()) {
				return t.url !== "" && n.uint32(10).string(t.url), t.timestamp !== "" && n.uint32(18).string(t.timestamp), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseStreamTranslationObject();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.url = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.timestamp = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					timestamp: isSet(t.timestamp) ? globalThis.String(t.timestamp) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== "" && (n.url = t.url), t.timestamp !== "" && (n.timestamp = t.timestamp), n;
			},
			create(t) {
				return Ee.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseStreamTranslationObject();
				return n.url = t.url ?? "", n.timestamp = t.timestamp ?? "", n;
			}
		};
		function createBaseStreamTranslationRequest() {
			return {
				url: "",
				language: "",
				responseLanguage: "",
				unknown0: 0,
				unknown1: 0
			};
		}
		let De = {
			encode(t, n = new BinaryWriter()) {
				return t.url !== "" && n.uint32(10).string(t.url), t.language !== "" && n.uint32(18).string(t.language), t.responseLanguage !== "" && n.uint32(26).string(t.responseLanguage), t.unknown0 !== 0 && n.uint32(40).int32(t.unknown0), t.unknown1 !== 0 && n.uint32(48).int32(t.unknown1), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseStreamTranslationRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.url = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.language = i.string();
							continue;
						case 3:
							if (t !== 26) break;
							d.responseLanguage = i.string();
							continue;
						case 5:
							if (t !== 40) break;
							d.unknown0 = i.int32();
							continue;
						case 6:
							if (t !== 48) break;
							d.unknown1 = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					url: isSet(t.url) ? globalThis.String(t.url) : "",
					language: isSet(t.language) ? globalThis.String(t.language) : "",
					responseLanguage: isSet(t.responseLanguage) ? globalThis.String(t.responseLanguage) : "",
					unknown0: isSet(t.unknown0) ? globalThis.Number(t.unknown0) : 0,
					unknown1: isSet(t.unknown1) ? globalThis.Number(t.unknown1) : 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.url !== "" && (n.url = t.url), t.language !== "" && (n.language = t.language), t.responseLanguage !== "" && (n.responseLanguage = t.responseLanguage), t.unknown0 !== 0 && (n.unknown0 = Math.round(t.unknown0)), t.unknown1 !== 0 && (n.unknown1 = Math.round(t.unknown1)), n;
			},
			create(t) {
				return De.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseStreamTranslationRequest();
				return n.url = t.url ?? "", n.language = t.language ?? "", n.responseLanguage = t.responseLanguage ?? "", n.unknown0 = t.unknown0 ?? 0, n.unknown1 = t.unknown1 ?? 0, n;
			}
		};
		function createBaseStreamTranslationResponse() {
			return {
				interval: 0,
				translatedInfo: void 0,
				pingId: void 0
			};
		}
		let Oe = {
			encode(t, n = new BinaryWriter()) {
				return t.interval !== 0 && n.uint32(8).int32(t.interval), t.translatedInfo !== void 0 && Ee.encode(t.translatedInfo, n.uint32(18).fork()).join(), t.pingId !== void 0 && n.uint32(24).int32(t.pingId), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseStreamTranslationResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 8) break;
							d.interval = i.int32();
							continue;
						case 2:
							if (t !== 18) break;
							d.translatedInfo = Ee.decode(i, i.uint32());
							continue;
						case 3:
							if (t !== 24) break;
							d.pingId = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					interval: isSet(t.interval) ? streamIntervalFromJSON(t.interval) : 0,
					translatedInfo: isSet(t.translatedInfo) ? Ee.fromJSON(t.translatedInfo) : void 0,
					pingId: isSet(t.pingId) ? globalThis.Number(t.pingId) : void 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.interval !== 0 && (n.interval = streamIntervalToJSON(t.interval)), t.translatedInfo !== void 0 && (n.translatedInfo = Ee.toJSON(t.translatedInfo)), t.pingId !== void 0 && (n.pingId = Math.round(t.pingId)), n;
			},
			create(t) {
				return Oe.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseStreamTranslationResponse();
				return n.interval = t.interval ?? 0, n.translatedInfo = t.translatedInfo !== void 0 && t.translatedInfo !== null ? Ee.fromPartial(t.translatedInfo) : void 0, n.pingId = t.pingId ?? void 0, n;
			}
		};
		function createBaseStreamPingRequest() {
			return { pingId: 0 };
		}
		let ke = {
			encode(t, n = new BinaryWriter()) {
				return t.pingId !== 0 && n.uint32(8).int32(t.pingId), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseStreamPingRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 8) break;
							d.pingId = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return { pingId: isSet(t.pingId) ? globalThis.Number(t.pingId) : 0 };
			},
			toJSON(t) {
				let n = {};
				return t.pingId !== 0 && (n.pingId = Math.round(t.pingId)), n;
			},
			create(t) {
				return ke.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseStreamPingRequest();
				return n.pingId = t.pingId ?? 0, n;
			}
		};
		function createBaseYandexSessionRequest() {
			return {
				uuid: "",
				module: ""
			};
		}
		let Ae = {
			encode(t, n = new BinaryWriter()) {
				return t.uuid !== "" && n.uint32(10).string(t.uuid), t.module !== "" && n.uint32(18).string(t.module), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseYandexSessionRequest();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.uuid = i.string();
							continue;
						case 2:
							if (t !== 18) break;
							d.module = i.string();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					uuid: isSet(t.uuid) ? globalThis.String(t.uuid) : "",
					module: isSet(t.module) ? globalThis.String(t.module) : ""
				};
			},
			toJSON(t) {
				let n = {};
				return t.uuid !== "" && (n.uuid = t.uuid), t.module !== "" && (n.module = t.module), n;
			},
			create(t) {
				return Ae.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseYandexSessionRequest();
				return n.uuid = t.uuid ?? "", n.module = t.module ?? "", n;
			}
		};
		function createBaseYandexSessionResponse() {
			return {
				secretKey: "",
				expires: 0
			};
		}
		let je = {
			encode(t, n = new BinaryWriter()) {
				return t.secretKey !== "" && n.uint32(10).string(t.secretKey), t.expires !== 0 && n.uint32(16).int32(t.expires), n;
			},
			decode(t, n) {
				let i = t instanceof BinaryReader ? t : new BinaryReader(t), s = n === void 0 ? i.len : i.pos + n, d = createBaseYandexSessionResponse();
				for (; i.pos < s;) {
					let t = i.uint32();
					switch (t >>> 3) {
						case 1:
							if (t !== 10) break;
							d.secretKey = i.string();
							continue;
						case 2:
							if (t !== 16) break;
							d.expires = i.int32();
							continue;
					}
					if ((t & 7) == 4 || t === 0) break;
					i.skip(t & 7);
				}
				return d;
			},
			fromJSON(t) {
				return {
					secretKey: isSet(t.secretKey) ? globalThis.String(t.secretKey) : "",
					expires: isSet(t.expires) ? globalThis.Number(t.expires) : 0
				};
			},
			toJSON(t) {
				let n = {};
				return t.secretKey !== "" && (n.secretKey = t.secretKey), t.expires !== 0 && (n.expires = Math.round(t.expires)), n;
			},
			create(t) {
				return je.fromPartial(t ?? {});
			},
			fromPartial(t) {
				let n = createBaseYandexSessionResponse();
				return n.secretKey = t.secretKey ?? "", n.expires = t.expires ?? 0, n;
			}
		};
		function bytesFromBase64(t) {
			if (globalThis.Buffer) return Uint8Array.from(globalThis.Buffer.from(t, "base64"));
			{
				let n = globalThis.atob(t), i = new Uint8Array(n.length);
				for (let t = 0; t < n.length; ++t) i[t] = n.charCodeAt(t);
				return i;
			}
		}
		function base64FromBytes(t) {
			if (globalThis.Buffer) return globalThis.Buffer.from(t).toString("base64");
			{
				let n = [];
				return t.forEach((t) => {
					n.push(globalThis.String.fromCharCode(t));
				}), globalThis.btoa(n.join(""));
			}
		}
		function isSet(t) {
			return t != null;
		}
		let { componentVersion: Me } = E;
		async function getCrypto() {
			return typeof window < "u" && window.crypto ? window.crypto : await Promise.resolve().then(function webpackMissingModule() {
				var t = Error("Cannot find module 'node:crypto'");
				throw t.code = "MODULE_NOT_FOUND", t;
			});
		}
		let Ne = new TextEncoder();
		async function signHMAC(t, n, i) {
			let s = await getCrypto(), d = await s.subtle.importKey("raw", Ne.encode(n), {
				name: "HMAC",
				hash: { name: t }
			}, !1, ["sign", "verify"]);
			return await s.subtle.sign("HMAC", d, i);
		}
		async function getSignature(t) {
			let n = await signHMAC("SHA-256", E.hmac, t);
			return new Uint8Array(n).reduce((t, n) => t + n.toString(16).padStart(2, "0"), "");
		}
		async function getSecYaHeaders(t, n, i, s) {
			let { secretKey: d, uuid: f } = n, p = `${f}:${s}:${E.componentVersion}`, m = Ne.encode(p), h = await getSignature(m);
			if (t === "Ya-Summary") return {
				[`X-${t}-Sk`]: d,
				[`X-${t}-Token`]: `${h}:${p}`
			};
			let g = await getSignature(i);
			return {
				[`${t}-Signature`]: g,
				[`Sec-${t}-Sk`]: d,
				[`Sec-${t}-Token`]: `${h}:${p}`
			};
		}
		function getUUID() {
			let t = "0123456789ABCDEF", n = "";
			for (let i = 0; i < 32; i++) {
				let i = Math.floor(Math.random() * 16);
				n += t[i];
			}
			return n;
		}
		async function getHmacSha1(t, n) {
			try {
				let i = Ne.encode(n), s = await signHMAC("SHA-1", t, i);
				return btoa(String.fromCharCode(...new Uint8Array(s)));
			} catch (t) {
				return Logger.error(t), !1;
			}
		}
		let Pe = {
			"sec-ch-ua": `"Chromium";v="134", "YaBrowser";v="${Me.slice(0, 5)}", "Not?A_Brand";v="24", "Yowser";v="2.5"`,
			"sec-ch-ua-full-version-list": `"Chromium";v="134.0.6998.1973", "YaBrowser";v="${Me}", "Not?A_Brand";v="24.0.0.0", "Yowser";v="2.5"`,
			"Sec-Fetch-Mode": "no-cors"
		}, Fe = {
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
			zul: "zu"
		};
		async function fetchWithTimeout(t, n = { headers: { "User-Agent": E.userAgent } }) {
			let { timeout: i = 3e3,...s } = n, d = new AbortController(), f = setTimeout(() => d.abort(), i), p = await fetch(t, {
				signal: d.signal,
				...s
			});
			return clearTimeout(f), p;
		}
		function getTimestamp() {
			return Math.floor(Date.now() / 1e3);
		}
		function normalizeLang(t) {
			return t.length === 3 ? Fe[t] : t.toLowerCase().split(/[_;-]/)[0].trim();
		}
		function proxyMedia(t, n = "mp4") {
			let i = `https://${E.mediaProxy}/v1/proxy/video.${n}?format=base64&force=true`;
			return t instanceof URL ? `${i}&url=${btoa(t.href)}&origin=${t.origin}&referer=${t.origin}` : `${i}&url=${btoa(t)}`;
		}
		class YandexVOTProtobuf {
			static encodeTranslationRequest(t, n, i, s, d, { forceSourceLang: f = !1, wasStream: p = !1, videoTitle: m = "", bypassCache: h = !1, useLivelyVoice: g = !1 } = {}) {
				return me.encode({
					url: t,
					firstRequest: !0,
					duration: n,
					unknown0: 1,
					language: i,
					forceSourceLang: f,
					unknown1: 0,
					translationHelp: d ?? [],
					responseLanguage: s,
					wasStream: p,
					unknown2: 0,
					unknown3: 2,
					bypassCache: h,
					useLivelyVoice: g,
					videoTitle: m
				}).finish();
			}
			static decodeTranslationResponse(t) {
				return he.decode(new Uint8Array(t));
			}
			static encodeTranslationCacheRequest(t, n, i, s) {
				return ge.encode({
					url: t,
					duration: n,
					language: i,
					responseLanguage: s
				}).finish();
			}
			static decodeTranslationCacheResponse(t) {
				return _e.decode(new Uint8Array(t));
			}
			static isPartialAudioBuffer(t) {
				return "chunkId" in t;
			}
			static encodeTranslationAudioRequest(t, n, i, s) {
				return s && YandexVOTProtobuf.isPartialAudioBuffer(i) ? xe.encode({
					url: t,
					translationId: n,
					partialAudioInfo: {
						...s,
						audioBuffer: i
					}
				}).finish() : xe.encode({
					url: t,
					translationId: n,
					audioInfo: i
				}).finish();
			}
			static decodeTranslationAudioResponse(t) {
				return Se.decode(new Uint8Array(t));
			}
			static encodeSubtitlesRequest(t, n) {
				return we.encode({
					url: t,
					language: n
				}).finish();
			}
			static decodeSubtitlesResponse(t) {
				return Te.decode(new Uint8Array(t));
			}
			static encodeStreamPingRequest(t) {
				return ke.encode({ pingId: t }).finish();
			}
			static encodeStreamRequest(t, n, i) {
				return De.encode({
					url: t,
					language: n,
					responseLanguage: i,
					unknown0: 1,
					unknown1: 0
				}).finish();
			}
			static decodeStreamResponse(t) {
				return Oe.decode(new Uint8Array(t));
			}
		}
		class YandexSessionProtobuf {
			static encodeSessionRequest(t, n) {
				return Ae.encode({
					uuid: t,
					module: n
				}).finish();
			}
			static decodeSessionResponse(t) {
				return je.decode(new Uint8Array(t));
			}
		}
		var j;
		(function(t) {
			t[t.FAILED = 0] = "FAILED", t[t.FINISHED = 1] = "FINISHED", t[t.WAITING = 2] = "WAITING", t[t.LONG_WAITING = 3] = "LONG_WAITING", t[t.PART_CONTENT = 5] = "PART_CONTENT", t[t.AUDIO_REQUESTED = 6] = "AUDIO_REQUESTED", t[t.SESSION_REQUIRED = 7] = "SESSION_REQUIRED";
		})(j ||= {});
		var Ie;
		(function(t) {
			t.WEB_API_VIDEO_SRC_FROM_IFRAME = "web_api_video_src_from_iframe", t.WEB_API_VIDEO_SRC = "web_api_video_src", t.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME = "web_api_get_all_generating_urls_data_from_iframe", t.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME_TMP_EXP = "web_api_get_all_generating_urls_data_from_iframe_tmp_exp", t.WEB_API_REPLACED_FETCH_INSIDE_IFRAME = "web_api_replaced_fetch_inside_iframe", t.ANDROID_API = "android_api", t.WEB_API_SLOW = "web_api_slow", t.WEB_API_STEAL_SIG_AND_N = "web_api_steal_sig_and_n", t.WEB_API_COMBINED = "web_api_get_all_generating_urls_data_from_iframe,web_api_steal_sig_and_n";
		})(Ie ||= {});
		var F;
		(function(t) {
			t.custom = "custom", t.directlink = "custom", t.youtube = "youtube", t.piped = "piped", t.invidious = "invidious", t.vk = "vk", t.nine_gag = "nine_gag", t.gag = "nine_gag", t.twitch = "twitch", t.proxitok = "proxitok", t.tiktok = "tiktok", t.vimeo = "vimeo", t.xvideos = "xvideos", t.pornhub = "pornhub", t.twitter = "twitter", t.x = "twitter", t.rumble = "rumble", t.facebook = "facebook", t.rutube = "rutube", t.coub = "coub", t.bilibili = "bilibili", t.mail_ru = "mailru", t.mailru = "mailru", t.bitchute = "bitchute", t.eporner = "eporner", t.peertube = "peertube", t.dailymotion = "dailymotion", t.trovo = "trovo", t.yandexdisk = "yandexdisk", t.ok_ru = "okru", t.okru = "okru", t.googledrive = "googledrive", t.bannedvideo = "bannedvideo", t.weverse = "weverse", t.newgrounds = "newgrounds", t.egghead = "egghead", t.youku = "youku", t.archive = "archive", t.kodik = "kodik", t.patreon = "patreon", t.reddit = "reddit", t.kick = "kick", t.apple_developer = "apple_developer", t.appledeveloper = "apple_developer", t.poketube = "poketube", t.epicgames = "epicgames", t.odysee = "odysee", t.coursehunterLike = "coursehunterLike", t.sap = "sap", t.watchpornto = "watchpornto", t.linkedin = "linkedin", t.ricktube = "ricktube", t.incestflix = "incestflix", t.porntn = "porntn", t.dzen = "dzen", t.cloudflarestream = "cloudflarestream", t.loom = "loom", t.rtnews = "rtnews", t.bitview = "bitview", t.thisvid = "thisvid", t.ign = "ign", t.bunkr = "bunkr", t.imdb = "imdb", t.telegram = "telegram";
		})(F ||= {});
		function convertVOT(t, n, i) {
			return t === F.patreon ? {
				service: "mux",
				videoId: new URL(i).pathname.slice(1)
			} : {
				service: t,
				videoId: n
			};
		}
		let Le = JSON.parse("{\"recommended\":\"recommended\",\"translateVideo\":\"Translate video\",\"disableTranslate\":\"Turn off\",\"translationSettings\":\"Translation settings\",\"subtitlesSettings\":\"Subtitles settings\",\"resetSettings\":\"Reset settings\",\"videoBeingTranslated\":\"The video is being translated\",\"videoLanguage\":\"Video language\",\"translationLanguage\":\"Translation language\",\"translationTake\":\"The translation will take\",\"translationTakeMoreThanHour\":\"The translation will take more than an hour\",\"translationTakeAboutMinute\":\"The translation will take about a minute\",\"translationTakeFewMinutes\":\"The translation will take a few minutes\",\"translationTakeApproximatelyMinutes\":\"The translation will take approximately {0} minutes\",\"translationTakeApproximatelyMinute\":\"The translation will take approximately {0} minutes\",\"requestTranslationFailed\":\"Failed to request video translation\",\"audioNotReceived\":\"Audio link not received\",\"audioFormatNotSupported\":\"The audio format is not supported\",\"VOTAutoTranslate\":\"Translate on open\",\"VOTDontTranslateYourLang\":\"Don't translate from my language\",\"VOTVolume\":\"Video volume:\",\"VOTVolumeTranslation\":\"Translation volume:\",\"VOTAutoSetVolume\":\"Reduce video volume to\",\"VOTShowVideoSlider\":\"Video volume slider\",\"VOTSyncVolume\":\"Link translation and video volume\",\"VOTDisableFromYourLang\":\"You have disabled the translation of the video in your language\",\"VOTVideoIsTooLong\":\"Video is too long\",\"VOTNoVideoIDFound\":\"No video ID found\",\"VOTSubtitles\":\"Subtitles\",\"VOTSubtitlesDisabled\":\"Disabled\",\"VOTSubtitlesMaxLength\":\"Subtitles max length\",\"VOTHighlightWords\":\"Highlight words\",\"VOTTranslatedFrom\":\"translated from\",\"VOTAutogenerated\":\"autogenerated\",\"VOTSettings\":\"VOT Settings\",\"VOTMenuLanguage\":\"Menu language\",\"VOTAuthors\":\"Authors\",\"VOTVersion\":\"Version\",\"VOTLoader\":\"Loader\",\"VOTBrowser\":\"Browser\",\"VOTShowPiPButton\":\"Show PiP button\",\"langs\":{\"auto\":\"Auto\",\"af\":\"Afrikaans\",\"ak\":\"Akan\",\"sq\":\"Albanian\",\"am\":\"Amharic\",\"ar\":\"Arabic\",\"hy\":\"Armenian\",\"as\":\"Assamese\",\"ay\":\"Aymara\",\"az\":\"Azerbaijani\",\"bn\":\"Bangla\",\"eu\":\"Basque\",\"be\":\"Belarusian\",\"bho\":\"Bhojpuri\",\"bs\":\"Bosnian\",\"bg\":\"Bulgarian\",\"my\":\"Burmese\",\"ca\":\"Catalan\",\"ceb\":\"Cebuano\",\"zh\":\"Chinese\",\"zh-Hans\":\"Chinese (Simplified)\",\"zh-Hant\":\"Chinese (Traditional)\",\"co\":\"Corsican\",\"hr\":\"Croatian\",\"cs\":\"Czech\",\"da\":\"Danish\",\"dv\":\"Divehi\",\"nl\":\"Dutch\",\"en\":\"English\",\"eo\":\"Esperanto\",\"et\":\"Estonian\",\"ee\":\"Ewe\",\"fil\":\"Filipino\",\"fi\":\"Finnish\",\"fr\":\"French\",\"gl\":\"Galician\",\"lg\":\"Ganda\",\"ka\":\"Georgian\",\"de\":\"German\",\"el\":\"Greek\",\"gn\":\"Guarani\",\"gu\":\"Gujarati\",\"ht\":\"Haitian Creole\",\"ha\":\"Hausa\",\"haw\":\"Hawaiian\",\"iw\":\"Hebrew\",\"hi\":\"Hindi\",\"hmn\":\"Hmong\",\"hu\":\"Hungarian\",\"is\":\"Icelandic\",\"ig\":\"Igbo\",\"id\":\"Indonesian\",\"ga\":\"Irish\",\"it\":\"Italian\",\"ja\":\"Japanese\",\"jv\":\"Javanese\",\"kn\":\"Kannada\",\"kk\":\"Kazakh\",\"km\":\"Khmer\",\"rw\":\"Kinyarwanda\",\"ko\":\"Korean\",\"kri\":\"Krio\",\"ku\":\"Kurdish\",\"ky\":\"Kyrgyz\",\"lo\":\"Lao\",\"la\":\"Latin\",\"lv\":\"Latvian\",\"ln\":\"Lingala\",\"lt\":\"Lithuanian\",\"lb\":\"Luxembourgish\",\"mk\":\"Macedonian\",\"mg\":\"Malagasy\",\"ms\":\"Malay\",\"ml\":\"Malayalam\",\"mt\":\"Maltese\",\"mi\":\"Māori\",\"mr\":\"Marathi\",\"mn\":\"Mongolian\",\"ne\":\"Nepali\",\"nso\":\"Northern Sotho\",\"no\":\"Norwegian\",\"ny\":\"Nyanja\",\"or\":\"Odia\",\"om\":\"Oromo\",\"ps\":\"Pashto\",\"fa\":\"Persian\",\"pl\":\"Polish\",\"pt\":\"Portuguese\",\"pa\":\"Punjabi\",\"qu\":\"Quechua\",\"ro\":\"Romanian\",\"ru\":\"Russian\",\"sm\":\"Samoan\",\"sa\":\"Sanskrit\",\"gd\":\"Scottish Gaelic\",\"sr\":\"Serbian\",\"sn\":\"Shona\",\"sd\":\"Sindhi\",\"si\":\"Sinhala\",\"sk\":\"Slovak\",\"sl\":\"Slovenian\",\"so\":\"Somali\",\"st\":\"Southern Sotho\",\"es\":\"Spanish\",\"su\":\"Sundanese\",\"sw\":\"Swahili\",\"sv\":\"Swedish\",\"tg\":\"Tajik\",\"ta\":\"Tamil\",\"tt\":\"Tatar\",\"te\":\"Telugu\",\"th\":\"Thai\",\"ti\":\"Tigrinya\",\"ts\":\"Tsonga\",\"tr\":\"Turkish\",\"tk\":\"Turkmen\",\"uk\":\"Ukrainian\",\"ur\":\"Urdu\",\"ug\":\"Uyghur\",\"uz\":\"Uzbek\",\"vi\":\"Vietnamese\",\"cy\":\"Welsh\",\"fy\":\"Western Frisian\",\"xh\":\"Xhosa\",\"yi\":\"Yiddish\",\"yo\":\"Yoruba\",\"zu\":\"Zulu\"},\"streamNoConnectionToServer\":\"There is no connection to the server\",\"searchField\":\"Search...\",\"VOTTranslateAPIErrors\":\"Translate errors from the API\",\"VOTDetectService\":\"Language detection service\",\"VOTProxyWorkerHost\":\"Enter the proxy worker address\",\"VOTM3u8ProxyHost\":\"Enter the address of the m3u8 proxy worker\",\"proxySettings\":\"Proxy Settings\",\"translationTakeApproximatelyMinute2\":\"The translation will take approximately {0} minutes\",\"VOTAudioBooster\":\"Extended translation volume increase\",\"VOTSubtitlesDesign\":\"Subtitles design\",\"VOTSubtitlesFontSize\":\"Font size of subtitles\",\"VOTSubtitlesOpacity\":\"Transparency of the subtitle background\",\"VOTPressNewHotkey\":\"Press the new hotkey...\",\"VOTCreateTranslationHotkey\":\"Create Hotkey for Translation\",\"VOTChangeHotkeyWithCurrent\":\"Change Hotkey (Current: {0})\",\"VOTSubtitlesDownloadFormat\":\"The format for downloading subtitles\",\"VOTDownloadWithName\":\"Download files with the video name\",\"VOTUpdateLocaleFiles\":\"Update localization files\",\"VOTLocaleHash\":\"Locale hash\",\"VOTUpdatedAt\":\"Updated at\",\"VOTNeedWebAudioAPI\":\"To enable this, you must have a Web Audio API\",\"VOTMediaCSPEnabledOnSite\":\"Media CSP is enabled on this site\",\"VOTOnlyBypassMediaCSP\":\"Use it only for bypassing Media CSP\",\"VOTNewAudioPlayer\":\"Use the new audio player\",\"VOTUseNewModel\":\"Use an experimental variation of Yandex voices for some videos\",\"TranslationDelayed\":\"The translation is slightly delayed\",\"VOTTranslationCompletedNotify\":\"The translation on the {0} has been completed!\",\"VOTSendNotifyOnComplete\":\"Send a notification that the video has been translated\",\"VOTBugReport\":\"Report a bug\",\"VOTTranslateProxyDisabled\":\"Disabled\",\"VOTTranslateProxyEnabled\":\"Enabled\",\"VOTTranslateProxyEverything\":\"Proxy everything\",\"VOTTranslateProxyStatus\":\"Proxying mode\",\"VOTTranslatedBy\":\"Translated by {0}\",\"VOTStreamNotAvailable\":\"Translate stream isn't available\",\"VOTTranslationTextService\":\"Text translation service\",\"VOTNotAffectToVoice\":\"Doesn't affect the translation of text in voice over\",\"DontTranslateSelectedLanguages\":\"Don't translate from selected languages\",\"showVideoVolumeSlider\":\"Display the video volume slider\",\"hotkeysSettings\":\"Hotkeys settings\",\"None\":\"None\",\"VOTUseLivelyVoice\":\"Use lively voices. Speakers sound like native Russians.\",\"miscSettings\":\"Misc settings\",\"services\":{\"yandexbrowser\":\"Yandex Browser\",\"msedge\":\"Microsoft Edge\",\"rust-server\":\"Rust Server\"},\"aboutExtension\":\"About extension\",\"appearance\":\"Appearance\",\"buttonPositionInWidePlayer\":\"Button position in wide player\",\"position\":{\"left\":\"Left\",\"right\":\"Right\",\"top\":\"Top\",\"default\":\"Default\"},\"secs\":\"secs\",\"autoHideButtonDelay\":\"Delay before hiding the translate button\",\"notFound\":\"not found\",\"downloadFailed\":\"Failed to download file\",\"minButtonPositionContainer\":\"The button position only changes in players larger than 600 pixels.\",\"VOTTranslateProxyStatusDefault\":\"Completely disabling proxying in your country may break the extension\",\"PressTheKeyCombination\":\"Press the key combination...\",\"VOTUseAudioDownload\":\"Use audio download\",\"VOTUseAudioDownloadWarning\":\"Disabling audio downloads may affect the functionality of the extension\",\"VOTAccountRequired\":\"You need to log in to use this feature\",\"VOTMyAccount\":\"My account\",\"VOTLogin\":\"Login\",\"VOTLogout\":\"Logout\",\"VOTRefresh\":\"Refresh\"}"), U = { log: (...t) => {} }, Re = "api.browser.yandex.ru", ze = "media-proxy.toil.cc/v1/proxy/m3u8", Be = "vot-worker.toil.cc", Ve = "https://vot.toil.cc/v1", He = "https://translate.toil.cc/v2", Ue = "https://rust-server-531j.onrender.com/detect", We = "https://t2mc.toil.cc", Ge = "https://avatars.mds.yandex.net/get-yapic", Ke = "ilyhalight/voice-over-translation", qe = `https://raw.githubusercontent.com/${Ke}`, Je = `https://github.com/${Ke}`, Ye = 15, Xe = 900, Ze = 5, Qe = "yandexbrowser", $e = "yandexbrowser", et = ["Tampermonkey", "Violentmonkey"], tt = [
			"UA",
			"LV",
			"LT"
		], nt = 1e3, rt = "2025-05-09", it = "autoTranslate.dontTranslateLanguages.enabledDontTranslateLanguages.enabledAutoVolume.autoVolume.buttonPos.showVideoSlider.syncVolume.downloadWithName.sendNotifyOnComplete.subtitlesMaxLength.highlightWords.subtitlesFontSize.subtitlesOpacity.subtitlesDownloadFormat.responseLanguage.defaultVolume.onlyBypassMediaCSP.newAudioPlayer.showPiPButton.translateAPIErrors.translationService.detectService.translationHotkey.m3u8ProxyHost.proxyWorkerHost.translateProxyEnabled.translateProxyEnabledDefault.audioBooster.useLivelyVoice.autoHideButtonDelay.useAudioDownload.compatVersion.localePhrases.localeLang.localeHash.localeUpdatedAt.localeLangOverride.account".split(".");
		var at = __webpack_require__("./node_modules/bowser/es5.js");
		let W = [
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
			"ja"
		], ot = [
			"ru",
			"en",
			"kk"
		], st = [
			"srt",
			"vtt",
			"json"
		], ct = navigator.language || navigator.userLanguage, lt = .66, ut = /(?:https?|www|\bhttp\s+)[^\s/]*?(?:\.\s*[a-z]{2,}|\/)\S*|#[^\s#]+|auto-generated\s+by\s+youtube|provided\s+to\s+youtube\s+by|released\s+on|paypal?|0x[\da-f]{40}|[13][1-9a-z]{25,34}|4[\dab][1-9a-z]{93}|t[1-9a-z]{33}/gi, dt = [
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
			"cs"
		], G = ct?.substring(0, 2).toLowerCase() || "en", ft = (() => ot.includes(G) ? G : dt.includes(G) ? "ru" : "en")(), K = at.getParser(window.navigator.userAgent).getResult(), pt = GM_info?.scriptHandler && !et.includes(GM_info.scriptHandler), mt = typeof GM < "u";
		function secsToStrTime(t) {
			let n = Math.floor(t / 60), i = Math.floor(t % 60), s = i / 60;
			return s >= lt && (n += 1, i = 0), n >= 60 ? J.get("translationTakeMoreThanHour") : n === 1 || n === 0 && i > 0 ? J.get("translationTakeAboutMinute") : n !== 11 && n % 10 == 1 ? J.get("translationTakeApproximatelyMinute2").replace("{0}", n) : ![
				12,
				13,
				14
			].includes(n) && [
				2,
				3,
				4
			].includes(n % 10) ? J.get("translationTakeApproximatelyMinute").replace("{0}", n) : J.get("translationTakeApproximatelyMinutes").replace("{0}", n);
		}
		function isPiPAvailable() {
			return "pictureInPictureEnabled" in document && document.pictureInPictureEnabled;
		}
		function initHls() {
			return typeof Hls < "u" && Hls?.isSupported() ? new Hls({
				debug: !1,
				lowLatencyMode: !0,
				backBufferLength: 90
			}) : void 0;
		}
		function cleanText(t, n) {
			return (t + " " + (n || "")).replace(ut, "").replace(/[^\p{L}]+/gu, " ").substring(0, 450).trim();
		}
		function downloadBlob(t, n) {
			let i = URL.createObjectURL(t), s = document.createElement("a");
			s.href = i, s.download = n, s.click(), URL.revokeObjectURL(i);
		}
		function clearFileName(t) {
			return t.trim().length === 0 ? new Date().toLocaleDateString("en-us").replaceAll("/", "-") : t.replace(/^https?:\/\//, "").replace(/[\\/:*?"'<>|.]/g, "-");
		}
		async function GM_fetch(t, n = {}) {
			let { timeout: i = 15e3,...s } = n, d = new AbortController();
			try {
				if (t.includes("api.browser.yandex.ru")) throw Error("Preventing yandex cors");
				return await fetch(t, {
					signal: d.signal,
					...s
				});
			} catch (n) {
				return U.log("GM_fetch preventing CORS by GM_xmlhttpRequest", n.message), new Promise((n, d) => {
					GM_xmlhttpRequest({
						method: s.method || "GET",
						url: t,
						responseType: "blob",
						data: s.body,
						timeout: i,
						headers: s.headers || {},
						onload: (t) => {
							let i = t.responseHeaders.split(/\r?\n/).reduce((t, n) => {
								let [, i, s] = n.match(/^([\w-]+): (.+)$/) || [];
								return i && (t[i] = s), t;
							}, {}), s = new Response(t.response, {
								status: t.status,
								headers: i
							});
							Object.defineProperty(s, "url", { value: t.finalUrl ?? "" }), n(s);
						},
						ontimeout: () => d(Error("Timeout")),
						onerror: (t) => d(Error(t)),
						onabort: () => d(Error("AbortError"))
					});
				});
			}
		}
		function utils_getTimestamp() {
			return Math.floor(Date.now() / 1e3);
		}
		function clamp(t, n = 0, i = 100) {
			return Math.min(Math.max(t, n), i);
		}
		function toFlatObj(t) {
			return Object.entries(t).reduce((n, [i, s]) => {
				if (s === void 0) return n;
				if (typeof s != "object") return n[i] = s, n;
				let d = Object.entries(toFlatObj(t[i])).reduce((t, [n, s]) => (t[`${i}.${n}`] = s, t), {});
				return {
					...n,
					...d
				};
			}, {});
		}
		async function exitFullscreen() {
			let t = document;
			(t.fullscreenElement || t.webkitFullscreenElement) && (t.webkitExitFullscreen && await t.webkitExitFullscreen(), t.exitFullscreen && await t.exitFullscreen());
		}
		let sleep = (t) => new Promise((n) => setTimeout(n, t));
		function timeout(t, n = "Operation timed out") {
			return new Promise((i, s) => {
				setTimeout(() => s(Error(n)), t);
			});
		}
		async function waitForCondition(t, n, i = !1) {
			let s = !1;
			return Promise.race([(async () => {
				for (; !t() && !s;) await sleep(100);
			})(), new Promise((t, d) => {
				window.setTimeout(() => {
					s = !0, i ? d(Error(`Wait for condition reached timeout of ${n}`)) : t();
				}, n);
			})]);
		}
		let ht = {
			numToBool: [
				["autoTranslate"],
				["dontTranslateYourLang", "enabledDontTranslateLanguages"],
				["autoSetVolumeYandexStyle", "enabledAutoVolume"],
				["showVideoSlider"],
				["syncVolume"],
				["downloadWithName"],
				["sendNotifyOnComplete"],
				["highlightWords"],
				["onlyBypassMediaCSP"],
				["newAudioPlayer"],
				["showPiPButton"],
				["translateAPIErrors"],
				["audioBooster"],
				["useNewModel", "useLivelyVoice"]
			],
			number: [["autoVolume"]],
			array: [["dontTranslateLanguage", "dontTranslateLanguages"]],
			string: [
				["hotkeyButton", "translationHotkey"],
				["locale-lang-override", "localeLangOverride"],
				["locale-lang", "localeLang"]
			]
		};
		function getCompatCategory(t, n, i) {
			if (typeof n == "number") return i?.number.some((n) => n[0] === t) ? "number" : "numToBool";
			if (Array.isArray(n)) return "array";
			if (typeof n == "string" || n === null) return "string";
		}
		function convertByCompatCategory(t, n) {
			return [
				"string",
				"array",
				"number"
			].includes(t) ? n : !!n;
		}
		async function updateConfig(t) {
			if (t.compatVersion === rt) return t;
			let n = Object.values(ht).flat().reduce((t, n) => (n[1] && (t[n[0]] = void 0), t), {}), i = await q.getValues(n), s = Object.fromEntries(Object.entries(i).filter(([t, n]) => n !== void 0)), d = {
				...t,
				...s
			}, f = Object.keys(d).reduce((t, n) => (t[n] = void 0, t), {}), p = await q.getValues(f), m = t;
			for (let [t, n] of Object.entries(d)) {
				let i = getCompatCategory(t, n, ht);
				if (!i) continue;
				let d = ht[i].find((n) => n[0] === t);
				if (!d) continue;
				let f = d[1] ?? t;
				if (p[t] === void 0) continue;
				let h = convertByCompatCategory(i, n);
				t === "autoVolume" && n < 1 && (h = Math.round(n * 100)), m[f] = h, s[t] !== void 0 && await q.delete(t), f === "localeLangOverride" && await J.changeLang(n), await q.set(f, h);
			}
			return {
				...m,
				compatVersion: "2025-05-09"
			};
		}
		let q = new class {
			supportGM;
			supportGMPromises;
			supportGMGetValues;
			constructor() {
				this.supportGM = typeof GM_getValue == "function", this.supportGMPromises = mt && typeof GM?.getValue == "function", this.supportGMGetValues = mt && typeof GM?.getValues == "function", U.log(`[VOT Storage] GM Promises: ${this.supportGMPromises} | GM: ${this.supportGM}`);
			}
			isSupportOnlyLS() {
				return !this.supportGM && !this.supportGMPromises;
			}
			syncGet(t, n) {
				if (this.supportGM) return GM_getValue(t, n);
				let i = (window.localStorage.getItem(t));
				if (!i) return n;
				try {
					return JSON.parse(i);
				} catch {
					return n;
				}
			}
			async get(t, n) {
				return this.supportGMPromises ? await GM.getValue(t, n) : Promise.resolve(this.syncGet(t, n));
			}
			async getValues(t) {
				return this.supportGMGetValues ? await GM.getValues(t) : Object.fromEntries(await Promise.all(Object.entries(t).map(async ([t, n]) => {
					let i = await this.get(t, n);
					return [t, i];
				})));
			}
			syncSet(t, n) {
				return this.supportGM ? GM_setValue(t, n) : window.localStorage.setItem(t, JSON.stringify(n));
			}
			async set(t, n) {
				return this.supportGMPromises ? await GM.setValue(t, n) : Promise.resolve(this.syncSet(t, n));
			}
			syncDelete(t) {
				return this.supportGM ? GM_deleteValue(t) : window.localStorage.removeItem(t);
			}
			async delete(t) {
				return this.supportGMPromises ? await GM.deleteValue(t) : Promise.resolve(this.syncDelete(t));
			}
			syncList() {
				return this.supportGM ? GM_listValues() : it;
			}
			async list() {
				return this.supportGMPromises ? await GM.listValues() : Promise.resolve(this.syncList());
			}
		}();
		class LocalizationProvider {
			storageKeys = [
				"localePhrases",
				"localeLang",
				"localeHash",
				"localeUpdatedAt",
				"localeLangOverride"
			];
			lang;
			locale;
			defaultLocale = toFlatObj(Le);
			cacheTTL = 7200;
			localizationUrl = `${qe}/dev/src/localization`;
			constructor() {
				this.lang = this.getLang(), this.locale = {}, this.setLocaleFromJsonString(q.syncGet("localePhrases", ""));
			}
			getLangOverride() {
				return q.syncGet("localeLangOverride", "auto");
			}
			getLang() {
				let t = this.getLangOverride();
				return t === "auto" ? G : t;
			}
			getAvailableLangs() {
				return "auto.en.ru.af.am.ar.az.bg.bn.bs.ca.cs.cy.da.de.el.es.et.eu.fa.fi.fr.gl.hi.hr.hu.hy.id.it.ja.jv.kk.km.kn.ko.lo.mk.ml.mn.ms.mt.my.ne.nl.pa.pl.pt.ro.si.sk.sl.sq.sr.su.sv.sw.tr.uk.ur.uz.vi.zh.zu".split(".");
			}
			reset() {
				for (let t of this.storageKeys) q.syncDelete(t);
				return this;
			}
			buildUrl(t, n = !1) {
				let i = n ? `?timestamp=${utils_getTimestamp()}` : "";
				return `${this.localizationUrl}${t}${i}`;
			}
			async changeLang(t) {
				let n = this.getLangOverride();
				return n === t ? !1 : (await q.set("localeLangOverride", t), this.lang = this.getLang(), await this.update(!0), !0);
			}
			async checkUpdates(t = !1) {
				U.log("Check locale updates...");
				try {
					let n = await GM_fetch(this.buildUrl("/hashes.json", t));
					if (!n.ok) throw n.status;
					let i = await n.json();
					return await q.get("localeHash") === i[this.lang] ? !1 : i[this.lang];
				} catch (t) {
					return console.error("[VOT] [localizationProvider] Failed to get locales hash:", t), !1;
				}
			}
			async update(t = !1) {
				let n = await q.get("localeUpdatedAt", 0);
				if (!t && n + this.cacheTTL > utils_getTimestamp() && await q.get("localeLang") === this.lang) return this;
				let i = await this.checkUpdates(t);
				if (await q.set("localeUpdatedAt", utils_getTimestamp()), !i) return this;
				U.log("Updating locale...");
				try {
					let n = await GM_fetch(this.buildUrl(`/locales/${this.lang}.json`, t));
					if (!n.ok) throw n.status;
					let s = await n.text();
					await q.set("localePhrases", s), await q.set("localeHash", i), await q.set("localeLang", this.lang), this.setLocaleFromJsonString(s);
				} catch (t) {
					console.error("[VOT] [localizationProvider] Failed to get locale:", t), this.setLocaleFromJsonString(await q.get("localePhrases", ""));
				}
				return this;
			}
			setLocaleFromJsonString(t) {
				try {
					let n = JSON.parse(t) || {};
					this.locale = toFlatObj(n);
				} catch (t) {
					console.error("[VOT] [localizationProvider]", t), this.locale = {};
				}
				return this;
			}
			getFromLocale(t, n) {
				return t?.[n] ?? this.warnMissingKey(t, n);
			}
			warnMissingKey(t, n) {
				console.warn("[VOT] [localizationProvider] locale", t, "doesn't contain key", n);
			}
			getDefault(t) {
				return this.getFromLocale(this.defaultLocale, t) ?? t;
			}
			get(t) {
				return this.getFromLocale(this.locale, t) ?? this.getDefault(t);
			}
		}
		let J = new LocalizationProvider();
		class VOTLocalizedError extends Error {
			constructor(t) {
				super(J.getDefault(t)), this.name = "VOTLocalizedError", this.unlocalizedMessage = t, this.localizedMessage = J.get(t);
			}
		}
		class VOTJSError extends Error {
			data;
			constructor(t, n = void 0) {
				super(t), this.data = n, this.name = "VOTJSError", this.message = t;
			}
		}
		class MinimalClient {
			host;
			schema;
			fetch;
			fetchOpts;
			sessions = {};
			userAgent = E.userAgent;
			headers = {
				"User-Agent": this.userAgent,
				Accept: "application/x-protobuf",
				"Accept-Language": "en",
				"Content-Type": "application/x-protobuf",
				Pragma: "no-cache",
				"Cache-Control": "no-cache"
			};
			hostSchemaRe = /(http(s)?):\/\//;
			constructor({ host: t = E.host, fetchFn: n = fetchWithTimeout, fetchOpts: i = {}, headers: s = {} } = {}) {
				let d = this.hostSchemaRe.exec(t)?.[1];
				this.host = d ? t.replace(`${d}://`, "") : t, this.schema = d ?? "https", this.fetch = n, this.fetchOpts = i, this.headers = {
					...this.headers,
					...s
				};
			}
			async request(t, n, i = {}, s = "POST") {
				let d = this.getOpts(new Blob([n]), i, s);
				try {
					let n = await this.fetch(`${this.schema}://${this.host}${t}`, d), i = await n.arrayBuffer();
					return {
						success: n.status === 200,
						data: i
					};
				} catch (t) {
					return {
						success: !1,
						data: t?.message
					};
				}
			}
			async requestJSON(t, n = null, i = {}, s = "POST") {
				let d = this.getOpts(n, {
					"Content-Type": "application/json",
					...i
				}, s);
				try {
					let n = await this.fetch(`${this.schema}://${this.host}${t}`, d), i = await n.json();
					return {
						success: n.status === 200,
						data: i
					};
				} catch (t) {
					return {
						success: !1,
						data: t?.message
					};
				}
			}
			getOpts(t, n = {}, i = "POST") {
				return {
					method: i,
					headers: {
						...this.headers,
						...n
					},
					body: t,
					...this.fetchOpts
				};
			}
			async getSession(t) {
				let n = getTimestamp(), i = this.sessions[t];
				if (i && i.timestamp + i.expires > n) return i;
				let { secretKey: s, expires: d, uuid: f } = await this.createSession(t);
				return this.sessions[t] = {
					secretKey: s,
					expires: d,
					timestamp: n,
					uuid: f
				}, this.sessions[t];
			}
			async createSession(t) {
				let n = getUUID(), i = YandexSessionProtobuf.encodeSessionRequest(n, t), s = await this.request("/session/create", i, { "Vtrans-Signature": await getSignature(i) });
				if (!s.success) throw new VOTJSError("Failed to request create session", s);
				let d = YandexSessionProtobuf.decodeSessionResponse(s.data);
				return {
					...d,
					uuid: n
				};
			}
		}
		class client_VOTClient extends MinimalClient {
			hostVOT;
			schemaVOT;
			apiToken;
			requestLang;
			responseLang;
			paths = {
				videoTranslation: "/video-translation/translate",
				videoTranslationFailAudio: "/video-translation/fail-audio-js",
				videoTranslationAudio: "/video-translation/audio",
				videoTranslationCache: "/video-translation/cache",
				videoSubtitles: "/video-subtitles/get-subtitles",
				streamPing: "/stream-translation/ping-stream",
				streamTranslation: "/stream-translation/translate-stream"
			};
			isCustomLink(t) {
				return !!(/\.(m3u8|m4(a|v)|mpd)/.exec(t) ?? /^https:\/\/cdn\.qstv\.on\.epicgames\.com/.exec(t));
			}
			headersVOT = {
				"User-Agent": `vot.js/${E.version}`,
				"Content-Type": "application/json",
				Pragma: "no-cache",
				"Cache-Control": "no-cache"
			};
			constructor({ host: t, hostVOT: n = E.hostVOT, fetchFn: i, fetchOpts: s, requestLang: d = "en", responseLang: f = "ru", apiToken: p, headers: m } = {}) {
				super({
					host: t,
					fetchFn: i,
					fetchOpts: s,
					headers: m
				});
				let h = this.hostSchemaRe.exec(n)?.[1];
				this.hostVOT = h ? n.replace(`${h}://`, "") : n, this.schemaVOT = h ?? "https", this.requestLang = d, this.responseLang = f, this.apiToken = p;
			}
			get apiTokenHeader() {
				return this.apiToken ? { Authorization: `OAuth ${this.apiToken}` } : {};
			}
			async requestVOT(t, n, i = {}) {
				let s = this.getOpts(JSON.stringify(n), {
					...this.headersVOT,
					...i
				});
				try {
					let n = await this.fetch(`${this.schemaVOT}://${this.hostVOT}${t}`, s), i = await n.json();
					return {
						success: n.status === 200,
						data: i
					};
				} catch (t) {
					return {
						success: !1,
						data: t?.message
					};
				}
			}
			async translateVideoYAImpl({ videoData: t, requestLang: n = this.requestLang, responseLang: i = this.responseLang, translationHelp: s = null, headers: d = {}, extraOpts: f = {}, shouldSendFailedAudio: p = !0 }) {
				let { url: m, duration: h = E.defaultDuration } = t, g = await this.getSession("video-translation"), _ = YandexVOTProtobuf.encodeTranslationRequest(m, h, n, i, s, f), v = this.paths.videoTranslation, b = await getSecYaHeaders("Vtrans", g, _, v), x = f.useLivelyVoice ? this.apiTokenHeader : {}, C = await this.request(v, _, {
					...b,
					...x,
					...d
				});
				if (!C.success) throw new VOTLocalizedError("requestTranslationFailed");
				let w = YandexVOTProtobuf.decodeTranslationResponse(C.data);
				Logger.log("translateVideo", w);
				let { status: ee, translationId: te } = w;
				switch (ee) {
					case j.FAILED: throw w?.message ? new VOTJSError("Yandex couldn't translate video", w) : new VOTLocalizedError("requestTranslationFailed");
					case j.FINISHED:
					case j.PART_CONTENT:
						if (!w.url) throw new VOTLocalizedError("audioNotReceived");
						return {
							translationId: te,
							translated: !0,
							url: w.url,
							status: ee,
							remainingTime: w.remainingTime ?? -1
						};
					case j.WAITING:
					case j.LONG_WAITING: return {
						translationId: te,
						translated: !1,
						status: ee,
						remainingTime: w.remainingTime
					};
					case j.AUDIO_REQUESTED: return m.startsWith("https://youtu.be/") && p ? (await this.requestVtransFailAudio(m), await this.requestVtransAudio(m, w.translationId, {
						audioFile: new Uint8Array(),
						fileId: Ie.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME
					}), await this.translateVideoYAImpl({
						videoData: t,
						requestLang: n,
						responseLang: i,
						translationHelp: s,
						headers: d,
						shouldSendFailedAudio: !1
					})) : {
						translationId: te,
						translated: !1,
						status: ee,
						remainingTime: w.remainingTime ?? -1
					};
					case j.SESSION_REQUIRED: throw new VOTJSError("Yandex auth required to translate video. See docs for more info", w);
					default: throw Logger.error("Unknown response", w), new VOTJSError("Unknown response from Yandex", w);
				}
			}
			async translateVideoVOTImpl({ url: t, videoId: n, service: i, requestLang: s = this.requestLang, responseLang: d = this.responseLang, headers: f = {} }) {
				let p = convertVOT(i, n, t), m = await this.requestVOT(this.paths.videoTranslation, {
					provider: "yandex",
					service: p.service,
					video_id: p.videoId,
					from_lang: s,
					to_lang: d,
					raw_video: t
				}, { ...f });
				if (!m.success) throw new VOTLocalizedError("requestTranslationFailed");
				let h = m.data;
				switch (h.status) {
					case "failed": throw new VOTJSError("Yandex couldn't translate video", h);
					case "success":
						if (!h.translated_url) throw new VOTLocalizedError("audioNotReceived");
						return {
							translationId: String(h.id),
							translated: !0,
							url: h.translated_url,
							status: 1,
							remainingTime: -1
						};
					case "waiting": return {
						translationId: "",
						translated: !1,
						remainingTime: h.remaining_time,
						status: 2,
						message: h.message
					};
				}
			}
			async requestVtransFailAudio(t) {
				let n = await this.requestJSON(this.paths.videoTranslationFailAudio, JSON.stringify({ video_url: t }), void 0, "PUT");
				if (!n.data || typeof n.data == "string" || n.data.status !== 1) throw new VOTJSError("Failed to request to fake video translation fail audio js", n);
				return n;
			}
			async requestVtransAudio(t, n, i, s, d = {}) {
				let f = await this.getSession("video-translation"), p = YandexVOTProtobuf.isPartialAudioBuffer(i) ? YandexVOTProtobuf.encodeTranslationAudioRequest(t, n, i, s) : YandexVOTProtobuf.encodeTranslationAudioRequest(t, n, i, void 0), m = this.paths.videoTranslationAudio, h = await getSecYaHeaders("Vtrans", f, p, m), g = await this.request(m, p, {
					...h,
					...d
				}, "PUT");
				if (!g.success) throw new VOTJSError("Failed to request video translation audio", g);
				return YandexVOTProtobuf.decodeTranslationAudioResponse(g.data);
			}
			async translateVideoCache({ videoData: t, requestLang: n = this.requestLang, responseLang: i = this.responseLang, headers: s = {} }) {
				let { url: d, duration: f = E.defaultDuration } = t, p = await this.getSession("video-translation"), m = YandexVOTProtobuf.encodeTranslationCacheRequest(d, f, n, i), h = this.paths.videoTranslationCache, g = await getSecYaHeaders("Vtrans", p, m, h), _ = await this.request(h, m, {
					...g,
					...s
				}, "POST");
				if (!_.success) throw new VOTJSError("Failed to request video translation cache", _);
				return YandexVOTProtobuf.decodeTranslationCacheResponse(_.data);
			}
			async translateVideo({ videoData: t, requestLang: n = this.requestLang, responseLang: i = this.responseLang, translationHelp: s = null, headers: d = {}, extraOpts: f = {}, shouldSendFailedAudio: p = !0 }) {
				let { url: m, videoId: h, host: g } = t;
				return this.isCustomLink(m) ? await this.translateVideoVOTImpl({
					url: m,
					videoId: h,
					service: g,
					requestLang: n,
					responseLang: i,
					headers: d
				}) : await this.translateVideoYAImpl({
					videoData: t,
					requestLang: n,
					responseLang: i,
					translationHelp: s,
					headers: d,
					extraOpts: f,
					shouldSendFailedAudio: p
				});
			}
			async getSubtitlesYAImpl({ videoData: t, requestLang: n = this.requestLang, headers: i = {} }) {
				let { url: s } = t, d = await this.getSession("video-translation"), f = YandexVOTProtobuf.encodeSubtitlesRequest(s, n), p = this.paths.videoSubtitles, m = await getSecYaHeaders("Vsubs", d, f, p), h = await this.request(p, f, {
					...m,
					...i
				});
				if (!h.success) throw new VOTJSError("Failed to request video subtitles", h);
				let g = YandexVOTProtobuf.decodeSubtitlesResponse(h.data), _ = g.subtitles.map((t) => {
					let { language: n, url: i, translatedLanguage: s, translatedUrl: d } = t;
					return {
						language: n,
						url: i,
						translatedLanguage: s,
						translatedUrl: d
					};
				});
				return {
					waiting: g.waiting,
					subtitles: _
				};
			}
			async getSubtitlesVOTImpl({ url: t, videoId: n, service: i, headers: s = {} }) {
				let d = convertVOT(i, n, t), f = await this.requestVOT(this.paths.videoSubtitles, {
					provider: "yandex",
					service: d.service,
					video_id: d.videoId
				}, s);
				if (!f.success) throw new VOTJSError("Failed to request video subtitles", f);
				let p = f.data, m = p.reduce((t, n) => {
					if (!n.lang_from) return t;
					let i = p.find((t) => t.lang === n.lang_from);
					return i && t.push({
						language: i.lang,
						url: i.subtitle_url,
						translatedLanguage: n.lang,
						translatedUrl: n.subtitle_url
					}), t;
				}, []);
				return {
					waiting: !1,
					subtitles: m
				};
			}
			async getSubtitles({ videoData: t, requestLang: n = this.requestLang, headers: i = {} }) {
				let { url: s, videoId: d, host: f } = t;
				return this.isCustomLink(s) ? await this.getSubtitlesVOTImpl({
					url: s,
					videoId: d,
					service: f,
					headers: i
				}) : await this.getSubtitlesYAImpl({
					videoData: t,
					requestLang: n,
					headers: i
				});
			}
			async pingStream({ pingId: t, headers: n = {} }) {
				let i = await this.getSession("video-translation"), s = YandexVOTProtobuf.encodeStreamPingRequest(t), d = this.paths.streamPing, f = await getSecYaHeaders("Vtrans", i, s, d), p = await this.request(d, s, {
					...f,
					...n
				});
				if (!p.success) throw new VOTJSError("Failed to request stream ping", p);
				return !0;
			}
			async translateStream({ videoData: t, requestLang: n = this.requestLang, responseLang: i = this.responseLang, headers: s = {} }) {
				let { url: d } = t;
				if (this.isCustomLink(d)) throw new VOTLocalizedError("VOTStreamNotSupportedUrl");
				let f = await this.getSession("video-translation"), p = YandexVOTProtobuf.encodeStreamRequest(d, n, i), m = this.paths.streamTranslation, h = await getSecYaHeaders("Vtrans", f, p, m), g = await this.request(m, p, {
					...h,
					...s
				});
				if (!g.success) throw new VOTJSError("Failed to request stream translation", g);
				let _ = YandexVOTProtobuf.decodeStreamResponse(g.data), v = _.interval;
				switch (v) {
					case O.NO_CONNECTION:
					case O.TRANSLATING: return {
						translated: !1,
						interval: v,
						message: v === O.NO_CONNECTION ? "streamNoConnectionToServer" : "translationTakeFewMinutes"
					};
					case O.STREAMING: return {
						translated: !0,
						interval: v,
						pingId: _.pingId,
						result: _.translatedInfo
					};
					default: throw Logger.error("Unknown response", _), new VOTJSError("Unknown response from Yandex", _);
				}
			}
		}
		class client_VOTWorkerClient extends client_VOTClient {
			constructor(t = {}) {
				t.host = t.host ?? E.hostWorker, super(t);
			}
			async request(t, n, i = {}, s = "POST") {
				let d = this.getOpts(JSON.stringify({
					headers: {
						...this.headers,
						...i
					},
					body: Array.from(n)
				}), { "Content-Type": "application/json" }, s);
				try {
					let n = await this.fetch(`${this.schema}://${this.host}${t}`, d), i = await n.arrayBuffer();
					return {
						success: n.status === 200,
						data: i
					};
				} catch (t) {
					return {
						success: !1,
						data: t?.message
					};
				}
			}
			async requestJSON(t, n = null, i = {}, s = "POST") {
				let d = this.getOpts(JSON.stringify({
					headers: {
						...this.headers,
						"Content-Type": "application/json",
						Accept: "application/json",
						...i
					},
					body: n
				}), {
					Accept: "application/json",
					"Content-Type": "application/json"
				}, s);
				try {
					let n = await this.fetch(`${this.schema}://${this.host}${t}`, d), i = await n.json();
					return {
						success: n.status === 200,
						data: i
					};
				} catch (t) {
					return {
						success: !1,
						data: t?.message
					};
				}
			}
		}
		class VOTClient extends client_VOTClient {
			constructor(t) {
				super(t), this.headers = {
					...Pe,
					...this.headers
				};
			}
		}
		class VOTWorkerClient extends client_VOTWorkerClient {
			constructor(t) {
				super(t), this.headers = {
					...Pe,
					...this.headers
				};
			}
		}
		class VideoDataError extends Error {
			constructor(t) {
				super(t), this.name = "VideoDataError", this.message = t;
			}
		}
		let gt = /(file:\/\/(\/)?|(http(s)?:\/\/)(127\.0\.0\.1|localhost|192\.168\.(\d){1,3}\.(\d){1,3}))/, _t = [
			"yewtu.be",
			"yt.artemislena.eu",
			"invidious.flokinet.to",
			"iv.melmac.space",
			"inv.nadeko.net",
			"inv.tux.pizza",
			"invidious.private.coffee",
			"yt.drgnz.club",
			"vid.puffyan.us",
			"invidious.dhusch.de"
		], vt = "piped.video,piped.tokhmi.xyz,piped.moomoo.me,piped.syncpundit.io,piped.mha.fi,watch.whatever.social,piped.garudalinux.org,efy.piped.pages.dev,watch.leptons.xyz,piped.lunar.icu,yt.dc09.ru,piped.mint.lgbt,il.ax,piped.privacy.com.de,piped.esmailelbob.xyz,piped.projectsegfau.lt,piped.in.projectsegfau.lt,piped.us.projectsegfau.lt,piped.privacydev.net,piped.palveluntarjoaja.eu,piped.smnz.de,piped.adminforge.de,piped.qdi.fi,piped.hostux.net,piped.chauvet.pro,piped.jotoma.de,piped.pfcd.me,piped.frontendfriendly.xyz".split(","), yt = [
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
			"proxitok.privacy.com.de"
		], bt = [
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
			"makertube.net"
		], xt = [
			"poketube.fun",
			"pt.sudovanilla.org",
			"poke.ggtyler.dev",
			"poke.uk2.littlekai.co.uk",
			"poke.blahai.gay"
		], St = ["ricktube.ru"], Ct = null, wt = ["coursehunter.net", "coursetrain.net"];
		var Y;
		(function(t) {
			t.udemy = "udemy", t.coursera = "coursera", t.douyin = "douyin", t.artstation = "artstation", t.kickstarter = "kickstarter";
		})(Y ||= {});
		let Tt = {
			...F,
			...Y
		}, Et = [
			{
				additionalData: "mobile",
				host: F.youtube,
				url: "https://youtu.be/",
				match: /^m.youtube.com$/,
				selector: ".player-container",
				needExtraData: !0
			},
			{
				host: F.youtube,
				url: "https://youtu.be/",
				match: /^(www.)?youtube(-nocookie|kids)?.com$/,
				selector: ".html5-video-container:not(#inline-player *)",
				needExtraData: !0
			},
			{
				host: F.invidious,
				url: "https://youtu.be/",
				match: _t,
				selector: "#player",
				needBypassCSP: !0
			},
			{
				host: F.piped,
				url: "https://youtu.be/",
				match: vt,
				selector: ".shaka-video-container",
				needBypassCSP: !0
			},
			{
				host: F.poketube,
				url: "https://youtu.be/",
				match: xt,
				selector: ".video-player-container"
			},
			{
				host: F.ricktube,
				url: "https://youtu.be/",
				match: St,
				selector: "#oframeplayer > pjsdiv:has(video)"
			},
			{
				additionalData: "mobile",
				host: F.vk,
				url: "https://vk.com/video?z=",
				match: [/^m.vk.(com|ru)$/, /^m.vkvideo.ru$/],
				selector: "vk-video-player",
				shadowRoot: !0,
				needExtraData: !0
			},
			{
				additionalData: "clips",
				host: F.vk,
				url: "https://vk.com/video?z=",
				match: /^(www.|m.)?vk.(com|ru)$/,
				selector: "div[data-testid=\"clipcontainer-video\"]",
				needExtraData: !0
			},
			{
				host: F.vk,
				url: "https://vk.com/video?z=",
				match: [/^(www.|m.)?vk.(com|ru)$/, /^(www.|m.)?vkvideo.ru$/],
				selector: ".videoplayer_media",
				needExtraData: !0
			},
			{
				host: F.nine_gag,
				url: "https://9gag.com/gag/",
				match: /^9gag.com$/,
				selector: ".video-post"
			},
			{
				host: F.twitch,
				url: "https://twitch.tv/",
				match: [
					/^m.twitch.tv$/,
					/^(www.)?twitch.tv$/,
					/^clips.twitch.tv$/,
					/^player.twitch.tv$/
				],
				needExtraData: !0,
				selector: ".video-ref, main > div > section > div > div > div"
			},
			{
				host: F.proxitok,
				url: "https://www.tiktok.com/",
				match: yt,
				selector: ".column.has-text-centered"
			},
			{
				host: F.tiktok,
				url: "https://www.tiktok.com/",
				match: /^(www.)?tiktok.com$/,
				selector: null
			},
			{
				host: Y.douyin,
				url: "https://www.douyin.com/",
				match: /^(www.)?douyin.com/,
				selector: ".xg-video-container",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: F.vimeo,
				url: "https://vimeo.com/",
				match: /^vimeo.com$/,
				needExtraData: !0,
				selector: ".player"
			},
			{
				host: F.vimeo,
				url: "https://player.vimeo.com/",
				match: /^player.vimeo.com$/,
				additionalData: "embed",
				needExtraData: !0,
				needBypassCSP: !0,
				selector: ".player"
			},
			{
				host: F.xvideos,
				url: "https://www.xvideos.com/",
				match: [
					/^(www.)?xvideos(-ar)?.com$/,
					/^(www.)?xvideos(\d\d\d).com$/,
					/^(www.)?xv-ru.com$/
				],
				selector: "#hlsplayer",
				needBypassCSP: !0
			},
			{
				host: F.pornhub,
				url: "https://rt.pornhub.com/view_video.php?viewkey=",
				match: /^[a-z]+.pornhub.(com|org)$/,
				selector: ".mainPlayerDiv > .video-element-wrapper-js > div",
				eventSelector: ".mgp_eventCatcher"
			},
			{
				additionalData: "embed",
				host: F.pornhub,
				url: "https://rt.pornhub.com/view_video.php?viewkey=",
				match: (t) => /^[a-z]+.pornhub.(com|org)$/.exec(t.host) && t.pathname.startsWith("/embed/"),
				selector: "#player"
			},
			{
				host: F.twitter,
				url: "https://twitter.com/i/status/",
				match: /^(twitter|x).com$/,
				selector: "div[data-testid=\"videoComponent\"] > div:nth-child(1) > div",
				eventSelector: "div[data-testid=\"videoPlayer\"]",
				needBypassCSP: !0
			},
			{
				host: F.rumble,
				url: "https://rumble.com/",
				match: /^rumble.com$/,
				selector: "#videoPlayer > .videoPlayer-Rumble-cls > div"
			},
			{
				host: F.facebook,
				url: "https://facebook.com/",
				match: (t) => t.host.includes("facebook.com") && t.pathname.includes("/videos/"),
				selector: "div[role=\"main\"] div[data-pagelet$=\"video\" i]",
				needBypassCSP: !0
			},
			{
				additionalData: "reels",
				host: F.facebook,
				url: "https://facebook.com/",
				match: (t) => t.host.includes("facebook.com") && t.pathname.includes("/reel/"),
				selector: "div[role=\"main\"]",
				needBypassCSP: !0
			},
			{
				host: F.rutube,
				url: "https://rutube.ru/video/",
				match: /^rutube.ru$/,
				selector: ".video-player > div > div > div:nth-child(2)"
			},
			{
				additionalData: "embed",
				host: F.rutube,
				url: "https://rutube.ru/video/",
				match: /^rutube.ru$/,
				selector: "#app > div > div"
			},
			{
				host: F.bilibili,
				url: "https://www.bilibili.com/",
				match: /^(www|m|player).bilibili.com$/,
				selector: ".bpx-player-video-wrap"
			},
			{
				additionalData: "old",
				host: F.bilibili,
				url: "https://www.bilibili.com/",
				match: /^(www|m).bilibili.com$/,
				selector: null
			},
			{
				host: F.mailru,
				url: "https://my.mail.ru/",
				match: /^my.mail.ru$/,
				selector: "#b-video-wrapper"
			},
			{
				host: F.bitchute,
				url: "https://www.bitchute.com/video/",
				match: /^(www.)?bitchute.com$/,
				selector: ".video-js"
			},
			{
				host: F.eporner,
				url: "https://www.eporner.com/",
				match: /^(www.)?eporner.com$/,
				selector: ".vjs-v7"
			},
			{
				host: F.peertube,
				url: "stub",
				match: bt,
				selector: ".vjs-v7"
			},
			{
				host: F.dailymotion,
				url: "https://dai.ly/",
				match: /^geo([\d]+)?.dailymotion.com$/,
				selector: ".player"
			},
			{
				host: F.trovo,
				url: "https://trovo.live/s/",
				match: /^trovo.live$/,
				selector: ".player-video"
			},
			{
				host: F.yandexdisk,
				url: "https://yadi.sk/",
				match: /^disk.yandex.(ru|kz|com(\.(am|ge|tr))?|by|az|co\.il|ee|lt|lv|md|net|tj|tm|uz)$/,
				selector: ".video-player__player > div:nth-child(1)",
				eventSelector: ".video-player__player",
				needBypassCSP: !0,
				needExtraData: !0
			},
			{
				host: F.okru,
				url: "https://ok.ru/video/",
				match: /^ok.ru$/,
				selector: "vk-video-player",
				shadowRoot: !0
			},
			{
				host: F.googledrive,
				url: "https://drive.google.com/file/d/",
				match: /^youtube.googleapis.com$/,
				selector: ".html5-video-container"
			},
			{
				host: F.bannedvideo,
				url: "https://madmaxworld.tv/watch?id=",
				match: /^(www.)?banned.video|madmaxworld.tv$/,
				selector: ".vjs-v7",
				needExtraData: !0
			},
			{
				host: F.weverse,
				url: "https://weverse.io/",
				match: /^weverse.io$/,
				selector: ".webplayer-internal-source-wrapper",
				needExtraData: !0
			},
			{
				host: F.newgrounds,
				url: "https://www.newgrounds.com/",
				match: /^(www.)?newgrounds.com$/,
				selector: ".ng-video-player"
			},
			{
				host: F.egghead,
				url: "https://egghead.io/",
				match: /^egghead.io$/,
				selector: ".cueplayer-react-video-holder"
			},
			{
				host: F.youku,
				url: "https://v.youku.com/",
				match: /^v.youku.com$/,
				selector: "#ykPlayer"
			},
			{
				host: F.archive,
				url: "https://archive.org/details/",
				match: /^archive.org$/,
				selector: ".jw-media"
			},
			{
				host: F.kodik,
				url: "stub",
				match: /^kodik.(info|biz|cc)$/,
				selector: ".fp-player",
				needExtraData: !0
			},
			{
				host: F.patreon,
				url: "stub",
				match: /^(www.)?patreon.com$/,
				selector: "div[data-tag=\"post-card\"] div[elevation=\"subtle\"] > div > div > div > div",
				needExtraData: !0
			},
			{
				additionalData: "old",
				host: F.reddit,
				url: "stub",
				match: /^old.reddit.com$/,
				selector: ".reddit-video-player-root",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: F.reddit,
				url: "stub",
				match: /^(www.|new.)?reddit.com$/,
				selector: "div[slot=post-media-container]",
				shadowRoot: !0,
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: F.kick,
				url: "https://kick.com/",
				match: /^kick.com$/,
				selector: "#injected-embedded-channel-player-video > div",
				needExtraData: !0
			},
			{
				host: F.appledeveloper,
				url: "https://developer.apple.com/",
				match: /^developer.apple.com$/,
				selector: ".developer-video-player",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: F.epicgames,
				url: "https://dev.epicgames.com/community/learning/",
				match: /^dev.epicgames.com$/,
				selector: ".vjs-v7",
				needExtraData: !0
			},
			{
				host: F.odysee,
				url: "stub",
				match: /^odysee.com$/,
				selector: ".vjs-v7",
				needExtraData: !0
			},
			{
				host: F.coursehunterLike,
				url: "stub",
				match: wt,
				selector: "#oframeplayer > pjsdiv:has(video)",
				needExtraData: !0
			},
			{
				host: F.sap,
				url: "https://learning.sap.com/courses/",
				match: /^learning.sap.com$/,
				selector: ".playkit-container",
				eventSelector: ".playkit-player",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: Y.udemy,
				url: "https://www.udemy.com/",
				match: /udemy.com$/,
				selector: "div[data-purpose=\"curriculum-item-viewer-content\"] > section > div > div > div > div:nth-of-type(2)",
				needExtraData: !0
			},
			{
				host: Y.coursera,
				url: "https://www.coursera.org/",
				match: /coursera.org$/,
				selector: ".vjs-v8",
				needExtraData: !0
			},
			{
				host: F.watchpornto,
				url: "https://watchporn.to/",
				match: /^watchporn.to$/,
				selector: ".fp-player"
			},
			{
				host: F.linkedin,
				url: "https://www.linkedin.com/learning/",
				match: /^(www.)?linkedin.com$/,
				selector: ".vjs-v7",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: F.incestflix,
				url: "https://www.incestflix.net/watch/",
				match: /^(www.)?incestflix.(net|to|com)$/,
				selector: "#incflix-stream",
				needExtraData: !0
			},
			{
				host: F.porntn,
				url: "https://porntn.com/videos/",
				match: /^porntn.com$/,
				selector: ".fp-player",
				needExtraData: !0
			},
			{
				host: F.dzen,
				url: "https://dzen.ru/video/watch/",
				match: /^dzen.ru$/,
				selector: ".zen-ui-video-video-player"
			},
			{
				host: F.cloudflarestream,
				url: "stub",
				match: /^(watch|embed|iframe|customer-[^.]+).cloudflarestream.com$/,
				selector: null
			},
			{
				host: F.loom,
				url: "https://www.loom.com/share/",
				match: /^(www.)?loom.com$/,
				selector: ".VideoLayersContainer",
				needExtraData: !0,
				needBypassCSP: !0
			},
			{
				host: Y.artstation,
				url: "https://www.artstation.com/learning/",
				match: /^(www.)?artstation.com$/,
				selector: ".vjs-v7",
				needExtraData: !0
			},
			{
				host: F.rtnews,
				url: "https://www.rt.com/",
				match: /^(www.)?rt.com$/,
				selector: ".jw-media",
				needExtraData: !0
			},
			{
				host: F.bitview,
				url: "https://www.bitview.net/watch?v=",
				match: /^(www.)?bitview.net$/,
				selector: ".vlScreen",
				needExtraData: !0
			},
			{
				host: Y.kickstarter,
				url: "https://www.kickstarter.com/",
				match: /^(www.)?kickstarter.com/,
				selector: ".ksr-video-player",
				needExtraData: !0
			},
			{
				host: F.thisvid,
				url: "https://thisvid.com/",
				match: /^(www.)?thisvid.com$/,
				selector: ".fp-player"
			},
			{
				additionalData: "regional",
				host: F.ign,
				url: "https://de.ign.com/",
				match: /^(\w{2}.)?ign.com$/,
				needExtraData: !0,
				selector: ".video-container"
			},
			{
				host: F.ign,
				url: "https://www.ign.com/",
				match: /^(www.)?ign.com$/,
				selector: ".player",
				needExtraData: !0
			},
			{
				host: F.bunkr,
				url: "https://bunkr.site/",
				match: /^bunkr.(site|black|cat|media|red|site|ws|org|s[kiu]|c[ir]|fi|p[hks]|ru|la|is|to|a[cx])$/,
				needExtraData: !0,
				selector: ".plyr__video-wrapper"
			},
			{
				host: F.imdb,
				url: "https://www.imdb.com/video/",
				match: /^(www.)?imdb.com$/,
				selector: ".jw-media"
			},
			{
				host: F.telegram,
				url: "https://t.me/",
				match: (t) => /^web.telegram.org$/.test(t.hostname) && t.pathname.startsWith("/k"),
				selector: ".ckin__player"
			},
			{
				host: F.custom,
				url: "stub",
				match: (t) => /([^.]+).(mp4|webm)/.test(t.pathname),
				rawResult: !0
			}
		];
		class VideoHelperError extends Error {
			constructor(t) {
				super(t), this.name = "VideoHelper", this.message = t;
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
			constructor({ fetchFn: t = fetchWithTimeout, extraInfo: n = !0, referer: i = document.referrer ?? window.location.origin + "/", origin: s = window.location.origin, service: d, video: f, language: p = "en" } = {}) {
				this.fetch = t, this.extraInfo = n, this.referer = i, this.origin = /^(http(s)?):\/\//.test(String(s)) ? s : window.location.origin, this.service = d, this.video = f, this.language = p;
			}
			async getVideoData(t) {}
			async getVideoId(t) {}
			returnBaseData(t) {
				if (this.service) return {
					url: this.service.url + t,
					videoId: t,
					host: this.service.host,
					duration: void 0
				};
			}
		}
		class MailRuHelper extends BaseHelper {
			API_ORIGIN = "https://my.mail.ru";
			async getVideoMeta(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/+/video/meta/${t}?xemail=&ajax_call=1&func_name=&mna=&mnb=&ext=1&_=${new Date().getTime()}`);
					return await n.json();
				} catch (t) {
					Logger.error("Failed to get mail.ru video data", t.message);
					return;
				}
			}
			async getVideoId(t) {
				let n = t.pathname;
				if (/\/(v|mail|bk|inbox)\//.exec(n)) return n.slice(1);
				let i = /video\/embed\/([^/]+)/.exec(n)?.[1];
				if (!i) return;
				let s = await this.getVideoMeta(i);
				if (s) return s.meta.url.replace("//my.mail.ru/", "");
			}
		}
		class WeverseHelper extends BaseHelper {
			API_ORIGIN = "https://global.apis.naver.com/weverse/wevweb";
			API_APP_ID = "be4d79eb8fc7bd008ee82c8ec4ff6fd4";
			API_HMAC_KEY = "1b9cb6378d959b45714bec49971ade22e6e24e42";
			HEADERS = {
				Accept: "application/json, text/plain, */*",
				Origin: "https://weverse.io",
				Referer: "https://weverse.io/"
			};
			getURLData() {
				return {
					appId: this.API_APP_ID,
					language: "en",
					os: "WEB",
					platform: "WEB",
					wpf: "pc"
				};
			}
			async createHash(t) {
				let n = Date.now(), i = t.substring(0, Math.min(255, t.length)) + n, s = await getHmacSha1(this.API_HMAC_KEY, i);
				if (!s) throw new VideoHelperError("Failed to get weverse HMAC signature");
				return {
					wmsgpad: n.toString(),
					wmd: s
				};
			}
			async getHashURLParams(t) {
				let n = await this.createHash(t);
				return new URLSearchParams(n).toString();
			}
			async getPostPreview(t) {
				let n = `/post/v1.0/post-${t}/preview?` + new URLSearchParams({
					fieldSet: "postForPreview",
					...this.getURLData()
				}).toString();
				try {
					let t = await this.getHashURLParams(n), i = await this.fetch(this.API_ORIGIN + n + "&" + t, { headers: this.HEADERS });
					return await i.json();
				} catch (n) {
					return Logger.error(`Failed to get weverse post preview by postId: ${t}`, n.message), !1;
				}
			}
			async getVideoInKey(t) {
				let n = `/video/v1.1/vod/${t}/inKey?` + new URLSearchParams({
					gcc: "RU",
					...this.getURLData()
				}).toString();
				try {
					let t = await this.getHashURLParams(n), i = await this.fetch(this.API_ORIGIN + n + "&" + t, {
						method: "POST",
						headers: this.HEADERS
					});
					return await i.json();
				} catch (n) {
					return Logger.error(`Failed to get weverse InKey by videoId: ${t}`, n.message), !1;
				}
			}
			async getVideoInfo(t, n, i) {
				let s = Date.now();
				try {
					let d = new URLSearchParams({
						key: n,
						sid: i,
						nonce: s.toString(),
						devt: "html5_pc",
						prv: "N",
						aup: "N",
						stpb: "N",
						cpl: "en",
						env: "prod",
						lc: "en",
						adi: JSON.stringify([{ adSystem: null }]),
						adu: "/"
					}).toString(), f = await this.fetch(`https://global.apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/${t}?` + d, { headers: this.HEADERS });
					return await f.json();
				} catch (s) {
					return Logger.error(`Failed to get weverse video info (infraVideoId: ${t}, inkey: ${n}, serviceId: ${i}`, s.message), !1;
				}
			}
			extractVideoInfo(t) {
				return t.find((t) => t.useP2P === !1 && t.source.includes(".mp4"));
			}
			async getVideoData(t) {
				let n = await this.getPostPreview(t);
				if (!n) return;
				let { videoId: i, serviceId: s, infraVideoId: d } = n.extension.video;
				if (!(i && s && d)) return;
				let f = await this.getVideoInKey(i);
				if (!f) return;
				let p = await this.getVideoInfo(d, f.inKey, s);
				if (!p) return;
				let m = this.extractVideoInfo(p.videos.list);
				if (m) return {
					url: m.source,
					duration: m.duration
				};
			}
			async getVideoId(t) {
				return /([^/]+)\/(live|media)\/([^/]+)/.exec(t.pathname)?.[3];
			}
		}
		class KodikHelper extends BaseHelper {
			API_ORIGIN = window.location.origin;
			getSecureData(t) {
				try {
					let [n, i, s] = t.split("/").filter((t) => t), d = Array.from(document.getElementsByTagName("script")), f = d.filter((t) => t.innerHTML.includes(`videoId = "${i}"`) || t.innerHTML.includes(`serialId = Number(${i})`));
					if (!f.length) throw new VideoHelperError("Failed to find secure script");
					let p = /'{[^']+}'/.exec(f[0].textContent.trim())?.[0];
					if (!p) throw new VideoHelperError("Secure json wasn't found in secure script");
					let m = JSON.parse(p.replaceAll("'", ""));
					if (n !== "serial") return {
						videoType: n,
						videoId: i,
						hash: s,
						...m
					};
					let h = d.filter((t) => t.innerHTML.includes("var videoInfo = {}"))?.[0]?.textContent?.trim();
					if (!h) throw new VideoHelperError("Failed to find videoInfo content");
					let g = /videoInfo\.type\s+?=\s+?'([^']+)'/.exec(h)?.[1], _ = /videoInfo\.id\s+?=\s+?'([^']+)'/.exec(h)?.[1], v = /videoInfo\.hash\s+?=\s+?'([^']+)'/.exec(h)?.[1];
					if (!g || !_ || !v) throw new VideoHelperError("Failed to parse videoInfo content");
					return {
						videoType: g,
						videoId: _,
						hash: v,
						...m
					};
				} catch (n) {
					return Logger.error(`Failed to get kodik secure data by videoPath: ${t}.`, n.message), !1;
				}
			}
			async getFtor(t) {
				let { videoType: n, videoId: i, hash: s, d, d_sign: f, pd: p, pd_sign: m, ref: h, ref_sign: g } = t;
				try {
					let t = await this.fetch(this.API_ORIGIN + "/ftor", {
						method: "POST",
						headers: {
							"User-Agent": E.userAgent,
							Origin: this.API_ORIGIN,
							Referer: `${this.API_ORIGIN}/${n}/${i}/${s}/360p`
						},
						body: new URLSearchParams({
							d,
							d_sign: f,
							pd: p,
							pd_sign: m,
							ref: decodeURIComponent(h),
							ref_sign: g,
							bad_user: "false",
							cdn_is_working: "true",
							info: "{}",
							type: n,
							hash: s,
							id: i
						})
					});
					return await t.json();
				} catch (t) {
					return Logger.error(`Failed to get kodik video data (type: ${n}, id: ${i}, hash: ${s})`, t.message), !1;
				}
			}
			decryptUrl(t) {
				let n = atob(t.replace(/[a-zA-Z]/g, function(t) {
					let n = t.charCodeAt(0) + 18, i = t <= "Z" ? 90 : 122;
					return String.fromCharCode(i >= n ? n : n - 26);
				}));
				return "https:" + n;
			}
			async getVideoData(t) {
				let n = this.getSecureData(t);
				if (!n) return;
				let i = await this.getFtor(n);
				if (!i) return;
				let s = Object.entries(i.links[i.default.toString()]), d = s.find(([, t]) => t.type === "application/x-mpegURL")?.[1];
				if (d) return { url: d.src.startsWith("//") ? `https:${d.src}` : this.decryptUrl(d.src) };
			}
			async getVideoId(t) {
				return /\/(uv|video|seria|episode|season|serial)\/([^/]+)\/([^/]+)\/([\d]+)p/.exec(t.pathname)?.[0];
			}
		}
		class PatreonHelper extends BaseHelper {
			API_ORIGIN = "https://www.patreon.com/api";
			async getPosts(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/posts/${t}?json-api-use-default-includes=false`);
					return await n.json();
				} catch (n) {
					return Logger.error(`Failed to get patreon posts by postId: ${t}.`, n.message), !1;
				}
			}
			async getVideoData(t) {
				let n = await this.getPosts(t);
				if (!n) return;
				let i = n.data.attributes.post_file.url;
				if (i) return { url: i };
			}
			async getVideoId(t) {
				let n = /posts\/([^/]+)/.exec(t.pathname)?.[1];
				if (n) return n.replace(/[^\d.]/g, "");
			}
		}
		class RedditHelper extends BaseHelper {
			API_ORIGIN = "https://www.reddit.com";
			async getContentUrl(t) {
				if (this.service?.additionalData !== "old") return document.querySelector("shreddit-player-2")?.src;
				let n = document.querySelector("[data-hls-url]");
				return n?.dataset.hlsUrl?.replaceAll("&amp;", "&");
			}
			async getVideoData(t) {
				try {
					let n = await this.getContentUrl(t);
					if (!n) throw new VideoHelperError("Failed to find content url");
					return { url: decodeURIComponent(n) };
				} catch (n) {
					Logger.error(`Failed to get reddit video data by video ID: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return /\/r\/(([^/]+)\/([^/]+)\/([^/]+)\/([^/]+))/.exec(t.pathname)?.[1];
			}
		}
		class BannedVideoHelper extends BaseHelper {
			API_ORIGIN = "https://api.banned.video";
			async getVideoInfo(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/graphql`, {
						method: "POST",
						body: JSON.stringify({
							operationName: "GetVideo",
							query: "query GetVideo($id: String!) {\n            getVideo(id: $id) {\n              title\n              description: summary\n              duration: videoDuration\n              videoUrl: directUrl\n              isStream: live\n            }\n          }",
							variables: { id: t }
						}),
						headers: {
							"User-Agent": "bannedVideoFrontEnd",
							"apollographql-client-name": "banned-web",
							"apollographql-client-version": "1.3",
							"content-type": "application/json"
						}
					});
					return await n.json();
				} catch (n) {
					return console.error(`Failed to get bannedvideo video info by videoId: ${t}.`, n.message), !1;
				}
			}
			async getVideoData(t) {
				let n = await this.getVideoInfo(t);
				if (!n) return;
				let { videoUrl: i, duration: s, isStream: d, description: f, title: p } = n.data.getVideo;
				return {
					url: i,
					duration: s,
					isStream: d,
					title: p,
					description: f
				};
			}
			async getVideoId(t) {
				return t.searchParams.get("id") ?? void 0;
			}
		}
		class KickHelper extends BaseHelper {
			API_ORIGIN = "https://kick.com/api";
			async getClipInfo(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/v2/clips/${t}`), i = await n.json(), { clip_url: s, duration: d, title: f } = i.clip;
					return {
						url: s,
						duration: d,
						title: f
					};
				} catch (n) {
					Logger.error(`Failed to get kick clip info by clipId: ${t}.`, n.message);
					return;
				}
			}
			async getVideoInfo(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/v1/video/${t}`), i = await n.json(), { source: s, livestream: d } = i, { session_title: f, duration: p } = d;
					return {
						url: s,
						duration: Math.round(p / 1e3),
						title: f
					};
				} catch (n) {
					Logger.error(`Failed to get kick video info by videoId: ${t}.`, n.message);
					return;
				}
			}
			async getVideoData(t) {
				return t.startsWith("videos") ? await this.getVideoInfo(t.replace("videos/", "")) : await this.getClipInfo(t.replace("clips/", ""));
			}
			async getVideoId(t) {
				return /([^/]+)\/((videos|clips)\/([^/]+))/.exec(t.pathname)?.[2];
			}
		}
		class AppleDeveloperHelper extends BaseHelper {
			API_ORIGIN = "https://developer.apple.com";
			async getVideoData(t) {
				try {
					let t = document.querySelector("meta[property='og:video']")?.content;
					if (!t) throw new VideoHelperError("Failed to find content url");
					return { url: t };
				} catch (n) {
					Logger.error(`Failed to get apple developer video data by video ID: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return /videos\/play\/([^/]+)\/([\d]+)/.exec(t.pathname)?.[0];
			}
		}
		class EpicGamesHelper extends BaseHelper {
			API_ORIGIN = "https://dev.epicgames.com/community/api/learning";
			async getPostInfo(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/post.json?hash_id=${t}`);
					return await n.json();
				} catch (n) {
					return Logger.error(`Failed to get epicgames post info by videoId: ${t}.`, n.message), !1;
				}
			}
			getVideoBlock() {
				let t = /videoUrl\s?=\s"([^"]+)"?/, n = Array.from(document.body.querySelectorAll("script")).find((n) => t.exec(n.innerHTML));
				if (!n) return;
				let i = n.innerHTML.trim(), s = t.exec(i)?.[1]?.replace("qsep://", "https://");
				if (!s) return;
				let d = /sources\s?=\s(\[([^\]]+)\])?/.exec(i)?.[1];
				if (!d) return {
					playlistUrl: s,
					subtitles: []
				};
				try {
					d = (d.replace(/src:(\s)+?(videoUrl)/g, "src:\"removed\"").substring(0, d.lastIndexOf("},")) + "]").split("\n").map((t) => t.replace(/([^\s]+):\s?(?!.*\1)/, "\"$1\":")).join("\n");
					let t = JSON.parse(d), n = t.filter((t) => t.type === "captions");
					return {
						playlistUrl: s,
						subtitles: n
					};
				} catch {
					return {
						playlistUrl: s,
						subtitles: []
					};
				}
			}
			async getVideoData(t) {
				let n = t.split(":")?.[1], i = await this.getPostInfo(n);
				if (!i) return;
				let s = this.getVideoBlock();
				if (!s) return;
				let { playlistUrl: d, subtitles: f } = s, { title: p, description: m } = i, h = f.map((t) => ({
					language: normalizeLang(t.srclang),
					source: "epicgames",
					format: "vtt",
					url: t.src
				}));
				return {
					url: d,
					title: p,
					description: m,
					subtitles: h
				};
			}
			async getVideoId(t) {
				return new Promise((t) => {
					let n = "https://dev.epicgames.com", i = btoa(window.location.href);
					window.addEventListener("message", (i) => {
						if (i.origin !== n || !(typeof i.data == "string" && i.data.startsWith("getVideoId:"))) return;
						let s = i.data.replace("getVideoId:", "");
						return t(s);
					}), window.top.postMessage(`getVideoId:${i}`, n);
				});
			}
		}
		class OdyseeHelper extends BaseHelper {
			API_ORIGIN = "https://odysee.com";
			async getVideoData(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/${t}`), i = await n.text(), s = /"contentUrl":(\s)?"([^"]+)"/.exec(i)?.[2];
					if (!s) throw new VideoHelperError("Odysee url doesn't parsed");
					return { url: s };
				} catch (n) {
					Logger.error(`Failed to get odysee video data by video ID: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class CoursehunterLikeHelper extends BaseHelper {
			API_ORIGIN = this.origin ?? "https://coursehunter.net";
			async getCourseId() {
				let t = window.course_id;
				return t === void 0 ? document.querySelector("input[name=\"course_id\"]")?.value : String(t);
			}
			async getLessonsData(t) {
				let n = window.lessons;
				if (n?.length) return n;
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/api/v1/course/${t}/lessons`);
					return await n.json();
				} catch (n) {
					Logger.error(`Failed to get CoursehunterLike lessons data by courseId: ${t}, because ${n.message}`);
					return;
				}
			}
			getLessondId(t) {
				let n = t.split("?lesson=")?.[1];
				if (n) return +n;
				let i = document.querySelector(".lessons-item_active");
				return n = i?.dataset?.index, n ? +n : 1;
			}
			async getVideoData(t) {
				let n = await this.getCourseId();
				if (!n) return;
				let i = await this.getLessonsData(n);
				if (!i) return;
				let s = this.getLessondId(t), d = i?.[s - 1], { file: f, duration: p, title: m } = d;
				if (f) return {
					url: proxyMedia(f),
					duration: p,
					title: m
				};
			}
			async getVideoId(t) {
				let n = /course\/([^/]+)/.exec(t.pathname)?.[0];
				return n ? n + t.search : void 0;
			}
		}
		class TwitchHelper extends BaseHelper {
			API_ORIGIN = "https://clips.twitch.tv";
			async getClipLink(t, n) {
				let i = document.querySelector("script[type='application/ld+json']"), s = t.slice(1);
				if (i) {
					let t = JSON.parse(i.innerText), n = t["@graph"].find((t) => t["@type"] === "VideoObject")?.creator.url;
					if (!n) throw new VideoHelperError("Failed to find channel link");
					let d = n.replace("https://www.twitch.tv/", "");
					return `${d}/clip/${s}`;
				}
				let d = s === "embed", f = document.querySelector(d ? ".tw-link[data-test-selector='stream-info-card-component__stream-avatar-link']" : ".clips-player a:not([class])");
				if (!f) return;
				let p = f.href.replace("https://www.twitch.tv/", "");
				return `${p}/clip/${d ? n : s}`;
			}
			async getVideoData(t) {
				let n = document.querySelector("[data-a-target=\"stream-title\"], [data-test-selector=\"stream-info-card-component__subtitle\"]")?.innerText, i = !!document.querySelector("[data-a-target=\"animated-channel-viewers-count\"], .channel-status-info--live, .top-bar--pointer-enabled .tw-channel-status-text-indicator");
				return {
					url: this.service.url + t,
					isStream: i,
					title: n
				};
			}
			async getVideoId(t) {
				let n = t.pathname;
				if (/^m\.twitch\.tv$/.test(n)) return /videos\/([^/]+)/.exec(t.href)?.[0] ?? n.slice(1);
				if (/^player\.twitch\.tv$/.test(t.hostname)) return `videos/${t.searchParams.get("video")}`;
				let i = /([^/]+)\/(?:clip)\/([^/]+)/.exec(n);
				if (i) return i[0];
				let s = /^clips\.twitch\.tv$/.test(t.hostname);
				if (s) return await this.getClipLink(n, t.searchParams.get("clip"));
				let d = /(?:videos)\/([^/]+)/.exec(n);
				if (d) return d[0];
				let f = document.querySelector(".home-offline-hero .tw-link");
				if (f?.href) {
					let t = new URL(f.href);
					return /(?:videos)\/([^/]+)/.exec(t.pathname)?.[0];
				}
				return document.querySelector(".persistent-player") ? n : void 0;
			}
		}
		class SapHelper extends BaseHelper {
			API_ORIGIN = "https://learning.sap.com/";
			async requestKaltura(t, n, i) {
				let s = "html5:v3.17.22", d = "3.3.0";
				try {
					let f = await this.fetch(`https://${t}/api_v3/service/multirequest`, {
						method: "POST",
						body: JSON.stringify({
							1: {
								service: "session",
								action: "startWidgetSession",
								widgetId: `_${n}`
							},
							2: {
								service: "baseEntry",
								action: "list",
								ks: "{1:result:ks}",
								filter: { redirectFromEntryId: i },
								responseProfile: {
									type: 1,
									fields: "id,referenceId,name,description,dataUrl,duration,flavorParamsIds,type,dvrStatus,externalSourceType,createdAt,updatedAt,endDate,plays,views,downloadUrl,creatorId"
								}
							},
							3: {
								service: "baseEntry",
								action: "getPlaybackContext",
								entryId: "{2:result:objects:0:id}",
								ks: "{1:result:ks}",
								contextDataParams: {
									objectType: "KalturaContextDataParams",
									flavorTags: "all"
								}
							},
							apiVersion: d,
							format: 1,
							ks: "",
							clientTag: s,
							partnerId: n
						}),
						headers: { "Content-Type": "application/json" }
					});
					return await f.json();
				} catch (t) {
					Logger.error("Failed to request kaltura data", t.message);
					return;
				}
			}
			async getKalturaData(t) {
				try {
					let n = document.querySelector("script[data-nscript=\"beforeInteractive\"]");
					if (!n) throw new VideoHelperError("Failed to find script element");
					let i = /https:\/\/([^"]+)\/p\/([^"]+)\/embedPlaykitJs\/uiconf_id\/([^"]+)/.exec(n?.src);
					if (!i) throw new VideoHelperError(`Failed to get sap data for videoId: ${t}`);
					let [, s, d] = i, f = document.querySelector("#shadow")?.firstChild?.getAttribute("id");
					if (!f) {
						let t = document.querySelector("#__NEXT_DATA__");
						if (!t) throw new VideoHelperError("Failed to find next data element");
						f = /"sourceId":\s?"([^"]+)"/.exec(t.innerText)?.[1];
					}
					if (!s || Number.isNaN(+d) || !f) throw new VideoHelperError(`One of the necessary parameters for getting a link to a sap video in wasn't found for ${t}. Params: kalturaDomain = ${s}, partnerId = ${d}, entryId = ${f}`);
					return await this.requestKaltura(s, d, f);
				} catch (t) {
					Logger.error("Failed to get kaltura data", t.message);
					return;
				}
			}
			async getVideoData(t) {
				let n = await this.getKalturaData(t);
				if (!n) return;
				let [, i, s] = n, { duration: d } = i.objects[0], f = s.sources.find((t) => t.format === "url" && t.protocols === "http,https" && t.url.includes(".mp4"))?.url;
				if (!f) return;
				let p = s.playbackCaptions.map((t) => ({
					language: normalizeLang(t.languageCode),
					source: "sap",
					format: "vtt",
					url: t.webVttUrl,
					isAutoGenerated: t.label.includes("auto-generated")
				}));
				return {
					url: f,
					subtitles: p,
					duration: d
				};
			}
			async getVideoId(t) {
				return /((courses|learning-journeys)\/([^/]+)(\/[^/]+)?)/.exec(t.pathname)?.[1];
			}
		}
		class VideoJSHelper extends BaseHelper {
			SUBTITLE_SOURCE = "videojs";
			SUBTITLE_FORMAT = "vtt";
			static getPlayer() {
				return document.querySelector(".video-js")?.player;
			}
			getVideoDataByPlayer(t) {
				try {
					let n = VideoJSHelper.getPlayer();
					if (!n) throw Error(`Video player doesn't have player option, videoId ${t}`);
					let i = n.duration(), s = Array.isArray(n.currentSources) ? n.currentSources : n.getCache()?.sources, { tracks_: d } = n.textTracks(), f = s.find((t) => t.type === "video/mp4" || t.type === "video/webm");
					if (!f) throw Error(`Failed to find video url for videoID ${t}`);
					let p = d.filter((t) => t.src).map((t) => ({
						language: normalizeLang(t.language),
						source: this.SUBTITLE_SOURCE,
						format: this.SUBTITLE_FORMAT,
						url: t.src
					}));
					return {
						url: f.src,
						duration: i,
						subtitles: p
					};
				} catch (t) {
					Logger.error("Failed to get videojs video data", t.message);
					return;
				}
			}
		}
		class LinkedinHelper extends VideoJSHelper {
			SUBTITLE_SOURCE = "linkedin";
			async getVideoData(t) {
				let n = this.getVideoDataByPlayer(t);
				if (!n) return;
				let { url: i, duration: s, subtitles: d } = n;
				return {
					url: proxyMedia(new URL(i)),
					duration: s,
					subtitles: d
				};
			}
			async getVideoId(t) {
				return /\/learning\/(([^/]+)\/([^/]+))/.exec(t.pathname)?.[1];
			}
		}
		class VimeoHelper extends BaseHelper {
			API_KEY = "";
			DEFAULT_SITE_ORIGIN = "https://vimeo.com";
			SITE_ORIGIN = this.service?.url?.slice(0, -1) ?? this.DEFAULT_SITE_ORIGIN;
			isErrorData(t) {
				return Object.hasOwn(t, "error");
			}
			isPrivatePlayer() {
				return this.referer && !this.referer.includes("vimeo.com");
			}
			async getViewerData() {
				try {
					let t = await this.fetch("https://vimeo.com/_next/viewer"), n = await t.json(), { apiUrl: i, jwt: s } = n;
					return this.API_ORIGIN = `https://${i}`, this.API_KEY = `jwt ${s}`, n;
				} catch (t) {
					return Logger.error("Failed to get default viewer data.", t.message), !1;
				}
			}
			async getVideoInfo(t) {
				try {
					let n = new URLSearchParams({ fields: "name,link,description,duration" }).toString(), i = await this.fetch(`${this.API_ORIGIN}/videos/${t}?${n}`, { headers: { Authorization: this.API_KEY } }), s = await i.json();
					if (this.isErrorData(s)) throw Error(s.developer_message ?? s.error);
					return s;
				} catch (n) {
					return Logger.error(`Failed to get video info by video ID: ${t}`, n.message), !1;
				}
			}
			async getPrivateVideoSource(t) {
				try {
					let { default_cdn: n, cdns: i } = t.dash, s = i[n].url, d = await this.fetch(s);
					if (d.status !== 200) throw new VideoHelperError(await d.text());
					let f = await d.json(), p = new URL(f.base_url, s), m = f.audio.find((t) => t.mime_type === "audio/mp4" && t.format === "dash");
					if (!m) throw new VideoHelperError("Failed to find video data");
					let h = m.segments?.[0]?.url;
					if (!h) throw new VideoHelperError("Failed to find first segment url");
					let [g, _] = h.split("?", 2), v = new URLSearchParams(_);
					return v.delete("range"), new URL(`${m.base_url}${g}?${v.toString()}`, p).href;
				} catch (t) {
					return Logger.error("Failed to get private video source", t.message), !1;
				}
			}
			async getPrivateVideoInfo(t) {
				try {
					if (typeof playerConfig > "u") return;
					let n = await this.getPrivateVideoSource(playerConfig.request.files);
					if (!n) throw new VideoHelperError("Failed to get private video source");
					let { video: { title: i, duration: s }, request: { text_tracks: d } } = playerConfig;
					return {
						url: `${this.SITE_ORIGIN}/${t}`,
						video_url: n,
						title: i,
						duration: s,
						subs: d
					};
				} catch (n) {
					return Logger.error(`Failed to get private video info by video ID: ${t}`, n.message), !1;
				}
			}
			async getSubsInfo(t) {
				try {
					let n = new URLSearchParams({
						per_page: "100",
						fields: "language,type,link"
					}).toString(), i = await this.fetch(`${this.API_ORIGIN}/videos/${t}/texttracks?${n}`, { headers: { Authorization: this.API_KEY } }), s = await i.json();
					if (this.isErrorData(s)) throw Error(s.developer_message ?? s.error);
					return s.data;
				} catch (n) {
					return Logger.error(`Failed to get subtitles info by video ID: ${t}`, n.message), [];
				}
			}
			async getVideoData(t) {
				let n = this.isPrivatePlayer();
				if (n) {
					let n = await this.getPrivateVideoInfo(t);
					if (!n) return;
					let { url: i, subs: s, video_url: d, title: f, duration: p } = n, m = s.map((t) => ({
						language: normalizeLang(t.lang),
						source: "vimeo",
						format: "vtt",
						url: this.SITE_ORIGIN + t.url,
						isAutoGenerated: t.lang.includes("autogenerated")
					})), h = m.length ? [{
						target: "video_file_url",
						targetUrl: d
					}, {
						target: "subtitles_file_url",
						targetUrl: m[0].url
					}] : null;
					return {
						...h ? {
							url: i,
							translationHelp: h
						} : { url: d },
						subtitles: m,
						title: f,
						duration: p
					};
				}
				if (!this.extraInfo) return this.returnBaseData(t);
				t.includes("/") && (t = t.replace("/", ":"));
				let i = await this.getViewerData();
				if (!i) return this.returnBaseData(t);
				let s = await this.getVideoInfo(t);
				if (!s) return this.returnBaseData(t);
				let d = await this.getSubsInfo(t), f = d.map((t) => ({
					language: normalizeLang(t.language),
					source: "vimeo",
					format: "vtt",
					url: t.link,
					isAutoGenerated: t.language.includes("autogen")
				})), { link: p, duration: m, name: h, description: g } = s;
				return {
					url: p,
					title: h,
					description: g,
					subtitles: f,
					duration: m
				};
			}
			async getVideoId(t) {
				let n = /video\/[^/]+$/.exec(t.pathname)?.[0];
				if (this.isPrivatePlayer()) return n;
				if (n) {
					let i = t.searchParams.get("h"), s = n.replace("video/", "");
					return i ? `${s}/${i}` : s;
				}
				let i = /channels\/[^/]+\/([^/]+)/.exec(t.pathname)?.[1] ?? /groups\/[^/]+\/videos\/([^/]+)/.exec(t.pathname)?.[1] ?? /(showcase|album)\/[^/]+\/video\/([^/]+)/.exec(t.pathname)?.[2];
				return i || /([^/]+\/)?[^/]+$/.exec(t.pathname)?.[0];
			}
		}
		class YandexDiskHelper extends BaseHelper {
			API_ORIGIN = window.location.origin;
			CLIENT_PREFIX = "/client/disk";
			INLINE_PREFIX = "/i/";
			DISK_PREFIX = "/d/";
			isErrorData(t) {
				return Object.hasOwn(t, "error");
			}
			async getClientVideoData(t) {
				let n = new URL(window.location.href), i = n.searchParams.get("idDialog");
				if (!i) return;
				let s = document.querySelector("#preloaded-data");
				if (s) try {
					let t = JSON.parse(s.innerText), { idClient: n, sk: d } = t.config, f = await this.fetch(this.API_ORIGIN + "/models-v2?m=mpfs/info", {
						method: "POST",
						body: JSON.stringify({
							apiMethod: "mpfs/info",
							connection_id: n,
							requestParams: { path: i.replaceAll(" ", "+") },
							sk: d
						}),
						headers: { "Content-Type": "application/json" }
					}), p = await f.json();
					if (this.isErrorData(p)) throw new VideoHelperError(p.error?.message ?? p.error?.code);
					if (p?.type !== "file") throw new VideoHelperError("Failed to get resource info");
					let { meta: { short_url: m, video_info: h }, name: g } = p;
					if (!h) throw new VideoHelperError("There's no video open right now");
					if (!m) throw new VideoHelperError("Access to the video is limited");
					let _ = this.clearTitle(g), v = Math.round(h.duration / 1e3);
					return {
						url: m,
						title: _,
						duration: v
					};
				} catch (n) {
					Logger.error(`Failed to get yandex disk video data by video ID: ${t}, because ${n.message}`);
					return;
				}
			}
			clearTitle(t) {
				return t.replace(/(\.[^.]+)$/, "");
			}
			getBodyHash(t, n) {
				let i = JSON.stringify({
					hash: t,
					sk: n
				});
				return encodeURIComponent(i);
			}
			async fetchList(t, n) {
				let i = this.getBodyHash(t, n), s = await this.fetch(this.API_ORIGIN + "/public/api/fetch-list", {
					method: "POST",
					body: i
				}), d = await s.json();
				if (Object.hasOwn(d, "error")) throw new VideoHelperError("Failed to fetch folder list");
				return d.resources;
			}
			async getDownloadUrl(t, n) {
				let i = this.getBodyHash(t, n), s = await this.fetch(this.API_ORIGIN + "/public/api/download-url", {
					method: "POST",
					body: i
				}), d = await s.json();
				if (d.error) throw new VideoHelperError("Failed to get download url");
				return d.data.url;
			}
			async getDiskVideoData(t) {
				try {
					let n = document.getElementById("store-prefetch");
					if (!n) throw new VideoHelperError("Failed to get prefetch data");
					let i = t.split("/").slice(3);
					if (!i.length) throw new VideoHelperError("Failed to find video file path");
					let s = JSON.parse(n.innerText), { resources: d, rootResourceId: f, environment: { sk: p } } = s, m = d[f], h = i.length - 1, g = i.filter((t, n) => n !== h).join("/"), _ = Object.values(d);
					g.includes("/") && (_ = await this.fetchList(`${m.hash}:/${g}`, p));
					let v = _.find((t) => t.name === i[h]);
					if (!v) throw new VideoHelperError("Failed to find resource");
					if (v && v.type === "dir") throw new VideoHelperError("Path is dir, but expected file");
					let { meta: { short_url: b, mediatype: x, videoDuration: C }, path: w, name: ee } = v;
					if (x !== "video") throw new VideoHelperError("Resource isn't a video");
					let te = this.clearTitle(ee), T = Math.round(C / 1e3);
					if (b) return {
						url: b,
						duration: T,
						title: te
					};
					let ne = await this.getDownloadUrl(w, p);
					return {
						url: proxyMedia(new URL(ne)),
						duration: T,
						title: te
					};
				} catch (n) {
					Logger.error(`Failed to get yandex disk video data by disk video ID: ${t}`, n.message);
					return;
				}
			}
			async getVideoData(t) {
				return t.startsWith(this.INLINE_PREFIX) || /^\/d\/([^/]+)$/.exec(t) ? { url: this.service.url + t.slice(1) } : (t = decodeURIComponent(t), t.startsWith(this.CLIENT_PREFIX) ? await this.getClientVideoData(t) : await this.getDiskVideoData(t));
			}
			async getVideoId(t) {
				if (t.pathname.startsWith(this.CLIENT_PREFIX)) return t.pathname + t.search;
				let n = /\/i\/([^/]+)/.exec(t.pathname)?.[0];
				return n || (/\/d\/([^/]+)/.exec(t.pathname) ? t.pathname : void 0);
			}
		}
		class VKHelper extends BaseHelper {
			static getPlayer() {
				if (!(typeof Videoview > "u")) return Videoview?.getPlayerObject?.call(void 0);
			}
			async getVideoData(t) {
				let n = VKHelper.getPlayer();
				if (!n) return this.returnBaseData(t);
				try {
					let { description: i, duration: s, md_title: d } = n.vars, f = new DOMParser(), p = f.parseFromString(i, "text/html"), m = Array.from(p.body.childNodes).filter((t) => t.nodeName !== "BR").map((t) => t.textContent).join("\n"), h;
					return Object.hasOwn(n.vars, "subs") && (h = n.vars.subs.map((t) => ({
						language: normalizeLang(t.lang),
						source: "vk",
						format: "vtt",
						url: t.url,
						isAutoGenerated: !!t.is_auto
					}))), {
						url: this.service.url + t,
						title: d,
						description: m,
						duration: s,
						subtitles: h
					};
				} catch (n) {
					return Logger.error(`Failed to get VK video data, because: ${n.message}`), this.returnBaseData(t);
				}
			}
			async getVideoId(t) {
				let n = /^\/(video|clip)-?\d{8,9}_\d{9}$/.exec(t.pathname);
				if (n) return n[0].slice(1);
				let i = /\/playlist\/[^/]+\/(video-?\d{8,9}_\d{9})/.exec(t.pathname);
				if (i) return i[1];
				let s = t.searchParams.get("z");
				if (s) return s.split("/")[0];
				let d = t.searchParams.get("oid"), f = t.searchParams.get("id");
				if (d && f) return `video-${Math.abs(parseInt(d))}_${f}`;
			}
		}
		class TrovoHelper extends BaseHelper {
			async getVideoId(t) {
				let n = t.searchParams.get("vid"), i = /([^/]+)\/([\d]+)/.exec(t.pathname)?.[0];
				if (!(!n || !i)) return `${i}?vid=${n}`;
			}
		}
		class IncestflixHelper extends BaseHelper {
			async getVideoData(t) {
				try {
					let t = document.querySelector("#incflix-stream source:first-of-type");
					if (!t) throw new VideoHelperError("Failed to find source element");
					let n = t.getAttribute("src");
					if (!n) throw new VideoHelperError("Failed to find source link");
					let i = new URL(n.startsWith("//") ? `https:${n}` : n);
					return i.searchParams.append("media-proxy", "video.mp4"), { url: proxyMedia(i) };
				} catch (n) {
					Logger.error(`Failed to get Incestflix data by videoId: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return /\/watch\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class PornTNHelper extends BaseHelper {
			async getVideoData(t) {
				try {
					if (typeof flashvars > "u") return;
					let { rnd: t, video_url: n, video_title: i } = flashvars;
					if (!n || !t) throw new VideoHelperError("Failed to find video source or rnd");
					let s = new URL(n);
					s.searchParams.append("rnd", t), Logger.log("PornTN get_file link", s.href);
					let d = await this.fetch(s.href, { method: "head" }), f = new URL(d.url);
					Logger.log("PornTN cdn link", f.href);
					let p = proxyMedia(f);
					return {
						url: p,
						title: i
					};
				} catch (n) {
					Logger.error(`Failed to get PornTN data by videoId: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return /\/videos\/(([^/]+)\/([^/]+))/.exec(t.pathname)?.[1];
			}
		}
		class GoogleDriveHelper extends BaseHelper {
			getPlayerData() {
				let t = document.querySelector("#movie_player");
				return t?.getVideoData?.call() ?? void 0;
			}
			async getVideoId(t) {
				return this.getPlayerData()?.video_id;
			}
		}
		class BilibiliHelper extends BaseHelper {
			async getVideoId(t) {
				let n = /bangumi\/play\/([^/]+)/.exec(t.pathname)?.[0];
				if (n) return n;
				let i = t.searchParams.get("bvid");
				if (i) return `video/${i}`;
				let s = /video\/([^/]+)/.exec(t.pathname)?.[0];
				return s && t.searchParams.get("p") !== null && (s += `/?p=${t.searchParams.get("p")}`), s;
			}
		}
		class XVideosHelper extends BaseHelper {
			async getVideoId(t) {
				return /[^/]+\/[^/]+$/.exec(t.pathname)?.[0];
			}
		}
		class WatchPornToHelper extends BaseHelper {
			async getVideoId(t) {
				return /(video|embed)\/(\d+)(\/[^/]+\/)?/.exec(t.pathname)?.[0];
			}
		}
		class ArchiveHelper extends BaseHelper {
			async getVideoId(t) {
				return /(details|embed)\/([^/]+)/.exec(t.pathname)?.[2];
			}
		}
		class DailymotionHelper extends BaseHelper {
			async getVideoId(t) {
				let n = Array.from(document.querySelectorAll("*")).filter((t) => t.innerHTML.trim().includes(".m3u8")), i = n?.[1]?.lastChild?.src;
				return i ? /\/video\/(\w+)\.m3u8/.exec(i)?.[1] : void 0;
			}
		}
		class YoukuHelper extends BaseHelper {
			async getVideoId(t) {
				return /v_show\/id_[\w=]+/.exec(t.pathname)?.[0];
			}
		}
		class EggheadHelper extends BaseHelper {
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class NewgroundsHelper extends BaseHelper {
			async getVideoId(t) {
				return /([^/]+)\/(view)\/([^/]+)/.exec(t.pathname)?.[0];
			}
		}
		class OKRuHelper extends BaseHelper {
			async getVideoId(t) {
				return /\/video\/(\d+)/.exec(t.pathname)?.[1];
			}
		}
		class PeertubeHelper extends BaseHelper {
			async getVideoId(t) {
				return /\/w\/([^/]+)/.exec(t.pathname)?.[0];
			}
		}
		class EpornerHelper extends BaseHelper {
			async getVideoId(t) {
				return /video-([^/]+)\/([^/]+)/.exec(t.pathname)?.[0];
			}
		}
		class BitchuteHelper extends BaseHelper {
			async getVideoId(t) {
				return /(video|embed)\/([^/]+)/.exec(t.pathname)?.[2];
			}
		}
		class RutubeHelper extends BaseHelper {
			async getVideoId(t) {
				return /(?:video|embed)\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class FacebookHelper extends BaseHelper {
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class RumbleHelper extends BaseHelper {
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class TwitterHelper extends BaseHelper {
			async getVideoId(t) {
				let n = /status\/([^/]+)/.exec(t.pathname)?.[1];
				if (n) return n;
				let i = this.video?.closest("[data-testid=\"tweet\"]"), s = i?.querySelector("a[role=\"link\"][aria-label]")?.href;
				return s ? /status\/([^/]+)/.exec(s)?.[1] : void 0;
			}
		}
		class PornhubHelper extends BaseHelper {
			async getVideoId(t) {
				return t.searchParams.get("viewkey") ?? /embed\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class TikTokHelper extends BaseHelper {
			async getVideoId(t) {
				return /([^/]+)\/video\/([^/]+)/.exec(t.pathname)?.[0];
			}
		}
		class NineGAGHelper extends BaseHelper {
			async getVideoId(t) {
				return /gag\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class YoutubeHelper extends BaseHelper {
			static isMobile() {
				return /^m\.youtube\.com$/.test(window.location.hostname);
			}
			static getPlayer() {
				return window.location.pathname.startsWith("/shorts/") && !YoutubeHelper.isMobile() ? document.querySelector("#shorts-player") : document.querySelector("#movie_player");
			}
			static getPlayerResponse() {
				return YoutubeHelper.getPlayer()?.getPlayerResponse?.call(void 0);
			}
			static getPlayerData() {
				return YoutubeHelper.getPlayer()?.getVideoData?.call(void 0);
			}
			static getVolume() {
				let t = YoutubeHelper.getPlayer();
				return t?.getVolume ? t.getVolume() / 100 : 1;
			}
			static setVolume(t) {
				let n = YoutubeHelper.getPlayer();
				return n?.setVolume ? (n.setVolume(Math.round(t * 100)), !0) : !1;
			}
			static isMuted() {
				let t = YoutubeHelper.getPlayer();
				return t?.isMuted ? t.isMuted() : !1;
			}
			static videoSeek(t, n) {
				Logger.log("videoSeek", n);
				let i = YoutubeHelper.getPlayer()?.getProgressState()?.seekableEnd ?? t.currentTime, s = i - n;
				t.currentTime = s;
			}
			static getSubtitles(t) {
				let n = YoutubeHelper.getPlayerResponse(), i = n?.captions?.playerCaptionsTracklistRenderer;
				if (!i) return [];
				let s = i.captionTracks ?? [], d = i.translationLanguages ?? [], f = d.find((n) => n.languageCode === t), p = s.find((t) => t?.kind === "asr"), m = p?.languageCode ?? "en", h = s.reduce((n, i) => {
					if (!("languageCode" in i)) return n;
					let s = i.languageCode ? normalizeLang(i.languageCode) : void 0, d = i.baseUrl;
					if (!s || !d) return n;
					let p = `${d.startsWith("http") ? d : `${window.location.origin}/${d}`}&fmt=json3`;
					return n.push({
						source: "youtube",
						format: "json",
						language: s,
						isAutoGenerated: i?.kind === "asr",
						url: p
					}), f && i.isTranslatable && i.languageCode === m && t !== s && n.push({
						source: "youtube",
						format: "json",
						language: t,
						isAutoGenerated: i?.kind === "asr",
						translatedFromLanguage: s,
						url: `${p}&tlang=${t}`
					}), n;
				}, []);
				return Logger.log("youtube subtitles:", h), h;
			}
			static getLanguage() {
				if (!YoutubeHelper.isMobile()) {
					let t = YoutubeHelper.getPlayer(), n = t?.getAudioTrack?.call(void 0)?.getLanguageInfo();
					if (n && n.id !== "und") return normalizeLang(n.id.split(".")[0]);
				}
				let t = YoutubeHelper.getPlayerResponse(), n = t?.captions?.playerCaptionsTracklistRenderer.captionTracks.find((t) => t.kind === "asr" && t.languageCode);
				return n ? normalizeLang(n.languageCode) : void 0;
			}
			async getVideoData(t) {
				let { title: n } = YoutubeHelper.getPlayerData() ?? {}, { shortDescription: i, isLive: s, title: d } = YoutubeHelper.getPlayerResponse()?.videoDetails ?? {}, f = YoutubeHelper.getSubtitles(this.language), p = YoutubeHelper.getLanguage();
				p && !W.includes(p) && (p = void 0);
				let m = YoutubeHelper.getPlayer()?.getDuration?.call(void 0) ?? void 0;
				return {
					url: this.service.url + t,
					isStream: s,
					title: d,
					localizedTitle: n,
					detectedLanguage: p,
					description: i,
					subtitles: f,
					duration: m
				};
			}
			async getVideoId(t) {
				if (t.hostname === "youtu.be" && (t.search = `?v=${t.pathname.replace("/", "")}`, t.pathname = "/watch"), t.searchParams.has("enablejsapi")) {
					let n = YoutubeHelper.getPlayer()?.getVideoUrl();
					t = n ? new URL(n) : t;
				}
				return /(?:watch|embed|shorts|live)\/([^/]+)/.exec(t.pathname)?.[1] ?? t.searchParams.get("v");
			}
		}
		class DzenHelper extends BaseHelper {
			async getVideoId(t) {
				return /video\/watch\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class UdemyHelper extends BaseHelper {
			API_ORIGIN = "https://www.udemy.com/api-2.0";
			getModuleData() {
				let t = document.querySelector(".ud-app-loader[data-module-id='course-taking']"), n = t?.dataset?.moduleArgs;
				if (n) return JSON.parse(n);
			}
			getLectureId() {
				return /learn\/lecture\/([^/]+)/.exec(window.location.pathname)?.[1];
			}
			isErrorData(t) {
				return Object.hasOwn(t, "error");
			}
			async getLectureData(t, n) {
				try {
					let i = await this.fetch(`${this.API_ORIGIN}/users/me/subscribed-courses/${t}/lectures/${n}/?` + new URLSearchParams({
						"fields[lecture]": "title,description,asset",
						"fields[asset]": "length,media_sources,captions"
					}).toString()), s = await i.json();
					if (this.isErrorData(s)) throw new VideoHelperError(s.detail ?? "unknown error");
					return s;
				} catch (i) {
					Logger.error(`Failed to get lecture data by courseId: ${t} and lectureId: ${n}`, i.message);
					return;
				}
			}
			async getCourseLang(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/users/me/subscribed-courses/${t}?` + new URLSearchParams({ "fields[course]": "locale" }).toString()), i = await n.json();
					if (this.isErrorData(i)) throw new VideoHelperError(i.detail ?? "unknown error");
					return i;
				} catch (n) {
					Logger.error(`Failed to get course lang by courseId: ${t}`, n.message);
					return;
				}
			}
			findVideoUrl(t) {
				return t?.find((t) => t.type === "video/mp4")?.src;
			}
			findSubtitleUrl(t, n) {
				let i = t?.find((t) => normalizeLang(t.locale_id) === n);
				return i ||= t?.find((t) => normalizeLang(t.locale_id) === "en") ?? t?.[0], i?.url;
			}
			async getVideoData(t) {
				let n = this.getModuleData();
				if (!n) return;
				let { courseId: i } = n, s = this.getLectureId();
				if (Logger.log(`[Udemy] courseId: ${i}, lectureId: ${s}`), !s) return;
				let d = await this.getLectureData(i, s);
				if (!d) return;
				let { title: f, description: p, asset: m } = d, { length: h, media_sources: g, captions: _ } = m, v = this.findVideoUrl(g);
				if (!v) {
					Logger.log("Failed to find .mp4 video file in media_sources", g);
					return;
				}
				let b = "en", x = await this.getCourseLang(i);
				if (x) {
					let { locale: { locale: t } } = x;
					b = t ? normalizeLang(t) : b;
				}
				W.includes(b) || (b = "en");
				let C = this.findSubtitleUrl(_, b);
				return C || Logger.log("Failed to find subtitle file in captions", _), {
					...C ? {
						url: this.service?.url + t,
						translationHelp: [{
							target: "subtitles_file_url",
							targetUrl: C
						}, {
							target: "video_file_url",
							targetUrl: v
						}],
						detectedLanguage: b
					} : {
						url: v,
						translationHelp: null
					},
					duration: h,
					title: f,
					description: p
				};
			}
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class CourseraHelper extends VideoJSHelper {
			API_ORIGIN = "https://www.coursera.org/api";
			SUBTITLE_SOURCE = "coursera";
			async getCourseData(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/onDemandCourses.v1/${t}`), i = await n.json();
					return i?.elements?.[0];
				} catch (n) {
					Logger.error(`Failed to get course data by courseId: ${t}`, n.message);
					return;
				}
			}
			static getPlayer() {
				return super.getPlayer();
			}
			async getVideoData(t) {
				let n = this.getVideoDataByPlayer(t);
				if (!n) return;
				let { options_: i } = CourseraHelper.getPlayer() ?? {};
				!n.subtitles?.length && i && (n.subtitles = i.tracks.map((t) => ({
					url: t.src,
					language: normalizeLang(t.srclang),
					source: this.SUBTITLE_SOURCE,
					format: this.SUBTITLE_FORMAT
				})));
				let s = i?.courseId;
				if (!s) return n;
				let d = "en", f = await this.getCourseData(s);
				if (f) {
					let { primaryLanguageCodes: [t] } = f;
					d = t ? normalizeLang(t) : "en";
				}
				W.includes(d) || (d = "en");
				let p = n.subtitles.find((t) => t.language === d) ?? n.subtitles?.[0], m = p?.url;
				m || Logger.warn("Failed to find any subtitle file");
				let { url: h, duration: g } = n, _ = m ? [{
					target: "subtitles_file_url",
					targetUrl: m
				}, {
					target: "video_file_url",
					targetUrl: h
				}] : null;
				return {
					...m ? {
						url: this.service?.url + t,
						translationHelp: _
					} : {
						url: h,
						translationHelp: _
					},
					detectedLanguage: d,
					duration: g
				};
			}
			async getVideoId(t) {
				let n = /learn\/([^/]+)\/lecture\/([^/]+)/.exec(t.pathname) ?? /lecture\/([^/]+)\/([^/]+)/.exec(t.pathname);
				return n?.[0];
			}
		}
		class CloudflareStreamHelper extends BaseHelper {
			async getVideoId(t) {
				return t.pathname + t.search;
			}
		}
		class DouyinHelper extends BaseHelper {
			static getPlayer() {
				if (!(typeof player > "u")) return player;
			}
			async getVideoData(t) {
				let n = DouyinHelper.getPlayer();
				if (!n) return;
				let { config: { url: i, duration: s, lang: d, isLive: f } } = n;
				if (!i) return;
				let p = i.find((t) => t.src.includes("www.douyin.com/aweme/v1/play/"));
				if (p) return {
					url: proxyMedia(p.src),
					duration: s,
					isStream: f,
					...W.includes(d) ? { detectedLanguage: d } : {}
				};
			}
			async getVideoId(t) {
				let n = /video\/([\d]+)/.exec(t.pathname)?.[0];
				return n || DouyinHelper.getPlayer()?.config.vid;
			}
		}
		var Dt;
		(function(t) {
			t.Channel = "Channel", t.Video = "Video";
		})(Dt ||= {});
		class LoomHelper extends BaseHelper {
			getClientVersion() {
				if (!(typeof SENTRY_RELEASE > "u")) return SENTRY_RELEASE.id;
			}
			async getVideoData(t) {
				try {
					let n = this.getClientVersion();
					if (!n) throw new VideoHelperError("Failed to get client version");
					let i = await this.fetch("https://www.loom.com/graphql", {
						headers: {
							"User-Agent": E.userAgent,
							"content-type": "application/json",
							"x-loom-request-source": `loom_web_${n}`,
							"apollographql-client-name": "web",
							"apollographql-client-version": n,
							"Alt-Used": "www.loom.com"
						},
						body: `{"operationName":"FetchCaptions","variables":{"videoId":"${t}"},"query":"query FetchCaptions($videoId: ID!, $password: String) {\\n  fetchVideoTranscript(videoId: $videoId, password: $password) {\\n    ... on VideoTranscriptDetails {\\n      id\\n      captions_source_url\\n      language\\n      __typename\\n    }\\n    ... on GenericError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`,
						method: "POST"
					});
					if (i.status !== 200) throw new VideoHelperError("Failed to get data from graphql");
					let s = await i.json(), d = s.data.fetchVideoTranscript;
					if (d.__typename === "GenericError") throw new VideoHelperError(d.message);
					return {
						url: this.service.url + t,
						subtitles: [{
							format: "vtt",
							language: normalizeLang(d.language),
							source: "loom",
							url: d.captions_source_url
						}]
					};
				} catch (n) {
					return Logger.error(`Failed to get Loom video data, because: ${n.message}`), this.returnBaseData(t);
				}
			}
			async getVideoId(t) {
				return /(embed|share)\/([^/]+)?/.exec(t.pathname)?.[2];
			}
		}
		class ArtstationHelper extends BaseHelper {
			API_ORIGIN = "https://www.artstation.com/api/v2/learning";
			getCSRFToken() {
				return document.querySelector("meta[name=\"public-csrf-token\"]")?.content;
			}
			async getCourseInfo(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/courses/${t}/autoplay.json`, {
						method: "POST",
						headers: { "PUBLIC-CSRF-TOKEN": this.getCSRFToken() }
					});
					return await n.json();
				} catch (n) {
					return Logger.error(`Failed to get artstation course info by courseId: ${t}.`, n.message), !1;
				}
			}
			async getVideoUrl(t) {
				try {
					let n = await this.fetch(`${this.API_ORIGIN}/quicksilver/video_url.json?chapter_id=${t}`), i = await n.json();
					return i.url.replace("qsep://", "https://");
				} catch (n) {
					return Logger.error(`Failed to get artstation video url by chapterId: ${t}.`, n.message), !1;
				}
			}
			async getVideoData(t) {
				let [, n, , , i] = t.split("/"), s = await this.getCourseInfo(n);
				if (!s) return;
				let d = s.chapters.find((t) => t.hash_id === i);
				if (!d) return;
				let f = await this.getVideoUrl(d.id);
				if (!f) return;
				let { title: p, duration: m, subtitles: h } = d, g = h.filter((t) => t.format === "vtt").map((t) => ({
					language: normalizeLang(t.locale),
					source: "artstation",
					format: "vtt",
					url: t.file_url
				}));
				return {
					url: f,
					title: p,
					duration: m,
					subtitles: g
				};
			}
			async getVideoId(t) {
				return /courses\/(\w{3,5})\/([^/]+)\/chapters\/(\w{3,5})/.exec(t.pathname)?.[0];
			}
		}
		class RtNewsHelper extends BaseHelper {
			async getVideoData(t) {
				let n = document.querySelector(".jw-video, .media__video_noscript");
				if (!n) return;
				let i = n.getAttribute("src");
				if (i) return i.endsWith(".MP4") && (i = proxyMedia(i)), {
					videoId: t,
					url: i
				};
			}
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class BitviewHelper extends BaseHelper {
			async getVideoData(t) {
				try {
					let t = document.querySelector(".vlScreen > video")?.src;
					if (!t) throw new VideoHelperError("Failed to find video URL");
					return { url: t };
				} catch (n) {
					Logger.error(`Failed to get Bitview data by videoId: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return t.searchParams.get("v");
			}
		}
		class KickstarterHelper extends BaseHelper {
			async getVideoData(t) {
				try {
					let t = document.querySelector(".ksr-video-player > video"), n = t?.querySelector("source[type^='video/mp4']")?.src;
					if (!n) throw new VideoHelperError("Failed to find video URL");
					let i = t?.querySelectorAll("track") ?? [];
					return {
						url: n,
						subtitles: Array.from(i).reduce((t, n) => {
							let i = n.getAttribute("srclang"), s = n.getAttribute("src");
							return !i || !s || t.push({
								language: normalizeLang(i),
								url: s,
								format: "vtt",
								source: "kickstarter"
							}), t;
						}, [])
					};
				} catch (n) {
					Logger.error(`Failed to get Kickstarter data by videoId: ${t}`, n.message);
					return;
				}
			}
			async getVideoId(t) {
				return t.pathname.slice(1);
			}
		}
		class ThisVidHelper extends BaseHelper {
			async getVideoId(t) {
				return /(videos|embed)\/[^/]+/.exec(t.pathname)?.[0];
			}
		}
		class IgnHelper extends BaseHelper {
			getVideoDataBySource(t) {
				let n = document.querySelector(".icms.video > source[type=\"video/mp4\"][data-quality=\"360\"]")?.src;
				return n ? { url: proxyMedia(n) } : this.returnBaseData(t);
			}
			getVideoDataByNext(t) {
				try {
					let t = document.getElementById("__NEXT_DATA__")?.textContent;
					if (!t) throw new VideoDataError("Not found __NEXT_DATA__ content");
					let n = JSON.parse(t), { props: { pageProps: { page: { description: i, title: s, video: { videoMetadata: { duration: d }, assets: f } } } } } = n, p = f.find((t) => t.height === 360 && t.url.includes(".mp4"))?.url;
					if (!p) throw new VideoDataError("Not found video URL in assets");
					return {
						url: proxyMedia(p),
						duration: d,
						title: s,
						description: i
					};
				} catch (n) {
					return Logger.warn(`Failed to get ign video data by video ID: ${t}, because ${n.message}. Using clear link instead...`), this.returnBaseData(t);
				}
			}
			async getVideoData(t) {
				return document.getElementById("__NEXT_DATA__") ? this.getVideoDataByNext(t) : this.getVideoDataBySource(t);
			}
			async getVideoId(t) {
				return /([^/]+)\/([\d]+)\/video\/([^/]+)/.exec(t.pathname)?.[0] ?? /\/videos\/([^/]+)/.exec(t.pathname)?.[0];
			}
		}
		class BunkrHelper extends BaseHelper {
			async getVideoData(t) {
				let n = document.querySelector("#player > source[type=\"video/mp4\"]")?.src;
				if (n) return { url: n };
			}
			async getVideoId(t) {
				return /\/f\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class IMDbHelper extends BaseHelper {
			async getVideoId(t) {
				return /video\/([^/]+)/.exec(t.pathname)?.[1];
			}
		}
		class TelegramHelper extends BaseHelper {
			static getMediaViewer() {
				if (!(typeof appMediaViewer > "u")) return appMediaViewer;
			}
			async getVideoId(t) {
				let n = TelegramHelper.getMediaViewer();
				if (!n || n.live) return;
				let i = n.target.message;
				if (i.peer_id._ !== "peerChannel") return;
				let s = i.media;
				if (s._ !== "messageMediaDocument" || s.document.type !== "video") return;
				let d = i.mid & 4294967295, f = await n.managers.appPeersManager.getPeerUsername(i.peerId);
				return `${f}/${d}`;
			}
		}
		let Ot = {
			[F.mailru]: MailRuHelper,
			[F.weverse]: WeverseHelper,
			[F.kodik]: KodikHelper,
			[F.patreon]: PatreonHelper,
			[F.reddit]: RedditHelper,
			[F.bannedvideo]: BannedVideoHelper,
			[F.kick]: KickHelper,
			[F.appledeveloper]: AppleDeveloperHelper,
			[F.epicgames]: EpicGamesHelper,
			[F.odysee]: OdyseeHelper,
			[F.coursehunterLike]: CoursehunterLikeHelper,
			[F.twitch]: TwitchHelper,
			[F.sap]: SapHelper,
			[F.linkedin]: LinkedinHelper,
			[F.vimeo]: VimeoHelper,
			[F.yandexdisk]: YandexDiskHelper,
			[F.vk]: VKHelper,
			[F.trovo]: TrovoHelper,
			[F.incestflix]: IncestflixHelper,
			[F.porntn]: PornTNHelper,
			[F.googledrive]: GoogleDriveHelper,
			[F.bilibili]: BilibiliHelper,
			[F.xvideos]: XVideosHelper,
			[F.watchpornto]: WatchPornToHelper,
			[F.archive]: ArchiveHelper,
			[F.dailymotion]: DailymotionHelper,
			[F.youku]: YoukuHelper,
			[F.egghead]: EggheadHelper,
			[F.newgrounds]: NewgroundsHelper,
			[F.okru]: OKRuHelper,
			[F.peertube]: PeertubeHelper,
			[F.eporner]: EpornerHelper,
			[F.bitchute]: BitchuteHelper,
			[F.rutube]: RutubeHelper,
			[F.facebook]: FacebookHelper,
			[F.rumble]: RumbleHelper,
			[F.twitter]: TwitterHelper,
			[F.pornhub]: PornhubHelper,
			[F.tiktok]: TikTokHelper,
			[F.proxitok]: TikTokHelper,
			[F.nine_gag]: NineGAGHelper,
			[F.youtube]: YoutubeHelper,
			[F.ricktube]: YoutubeHelper,
			[F.invidious]: YoutubeHelper,
			[F.poketube]: YoutubeHelper,
			[F.piped]: YoutubeHelper,
			[F.dzen]: DzenHelper,
			[F.cloudflarestream]: CloudflareStreamHelper,
			[F.loom]: LoomHelper,
			[F.rtnews]: RtNewsHelper,
			[F.bitview]: BitviewHelper,
			[F.thisvid]: ThisVidHelper,
			[F.ign]: IgnHelper,
			[F.bunkr]: BunkrHelper,
			[F.imdb]: IMDbHelper,
			[F.telegram]: TelegramHelper,
			[Y.udemy]: UdemyHelper,
			[Y.coursera]: CourseraHelper,
			[Y.douyin]: DouyinHelper,
			[Y.artstation]: ArtstationHelper,
			[Y.kickstarter]: KickstarterHelper
		};
		class VideoHelper {
			helpersData;
			constructor(t = {}) {
				this.helpersData = t;
			}
			getHelper(t) {
				return new Ot[t](this.helpersData);
			}
		}
		function getService() {
			if (gt.exec(window.location.href)) return [];
			let t = window.location.hostname, n = new URL(window.location.href), isMathes = (i) => i instanceof RegExp ? i.test(t) : typeof i == "string" ? t.includes(i) : typeof i == "function" ? i(n) : !1;
			return Et.filter((t) => (Array.isArray(t.match) ? t.match.some(isMathes) : isMathes(t.match)) && t.host && t.url);
		}
		async function getVideoID(t, n = {}) {
			let i = new URL(window.location.href), s = t.host;
			if (Object.keys(Ot).includes(s)) {
				let t = new VideoHelper(n).getHelper(s);
				return await t.getVideoId(i);
			}
			return s === F.custom ? i.href : void 0;
		}
		async function getVideoData(t, n = {}) {
			let i = await getVideoID(t, n);
			if (!i) throw new VideoDataError(`Entered unsupported link: "${t.host}"`);
			let s = window.location.origin;
			if ([
				F.peertube,
				F.coursehunterLike,
				F.cloudflarestream
			].includes(t.host) && (t.url = s), t.rawResult) return {
				url: i,
				videoId: i,
				host: t.host,
				duration: void 0
			};
			if (!t.needExtraData) return {
				url: t.url + i,
				videoId: i,
				host: t.host,
				duration: void 0
			};
			let d = new VideoHelper({
				...n,
				service: t,
				origin: s
			}).getHelper(t.host), f = await d.getVideoData(i);
			if (!f) throw new VideoDataError(`Failed to get video raw url for ${t.host}`);
			return {
				...f,
				videoId: i,
				host: t.host
			};
		}
		let kt = globalThis, At = kt.trustedTypes, jt = At ? At.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Mt = "$lit$", X = `lit$${Math.random().toFixed(9).slice(2)}$`, Nt = "?" + X, Pt = `<${Nt}>`, Z = document, l = () => Z.createComment(""), c = (t) => t === null || typeof t != "object" && typeof t != "function", Ft = Array.isArray, u = (t) => Ft(t) || typeof t?.[Symbol.iterator] == "function", It = "[ 	\n\f\r]", Lt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Rt = /-->/g, zt = />/g, Bt = RegExp(`>|${It}(?:([^\\s"'>=/]+)(${It}*=${It}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), Vt = /'/g, Ht = /"/g, Ut = /^(?:script|style|textarea|title)$/i, y = (t) => (n, ...i) => ({
			_$litType$: t,
			strings: n,
			values: i
		}), Wt = y(1), Q = y(2), Gt = y(3), Kt = Symbol.for("lit-noChange"), $ = Symbol.for("lit-nothing"), qt = new WeakMap(), Jt = Z.createTreeWalker(Z, 129);
		function P(t, n) {
			if (!Ft(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
			return jt === void 0 ? n : jt.createHTML(n);
		}
		let V = (t, n) => {
			let i = t.length - 1, s = [], d, f = n === 2 ? "<svg>" : n === 3 ? "<math>" : "", p = Lt;
			for (let n = 0; n < i; n++) {
				let i = t[n], m, h, g = -1, _ = 0;
				for (; _ < i.length && (p.lastIndex = _, h = p.exec(i), h !== null);) _ = p.lastIndex, p === Lt ? h[1] === "!--" ? p = Rt : h[1] === void 0 ? h[2] === void 0 ? h[3] !== void 0 && (p = Bt) : (Ut.test(h[2]) && (d = RegExp("</" + h[2], "g")), p = Bt) : p = zt : p === Bt ? h[0] === ">" ? (p = d ?? Lt, g = -1) : h[1] === void 0 ? g = -2 : (g = p.lastIndex - h[2].length, m = h[1], p = h[3] === void 0 ? Bt : h[3] === "\"" ? Ht : Vt) : p === Ht || p === Vt ? p = Bt : p === Rt || p === zt ? p = Lt : (p = Bt, d = void 0);
				let v = p === Bt && t[n + 1].startsWith("/>") ? " " : "";
				f += p === Lt ? i + Pt : g >= 0 ? (s.push(m), i.slice(0, g) + Mt + i.slice(g) + X + v) : i + X + (g === -2 ? n : v);
			}
			return [P(t, f + (t[i] || "<?>") + (n === 2 ? "</svg>" : n === 3 ? "</math>" : "")), s];
		};
		class N {
			constructor({ strings: t, _$litType$: n }, i) {
				let s;
				this.parts = [];
				let d = 0, f = 0, p = t.length - 1, m = this.parts, [h, g] = V(t, n);
				if (this.el = N.createElement(h, i), Jt.currentNode = this.el.content, n === 2 || n === 3) {
					let t = this.el.content.firstChild;
					t.replaceWith(...t.childNodes);
				}
				for (; (s = Jt.nextNode()) !== null && m.length < p;) {
					if (s.nodeType === 1) {
						if (s.hasAttributes()) for (let t of s.getAttributeNames()) if (t.endsWith(Mt)) {
							let n = g[f++], i = s.getAttribute(t).split(X), p = /([.?@])?(.*)/.exec(n);
							m.push({
								type: 1,
								index: d,
								name: p[2],
								strings: i,
								ctor: p[1] === "." ? H : p[1] === "?" ? I : p[1] === "@" ? L : k
							}), s.removeAttribute(t);
						} else t.startsWith(X) && (m.push({
							type: 6,
							index: d
						}), s.removeAttribute(t));
						if (Ut.test(s.tagName)) {
							let t = s.textContent.split(X), n = t.length - 1;
							if (n > 0) {
								s.textContent = At ? At.emptyScript : "";
								for (let i = 0; i < n; i++) s.append(t[i], l()), Jt.nextNode(), m.push({
									type: 2,
									index: ++d
								});
								s.append(t[n], l());
							}
						}
					} else if (s.nodeType === 8) if (s.data === Nt) m.push({
						type: 2,
						index: d
					});
					else {
						let t = -1;
						for (; (t = s.data.indexOf(X, t + 1)) !== -1;) m.push({
							type: 7,
							index: d
						}), t += X.length - 1;
					}
					d++;
				}
			}
			static createElement(t, n) {
				let i = Z.createElement("template");
				return i.innerHTML = t, i;
			}
		}
		function S(t, n, i = t, s) {
			if (n === Kt) return n;
			let d = s === void 0 ? i._$Cl : i._$Co?.[s], f = c(n) ? void 0 : n._$litDirective$;
			return d?.constructor !== f && (d?._$AO?.(!1), f === void 0 ? d = void 0 : (d = new f(t), d._$AT(t, i, s)), s === void 0 ? i._$Cl = d : (i._$Co ??= [])[s] = d), d !== void 0 && (n = S(t, d._$AS(t, n.values), d, s)), n;
		}
		class M {
			constructor(t, n) {
				this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = n;
			}
			get parentNode() {
				return this._$AM.parentNode;
			}
			get _$AU() {
				return this._$AM._$AU;
			}
			u(t) {
				let { el: { content: n }, parts: i } = this._$AD, s = (t?.creationScope ?? Z).importNode(n, !0);
				Jt.currentNode = s;
				let d = Jt.nextNode(), f = 0, p = 0, m = i[0];
				for (; m !== void 0;) {
					if (f === m.index) {
						let n;
						m.type === 2 ? n = new R(d, d.nextSibling, this, t) : m.type === 1 ? n = new m.ctor(d, m.name, m.strings, this, t) : m.type === 6 && (n = new z(d, this, t)), this._$AV.push(n), m = i[++p];
					}
					f !== m?.index && (d = Jt.nextNode(), f++);
				}
				return Jt.currentNode = Z, s;
			}
			p(t) {
				let n = 0;
				for (let i of this._$AV) i !== void 0 && (i.strings === void 0 ? i._$AI(t[n]) : (i._$AI(t, i, n), n += i.strings.length - 2)), n++;
			}
		}
		class R {
			get _$AU() {
				return this._$AM?._$AU ?? this._$Cv;
			}
			constructor(t, n, i, s) {
				this.type = 2, this._$AH = $, this._$AN = void 0, this._$AA = t, this._$AB = n, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
			}
			get parentNode() {
				let t = this._$AA.parentNode, n = this._$AM;
				return n !== void 0 && t?.nodeType === 11 && (t = n.parentNode), t;
			}
			get startNode() {
				return this._$AA;
			}
			get endNode() {
				return this._$AB;
			}
			_$AI(t, n = this) {
				t = S(this, t, n), c(t) ? t === $ || t == null || t === "" ? (this._$AH !== $ && this._$AR(), this._$AH = $) : t !== this._$AH && t !== Kt && this._(t) : t._$litType$ === void 0 ? t.nodeType === void 0 ? u(t) ? this.k(t) : this._(t) : this.T(t) : this.$(t);
			}
			O(t) {
				return this._$AA.parentNode.insertBefore(t, this._$AB);
			}
			T(t) {
				this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
			}
			_(t) {
				this._$AH !== $ && c(this._$AH) ? this._$AA.nextSibling.data = t : this.T(Z.createTextNode(t)), this._$AH = t;
			}
			$(t) {
				let { values: n, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = N.createElement(P(i.h, i.h[0]), this.options)), i);
				if (this._$AH?._$AD === s) this._$AH.p(n);
				else {
					let t = new M(s, this), i = t.u(this.options);
					t.p(n), this.T(i), this._$AH = t;
				}
			}
			_$AC(t) {
				let n = qt.get(t.strings);
				return n === void 0 && qt.set(t.strings, n = new N(t)), n;
			}
			k(t) {
				Ft(this._$AH) || (this._$AH = [], this._$AR());
				let n = this._$AH, i, s = 0;
				for (let d of t) s === n.length ? n.push(i = new R(this.O(l()), this.O(l()), this, this.options)) : i = n[s], i._$AI(d), s++;
				s < n.length && (this._$AR(i && i._$AB.nextSibling, s), n.length = s);
			}
			_$AR(t = this._$AA.nextSibling, n) {
				for (this._$AP?.(!1, !0, n); t && t !== this._$AB;) {
					let n = t.nextSibling;
					t.remove(), t = n;
				}
			}
			setConnected(t) {
				this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
			}
		}
		class k {
			get tagName() {
				return this.element.tagName;
			}
			get _$AU() {
				return this._$AM._$AU;
			}
			constructor(t, n, i, s, d) {
				this.type = 1, this._$AH = $, this._$AN = void 0, this.element = t, this.name = n, this._$AM = s, this.options = d, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = $;
			}
			_$AI(t, n = this, i, s) {
				let d = this.strings, f = !1;
				if (d === void 0) t = S(this, t, n, 0), f = !c(t) || t !== this._$AH && t !== Kt, f && (this._$AH = t);
				else {
					let s = t, p, m;
					for (t = d[0], p = 0; p < d.length - 1; p++) m = S(this, s[i + p], n, p), m === Kt && (m = this._$AH[p]), f ||= !c(m) || m !== this._$AH[p], m === $ ? t = $ : t !== $ && (t += (m ?? "") + d[p + 1]), this._$AH[p] = m;
				}
				f && !s && this.j(t);
			}
			j(t) {
				t === $ ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
			}
		}
		class H extends k {
			constructor() {
				super(...arguments), this.type = 3;
			}
			j(t) {
				this.element[this.name] = t === $ ? void 0 : t;
			}
		}
		class I extends k {
			constructor() {
				super(...arguments), this.type = 4;
			}
			j(t) {
				this.element.toggleAttribute(this.name, !!t && t !== $);
			}
		}
		class L extends k {
			constructor(t, n, i, s, d) {
				super(t, n, i, s, d), this.type = 5;
			}
			_$AI(t, n = this) {
				if ((t = S(this, t, n, 0) ?? $) === Kt) return;
				let i = this._$AH, s = t === $ && i !== $ || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, d = t !== $ && (i === $ || s);
				s && this.element.removeEventListener(this.name, this, i), d && this.element.addEventListener(this.name, this, t), this._$AH = t;
			}
			handleEvent(t) {
				typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
			}
		}
		class z {
			constructor(t, n, i) {
				this.element = t, this.type = 6, this._$AN = void 0, this._$AM = n, this.options = i;
			}
			get _$AU() {
				return this._$AM._$AU;
			}
			_$AI(t) {
				S(this, t);
			}
		}
		let Yt = {
			M: Mt,
			P: X,
			A: Nt,
			C: 1,
			L: V,
			R: M,
			D: u,
			V: S,
			I: R,
			H: k,
			N: I,
			U: L,
			B: H,
			F: z
		}, Xt = kt.litHtmlPolyfillSupport;
		Xt?.(N, R), (kt.litHtmlVersions ??= []).push("3.3.0");
		let B = (t, n, i) => {
			let s = i?.renderBefore ?? n, d = s._$litPart$;
			if (d === void 0) {
				let t = i?.renderBefore ?? null;
				s._$litPart$ = d = new R(n.insertBefore(l(), t), t, void 0, i ?? {});
			}
			return d._$AI(t), d;
		};
		var Zt = __webpack_require__("./src/styles/main.scss");
		class UI {
			static createEl(t, n = [], i = null) {
				let s = document.createElement(t);
				return n.length && s.classList.add(...n), i !== null && s.append(i), s;
			}
			static createHeader(t, n = 4) {
				let i = UI.createEl("vot-block", ["vot-header", `vot-header-level-${n}`]);
				return i.append(t), i;
			}
			static createInformation(t, n) {
				let i = UI.createEl("vot-block", ["vot-info"]), s = UI.createEl("vot-block");
				B(t, s);
				let d = UI.createEl("vot-block");
				return B(n, d), i.append(s, d), {
					container: i,
					header: s,
					value: d
				};
			}
			static createButton(t) {
				let n = UI.createEl("vot-block", ["vot-button"]);
				return n.append(t), n;
			}
			static createTextButton(t) {
				let n = UI.createEl("vot-block", ["vot-text-button"]);
				return n.append(t), n;
			}
			static createOutlinedButton(t) {
				let n = UI.createEl("vot-block", ["vot-outlined-button"]);
				return n.append(t), n;
			}
			static createIconButton(t) {
				let n = UI.createEl("vot-block", ["vot-icon-button"]);
				return B(t, n), n;
			}
			static createInlineLoader() {
				return UI.createEl("vot-block", ["vot-inline-loader"]);
			}
			static createPortal(t = !1) {
				return UI.createEl("vot-block", [`vot-portal${t ? "-local" : ""}`]);
			}
			static createSubtitleInfo(t, n, i) {
				let s = UI.createEl("vot-block", ["vot-subtitles-info"]);
				s.id = "vot-subtitles-info";
				let d = UI.createEl("vot-block", ["vot-subtitles-info-service"], J.get("VOTTranslatedBy").replace("{0}", i)), f = UI.createEl("vot-block", ["vot-subtitles-info-header"], t), p = UI.createEl("vot-block", ["vot-subtitles-info-context"], n);
				return s.append(d, f, p), {
					container: s,
					translatedWith: d,
					header: f,
					context: p
				};
			}
		}
		function convertToStrTime(t, n = ",") {
			let i = t / 1e3, s = Math.floor(i / 3600), d = Math.floor(i % 3600 / 60), f = Math.floor(i % 60), p = Math.floor(t % 1e3);
			return `${s.toString().padStart(2, "0")}:${d.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}${n}${p.toString().padStart(3, "0")}`;
		}
		function convertToMSTime(t) {
			let n = t.split(" ")?.[0]?.split(":");
			n.length < 3 && n.unshift("00");
			let [i, s, d] = n, f = +d.replace(/[,.]/, ""), p = s * 6e4, m = i * 36e5;
			return m + p + f;
		}
		function convertSubsFromJSON(t, n = "srt") {
			let i = n === "vtt", s = i ? "." : ",", d = t.subtitles.map((t, n) => {
				let d = i ? "" : `${n + 1}\n`;
				return d + `${convertToStrTime(t.startMs, s)} --> ${convertToStrTime(t.startMs + t.durationMs, s)}\n${t.text}\n\n`;
			}).join("").trim();
			return i ? `WEBVTT\n\n${d}` : d;
		}
		function convertSubsToJSON(t, n = "srt") {
			let i = t.split(/\r?\n\r?\n/g);
			n === "vtt" && i.shift(), /^\d+\r?\n/.exec(i?.[0] ?? "") && (n = "srt");
			let s = +(n === "srt"), d = i.reduce((t, n) => {
				let i = n.trim().split("\n"), d = i[s], f = i.slice(s + 1).join("\n");
				if ((i.length !== 2 || !n.includes(" --> ")) && !d?.includes(" --> ")) return t.length === 0 || (t[t.length - 1].text += `\n\n${i.join("\n")}`), t;
				let [p, m] = d.split(" --> "), h = convertToMSTime(p), g = convertToMSTime(m), _ = g - h;
				return t.push({
					text: f,
					startMs: h,
					durationMs: _,
					speakerId: "0"
				}), t;
			}, []);
			return {
				containsTokens: !1,
				subtitles: d
			};
		}
		function getSubsFormat(t) {
			return typeof t == "string" ? /^(WEBVTT([^\n]+)?)(\r?\n)/.exec(t) ? "vtt" : "srt" : "json";
		}
		function convertSubs(t, n = "srt") {
			let i = getSubsFormat(t);
			return i === n ? t : i === "json" ? convertSubsFromJSON(t, n) : (t = convertSubsToJSON(t, i), n === "json" ? t : convertSubsFromJSON(t, n));
		}
		let Qt = new class {
			isFOSWLYError(t) {
				return Object.hasOwn(t, "error");
			}
			async request(t, n = {}) {
				try {
					let i = await (GM_fetch(`${He}${t}`, {
						timeout: 3e3,
						...n
					})), s = await (i.json());
					if (this.isFOSWLYError(s)) throw s.error;
					return s;
				} catch (t) {
					console.error(`[VOT] Failed to get data from FOSWLY Translate API, because ${t.message}`);
					return;
				}
			}
			async translateMultiple(t, n, i) {
				let s = await (this.request("/translate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: t,
						lang: n,
						service: i
					})
				}));
				return s ? s.translations : t;
			}
			async translate(t, n, i) {
				let s = await (this.request(`/translate?${new URLSearchParams({
					text: t,
					lang: n,
					service: i
				})}`));
				return s ? s.translations[0] : t;
			}
			async detect(t, n) {
				let i = await (this.request(`/detect?${new URLSearchParams({
					text: t,
					service: n
				})}`));
				return i ? i.lang : "en";
			}
		}(), $t = { async detect(t) {
			try {
				let n = await GM_fetch(Ue, {
					method: "POST",
					body: t,
					timeout: 3e3
				});
				return await n.text();
			} catch (t) {
				return console.error(`[VOT] Error getting lang from text, because ${t.message}`), "en";
			}
		} };
		async function translate(t, n = "", i = "ru") {
			let s = await q.get("translationService", Qe);
			switch (s) {
				case "yandexbrowser":
				case "msedge": {
					let d = n && i ? `${n}-${i}` : i;
					return Array.isArray(t) ? await Qt.translateMultiple(t, d, s) : await Qt.translate(t, d, s);
				}
				default: return t;
			}
		}
		async function detect(t) {
			let n = await q.get("detectService", $e);
			switch (n) {
				case "yandexbrowser":
				case "msedge": return await Qt.detect(t, n);
				case "rust-server": return await $t.detect(t);
				default: return "en";
			}
		}
		let en = ["yandexbrowser", "msedge"], tn = [...en, "rust-server"], nn = [
			"left",
			"top",
			"right",
			"bottom"
		], rn = ["hover", "click"];
		class Tooltip {
			showed = !1;
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
			constructor({ target: t, anchor: n = void 0, content: i = "", position: s = "top", trigger: d = "hover", offset: f = 4, maxWidth: p = void 0, hidden: m = !1, autoLayout: h = !0, backgroundColor: g = void 0, borderRadius: _ = void 0, bordered: v = !0, parentElement: b = document.body, layoutRoot: x = document.documentElement }) {
				if (!(t instanceof HTMLElement)) throw Error("target must be a valid HTMLElement");
				this.target = t, this.anchor = n instanceof HTMLElement ? n : t, this.content = i, typeof f == "number" ? this.offsetY = this.offsetX = f : (this.offsetX = f.x, this.offsetY = f.y), this.hidden = m, this.autoLayout = h, this.trigger = Tooltip.validateTrigger(d) ? d : "hover", this.position = Tooltip.validatePos(s) ? s : "top", this.parentElement = b, this.layoutRoot = x, this.borderRadius = _, this._bordered = v, this.maxWidth = p, this.backgroundColor = g, this.updatePageSize(), this.init();
			}
			static validatePos(t) {
				return nn.includes(t);
			}
			static validateTrigger(t) {
				return rn.includes(t);
			}
			setPosition(t) {
				return this.position = Tooltip.validatePos(t) ? t : "top", this.updatePos(), this;
			}
			setContent(t) {
				return this.content = t, this.destroy(), this;
			}
			onResize = () => {
				this.updatePageSize(), this.updatePos();
			};
			onClick = () => {
				this.showed ? this.destroy() : this.create();
			};
			onScroll = () => {
				requestAnimationFrame(() => {
					this.updatePageSize(), this.updatePos();
				});
			};
			onHoverPointerDown = (t) => {
				t.pointerType !== "mouse" && this.create();
			};
			onHoverPointerUp = (t) => {
				t.pointerType !== "mouse" && this.destroy();
			};
			onMouseEnter = () => {
				this.create();
			};
			onMouseLeave = () => {
				this.destroy();
			};
			updatePageSize() {
				if (this.layoutRoot !== document.documentElement) {
					let { left: t, top: n } = this.parentElement.getBoundingClientRect();
					this.globalOffsetX = t, this.globalOffsetY = n;
				} else this.globalOffsetX = 0, this.globalOffsetY = 0;
				return this.pageWidth = (this.layoutRoot.clientWidth || document.documentElement.clientWidth) + window.pageXOffset, this.pageHeight = (this.layoutRoot.clientHeight || document.documentElement.clientHeight) + window.pageYOffset, this;
			}
			onIntersect = ([t]) => {
				if (!t.isIntersecting) return this.destroy(!0);
			};
			init() {
				return this.onResizeObserver = new ResizeObserver(this.onResize), this.intersectionObserver = new IntersectionObserver(this.onIntersect), document.addEventListener("scroll", this.onScroll, {
					passive: !0,
					capture: !0
				}), this.trigger === "click" ? (this.target.addEventListener("pointerdown", this.onClick), this) : (this.target.addEventListener("mouseenter", this.onMouseEnter), this.target.addEventListener("mouseleave", this.onMouseLeave), this.target.addEventListener("pointerdown", this.onHoverPointerDown), this.target.addEventListener("pointerup", this.onHoverPointerUp), this);
			}
			release() {
				return this.destroy(), document.removeEventListener("scroll", this.onScroll, { capture: !0 }), this.trigger === "click" ? (this.target.removeEventListener("pointerdown", this.onClick), this) : (this.target.removeEventListener("mouseenter", this.onMouseEnter), this.target.removeEventListener("mouseleave", this.onMouseLeave), this.target.removeEventListener("pointerdown", this.onHoverPointerDown), this.target.removeEventListener("pointerup", this.onHoverPointerUp), this);
			}
			create() {
				return this.destroy(!0), this.showed = !0, this.container = UI.createEl("vot-block", ["vot-tooltip"], this.content), this.bordered && this.container.classList.add("vot-tooltip-bordered"), this.container.setAttribute("role", "tooltip"), this.container.dataset.trigger = this.trigger, this.container.dataset.position = this.position, this.parentElement.appendChild(this.container), this.updatePos(), this.backgroundColor !== void 0 && (this.container.style.backgroundColor = this.backgroundColor), this.borderRadius !== void 0 && (this.container.style.borderRadius = `${this.borderRadius}px`), this.hidden && (this.container.hidden = !0), this.container.style.opacity = "1", this.onResizeObserver?.observe(this.layoutRoot), this.intersectionObserver?.observe(this.target), this;
			}
			updatePos() {
				if (!this.container) return this;
				let { top: t, left: n } = this.calcPos(this.autoLayout), i = this.pageWidth - this.offsetX * 2, s = this.maxWidth ?? Math.min(i, this.pageWidth - Math.min(n, this.pageWidth - i));
				return this.container.style.transform = `translate(${n}px, ${t}px)`, this.container.style.maxWidth = `${s}px`, this;
			}
			calcPos(t = !0) {
				if (!this.container) return {
					top: 0,
					left: 0
				};
				let { left: n, right: i, top: s, bottom: d, width: f, height: p } = this.anchor.getBoundingClientRect(), { width: m, height: h } = this.container.getBoundingClientRect(), g = clamp(m, 0, this.pageWidth), _ = clamp(h, 0, this.pageHeight), v = n - this.globalOffsetX, b = i - this.globalOffsetX, x = s - this.globalOffsetY, C = d - this.globalOffsetY;
				switch (this.position) {
					case "top": {
						let n = clamp(x - _ - this.offsetY, 0, this.pageHeight);
						return t && n + this.offsetY < _ ? (this.position = "bottom", this.calcPos(!1)) : {
							top: n,
							left: clamp(v - g / 2 + f / 2, this.offsetX, this.pageWidth - g - this.offsetX)
						};
					}
					case "right": {
						let n = clamp(b + this.offsetX, 0, this.pageWidth - g);
						return t && n + g > this.pageWidth - this.offsetX ? (this.position = "left", this.calcPos(!1)) : {
							top: clamp(x + (p - _) / 2, this.offsetY, this.pageHeight - _ - this.offsetY),
							left: n
						};
					}
					case "bottom": {
						let n = clamp(C + this.offsetY, 0, this.pageHeight - _);
						return t && n + _ > this.pageHeight - this.offsetY ? (this.position = "top", this.calcPos(!1)) : {
							top: n,
							left: clamp(v - g / 2 + f / 2, this.offsetX, this.pageWidth - g - this.offsetX)
						};
					}
					case "left": {
						let n = Math.max(0, v - g - this.offsetX);
						return t && n + g > v - this.offsetX ? (this.position = "right", this.calcPos(!1)) : {
							top: clamp(x + (p - _) / 2, this.offsetY, this.pageHeight - _ - this.offsetY),
							left: n
						};
					}
					default: return {
						top: 0,
						left: 0
					};
				}
			}
			destroy(t = !1) {
				if (!this.container) return this;
				if (this.showed = !1, this.onResizeObserver?.disconnect(), this.intersectionObserver?.disconnect(), t) return this.container.remove(), this;
				let n = this.container;
				return n.style.opacity = "0", n.addEventListener("transitionend", () => {
					n?.remove();
				}, { once: !0 }), this;
			}
			set bordered(t) {
				this._bordered = t, this.container?.classList.toggle("vot-tooltip-bordered");
			}
			get bordered() {
				return this._bordered;
			}
		}
		class SubtitlesProcessor {
			static formatYandexTokens(t) {
				let n = t.startMs + t.durationMs;
				return t.tokens.reduce((i, s, d) => {
					let f = t.tokens[d + 1], p = i[i.length - 1], m = p?.alignRange?.end ?? 0, h = m + s.text.length;
					if (s.alignRange = {
						start: m,
						end: h
					}, i.push(s), f) {
						let t = s.startMs + s.durationMs, d = f.startMs ? f.startMs - t : n - t;
						i.push({
							text: " ",
							startMs: t,
							durationMs: d,
							alignRange: {
								start: h,
								end: h + 1
							}
						});
					}
					return i;
				}, []);
			}
			static createTokens(t, n) {
				let i = t.text.split(/([\n \t])/).reduce((t, i) => {
					if (!i.length) return t;
					let s = t[t.length - 1] ?? n, d = s?.alignRange?.end ?? 0, f = d + i.length;
					return t.push({
						text: i,
						alignRange: {
							start: d,
							end: f
						}
					}), t;
				}, []), s = Math.floor(t.durationMs / i.length), d = t.startMs + t.durationMs;
				return i.map((n, f) => {
					let p = f === i.length - 1, m = t.startMs + s * f, h = p ? d - m : s;
					return {
						...n,
						startMs: m,
						durationMs: h
					};
				});
			}
			static processTokens(t, n) {
				let i = [], s, { source: d, isAutoGenerated: f } = n;
				for (let n of t.subtitles) {
					let t = n?.tokens?.length, p = t && (d === "yandex" || d === "youtube" && f) ? SubtitlesProcessor.formatYandexTokens(n) : SubtitlesProcessor.createTokens(n, s);
					s = p[p.length - 1], i.push({
						...n,
						tokens: p
					});
				}
				return t.containsTokens = !0, i;
			}
			static formatYoutubeSubtitles(t, n = !1) {
				if (!t?.events?.length) return console.error("[VOT] Invalid YouTube subtitles format:", t), {
					containsTokens: n,
					subtitles: []
				};
				let i = {
					containsTokens: n,
					subtitles: []
				};
				for (let s = 0; s < t.events.length; s++) {
					let d = t.events[s];
					if (!d.segs) continue;
					let f = d.dDurationMs;
					t.events[s + 1] && d.tStartMs + d.dDurationMs > t.events[s + 1].tStartMs && (f = t.events[s + 1].tStartMs - d.tStartMs);
					let p = [], m = f;
					for (let t = 0; t < d.segs.length; t++) {
						let n = d.segs[t], i = n.utf8.trim();
						if (i === "\n") continue;
						let s = n.tOffsetMs ?? 0, h = f, g = d.segs[t + 1];
						g?.tOffsetMs && (h = g.tOffsetMs - s, m -= h), p.push({
							text: i,
							startMs: d.tStartMs + s,
							durationMs: g ? h : m
						});
					}
					let h = p.map((t) => t.text).join(" ");
					h && i.subtitles.push({
						text: h,
						startMs: d.tStartMs,
						durationMs: f,
						...n ? { tokens: p } : {}
					});
				}
				return i;
			}
			static cleanJsonSubtitles(t) {
				let { containsTokens: n, subtitles: i } = t;
				return {
					containsTokens: n,
					subtitles: i.map((t) => ({
						...t,
						text: t.text.replace(/(<([^>]+)>)/gi, "")
					}))
				};
			}
			static async fetchSubtitles(t) {
				let { source: n, isAutoGenerated: i, format: s, url: d } = t;
				try {
					let f = await GM_fetch(d, { timeout: 7e3 }), p;
					if (["vtt", "srt"].includes(s)) {
						let t = await f.text();
						p = convertSubs(t, "json");
					} else p = await f.json();
					return n === "youtube" ? p = SubtitlesProcessor.formatYoutubeSubtitles(p, i) : n === "vk" && (p = SubtitlesProcessor.cleanJsonSubtitles(p)), p.subtitles = SubtitlesProcessor.processTokens(p, t), console.log("[VOT] Processed subtitles:", p), p;
				} catch (t) {
					return console.error("[VOT] Failed to process subtitles:", t), {
						containsTokens: !1,
						subtitles: []
					};
				}
			}
			static async getSubtitles(t, n) {
				let { host: i, url: s, detectedLanguage: d, videoId: f, duration: p, subtitles: m = [] } = n;
				try {
					let n = await Promise.race([t.getSubtitles({
						videoData: {
							host: i,
							url: s,
							videoId: f,
							duration: p
						},
						requestLang: d
					}), timeout(5e3, "Timeout")]);
					console.log("[VOT] Subtitles response:", n), n.waiting && console.error("[VOT] Failed to get Yandex subtitles");
					let h = (n.subtitles ?? []).reduce((t, n) => (n.language && !t.find((t) => t.source === "yandex" && t.language === n.language && !t.translatedFromLanguage) && t.push({
						source: "yandex",
						format: "json",
						language: n.language,
						url: n.url
					}), n.translatedLanguage && t.push({
						source: "yandex",
						format: "json",
						language: n.translatedLanguage,
						translatedFromLanguage: n.language,
						url: n.translatedUrl
					}), t), []);
					return [...h, ...m].sort((t, n) => {
						if (t.source !== n.source) return t.source === "yandex" ? -1 : 1;
						if (t.language !== n.language && (t.language === G || n.language === G)) return t.language === G ? -1 : 1;
						if (t.source === "yandex") {
							if (t.translatedFromLanguage !== n.translatedFromLanguage) return !t.translatedFromLanguage || !n.translatedFromLanguage ? t.language === n.language ? t.translatedFromLanguage ? 1 : -1 : t.translatedFromLanguage ? -1 : 1 : t.translatedFromLanguage === d ? -1 : 1;
							if (!t.translatedFromLanguage) return t.language === d ? -1 : 1;
						}
						return t.source !== "yandex" && t.isAutoGenerated !== n.isAutoGenerated ? t.isAutoGenerated ? 1 : -1 : 0;
					});
				} catch (t) {
					let n = t.message === "Timeout" ? "Failed to get Yandex subtitles: timeout" : "Error in getSubtitles function";
					throw console.error(`[VOT] ${n}`, t), t;
				}
			}
		}
		class SubtitlesWidget {
			constructor(t, n, i, s, d = void 0) {
				this.video = t, this.container = n, this.site = i, this.tooltipLayoutRoot = d, this.portal = s, this.subtitlesContainer = this.createSubtitlesContainer(), this.position = {
					left: 25,
					top: 75
				}, this.dragging = {
					active: !1,
					offset: {
						x: 0,
						y: 0
					}
				}, this.subtitles = null, this.subtitleLang = void 0, this.lastContent = null, this.highlightWords = !1, this.fontSize = 20, this.opacity = .2, this.maxLength = 300, this.abortController = new AbortController(), this.bindEvents(), this.updateContainerRect();
			}
			createSubtitlesContainer() {
				return this.subtitlesContainer = document.createElement("vot-block"), this.subtitlesContainer.classList.add("vot-subtitles-widget"), this.container.appendChild(this.subtitlesContainer), this.subtitlesContainer;
			}
			bindEvents() {
				let { signal: t } = this.abortController;
				this.onPointerDownBound = (t) => this.onPointerDown(t), this.onPointerUpBound = () => this.onPointerUp(), this.onPointerMoveBound = (t) => this.onPointerMove(t), this.onTimeUpdateBound = () => this.update(), document.addEventListener("pointerdown", this.onPointerDownBound, { signal: t }), document.addEventListener("pointerup", this.onPointerUpBound, { signal: t }), document.addEventListener("pointermove", this.onPointerMoveBound, { signal: t }), this.video?.addEventListener("timeupdate", this.onTimeUpdateBound, { signal: t }), this.resizeObserver = new ResizeObserver(() => this.onResize()), this.resizeObserver.observe(this.container);
			}
			onPointerDown(t) {
				if (!this.subtitlesContainer.contains(t.target)) return;
				let n = this.subtitlesContainer.getBoundingClientRect(), i = this.container.getBoundingClientRect();
				this.dragging = {
					active: !0,
					offset: {
						x: t.clientX - n.left,
						y: t.clientY - n.top
					},
					containerOffset: {
						x: i.left,
						y: i.top
					}
				};
			}
			onPointerUp() {
				this.dragging.active = !1;
			}
			onPointerMove(t) {
				if (!this.dragging.active) return;
				t.preventDefault();
				let { width: n, height: i } = this.container.getBoundingClientRect(), { containerOffset: s, offset: d } = this.dragging;
				this.position = {
					left: (t.clientX - d.x - s.x) / n * 100,
					top: (t.clientY - d.y - s.y) / i * 100
				}, this.applySubtitlePosition();
			}
			onResize() {
				this.updateContainerRect();
			}
			updateContainerRect() {
				this.containerRect = this.container.getBoundingClientRect(), this.applySubtitlePosition();
			}
			applySubtitlePosition() {
				let { width: t, height: n } = this.containerRect, { offsetWidth: i, offsetHeight: s } = this.subtitlesContainer, d = (t - i) / t * 100, f = (n - s) / n * 100;
				this.position.left = Math.max(0, Math.min(this.position.left, d)), this.position.top = Math.max(0, Math.min(this.position.top, f)), this.subtitlesContainer.style.left = `${this.position.left}%`, this.subtitlesContainer.style.top = `${this.position.top}%`, this.tokenTooltip?.updatePos();
			}
			processTokens(t) {
				if (t.at(-1).alignRange.end <= this.maxLength) return t;
				let n = [], i = [], s = 0;
				for (let d of t) s += d.text.length, i.push(d), s > this.maxLength && (n.push(this.trimChunk(i)), i = [], s = 0);
				i.length && n.push(this.trimChunk(i));
				let d = this.video.currentTime * 1e3;
				return n.find((t) => t[0].startMs < d && d < t.at(-1).startMs + t.at(-1).durationMs) || n[0];
			}
			trimChunk(t) {
				return t[0]?.text === " " && t.shift(), t.at(-1)?.text === " " && t.pop(), t;
			}
			async translateStrTokens(t) {
				let n = this.subtitleLang, i = J.lang;
				if (this.strTranslatedTokens) {
					let s = await translate(t, n, i);
					return [this.strTranslatedTokens, s];
				}
				let s = await translate([this.strTokens, t], n, i);
				return this.strTranslatedTokens = s[0], s;
			}
			releaseTooltip() {
				return this.tokenTooltip && (this.tokenTooltip.target.classList.remove("selected"), this.tokenTooltip.release(), this.tokenTooltip = void 0), this;
			}
			onClick = async (t) => {
				if (this.tokenTooltip?.target === t.target && this.tokenTooltip?.container) {
					this.tokenTooltip.showed ? t.target.classList.add("selected") : t.target.classList.remove("selected");
					return;
				}
				this.releaseTooltip(), t.target.classList.add("selected");
				let n = t.target.textContent.trim().replace(/[.|,]/, ""), i = await q.get("translationService", Qe), s = UI.createSubtitleInfo(n, this.strTranslatedTokens || this.strTokens, i);
				this.tokenTooltip = new Tooltip({
					target: t.target,
					anchor: this.subtitlesBlock,
					layoutRoot: this.tooltipLayoutRoot,
					content: s.container,
					parentElement: this.portal,
					maxWidth: this.subtitlesContainer.offsetWidth,
					borderRadius: 12,
					bordered: !1,
					position: "top",
					trigger: "click"
				}), this.tokenTooltip.create();
				let d = this.strTokens, f = await this.translateStrTokens(n);
				d !== this.strTokens || !this.tokenTooltip?.showed || (s.header.textContent = f[1], s.context.textContent = f[0], this.tokenTooltip.setContent(s.container), this.tokenTooltip.create());
			};
			renderTokens(t, n) {
				return t.map((t) => {
					let i = this.highlightWords && (n > t.startMs + t.durationMs / 2 || n > t.startMs - 100 && t.startMs + t.durationMs / 2 - n < 275);
					return Wt`<span
        @click="${this.onClick}"
        class="${i ? "passed" : ""}"
      >
        ${t.text.replace("\\n", "<br>")}
      </span>`;
				});
			}
			setContent(t, n = void 0) {
				if (this.releaseTooltip(), this.subtitleLang = n, !t || !this.video) {
					this.subtitles = null, B(null, this.subtitlesContainer);
					return;
				}
				this.subtitles = t, this.update();
			}
			setMaxLength(t) {
				typeof t == "number" && t > 0 && (this.maxLength = t, this.update());
			}
			setHighlightWords(t) {
				this.highlightWords = !!t, this.update();
			}
			setFontSize(t) {
				this.fontSize = t, this.subtitlesBlock && (this.subtitlesBlock.style.fontSize = `${t}px`);
			}
			setOpacity(t) {
				this.opacity = ((100 - t) / 100).toFixed(2), this.subtitlesBlock && this.subtitlesBlock.style.setProperty("--vot-subtitles-opacity", this.opacity);
			}
			stringifyTokens(t) {
				return t.map((t) => t.text).join("");
			}
			update() {
				if (!this.video || !this.subtitles) return;
				let t = this.video.currentTime * 1e3, n = this.subtitles.subtitles.findLast((n) => n.startMs < t && t < n.startMs + n.durationMs);
				if (!n) {
					B(null, this.subtitlesContainer), this.subtitlesBlock = null, this.releaseTooltip();
					return;
				}
				let i = this.processTokens(n.tokens), s = this.renderTokens(i, t), d = JSON.stringify(s);
				if (d !== this.lastContent) {
					this.lastContent = d;
					let t = this.stringifyTokens(i);
					t !== this.strTokens && (this.releaseTooltip(), this.strTokens = t, this.strTranslatedTokens = ""), B(Wt`<vot-block
          class="vot-subtitles"
          style="font-size: ${this.fontSize}px; --vot-subtitles-opacity: ${this.opacity}"
          >${s}</vot-block
        >`, this.subtitlesContainer), this.subtitlesBlock = this.subtitlesContainer.querySelector(".vot-subtitles");
				}
			}
			release() {
				this.abortController.abort(), this.resizeObserver.disconnect(), this.releaseTooltip(), this.subtitlesContainer.remove();
			}
		}
		let an = "vot_iframe", isIframe = () => window.self !== window.top, generateMessageId = () => `main-world-bridge-${performance.now()}-${Math.random()}`, hasServiceIframe = (t) => document.getElementById(t);
		async function setupServiceIframe(t, n, i) {
			let s = document.createElement("iframe");
			s.style.position = "absolute", s.style.zIndex = "-1", s.style.display = "none", s.id = n, s.src = `${t}#${an}`, document.body.appendChild(s);
			let d = new Promise((t) => {
				let handleMessage = ({ data: n }) => {
					n.messageType === `say-${i}-iframe-is-ready` && (window.removeEventListener("message", handleMessage), t(!0));
				};
				window.addEventListener("message", handleMessage);
			});
			return await Promise.race([d, timeout(15e3, "Service iframe did not have time to be ready")]), s;
		}
		async function ensureServiceIframe(t, n, i, s) {
			if (n.includes("#")) throw Error("The src parameter should not contain a hash (#) character.");
			if (hasServiceIframe(i)) {
				if (t !== null) return t;
				throw Error("Service iframe already exists in DOM, but added not by us.");
			}
			return t = await setupServiceIframe(n, i, s), t;
		}
		function initIframeService(t, n) {
			window.addEventListener("message", n), window.parent.postMessage({
				messageType: `say-${t}-iframe-is-ready`,
				messageDirection: "response"
			}, "*");
		}
		function requestDataFromMainWorld(t, n) {
			let i = generateMessageId();
			return new Promise((s, d) => {
				let handleMessage = ({ data: n }) => {
					n?.messageId === i && n.messageType === t && n.messageDirection === "response" && (window.removeEventListener("message", handleMessage), n.error ? d(n.error) : s(n.payload));
				};
				window.addEventListener("message", handleMessage), window.postMessage({
					messageId: i,
					messageType: t,
					messageDirection: "request",
					...n !== void 0 && { payload: n }
				}, "*");
			});
		}
		function syncVolume(t, n, i, s) {
			let d = n;
			return n > s ? (d = i + (n - s), d = d > 100 ? 100 : Math.max(d, 0), t.volume = d / 100) : n < s && (d = i - (s - n), d = d > 100 ? 100 : Math.max(d, 0), t.volume = d / 100), d;
		}
		var on = __webpack_require__("./node_modules/requestidlecallback-polyfill/index.js");
		class EventImpl {
			listeners;
			constructor() {
				this.listeners = new Set();
			}
			addListener(t) {
				if (this.listeners.has(t)) throw Error("[VOT] The listener has already been added.");
				this.listeners.add(t);
			}
			removeListener(t) {
				this.listeners.delete(t);
			}
			dispatch(...t) {
				for (let n of this.listeners) try {
					n(...t);
				} catch (t) {
					console.error("[VOT]", t);
				}
			}
			clear() {
				this.listeners.clear();
			}
		}
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
				"sponsored"
			]);
			constructor() {
				this.videoCache = new WeakSet(), this.observedNodes = {
					added: new Set(),
					removed: new Set()
				}, this.onVideoAdded = new EventImpl(), this.onVideoRemoved = new EventImpl(), this.observer = new MutationObserver(this.handleMutations);
			}
			isAdRelated(t) {
				let n = [
					"class",
					"id",
					"title"
				];
				for (let i of n) {
					let n = t.getAttribute(i);
					if (n && VideoObserver.adKeywords.has(n.toLowerCase())) return !0;
				}
				return !1;
			}
			hasAudio(t) {
				return t.mozHasAudio === void 0 ? t.webkitAudioDecodedByteCount === void 0 ? "audioTracks" in t && t.audioTracks.length > 0 || !t.muted : t.webkitAudioDecodedByteCount > 0 : t.mozHasAudio;
			}
			isValidVideo(t) {
				if (this.isAdRelated(t)) return !1;
				let n = t.parentElement;
				for (; n && !this.isAdRelated(n);) n = n.parentElement;
				return n ? !1 : this.hasAudio(t) ? !0 : (U.log("Ignoring video without audio:", t), !1);
			}
			traverseDOM(t) {
				if (t instanceof HTMLVideoElement) {
					this.checkVideoState(t);
					return;
				}
				let n = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT, { acceptNode: (t) => t.tagName === "VIDEO" || t.shadowRoot ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
				for (; n.nextNode();) {
					let t = n.currentNode;
					t instanceof HTMLVideoElement && this.checkVideoState(t), t.shadowRoot && this.traverseDOM(t.shadowRoot);
				}
			}
			checkVideoState(t) {
				if (this.videoCache.has(t)) return;
				this.videoCache.add(t);
				let onLoadedData = () => {
					this.isValidVideo(t) && this.onVideoAdded.dispatch(t), t.removeEventListener("loadeddata", onLoadedData);
				}, onEmptied = () => {
					t.isConnected || (this.onVideoRemoved.dispatch(t), this.videoCache.delete(t), t.removeEventListener("emptied", onEmptied));
				};
				t.addEventListener("emptied", onEmptied), t.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ? onLoadedData() : t.addEventListener("loadeddata", onLoadedData);
			}
			handleMutations = (t) => {
				for (let n of t) {
					if (n.type !== "childList") continue;
					for (let t of n.addedNodes) this.observedNodes.added.add(t);
					for (let t of n.removedNodes) this.observedNodes.removed.add(t);
				}
				window.requestIdleCallback(() => {
					for (let t of this.observedNodes.added) this.traverseDOM(t);
					for (let t of this.observedNodes.removed) if (t.querySelectorAll) {
						let n = t.querySelectorAll("video");
						for (let t of n) t.isConnected || (this.onVideoRemoved.dispatch(t), this.videoCache.delete(t));
					}
					this.observedNodes.added.clear(), this.observedNodes.removed.clear();
				}, { timeout: 1e3 });
			};
			enable() {
				this.observer.observe(document.documentElement, {
					childList: !0,
					subtree: !0
				}), this.traverseDOM(document.documentElement);
			}
			disable() {
				this.observer.disconnect(), this.videoCache = new WeakSet();
			}
		}
		function browser_id3_writer_e(t) {
			return String(t).split("").map((t) => t.charCodeAt(0));
		}
		function browser_id3_writer_t(t) {
			return new Uint8Array(browser_id3_writer_e(t));
		}
		function browser_id3_writer_a(t) {
			let n = new ArrayBuffer(2 * t.length), i = new Uint8Array(n);
			return new Uint16Array(n).set(browser_id3_writer_e(t)), i;
		}
		function browser_id3_writer_r(t) {
			let n = 255;
			return [
				t >>> 24 & n,
				t >>> 16 & n,
				t >>> 8 & n,
				t & n
			];
		}
		function browser_id3_writer_n(t) {
			return 11 + t;
		}
		function browser_id3_writer_s(t, n, i, s) {
			return 11 + n + 1 + 1 + (s ? 2 + 2 * (i + 1) : i + 1) + t;
		}
		function browser_id3_writer_i(t) {
			let n = 0;
			return t.forEach((t) => {
				n += 2 + 2 * t[0].length + 2 + 2 + 2 * t[1].length + 2;
			}), 11 + n;
		}
		function browser_id3_writer_c(t, n) {
			let i = 2 * n, s = 0;
			return t.forEach((t) => {
				s += 2 + 2 * t[0].length + 2 + 4;
			}), 18 + i + 2 + s;
		}
		class browser_id3_writer_o {
			_setIntegerFrame(t, n) {
				let i = parseInt(n, 10);
				this.frames.push({
					name: t,
					value: i,
					size: browser_id3_writer_n(i.toString().length)
				});
			}
			_setStringFrame(t, n) {
				let i = n.toString(), s = 13 + 2 * i.length;
				t === "TDAT" && (s = browser_id3_writer_n(i.length)), this.frames.push({
					name: t,
					value: i,
					size: s
				});
			}
			_setPictureFrame(t, n, i, s) {
				let d = function(t) {
					if (!t || !t.length) return null;
					if (t[0] === 255 && t[1] === 216 && t[2] === 255) return "image/jpeg";
					if (t[0] === 137 && t[1] === 80 && t[2] === 78 && t[3] === 71) return "image/png";
					if (t[0] === 71 && t[1] === 73 && t[2] === 70) return "image/gif";
					if (t[8] === 87 && t[9] === 69 && t[10] === 66 && t[11] === 80) return "image/webp";
					let n = t[0] === 73 && t[1] === 73 && t[2] === 42 && t[3] === 0, i = t[0] === 77 && t[1] === 77 && t[2] === 0 && t[3] === 42;
					return n || i ? "image/tiff" : t[0] === 66 && t[1] === 77 ? "image/bmp" : t[0] === 0 && t[1] === 0 && t[2] === 1 && t[3] === 0 ? "image/x-icon" : null;
				}(new Uint8Array(n)), f = i.toString();
				if (!d) throw Error("Unknown picture MIME type");
				i || (s = !1), this.frames.push({
					name: "APIC",
					value: n,
					pictureType: t,
					mimeType: d,
					useUnicodeEncoding: s,
					description: f,
					size: browser_id3_writer_s(n.byteLength, d.length, f.length, s)
				});
			}
			_setLyricsFrame(t, n, i) {
				let s = t.split("").map((t) => t.charCodeAt(0)), d = n.toString(), f = i.toString();
				var p, m;
				this.frames.push({
					name: "USLT",
					value: f,
					language: s,
					description: d,
					size: (p = d.length, m = f.length, 16 + 2 * p + 2 + 2 + 2 * m)
				});
			}
			_setCommentFrame(t, n, i) {
				let s = t.split("").map((t) => t.charCodeAt(0)), d = n.toString(), f = i.toString();
				var p, m;
				this.frames.push({
					name: "COMM",
					value: f,
					language: s,
					description: d,
					size: (p = d.length, m = f.length, 16 + 2 * p + 2 + 2 + 2 * m)
				});
			}
			_setPrivateFrame(t, n) {
				let i = t.toString();
				var s, d;
				this.frames.push({
					name: "PRIV",
					value: n,
					id: i,
					size: (s = i.length, d = n.byteLength, 10 + s + 1 + d)
				});
			}
			_setUserStringFrame(t, n) {
				let i = t.toString(), s = n.toString();
				var d, f;
				this.frames.push({
					name: "TXXX",
					description: i,
					value: s,
					size: (d = i.length, f = s.length, 13 + 2 * d + 2 + 2 + 2 * f)
				});
			}
			_setUrlLinkFrame(t, n) {
				let i = n.toString();
				var s;
				this.frames.push({
					name: t,
					value: i,
					size: (s = i.length, 10 + s)
				});
			}
			_setPairedTextFrame(t, n) {
				this.frames.push({
					name: t,
					value: n,
					size: browser_id3_writer_i(n)
				});
			}
			_setSynchronisedLyricsFrame(t, n, i, s, d) {
				let f = d.toString(), p = s.split("").map((t) => t.charCodeAt(0));
				this.frames.push({
					name: "SYLT",
					value: n,
					language: p,
					description: f,
					type: t,
					timestampFormat: i,
					size: browser_id3_writer_c(n, f.length)
				});
			}
			constructor(t) {
				if (!t || typeof t != "object" || !("byteLength" in t)) throw Error("First argument should be an instance of ArrayBuffer or Buffer");
				this.arrayBuffer = t, this.padding = 4096, this.frames = [], this.url = "";
			}
			setFrame(t, n) {
				switch (t) {
					case "TPE1":
					case "TCOM":
					case "TCON": {
						if (!Array.isArray(n)) throw Error(`${t} frame value should be an array of strings`);
						let i = t === "TCON" ? ";" : "/", s = n.join(i);
						this._setStringFrame(t, s);
						break;
					}
					case "TLAN":
					case "TIT1":
					case "TIT2":
					case "TIT3":
					case "TALB":
					case "TPE2":
					case "TPE3":
					case "TPE4":
					case "TRCK":
					case "TPOS":
					case "TMED":
					case "TPUB":
					case "TCOP":
					case "TKEY":
					case "TEXT":
					case "TDAT":
					case "TCMP":
					case "TSRC":
						this._setStringFrame(t, n);
						break;
					case "TBPM":
					case "TLEN":
					case "TYER":
						this._setIntegerFrame(t, n);
						break;
					case "USLT":
						if (n.language = n.language || "eng", typeof n != "object" || !("description" in n) || !("lyrics" in n)) throw Error("USLT frame value should be an object with keys description and lyrics");
						if (n.language && !n.language.match(/[a-z]{3}/i)) throw Error("Language must be coded following the ISO 639-2 standards");
						this._setLyricsFrame(n.language, n.description, n.lyrics);
						break;
					case "APIC":
						if (typeof n != "object" || !("type" in n) || !("data" in n) || !("description" in n)) throw Error("APIC frame value should be an object with keys type, data and description");
						if (n.type < 0 || n.type > 20) throw Error("Incorrect APIC frame picture type");
						this._setPictureFrame(n.type, n.data, n.description, !!n.useUnicodeEncoding);
						break;
					case "TXXX":
						if (typeof n != "object" || !("description" in n) || !("value" in n)) throw Error("TXXX frame value should be an object with keys description and value");
						this._setUserStringFrame(n.description, n.value);
						break;
					case "WCOM":
					case "WCOP":
					case "WOAF":
					case "WOAR":
					case "WOAS":
					case "WORS":
					case "WPAY":
					case "WPUB":
						this._setUrlLinkFrame(t, n);
						break;
					case "COMM":
						if (n.language = n.language || "eng", typeof n != "object" || !("description" in n) || !("text" in n)) throw Error("COMM frame value should be an object with keys description and text");
						if (n.language && !n.language.match(/[a-z]{3}/i)) throw Error("Language must be coded following the ISO 639-2 standards");
						this._setCommentFrame(n.language, n.description, n.text);
						break;
					case "PRIV":
						if (typeof n != "object" || !("id" in n) || !("data" in n)) throw Error("PRIV frame value should be an object with keys id and data");
						this._setPrivateFrame(n.id, n.data);
						break;
					case "IPLS":
						if (!Array.isArray(n) || !Array.isArray(n[0])) throw Error("IPLS frame value should be an array of pairs");
						this._setPairedTextFrame(t, n);
						break;
					case "SYLT":
						if (typeof n != "object" || !("type" in n) || !("text" in n) || !("timestampFormat" in n)) throw Error("SYLT frame value should be an object with keys type, text and timestampFormat");
						if (!Array.isArray(n.text) || !Array.isArray(n.text[0])) throw Error("SYLT frame text value should be an array of pairs");
						if (n.type < 0 || n.type > 6) throw Error("Incorrect SYLT frame content type");
						if (n.timestampFormat < 1 || n.timestampFormat > 2) throw Error("Incorrect SYLT frame time stamp format");
						n.language = n.language || "eng", n.description = n.description || "", this._setSynchronisedLyricsFrame(n.type, n.text, n.timestampFormat, n.language, n.description);
						break;
					default: throw Error(`Unsupported frame ${t}`);
				}
				return this;
			}
			removeTag() {
				if (this.arrayBuffer.byteLength < 10) return;
				let t = new Uint8Array(this.arrayBuffer), n = t[3], i = ((s = [
					t[6],
					t[7],
					t[8],
					t[9]
				])[0] << 21) + (s[1] << 14) + (s[2] << 7) + s[3] + 10;
				var s, d;
				(d = t)[0] !== 73 || d[1] !== 68 || d[2] !== 51 || n < 2 || n > 4 || (this.arrayBuffer = new Uint8Array(t.subarray(i)).buffer);
			}
			addTag() {
				this.removeTag();
				let t = [255, 254], n = 10 + this.frames.reduce((t, n) => t + n.size, 0) + this.padding, i = new ArrayBuffer(this.arrayBuffer.byteLength + n), s = new Uint8Array(i), d = 0, f = [];
				return f = [
					73,
					68,
					51,
					3
				], s.set(f, d), d += f.length, d++, d++, f = function(t) {
					let n = 127;
					return [
						t >>> 21 & n,
						t >>> 14 & n,
						t >>> 7 & n,
						t & n
					];
				}(n - 10), s.set(f, d), d += f.length, this.frames.forEach((n) => {
					switch (f = browser_id3_writer_t(n.name), s.set(f, d), d += f.length, f = browser_id3_writer_r(n.size - 10), s.set(f, d), d += f.length, d += 2, n.name) {
						case "WCOM":
						case "WCOP":
						case "WOAF":
						case "WOAR":
						case "WOAS":
						case "WORS":
						case "WPAY":
						case "WPUB":
							f = browser_id3_writer_t(n.value), s.set(f, d), d += f.length;
							break;
						case "TPE1":
						case "TCOM":
						case "TCON":
						case "TLAN":
						case "TIT1":
						case "TIT2":
						case "TIT3":
						case "TALB":
						case "TPE2":
						case "TPE3":
						case "TPE4":
						case "TRCK":
						case "TPOS":
						case "TKEY":
						case "TMED":
						case "TPUB":
						case "TCOP":
						case "TEXT":
						case "TSRC":
							f = [1].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n.value), s.set(f, d), d += f.length;
							break;
						case "TXXX":
						case "USLT":
						case "COMM":
							f = [1], n.name !== "USLT" && n.name !== "COMM" || (f = f.concat(n.language)), f = f.concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n.description), s.set(f, d), d += f.length, f = [0, 0].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n.value), s.set(f, d), d += f.length;
							break;
						case "TBPM":
						case "TLEN":
						case "TDAT":
						case "TYER":
							d++, f = browser_id3_writer_t(n.value), s.set(f, d), d += f.length;
							break;
						case "PRIV":
							f = browser_id3_writer_t(n.id), s.set(f, d), d += f.length, d++, s.set(new Uint8Array(n.value), d), d += n.value.byteLength;
							break;
						case "APIC":
							f = [n.useUnicodeEncoding ? 1 : 0], s.set(f, d), d += f.length, f = browser_id3_writer_t(n.mimeType), s.set(f, d), d += f.length, f = [0, n.pictureType], s.set(f, d), d += f.length, n.useUnicodeEncoding ? (f = [].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n.description), s.set(f, d), d += f.length, d += 2) : (f = browser_id3_writer_t(n.description), s.set(f, d), d += f.length, d++), s.set(new Uint8Array(n.value), d), d += n.value.byteLength;
							break;
						case "IPLS":
							f = [1], s.set(f, d), d += f.length, n.value.forEach((n) => {
								f = [].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n[0].toString()), s.set(f, d), d += f.length, f = [0, 0].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n[1].toString()), s.set(f, d), d += f.length, f = [0, 0], s.set(f, d), d += f.length;
							});
							break;
						case "SYLT": f = [1].concat(n.language, n.timestampFormat, n.type), s.set(f, d), d += f.length, f = [].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n.description), s.set(f, d), d += f.length, d += 2, n.value.forEach((n) => {
							f = [].concat(t), s.set(f, d), d += f.length, f = browser_id3_writer_a(n[0].toString()), s.set(f, d), d += f.length, f = [0, 0], s.set(f, d), d += f.length, f = browser_id3_writer_r(n[1]), s.set(f, d), d += f.length;
						});
					}
				}), d += this.padding, s.set(new Uint8Array(this.arrayBuffer), d), this.arrayBuffer = i, i;
			}
			getBlob() {
				return new Blob([this.arrayBuffer], { type: "audio/mpeg" });
			}
			getURL() {
				return this.url ||= URL.createObjectURL(this.getBlob()), this.url;
			}
			revokeURL() {
				URL.revokeObjectURL(this.url);
			}
		}
		let sn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
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
</svg>`, cn = Q`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M120-520q-17 0-28.5-11.5T80-560q0-17 11.5-28.5T120-600h104L80-743q-12-12-12-28.5T80-800q12-12 28.5-12t28.5 12l143 144v-104q0-17 11.5-28.5T320-800q17 0 28.5 11.5T360-760v200q0 17-11.5 28.5T320-520H120Zm40 360q-33 0-56.5-23.5T80-240v-160q0-17 11.5-28.5T120-440q17 0 28.5 11.5T160-400v160h280q17 0 28.5 11.5T480-200q0 17-11.5 28.5T440-160H160Zm680-280q-17 0-28.5-11.5T800-480v-240H480q-17 0-28.5-11.5T440-760q0-17 11.5-28.5T480-800h320q33 0 56.5 23.5T880-720v240q0 17-11.5 28.5T840-440ZM600-160q-17 0-28.5-11.5T560-200v-120q0-17 11.5-28.5T600-360h240q17 0 28.5 11.5T880-320v120q0 17-11.5 28.5T840-160H600Z"
  />
</svg>`, ln = Q`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"
  />
</svg>`, un = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24" class="vot-loader" id="vot-loader-download">
  <path class="vot-loader-main" d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"/>
  <text class="vot-loader-text" dominant-baseline="middle" text-anchor="middle" x="50%" y="50%"></text>
</svg>`, dn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24">
  <path d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.588 1.413T20 20H4Zm2-4h8v-2H6v2Zm10 0h2v-2h-2v2ZM6 12h2v-2H6v2Zm4 0h8v-2h-8v2Z"/>
</svg>`, fn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 -960 960 960">
  <path d="M555-80H405q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-344q-8-13-5-28t15-24l75-57q-1-7-1-13.5v-27q0-6.5 1-13.5l-75-57q-12-9-15-24t5-28l74-129q7-14 21.5-17.5T220-761l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 129q8 13 5 28t-15 24l-75 57q1 7 1 13.5v27q0 6.5-2 13.5l75 57q12 9 15 24t-5 28l-74 128q-8 13-22.5 17.5T738-199l-85-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10Zm-73-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm0-80q-25 0-42.5-17.5T422-480q0-25 17.5-42.5T482-540q25 0 42.5 17.5T542-480q0 25-17.5 42.5T482-420Zm-2-60Zm-40 320h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Z"/>
</svg>`, pn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" >
  <path
    d="M12 14.975q-.2 0-.375-.062T11.3 14.7l-4.6-4.6q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062Z"
  />
</svg>`, mn = Q`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
  <path
    d="M647-440H200q-17 0-28.5-11.5T160-480q0-17 11.5-28.5T200-520h447L451-716q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l264 264q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L508-188q-11 11-27.5 11T452-188q-12-12-12-28.5t12-28.5l195-195Z"
  />
</svg>`, hn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 -960 960 960">
  <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
</svg>`, gn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none">
    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 11a1 1 0 1 1 0 2a1 1 0 0 1 0-2m0-9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1"/>
  </g>
</svg>`, _n = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none">
    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 12a1 1 0 1 1 0 2a1 1 0 0 1 0-2m0-9.5a3.625 3.625 0 0 1 1.348 6.99a.8.8 0 0 0-.305.201c-.044.05-.051.114-.05.18L13 14a1 1 0 0 1-1.993.117L11 14v-.25c0-1.153.93-1.845 1.604-2.116a1.626 1.626 0 1 0-2.229-1.509a1 1 0 1 1-2 0A3.625 3.625 0 0 1 12 6.5"/>
  </g>
</svg>`, vn = Q`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none">
    <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/>
    <path fill="currentColor" d="M20 9a1 1 0 0 1 1 1v1a8 8 0 0 1-8 8H9.414l.793.793a1 1 0 0 1-1.414 1.414l-2.496-2.496a1 1 0 0 1-.287-.567L6 17.991a1 1 0 0 1 .237-.638l.056-.06l2.5-2.5a1 1 0 0 1 1.414 1.414L9.414 17H13a6 6 0 0 0 6-6v-1a1 1 0 0 1 1-1m-4.793-6.207l2.5 2.5a1 1 0 0 1 0 1.414l-2.5 2.5a1 1 0 1 1-1.414-1.414L14.586 7H11a6 6 0 0 0-6 6v1a1 1 0 1 1-2 0v-1a8 8 0 0 1 8-8h3.586l-.793-.793a1 1 0 0 1 1.414-1.414"/>
  </g>
</svg>`;
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
			constructor({ titleHtml: t, isTemp: n = !1 }) {
				this._titleHtml = t, this._isTemp = n;
				let i = this.createElements();
				this.container = i.container, this.backdrop = i.backdrop, this.box = i.box, this.contentWrapper = i.contentWrapper, this.headerContainer = i.headerContainer, this.titleContainer = i.titleContainer, this.title = i.title, this.closeButton = i.closeButton, this.bodyContainer = i.bodyContainer, this.footerContainer = i.footerContainer;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-dialog-container"]);
				this._isTemp && t.classList.add("vot-dialog-temp"), t.hidden = !this._isTemp;
				let n = UI.createEl("vot-block", ["vot-dialog-backdrop"]), i = UI.createEl("vot-block", ["vot-dialog"]), s = UI.createEl("vot-block", ["vot-dialog-content-wrapper"]), d = UI.createEl("vot-block", ["vot-dialog-header-container"]), f = UI.createEl("vot-block", ["vot-dialog-title-container"]), p = UI.createEl("vot-block", ["vot-dialog-title"]);
				p.append(this._titleHtml), f.appendChild(p);
				let m = UI.createIconButton(hn);
				m.classList.add("vot-dialog-close-button"), n.onclick = m.onclick = () => this.close(), d.append(f, m);
				let h = UI.createEl("vot-block", ["vot-dialog-body-container"]), g = UI.createEl("vot-block", ["vot-dialog-footer-container"]);
				return s.append(d, h, g), i.appendChild(s), t.append(n, i), {
					container: t,
					backdrop: n,
					box: i,
					contentWrapper: s,
					headerContainer: d,
					titleContainer: f,
					title: p,
					closeButton: m,
					bodyContainer: h,
					footerContainer: g
				};
			}
			addEventListener(t, n) {
				return this.onClose.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onClose.removeListener(n), this;
			}
			open() {
				return this.hidden = !1, this;
			}
			remove() {
				return this.container.remove(), this.onClose.dispatch(), this;
			}
			close() {
				return this._isTemp ? this.remove() : (this.hidden = !0, this.onClose.dispatch(), this);
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
			get isDialogOpen() {
				return !this.container.hidden;
			}
		}
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
			constructor({ labelHtml: t = "", placeholder: n = "", value: i = "", multiline: s = !1 }) {
				this._labelHtml = t, this._multiline = s, this._placeholder = n, this._value = i;
				let d = this.createElements();
				this.container = d.container, this.input = d.input, this.label = d.label;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-textfield"]), n = document.createElement(this._multiline ? "textarea" : "input");
				this._labelHtml || n.classList.add("vot-show-placeholer"), n.placeholder = this._placeholder, n.value = this._value;
				let i = UI.createEl("span");
				return i.append(this._labelHtml), t.append(n, i), n.addEventListener("input", () => {
					this._value = this.input.value, this.onInput.dispatch(this._value);
				}), n.addEventListener("change", () => {
					this._value = this.input.value, this.onChange.dispatch(this._value);
				}), {
					container: t,
					label: i,
					input: n
				};
			}
			addEventListener(t, n) {
				return t === "change" ? this.onChange.addListener(n) : t === "input" && this.onInput.addListener(n), this;
			}
			removeEventListener(t, n) {
				return t === "change" ? this.onChange.removeListener(n) : t === "input" && this.onInput.removeListener(n), this;
			}
			get value() {
				return this._value;
			}
			set value(t) {
				this._value !== t && (this.input.value = this._value = t, this.onChange.dispatch(this._value));
			}
			get placeholder() {
				return this._placeholder;
			}
			set placeholder(t) {
				this.input.placeholder = this._placeholder = t;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		class Select {
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
			isLoading = !1;
			isDialogOpen = !1;
			onSelectItem = new EventImpl();
			onBeforeOpen = new EventImpl();
			contentList;
			selectedItems = [];
			selectedValues;
			constructor({ selectTitle: t, dialogTitle: n, items: i, labelElement: s, dialogParent: d = document.documentElement, multiSelect: f }) {
				this._selectTitle = t, this._dialogTitle = n, this._items = i, this.multiSelect = f ?? !1, this.labelElement = s, this.dialogParent = d, this.selectedValues = this.calcSelectedValues();
				let p = this.createElements();
				this.container = p.container, this.outer = p.outer, this.arrowIcon = p.arrowIcon, this.title = p.title;
			}
			static genLanguageItems(t, n) {
				return t.map((t) => {
					let i = `langs.${t}`, s = J.get(i);
					return {
						label: s === i ? t.toUpperCase() : s,
						value: t,
						selected: n === t
					};
				});
			}
			multiSelectItemHandle = (t, n) => {
				let i = n.value;
				this.selectedValues.has(i) && this.selectedValues.size > 1 ? (this.selectedValues.delete(i), n.selected = !1) : (this.selectedValues.add(i), n.selected = !0), t.dataset.votSelected = this.selectedValues.has(i).toString(), this.updateSelectedState(), this.onSelectItem.dispatch(Array.from(this.selectedValues));
			};
			singleSelectItemHandle = (t) => {
				let n = t.value;
				this.selectedValues = new Set([n]);
				for (let t of this.selectedItems) t.dataset.votSelected = (t.dataset.votValue === n).toString();
				for (let t of this._items) t.selected = t.value === n;
				this.updateTitle(), this.onSelectItem.dispatch(n);
			};
			createDialogContentList() {
				let t = UI.createEl("vot-block", ["vot-select-content-list"]);
				for (let n of this._items) {
					let i = UI.createEl("vot-block", ["vot-select-content-item"]);
					i.textContent = n.label, i.dataset.votSelected = n.selected === !0 ? "true" : "false", i.dataset.votValue = n.value, n.disabled && (i.inert = !0), i.addEventListener("click", (t) => {
						if (!t.target.inert) return this.multiSelect ? this.multiSelectItemHandle(i, n) : this.singleSelectItemHandle(n);
					}), t.appendChild(i);
				}
				return this.selectedItems = Object.values(t.childNodes), t;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-select"]);
				this.labelElement && t.append(this.labelElement);
				let n = UI.createEl("vot-block", ["vot-select-outer"]), i = UI.createEl("vot-block", ["vot-select-title"]);
				i.textContent = this.visibleText;
				let s = UI.createEl("vot-block", ["vot-select-arrow-icon"]);
				return B(pn, s), n.append(i, s), n.addEventListener("click", () => {
					if (!(this.isLoading || this.isDialogOpen)) try {
						this.isLoading = !0;
						let t = new Dialog({
							titleHtml: this._dialogTitle,
							isTemp: !0
						});
						this.onBeforeOpen.dispatch(t), this.dialogParent.appendChild(t.container);
						let n = new Textfield({ labelHtml: J.get("searchField") });
						n.addEventListener("input", (t) => {
							for (let n of this.selectedItems) n.hidden = !n.textContent?.toLowerCase().includes(t);
						}), this.contentList = this.createDialogContentList(), t.bodyContainer.append(n.container, this.contentList), t.addEventListener("close", () => {
							this.isDialogOpen = !1, this.selectedItems = [];
						});
					} finally {
						this.isLoading = !1;
					}
				}), t.appendChild(n), {
					container: t,
					outer: n,
					arrowIcon: s,
					title: i
				};
			}
			calcSelectedValues() {
				return new Set(this._items.filter((t) => t.selected).map((t) => t.value));
			}
			addEventListener(t, n) {
				return t === "selectItem" ? this.onSelectItem.addListener(n) : t === "beforeOpen" && this.onBeforeOpen.addListener(n), this;
			}
			removeEventListener(t, n) {
				return t === "selectItem" ? this.onSelectItem.removeListener(n) : t === "beforeOpen" && this.onBeforeOpen.removeListener(n), this;
			}
			updateTitle() {
				return this.title.textContent = this.visibleText, this;
			}
			updateSelectedState() {
				if (this.selectedItems.length > 0) for (let t of this.selectedItems) {
					let n = t.dataset.votValue;
					if (!n) continue;
					t.dataset.votSelected = this.selectedValues.has(n).toString();
				}
				return this.updateTitle(), this;
			}
			setSelectedValue(t) {
				this.multiSelect ? this.selectedValues = new Set(Array.isArray(t) ? t.map(String) : [String(t)]) : this.selectedValues = new Set([String(t)]);
				for (let t of this._items) t.selected = this.selectedValues.has(String(t.value));
				return this.updateSelectedState(), this;
			}
			updateItems(t) {
				this._items = t, this.selectedValues = this.calcSelectedValues(), this.updateSelectedState();
				let n = this.contentList?.parentElement;
				if (!this.contentList || !n) return this;
				let i = this.contentList;
				return this.contentList = this.createDialogContentList(), n.replaceChild(this.contentList, i), this;
			}
			get visibleText() {
				return this.multiSelect ? this._items.filter((t) => this.selectedValues.has(t.value)).map((t) => t.label).join(", ") ?? this._selectTitle : this._items.find((t) => t.selected)?.label ?? this._selectTitle;
			}
			set selectTitle(t) {
				this._selectTitle = t, this.updateTitle();
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
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
			constructor({ position: t = "default", titleHtml: n = "" }) {
				this._position = t, this._titleHtml = n;
				let i = this.createElements();
				this.container = i.container, this.contentWrapper = i.contentWrapper, this.headerContainer = i.headerContainer, this.bodyContainer = i.bodyContainer, this.footerContainer = i.footerContainer, this.titleContainer = i.titleContainer, this.title = i.title;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-menu"]);
				t.hidden = !0, t.dataset.position = this._position;
				let n = UI.createEl("vot-block", ["vot-menu-content-wrapper"]);
				t.appendChild(n);
				let i = UI.createEl("vot-block", ["vot-menu-header-container"]), s = UI.createEl("vot-block", ["vot-menu-title-container"]);
				i.appendChild(s);
				let d = UI.createEl("vot-block", ["vot-menu-title"]);
				d.append(this._titleHtml), s.appendChild(d);
				let f = UI.createEl("vot-block", ["vot-menu-body-container"]), p = UI.createEl("vot-block", ["vot-menu-footer-container"]);
				return n.append(i, f, p), {
					container: t,
					contentWrapper: n,
					headerContainer: i,
					bodyContainer: f,
					footerContainer: p,
					titleContainer: s,
					title: d
				};
			}
			setText(t) {
				return this._titleHtml = this.title.textContent = t, this;
			}
			remove() {
				return this.container.remove(), this;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
			get position() {
				return this._position;
			}
			set position(t) {
				this._position = this.container.dataset.position = t;
			}
		}
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
			constructor({ position: t = "default", direction: n = "default", status: i = "none", labelHtml: s = "" }) {
				this._position = t, this._direction = n, this._status = i, this._labelHtml = s;
				let d = this.createElements();
				this.container = d.container, this.translateButton = d.translateButton, this.separator = d.separator, this.pipButton = d.pipButton, this.separator2 = d.separator2, this.menuButton = d.menuButton, this.label = d.label;
			}
			static calcPosition(t, n) {
				return n ? t <= 44 ? "left" : t >= 66 ? "right" : "default" : "default";
			}
			static calcDirection(t) {
				return ["default", "top"].includes(t) ? "row" : "column";
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-segmented-button"]);
				t.dataset.position = this._position, t.dataset.direction = this._direction, t.dataset.status = this._status;
				let n = UI.createEl("vot-block", ["vot-segment", "vot-translate-button"]);
				B(sn, n);
				let i = UI.createEl("span", ["vot-segment-label"]);
				i.append(this._labelHtml), n.appendChild(i);
				let s = UI.createEl("vot-block", ["vot-separator"]), d = UI.createEl("vot-block", ["vot-segment-only-icon"]);
				B(cn, d);
				let f = UI.createEl("vot-block", ["vot-separator"]), p = UI.createEl("vot-block", ["vot-segment-only-icon"]);
				return B(ln, p), t.append(n, s, d, f, p), {
					container: t,
					translateButton: n,
					separator: s,
					pipButton: d,
					separator2: f,
					menuButton: p,
					label: i
				};
			}
			showPiPButton(t) {
				return this.separator2.hidden = this.pipButton.hidden = !t, this;
			}
			setText(t) {
				return this._labelHtml = this.label.textContent = t, this;
			}
			remove() {
				return this.container.remove(), this;
			}
			get tooltipPos() {
				switch (this.position) {
					case "left": return "right";
					case "right": return "left";
					default: return "bottom";
				}
			}
			set status(t) {
				this._status = this.container.dataset.status = t;
			}
			get status() {
				return this._status;
			}
			set loading(t) {
				this.container.dataset.loading = t.toString();
			}
			get loading() {
				return this.container.dataset.loading === "true";
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
			get position() {
				return this._position;
			}
			set position(t) {
				this._position = this.container.dataset.position = t;
			}
			get direction() {
				return this._direction;
			}
			set direction(t) {
				this._direction = this.container.dataset.direction = t;
			}
			set opacity(t) {
				this.container.style.opacity = t.toString();
			}
			get opacity() {
				return Number(this.container.style.opacity);
			}
		}
		class LanguagePairSelect {
			container;
			fromSelect;
			directionIcon;
			toSelect;
			dialogParent;
			_fromSelectTitle;
			_fromDialogTitle;
			_fromItems;
			_toSelectTitle;
			_toDialogTitle;
			_toItems;
			constructor({ from: { selectTitle: t = J.get("videoLanguage"), dialogTitle: n = J.get("videoLanguage"), items: i }, to: { selectTitle: s = J.get("translationLanguage"), dialogTitle: d = J.get("translationLanguage"), items: f }, dialogParent: p = document.documentElement }) {
				this._fromSelectTitle = t, this._fromDialogTitle = n, this._fromItems = i, this._toSelectTitle = s, this._toDialogTitle = d, this._toItems = f, this.dialogParent = p;
				let m = this.createElements();
				this.container = m.container, this.fromSelect = m.fromSelect, this.directionIcon = m.directionIcon, this.toSelect = m.toSelect;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-lang-select"]), n = new Select({
					selectTitle: this._fromSelectTitle,
					dialogTitle: this._fromDialogTitle,
					items: this._fromItems,
					dialogParent: this.dialogParent
				}), i = UI.createEl("vot-block", ["vot-lang-select-icon"]);
				B(mn, i);
				let s = new Select({
					selectTitle: this._toSelectTitle,
					dialogTitle: this._toDialogTitle,
					items: this._toItems,
					dialogParent: this.dialogParent
				});
				return t.append(n.container, i, s.container), {
					container: t,
					fromSelect: n,
					directionIcon: i,
					toSelect: s
				};
			}
			setSelectedValues(t, n) {
				return this.fromSelect.setSelectedValue(t), this.toSelect.setSelectedValue(n), this;
			}
			updateItems(t, n) {
				return this._fromItems = t, this._toItems = n, this.fromSelect = this.fromSelect.updateItems(t), this.toSelect = this.toSelect.updateItems(n), this;
			}
		}
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
			constructor({ labelHtml: t, value: n = 50, min: i = 0, max: s = 100, step: d = 1 }) {
				this._labelHtml = t, this._value = n, this._min = i, this._max = s, this._step = d;
				let f = this.createElements();
				this.container = f.container, this.input = f.input, this.label = f.label, this.update();
			}
			updateProgress() {
				let t = (this._value - this._min) / (this._max - this._min);
				return this.container.style.setProperty("--vot-progress", t.toString()), this;
			}
			update() {
				return this._value = this.input.valueAsNumber, this._min = +this.input.min, this._max = +this.input.max, this.updateProgress(), this;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-slider"]), n = document.createElement("input");
				n.type = "range", n.min = this._min.toString(), n.max = this._max.toString(), n.step = this._step.toString(), n.value = this._value.toString();
				let i = UI.createEl("span");
				return B(this._labelHtml, i), t.append(n, i), n.addEventListener("input", () => {
					this.update(), this.onInput.dispatch(this._value);
				}), {
					container: t,
					label: i,
					input: n
				};
			}
			addEventListener(t, n) {
				return this.onInput.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onInput.removeListener(n), this;
			}
			get value() {
				return this._value;
			}
			set value(t) {
				this._value = t, this.input.value = t.toString(), this.updateProgress(), this.onInput.dispatch(this._value);
			}
			get min() {
				return this._min;
			}
			set min(t) {
				this._min = t, this.input.min = this._min.toString(), this.updateProgress();
			}
			get max() {
				return this._max;
			}
			set max(t) {
				this._max = t, this.input.max = this._max.toString(), this.updateProgress();
			}
			get step() {
				return this._step;
			}
			set step(t) {
				this._step = t, this.input.step = this._step.toString();
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		class SliderLabel {
			container;
			strong;
			_labelText;
			_labelEOL;
			_value;
			_symbol;
			constructor({ labelText: t, labelEOL: n = "", value: i = 50, symbol: s = "%" }) {
				this._labelText = t, this._labelEOL = n, this._value = i, this._symbol = s;
				let d = this.createElements();
				this.container = d.container, this.strong = d.strong;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-slider-label"]);
				t.textContent = this.labelText;
				let n = UI.createEl("strong", ["vot-slider-label-value"]);
				return n.textContent = this.valueText, t.append(n), {
					container: t,
					strong: n
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
			set value(t) {
				this._value = t, this.strong.textContent = this.valueText;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		class Label {
			container;
			icon;
			_labelText;
			_icon;
			constructor({ labelText: t, icon: n }) {
				this._labelText = t, this._icon = n;
				let i = this.createElements();
				this.container = i.container, this.icon = i.icon;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-label"]);
				t.textContent = this._labelText;
				let n = UI.createEl("vot-block", ["vot-label-icon"]);
				return this._icon && B(this._icon, n), t.appendChild(n), {
					container: t,
					icon: n
				};
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		class DownloadButton {
			button;
			loaderMain;
			loaderText;
			onClick = new EventImpl();
			_progress = 0;
			constructor() {
				let t = this.createElements();
				this.button = t.button, this.loaderMain = t.loaderMain, this.loaderText = t.loaderText;
			}
			createElements() {
				let t = UI.createIconButton(un), n = t.querySelector(".vot-loader-main"), i = t.querySelector(".vot-loader-text");
				return t.addEventListener("click", () => {
					this.onClick.dispatch();
				}), {
					button: t,
					loaderMain: n,
					loaderText: i
				};
			}
			addEventListener(t, n) {
				return this.onClick.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onClick.removeListener(n), this;
			}
			get progress() {
				return this._progress;
			}
			set progress(t) {
				this._progress = t, this.loaderText.textContent = t === 0 ? "" : t.toString(), !(t > 1) && (this.loaderMain.style.opacity = t === 0 ? "1" : "0");
			}
			set hidden(t) {
				this.button.hidden = t;
			}
			get hidden() {
				return this.button.hidden;
			}
		}
		class OverlayView {
			root;
			tooltipLayoutRoot;
			portalContainer;
			globalPortal;
			dragging = !1;
			initialized = !1;
			data;
			videoHandler;
			cancelDraggingEvents = ["pointercancel", "touchcancel"];
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
			votOverlayPortal;
			votButton;
			votButtonTooltip;
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
			constructor({ root: t, portalContainer: n, tooltipLayoutRoot: i, globalPortal: s, data: d = {}, videoHandler: f }) {
				this.root = t, this.portalContainer = n, this.tooltipLayoutRoot = i, this.globalPortal = s, this.data = d, this.videoHandler = f;
			}
			isInitialized() {
				return this.initialized;
			}
			calcButtonLayout(t) {
				return this.isBigContainer && ["left", "right"].includes(t) ? {
					direction: "column",
					position: t
				} : {
					direction: "row",
					position: "default"
				};
			}
			addEventListener(t, n) {
				switch (t) {
					case "click:settings":
						this.onClickSettings.addListener(n);
						break;
					case "click:pip":
						this.onClickPiP.addListener(n);
						break;
					case "click:downloadTranslation":
						this.onClickDownloadTranslation.addListener(n);
						break;
					case "click:downloadSubtitles":
						this.onClickDownloadSubtitles.addListener(n);
						break;
					case "click:translate":
						this.onClickTranslate.addListener(n);
						break;
					case "input:videoVolume":
						this.onInputVideoVolume.addListener(n);
						break;
					case "input:translationVolume":
						this.onInputTranslationVolume.addListener(n);
						break;
					case "select:fromLanguage":
						this.onSelectFromLanguage.addListener(n);
						break;
					case "select:toLanguage":
						this.onSelectToLanguage.addListener(n);
						break;
					case "select:subtitles":
						this.onSelectSubtitles.addListener(n);
						break;
				}
				return this;
			}
			removeEventListener(t, n) {
				switch (t) {
					case "click:settings":
						this.onClickSettings.removeListener(n);
						break;
					case "click:pip":
						this.onClickPiP.removeListener(n);
						break;
					case "click:downloadTranslation":
						this.onClickDownloadTranslation.removeListener(n);
						break;
					case "click:downloadSubtitles":
						this.onClickDownloadSubtitles.removeListener(n);
						break;
					case "click:translate":
						this.onClickTranslate.removeListener(n);
						break;
					case "input:videoVolume":
						this.onInputVideoVolume.removeListener(n);
						break;
					case "input:translationVolume":
						this.onInputTranslationVolume.removeListener(n);
						break;
					case "select:fromLanguage":
						this.onSelectFromLanguage.removeListener(n);
						break;
					case "select:toLanguage":
						this.onSelectToLanguage.removeListener(n);
						break;
					case "select:subtitles":
						this.onSelectSubtitles.removeListener(n);
						break;
				}
				return this;
			}
			initUI(t = "default") {
				if (this.isInitialized()) throw Error("[VOT] OverlayView is already initialized");
				this.initialized = !0;
				let { position: n, direction: i } = this.calcButtonLayout(t);
				this.votOverlayPortal = UI.createPortal(!0), this.portalContainer.appendChild(this.votOverlayPortal), this.votButton = new VOTButton({
					position: n,
					direction: i,
					status: "none",
					labelHtml: J.get("translateVideo")
				}), this.votButton.opacity = 0, this.pipButtonVisible || this.votButton.showPiPButton(!1), this.root.appendChild(this.votButton.container), this.votButtonTooltip = new Tooltip({
					target: this.votButton.translateButton,
					content: J.get("translateVideo"),
					position: this.votButton.tooltipPos,
					hidden: i === "row",
					bordered: !1,
					parentElement: this.votOverlayPortal,
					layoutRoot: this.tooltipLayoutRoot
				}), this.votMenu = new VOTMenu({
					titleHtml: J.get("VOTSettings"),
					position: n
				}), this.root.appendChild(this.votMenu.container), this.downloadTranslationButton = new DownloadButton(), this.downloadTranslationButton.hidden = !0, this.downloadSubtitlesButton = UI.createIconButton(dn), this.downloadSubtitlesButton.hidden = !0, this.openSettingsButton = UI.createIconButton(fn), this.votMenu.headerContainer.append(this.downloadTranslationButton.button, this.downloadSubtitlesButton, this.openSettingsButton);
				let s = this.videoHandler?.videoData?.detectedLanguage ?? "en", d = this.data.responseLanguage ?? "ru";
				this.languagePairSelect = new LanguagePairSelect({
					from: {
						selectTitle: J.get(`langs.${s}`),
						items: Select.genLanguageItems(W, s)
					},
					to: {
						selectTitle: J.get(`langs.${d}`),
						items: Select.genLanguageItems(ot, d)
					}
				}), this.subtitlesSelectLabel = new Label({ labelText: J.get("VOTSubtitles") }), this.subtitlesSelect = new Select({
					selectTitle: J.get("VOTSubtitlesDisabled"),
					dialogTitle: J.get("VOTSubtitles"),
					labelElement: this.subtitlesSelectLabel.container,
					dialogParent: this.globalPortal,
					items: [{
						label: J.get("VOTSubtitlesDisabled"),
						value: "disabled",
						selected: !0
					}]
				});
				let f = this.videoHandler ? this.videoHandler.getVideoVolume() * 100 : 100;
				this.videoVolumeSliderLabel = new SliderLabel({
					labelText: J.get("VOTVolume"),
					value: f
				}), this.videoVolumeSlider = new Slider({
					labelHtml: this.videoVolumeSliderLabel.container,
					value: f
				}), this.videoVolumeSlider.hidden = !this.data.showVideoSlider || this.votButton.status !== "success";
				let p = this.data.defaultVolume ?? 100;
				return this.tranlsationVolumeSliderLabel = new SliderLabel({
					labelText: J.get("VOTVolumeTranslation"),
					value: p
				}), this.translationVolumeSlider = new Slider({
					labelHtml: this.tranlsationVolumeSliderLabel.container,
					value: p,
					max: this.data.audioBooster ? Xe : 100
				}), this.translationVolumeSlider.hidden = this.votButton.status !== "success", this.votMenu.bodyContainer.append(this.languagePairSelect.container, this.subtitlesSelect.container, this.videoVolumeSlider.container, this.translationVolumeSlider.container), this;
			}
			initUIEvents() {
				if (!this.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				this.votButton.container.addEventListener("click", (t) => {
					t.preventDefault(), t.stopPropagation(), t.stopImmediatePropagation();
				}), this.votButton.translateButton.addEventListener("pointerdown", async () => {
					this.onClickTranslate.dispatch();
				}), this.votButton.pipButton.addEventListener("pointerdown", async () => {
					this.onClickPiP.dispatch();
				}), this.votButton.menuButton.addEventListener("pointerdown", async () => {
					this.votMenu.hidden = !this.votMenu.hidden;
				});
				let enableDraggingByEvent = (t) => {
					this.dragging = !0, t.preventDefault();
				};
				this.votButton.container.addEventListener("pointerdown", enableDraggingByEvent), this.root.addEventListener("pointerup", this.disableDragging), this.root.addEventListener("pointermove", this.handleContainerPointerMove), this.votButton.container.addEventListener("touchstart", enableDraggingByEvent, { passive: !1 }), this.root.addEventListener("touchend", this.disableDragging), this.root.addEventListener("touchmove", this.handleContainerTouchMove, { passive: !1 });
				for (let t of this.cancelDraggingEvents) document.addEventListener(t, this.disableDragging);
				return this.votMenu.container.addEventListener("click", (t) => {
					t.preventDefault(), t.stopPropagation(), t.stopImmediatePropagation();
				}), this.downloadTranslationButton.addEventListener("click", async () => {
					this.onClickDownloadTranslation.dispatch();
				}), this.downloadSubtitlesButton.addEventListener("click", async () => {
					this.onClickDownloadSubtitles.dispatch();
				}), this.openSettingsButton.addEventListener("click", async () => {
					this.onClickSettings.dispatch();
				}), this.languagePairSelect.fromSelect.addEventListener("selectItem", (t) => {
					this.videoHandler?.videoData && (this.videoHandler.videoData.detectedLanguage = t), this.onSelectFromLanguage.dispatch(t);
				}), this.languagePairSelect.toSelect.addEventListener("selectItem", async (t) => {
					this.videoHandler?.videoData && (this.videoHandler.translateToLang = this.videoHandler.videoData.responseLanguage = t), this.data.responseLanguage = t, await q.set("responseLanguage", this.data.responseLanguage), this.onSelectToLanguage.dispatch(t);
				}), this.subtitlesSelect.addEventListener("beforeOpen", async (t) => {
					if (!this.videoHandler?.videoData) return;
					let n = `${this.videoHandler.videoData.videoId}_${this.videoHandler.videoData.detectedLanguage}_${this.videoHandler.videoData.responseLanguage}_${this.data.useLivelyVoice}`;
					if (this.videoHandler.cacheManager.getSubtitles(n)) return;
					this.votButton.loading = !0;
					let i = UI.createInlineLoader();
					i.style.margin = "0 auto", t.footerContainer.appendChild(i), await this.videoHandler.loadSubtitles(), t.footerContainer.removeChild(i), this.votButton.loading = !1;
				}), this.subtitlesSelect.addEventListener("selectItem", (t) => {
					this.onSelectSubtitles.dispatch(t);
				}), this.videoVolumeSlider.addEventListener("input", (t) => {
					this.videoVolumeSliderLabel.value = t, this.onInputVideoVolume.dispatch(t);
				}), this.translationVolumeSlider.addEventListener("input", async (t) => {
					this.tranlsationVolumeSliderLabel.value = t, this.data.defaultVolume = t, await q.set("defaultVolume", this.data.defaultVolume), this.onInputTranslationVolume.dispatch(t);
				}), this;
			}
			updateButtonLayout(t, n) {
				return this.isInitialized() ? (this.votMenu.position = t, this.votButton.position = t, this.votButton.direction = n, this.votButtonTooltip.hidden = n === "row", this.votButtonTooltip.setPosition(this.votButton.tooltipPos), this) : this;
			}
			async moveButton(t) {
				if (!this.isInitialized()) return this;
				let n = VOTButton.calcPosition(t, this.isBigContainer);
				if (n === this.votButton.position) return this;
				let i = VOTButton.calcDirection(n);
				return this.data.buttonPos = n, this.updateButtonLayout(n, i), this.isBigContainer && await q.set("buttonPos", n), this;
			}
			async handleDragMove(t, n, i = this.root.getBoundingClientRect()) {
				if (!this.dragging) return this;
				t.preventDefault();
				let s = n - i.left, d = s / i.width * 100;
				return await this.moveButton(d), this;
			}
			disableDragging = () => {
				this.dragging = !1;
			};
			handleContainerPointerMove = async (t) => {
				await this.handleDragMove(t, t.clientX);
			};
			handleContainerTouchMove = async (t) => {
				await this.handleDragMove(t, t.touches[0].clientX);
			};
			updateButtonOpacity(t) {
				return !this.isInitialized() || !this.votMenu.hidden || (this.votButton.opacity = t), this;
			}
			releaseUI(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				return this.votButton.remove(), this.votMenu.remove(), this.votButtonTooltip.release(), this.votOverlayPortal.remove(), this.initialized = t, this;
			}
			releaseUIEvents(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				this.root.removeEventListener("pointerup", this.disableDragging), this.root.removeEventListener("pointermove", this.handleContainerPointerMove), this.root.removeEventListener("touchend", this.disableDragging), this.root.removeEventListener("touchmove", this.handleContainerTouchMove);
				for (let t of this.cancelDraggingEvents) document.removeEventListener(t, this.disableDragging);
				return this.onClickSettings.clear(), this.onClickPiP.clear(), this.onClickTranslate.clear(), this.onClickDownloadTranslation.clear(), this.onClickDownloadSubtitles.clear(), this.onSelectFromLanguage.clear(), this.onSelectToLanguage.clear(), this.onSelectSubtitles.clear(), this.onInputVideoVolume.clear(), this.onInputTranslationVolume.clear(), this.initialized = t, this;
			}
			release() {
				return this.releaseUI(!0), this.releaseUIEvents(!1), this;
			}
			get isBigContainer() {
				return this.root.clientWidth > 550;
			}
			get pipButtonVisible() {
				return isPiPAvailable() && !!this.data.showPiPButton;
			}
		}
		class Checkbox {
			container;
			input;
			label;
			onChange = new EventImpl();
			_labelHtml;
			_checked;
			_isSubCheckbox;
			constructor({ labelHtml: t, checked: n = !1, isSubCheckbox: i = !1 }) {
				this._labelHtml = t, this._checked = n, this._isSubCheckbox = i;
				let s = this.createElements();
				this.container = s.container, this.input = s.input, this.label = s.label;
			}
			createElements() {
				let t = UI.createEl("label", ["vot-checkbox"]);
				this._isSubCheckbox && t.classList.add("vot-checkbox-sub");
				let n = document.createElement("input");
				n.type = "checkbox", n.checked = this._checked, n.addEventListener("change", () => {
					this._checked = n.checked, this.onChange.dispatch(this._checked);
				});
				let i = UI.createEl("span");
				return B(this._labelHtml, i), t.append(n, i), {
					container: t,
					input: n,
					label: i
				};
			}
			addEventListener(t, n) {
				return this.onChange.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onChange.removeListener(n), this;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
			get disabled() {
				return this.input.disabled;
			}
			set disabled(t) {
				this.input.disabled = t;
			}
			get checked() {
				return this._checked;
			}
			set checked(t) {
				this._checked !== t && (this._checked = this.input.checked = t, this.onChange.dispatch(this._checked));
			}
		}
		class HotkeyButton {
			container;
			button;
			onChange = new EventImpl();
			_labelHtml;
			_key;
			pressedKeys;
			recording = !1;
			constructor({ labelHtml: t, key: n = null }) {
				this._labelHtml = t, this._key = n, this.pressedKeys = new Set();
				let i = this.createElements();
				this.container = i.container, this.button = i.button;
			}
			stopRecordingKeys() {
				this.recording = !1, document.removeEventListener("keydown", this.keydownHandle), document.removeEventListener("keyup", this.keyupOrBlurHandle), document.removeEventListener("blur", this.keyupOrBlurHandle), this.button.removeAttribute("data-status"), this.pressedKeys.clear();
			}
			keydownHandle = (t) => {
				if (!(!this.recording || t.repeat)) {
					if (t.preventDefault(), t.code === "Escape") {
						this.key = null, this.button.textContent = this.keyText, this.stopRecordingKeys();
						return;
					}
					this.pressedKeys.add(t.code), this.button.textContent = formatKeysCombo(this.pressedKeys);
				}
			};
			keyupOrBlurHandle = () => {
				this.recording && (this.key = formatKeysCombo(this.pressedKeys), this.stopRecordingKeys());
			};
			createElements() {
				let t = UI.createEl("vot-block", ["vot-hotkey"]), n = UI.createEl("vot-block", ["vot-hotkey-label"]);
				n.textContent = this._labelHtml;
				let i = UI.createEl("vot-block", ["vot-hotkey-button"]);
				return i.textContent = this.keyText, i.addEventListener("click", () => {
					i.dataset.status = "active", this.recording = !0, this.pressedKeys.clear(), this.button.textContent = J.get("PressTheKeyCombination"), document.addEventListener("keydown", this.keydownHandle), document.addEventListener("keyup", this.keyupOrBlurHandle), document.addEventListener("blur", this.keyupOrBlurHandle);
				}), t.append(n, i), {
					container: t,
					button: i,
					label: n
				};
			}
			addEventListener(t, n) {
				return this.onChange.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onChange.removeListener(n), this;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
			get key() {
				return this._key;
			}
			get keyText() {
				return this._key ? this._key?.replace("Key", "").replace("Digit", "") : J.get("None");
			}
			set key(t) {
				this._key !== t && (this._key = t, this.button.textContent = this.keyText, this.onChange.dispatch(this._key));
			}
		}
		function formatKeysCombo(t) {
			let n = Array.isArray(t) ? t : Array.from(t);
			return n.map((t) => t.replace("Key", "").replace("Digit", "")).join("+");
		}
		class Details {
			container;
			header;
			arrowIcon;
			onClick = new EventImpl();
			_titleHtml;
			constructor({ titleHtml: t }) {
				this._titleHtml = t;
				let n = this.createElements();
				this.container = n.container, this.header = n.header, this.arrowIcon = n.arrowIcon;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-details"]), n = UI.createEl("vot-block");
				n.append(this._titleHtml);
				let i = UI.createEl("vot-block", ["vot-details-arrow-icon"]);
				return B(pn, i), t.append(n, i), t.addEventListener("click", () => {
					this.onClick.dispatch();
				}), {
					container: t,
					header: n,
					arrowIcon: i
				};
			}
			addEventListener(t, n) {
				return this.onClick.addListener(n), this;
			}
			removeEventListener(t, n) {
				return this.onClick.removeListener(n), this;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		let yn = [
			"default",
			"top",
			"left",
			"right"
		], bn = null;
		class AccountButton {
			container;
			accountWrapper;
			buttons;
			usernameEl;
			avatarEl;
			avatarImg;
			actionButton;
			refreshButton;
			onClick = new EventImpl();
			onRefresh = new EventImpl();
			_loggedIn;
			_username;
			_avatarId;
			constructor({ loggedIn: t = !1, username: n = "unnamed", avatarId: i = "0/0-0" } = {}) {
				this._loggedIn = t, this._username = n, this._avatarId = i;
				let s = this.createElements();
				this.container = s.container, this.accountWrapper = s.accountWrapper, this.buttons = s.buttons, this.usernameEl = s.usernameEl, this.avatarEl = s.avatarEl, this.avatarImg = s.avatarImg, this.actionButton = s.actionButton, this.refreshButton = s.refreshButton;
			}
			createElements() {
				let t = UI.createEl("vot-block", ["vot-account"]), n = UI.createEl("vot-block", ["vot-account-wrapper"]);
				n.hidden = !this._loggedIn;
				let i = UI.createEl("img", ["vot-account-avatar-img"]);
				i.src = `${Ge}/${this._avatarId}/islands-retina-middle`, i.loading = "lazy", i.alt = "user avatar";
				let s = UI.createEl("vot-block", ["vot-account-avatar"], i), d = UI.createEl("vot-block", ["vot-account-username"]);
				d.textContent = this._username, n.append(s, d);
				let f = UI.createEl("vot-block", ["vot-account-buttons"]), p = UI.createOutlinedButton(this.buttonText);
				p.addEventListener("click", () => {
					this.onClick.dispatch();
				});
				let m = UI.createIconButton(vn);
				return m.addEventListener("click", () => {
					this.onRefresh.dispatch();
				}), f.append(p, m), t.append(n, f), {
					container: t,
					accountWrapper: n,
					buttons: f,
					usernameEl: d,
					avatarImg: i,
					avatarEl: s,
					actionButton: p,
					refreshButton: m
				};
			}
			addEventListener(t, n) {
				return t === "click" ? this.onClick.addListener(n) : t === "refresh" && this.onRefresh.addListener(n), this;
			}
			removeEventListener(t, n) {
				return t === "click" ? this.onClick.removeListener(n) : t === "refresh" && this.onRefresh.removeListener(n), this;
			}
			get buttonText() {
				return this._loggedIn ? "Logout" : "Login";
			}
			get loggedIn() {
				return this._loggedIn;
			}
			set loggedIn(t) {
				this._loggedIn = t, this.accountWrapper.hidden = !this._loggedIn, this.actionButton.textContent = this.buttonText;
			}
			get avatarId() {
				return this._avatarId;
			}
			set avatarId(t) {
				this._avatarId = t ?? "0/0-0", this.avatarImg.src = `${Ge}/${this._avatarId}/islands-retina-middle`;
			}
			get username() {
				return this._username;
			}
			set username(t) {
				this._username = t ?? "unnamed", this.usernameEl.textContent = this._username;
			}
			set hidden(t) {
				this.container.hidden = t;
			}
			get hidden() {
				return this.container.hidden;
			}
		}
		class SettingsView {
			globalPortal;
			initialized = !1;
			data;
			videoHandler;
			onClickBugReport = new EventImpl();
			onClickResetSettings = new EventImpl();
			onUpdateAccount = new EventImpl();
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
			accountHeader;
			accountButton;
			accountButtonRefreshTooltip;
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
			useLivelyVoiceTooltip;
			useAudioDownloadCheckbox;
			useAudioDownloadCheckboxLabel;
			useAudioDownloadCheckboxTooltip;
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
			constructor({ globalPortal: t, data: n = {}, videoHandler: i }) {
				this.globalPortal = t, this.data = n, this.videoHandler = i;
			}
			isInitialized() {
				return this.initialized;
			}
			initUI() {
				if (this.isInitialized()) throw Error("[VOT] SettingsView is already initialized");
				this.initialized = !0, this.dialog = new Dialog({ titleHtml: J.get("VOTSettings") }), this.globalPortal.appendChild(this.dialog.container), this.accountHeader = UI.createHeader(J.get("VOTMyAccount")), this.accountButton = new AccountButton({
					avatarId: this.data.account?.avatarId,
					username: this.data.account?.username,
					loggedIn: !!this.data.account?.token
				}), q.isSupportOnlyLS() ? (this.accountButton.refreshButton.setAttribute("disabled", "true"), this.accountButton.actionButton.setAttribute("disabled", "true")) : this.accountButtonRefreshTooltip = new Tooltip({
					target: this.accountButton.refreshButton,
					content: J.get("VOTRefresh"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				}), this.translationSettingsHeader = UI.createHeader(J.get("translationSettings")), this.autoTranslateCheckbox = new Checkbox({
					labelHtml: J.get("VOTAutoTranslate"),
					checked: this.data.autoTranslate
				});
				let t = this.data.dontTranslateLanguages ?? [];
				this.dontTranslateLanguagesCheckbox = new Checkbox({
					labelHtml: J.get("DontTranslateSelectedLanguages"),
					checked: this.data.enabledDontTranslateLanguages
				}), this.dontTranslateLanguagesSelect = new Select({
					dialogParent: this.globalPortal,
					dialogTitle: J.get("DontTranslateSelectedLanguages"),
					selectTitle: t.map((t) => J.get(`langs.${t}`)).join(", ") ?? J.get("DontTranslateSelectedLanguages"),
					items: Select.genLanguageItems(W).map((n) => ({
						...n,
						selected: t.includes(n.value)
					})),
					multiSelect: !0,
					labelElement: this.dontTranslateLanguagesCheckbox.container
				});
				let n = this.data.autoVolume ?? Ye;
				this.autoSetVolumeSliderLabel = new SliderLabel({
					labelText: J.get("VOTAutoSetVolume"),
					value: n
				}), this.autoSetVolumeCheckbox = new Checkbox({
					labelHtml: this.autoSetVolumeSliderLabel.container,
					checked: this.data.enabledAutoVolume ?? !0
				}), this.autoSetVolumeSlider = new Slider({
					labelHtml: this.autoSetVolumeCheckbox.container,
					value: n
				}), this.showVideoVolumeSliderCheckbox = new Checkbox({
					labelHtml: J.get("showVideoVolumeSlider"),
					checked: this.data.showVideoSlider
				}), this.audioBoosterCheckbox = new Checkbox({
					labelHtml: J.get("VOTAudioBooster"),
					checked: this.data.audioBooster
				}), this.videoHandler?.audioContext || (this.audioBoosterCheckbox.disabled = !0, this.audioBoosterTooltip = new Tooltip({
					target: this.audioBoosterCheckbox.container,
					content: J.get("VOTNeedWebAudioAPI"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				})), this.syncVolumeCheckbox = new Checkbox({
					labelHtml: J.get("VOTSyncVolume"),
					checked: this.data.syncVolume
				}), this.downloadWithNameCheckbox = new Checkbox({
					labelHtml: J.get("VOTDownloadWithName"),
					checked: this.data.downloadWithName
				}), this.sendNotifyOnCompleteCheckbox = new Checkbox({
					labelHtml: J.get("VOTSendNotifyOnComplete"),
					checked: this.data.sendNotifyOnComplete
				}), this.useLivelyVoiceCheckbox = new Checkbox({
					labelHtml: J.get("VOTUseLivelyVoice"),
					checked: this.data.useLivelyVoice
				}), this.useLivelyVoiceTooltip = new Tooltip({
					target: this.useLivelyVoiceCheckbox.container,
					content: J.get("VOTAccountRequired"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal,
					hidden: !!this.data.account?.token
				}), this.data.account?.token || (this.useLivelyVoiceCheckbox.disabled = !0), this.useAudioDownloadCheckboxLabel = new Label({
					labelText: J.get("VOTUseAudioDownload"),
					icon: gn
				}), this.useAudioDownloadCheckbox = new Checkbox({
					labelHtml: this.useAudioDownloadCheckboxLabel.container,
					checked: this.data.useAudioDownload
				}), this.useAudioDownloadCheckboxTooltip = new Tooltip({
					target: this.useAudioDownloadCheckboxLabel.container,
					content: J.get("VOTUseAudioDownloadWarning"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				}), this.dialog.bodyContainer.append(this.accountHeader, this.accountButton.container, this.translationSettingsHeader, this.autoTranslateCheckbox.container, this.dontTranslateLanguagesSelect.container, this.autoSetVolumeSlider.container, this.showVideoVolumeSliderCheckbox.container, this.audioBoosterCheckbox.container, this.syncVolumeCheckbox.container, this.downloadWithNameCheckbox.container, this.sendNotifyOnCompleteCheckbox.container, this.useLivelyVoiceCheckbox.container, this.useAudioDownloadCheckbox.container), this.subtitlesSettingsHeader = UI.createHeader(J.get("subtitlesSettings")), this.subtitlesDownloadFormatSelectLabel = new Label({ labelText: J.get("VOTSubtitlesDownloadFormat") }), this.subtitlesDownloadFormatSelect = new Select({
					selectTitle: this.data.subtitlesDownloadFormat ?? J.get("VOTSubtitlesDownloadFormat"),
					dialogTitle: J.get("VOTSubtitlesDownloadFormat"),
					dialogParent: this.globalPortal,
					labelElement: this.subtitlesDownloadFormatSelectLabel.container,
					items: st.map((t) => ({
						label: t.toUpperCase(),
						value: t,
						selected: t === this.data.subtitlesDownloadFormat
					}))
				}), this.subtitlesDesignDetails = new Details({ titleHtml: J.get("VOTSubtitlesDesign") }), this.dialog.bodyContainer.append(this.subtitlesSettingsHeader, this.subtitlesDownloadFormatSelect.container, this.subtitlesDesignDetails.container), this.hotkeysSettingsHeader = UI.createHeader(J.get("hotkeysSettings")), this.translateHotkeyButton = new HotkeyButton({
					labelHtml: "Translate",
					key: this.data.translationHotkey
				}), this.dialog.bodyContainer.append(this.hotkeysSettingsHeader, this.translateHotkeyButton.container), this.proxySettingsHeader = UI.createHeader(J.get("proxySettings")), this.proxyM3U8HostTextfield = new Textfield({
					labelHtml: J.get("VOTM3u8ProxyHost"),
					value: this.data.m3u8ProxyHost,
					placeholder: ze
				}), this.proxyWorkerHostTextfield = new Textfield({
					labelHtml: J.get("VOTProxyWorkerHost"),
					value: this.data.proxyWorkerHost,
					placeholder: Be
				});
				let i = [
					J.get("VOTTranslateProxyDisabled"),
					J.get("VOTTranslateProxyEnabled"),
					J.get("VOTTranslateProxyEverything")
				], s = this.data.translateProxyEnabled ?? 0, d = Ln && tt.includes(Ln);
				this.proxyTranslationStatusSelectLabel = new Label({
					icon: d ? gn : void 0,
					labelText: J.get("VOTTranslateProxyStatus")
				}), d && (this.proxyTranslationStatusSelectTooltip = new Tooltip({
					target: this.proxyTranslationStatusSelectLabel.icon,
					content: J.get("VOTTranslateProxyStatusDefault"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				})), this.proxyTranslationStatusSelect = new Select({
					selectTitle: i[s],
					dialogTitle: J.get("VOTTranslateProxyStatus"),
					dialogParent: this.globalPortal,
					labelElement: this.proxyTranslationStatusSelectLabel.container,
					items: i.map((t, n) => ({
						label: t,
						value: n.toString(),
						selected: n === s,
						disabled: n === 0 && pt
					}))
				}), this.dialog.bodyContainer.append(this.proxySettingsHeader, this.proxyM3U8HostTextfield.container, this.proxyWorkerHostTextfield.container, this.proxyTranslationStatusSelect.container), this.miscSettingsHeader = UI.createHeader(J.get("miscSettings")), this.translateAPIErrorsCheckbox = new Checkbox({
					labelHtml: J.get("VOTTranslateAPIErrors"),
					checked: this.data.translateAPIErrors ?? !0
				}), this.translateAPIErrorsCheckbox.hidden = J.lang === "ru", this.useNewAudioPlayerCheckbox = new Checkbox({
					labelHtml: J.get("VOTNewAudioPlayer"),
					checked: this.data.newAudioPlayer
				}), this.videoHandler?.audioContext || (this.useNewAudioPlayerCheckbox.disabled = !0, this.useNewAudioPlayerTooltip = new Tooltip({
					target: this.useNewAudioPlayerCheckbox.container,
					content: J.get("VOTNeedWebAudioAPI"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				}));
				let f = this.videoHandler?.site.needBypassCSP ? `${J.get("VOTOnlyBypassMediaCSP")} (${J.get("VOTMediaCSPEnabledOnSite")})` : J.get("VOTOnlyBypassMediaCSP");
				this.onlyBypassMediaCSPCheckbox = new Checkbox({
					labelHtml: f,
					checked: this.data.onlyBypassMediaCSP,
					isSubCheckbox: !0
				}), this.videoHandler?.audioContext || (this.onlyBypassMediaCSPTooltip = new Tooltip({
					target: this.onlyBypassMediaCSPCheckbox.container,
					content: J.get("VOTNeedWebAudioAPI"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				})), this.onlyBypassMediaCSPCheckbox.disabled = !this.data.newAudioPlayer && !!this.videoHandler?.audioContext, this.data.newAudioPlayer || (this.onlyBypassMediaCSPCheckbox.hidden = !0), this.translationTextServiceLabel = new Label({
					labelText: J.get("VOTTranslationTextService"),
					icon: _n
				});
				let p = this.data.translationService ?? Qe;
				this.translationTextServiceSelect = new Select({
					selectTitle: J.get(`services.${p}`),
					dialogTitle: J.get("VOTTranslationTextService"),
					dialogParent: this.globalPortal,
					labelElement: this.translationTextServiceLabel.container,
					items: en.map((t) => ({
						label: J.get(`services.${t}`),
						value: t,
						selected: t === p
					}))
				}), this.translationTextServiceTooltip = new Tooltip({
					target: this.translationTextServiceLabel.icon,
					content: J.get("VOTNotAffectToVoice"),
					position: "bottom",
					backgroundColor: "var(--vot-helper-ondialog)",
					parentElement: this.globalPortal
				}), this.detectServiceLabel = new Label({ labelText: J.get("VOTDetectService") });
				let m = this.data.detectService ?? $e;
				return this.detectServiceSelect = new Select({
					selectTitle: J.get(`services.${m}`),
					dialogTitle: J.get("VOTDetectService"),
					dialogParent: this.globalPortal,
					labelElement: this.detectServiceLabel.container,
					items: tn.map((t) => ({
						label: J.get(`services.${t}`),
						value: t,
						selected: t === m
					}))
				}), this.appearanceDetails = new Details({ titleHtml: J.get("appearance") }), this.aboutExtensionDetails = new Details({ titleHtml: J.get("aboutExtension") }), this.bugReportButton = UI.createOutlinedButton(J.get("VOTBugReport")), this.resetSettingsButton = UI.createButton(J.get("resetSettings")), this.dialog.bodyContainer.append(this.miscSettingsHeader, this.translateAPIErrorsCheckbox.container, this.useNewAudioPlayerCheckbox.container, this.onlyBypassMediaCSPCheckbox.container, this.translationTextServiceSelect.container, this.detectServiceSelect.container, this.appearanceDetails.container, this.aboutExtensionDetails.container, this.bugReportButton, this.resetSettingsButton), this;
			}
			initUIEvents() {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				return this.accountButton.addEventListener("click", async () => {
					if (!q.isSupportOnlyLS()) {
						if (this.accountButton.loggedIn) return await q.delete("account"), this.data.account = {}, this.updateAccountInfo();
						window.open(We, "_blank")?.focus();
					}
				}), this.accountButton.addEventListener("refresh", async () => {
					q.isSupportOnlyLS() || (this.data.account = await q.get("account", {}), this.updateAccountInfo());
				}), this.autoTranslateCheckbox.addEventListener("change", async (t) => {
					this.data.autoTranslate = t, await q.set("autoTranslate", this.data.autoTranslate), U.log("autoTranslate value changed. New value:", t), this.onChangeAutoTranslate.dispatch(t);
				}), this.dontTranslateLanguagesCheckbox.addEventListener("change", async (t) => {
					this.data.enabledDontTranslateLanguages = t, await q.set("enabledDontTranslateLanguages", this.data.enabledDontTranslateLanguages), U.log("enabledDontTranslateLanguages value changed. New value:", t);
				}), this.dontTranslateLanguagesSelect.addEventListener("selectItem", async (t) => {
					this.data.dontTranslateLanguages = t, await q.set("dontTranslateLanguages", this.data.dontTranslateLanguages), U.log("dontTranslateLanguages value changed. New value:", t);
				}), this.autoSetVolumeCheckbox.addEventListener("change", async (t) => {
					this.data.enabledAutoVolume = t, await q.set("enabledAutoVolume", this.data.enabledAutoVolume), U.log("enabledAutoVolume value changed. New value:", t);
				}), this.autoSetVolumeSlider.addEventListener("input", async (t) => {
					this.data.autoVolume = this.autoSetVolumeSliderLabel.value = t, await q.set("autoVolume", this.data.autoVolume), U.log("autoVolume value changed. New value:", t);
				}), this.showVideoVolumeSliderCheckbox.addEventListener("change", async (t) => {
					this.data.showVideoSlider = t, await q.set("showVideoSlider", this.data.showVideoSlider), U.log("showVideoVolumeSlider value changed. New value:", t), this.onChangeShowVideoVolume.dispatch(t);
				}), this.audioBoosterCheckbox.addEventListener("change", async (t) => {
					this.data.audioBooster = t, await q.set("audioBooster", this.data.audioBooster), U.log("audioBooster value changed. New value:", t), this.onChangeAudioBooster.dispatch(t);
				}), this.syncVolumeCheckbox.addEventListener("change", async (t) => {
					this.data.syncVolume = t, await q.set("syncVolume", this.data.syncVolume), U.log("syncVolume value changed. New value:", t);
				}), this.downloadWithNameCheckbox.addEventListener("change", async (t) => {
					this.data.downloadWithName = t, await q.set("downloadWithName", this.data.downloadWithName), U.log("downloadWithName value changed. New value:", t);
				}), this.sendNotifyOnCompleteCheckbox.addEventListener("change", async (t) => {
					this.data.sendNotifyOnComplete = t, await q.set("sendNotifyOnComplete", this.data.sendNotifyOnComplete), U.log("sendNotifyOnComplete value changed. New value:", t);
				}), this.useLivelyVoiceCheckbox.addEventListener("change", async (t) => {
					this.data.useLivelyVoice = t, await q.set("useLivelyVoice", this.data.useLivelyVoice), U.log("useLivelyVoice value changed. New value:", t), this.onChangeUseLivelyVoice.dispatch(t);
				}), this.useAudioDownloadCheckbox.addEventListener("change", async (t) => {
					this.data.useAudioDownload = t, await q.set("useAudioDownload", this.data.useAudioDownload), U.log("useAudioDownload value changed. New value:", t);
				}), this.subtitlesDownloadFormatSelect.addEventListener("selectItem", async (t) => {
					this.data.subtitlesDownloadFormat = t, await q.set("subtitlesDownloadFormat", this.data.subtitlesDownloadFormat), U.log("subtitlesDownloadFormat value changed. New value:", t);
				}), this.subtitlesDesignDetails.addEventListener("click", () => {
					let t = new Dialog({
						titleHtml: J.get("VOTSubtitlesDesign"),
						isTemp: !0
					});
					this.globalPortal.appendChild(t.container);
					let n = new Checkbox({
						labelHtml: J.get("VOTHighlightWords"),
						checked: this.data.highlightWords
					}), i = this.data.subtitlesMaxLength ?? 300, s = new SliderLabel({
						labelText: J.get("VOTSubtitlesMaxLength"),
						labelEOL: ":",
						symbol: "",
						value: i
					}), d = new Slider({
						labelHtml: s.container,
						value: i,
						min: 50,
						max: 300
					}), f = this.data.subtitlesFontSize ?? 20, p = new SliderLabel({
						labelText: J.get("VOTSubtitlesFontSize"),
						labelEOL: ":",
						symbol: "px",
						value: f
					}), m = new Slider({
						labelHtml: p.container,
						value: f,
						min: 8,
						max: 50
					}), h = this.data.subtitlesOpacity ?? 20, g = new SliderLabel({
						labelText: J.get("VOTSubtitlesOpacity"),
						labelEOL: ":",
						value: h
					}), _ = new Slider({
						labelHtml: g.container,
						value: h
					});
					t.bodyContainer.append(n.container, d.container, m.container, _.container), n.addEventListener("change", async (t) => {
						this.data.highlightWords = t, await q.set("highlightWords", this.data.highlightWords), U.log("highlightWords value changed. New value:", t), this.onChangeSubtitlesHighlightWords.dispatch(t);
					}), d.addEventListener("input", (t) => {
						s.value = t, this.data.subtitlesMaxLength = t, q.set("subtitlesMaxLength", this.data.subtitlesMaxLength), U.log("highlightWords value changed. New value:", t), this.onInputSubtitlesMaxLength.dispatch(t);
					}), m.addEventListener("input", (t) => {
						p.value = t, this.data.subtitlesFontSize = t, q.set("subtitlesFontSize", this.data.subtitlesFontSize), U.log("subtitlesFontSize value changed. New value:", t), this.onInputSubtitlesFontSize.dispatch(t);
					}), _.addEventListener("input", (t) => {
						g.value = t, this.data.subtitlesOpacity = t, q.set("subtitlesOpacity", this.data.subtitlesOpacity), U.log("subtitlesOpacity value changed. New value:", t), this.onInputSubtitlesBackgroundOpacity.dispatch(t);
					});
				}), this.translateHotkeyButton.addEventListener("change", async (t) => {
					this.data.translationHotkey = t, await q.set("translationHotkey", this.data.translationHotkey), U.log("translationHotkey value changed. New value:", t);
				}), this.proxyM3U8HostTextfield.addEventListener("change", async (t) => {
					this.data.m3u8ProxyHost = t || ze, await q.set("m3u8ProxyHost", this.data.m3u8ProxyHost), U.log("m3u8ProxyHost value changed. New value:", this.data.m3u8ProxyHost);
				}), this.proxyWorkerHostTextfield.addEventListener("change", async (t) => {
					this.data.proxyWorkerHost = t || Be, await q.set("proxyWorkerHost", this.data.proxyWorkerHost), U.log("proxyWorkerHost value changed. New value:", this.data.proxyWorkerHost), this.onChangeProxyWorkerHost.dispatch(t);
				}), this.proxyTranslationStatusSelect.addEventListener("selectItem", async (t) => {
					this.data.translateProxyEnabled = Number.parseInt(t), await q.set("translateProxyEnabled", this.data.translateProxyEnabled), await q.set("translateProxyEnabledDefault", !1), U.log("translateProxyEnabled value changed. New value:", this.data.translateProxyEnabled), this.onSelectItemProxyTranslationStatus.dispatch(t);
				}), this.translateAPIErrorsCheckbox.addEventListener("change", async (t) => {
					this.data.translateAPIErrors = t, await q.set("translateAPIErrors", this.data.translateAPIErrors), U.log("translateAPIErrors value changed. New value:", t);
				}), this.useNewAudioPlayerCheckbox.addEventListener("change", async (t) => {
					this.data.newAudioPlayer = t, await q.set("newAudioPlayer", this.data.newAudioPlayer), U.log("newAudioPlayer value changed. New value:", t), this.onlyBypassMediaCSPCheckbox.disabled = this.onlyBypassMediaCSPCheckbox.hidden = !t, this.onChangeUseNewAudioPlayer.dispatch(t);
				}), this.onlyBypassMediaCSPCheckbox.addEventListener("change", async (t) => {
					this.data.onlyBypassMediaCSP = t, await q.set("onlyBypassMediaCSP", this.data.onlyBypassMediaCSP), U.log("onlyBypassMediaCSP value changed. New value:", t), this.onChangeOnlyBypassMediaCSP.dispatch(t);
				}), this.translationTextServiceSelect.addEventListener("selectItem", async (t) => {
					this.data.translationService = t, await q.set("translationService", this.data.translationService), U.log("translationService value changed. New value:", t), this.onSelectItemTranslationTextService.dispatch(t);
				}), this.detectServiceSelect.addEventListener("selectItem", async (t) => {
					this.data.detectService = t, await q.set("detectService", this.data.detectService), U.log("detectService value changed. New value:", t);
				}), this.appearanceDetails.addEventListener("click", () => {
					let t = new Dialog({
						titleHtml: J.get("appearance"),
						isTemp: !0
					});
					this.globalPortal.appendChild(t.container);
					let n = new Checkbox({
						labelHtml: J.get("VOTShowPiPButton"),
						checked: this.data.showPiPButton
					});
					n.hidden = !isPiPAvailable();
					let i = (this.data.autoHideButtonDelay ?? nt) / 1e3, s = new SliderLabel({
						labelText: J.get("autoHideButtonDelay"),
						labelEOL: ":",
						symbol: ` ${J.get("secs")}`,
						value: i
					}), d = new Slider({
						labelHtml: s.container,
						value: i,
						min: .1,
						max: 3,
						step: .1
					}), f = new Label({
						labelText: J.get("buttonPositionInWidePlayer"),
						icon: _n
					}), p = new Select({
						selectTitle: J.get("buttonPositionInWidePlayer"),
						dialogTitle: J.get("buttonPositionInWidePlayer"),
						labelElement: f.container,
						dialogParent: this.globalPortal,
						items: yn.map((t) => ({
							label: J.get(`position.${t}`),
							value: t,
							selected: t === this.data.buttonPos
						}))
					}), m = new Tooltip({
						target: f.icon,
						content: J.get("minButtonPositionContainer"),
						position: "bottom",
						backgroundColor: "var(--vot-helper-ondialog)",
						parentElement: this.globalPortal
					}), h = new Label({ labelText: J.get("VOTMenuLanguage") }), g = new Select({
						selectTitle: J.get(`langs.${J.getLangOverride()}`),
						dialogTitle: J.get("VOTMenuLanguage"),
						labelElement: h.container,
						dialogParent: this.globalPortal,
						items: Select.genLanguageItems(J.getAvailableLangs(), J.getLangOverride())
					});
					t.bodyContainer.append(n.container, d.container, p.container, g.container), t.addEventListener("close", () => {
						m.release();
					}), n.addEventListener("change", async (t) => {
						this.data.showPiPButton = t, await q.set("showPiPButton", this.data.showPiPButton), U.log("showPiPButton value changed. New value:", t), this.onChangeShowPiPButton.dispatch(t);
					}), d.addEventListener("input", async (t) => {
						s.value = t;
						let n = Math.round(t * 1e3);
						U.log("autoHideButtonDelay value changed. New value:", n), this.data.autoHideButtonDelay = n, await q.set("autoHideButtonDelay", this.data.autoHideButtonDelay), this.onInputAutoHideButtonDelay.dispatch(t);
					}), p.addEventListener("selectItem", async (t) => {
						U.log("buttonPos value changed. New value:", t), this.data.buttonPos = t, await q.set("buttonPos", this.data.buttonPos), this.onSelectItemButtonPosition.dispatch(t);
					}), g.addEventListener("selectItem", async (t) => {
						let n = await J.changeLang(t);
						n && (this.data.localeUpdatedAt = await q.get("localeUpdatedAt", 0), this.onSelectItemMenuLanguage.dispatch(t));
					});
				}), this.aboutExtensionDetails.addEventListener("click", () => {
					let t = new Dialog({
						titleHtml: J.get("aboutExtension"),
						isTemp: !0
					});
					this.globalPortal.appendChild(t.container);
					let n = UI.createInformation(`${J.get("VOTVersion")}:`, GM_info.script.version || J.get("notFound")), i = UI.createInformation(`${J.get("VOTAuthors")}:`, GM_info.script.author ?? J.get("notFound")), s = UI.createInformation(`${J.get("VOTLoader")}:`, `${GM_info.scriptHandler} v${GM_info.version}`), d = UI.createInformation(`${J.get("VOTBrowser")}:`, `${K.browser.name} ${K.browser.version} (${K.os.name} ${K.os.version})`), f = new Date((this.data.localeUpdatedAt ?? 0) * 1e3).toLocaleString(), p = Wt`${this.data.localeHash}<br />(${J.get("VOTUpdatedAt")}
        ${f})`, m = UI.createInformation(`${J.get("VOTLocaleHash")}:`, p), h = UI.createOutlinedButton(J.get("VOTUpdateLocaleFiles"));
					t.bodyContainer.append(n.container, i.container, s.container, d.container, m.container, h), h.addEventListener("click", async () => {
						await q.set("localeHash", ""), await J.update(!0), window.location.reload();
					});
				}), this.bugReportButton.addEventListener("click", () => {
					this.onClickBugReport.dispatch();
				}), this.resetSettingsButton.addEventListener("click", () => {
					this.onClickResetSettings.dispatch();
				}), this;
			}
			addEventListener(t, n) {
				switch (t) {
					case "click:bugReport":
						this.onClickBugReport.addListener(n);
						break;
					case "click:resetSettings":
						this.onClickResetSettings.addListener(n);
						break;
					case "update:account":
						this.onUpdateAccount.addListener(n);
						break;
					case "change:autoTranslate":
						this.onChangeAutoTranslate.addListener(n);
						break;
					case "change:showVideoVolume":
						this.onChangeShowVideoVolume.addListener(n);
						break;
					case "change:audioBuster":
						this.onChangeAudioBooster.addListener(n);
						break;
					case "change:useLivelyVoice":
						this.onChangeUseLivelyVoice.addListener(n);
						break;
					case "change:subtitlesHighlightWords":
						this.onChangeSubtitlesHighlightWords.addListener(n);
						break;
					case "change:proxyWorkerHost":
						this.onChangeProxyWorkerHost.addListener(n);
						break;
					case "change:useNewAudioPlayer":
						this.onChangeUseNewAudioPlayer.addListener(n);
						break;
					case "change:onlyBypassMediaCSP":
						this.onChangeOnlyBypassMediaCSP.addListener(n);
						break;
					case "change:showPiPButton":
						this.onChangeShowPiPButton.addListener(n);
						break;
					case "input:subtitlesMaxLength":
						this.onInputSubtitlesMaxLength.addListener(n);
						break;
					case "input:subtitlesFontSize":
						this.onInputSubtitlesFontSize.addListener(n);
						break;
					case "input:subtitlesBackgroundOpacity":
						this.onInputSubtitlesBackgroundOpacity.addListener(n);
						break;
					case "input:autoHideButtonDelay":
						this.onInputAutoHideButtonDelay.addListener(n);
						break;
					case "select:proxyTranslationStatus":
						this.onSelectItemProxyTranslationStatus.addListener(n);
						break;
					case "select:translationTextService":
						this.onSelectItemTranslationTextService.addListener(n);
						break;
					case "select:buttonPosition":
						this.onSelectItemButtonPosition.addListener(n);
						break;
					case "select:menuLanguage":
						this.onSelectItemMenuLanguage.addListener(n);
						break;
				}
				return this;
			}
			removeEventListener(t, n) {
				switch (t) {
					case "click:bugReport":
						this.onClickBugReport.removeListener(n);
						break;
					case "click:resetSettings":
						this.onClickResetSettings.removeListener(n);
						break;
					case "update:account":
						this.onUpdateAccount.removeListener(n);
						break;
					case "change:autoTranslate":
						this.onChangeAutoTranslate.removeListener(n);
						break;
					case "change:showVideoVolume":
						this.onChangeShowVideoVolume.removeListener(n);
						break;
					case "change:audioBuster":
						this.onChangeAudioBooster.removeListener(n);
						break;
					case "change:useLivelyVoice":
						this.onChangeUseLivelyVoice.removeListener(n);
						break;
					case "change:subtitlesHighlightWords":
						this.onChangeSubtitlesHighlightWords.removeListener(n);
						break;
					case "change:proxyWorkerHost":
						this.onChangeProxyWorkerHost.removeListener(n);
						break;
					case "change:useNewAudioPlayer":
						this.onChangeUseNewAudioPlayer.removeListener(n);
						break;
					case "change:onlyBypassMediaCSP":
						this.onChangeOnlyBypassMediaCSP.removeListener(n);
						break;
					case "change:showPiPButton":
						this.onChangeShowPiPButton.removeListener(n);
						break;
					case "input:subtitlesMaxLength":
						this.onInputSubtitlesMaxLength.removeListener(n);
						break;
					case "input:subtitlesFontSize":
						this.onInputSubtitlesFontSize.removeListener(n);
						break;
					case "input:subtitlesBackgroundOpacity":
						this.onInputSubtitlesBackgroundOpacity.removeListener(n);
						break;
					case "input:autoHideButtonDelay":
						this.onInputAutoHideButtonDelay.removeListener(n);
						break;
					case "select:proxyTranslationStatus":
						this.onSelectItemProxyTranslationStatus.removeListener(n);
						break;
					case "select:translationTextService":
						this.onSelectItemTranslationTextService.removeListener(n);
						break;
					case "select:buttonPosition":
						this.onSelectItemButtonPosition.removeListener(n);
						break;
					case "select:menuLanguage":
						this.onSelectItemMenuLanguage.removeListener(n);
						break;
				}
				return this;
			}
			releaseUI(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				return this.dialog.remove(), this.accountButtonRefreshTooltip?.release(), this.audioBoosterTooltip?.release(), this.useAudioDownloadCheckboxTooltip?.release(), this.useNewAudioPlayerTooltip?.release(), this.onlyBypassMediaCSPTooltip?.release(), this.translationTextServiceTooltip?.release(), this.proxyTranslationStatusSelectTooltip?.release(), this.initialized = t, this;
			}
			releaseUIEvents(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				return this.onClickBugReport.clear(), this.onClickResetSettings.clear(), this.onUpdateAccount.clear(), this.onChangeAutoTranslate.clear(), this.onChangeShowVideoVolume.clear(), this.onChangeAudioBooster.clear(), this.onChangeUseLivelyVoice.clear(), this.onChangeSubtitlesHighlightWords.clear(), this.onChangeProxyWorkerHost.clear(), this.onChangeUseNewAudioPlayer.clear(), this.onChangeOnlyBypassMediaCSP.clear(), this.onChangeShowPiPButton.clear(), this.onInputSubtitlesMaxLength.clear(), this.onInputSubtitlesFontSize.clear(), this.onInputSubtitlesBackgroundOpacity.clear(), this.onInputAutoHideButtonDelay.clear(), this.onSelectItemProxyTranslationStatus.clear(), this.onSelectItemTranslationTextService.clear(), this.onSelectItemButtonPosition.clear(), this.onSelectItemMenuLanguage.clear(), this.initialized = t, this;
			}
			release() {
				return this.releaseUI(!0), this.releaseUIEvents(!1), this;
			}
			updateAccountInfo() {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				let t = !!this.data.account?.token;
				return this.accountButton.avatarId = this.data.account?.avatarId, this.useLivelyVoiceTooltip.hidden = this.accountButton.loggedIn = t, this.accountButton.username = this.data.account?.username, this.useLivelyVoiceCheckbox.disabled = !t, this.onUpdateAccount.dispatch(this.data.account), this;
			}
			open() {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				return this.dialog.open();
			}
			close() {
				if (!this.isInitialized()) throw Error("[VOT] SettingsView isn't initialized");
				return this.dialog.close();
			}
		}
		class UIManager {
			root;
			portalContainer;
			tooltipLayoutRoot;
			initialized = !1;
			data;
			videoHandler;
			votGlobalPortal;
			votOverlayView;
			votSettingsView;
			constructor({ root: t, portalContainer: n, tooltipLayoutRoot: i, data: s = {}, videoHandler: d }) {
				this.root = t, this.portalContainer = n, this.tooltipLayoutRoot = i, this.videoHandler = d, this.data = s;
			}
			isInitialized() {
				return this.initialized;
			}
			initUI() {
				if (this.isInitialized()) throw Error("[VOT] UIManager is already initialized");
				return this.initialized = !0, this.votGlobalPortal = UI.createPortal(), document.documentElement.appendChild(this.votGlobalPortal), this.votOverlayView = new OverlayView({
					root: this.root,
					portalContainer: this.portalContainer,
					tooltipLayoutRoot: this.tooltipLayoutRoot,
					globalPortal: this.votGlobalPortal,
					data: this.data,
					videoHandler: this.videoHandler
				}), this.votOverlayView.initUI(), this.votSettingsView = new SettingsView({
					globalPortal: this.votGlobalPortal,
					data: this.data,
					videoHandler: this.videoHandler
				}), this.votSettingsView.initUI(), this;
			}
			initUIEvents() {
				if (!this.isInitialized()) throw Error("[VOT] UIManager isn't initialized");
				this.votOverlayView.initUIEvents(), this.votOverlayView.addEventListener("click:translate", async () => {
					await this.handleTranslationBtnClick();
				}).addEventListener("click:pip", async () => {
					if (!this.videoHandler) return;
					let t = this.videoHandler.video === document.pictureInPictureElement;
					await (t ? document.exitPictureInPicture() : this.videoHandler.video.requestPictureInPicture());
				}).addEventListener("click:settings", async () => {
					this.videoHandler?.subtitlesWidget.releaseTooltip(), this.votSettingsView.open(), await exitFullscreen();
				}).addEventListener("click:downloadTranslation", async () => {
					if (!(!this.votOverlayView.isInitialized() || !this.videoHandler?.downloadTranslationUrl || !this.videoHandler.videoData)) {
						try {
							if (!this.data.downloadWithName) return window.open(this.videoHandler.downloadTranslationUrl, "_blank")?.focus();
							let t = await GM_fetch(this.videoHandler.downloadTranslationUrl, { timeout: 0 });
							if (!t.ok) throw Error(`HTTP ${t.status}`);
							let n = +t.headers.get("Content-Length"), i = t.body.getReader(), s = new Uint8Array(n);
							this.votOverlayView.downloadTranslationButton.progress = 0;
							let d = 0;
							for (;;) {
								let { done: t, value: f } = await i.read();
								if (t) break;
								s.set(f, d), d += f.length, this.votOverlayView.downloadTranslationButton.progress = Math.round(d / n * 100);
							}
							let f = clearFileName(this.videoHandler.videoData.downloadTitle), p = new browser_id3_writer_o(s.buffer);
							p.setFrame("TIT2", f), p.addTag(), downloadBlob(p.getBlob(), `${f}.mp3`);
						} catch (t) {
							console.error("[VOT] Download failed:", t), this.transformBtn("error", J.get("downloadFailed"));
						}
						this.votOverlayView.downloadTranslationButton.progress = 0;
					}
				}).addEventListener("click:downloadSubtitles", async () => {
					if (!this.videoHandler || !this.videoHandler.yandexSubtitles || !this.videoHandler.videoData) return;
					let t = this.data.subtitlesDownloadFormat ?? "json", n = convertSubs(this.videoHandler.yandexSubtitles, t), i = new Blob([t === "json" ? JSON.stringify(n) : n], { type: "text/plain" }), s = this.data.downloadWithName ? clearFileName(this.videoHandler.videoData.downloadTitle) : `subtitles_${this.videoHandler.videoData.videoId}`;
					downloadBlob(i, `${s}.${t}`);
				}).addEventListener("input:videoVolume", (t) => {
					this.videoHandler && (this.videoHandler.setVideoVolume(t / 100), this.data.syncVolume && this.videoHandler.syncVolumeWrapper("video", t));
				}).addEventListener("input:translationVolume", () => {
					if (!this.videoHandler) return;
					let t = this.data.defaultVolume ?? 100;
					this.videoHandler.audioPlayer.player.volume = t / 100, this.data.syncVolume && (this.videoHandler.syncVolumeWrapper("translation", t), ["youtube", "googledrive"].includes(this.videoHandler.site.host) && this.videoHandler.site.additionalData !== "mobile" && this.videoHandler.setVideoVolume(this.videoHandler.tempOriginalVolume / 100));
				}).addEventListener("select:subtitles", async (t) => {
					await this.videoHandler?.changeSubtitlesLang(t);
				}), this.votSettingsView.initUIEvents(), this.votSettingsView.addEventListener("update:account", async (t) => {
					this.videoHandler && (this.videoHandler.votClient.apiToken = t?.token);
				}).addEventListener("change:autoTranslate", async (t) => {
					t && this.videoHandler && !this.videoHandler?.hasActiveSource() && await this.handleTranslationBtnClick();
				}).addEventListener("change:showVideoVolume", () => {
					this.votOverlayView.isInitialized() && (this.votOverlayView.videoVolumeSlider.container.hidden = !this.data.showVideoSlider || this.votOverlayView.votButton.status !== "success");
				}).addEventListener("change:audioBuster", async () => {
					if (!this.votOverlayView.isInitialized()) return;
					let t = this.votOverlayView.translationVolumeSlider.value;
					this.votOverlayView.translationVolumeSlider.max = this.data.audioBooster ? Xe : 100, this.votOverlayView.translationVolumeSlider.value = clamp(t, 0, 100);
				}).addEventListener("change:useLivelyVoice", () => {
					this.videoHandler?.stopTranslate();
				}).addEventListener("change:subtitlesHighlightWords", (t) => {
					this.videoHandler?.subtitlesWidget.setHighlightWords(this.data.highlightWords ?? t);
				}).addEventListener("input:subtitlesMaxLength", (t) => {
					this.videoHandler?.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength ?? t);
				}).addEventListener("input:subtitlesFontSize", (t) => {
					this.videoHandler?.subtitlesWidget.setFontSize(this.data.subtitlesFontSize ?? t);
				}).addEventListener("input:subtitlesBackgroundOpacity", (t) => {
					this.videoHandler?.subtitlesWidget.setOpacity(this.data.subtitlesOpacity ?? t);
				}).addEventListener("change:proxyWorkerHost", (t) => {
					!this.data.translateProxyEnabled || !this.videoHandler || (this.videoHandler.votClient.host = this.data.proxyWorkerHost ?? t);
				}).addEventListener("select:proxyTranslationStatus", () => {
					this.videoHandler?.initVOTClient();
				}).addEventListener("change:useNewAudioPlayer", () => {
					this.videoHandler && (this.videoHandler.stopTranslate(), this.videoHandler.createPlayer());
				}).addEventListener("change:onlyBypassMediaCSP", () => {
					this.videoHandler && (this.videoHandler.stopTranslate(), this.videoHandler.createPlayer());
				}).addEventListener("select:translationTextService", () => {
					this.videoHandler && (this.videoHandler.subtitlesWidget.strTranslatedTokens = "", this.videoHandler.subtitlesWidget.releaseTooltip());
				}).addEventListener("change:showPiPButton", () => {
					this.votOverlayView.isInitialized() && (this.votOverlayView.votButton.pipButton.hidden = this.votOverlayView.votButton.separator2.hidden = !this.votOverlayView.pipButtonVisible);
				}).addEventListener("select:buttonPosition", (t) => {
					if (!this.votOverlayView.isInitialized()) return;
					let n = this.data.buttonPos ?? t;
					this.votOverlayView.updateButtonLayout(n, VOTButton.calcDirection(n));
				}).addEventListener("select:menuLanguage", async () => {
					await this.reloadMenu();
				}).addEventListener("click:bugReport", () => {
					if (!this.videoHandler) return;
					let t = new URLSearchParams(this.videoHandler.collectReportInfo()).toString();
					window.open(`${Je}/issues/new?${t}`, "_blank")?.focus();
				}).addEventListener("click:resetSettings", async () => {
					let t = await q.list();
					await Promise.all(t.map(async (t) => await q.delete(t))), await q.set("compatVersion", rt), window.location.reload();
				});
			}
			async reloadMenu() {
				if (!this.votOverlayView?.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				if (this.videoHandler?.stopTranslation(), this.release(), this.initUI(), this.initUIEvents(), !this.videoHandler) return this;
				await this.videoHandler.updateSubtitlesLangSelect(), this.videoHandler.subtitlesWidget.portal = this.votOverlayView.votOverlayPortal, this.videoHandler.subtitlesWidget.strTranslatedTokens = "";
			}
			async handleTranslationBtnClick() {
				if (!this.votOverlayView?.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				if (!this.videoHandler) return this;
				if (U.log("[handleTranslationBtnClick] click translationBtn"), this.videoHandler.hasActiveSource()) return U.log("[handleTranslationBtnClick] video has active source"), this.videoHandler.stopTranslation(), this;
				if (this.votOverlayView.votButton.status !== "none" || this.votOverlayView.votButton.loading) return U.log("[handleTranslationBtnClick] translationBtn isn't in none state"), this.videoHandler.actionsAbortController.abort(), this.videoHandler.stopTranslation(), this;
				try {
					if (U.log("[handleTranslationBtnClick] trying execute translation"), !this.videoHandler.videoData?.videoId) throw new VOTLocalizedError("VOTNoVideoIDFound");
					(this.videoHandler.site.host === "vk" && this.videoHandler.site.additionalData === "clips" || this.videoHandler.site.host === "douyin") && (this.videoHandler.videoData = await this.videoHandler.getVideoData()), U.log("[handleTranslationBtnClick] Run translateFunc", this.videoHandler.videoData.videoId), await this.videoHandler.translateFunc(this.videoHandler.videoData.videoId, this.videoHandler.videoData.isStream, this.videoHandler.videoData.detectedLanguage, this.videoHandler.videoData.responseLanguage, this.videoHandler.videoData.translationHelp);
				} catch (t) {
					if (console.error("[VOT]", t), !(t instanceof Error)) return this.transformBtn("error", String(t)), this;
					let n = t.name === "VOTLocalizedError" ? t.localizedMessage : t.message;
					this.transformBtn("error", n);
				}
				return this;
			}
			isLoadingText(t) {
				return typeof t == "string" && (t.includes(J.get("translationTake")) || t.includes(J.get("TranslationDelayed")));
			}
			transformBtn(t, n) {
				if (!this.votOverlayView?.isInitialized()) throw Error("[VOT] OverlayView isn't initialized");
				return this.votOverlayView.votButton.status = t, this.votOverlayView.votButton.loading = t === "error" && this.isLoadingText(n), this.votOverlayView.votButton.setText(n), this.votOverlayView.votButtonTooltip.setContent(n), this;
			}
			releaseUI(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] UIManager isn't initialized");
				return this.votOverlayView.releaseUI(!0), this.votSettingsView.releaseUI(!0), this.votGlobalPortal.remove(), this.initialized = t, this;
			}
			releaseUIEvents(t = !1) {
				if (!this.isInitialized()) throw Error("[VOT] UIManager isn't initialized");
				return this.votOverlayView.releaseUIEvents(!1), this.votSettingsView.releaseUIEvents(!1), this.initialized = t, this;
			}
			release() {
				return this.releaseUI(!0), this.releaseUIEvents(!1), this;
			}
		}
		let xn = "vot_iframe_player", Sn = "service", Cn = "www.youtube.com", wn = E.minChunkSize, Tn = .9, En = [
			6e4,
			8e4,
			15e4,
			33e4,
			46e4
		], Dn = 15e3, On = .9, getRequestUrl = (t) => typeof t == "string" ? t : t.url;
		function serializeRequestInit(t) {
			let n = new Uint8Array([120, 0]);
			if (typeof t == "string") return {
				body: n,
				cache: "no-store",
				credentials: "include",
				method: "POST"
			};
			let { headers: i, cache: s, credentials: d, integrity: f, keepalive: p, method: m, mode: h, redirect: g, referrer: _, referrerPolicy: v } = t, b = [...i.entries()];
			return {
				body: n,
				cache: s,
				credentials: d,
				headersEntries: b,
				integrity: f,
				keepalive: p,
				method: m,
				mode: h,
				redirect: g,
				referrer: _,
				referrerPolicy: v
			};
		}
		function deserializeRequestInit(t) {
			let { headersEntries: n,...i } = t, s = new Headers(n);
			return {
				...i,
				headers: s
			};
		}
		function serializeResponse(t) {
			let { ok: n, redirected: i, status: s, statusText: d, type: f, url: p } = t;
			return {
				ok: n,
				redirected: i,
				status: s,
				statusText: d,
				type: f,
				url: p
			};
		}
		let kn = "", getAdaptiveFormats = () => YoutubeHelper.getPlayerResponse()?.streamingData?.adaptiveFormats;
		async function isEncodedRequest(t, n) {
			if (!t.includes("googlevideo.com/videoplayback") || typeof n == "string") return !1;
			try {
				let t = n.clone().body?.getReader();
				if (!t) return !1;
				let i = 0;
				for (;;) {
					let { done: n, value: s } = await t.read();
					if (n) break;
					if (i += s.length, i > 2) return !0;
				}
			} catch {}
			return !1;
		}
		function selectBestAudioFormat() {
			let t = getAdaptiveFormats();
			if (!t?.length) {
				let n = t ? "Empty adaptive formats" : "Cannot get adaptive formats";
				throw Error(`Audio downloader. WEB API. ${n}`);
			}
			let n = t.filter(({ audioQuality: t, mimeType: n }) => t || n?.includes("audio"));
			if (!n.length) throw Error("Audio downloader. WEB API. No audio adaptive formats");
			let i = n.filter(({ itag: t }) => t === 251).sort(({ contentLength: t }, { contentLength: n }) => t && n ? Number.parseInt(t) - Number.parseInt(n) : -1);
			return i.at(-1) ?? n[0];
		}
		let waitForPlayer = async () => (await waitForCondition(() => !!YoutubeHelper.getPlayer(), 1e4), YoutubeHelper.getPlayer());
		async function getDownloadAudioData(t) {
			try {
				kn = t.messageId, U.log("getDownloadAudioData", t);
				let n = unsafeWindow.fetch;
				unsafeWindow.fetch = async (i, s) => {
					i instanceof URL && (i = i.toString());
					let d = getRequestUrl(i);
					if (await isEncodedRequest(d, i)) return window.parent.postMessage({
						...t,
						messageDirection: "response",
						error: "Audio downloader. Detected encoded request."
					}, "*"), unsafeWindow.fetch = n, n(i, s);
					let f = await n(i, s);
					return t.messageId === kn ? (d.includes("&itag=251&") && (unsafeWindow.fetch = n, window.parent.postMessage({
						...t,
						messageDirection: "response",
						payload: {
							requestInfo: d,
							requestInit: s || serializeRequestInit(i),
							adaptiveFormat: selectBestAudioFormat(),
							itag: 251
						}
					}, "*")), f) : (unsafeWindow.fetch = n, f);
				};
				let i = await waitForPlayer();
				if (t.messageId !== kn) throw Error("Audio downloader. Download started for another video while getting player");
				if (!i?.loadVideoById) throw Error("Audio downloader. There is no player.loadVideoById in iframe");
				i.loadVideoById(t.payload.videoId), i.pauseVideo?.(), i.mute?.(), setTimeout(() => {
					if (t.messageId !== kn) {
						console.error("Audio Downloader. Download started for another video while waiting to repause video");
						return;
					}
					if (!i) {
						console.error("[Critical] Audio Downloader. Player not found in iframe after timeout");
						return;
					}
					i.pauseVideo?.();
				}, 1e3);
			} catch (n) {
				window.parent.postMessage({
					...t,
					messageDirection: "response",
					error: n
				}, "*");
			}
		}
		let handleIframeMessage = async ({ data: t }) => {
			if (t?.messageDirection === "request") try {
				switch (t.messageType) {
					case "get-download-audio-data-in-iframe":
						await getDownloadAudioData(t.payload);
						break;
					default: U.log(`NOT IMPLEMENTED: ${t.messageType}`, t.payload);
				}
			} catch (t) {
				console.error("[VOT] Main world bridge", { error: t });
			}
		};
		function initAudioDownloaderIframe() {
			return initIframeService(Sn, handleIframeMessage);
		}
		async function handleAuthCallbackPage() {
			let { access_token: t, expires_in: n } = Object.fromEntries(new URLSearchParams(window.location.hash.slice(1)));
			if (!t || !n) throw Error("[VOT] Invalid token response");
			let i = parseInt(n);
			if (Number.isNaN(i)) throw Error("[VOT] Invalid expires_in value");
			await q.set("account", {
				token: t,
				expires: Date.now() + i * 1e3,
				username: void 0,
				avatarId: void 0
			});
		}
		async function handleProfilePage() {
			let { avatar_id: t, username: n } = unsafeWindow._userData;
			if (!t || !n) throw Error("[VOT] Invalid user data");
			let i = await q.get("account");
			if (!i) throw Error("[VOT] No account data found");
			await q.set("account", {
				...i,
				username: n,
				avatarId: t
			});
		}
		async function initAuth() {
			if (window.location.pathname === "/auth/callback") return await handleAuthCallbackPage();
			if (window.location.pathname === "/my/profile") return await handleProfilePage();
		}
		class CacheManager {
			cache;
			constructor() {
				this.cache = new Map();
			}
			get(t) {
				return this.cache.get(t);
			}
			set(t, n) {
				return this.cache.set(t, n), this;
			}
			delete(t) {
				return this.cache.delete(t), this;
			}
			getTranslation(t) {
				let n = this.get(t);
				return n ? n.translation : void 0;
			}
			setTranslation(t, n) {
				let i = this.get(t) || {};
				i.translation = n, this.set(t, i);
			}
			getSubtitles(t) {
				let n = this.get(t);
				return n ? n.subtitles : void 0;
			}
			setSubtitles(t, n) {
				let i = this.get(t) || {};
				i.subtitles = n, this.set(t, i);
			}
			deleteSubtitles(t) {
				let n = this.get(t);
				n && (n.subtitles = void 0, this.set(t, n));
			}
		}
		let An = null, jn = 1, Mn = new TextDecoder("ascii");
		async function sendAudioDownloadRequestToIframe(t) {
			let { videoId: n } = t.payload, i = `https://${Cn}/embed/${n}?autoplay=0&mute=1`;
			try {
				let n = await ensureServiceIframe(An, i, xn, Sn);
				if (!hasServiceIframe(xn)) throw Error("Audio downloader. WEB API. Service iframe deleted");
				n.contentWindow?.postMessage({
					messageId: generateMessageId(),
					messageType: "get-download-audio-data-in-iframe",
					messageDirection: "request",
					payload: t,
					error: t.error
				}, "*");
			} catch (n) {
				t.error = n, t.messageDirection = "response", window.postMessage(t, "*");
			}
		}
		let getDownloadAudioDataInMainWorld = (t) => requestDataFromMainWorld("get-download-audio-data-in-main-world", t), Nn = "Audio downloader. WEB API. Can not get getGeneratingAudioUrlsDataFromIframe due to timeout";
		async function getGeneratingAudioUrlsDataFromIframe(t) {
			try {
				return await Promise.race([getDownloadAudioDataInMainWorld({ videoId: t }), timeout(2e4, Nn)]);
			} catch (t) {
				let n = t instanceof Error && t.message === Nn;
				throw Error(n ? Nn : "Audio downloader. WEB API. Failed to get audio data");
			}
		}
		function makeFileId(t, n) {
			return JSON.stringify({
				downloadType: Ie.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
				itag: t,
				minChunkSize: wn,
				fileSize: n
			});
		}
		function parseContentLength({ contentLength: t }) {
			if (typeof t != "string") throw Error(`Audio downloader. WEB API. Content length (${t}) is not a string`);
			let n = Number.parseInt(t);
			if (!Number.isFinite(n)) throw Error(`Audio downloader. WEB API. Parsed content length is not finite (${n})`);
			return n;
		}
		function getChunkRangesPartsFromContentLength(t) {
			if (t < 1) throw Error("Audio downloader. WEB API. contentLength must be at least 1");
			let n = Math.round(t * Tn), i = [], s = [], d = 0, f = 0, p = 0, m = Math.min(En[f], t);
			for (; m < t;) {
				let t = m < n;
				s.push({
					start: p,
					end: m,
					mustExist: t
				}), d += m - p, d >= wn && (i.push(s), s = [], d = 0), f < En.length - 1 && f++, p = m + 1, m += En[f];
			}
			return m = t, s.push({
				start: p,
				end: m,
				mustExist: !1
			}), i.push(s), i;
		}
		function getChunkRangesFromContentLength(t) {
			if (t < 1) throw Error("Audio downloader. WEB API. contentLength cannot be less than 1");
			let n = Math.round(t * Tn), i = [], s = 0, d = 0, f = Math.min(En[s], t);
			for (; f < t;) {
				let t = f < n;
				i.push({
					start: d,
					end: f,
					mustExist: t
				}), s !== En.length - 1 && s++, d = f + 1, f += En[s];
			}
			return i.push({
				start: d,
				end: t,
				mustExist: !1
			}), i;
		}
		function getChunkRangesPartsFromAdaptiveFormat(t) {
			let n = parseContentLength(t), i = getChunkRangesPartsFromContentLength(n);
			if (!i.length) throw Error("Audio downloader. WEB API. No chunk parts generated");
			return i;
		}
		let Pn = "Audio downloader. WEB API. Incorrect response on fetch media url", Fn = "Audio downloader. WEB API. Can not fetch media url", In = "Audio downloader. WEB API. Can not get array buffer from media url";
		function isChunkLengthAcceptable(t, { start: n, end: i }) {
			let s = i - n;
			return s > Dn && t.byteLength < Dn ? !1 : Math.min(s, t.byteLength) / Math.max(s, t.byteLength) > On;
		}
		function patchMediaUrl(t, { start: n, end: i }) {
			let s = new URL(t);
			return s.searchParams.set("range", `${n}-${i}`), s.searchParams.set("rn", String(jn++)), s.searchParams.delete("ump"), s.toString();
		}
		let getUrlFromArrayBuffer = (t) => {
			let n = Mn.decode(t).match(/https:\/\/.*$/);
			return n?.[0] ?? null;
		};
		async function fetchMediaWithMeta({ mediaUrl: t, chunkRange: n, requestInit: i, signal: s, isUrlChanged: d = !1 }) {
			let f = patchMediaUrl(t, n), p;
			try {
				if (p = await GM_fetch(f, {
					...i,
					signal: s
				}), !p.ok) {
					let t = serializeResponse(p);
					throw console.error(Pn, t), Error(Pn);
				}
			} catch (t) {
				throw t instanceof Error && t.message === Pn ? t : (console.error(Fn, {
					mediaUrl: f,
					error: t
				}), Error(Fn));
			}
			let m;
			try {
				m = await p.arrayBuffer();
			} catch (t) {
				throw console.error(In, {
					mediaUrl: f,
					error: t
				}), Error(In);
			}
			if (isChunkLengthAcceptable(m, n)) return {
				media: m,
				url: d ? t : null,
				isAcceptableLast: !1
			};
			let h = getUrlFromArrayBuffer(m);
			if (h) return fetchMediaWithMeta({
				mediaUrl: h,
				chunkRange: n,
				requestInit: i,
				signal: s,
				isUrlChanged: !0
			});
			if (!n.mustExist) return {
				media: m,
				url: null,
				isAcceptableLast: !0
			};
			throw Error(`Audio downloader. WEB API. Can not get redirected media url ${f}`);
		}
		function mergeBuffers(t) {
			let n = t.reduce((t, n) => t + n.byteLength, 0), i = new Uint8Array(n), s = 0;
			for (let n of t) i.set(new Uint8Array(n), s), s += n.byteLength;
			return i;
		}
		async function fetchMediaWithMetaByChunkRanges(t, n, i, s) {
			let d = t, f = [], p = !1;
			for (let t of i) {
				let i = await fetchMediaWithMeta({
					mediaUrl: d,
					chunkRange: t,
					requestInit: n,
					signal: s
				});
				if (i.url && (d = i.url), f.push(i.media), p = i.isAcceptableLast, p) break;
			}
			return {
				media: mergeBuffers(f),
				url: d,
				isAcceptableLast: p
			};
		}
		function getChunkRangesFromAdaptiveFormat(t) {
			let n = parseContentLength(t), i = getChunkRangesFromContentLength(n);
			if (!i.length) throw Error("Audio downloader. WEB API. Empty chunk ranges");
			return i;
		}
		async function getAudioFromWebApiWithReplacedFetch({ videoId: t, returnByParts: n = !1, signal: i }) {
			let { requestInit: s, requestInfo: d, adaptiveFormat: f, itag: p } = await getGeneratingAudioUrlsDataFromIframe(t);
			if (!d) throw Error("Audio downloader. WEB API. Can not get requestInfo");
			let m = getRequestUrl(d), h = serializeRequestInit(d), g = deserializeRequestInit(h), _ = s || g;
			return {
				fileId: makeFileId(p, f.contentLength),
				mediaPartsLength: n ? getChunkRangesPartsFromAdaptiveFormat(f).length : 1,
				async *getMediaBuffers() {
					if (n) {
						let t = getChunkRangesPartsFromAdaptiveFormat(f);
						for (let n of t) {
							let { media: t, url: s, isAcceptableLast: d } = await fetchMediaWithMetaByChunkRanges(m, _, n, i);
							if (s && (m = s), yield t, d) break;
						}
					} else {
						let t = getChunkRangesFromAdaptiveFormat(f), { media: n } = await fetchMediaWithMetaByChunkRanges(m, _, t, i);
						yield n;
					}
				}
			};
		}
		async function handleCommonAudioDownloadRequest({ audioDownloader: t, translationId: n, videoId: i, signal: s }) {
			let d = await getAudioFromWebApiWithReplacedFetch({
				videoId: i,
				returnByParts: !0,
				signal: s
			});
			if (!d) throw Error("Audio downloader. Can not get audio data");
			U.log("Audio downloader. Url found", { audioDownloadType: "web_api_get_all_generating_urls_data_from_iframe" });
			let { getMediaBuffers: f, mediaPartsLength: p, fileId: m } = d;
			if (p < 2) {
				let { value: s } = await f().next();
				if (!s) throw Error("Audio downloader. Empty audio");
				t.onDownloadedAudio.dispatch(n, {
					videoId: i,
					fileId: m,
					audioData: s
				});
				return;
			}
			let h = 0;
			for await (let s of f()) {
				if (!s) throw Error("Audio downloader. Empty audio");
				t.onDownloadedPartialAudio.dispatch(n, {
					videoId: i,
					fileId: m,
					audioData: s,
					version: 1,
					index: h,
					amount: p
				}), h++;
			}
		}
		async function mainWorldMessageHandler({ data: t }) {
			try {
				if (t?.messageDirection !== "request") return;
				switch (t.messageType) {
					case "get-download-audio-data-in-main-world":
						await sendAudioDownloadRequestToIframe(t);
						break;
				}
			} catch (t) {
				console.error("[VOT] Main world bridge", { error: t });
			}
		}
		class AudioDownloader {
			onDownloadedAudio = new EventImpl();
			onDownloadedPartialAudio = new EventImpl();
			onDownloadAudioError = new EventImpl();
			async runAudioDownload(t, n, i) {
				window.addEventListener("message", mainWorldMessageHandler);
				try {
					await handleCommonAudioDownloadRequest({
						audioDownloader: this,
						translationId: n,
						videoId: t,
						signal: i
					}), U.log("Audio downloader. Audio download finished", { videoId: t });
				} catch (n) {
					console.error("Audio downloader. Failed to download audio", n), this.onDownloadAudioError.dispatch(t);
				}
				window.removeEventListener("message", mainWorldMessageHandler);
			}
			addEventListener(t, n) {
				switch (t) {
					case "downloadedAudio":
						this.onDownloadedAudio.addListener(n);
						break;
					case "downloadedPartialAudio":
						this.onDownloadedPartialAudio.addListener(n);
						break;
					case "downloadAudioError":
						this.onDownloadAudioError.addListener(n);
						break;
				}
				return this;
			}
			removeEventListener(t, n) {
				switch (t) {
					case "downloadedAudio":
						this.onDownloadedAudio.removeListener(n);
						break;
					case "downloadedPartialAudio":
						this.onDownloadedPartialAudio.removeListener(n);
						break;
					case "downloadAudioError":
						this.onDownloadAudioError.removeListener(n);
						break;
				}
				return this;
			}
		}
		class VOTTranslationHandler {
			videoHandler;
			audioDownloader;
			downloading;
			constructor(t) {
				this.videoHandler = t, this.audioDownloader = new AudioDownloader(), this.downloading = !1, this.audioDownloader.addEventListener("downloadedAudio", async (t, n) => {
					if (U.log("downloadedAudio", n), !this.downloading) {
						U.log("skip downloadedAudio");
						return;
					}
					let { videoId: i, fileId: s, audioData: d } = n, f = this.getCanonicalUrl(i);
					try {
						await this.videoHandler.votClient.requestVtransAudio(f, t, {
							audioFile: d,
							fileId: s
						});
					} catch {}
					this.downloading = !1;
				}).addEventListener("downloadedPartialAudio", async (t, n) => {
					if (U.log("downloadedPartialAudio", n), !this.downloading) {
						U.log("skip downloadedPartialAudio");
						return;
					}
					let { audioData: i, fileId: s, videoId: d, amount: f, version: p, index: m } = n, h = this.getCanonicalUrl(d);
					try {
						await this.videoHandler.votClient.requestVtransAudio(h, t, {
							audioFile: i,
							chunkId: m
						}, {
							audioPartsLength: f,
							fileId: s,
							version: p
						});
					} catch {
						this.downloading = !1;
					}
					m === f - 1 && (this.downloading = !1);
				}).addEventListener("downloadAudioError", async (t) => {
					if (!this.downloading) {
						U.log("skip downloadAudioError");
						return;
					}
					U.log(`Failed to download audio ${t}`);
					let n = this.getCanonicalUrl(t);
					await this.videoHandler.votClient.requestVtransFailAudio(n), this.downloading = !1;
				});
			}
			getCanonicalUrl(t) {
				return `https://youtu.be/${t}`;
			}
			isWaitingStreamRes(t) {
				return !!t.message;
			}
			async translateVideoImpl(t, n, i, s = null, d = !1, f = new AbortController().signal) {
				clearTimeout(this.videoHandler.autoRetry), this.downloading = !1, U.log(t, `Translate video (requestLang: ${n}, responseLang: ${i})`, f);
				try {
					if (f.aborted) throw Error("AbortError");
					let p = await this.videoHandler.votClient.translateVideo({
						videoData: t,
						requestLang: n,
						responseLang: i,
						translationHelp: s,
						extraOpts: {
							useLivelyVoice: this.videoHandler.data?.useLivelyVoice,
							videoTitle: this.videoHandler.videoData?.title
						},
						shouldSendFailedAudio: d
					});
					if (U.log("Translate video result", p), f.aborted) throw Error("AbortError");
					if (p.translated && p.remainingTime < 1) return U.log("Video translation finished with this data: ", p), p;
					let m = p.message ?? J.get("translationTakeFewMinutes");
					if (await this.videoHandler.updateTranslationErrorMsg(p.remainingTime > 0 ? secsToStrTime(p.remainingTime) : m), p.status === j.AUDIO_REQUESTED && t.host === "youtube") {
						if (U.log("Start audio download"), this.downloading = !0, await this.audioDownloader.runAudioDownload(t.videoId, p.translationId, f), U.log("waiting downloading finish"), await waitForCondition(() => !this.downloading || f.aborted, 15e3), f.aborted) throw U.log("aborted after audio downloader vtrans"), Error("AbortError");
						return await this.translateVideoImpl(t, n, i, s, !0, f);
					}
				} catch (s) {
					if (s.message === "AbortError") return U.log("aborted video translation"), null;
					await this.videoHandler.updateTranslationErrorMsg(s.data?.message ?? s), console.error("[VOT]", s);
					let d = `${t.videoId}_${n}_${i}_${this.videoHandler.data?.useLivelyVoice}`;
					return this.videoHandler.cacheManager.setTranslation(d, { error: s }), null;
				}
				return new Promise((d) => {
					this.videoHandler.autoRetry = setTimeout(async () => {
						d(await this.translateVideoImpl(t, n, i, s, !0, f));
					}, 2e4);
				});
			}
			async translateStreamImpl(t, n, i, s = new AbortController().signal) {
				clearTimeout(this.videoHandler.autoRetry), U.log(t, `Translate stream (requestLang: ${n}, responseLang: ${i})`);
				try {
					if (s.aborted) throw Error("AbortError");
					let d = await this.videoHandler.votClient.translateStream({
						videoData: t,
						requestLang: n,
						responseLang: i
					});
					if (s.aborted) throw Error("AbortError");
					if (U.log("Translate stream result", d), !d.translated && d.interval === 10) return await this.videoHandler.updateTranslationErrorMsg(J.get("translationTakeFewMinutes")), new Promise((f) => {
						this.videoHandler.autoRetry = setTimeout(async () => {
							f(await this.translateStreamImpl(t, n, i, s));
						}, d.interval * 1e3);
					});
					if (this.isWaitingStreamRes(d)) throw U.log(`Stream translation aborted! Message: ${d.message}`), new VOTLocalizedError("streamNoConnectionToServer");
					if (!d.result) throw U.log("Failed to find translation result! Data:", d), new VOTLocalizedError("audioNotReceived");
					return U.log("Stream translated successfully. Running...", d), this.videoHandler.streamPing = setInterval(async () => {
						U.log("Ping stream translation", d.pingId), this.videoHandler.votClient.pingStream({ pingId: d.pingId });
					}, d.interval * 1e3), d;
				} catch (t) {
					return t.message === "AbortError" ? (U.log("aborted stream translation"), null) : (console.error("[VOT] Failed to translate stream", t), await this.videoHandler.updateTranslationErrorMsg(t.data?.message ?? t), null);
				}
			}
		}
		class VOTVideoManager {
			videoHandler;
			constructor(t) {
				this.videoHandler = t;
			}
			async getVideoData() {
				let { duration: t, url: n, videoId: i, host: s, title: d, translationHelp: f = null, localizedTitle: p, description: m, detectedLanguage: h, subtitles: g, isStream: _ = !1 } = await getVideoData(this.videoHandler.site, {
					fetchFn: GM_fetch,
					video: this.videoHandler.video,
					language: J.lang
				}), v = h ?? this.videoHandler.translateFromLang;
				if (!h && d) {
					let t = cleanText(d, m);
					U.log(`Detecting language text: ${t}`);
					let n = await detect(t);
					W.includes(n) && (v = n);
				}
				let b = {
					translationHelp: f,
					isStream: _,
					duration: t || this.videoHandler.video?.duration || E.defaultDuration,
					videoId: i,
					url: n,
					host: s,
					detectedLanguage: v,
					responseLanguage: this.videoHandler.translateToLang,
					subtitles: g,
					title: d,
					localizedTitle: p,
					downloadTitle: p ?? d ?? i
				};
				if (console.log("[VOT] Detected language:", v), [
					"rutube",
					"ok.ru",
					"mail_ru"
				].includes(this.videoHandler.site.host)) b.detectedLanguage = "ru";
				else if (this.videoHandler.site.host === "youku") b.detectedLanguage = "zh";
				else if (this.videoHandler.site.host === "vk") {
					let t = document.getElementsByTagName("track")?.[0]?.srclang;
					b.detectedLanguage = t || "auto";
				} else this.videoHandler.site.host === "weverse" && (b.detectedLanguage = "ko");
				return b;
			}
			videoValidator() {
				if (!this.videoHandler.videoData || !this.videoHandler.data) throw new VOTLocalizedError("VOTNoVideoIDFound");
				if (U.log("VideoValidator videoData: ", this.videoHandler.videoData), this.videoHandler.data.enabledDontTranslateLanguages && this.videoHandler.data.dontTranslateLanguages?.includes(this.videoHandler.videoData.detectedLanguage)) throw new VOTLocalizedError("VOTDisableFromYourLang");
				if (this.videoHandler.site.host === "twitch" && this.videoHandler.videoData.isStream) throw new VOTLocalizedError("VOTStreamNotAvailable");
				if (!this.videoHandler.videoData.isStream && this.videoHandler.videoData.duration > 14400) throw new VOTLocalizedError("VOTVideoIsTooLong");
				return !0;
			}
			getVideoVolume() {
				let t = this.videoHandler.video?.volume;
				return ["youtube", "googledrive"].includes(this.videoHandler.site.host) && (t = YoutubeHelper.getVolume() ?? t), t;
			}
			setVideoVolume(t) {
				if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
					let n = YoutubeHelper.setVolume(t);
					if (n) return this.videoHandler;
				}
				return this.videoHandler.video.volume = t, this;
			}
			isMuted() {
				return ["youtube", "googledrive"].includes(this.videoHandler.site.host) ? YoutubeHelper.isMuted() : this.videoHandler.video?.muted;
			}
			syncVideoVolumeSlider() {
				let t = this.isMuted() ? 0 : this.getVideoVolume() * 100, n = Math.round(t);
				return this.videoHandler.data?.syncVolume && (this.videoHandler.tempOriginalVolume = Number(n)), this.videoHandler.uiManager.votOverlayView?.isInitialized() && (this.videoHandler.uiManager.votOverlayView.videoVolumeSlider.value = n), this;
			}
			setSelectMenuValues(t, n) {
				if (!this.videoHandler.uiManager.votOverlayView?.isInitialized() || !this.videoHandler.videoData) return this;
				console.log(`[VOT] Set translation from ${t} to ${n}`), this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.selectTitle = J.get(`langs.${t}`), this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.selectTitle = J.get(`langs.${n}`), this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.setSelectedValue(t), this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.setSelectedValue(n), this.videoHandler.videoData.detectedLanguage = t, this.videoHandler.videoData.responseLanguage = n;
			}
		}
		let Ln;
		class VideoHandler {
			translateFromLang = "auto";
			translateToLang = ft;
			timer;
			data;
			videoData;
			firstPlay = !0;
			audioContext = initAudioContext();
			hls;
			votClient;
			audioPlayer;
			abortController;
			actionsAbortController;
			cacheManager;
			downloadTranslationUrl = null;
			autoRetry;
			streamPing;
			votOpts;
			volumeOnStart;
			tempOriginalVolume;
			tempVolume;
			firstSyncVolume = !0;
			longWaitingResCount = 0;
			subtitles = [];
			constructor(t, n, i) {
				U.log("[VideoHandler] add video:", t, "container:", n, this), this.video = t, this.container = n, this.site = i, this.abortController = new AbortController(), this.actionsAbortController = new AbortController(), this.extraEvents = [], this.uiManager = new UIManager({
					root: this.container,
					portalContainer: this.getPortalContainer(),
					tooltipLayoutRoot: this.getTooltipLayoutRoot(),
					data: this.data,
					videoHandler: this
				}), this.translationHandler = new VOTTranslationHandler(this), this.videoManager = new VOTVideoManager(this), this.cacheManager = new CacheManager();
			}
			getPortalContainer() {
				return this.site.host === "youtube" && this.site.additionalData !== "mobile" ? this.container.parentElement : this.container;
			}
			getTooltipLayoutRoot() {
				switch (this.site.host) {
					case "kickstarter": return document.getElementById("react-project-header");
					case "custom": return;
					default: return this.container;
				}
			}
			getEventContainer() {
				return this.site.eventSelector ? this.site.host === "twitter" ? this.container.closest(this.site.eventSelector) : document.querySelector(this.site.eventSelector) : this.container;
			}
			async autoTranslate() {
				if (this.firstPlay && this.data.autoTranslate && this.videoData.videoId) {
					this.firstPlay = !1;
					try {
						this.videoManager.videoValidator(), await this.uiManager.handleTranslationBtnClick();
					} catch (t) {
						console.error("[VOT]", t);
						return;
					}
				}
			}
			getPreferAudio() {
				return !this.audioContext || !this.data.newAudioPlayer || this.videoData.isStream ? !0 : this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP ? !1 : !this.site.needBypassCSP;
			}
			createPlayer() {
				let t = this.getPreferAudio();
				return U.log("preferAudio:", t), this.audioPlayer = new Chaimu({
					video: this.video,
					debug: !1,
					fetchFn: GM_fetch,
					fetchOpts: { timeout: 0 },
					preferAudio: t
				}), this;
			}
			async init() {
				if (!this.initialized) {
					if (this.data = await q.getValues({
						autoTranslate: !1,
						dontTranslateLanguages: [ft],
						enabledDontTranslateLanguages: !0,
						enabledAutoVolume: !0,
						autoVolume: Ye,
						buttonPos: "default",
						showVideoSlider: !0,
						syncVolume: !1,
						downloadWithName: !0,
						sendNotifyOnComplete: !1,
						subtitlesMaxLength: 300,
						highlightWords: !1,
						subtitlesFontSize: 20,
						subtitlesOpacity: 20,
						subtitlesDownloadFormat: "srt",
						responseLanguage: ft,
						defaultVolume: 100,
						onlyBypassMediaCSP: Number(!!this.audioContext),
						newAudioPlayer: Number(!!this.audioContext),
						showPiPButton: !1,
						translateAPIErrors: !0,
						translationService: Qe,
						detectService: $e,
						translationHotkey: null,
						m3u8ProxyHost: ze,
						proxyWorkerHost: Be,
						translateProxyEnabled: 0,
						translateProxyEnabledDefault: !0,
						audioBooster: !1,
						useLivelyVoice: !1,
						autoHideButtonDelay: nt,
						useAudioDownload: !0,
						compatVersion: "",
						account: {},
						localeHash: "",
						localeUpdatedAt: 0
					}), this.data.compatVersion !== rt && (this.data = await updateConfig(this.data), await q.set("compatVersion", rt)), this.uiManager.data = this.data, console.log("[VOT] data from db: ", this.data), !this.data.translateProxyEnabled && pt && (this.data.translateProxyEnabled = 1), !Ln) try {
						let t = await GM_fetch("https://speed.cloudflare.com/meta", { timeout: 7e3 });
						({country: Ln} = await t.json());
					} catch (t) {
						console.error("[VOT] Error getting country:", t);
					}
					tt.includes(Ln) && this.data.translateProxyEnabledDefault && (this.data.translateProxyEnabled = 2), U.log("translateProxyEnabled", this.data.translateProxyEnabled, this.data.translateProxyEnabledDefault), U.log("Extension compatibility passed..."), this.initVOTClient(), this.uiManager.initUI(), this.uiManager.initUIEvents(), this.subtitlesWidget = new SubtitlesWidget(this.video, this.getPortalContainer(), this.site, this.uiManager.votOverlayView.votOverlayPortal, this.getTooltipLayoutRoot()), this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength), this.subtitlesWidget.setHighlightWords(this.data.highlightWords), this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize), this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity), this.createPlayer(), this.setSelectMenuValues(this.videoData.detectedLanguage, this.data.responseLanguage ?? "ru"), this.translateToLang = this.data.responseLanguage ?? "ru", this.initExtraEvents(), await this.autoTranslate(), this.initialized = !0;
				}
			}
			initVOTClient() {
				return this.votOpts = {
					fetchFn: GM_fetch,
					fetchOpts: { signal: this.actionsAbortController.signal },
					apiToken: this.data.account?.token,
					hostVOT: Ve,
					host: this.data.translateProxyEnabled ? this.data.proxyWorkerHost : Re
				}, this.votClient = new (this.data.translateProxyEnabled ? VOTWorkerClient : VOTClient)(this.votOpts), this;
			}
			transformBtn(t, n) {
				return this.uiManager.transformBtn(t, n), this;
			}
			hasActiveSource() {
				return !!(this.audioPlayer.player.src || this.hls?.url);
			}
			initExtraEvents() {
				let { signal: t } = this.abortController, addExtraEventListener = (n, i, s) => {
					this.extraEvents.push({
						element: n,
						event: i,
						handler: s
					}), n.addEventListener(i, s, { signal: t });
				}, addExtraEventListeners = (t, n, i) => {
					for (let s of n) addExtraEventListener(t, s, i);
				};
				if (this.resizeObserver = new ResizeObserver((t) => {
					for (let n of t) this.uiManager.votOverlayView.votMenu.container.style.setProperty("--vot-container-height", `${n.contentRect.height}px`);
					let { position: n, direction: i } = this.uiManager.votOverlayView.calcButtonLayout(this.data?.buttonPos);
					this.uiManager.votOverlayView.updateButtonLayout(n, i);
				}), this.resizeObserver.observe(this.video), this.uiManager.votOverlayView.votMenu.container.style.setProperty("--vot-container-height", `${this.video.getBoundingClientRect().height}px`), ["youtube", "googledrive"].includes(this.site.host) && this.site.additionalData !== "mobile") {
					this.syncVolumeObserver = new MutationObserver((t) => {
						if (!(!this.audioPlayer.player.src || !this.data.syncVolume)) {
							for (let n of t) if (n.type === "attributes" && n.attributeName === "aria-valuenow") {
								if (this.firstSyncVolume) {
									this.firstSyncVolume = !1;
									return;
								}
								let t = this.isMuted() ? 0 : this.getVideoVolume() * 100, n = Math.round(t);
								this.data.defaultVolume = n, this.audioPlayer.player.volume = this.data.defaultVolume / 100, this.syncVolumeWrapper("video", n);
							}
						}
					});
					let t = document.querySelector(".ytp-volume-panel");
					t && this.syncVolumeObserver.observe(t, {
						attributes: !0,
						subtree: !0
					});
				}
				document.addEventListener("click", (t) => {
					let n = t.target, i = this.uiManager.votOverlayView.votButton.container, s = this.uiManager.votOverlayView.votMenu.container, d = this.container, f = this.uiManager.votSettingsView.dialog.container, p = document.querySelector(".vot-dialog-temp"), m = i.contains(n), h = s.contains(n), g = d.contains(n), _ = f.contains(n), v = p?.contains(n) ?? !1;
					U.log(`[document click] ${m} ${h} ${g} ${_} ${v}`), !m && !h && !_ && !v && (g || this.uiManager.votOverlayView.updateButtonOpacity(0), this.uiManager.votOverlayView.votMenu.hidden = !0);
				}, { signal: t });
				let n = new Set();
				document.addEventListener("keydown", async (t) => {
					if (t.repeat) return;
					n.add(t.code);
					let i = document.activeElement, s = ["input", "textarea"].includes(i.tagName.toLowerCase()) || i.isContentEditable;
					if (s) return;
					let d = formatKeysCombo(n);
					U.log(`combo: ${d}`), U.log(`this.data.translationHotkey: ${this.data.translationHotkey}`), d === this.data.translationHotkey && await this.uiManager.handleTranslationBtnClick();
				}, { signal: t }), document.addEventListener("blur", () => {
					n.clear();
				}), document.addEventListener("keyup", (t) => {
					n.delete(t.code);
				}, { signal: t });
				let i = this.getEventContainer();
				i && addExtraEventListeners(i, ["pointermove", "pointerout"], this.resetTimer), addExtraEventListener(this.uiManager.votOverlayView.votButton.container, "pointermove", this.changeOpacityOnEvent), addExtraEventListener(this.uiManager.votOverlayView.votMenu.container, "pointermove", this.changeOpacityOnEvent), this.site.host !== "xvideos" && addExtraEventListener(document, "touchmove", this.resetTimer), addExtraEventListener(this.uiManager.votOverlayView.votButton.container, "pointerdown", (t) => {
					t.stopImmediatePropagation();
				}), addExtraEventListeners(this.uiManager.votOverlayView.votMenu.container, ["pointerdown", "mousedown"], (t) => {
					t.stopImmediatePropagation();
				}), this.site.host === "youtube" && (this.container.draggable = !1), this.site.host === "googledrive" && (this.container.style.height = "100%"), addExtraEventListener(this.video, "canplay", async () => {
					this.site.host === "rutube" && this.video.src || await this.setCanPlay();
				}), addExtraEventListener(this.video, "emptied", async () => {
					let t = await getVideoID(this.site, {
						fetchFn: GM_fetch,
						video: this.video
					});
					this.video.src && this.videoData && t === this.videoData.videoId || (U.log("lipsync mode is emptied"), this.videoData = void 0, this.stopTranslation());
				}), ["rutube", "ok"].includes(this.site.host) || addExtraEventListener(this.video, "volumechange", () => {
					this.syncVideoVolumeSlider();
				}), this.site.host === "youtube" && !this.site.additionalData && addExtraEventListener(document, "yt-page-data-updated", async () => {
					U.log("yt-page-data-updated"), window.location.pathname.includes("/shorts/") && await this.setCanPlay();
				});
			}
			async setCanPlay() {
				let t = await getVideoID(this.site, {
					fetchFn: GM_fetch,
					video: this.video
				});
				this.video.src && this.videoData && t === this.videoData.videoId || (await this.handleSrcChanged(), await this.autoTranslate(), U.log("lipsync mode is canplay"));
			}
			resetTimer = () => {
				clearTimeout(this.timer), this.uiManager.votOverlayView.updateButtonOpacity(1), this.timer = setTimeout(() => {
					this.uiManager.votOverlayView.updateButtonOpacity(0);
				}, this.data.autoHideButtonDelay);
			};
			changeOpacityOnEvent = (t) => {
				clearTimeout(this.timer), this.uiManager.votOverlayView.updateButtonOpacity(1), t.stopPropagation();
			};
			async changeSubtitlesLang(t) {
				if (U.log("[onchange] subtitles", t), this.uiManager.votOverlayView.subtitlesSelect.setSelectedValue(t), t === "disabled") this.subtitlesWidget.setContent(null), this.uiManager.votOverlayView.downloadSubtitlesButton.hidden = !0, this.yandexSubtitles = null;
				else {
					let n = this.subtitles.at(Number.parseInt(t));
					if (this.data.translateProxyEnabled === 2 && n.url.startsWith("https://brosubs.s3-private.mds.yandex.net/vtrans/")) {
						let t = n.url.replace("https://brosubs.s3-private.mds.yandex.net/vtrans/", "");
						n.url = `https://${this.data.proxyWorkerHost}/video-subtitles/subtitles-proxy/${t}`, console.log(`[VOT] Subs proxied via ${n.url}`);
					}
					this.yandexSubtitles = await SubtitlesProcessor.fetchSubtitles(n), this.subtitlesWidget.setContent(this.yandexSubtitles, n.language), this.uiManager.votOverlayView.downloadSubtitlesButton.hidden = !1;
				}
			}
			async updateSubtitlesLangSelect() {
				if (!this.subtitles || this.subtitles.length === 0) {
					let t = [{
						label: J.get("VOTSubtitlesDisabled"),
						value: "disabled",
						selected: !0,
						disabled: !1
					}];
					this.uiManager.votOverlayView.subtitlesSelect.updateItems(t), await this.changeSubtitlesLang(t[0].value);
					return;
				}
				let t = [{
					label: J.get("VOTSubtitlesDisabled"),
					value: "disabled",
					selected: !0,
					disabled: !1
				}, ...this.subtitles.map((t, n) => ({
					label: (J.get(`langs.${t.language}`) ?? t.language.toUpperCase()) + (t.translatedFromLanguage ? ` ${J.get("VOTTranslatedFrom")} ${J.get(`langs.${t.translatedFromLanguage}`) ?? t.translatedFromLanguage.toUpperCase()}` : "") + (t.source === "yandex" ? "" : `, ${window.location.hostname}`) + (t.isAutoGenerated ? ` (${J.get("VOTAutogenerated")})` : ""),
					value: n,
					selected: !1,
					disabled: !1
				}))];
				this.uiManager.votOverlayView.subtitlesSelect.updateItems(t), await this.changeSubtitlesLang(t[0].value);
			}
			async loadSubtitles() {
				if (!this.videoData?.videoId) {
					console.error(`[VOT] ${J.getDefault("VOTNoVideoIDFound")}`), this.subtitles = [];
					return;
				}
				let t = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useLivelyVoice}`;
				try {
					let n = this.cacheManager.getSubtitles(t);
					n || (n = await SubtitlesProcessor.getSubtitles(this.votClient, this.videoData), this.cacheManager.setSubtitles(t, n)), this.subtitles = n;
				} catch (t) {
					console.error("[VOT] Failed to load subtitles:", t), this.subtitles = [];
				}
				await this.updateSubtitlesLangSelect();
			}
			getVideoVolume() {
				return this.videoManager.getVideoVolume();
			}
			setVideoVolume(t) {
				return this.videoManager.setVideoVolume(t), this;
			}
			isMuted() {
				return this.videoManager.isMuted();
			}
			syncVideoVolumeSlider() {
				this.videoManager.syncVideoVolumeSlider();
			}
			setSelectMenuValues(t, n) {
				this.videoManager.setSelectMenuValues(t, n);
			}
			syncVolumeWrapper(t, n) {
				let i = t === "translation" ? this.uiManager.votOverlayView.videoVolumeSlider : this.uiManager.votOverlayView.translationVolumeSlider, s = Number(i.input.value), d = syncVolume(t === "translation" ? this.video : this.audioPlayer.player, n, s, t === "translation" ? this.tempVolume : this.tempOriginalVolume);
				i.input.value = d, i.label.querySelector("strong").textContent = `${d}%`, UI.updateSlider(i.input), this.tempOriginalVolume = t === "translation" ? d : n, this.tempVolume = t === "translation" ? n : d;
			}
			async getVideoData() {
				return await this.videoManager.getVideoData();
			}
			videoValidator() {
				return this.videoManager.videoValidator();
			}
			stopTranslate() {
				this.audioPlayer.player.removeVideoEvents(), this.audioPlayer.player.clear(), this.audioPlayer.player.src = void 0, U.log("audioPlayer after stopTranslate", this.audioPlayer), this.uiManager.votOverlayView.videoVolumeSlider.hidden = !0, this.uiManager.votOverlayView.translationVolumeSlider.hidden = !0, this.uiManager.votOverlayView.downloadTranslationButton.hidden = !0, this.downloadTranslationUrl = null, this.longWaitingResCount = 0, this.transformBtn("none", J.get("translateVideo")), U.log(`Volume on start: ${this.volumeOnStart}`), this.volumeOnStart && this.setVideoVolume(this.volumeOnStart), clearInterval(this.streamPing), clearTimeout(this.autoRetry), this.hls?.destroy(), this.firstSyncVolume = !0, this.actionsAbortController = new AbortController();
			}
			async updateTranslationErrorMsg(t) {
				let n = J.get("translationTake"), i = J.lang;
				if (this.longWaitingResCount = t === J.get("translationTakeAboutMinute") ? this.longWaitingResCount + 1 : 0, U.log("longWaitingResCount", this.longWaitingResCount), this.longWaitingResCount > Ze && (t = new VOTLocalizedError("TranslationDelayed")), t?.name === "VOTLocalizedError") this.transformBtn("error", t.localizedMessage);
				else if (t instanceof Error) this.transformBtn("error", t?.message);
				else if (this.data.translateAPIErrors && i !== "ru" && !t.includes(n)) {
					this.uiManager.votOverlayView.votButton.loading = !0;
					let n = await translate(t, "ru", i);
					this.transformBtn("error", n);
				} else this.transformBtn("error", t);
				[
					"Подготавливаем перевод",
					"Видео передано в обработку",
					"Ожидаем перевод видео",
					"Загружаем переведенное аудио"
				].includes(t) && (this.uiManager.votOverlayView.votButton.loading = !1);
			}
			afterUpdateTranslation(t) {
				let n = this.uiManager.votOverlayView.votButton.container.dataset.status === "success";
				this.uiManager.votOverlayView.videoVolumeSlider.hidden = !this.data.showVideoSlider || !n, this.uiManager.votOverlayView.translationVolumeSlider.hidden = !n, this.data.enabledAutoVolume && (this.uiManager.votOverlayView.videoVolumeSlider.value = this.data.autoVolume), this.videoData.isStream || (this.uiManager.votOverlayView.downloadTranslationButton.hidden = !1, this.downloadTranslationUrl = t), U.log("afterUpdateTranslation downloadTranslationUrl", this.downloadTranslationUrl), this.data.sendNotifyOnComplete && this.longWaitingResCount && n && GM_notification({
					text: J.get("VOTTranslationCompletedNotify").replace("{0}", window.location.hostname),
					title: GM_info.script.name,
					timeout: 5e3,
					silent: !0,
					tag: "VOTTranslationCompleted",
					onclick: () => {
						window.focus();
					}
				});
			}
			async validateAudioUrl(t) {
				try {
					let n = await GM_fetch(t, { method: "HEAD" });
					if (U.log("Test audio response", n), n.ok) return U.log("Valid audioUrl", t), t;
					U.log("Yandex returned not valid audio, trying to fix..."), this.videoData.detectedLanguage = "auto";
					let i = await this.translationHandler.translateVideoImpl(this.videoData, this.videoData.detectedLanguage, this.videoData.responseLanguage, this.videoData.translationHelp, !this.data.useAudioDownload, this.actionsAbortController.signal);
					this.setSelectMenuValues(this.videoData.detectedLanguage, this.videoData.responseLanguage), t = i.url, U.log("Fixed audio audioUrl", t);
				} catch (t) {
					U.log("Test audio error:", t);
				}
				return t;
			}
			proxifyAudio(t) {
				if (this.data.translateProxyEnabled === 2 && t.startsWith("https://vtrans.s3-private.mds.yandex.net/tts/prod/")) {
					let n = t.replace("https://vtrans.s3-private.mds.yandex.net/tts/prod/", "");
					t = `https://${this.data.proxyWorkerHost}/video-translation/audio-proxy/${n}`, console.log(`[VOT] Audio proxied via ${t}`);
				}
				return t;
			}
			async updateTranslation(t) {
				t !== this.audioPlayer.player.currentSrc && (t = await this.validateAudioUrl(this.proxifyAudio(t))), this.audioPlayer.player.src !== t && (this.audioPlayer.player.src = t);
				try {
					this.audioPlayer.init();
				} catch (t) {
					U.log("this.audioPlayer.init() error", t), this.transformBtn("error", t.message);
				}
				this.setupAudioSettings(), this.site.host === "twitter" && document.querySelector("button[data-testid=\"app-bar-back\"][role=\"button\"]").addEventListener("click", this.stopTranslation), this.transformBtn("success", J.get("disableTranslate")), this.afterUpdateTranslation(t);
			}
			async translateFunc(t, n, i, s, d) {
				console.log("[VOT] Video Data: ", this.videoData), U.log("Run videoValidator"), this.videoValidator(), this.uiManager.votOverlayView.votButton.loading = !0, this.volumeOnStart = this.getVideoVolume();
				let f = `${t}_${i}_${s}_${this.data.useLivelyVoice}`, p = this.cacheManager.getTranslation(f);
				if (p?.url) {
					await this.updateTranslation(p.url), U.log("[translateFunc] Cached translation was received");
					return;
				}
				if (p?.error) {
					U.log("Skip translation - previous attempt failed"), await this.updateTranslationErrorMsg(p.error.data?.message);
					return;
				}
				if (n) {
					let t = await this.translationHandler.translateStreamImpl(this.videoData, i, s, this.actionsAbortController.signal);
					if (!t) {
						U.log("Skip translation");
						return;
					}
					this.transformBtn("success", J.get("disableTranslate"));
					try {
						this.hls = initHls(), this.audioPlayer.init();
					} catch (t) {
						U.log("this.audioPlayer.init() error", t), this.transformBtn("error", t.message);
					}
					let n = this.setHLSSource(t.result.url);
					return this.site.host === "youtube" && YoutubeHelper.videoSeek(this.video, 10), this.setupAudioSettings(), !this.video.src && !this.video.currentSrc && !this.video.srcObject ? this.stopTranslation() : this.afterUpdateTranslation(n);
				}
				let m = await this.translationHandler.translateVideoImpl(this.videoData, i, s, d, !this.data.useAudioDownload, this.actionsAbortController.signal);
				if (U.log("[translateRes]", m), !m) {
					U.log("Skip translation");
					return;
				}
				await this.updateTranslation(m.url);
				let h = this.cacheManager.getSubtitles(f);
				h?.some((t) => t.source === "yandex" && t.translatedFromLanguage === this.videoData.detectedLanguage && t.language === this.videoData.responseLanguage) || (this.cacheManager.deleteSubtitles(f), this.subtitles = []), this.cacheManager.setTranslation(f, {
					videoId: t,
					from: i,
					to: s,
					url: this.downloadTranslationUrl,
					useLivelyVoice: this.data?.useLivelyVoice
				});
			}
			setupHLS(t) {
				this.hls.on(Hls.Events.MEDIA_ATTACHED, function() {
					U.log("audio and hls.js are now bound together !");
				}), this.hls.on(Hls.Events.MANIFEST_PARSED, function(t) {
					U.log(`manifest loaded, found ${t?.levels?.length} quality level`);
				}), this.hls.loadSource(t), this.hls.attachMedia(this.audioPlayer.player.audio), this.hls.on(Hls.Events.ERROR, function(t) {
					if (t.fatal) switch (t.type) {
						case Hls.ErrorTypes.MEDIA_ERROR:
							console.log("fatal media error encountered, try to recover"), this.hls.recoverMediaError();
							break;
						case Hls.ErrorTypes.NETWORK_ERROR:
							console.error("fatal network error encountered", t);
							break;
						default:
							this.hls.destroy();
							break;
					}
				}), U.log(this.hls);
			}
			setHLSSource(t) {
				let n = `https://${this.data.m3u8ProxyHost}/?all=yes&origin=${encodeURIComponent("https://strm.yandex.ru")}&referer=${encodeURIComponent("https://strm.yandex.ru")}&url=${encodeURIComponent(t)}`;
				if (this.hls) this.setupHLS(n);
				else if (this.audioPlayer.player.audio.canPlayType("application/vnd.apple.mpegurl")) this.audioPlayer.player.src = n;
				else throw new VOTLocalizedError("audioFormatNotSupported");
				return n;
			}
			setupAudioSettings() {
				typeof this.data.defaultVolume == "number" && (this.audioPlayer.player.volume = this.data.defaultVolume / 100), this.data.enabledAutoVolume && this.setVideoVolume((this.data.autoVolume / 100).toFixed(2));
			}
			stopTranslation = () => {
				this.stopTranslate(), this.syncVideoVolumeSlider();
			};
			async handleSrcChanged() {
				U.log("[VideoHandler] src changed", this), this.firstPlay = !0, this.stopTranslation();
				let t = !this.video.src && !this.video.currentSrc && !this.video.srcObject;
				this.uiManager.votOverlayView.votButton.container.hidden = t, t && (this.uiManager.votOverlayView.votMenu.hidden = t), this.site.selector || (this.container = this.video.parentElement), this.container.contains(this.uiManager.votOverlayView.votButton.container) || this.container.append(this.uiManager.votOverlayView.votButton.container, this.uiManager.votOverlayView.votMenu.container), this.videoData = await this.getVideoData();
				let n = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useLivelyVoice}`;
				this.subtitles = this.cacheManager.getSubtitles(n), await this.updateSubtitlesLangSelect(), this.translateToLang = this.data.responseLanguage ?? "ru", this.setSelectMenuValues(this.videoData.detectedLanguage, this.videoData.responseLanguage), this.actionsAbortController = new AbortController();
			}
			async release() {
				U.log("[VideoHandler] release"), this.initialized = !1, this.releaseExtraEvents(), this.subtitlesWidget.release(), this.uiManager.release();
			}
			collectReportInfo() {
				let t = `${K.os.name} ${K.os.version}`, n = `<details>
<summary>Autogenerated by VOT:</summary>
<ul>
  <li>OS: ${t}</li>
  <li>Browser: ${K.browser.name} ${K.browser.version}</li>
  <li>Loader: ${GM_info.scriptHandler} v${GM_info.version}</li>
  <li>Script version: ${GM_info.script.version}</li>
  <li>URL: <code>${window.location.href}</code></li>
  <li>Lang: <code>${this.videoData.detectedLanguage}</code> -> <code>${this.videoData.responseLanguage}</code> (Lively voice: ${this.data.useLivelyVoice} | Audio download: ${this.data.useAudioDownload})</li>
  <li>Player: ${this.data.newAudioPlayer ? "New" : "Old"} (CSP only: ${this.data.onlyBypassMediaCSP})</li>
  <li>Proxying mode: ${this.data.translateProxyEnabled}</li>
</ul>
</details>`, i = `1-bug-report-${J.lang === "ru" ? "ru" : "en"}.yml`;
				return {
					assignees: "ilyhalight",
					template: i,
					os: t,
					"script-version": GM_info.script.version,
					"additional-info": n
				};
			}
			releaseExtraEvents() {
				this.abortController.abort(), this.resizeObserver?.disconnect(), ["youtube", "googledrive"].includes(this.site.host) && this.site.additionalData !== "mobile" && this.syncVolumeObserver?.disconnect();
			}
		}
		let Rn = new VideoObserver(), zn = new WeakMap();
		function climb(t, n) {
			if (!t || !n) return null;
			if (t instanceof Document) return t.querySelector(n);
			let i = t.closest(n);
			if (i) return i;
			let s = t.getRootNode();
			return climb(s instanceof ShadowRoot ? s.host : s, n);
		}
		function findContainer(t, n) {
			if (U.log("findContainer", t, n), t.shadowRoot) {
				let i = climb(n, t.selector);
				return U.log("findContainer with site.shadowRoot", i), i ?? n.parentElement;
			}
			if (U.log("findContainer without shadowRoot"), !t.selector) return n.parentElement;
			let i = document.querySelectorAll(t.selector);
			return Array.from(i).find((t) => t.contains(n)) ?? n.parentElement;
		}
		function initIframeInteractor() {
			let t = { "https://dev.epicgames.com": {
				targetOrigin: "https://dev.epicgames.com",
				dataFilter: (t) => typeof t == "string" && t.startsWith("getVideoId:"),
				extractVideoId: (t) => t.pathname.split("/").slice(-2, -1)[0],
				iframeSelector: (t) => `electra-player > iframe[src="${t}"]`,
				responseFormatter: (t, n) => `${n}:${t}`,
				processRequest: (t) => {
					let n = t.replace("getVideoId:", "");
					return atob(n);
				}
			} }, n = Object.entries(t).find(([t]) => window.location.origin === t && (t !== "https://dev.epicgames.com" || window.location.pathname.includes("/community/learning/")))?.[1];
			n && window.addEventListener("message", (t) => {
				try {
					if (t.origin !== n.targetOrigin || !n.dataFilter(t.data)) return;
					let i = new URL(window.location.href), s = n.extractVideoId(i);
					if (!s) return;
					let d = n.processRequest?.(t.data) || i.href, f = typeof n.iframeSelector == "function" ? n.iframeSelector(d) : n.iframeSelector, p = document.querySelector(f);
					if (!p?.contentWindow) return;
					let m = n.responseFormatter(s, t.data);
					p.contentWindow.postMessage(m, n.targetOrigin);
				} catch (t) {
					console.error("Iframe communication error:", t);
				}
			});
		}
		async function src_main() {
			if (console.log("[VOT] Loading extension..."), isIframe() && window.location.hash.includes(an)) return initAudioDownloaderIframe();
			if (window.location.origin === We) return await initAuth();
			await J.update(), U.log(`Selected menu language: ${J.lang}`), initIframeInteractor(), Rn.onVideoAdded.addListener(async (t) => {
				if (zn.has(t)) return;
				let n, i = getService().find((i) => (n = findContainer(i, t), !!n));
				if (i) {
					["peertube", "directlink"].includes(i.host) && (i.url = window.location.origin);
					try {
						let s = new VideoHandler(t, n, i);
						s.videoData = await s.getVideoData(), await s.init(), zn.set(t, s);
					} catch (t) {
						console.error("[VOT] Failed to initialize videoHandler", t);
					}
				}
			}), Rn.onVideoRemoved.addListener(async (t) => {
				zn.has(t) && (await zn.get(t).release(), zn.delete(t));
			}), Rn.enable();
		}
		src_main().catch((t) => {
			console.error("[VOT]", t);
		});
	})();
})();
