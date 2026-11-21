import type { JSX } from "@solidjs/web";
import { merge } from "solid-js";

import { localizationProvider, t } from "#localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsMiscSectionProps = {
  onChangeTranslateAPIErrors?: (checked: boolean) => void;
  onChangeSendErrorReports?: (checked: boolean) => void;
  onChangeNewAudioPlayer?: (checked: boolean) => void;
  onChangeOnlyBypassMediaCSP?: (checked: boolean) => void;
  isAudioContextSupported?: boolean;
  needBypassCSP?: boolean;
};

export function SettingsMiscSection(
  props: SettingsMiscSectionProps,
): JSX.Element {
  const finalProps = merge(
    { isAudioContextSupported: false, needBypassCSP: false },
    props,
  );

  const isWithoutAudioContext = () => !finalProps.isAudioContextSupported;

  return (
    <SettingsSection title={t("miscSettings")}>
      <Switch
        heading={t("VOTTranslateAPIErrors")}
        hidden={localizationProvider.lang === "ru"}
        checked={settings.translateAPIErrors}
        onChange={(checked) => {
          setSettings((draft) => {
            draft.translateAPIErrors = checked;
          });
          finalProps.onChangeTranslateAPIErrors?.(checked);
        }}
      />
      <Switch
        heading={t("sendErrorReports")}
        description={t("sendErrorReportsDescription")}
        checked={settings.sendErrorReports}
        onChange={(checked) => {
          setSettings((draft) => {
            draft.sendErrorReports = checked;
          });
          finalProps.onChangeSendErrorReports?.(checked);
        }}
      />
      <Switch
        heading={t("VOTNewAudioPlayer")}
        description={
          isWithoutAudioContext() ? t("VOTNeedWebAudioAPI") : undefined
        }
        disabled={isWithoutAudioContext()}
        checked={settings.newAudioPlayer}
        onChange={(checked) => {
          setSettings((draft) => {
            draft.newAudioPlayer = checked;
          });
          finalProps.onChangeNewAudioPlayer?.(checked);
        }}
      />
      <Switch
        heading={t("VOTOnlyBypassMediaCSP")}
        description={
          finalProps.needBypassCSP ? t("VOTMediaCSPEnabledOnSite") : undefined
        }
        checked={settings.onlyBypassMediaCSP}
        hidden={isWithoutAudioContext()}
        disabled={!settings.newAudioPlayer}
        isSubSwitch={true}
        onChange={(checked) => {
          setSettings((draft) => {
            draft.onlyBypassMediaCSP = checked;
          });
          finalProps.onChangeOnlyBypassMediaCSP?.(checked);
        }}
      />
    </SettingsSection>
  );
}
