import type { JSX } from "@solidjs/web";

import { t } from "#localizationProvider";
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
