import type { JSX } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { AboutSection } from "../About/AboutSection";
import { AccountMenu, type AccountMenuProps } from "../Account/AccountMenu";
import { Dialog, type DialogProps } from "../Dialog/Dialog";
import {
  SettingsAppearanceSection,
  type SettingsAppearanceSectionProps,
} from "./SettingsAppearanceSection";
import { SettingsFooter, type SettingsFooterProps } from "./SettingsFooter";
import {
  SettingsHotkeySection,
  type SettingsHotkeySectionProps,
} from "./SettingsHotkeySection";
import {
  SettingsMiscSection,
  type SettingsMiscSectionProps,
} from "./SettingsMiscSection";
import {
  SettingsProxySection,
  type SettingsProxySectionProps,
} from "./SettingsProxySection";
import { SettingsSection } from "./SettingsSection";
import {
  SettingsSubtitlesSection,
  type SettingsSubtitlesSectionProps,
} from "./SettingsSubtitlesSection";
import {
  SettingsTranslationSection,
  type SettingsTranslationSectionProps,
} from "./SettingsTranslationSection";

export type SettingsDialogProps = {
  account?: AccountMenuProps;
  translation?: SettingsTranslationSectionProps;
  hotkeys?: SettingsHotkeySectionProps;
  subtitles?: SettingsSubtitlesSectionProps;
  proxy?: SettingsProxySectionProps;
  appearance?: SettingsAppearanceSectionProps;
  misc?: SettingsMiscSectionProps;
  footer?: SettingsFooterProps;
  isOpen: boolean;
  ref?: DialogProps["ref"];
  onClose: () => void;
};

export function SettingsDialog(props: SettingsDialogProps): JSX.Element {
  return (
    <Dialog
      ref={props.ref}
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={localizationProvider.get("VOTSettings")}
      footer={<SettingsFooter {...props.footer} />}
    >
      <SettingsSection
        title={localizationProvider.get("VOTMyAccount")}
        isOpen={true}
      >
        <AccountMenu {...props.account} />
      </SettingsSection>
      <SettingsTranslationSection {...props.translation} />
      <SettingsHotkeySection {...props.hotkeys} />
      <SettingsSubtitlesSection {...props.subtitles} />
      <SettingsProxySection {...props.proxy} />
      <SettingsMiscSection {...props.misc} />
      <SettingsAppearanceSection {...props.appearance} />
      <SettingsSection title={localizationProvider.get("aboutExtension")}>
        <AboutSection />
      </SettingsSection>
    </Dialog>
  );
}
