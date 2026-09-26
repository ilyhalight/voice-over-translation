import type { JSX } from "solid-js";

import "./SettingsFooter.scss";

import { t } from "../../localization/localizationProvider";
import { GeneralButton } from "../Button/GeneralButton";
import { OutlinedButton } from "../Button/OutlinedButton";

export type SettingsFooterProps = {
  onBugReportClick?: () => void;
  onResetSettingsClick?: () => void;
};

export function SettingsFooter(props: SettingsFooterProps): JSX.Element {
  return (
    <vot-block class="vot-settings-footer">
      <OutlinedButton onClick={props.onBugReportClick}>
        {t("VOTBugReport")}
      </OutlinedButton>
      <GeneralButton onClick={props.onResetSettingsClick}>
        {t("resetSettings")}
      </GeneralButton>
    </vot-block>
  );
}
