import type { JSX } from "solid-js";
import { AccountMenu } from "../Account/AccountMenu";

export function SettingsContent(): JSX.Element {
  return (
    <vot-block style="max-width: 450px;display:block;margin:0 auto;">
      <AccountMenu />
    </vot-block>
  );
}
