import type { JSX } from "solid-js";

import { PROXY_WORKER_HOST } from "../../config/config";
import { t } from "../../localization/localizationProvider";
import { settings } from "../../stores/settings";
import { IS_PROXY_ONLY_EXTENSION } from "../../utils/gm";
import { Select, type SelectOption } from "../Control/Select";
import { Textfield } from "../Textfield/Textfield";
import { SettingsSection } from "./SettingsSection";

export type SettingsProxySectionProps = {
  onProxyWorkerHostChange?: (value: string) => void;
  onTranslateProxyStatusSelect?: (option: SelectOption) => void;
};

export function SettingsProxySection(
  props: SettingsProxySectionProps,
): JSX.Element {
  const proxyEnabledLabels = [
    t("VOTTranslateProxyDisabled"),
    t("VOTTranslateProxyEnabled"),
    t("VOTTranslateProxyEverything"),
  ];

  const translateProxyOptions = proxyEnabledLabels.map<SelectOption>(
    (label, idx) => ({
      label,
      value: idx,
      disabled: idx === 0 && IS_PROXY_ONLY_EXTENSION,
    }),
  );

  return (
    <SettingsSection title={t("proxySettings")}>
      <Textfield
        labelText={t("VOTProxyWorkerHost")}
        placeholder={PROXY_WORKER_HOST}
        value={settings.proxyWorkerHost}
        onChange={props.onProxyWorkerHostChange}
      />
      <Select
        title={t("VOTTranslateProxyStatus")}
        options={translateProxyOptions}
        selectedValue={settings.translateProxyEnabled}
        onSelect={props.onTranslateProxyStatusSelect}
      >
        {t("VOTTranslateProxyStatus")}
      </Select>
    </SettingsSection>
  );
}
