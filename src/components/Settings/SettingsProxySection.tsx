import { type JSX, mergeProps } from "solid-js";
import { PROXY_WORKER_HOST } from "../../config/config";
import { localizationProvider } from "../../localization/localizationProvider";
import { settings } from "../../stores/settings";
import { IS_PROXY_ONLY_EXTENSION } from "../../utils/gm";
import { Select, type SelectOption } from "../Control/Select";
import { Textfield } from "../Textfield/Textfield";
import { SettingsSection } from "./SettingsSection";

export type SettingsProxySectionProps = {
  ref?: (element: HTMLElement) => void;
  onProxyWorkerHostChange?: (value: string) => void;
  onTranslateProxyStatusSelect?: (option: SelectOption) => void;
};

export function SettingsProxySection(
  props: SettingsProxySectionProps,
): JSX.Element {
  const proxyEnabledLabels = [
    localizationProvider.get("VOTTranslateProxyDisabled"),
    localizationProvider.get("VOTTranslateProxyEnabled"),
    localizationProvider.get("VOTTranslateProxyEverything"),
  ];

  const translateProxyOptions = proxyEnabledLabels.map<SelectOption>(
    (label, idx) => ({
      label,
      value: idx,
      disabled: idx === 0 && IS_PROXY_ONLY_EXTENSION,
    }),
  );

  return (
    <SettingsSection
      ref={props.ref}
      title={localizationProvider.get("proxySettings")}
    >
      <Textfield
        labelText={localizationProvider.get("VOTProxyWorkerHost")}
        placeholder={PROXY_WORKER_HOST}
        value={settings.proxyWorkerHost}
        onChange={props.onProxyWorkerHostChange}
      />
      <Select
        title={localizationProvider.get("VOTTranslateProxyStatus")}
        options={translateProxyOptions}
        selectedValue={settings.translateProxyEnabled}
        onSelect={props.onTranslateProxyStatusSelect}
      >
        {localizationProvider.get("VOTTranslateProxyStatus")}
      </Select>
    </SettingsSection>
  );
}
