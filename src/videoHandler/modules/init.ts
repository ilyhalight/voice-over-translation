import {
  actualCompatVersion,
  defaultAutoHideDelay,
  defaultAutoVolume,
  defaultDetectService,
  defaultTranslationService,
  m3u8ProxyHost,
  proxyOnlyCountries,
  proxyWorkerHost,
} from "../../config/config";
import type { VideoHandler } from "../../index";
import type { LanguageSelectKey } from "../../types/components/select";
import debug from "../../utils/debug";
import {
  GM_fetch,
  isProxyOnlyExtension,
  isSupportGMXhr,
  isUnsafeWindowAllowed,
} from "../../utils/gm";
import { updateConfig, votStorage } from "../../utils/storage";
import { calculatedResLang } from "../../utils/utils";
import { countryCode, setCountryCode } from "../shared";

let countryCodeRequestInFlight: Promise<void> | null = null;

async function ensureCountryCode(): Promise<void> {
  if (countryCode) {
    return;
  }

  countryCodeRequestInFlight ??= (async () => {
    try {
      const response = await GM_fetch(
        "https://cloudflare-dns.com/cdn-cgi/trace",
        {
          timeout: 7000,
        },
      );
      const trace = await response.text();
      const loc = trace.split("\n").find((line) => line.startsWith("loc="));
      setCountryCode(loc?.slice(4, 6).toUpperCase());
    } catch (err) {
      console.error("[VOT] Error getting country:", err);
    }
  })().finally(() => {
    countryCodeRequestInFlight = null;
  });

  await countryCodeRequestInFlight;
}

export async function init(this: VideoHandler) {
  if (this.initialized) return;

  const audioContextSupported = this.isAudioContextSupported;

  // Retrieve settings from storage.
  this.data = await votStorage.getValues({
    autoTranslate: false,
    autoSubtitles: false,
    dontTranslateLanguages: [calculatedResLang],
    enabledDontTranslateLanguages: true,
    enabledAutoVolume: true,
    enabledSmartDucking: true,
    autoVolume: defaultAutoVolume,
    buttonPos: "default",
    showVideoSlider: true,
    syncVolume: false,
    downloadWithName: isSupportGMXhr,
    sendNotifyOnComplete: false,
    subtitlesMaxLength: 300,
    subtitlesSmartLayout: true,
    highlightWords: false,
    subtitlesFontSize: 20,
    subtitlesOpacity: 20,
    subtitlesDownloadFormat: "srt",
    responseLanguage: calculatedResLang,
    defaultVolume: 100,
    onlyBypassMediaCSP: audioContextSupported,
    newAudioPlayer: audioContextSupported,
    showPiPButton: false,
    translateAPIErrors: true,
    translationService: defaultTranslationService,
    detectService: defaultDetectService,
    translationHotkey: null,
    subtitlesHotkey: null,
    m3u8ProxyHost,
    proxyWorkerHost,
    translateProxyEnabled: 0,
    translateProxyEnabledDefault: true,
    audioBooster: false,
    useLivelyVoice: false,
    autoHideButtonDelay: defaultAutoHideDelay,
    // In extensions we inject scripts into the page (main world), so the audio
    // downloader can usually work even if the `unsafeWindow` heuristic fails in
    // some browsers/builds.
    useAudioDownload:
      isUnsafeWindowAllowed ||
      (typeof IS_EXTENSION !== "undefined" && IS_EXTENSION),
    compatVersion: "",
    account: {},
    localeHash: "",
    localeUpdatedAt: 0,
  });
  if (this.data.compatVersion !== actualCompatVersion) {
    this.data = await updateConfig(this.data);
    await votStorage.set("compatVersion", actualCompatVersion);
  }

  try {
    if (
      calculatedResLang === "en" &&
      this.data?.enabledDontTranslateLanguages &&
      Array.isArray(this.data?.dontTranslateLanguages) &&
      this.data.dontTranslateLanguages.length === 1 &&
      this.data.dontTranslateLanguages[0] === "en" &&
      typeof this.data.responseLanguage === "string" &&
      this.data.responseLanguage !== "en"
    ) {
      const responseLang = this.data.responseLanguage as LanguageSelectKey;
      this.data.dontTranslateLanguages = [responseLang];
      await votStorage.set(
        "dontTranslateLanguages",
        this.data.dontTranslateLanguages,
      );
    }
  } catch {
    // Ignore migration errors
  }

  this.uiManager.data = this.data;
  // Translation volume starts from the user's saved default volume.
  console.log("[VOT] data from db:", this.data);

  // Enable translate proxy if extension isn't compatible with GM_xmlhttpRequest
  if (!this.data.translateProxyEnabled && isProxyOnlyExtension) {
    this.data.translateProxyEnabled = 1;
  }
  // Determine country for proxy purposes
  await ensureCountryCode();

  if (
    countryCode &&
    proxyOnlyCountries.includes(countryCode) &&
    this.data.translateProxyEnabledDefault
  ) {
    this.data.translateProxyEnabled = 2;
  }

  debug.log(
    "translateProxyEnabled",
    this.data.translateProxyEnabled,
    this.data.translateProxyEnabledDefault,
  );
  debug.log("Extension compatibility passed...");

  this.initVOTClient();

  // Initialize UI elements and events.
  this.uiManager.initUI();
  this.uiManager.initUIEvents();

  if (this.uiManager.votOverlayView?.votButton?.container) {
    this.uiManager.votOverlayView.votButton.container.hidden = true;
  }

  // Get video data and create player.
  this.createPlayer();

  this.translateToLang = this.data.responseLanguage ?? "ru";
  this.initExtraEvents();

  this.initialized = true;
}
