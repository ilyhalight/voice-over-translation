# Voice Over Translation

<!-- loaders links (website > github > store) -->

[tampermonkey-link]: https://www.tampermonkey.net/index.php
[violentmonkey-opera]: https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag
[userscripts-safari]: https://github.com/quoid/userscripts
[violetmonkey-link]: https://violentmonkey.github.io
[adguard-userscripts]: https://kb.adguard.com/en/general/userscripts#supported-apps
[firemonkey-link]: https://erosman.github.io/firemonkey/
[greasemonkey-link]: https://github.com/greasemonkey/greasemonkey
[user-js-and-css-link]: https://tenrabbits.github.io/user-js-css-docs/

<!-- FAQs / Wiki -->

[firemonkey-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-firemonkey
[user-js-and-css-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-user-js-and-css
[devmode-enable]: https://www.tampermonkey.net/faq.php#Q209
[opera-search-results-access]: https://help.opera.com/en/extensions/content-scripts/
[vot-faq]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ
[vot-supported-sites]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-Supported-sites
[vot-wiki]: https://github.com/ilyhalight/voice-over-translation/wiki

<!-- Our servers -->

[vot-balancer]: https://vot-worker.toil.cc/health
[vot-worker]: https://github.com/FOSWLY/vot-worker
[media-proxy]: https://github.com/FOSWLY/media-proxy
[vot-backend]: https://github.com/FOSWLY/vot-backend
[vot-status]: https://votstatus.toil.cc
[vot-stats]: https://votstats.toil.cc

<!-- Install / Build -->

[vot-dist]: https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
[vot-releases]: https://github.com/ilyhalight/voice-over-translation/releases
[nodejs-link]: https://nodejs.org
[bun-link]: https://bun.sh/

<!-- Badges -->

[badge-en]: https://img.shields.io/badge/lang-English%20%F0%9F%87%AC%F0%9F%87%A7-white
[badge-ru]: https://img.shields.io/badge/%D1%8F%D0%B7%D1%8B%D0%BA-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9%20%F0%9F%87%B7%F0%9F%87%BA-white

<!-- Other -->

[vot-readme-ru]: README.md
[vot-readme-en]: README-EN.md
[vot-langs]: LANG_SUPPORT.md
[vot-issues]: https://github.com/ilyhalight/voice-over-translation/issues
[votjs-link]: https://github.com/FOSWLY/vot.js
[vot-cli-link]: https://github.com/FOSWLY/vot-cli
[yabrowser-link]: https://browser.yandex.com
[yatranslate-link]: https://translate.yandex.ru/
[contributors-link]: https://github.com/ilyhalight/voice-over-translation/graphs/contributors

<!-- Content -->

[![ru][badge-ru]][vot-readme-ru]
[![en][badge-en]][vot-readme-en]

> [!CAUTION]
> Before creating Issues, we strongly recommend that you read the [FAQ][vot-faq] section and with existing [Issues][vot-issues].

> All rights to the original software belong to their respective owners. This extension is not affiliated with the original rights holders.

Voice-over translation is now available beyond [Yandex Browser][yabrowser-link]. Thanks to the **[Yandex.Translate][yatranslate-link]** team and all [contributors][contributors-link] helping improve this project.

## Installing the extension:

> [!WARNING]
> **Important for Tampermonkey 5.2+ (MV3) users:**
> In **Chromium**-based browsers (Chrome, Edge, Brave, Vivaldi, etc.) you must:
> 1. Open the extensions page (`chrome://extensions`) and enable **"Developer mode"** (details in [Tampermonkey documentation][devmode-enable]).
> 2. If you use **Chromium 138+**, open extension details and enable **"Allow User Scripts"**.
>
> **For Opera users:**
> 1. Use **[Violentmonkey][violentmonkey-opera]** instead of Tampermonkey.
> 2. In the extension settings, enable **"Allow access to search page results"** (Opera guide: [where to find this setting][opera-search-results-access]); otherwise the script will not work.

1. Install a userscript manager: **[Tampermonkey][tampermonkey-link]** (or [Violentmonkey][violentmonkey-opera] for Opera)
2. **[Install the script][vot-dist]**

### Install Native Extension for Chrome / Chromium

1. Open [Releases][vot-releases] and download `vot-extension-chrome-<version>.crx`
2. Open your extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
3. Enable **Developer mode**
4. Drag and drop the downloaded `.crx` file onto the extensions page

### Install Native Extension for Firefox

1. Open [Releases][vot-releases], click `vot-extension-firefox-<version>.xpi`, and confirm installation in Firefox

## List of features:

- Translate videos into Russian, English, or Kazakh from [supported source languages][vot-langs]
- Auto-translate videos on open
- Auto-enable subtitles on open
- Smart subtitle layout that adapts line width and text size to player dimensions
- Display AI-generated subtitles
- Display site-provided subtitles (for example, auto-translated YouTube subtitles)
- Save subtitles in `.srt`, `.vtt`, and `.json` formats
- Save translated audio as `.mp3`
- Separate volume sliders for original and translated audio
- Adaptive volume: duck original audio while translated speech is playing
- Limit translation for videos in your native language (language can be selected in the menu)
- Link translation volume with video volume
- Limit translation from selected languages
- Hotkeys for translation and subtitles (including key combinations)
- Easy subtitle appearance customization
- Word-by-word translation directly in subtitles

### Useful links:

1. JavaScript library (vot.js): **[Link][votjs-link]**
2. Terminal version (vot-cli): **[Link][vot-cli-link]**
3. Wiki: **[Link][vot-wiki]**

## Note:

1. It is recommended to allow autoplay for audio/video to avoid runtime playback errors
2. The extension cannot translate videos longer than 4 hours (translator API limitation)
3. For stable audio-download flow, use managers with `unsafeWindow` support (for example, Tampermonkey or Violentmonkey)

## List of supported sites:

You can find the full list of supported websites and their specific limitations in the **[wiki][vot-supported-sites]**.

### Our domains:

These domains can be set in the extension settings (only those domains that can be changed without rebuilding are listed here):

#### Proxy-server

Required for proxying requests when direct access to Yandex servers is unavailable.

- [vot-worker.toil.cc][vot-balancer] (Load balancer between proxy servers)
- [vot-worker-s1.toil.cc][vot-worker]
- [vot-worker-s2.toil.cc][vot-worker]
- [vot.deno.dev][vot-worker]
- [vot-new.toil-dump.workers.dev][vot-worker] (⚠️ doesn't work in Russia)

#### Media Proxy-server

It's necessary for proxying `.m3u8` files and correcting the translation for indirect links to `.mp4` or `.webm`(for more information in the repository)

- [media-proxy.toil.cc][media-proxy]

#### VOT-Backend

It's necessary to translate additional sites that use the `.m3u8` or `.mpd` video format.

- [vot.toil.cc][vot-backend]

#### VOT Status and Stats

Check current status and uptime of all servers here:

- [votstatus.toil.cc][vot-status]

Check proxy server usage statistics (updated every 5 minutes):

- [votstats.toil.cc][vot-stats]

## How to build an extension?

1. Install [Node.js 22+][nodejs-link] / [Bun.sh][bun-link]
2. Install dependencies:

NPM:

```bash
npm install
```

Bun:

```bash
bun install
```

3. Build targets:

   3.0. Userscript (regular build):

   ```bash
   npm run build
   ```

   3.1. Userscript (minified build):

   ```bash
   npm run build:min
   ```

   3.2. Userscript (both variants):

   ```bash
   npm run build:all
   ```

   3.3. Native Chrome/Firefox extension packages:

   ```bash
   npm run build:ext
   ```

   3.4. Development userscript build with sourcemaps:

   ```bash
   npm run build:dev
   ```

Userscript artifacts are generated in `dist/`, native extension artifacts in `dist-ext/`.

## Customization of appearance:

The extension supports appearance customization via Stylus, Stylish, and similar tools.

Example style override:

```css
/* ==UserStyle==
@name         VOT-styles
@version      16.09.2023
@namespace    vot-styles
@description  LLL
@author       Toil
@license      No License
==/UserStyle== */

:root {
  --vot-font-family: "Roboto", "Segoe UI", BlinkMacSystemFont, system-ui,
    -apple-system;

  --vot-primary-rgb: 139, 180, 245;
  --vot-onprimary-rgb: 32, 33, 36;
  --vot-surface-rgb: 32, 33, 36;
  --vot-onsurface-rgb: 227, 227, 227;

  --vot-subtitles-color: rgb(var(--vot-onsurface-rgb, 227, 227, 227));
  --vot-subtitles-passed-color: rgb(var(--vot-primary-rgb, 33, 150, 243));
}
```

## Tested browsers and loaders

This list is updated infrequently but is usually still relevant.

The extension has been tested in the following browsers:

| Status | Browser                   | Min. Browser Version | Platform                | Extension                                                                                   |
| ------ | ------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| ✅     | Firefox Developer Edition | v106                 | Windows                 | Tampermonkey (MV2), FireMonkey, Violentmonkey, Greasemonkey                                  |
| ✅     | Firefox                   | v116.0.2             | Windows, Linux, Android | Tampermonkey (MV2), Violentmonkey                                                            |
| ✅     | Firefox Nightly           | v118.0a1             | Windows, Android        | Tampermonkey (MV2)                                                                          |
| ✅     | LibreWolf                 | v100.0.2-1           | Windows                 | Tampermonkey (MV2)                                                                          |
| ✅     | Brave                     | v1.46                | Windows                 | Tampermonkey (MV2)                                                                          |
| ✅     | MS Edge                   | v106.0.1370.34       | Windows, Linux          | Tampermonkey (MV2)                                                                          |
| ✅     | Cent Browser              | v4.3.9.248           | Windows                 | Tampermonkey (MV2)                                                                          |
| ✅     | Cent Browser Beta         | v5.0.1002.182        | Windows                 | Tampermonkey (MV2)                                                                          |
| ✅     | Google Chrome             | v106                 | Windows, MacOS, Linux   | Tampermonkey (MV2), Tampermonkey (MV3), Violentmonkey, User Javascript and CSS |
| ✅     | Opera GX (LVL4)           | core91               | Windows                 | Violentmonkey                                                                               |
| ✅     | Opera GX (LVL5)           | core109              | Windows                 | Violentmonkey                                                                               |
| ✅     | Opera                     | v92.0.4561.43        | Windows                 | Violentmonkey                                                                               |
| ✅     | Vivaldi                   | 5.7.2921.63          | Windows, Linux          | Tampermonkey (MV2)                                                                          |
| ✅     | Safari                    | v15.6.1              | MacOS, iOS              | Userscripts, Tampermonkey                                                                   |
| ✅     | Kiwi Browser              | v116.0.5845.61       | Android                 | Tampermonkey (MV2)                                                                          |
| ✅     | Yandex Browser            | v24.4                | Windows                 | Tampermonkey (MV2), Tampermonkey (MV3)                                                     |
| ✅     | Arc                       | v1.6.1               | Windows                 | Tampermonkey (MV3)                                                                          |
| ✅     | Incognition               | v4.1.1.0 (v125)      | Windows                 | Tampermonkey (MV3), Tampermonkey (MV2)                                                     |

Min. browser version is the lowest version where the extension was tested. This does not guarantee behavior on older versions. Please note that we **do not** support or fix issues in outdated browsers.

To activate the script in Tampermonkey (MV3), you must [enable "Developer Mode"][devmode-enable].

Tested in the following userscript manager extensions:

| Status                    | Browser | Extension                                       |
| ------------------------- | ------- | ----------------------------------------------- |
| ✅                        | Any     | [Tampermonkey Legacy (MV2)][tampermonkey-link]  |
| ✅                        | Opera   | [Violentmonkey][violentmonkey-opera]           |
| ✅                        | Chrome  | [Tampermonkey (MV3)][tampermonkey-link]        |
| ⚠️¹                       | Safari  | [Userscripts][userscripts-safari]              |
| ✅                        | Any     | [Violentmonkey][violetmonkey-link]             |
| ❔                        | Any     | [AdGuard Userscripts][adguard-userscripts]     |
| [Install guide][firemonkey-how-to] | Firefox | [Firemonkey][firemonkey-link]                  |
| ✅                        | Firefox | [Greasemonkey][greasemonkey-link]              |
| [Install guide][user-js-and-css-how-to]¹ | Any     | [User Javascript and CSS][user-js-and-css-link] |

¹ - Works in proxy mode, but the important "Use audio download" feature is unavailable due to missing `unsafeWindow` API, which can cause issues with newly requested translations.

## Contributing

Please refer to the [contributing guide](./CONTRIBUTING.md).

![example btn](https://github.com/ilyhalight/voice-over-translation/blob/master/img/example_en.png "btn")

> Based on [sodapng/voice-over-translation](https://github.com/sodapng/voice-over-translation) project (license MIT)
