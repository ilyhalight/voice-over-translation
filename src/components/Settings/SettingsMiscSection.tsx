import { type JSX, mergeProps } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsMiscSectionProps = {
  ref?: (element: HTMLElement) => void;
  onChangeTranslateAPIErrors?: (checked: boolean) => void;
  onChangeNewAudioPlayer?: (checked: boolean) => void;
  onChangeOnlyBypassMediaCSP?: (checked: boolean) => void;
  isAudioContextSupported?: boolean;
  needBypassCSP?: boolean;
};

export function SettingsMiscSection(
  props: SettingsMiscSectionProps,
): JSX.Element {
  const finalProps = mergeProps(
    { isAudioContextSupported: false, needBypassCSP: false },
    props,
  );

  const isWithoutAudioContext = () => !finalProps.isAudioContextSupported;

  return (
    <SettingsSection
      ref={finalProps.ref}
      title={localizationProvider.get("miscSettings")}
    >
      <Switch
        heading={localizationProvider.get("VOTTranslateAPIErrors")}
        hidden={localizationProvider.lang === "ru"}
        checked={settings.translateAPIErrors}
        onChange={(checked) => {
          setSettings("translateAPIErrors", checked);
          finalProps.onChangeTranslateAPIErrors?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTNewAudioPlayer")}
        description={
          isWithoutAudioContext()
            ? localizationProvider.get("VOTNeedWebAudioAPI")
            : undefined
        }
        disabled={isWithoutAudioContext()}
        checked={settings.newAudioPlayer}
        onChange={(checked) => {
          setSettings("newAudioPlayer", checked);
          finalProps.onChangeNewAudioPlayer?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTOnlyBypassMediaCSP")}
        description={
          finalProps.needBypassCSP
            ? localizationProvider.get("VOTMediaCSPEnabledOnSite")
            : undefined
        }
        checked={settings.onlyBypassMediaCSP}
        hidden={isWithoutAudioContext()}
        disabled={!settings.newAudioPlayer}
        isSubSwitch={true}
        onChange={(checked) => {
          setSettings("onlyBypassMediaCSP", checked);
          finalProps.onChangeOnlyBypassMediaCSP?.(checked);
        }}
      />
    </SettingsSection>
  );
}
