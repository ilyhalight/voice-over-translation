import locales from "./locales";

const youtubeSiteData = {
  paths: ["/watch", "/embed", "/shorts", "/live", "?v=VIDEO_ID"],
  limits: [locales.noPreviewVideos],
};

const youtubeAltSiteData = {
  paths: youtubeSiteData.paths,
  limits: [...youtubeSiteData.limits],
};

/**
 * paths - available list of pathnames
 * domains - additional domains (if isn't parsed by regex)
 */
const siteData = {
  youtube: youtubeSiteData,
  invidious: youtubeAltSiteData,
  piped: youtubeAltSiteData,
  ricktube: youtubeAltSiteData,
  poketube: youtubeAltSiteData,
  vk: {
    paths: [
      "/video-xxxxxxxxx_xxxxxxxxx",
      "?z=video-xxxxxxxxx_xxxxxxxxx",
      "/video_ext.php?oid=VIDEO_ID_PART_ONE&id=VIDEO_ID_PART_TWO",
      ".../playlist/PLAYLIST_ID/video-xxxxxxxxx_xxxxxxxxx",
    ],
  },
  nine_gag: {
    paths: ["/gag/VIDEO_ID"],
    limits: [locales.noFeedVideos],
  },
  twitch: {
    paths: [
      "/videos",
      "/embed",
      "/NICKNAME/clip",
      "?v=VIDEO_ID (player.twitch.tv)",
    ],
    limits: [locales.noStreams],
  },
  proxitok: {
    paths: ["/@NICKNAME/video/VIDEO_ID"],
  },
  tiktok: {
    paths: ["/@NICKNAME/video/VIDEO_ID"],
    limits: [locales.noFeedVideos],
  },
  vimeo: {
    paths: [
      "/CHANNEL_ID/VIDEO_ID",
      "/VIDEO_ID",
      "/video/VIDEO_ID",
      "/video/VIDEO?h=HASH_ID",
      "/channels/CHANNEL_NAME/VIDEO_ID",
      "/groups/GROUP_NAME/videos/VIDEO_ID",
      "/showcase/SHOWCASE_ID/video/VIDEO_ID",
      "/album/SHOWCASE_ID/video/VIDEO_ID",
    ],
  },
  xvideos: {
    paths: ["/VIDEO_ID/VIDEO_NAME"],
  },
  pornhub: {
    paths: ["/view_video.php?viewkey=VIDEO_ID", "/embed/VIDEO_ID"],
    limits: [locales.cantTranslatePHPremium],
  },
  twitter: {
    paths: ["/NAME/status/VIDEO_ID"],
    limits: [locales.noFeedVideos],
  },
  udemy: {
    paths: ["/course/NAME/learn/lecture/LECTURE_ID"],
    limits: [locales.needBeLoggedIn],
  },
  rumble: {
    paths: ["/VIDEO_NAME"],
    limits: [locales.noStreams],
  },
  facebook: {
    paths: ["/reel/VIDEO_ID", "/videos/VIDEO_ID"],
    domains: ["facebook.com"],
  },
  rutube: {
    paths: ["/video/VIDEO_ID", "/?bvid=VIDEO_ID"],
  },
  bilibili: {
    paths: ["/video/VIDEO_ID", "/?bvid=VIDEO_ID"],
  },
  mail_ru: {
    paths: [
      "/v/NICKNAME/video/...",
      "/mail/NICKNAME/video/...",
      "video/embed/VIDEO_ID",
    ],
  },
  bitchute: {
    paths: ["/video/VIDEO_ID", "/embed/VIDEO_ID"],
  },
  coursera: {
    paths: ["/learn/NAME/lecture/XXXX"],
    limits: [locales.needBeLoggedIn, locales.videoWithoutSubs],
  },
  eporner: {
    paths: ["/video-VIDEO_ID/NAME"],
  },
  peertube: {
    paths: ["/w/VIDEO_ID"],
    limits: [locales.someModInstanceNotSupported],
  },
  dailymotion: {
    paths: ["/video/VIDEO_ID"],
  },
  trovo: {
    paths: ["/s/NICK/VIDEO_ID"],
    limits: [locales.noStreams],
  },
  yandexdisk: {
    paths: ["/i/FILE_ID"],
    limits: [locales.workOnlyWithPublicLinks],
  },
  coursehunterLike: {
    paths: ["/course/COURSE_ID"],
  },
  "ok.ru": {
    paths: ["/video/VIDEO_ID"],
  },
  googledrive: {
    paths: ["/file/d/FILE_ID"],
    limits: [locales.workOnlyWithPublicLinks],
  },
  bannedvideo: {
    paths: ["/watch?id=VIDEO_ID"],
  },
  weverse: {
    paths: ["/CHANNEL_NAME/media/VIDEO_ID", "/CHANNEL_NAME/live/VIDEO_ID"],
    limits: [locales.noStreams],
  },
  newgrounds: {
    paths: ["/XXX/view/XXX"],
  },
  egghead: {
    paths: ["/lessons/LESSON_NAME"],
  },
  youku: {
    paths: ["/v_show/VIDEO_ID"],
  },
  archive: {
    paths: ["/details/VIDEO_ID", "/embed/VIDEO_ID"],
  },
  patreon: {
    paths: ["/posts/POST_ID"],
    limits: [],
  },
  reddit: {
    paths: ["/r/SUB_REDDIT/comments/VIDEO_ID/VIDEO_NAME"],
    limits: [],
  },
  kick: {
    paths: ["/video/VIDEO_ID", "/NICKNAME?clip=clip_CLIPID"],
    limits: [locales.noStreams],
  },
  apple_developer: {
    paths: ["/videos/play/XXX/XXX"],
    limits: [],
  },
  epicgames: {
    paths: ["/community/learning/courses/XXX/XXX/XXX/XXX"],
    limits: [],
  },
  odysee: {
    paths: ["/@USERNAME/VIDEO_NAME"],
    limits: [],
  },
  sap: {
    paths: ["/courses/COURSE_NAME", "/courses/COURSE_NAME/LECTURE_NAME"],
  },
  watchpornto: {
    paths: ["/video/VIDEO_ID/VIDEO_NAME", "/embed/VIDEO_ID"],
  },
  linkedin: {
    paths: ["/learning/COURSE_NAME/LECTURE_NAME"],
  },
  incestflix: {
    paths: ["/watch/VIDEO_ID"],
  },
  dzen: {
    paths: ["/video/watch/VIDEO_ID"],
  },
  cloudflarestream: {
    paths: [],
  },
  loom: {
    paths: ["/embed/VIDEO_ID", "/share/VIDEO_ID"],
  },
  artstation: {
    paths: ["/courses/XXX/XXX/chapters/XXX"],
  },
  rtnews: {
    paths: [],
  },
  bitview: {
    paths: ["/watch?v=VIDEO_ID", "/embed?v=VIDEO_ID"],
  },
  kickstarter: {
    paths: [],
  },
  thisvid: {
    paths: ["/videos/VIDEO_ID", "/embed/VIDEO_ID"],
  },
  ign: {
    paths: ["/XXX/CONTENT_ID/video/XXX", "/videos/VIDEO_ID"],
  },
  bunkr: {
    paths: ["/f/VIDEO_ID"],
  },
  imdb: {
    paths: ["/video/VIDEO_ID"],
  },
  telegram: {
    paths: ["/k/*"],
    domains: ["web.telegram.org"],
  },
  oraclelearn: {
    paths: ["/ou/course/COURSE_SLUG/COURSE_ID/LECTURE_ID"],
  },
  deeplearningai: {
    paths: ["/courses/COURSE_NAME/lesson/LESSON_ID/VIDEO_ID"],
  },
  netacad: {
    paths: ["/content/i2cs/*"],
  },
  directlink: {
    paths: ["/*.mp4", "/*.webm"],
    limits: [locales.noLocalLinks],
  },
};

const extraData = {
  udemy: {
    status: "⚠️",
    statusPhrase: locales.worksWithLimitations,
  },
  // twitter: {
  //   status: "⚠️",
  //   statusPhrase: locales.worksWithLimitations,
  // },
  // facebook: {
  //   status: "⚠️",
  //   statusPhrase: locales.worksWithLimitations,
  // },
  // yandexdisk: {
  //   status: "⚠️",
  //   statusPhrase: locales.worksWithLimitations,
  // },
  // sap: {
  //   status: "⚠️",
  //   statusPhrase: locales.worksWithLimitations,
  // },
  // linkedin: {
  //   status: "⚠️",
  //   statusPhrase: locales.worksWithLimitations,
  // },
};

const sitesBlackList = ["porntn"];

export { siteData, extraData, sitesBlackList };
