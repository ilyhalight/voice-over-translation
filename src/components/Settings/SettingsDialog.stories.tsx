import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
import { HotkeyController } from "../../modules/hotkeys/controller";
import {
  createDefaultSettings,
  pickSettings,
  setSettings,
  settings,
} from "../../stores/settings";
import { SettingsController } from "../../ui/settingsController";
import { votStorage } from "../../utils/storage";
import type { VideoHandler } from "../../VideoHandler";
import { SettingsDialog } from "./SettingsDialog";

const meta = {
  component: SettingsDialog,
  args: { hotkeys: { hotkeyController: new HotkeyController() } },
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { isOpen: true, onClose: fn() },
};

export const SubtitleTranslationLanguagePersistence: Story = {
  args: { isOpen: false, onClose: fn() },
  play: async ({ canvasElement }) => {
    const previousSettings = { ...settings };
    const storedLanguage = await votStorage.get<string | undefined>(
      "subtitlesTranslationLanguage",
    );
    const portal = document.createElement("vot-block");
    canvasElement.append(portal);
    const videoHandler = {
      hotkeyController: new HotkeyController(),
      site: { host: "youtube" },
    } as unknown as VideoHandler;
    let controller: SettingsController | undefined;
    const openSettings = async () => {
      const data = await votStorage.getValues(createDefaultSettings());
      setSettings(pickSettings(data));
      controller = new SettingsController({
        globalPortal: portal,
        data,
        videoHandler,
      });
      controller.initUI().open();
      const section = Array.from(
        portal.querySelectorAll<HTMLElement>(".vot-settings-section__header"),
      ).find((element) =>
        element.textContent?.includes(t("subtitlesSettings")),
      );
      if (!section)
        throw new Error("Subtitle settings section was not rendered");
      await userEvent.click(section);
      const select = Array.from(
        portal.querySelectorAll<HTMLElement>(".vot-select"),
      ).find(
        (element) =>
          element.querySelector(".vot-select-label")?.textContent ===
          t("VOTSubtitlesTranslationLanguage"),
      );
      const trigger = select?.querySelector<HTMLElement>(".vot-select-outer");
      if (!trigger)
        throw new Error(
          "Subtitle translation language select was not rendered",
        );
      return trigger;
    };
    const selectLanguage = async (trigger: HTMLElement, label: string) => {
      await userEvent.click(trigger);
      const popup = document.getElementById(
        trigger.getAttribute("aria-controls") ?? "",
      );
      const option = Array.from(
        popup?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
      ).find((element) => element.textContent === label);
      if (!option)
        throw new Error(`Language option was not rendered: ${label}`);
      await userEvent.click(option);
    };
    try {
      await votStorage.delete("subtitlesTranslationLanguage");
      let trigger = await openSettings();
      const originalVoiceoverLanguage = settings.responseLanguage;
      const originalSubtitleLanguage = settings.responseLanguageSubtitles;
      await expect(trigger).toHaveTextContent(t("VOTSameAsMenuLanguage"));
      await userEvent.click(trigger);
      const popup = document.getElementById(
        trigger.getAttribute("aria-controls") ?? "",
      );
      await expect(
        Array.from(
          popup?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
          (option) => option.textContent,
        ),
      ).toEqual(
        localizationProvider
          .getAvailableLangs()
          .map((language) =>
            language === "auto"
              ? t("VOTSameAsMenuLanguage")
              : localizationProvider.getLangLabel(language),
          ),
      );
      await userEvent.click(trigger);
      await selectLanguage(trigger, localizationProvider.getLangLabel("ru"));
      await waitFor(async () => {
        expect(await votStorage.get("subtitlesTranslationLanguage")).toBe("ru");
      });
      await expect(settings.responseLanguage).toBe(originalVoiceoverLanguage);
      await expect(settings.responseLanguageSubtitles).toBe(
        originalSubtitleLanguage,
      );
      controller?.release();
      setSettings("subtitlesTranslationLanguage", "auto");

      trigger = await openSettings();
      await expect(trigger).toHaveTextContent(
        localizationProvider.getLangLabel("ru"),
      );
      await selectLanguage(trigger, t("VOTSameAsMenuLanguage"));
      await waitFor(async () => {
        expect(await votStorage.get("subtitlesTranslationLanguage")).toBe(
          "auto",
        );
      });
    } finally {
      controller?.release();
      portal.remove();
      setSettings(previousSettings);
      if (storedLanguage === undefined)
        await votStorage.delete("subtitlesTranslationLanguage");
      else await votStorage.set("subtitlesTranslationLanguage", storedLanguage);
    }
  },
};
