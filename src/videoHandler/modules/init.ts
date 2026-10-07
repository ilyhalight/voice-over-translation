import { actualCompatVersion, m3u8ProxyHost } from "../../config/config";
import { updateAccountFromStorage } from "../../stores/account";
import { setLocale } from "../../stores/locale";
import {
  createDefaultSettings,
  pickSettings,
  setSettings,
} from "../../stores/settings";
import type { LanguageSelectKey } from "../../types/components/select";
import { normalizeButtonPosition } from "../../ui/buttonPlacement";
import debug from "../../utils/debug";
import { IS_PROXY_ONLY_EXTENSION } from "../../utils/gm";
import { updateConfig, votStorage } from "../../utils/storage";
import { calculatedResLang } from "../../utils/utils";
import type { VideoHandler } from "../../VideoHandler";

export async function init(this: VideoHandler) {
  if (this.initialized) return;

  const audioContextSupported = this.isAudioContextSupported;

  // Retrieve settings from storage.
  this.data = await votStorage.getValues({
    ...createDefaultSettings(audioContextSupported),
    m3u8ProxyHost,
    translateProxyEnabledDefault: true,
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
    ...pickSettings(this.data),
    buttonPos: normalizeButtonPosition(this.data.buttonPos),
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
  debug.log("Extension compatibility passed...");

  // Initialize UI elements and events.
  this.uiManager.initUI();
  this.uiManager.initUIEvents();
  this.uiManager.votOverlayView.overlayViewControls?.setButtonHidden(true);

  void this.ensureProxySettingsResolved().catch((err) => {
    console.error("[VOT] Failed to initialize translation client:", err);
  });

  // Get video data and create player.
  this.createPlayer();

  this.translateToLang = this.data.responseLanguage ?? "ru";
  this.initExtraEvents();

  this.initialized = true;
}
