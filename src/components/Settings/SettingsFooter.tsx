import type { JSX } from "solid-js";

import "./SettingsFooter.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import { GeneralButton } from "../Button/GeneralButton";
import { OutlinedButton } from "../Button/OutlinedButton";

export type SettingsFooterProps = {
  onBugReportClick?: () => void;
  onResetSettingsClick?: () => void;
  ref?: (element: HTMLElement) => void;
};

export function SettingsFooter(props: SettingsFooterProps): JSX.Element {
  return (
    <vot-block class="vot-settings-footer" ref={props.ref}>
      <OutlinedButton onClick={props.onBugReportClick}>
        {localizationProvider.get("VOTBugReport")}
      </OutlinedButton>
      <GeneralButton onClick={props.onResetSettingsClick}>
        {localizationProvider.get("resetSettings")}
      </GeneralButton>
    </vot-block>
  );
}
