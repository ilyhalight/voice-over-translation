<!-- ext links -->
[tampermonkey-link]: https://www.tampermonkey.net/index.php
[violentmonkey-opera]: https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag
[userscripts-safari]: https://github.com/quoid/userscripts
[violentmonkey-link]: https://violentmonkey.github.io
[adguard-userscripts]: https://kb.adguard.com/en/general/userscripts#supported-apps
[firemonkey-link]: https://erosman.github.io/firemonkey/
[greasemonkey-link]: https://github.com/greasemonkey/greasemonkey
[user-js-and-css-link]: https://tenrabbits.github.io/user-js-css-docs/ru/

<!-- how to -->
[firemonkey-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-firemonkey
[user-js-and-css-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-user-js-and-css
[devmode-enable]: https://www.tampermonkey.net/faq.php#Q209

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

Min. browser version is the lowest version where the extension was tested. This doesn't guarantee behavior on older versions. Please note that we **don't** support or fix issues in outdated browsers.

To activate the script in Tampermonkey (MV3), you must [enable "Developer Mode"][devmode-enable].

Tested in the following userscript manager extensions:

| Status                    | Browser | Extension                                       |
| ------------------------- | ------- | ----------------------------------------------- |
| ✅                        | Any     | [Tampermonkey Legacy (MV2)][tampermonkey-link]  |
| ✅                        | Opera   | [Violentmonkey][violentmonkey-opera]           |
| ✅                        | Chrome  | [Tampermonkey (MV3)][tampermonkey-link]        |
| ⚠️¹                       | Safari  | [Userscripts][userscripts-safari]              |
| ✅                        | Any     | [Violentmonkey][violentmonkey-link]             |
| ❔                        | Any     | [AdGuard Userscripts][adguard-userscripts]     |
| [Install guide][firemonkey-how-to] | Firefox | [Firemonkey][firemonkey-link]                  |
| ✅                        | Firefox | [Greasemonkey][greasemonkey-link]              |
| [Install guide][user-js-and-css-how-to]¹ | Any     | [User Javascript and CSS][user-js-and-css-link] |

¹ - Works in proxy mode, disabling the "Use audio download" feature may cause issues with newly requested translations.