# Закадровый перевод видео

<!-- loaders links (website > github > store) -->

[tampermonkey-link]: https://www.tampermonkey.net/index.php
[tampermonkey-opera]: https://www.tampermonkey.net/index.php?browser=opera&locale=en
[userscripts-safari]: https://github.com/quoid/userscripts
[violetmonkey-link]: https://violentmonkey.github.io
[adguard-userscripts]: https://kb.adguard.com/en/general/userscripts#supported-apps
[firemonkey-link]: https://erosman.github.io/firemonkey/
[greasemonkey-link]: https://github.com/greasemonkey/greasemonkey
[orangemonkey-link]: https://chromewebstore.google.com/detail/OrangeMonkey/ekmeppjgajofkpiofbebgcbohbmfldaf
[user-js-and-css-link]: https://tenrabbits.github.io/user-js-css-docs/ru/

<!-- FAQs / Wiki -->

[firemonkey-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-firemonkey
[user-js-and-css-how-to]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-FAQ#%D0%BA%D0%B0%D0%BA-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C-%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5-%D1%81-user-js-and-css
[devmode-enable]: https://www.tampermonkey.net/faq.php#Q209
[vot-faq]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-FAQ
[vot-supported-sites]: https://github.com/ilyhalight/voice-over-translation/wiki/%5BRU%5D-Supported-sites
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
[yabrowser-link]: https://yandex.ru/project/browser/streams/technology
[yatranslate-link]: https://translate.yandex.ru/
[contributors-link]: https://github.com/ilyhalight/voice-over-translation/graphs/contributors

<!-- Content -->

[![en][badge-en]][vot-readme-ru]
[![ru][badge-ru]][vot-readme-en]

> [!CAUTION]
> Перед созданием Issues настоятельно рекомендуем ознакомиться с разделом [FAQ][vot-faq] и уже существующими [Issues][vot-issues].

> Все права на оригинальное программное обеспечение принадлежат их правообладателям. Расширение не связано с оригинальными правообладателями

Закадровый перевод видео, теперь, доступен не только в [YandexBrowser][yabrowser-link]. Очень признателен разработчикам создающим **[Yandex.Translate][yatranslate-link]**, а также всем [контрибьюторам][contributors-link] за помощь в улучшении расширения. Спасиб <3

## Установка расширения:

> [!WARNING]
> Если вы пользуетесь Tampermonkey 5.2.0+, не забудьте [включить "Режим разработчика"][devmode-enable]!

1. Установите расширение **[Tampermonkey][tampermonkey-link]**
2. **[«Установите Скрипт»][vot-dist]**

## Список функционала:

- Перевод видео на русский, английский или казахский с [поддерживаемых языков][vot-langs]
- Перевод прямых трансляций на YouTube (с небольшой задержкой)
- Отображение субтитров, сгенерированных нейросетью
- Отображение субтитров с сайта (например, автопереведенные субтитры YouTube)
- Сохранение субтитров в форматах `.srt`, `.vtt`, `.json`
- Сохранение аудиодорожки перевода в формате `.mp3`
- Автоматический перевод видео при открытии
- Отдельные ползунки громкости для оригинального и переведённого звука
- Автонастройка громкости перевода как в Яндекс Браузере
- Синхронизация громкости перевода с громкостью видео
- Ограничение перевода видео на родном языке (язык можно выбрать в меню)
- Перевод по горячей клавише
- Простая настройка внешнего вида субтитров
- Отображение перевода отдельных слов в субтитрах

### Полезные ссылки:

1. Библиотека для JS (vot.js): **[Ссылка][votjs-link]**
2. Версия для терминала (vot-cli): **[Ссылка][vot-cli-link]**
3. Вики: **[Ссылка][vot-wiki]**

## Примечание:

1. Рекомендую разрешить автовоспроизведение "аудио и видео", чтобы избежать ошибок при работе расширения
2. Расширение не может переводить видео длиной более 4 часов (ограничение API переводчика)

## Список поддерживаемых сайтов:

Полный список поддерживаемых веб-сайтов и все ограничения, связанные с их поддержкой, вы можете увидеть в **[вики][vot-supported-sites]**

### Наши домены:

Эти домены могут быть установлены в настройках расширения (здесь указаны только те домены, которые можно изменить без пересборки):

#### Proxy-сервер

Необходим для проксирования запросов, если не получается сделать прямой запрос к серверам Яндекса

- [vot-worker.toil.cc][vot-balancer] (Балансировщик между прокси серверами)
- [vot-worker-s1.toil.cc][vot-worker]
- [vot-worker-s2.toil.cc][vot-worker]
- [vot.deno.dev][vot-worker]
- [vot-new.toil-dump.workers.dev][vot-worker] (⚠️ не работает в РФ)

#### Media Proxy-сервер

Необходим для проксирования `.m3u8` файлов и исправления перевода для непрямых ссылок на `.mp4` или `.webm` (подробнее в репозитории)

- [media-proxy.toil.cc][media-proxy]

#### VOT-Backend

Необходим для перевода дополнительных сайтов, которые используют формат видео, который не поддерживается серверами Яндекса.

- [vot.toil.cc][vot-backend]

#### VOT Status and Stats

Проверить текущий статус и аптайм всех серверов вы можете с помощью:

- [votstatus.toil.cc][vot-status]

Проверить статистику работы прокси серверов вы можете с помощью (обновляется раз в 5 минут):

- [votstats.toil.cc][vot-stats]

## Как собрать расширение?

1. Установите [Node.js 22+][nodejs-link] / [Bun.sh][bun-link]
2. Установите зависимости:

NPM:

```bash
npm install
```

Bun:

```bash
bun install
```

3. Сборка расширения:

   3.0. Все версии сразу:

   ```bash
   npm run build
   ```

   3.1. Все минифицированные версии сразу:

   ```bash
   npm run build:min
   ```

   3.2. Только обычная версии:

   ```bash
   npm run build:default
   ```

   3.3. Только обычная мин. версии:

   ```bash
   npm run build:default-min
   ```

## Кастомизация внешнего вида:

Расширение поддерживает кастомизацию внешнего вида с помощью Stylus, Stylish и других подобных расширений.

Пример изменения стилей:

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

## Проотестированные браузеры и загрузчики

Данный список обновляется довольно редко, но в большинстве случаев данные в нем будут актуальными.

Расширение протестировано в следующих браузерах:

| Статус | Браузер                   | Мин. версия браузера | Платформа               | Расширение                                                                                  |
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

Мин. версия браузера - это минимальная версия, на которой расширение было протестировано. Однако это не означает, что оно не запустится в более старых версиях. Учтите, что поддержкой и исправление ошибок в устаревших браузерах мы **не занимаемся**.

Для активации скрипта в Tampermonkey (MV3) необходимо [включить "Режим разработчика"][devmode-enable]

Расширение было протестировано в следующих расширениях-загрузчиках для юзерскриптов:

| Статус                                        | Браузер | Расширение                                      |
| --------------------------------------------- | ------- | ----------------------------------------------- |
| ⠀✅                                           | Любой   | [Tampermonkey Legacy (MV2)][tampermonkey-link]  |
| ⠀✅                                           | Opera   | [Tampermonkey Opera][tampermonkey-opera]        |
| ⠀✅                                           | Chrome  | [Tampermonkey (MV3)][tampermonkey-link]         |
| ⠀⚠️¹                                          | Safari  | [Userscripts][userscripts-safari]               |
| ⠀✅                                           | Любой   | [Violetmonkey][violetmonkey-link]               |
| ⠀❔                                           | Любой   | [AdGuard Usercripts][adguard-userscripts]       |
| ⠀[Гайд по установке][firemonkey-how-to]       | Firefox | [Firemonkey][firemonkey-link]                   |
| ⠀✅                                           | Firefox | [Greasemonkey][greasemonkey-link]               |
| ⠀⚠️²                                          | Любой   | [OrangeMonkey][orangemonkey-link]               |
| ⠀[Гайд по установке][user-js-and-css-how-to]¹ | Любой   | [User Javascript and CSS][user-js-and-css-link] |

¹ - Работает в режиме проксирования, важная функция "Использовать загрузку аудио" недоступна из-за отсутствия `unsafeWindow` API, что может привести к проблемам с переводом новых видео.

² - RequestIdleCallback выдает множество ошибок в консоли, но расширение работает.

## Contributing

Пожайлуста, ознакомьтесь с [гайдом для контрибьюторов](./CONTRIBUTING.md).

![example btn](https://github.com/ilyhalight/voice-over-translation/blob/master/img/example.png "btn")

> Основано на проекте [sodapng/voice-over-translation](https://github.com/sodapng/voice-over-translation) (license MIT)
