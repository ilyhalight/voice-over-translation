# Voice Over Translation

<!-- loaders links (website > github > store) -->

[tampermonkey-link]: https://www.tampermonkey.net/index.php
[tampermonkey-opera]: https://www.tampermonkey.net/index.php?browser=opera&locale=en
[userscripts-safari]: https://github.com/quoid/userscripts
[violetmonkey-link]: https://violentmonkey.github.io
[adguard-userscripts]: https://kb.adguard.com/en/general/userscripts#supported-apps
[firemonkey-link]: https://erosman.github.io/firemonkey/
[greasemonkey-link]: https://github.com/greasemonkey/greasemonkey
[orangemonkey-link]: https://chromewebstore.google.com/detail/OrangeMonkey/ekmeppjgajofkpiofbebgcbohbmfldaf
[user-js-and-css-link]: https://tenrabbits.github.io/user-js-css-docs/

<!-- FAQs / Wiki -->

[firemonkey-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-firemonkey
[user-js-and-css-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-user-js-and-css
[devmode-enable]: https://www.tampermonkey.net/faq.php#Q209
[vot-faq]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-FAQ
[vot-supported-sites]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-Supported-sites
[vot-wiki]: https://github.com/ilyhalight/voice-over-translation/wiki

<!-- Our servers -->

[vot-balancer]: https://vot-worker.toil.cc/health
[vot-worker]: https://github.com/FOSWLY/vot-worker
[media-proxy]: https://github.com/FOSWLY/media-proxy
[vot-backend]: https://github.com/FOSWLY/vot-backend

<!-- Install / Build -->

[vot-dist]: https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist/vot.user.js
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

[![ru][badge-ru]][vot-readme-en]
[![en][badge-en]][vot-readme-ru]

> [!CAUTION]
> Before creating Issues, we strongly recommend that you read the [FAQ][vot-faq] section and with existing [Issues][vot-issues].

> [!WARNING]
> All rights to the original software belong to their respective right holders. The extension isn't affiliated with the original rights holders

The voice-over translation of the video is now available not only in [YandexBrowser][yabrowser-link]. Very grateful to devs who create **[Yandex.Translate][yatranslate-link]**, and all [contributors][contributors-link] who help make the extension better. Thanks <3

## Installing the extension:

> [!WARNING]
> If you use Tampermonkey 5.2.0+, don't forget to [enable "Developer Mode"][devmode-enable]!

1. Install the extension **[Tampermonkey][tampermonkey-link]**
2. **[«Install the Script»][vot-dist]**

## List of features:

- Translate videos into Russian, English, or Kazakh from [supported source languages][vot-langs]
- Translate live streams on YouTube (with slight delay)
- Display AI-generated subtitles
- Show site subtitles (e.g., YouTube's auto-translated subs)
- Save subtitles in `.srt`, `.vtt`, or `.json` formats
- Save translated audio as `.mp3`
- Auto-translate videos on open
- Separate volume sliders for original and translated audio
- Auto-adjust translated audio volume like in Yandex Browser
- Sync translation volume with video volume
- Limit translation for your native language (selectable in menu)
- Trigger translation with a hotkey
- Easy customize subtitle appearance
- Show word-by-word translation in subtitles

### Useful links:

1. Javascript library (vot.js): **[Link][votjs-link]**
2. Terminal version (vot-cli): **[Link][vot-cli-link]**
3. Wiki: **[Link][vot-wiki]**

## Note:

1. I recommend allowing autoplay of "audio and video" to avoid errors when working with the extension
2. The extension cannot translate videos longer than 4 hours (translator API limitation)

## List of supported sites:

You can see the full list of supported websites and all restrictions related to their support in **[wiki](https://github.com/ilyhalight/voice-over-translation/wiki/%5BEN%5D-Supported-sites)**

### Our domains:

These domains can be set in the extension settings (only those domains that can be changed without rebuilding are listed here):

#### Proxy-server

It's necessary for proxying requests if it is not possible to make a direct request to the Yandex servers

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

## How to build an extension?

1. Install [Node.js 22+][nodejs-link] / [Bun.sh][bun-link]
2. Install dependencies:

```bash
npm install
```

Bun:

```bash
bun install --yarn
```

3. Building an extension:

   3.0. All versions at once:

   ```bash
   npm run build
   ```

   3.1. All minified versions at once:

   ```bash
   npm run build:min
   ```

   3.2. Only the regular version:

   ```bash
   npm run build:default
   ```

   3.3. Only the usual min. versions:

   ```bash
   npm run build:default-min
   ```

## Customization of appearance:

The extension supports customization of the appearance using Stylus, Stylish and other similar extensions.

Example of changing styles:

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

This list is updated quite rarely, but in most cases the data in it will be relevant.

The extension has been tested in the following browsers:

| Status | Browser                   | Min. Browser Version | Platform                | Extension                                                                                   |
| ------ | ------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| ⠀✅    | Firefox Developer Edition | v106                 | Windows                 | Tampermonkey (MV2), FireMonkey, VioletMonkey, Greasemonkey                                  |
| ⠀✅    | Firefox                   | v116.0.2             | Windows, Linux, Android | Tampermonkey (MV2), Violetmonkey                                                            |
| ⠀✅    | Firefox Nightly           | v118.0a1             | Windows, Android        | Tampermonkey (MV2)                                                                          |
| ⠀✅    | LibreWolf                 | v100.0.2-1           | Windows                 | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Brave                     | v1.46                | Windows                 | Tampermonkey (MV2)                                                                          |
| ⠀✅    | MS Edge                   | v106.0.1370.34       | Windows, Linux          | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Cent Browser              | v4.3.9.248           | Windows                 | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Cent Browser Beta         | v5.0.1002.182        | Windows                 | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Google Chrome             | v106                 | Windows, MacOS, Linux   | Tampermonkey (MV2), Tampermonkey (MV3), Violetmonkey, OrangeMonkey, User Javascript and CSS |
| ⠀✅    | Opera GX (LVL4)           | core91               | Windows                 | Tampermonkey Opera                                                                          |
| ⠀✅    | Opera GX (LVL5)           | core109              | Windows                 | Tampermonkey Opera                                                                          |
| ⠀✅    | Opera                     | v92.0.4561.43        | Windows                 | Tampermonkey Opera                                                                          |
| ⠀✅    | Vivaldi                   | 5.7.2921.63          | Windows, Linux          | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Safari                    | v15.6.1              | MacOS, iOS              | Userscripts, Tampermonkey                                                                   |
| ⠀✅    | Kiwi Browser              | v116.0.5845.61       | Android                 | Tampermonkey (MV2)                                                                          |
| ⠀✅    | Yandex Browser            | v24.4                | Windows                 | Tampermonkey (MV2), Tampermonkey (MV3)                                                      |
| ⠀✅    | Arc                       | v1.6.1               | Windows                 | Tampermonkey (MV3)                                                                          |
| ⠀✅    | Incognition               | v4.1.1.0 (v125)      | Windows                 | Tampermonkey (MV3), Tampermonkey (MV2)                                                      |

Min. Browser version it's a minimal version of which extension has been tested. However, this doesn't mean that it willn't run in older versions. Please note that we **don't** support or fix errors in outdated browsers.

To activate the script in Tampermonkey (MV3), you must [enable "Developer Mode"][devmode-enable]

Tested in the following extensions-loaders for userscripts:

| Status                                    | Browser | Extension                                       |
| ----------------------------------------- | ------- | ----------------------------------------------- |
| ⠀✅                                       | Any     | [Tampermonkey Legacy (MV2)][tampermonkey-link]  |
| ⠀✅                                       | Opera   | [Tampermonkey Opera][tampermonkey-opera]        |
| ⠀✅                                       | Chrome  | [Tampermonkey (MV3)][tampermonkey-link]         |
| ⠀⚠️¹                                      | Safari  | [Userscripts][userscripts-safari]               |
| ⠀✅                                       | Any     | [Violetmonkey][violetmonkey-link]               |
| ⠀❔                                       | Any     | [AdGuard Usercripts][adguard-userscripts]       |
| ⠀[Install guide][firemonkey-how-to]       | Firefox | [Firemonkey][firemonkey-link]                   |
| ⠀✅                                       | Firefox | [Greasemonkey][greasemonkey-link]               |
| ⚠️²                                       | Any     | [OrangeMonkey][orangemonkey-link]               |
| ⠀[Install guide][user-js-and-css-how-to]¹ | Any     | [User Javascript and CSS][user-js-and-css-link] |

¹ - It works in proxying mode, the important "Use audio download" function is unavailable due to the lack of the `unsafeWindow` API, which may lead to problems with translating new videos.

² - requestIdleCallback throws a lot of errors in the console, but the extension works.

## Contributing

Please refer to the [contributing guide](./CONTRIBUTING.md).

![example btn](https://github.com/ilyhalight/voice-over-translation/blob/master/img/example_en.png "btn")

> Based on [sodapng/voice-over-translation](https://github.com/sodapng/voice-over-translation) project (license MIT)
