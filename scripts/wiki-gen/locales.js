import { repositoryUrl } from "../../src/config/config";

export default {
  limitations: {
    ru: "Ограничения",
    en: "Limitations",
  },
  availabledPaths: {
    ru: "Доступные пути",
    en: "Available paths",
  },
  status: {
    ru: "Статус",
    en: "Status",
  },
  availabledDomains: {
    ru: "Доступные (под)домены",
    en: "Available (sub)domains",
  },
  worksWithLimitations: {
    ru: "Работает с ограничениями",
    en: "Works with limitations",
  },
  working: {
    ru: "Работает",
    en: "Working",
  },
  noPreviewVideos: {
    ru: "Не работает в предпросмотре видео",
    en: "Doesn't work in the video preview",
  },
  noFeedVideos: {
    ru: "Не работает перевод в ленте (Работает только в открытых видео)",
    en: "The translation in the feed doesn't work (It only works in open videos)",
  },
  noStreams: {
    ru: "Не доступен перевод прямых трансляций",
    en: "Translation of live broadcasts is not available",
  },
  needBypassCSP: {
    ru: `Для гарантированной работы скрипта необходимо [включить настройку "Обход Media CSP"](${repositoryUrl}/wiki/%5BRU%5D-FAQ) в расширение или удалить CSP другим способом`,
    en: `To ensure that the script works, you need to [enable the "Bypass Media CSP" setting](${repositoryUrl}/wiki/%5BEN%5D-FAQ) in the extension or delete the CSP in another way`,
  },
  cantTranslatePHPremium: {
    ru: "Недоступен перевод для PH Premium",
    en: "Translation is not available for PH Premium",
  },
  needSetAccessToken: {
    ru: `Для работы необходимо [установить Access Token](${repositoryUrl}/wiki/%5BRU%5D-Where-to-get-Udemy-Access-Token%3F)"`,
    en: `To work, you need to [set an Access Token](${repositoryUrl}/wiki/%5BEN%5D-Where-to-get-Udemy-Access-Token%3F)`,
  },
  needBeLoggedIn: {
    ru: "Необходимо быть авторизованным на сайте",
    en: "You must be logged in to the site",
  },
  videoWithoutSubs: {
    ru: "Если у видео нет субтитров на вашем языке, то перевод не будет выполнен",
    en: "If the video doesn't have subtitles in your language, then the translation will not be performed",
  },
  someModInstanceNotSupported: {
    ru: "некоторые измененные инстансы не поддерживаются",
    en: "Some modified instances aren't supported",
  },
  dailymotionNotice: {
    ru: "встраиваемый плеер, на www.dailymotion.com работает",
    en: "embedded player, on www.dailymotion.com it works",
  },
  workOnlyWithPublicLinks: {
    ru: "Работает только с публичными ссылками",
    en: "It only works with public links",
  },
  noLocalLinks: {
    ru: "Нельзя переводить локальные видео",
    en: "Local videos cannot be translated",
  },
  noSubtitles: {
    ru: "Нет субтитров",
    en: "There are no subtitles",
  },
};
