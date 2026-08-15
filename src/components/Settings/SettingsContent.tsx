import type { JSX } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { AboutSection } from "../About/AboutSection";
import { AccountMenu } from "../Account/AccountMenu";
import { SettingsAppearanceSection } from "./SettingsAppearanceSection";
import { SettingsMiscSection } from "./SettingsMiscSection";
import { SettingsSection } from "./SettingsSection";

export function SettingsContent(): JSX.Element {
  return (
    <vot-block style="max-width: 450px;display:flex;flex-direction:column;gap: 16px;margin: 0 auto;">
      <SettingsSection
        title={localizationProvider.get("VOTMyAccount")}
        isOpen={true}
      >
        <AccountMenu />
      </SettingsSection>
      <SettingsAppearanceSection />
      <SettingsMiscSection />
      <SettingsSection title={localizationProvider.get("aboutExtension")}>
        <AboutSection />
      </SettingsSection>
    </vot-block>
  );
}
