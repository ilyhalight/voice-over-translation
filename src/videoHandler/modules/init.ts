import {
  actualCompatVersion,
  DEFAULT_AUTO_HIDE_DELAY,
  DEFAULT_AUTO_VOLUME,
  DEFAULT_DETECT_SERVICE,
  DEFAULT_TRANSLATION_SERVICE,
  m3u8ProxyHost,
  PROXY_ONLY_COUNTRIES,
  PROXY_WORKER_HOST,
} from "../../config/config";
import { updateAccountFromStorage } from "../../stores/account";
import { setLocale } from "../../stores/locale";
import { setSettings } from "../../stores/settings";
import type { LanguageSelectKey } from "../../types/components/select";
import { AUTO_SUBTITLE_LANGUAGE_VALUE } from "../../types/storage";
import { normalizeButtonPosition } from "../../ui/buttonPlacement";
import debug from "../../utils/debug";
import {
  GM_fetch,
  IS_PROXY_ONLY_EXTENSION,
  isSupportGMXhr,
} from "../../utils/gm";
import { updateConfig, votStorage } from "../../utils/storage";
import { calculatedResLang } from "../../utils/utils";
import type { VideoHandler } from "../../VideoHandler";
import { getCountryCode, setCountryCode } from "../shared";

let countryCodeRequestInFlight: Promise<void> | null = null;

async function ensureCountryCode(): Promise<void> {
  if (getCountryCode()) {
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
    autoPauseOnTranslate: false,
    autoSubtitles: false,
    dontTranslateLanguages: [calculatedResLang],
    enabledAutoVolume: true,
    enabledSmartDucking: true,
    autoVolume: DEFAULT_AUTO_VOLUME,
    buttonPos: "default",
    showVideoSlider: true,
    syncVolume: false,
    downloadWithName: isSupportGMXhr,
    sendNotifyOnComplete: false,
    subtitlesMaxLength: 300,
    subtitlesSmartLayout: true,
    highlightWords: false,
    subtitlesFontSize: 20,
    subtitlesFontFamily: "default-sans",
    subtitlesOpacity: 20,
    subtitlesDownloadFormat: "srt",
    responseLanguage: calculatedResLang,
    responseLanguageSubtitles: AUTO_SUBTITLE_LANGUAGE_VALUE,
    defaultVolume: 100,
    onlyBypassMediaCSP: audioContextSupported,
    newAudioPlayer: audioContextSupported,
    showPiPButton: false,
    translateAPIErrors: true,
    translationService: DEFAULT_TRANSLATION_SERVICE,
    detectService: DEFAULT_DETECT_SERVICE,
    translationHotkey: null,
    subtitlesHotkey: null,
    m3u8ProxyHost,
    proxyWorkerHost: PROXY_WORKER_HOST,
    translateProxyEnabled: 0,
    translateProxyEnabledDefault: true,
    audioBooster: false,
    useLivelyVoice: false,
    autoHideButtonDelay: DEFAULT_AUTO_HIDE_DELAY,
    // Audio download now uses direct network requests (GM_fetch/GM_xmlhttpRequest).
    useAudioDownload: isSupportGMXhr,
    compatVersion: "",
    account: {},
    localeHash: "",
    localeUpdatedAt: 0,
  });

  if (this.data.compatVersion !== actualCompatVersion) {
    this.data = await updateConfig(this.data);
    await votStorage.set("compatVersion", actualCompatVersion);
  }

  await updateAccountFromStorage();
  setLocale({
    updatedAt: this.data.localeUpdatedAt,
    hash: this.data.localeHash,
  });
  setSettings({
    // menu
    defaultVolume: this.data.defaultVolume,
    responseLanguage: this.data.responseLanguage,
    useLivelyVoice: false,
    // translation
    autoTranslate: this.data.autoTranslate,
    autoSubtitles: this.data.autoSubtitles,
    dontTranslateLanguages: this.data.dontTranslateLanguages,
    enabledAutoVolume: this.data.enabledAutoVolume,
    autoVolume: this.data.autoVolume,
    enabledSmartDucking: this.data.enabledSmartDucking,
    showVideoSlider: this.data.showVideoSlider,
    audioBooster: this.data.audioBooster,
    syncVolume: this.data.syncVolume,
    downloadWithName: this.data.downloadWithName,
    sendNotifyOnComplete: this.data.sendNotifyOnComplete,
    useAudioDownload: this.data.useAudioDownload,
    translationService: this.data.translationService,
    detectService: this.data.detectService,
    // other
    translateAPIErrors: this.data.translateAPIErrors,
    newAudioPlayer: this.data.newAudioPlayer,
    onlyBypassMediaCSP: this.data.onlyBypassMediaCSP,
    showPiPButton: this.data.showPiPButton,
    autoHideButtonDelay: this.data.autoHideButtonDelay,
    buttonPos: normalizeButtonPosition(this.data.buttonPos),
    proxyWorkerHost: this.data.proxyWorkerHost,
    translateProxyEnabled: this.data.translateProxyEnabled,
    // hotkeys
    translationHotkey: this.data.translationHotkey,
    subtitlesHotkey: this.data.subtitlesHotkey,
    // subtitles
    responseLanguageSubtitles: this.data.responseLanguageSubtitles,
    subtitlesDownloadFormat: this.data.subtitlesDownloadFormat,
    highlightWords: this.data.highlightWords,
    subtitlesSmartLayout: this.data.subtitlesSmartLayout,
    subtitlesFontFamily: this.data.subtitlesFontFamily,
    subtitlesMaxLength: this.data.subtitlesMaxLength,
    subtitlesFontSize: this.data.subtitlesFontSize,
    subtitlesOpacity: this.data.subtitlesOpacity,
  });

  try {
    if (
      calculatedResLang === "en" &&
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
  if (!this.data.translateProxyEnabled && IS_PROXY_ONLY_EXTENSION) {
    this.data.translateProxyEnabled = 1;
  }
  // Determine country for proxy purposes
  await ensureCountryCode();

  const countryCode = getCountryCode();
  if (
    countryCode !== null &&
    PROXY_ONLY_COUNTRIES.includes(countryCode) &&
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

  await this.initVOTClient();

  // Initialize UI elements and events.
  this.uiManager.initUI();
  this.uiManager.initUIEvents();
  this.uiManager.votOverlayView.overlayViewControls?.setButtonHidden(true);

  // Get video data and create player.
  this.createPlayer();

  this.translateToLang = this.data.responseLanguage ?? "ru";
  this.initExtraEvents();

  this.initialized = true;
}
