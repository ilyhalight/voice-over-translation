<!-- loaders links (website > github > store) -->

[tampermonkey-link]: https://www.tampermonkey.net/index.php
[violentmonkey-opera]: https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag
[violentmonkey-link]: https://violentmonkey.github.io

<!-- FAQs / Wiki -->

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

<div align="center">
  <h1>voice-over-translation (<code>vot</code>)</h1>
  <p>Watch videos in other languages with voice-over translation and subtitles in <a href="./BROWSERS-EXTS-TEST.md">any browser</a></p>

  [Installation](#installing-the-extension) ·
  [Development](#how-to-build-an-extension) ·
  [FAQ][vot-faq] ·
  [Supported sites][vot-supported-sites]

  [![en][badge-en]][vot-readme-en]
  [![ru][badge-ru]][vot-readme-ru]

  <img src="./img/banner.png" alt="vot promotion banner"/>
</div>

---

> All rights to the original software belong to their respective owners. This extension is not affiliated with the original rights holders.

Thanks to the **[Yandex.Translate][yatranslate-link]** and **[Yandex.Browser][yabrowser-link]** teams, and everyone [helping make the extension][contributors-link] even better.

## Installing the extension

> [!CAUTION]
> Before creating an issue, we strongly recommend reading the [FAQ][vot-faq] and existing [issues][vot-issues].

> [!WARNING]
> **Important for Tampermonkey 5.2+ (MV3) users:**
> In **Chromium**-based browsers (Chrome, Edge, Brave, Vivaldi, etc.) you must:
> 1. Open the extensions page (`chrome://extensions`) and enable **"Developer mode"** (details in [Tampermonkey documentation][devmode-enable]).
> 2. If you use **Chromium 138+**, open extension details and enable **"Allow User Scripts"**.
>
> **For Opera users:**
> 1. Use **[Violentmonkey][violentmonkey-opera]** instead of Tampermonkey.
> 2. In the extension settings, enable **"Allow access to search page results"** (Opera guide: [where to find this setting][opera-search-results-access]), otherwise the script will not work.

1. Install a userscript manager: **[Tampermonkey][tampermonkey-link]** (or [Violentmonkey][violentmonkey-opera] for Opera)
2. **[Install the script][vot-dist]**

### Install Native Extension for Chrome / Chromium

1. Open [Releases][vot-releases] and download `vot-extension-chrome-<version>.zip`
2. Open your extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
3. Enable **Developer mode**
4. Drag and drop the downloaded `.zip` file onto the extensions page

### Install Native Extension for Firefox

1. Open [Releases][vot-releases], click `vot-extension-firefox-<version>.xpi`, and confirm installation in Firefox

## Features

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
- Link translation volume with video volume
- Limit translation from selected languages (selectable in the menu)
- Hotkeys for translation and subtitles (including key combinations)
- Easy subtitle appearance customization
- Word-by-word translation directly in subtitles

### Useful links

1. Tested compatibility: **[Link](./BROWSERS-EXTS-TEST.md)**
2. JavaScript library (vot.js): **[Link][votjs-link]**
3. Terminal version (vot-cli): **[Link][vot-cli-link]**

## Limitations and recommendations

1. It is recommended to allow autoplay for audio/video to avoid runtime playback errors
2. The extension cannot translate videos longer than 4 hours (translator API limitation)
3. For stable audio-download flow, use up-to-date and supported userscript managers (for example, [Tampermonkey][tampermonkey-link] or [Violentmonkey][violentmonkey-link])

## Supported sites

You can find the full list of supported websites and their specific limitations in the **[wiki][vot-supported-sites]**.

### Our domains:

These domains can be changed in the extension settings without rebuilding:

#### Proxy-server

Required for proxying requests when direct access to Yandex servers is unavailable.

- [vot.deno.dev][vot-worker]
- [vot-new.toil-dump.workers.dev][vot-worker] (⚠️ doesn't work in Russia)

#### Media Proxy-server

Required for proxying `.m3u8` files and correctly processing indirect links to `.mp4` and `.webm`.

- [media-proxy.toil.cc][media-proxy]

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

## Contributing

Please refer to the [contributing guide](./CONTRIBUTING.md).

> Based on [sodapng/voice-over-translation](https://github.com/sodapng/voice-over-translation) project (license MIT)
