import type { JSX } from "solid-js";
import { AboutSection } from "../About/AboutSection";
import { AccountMenu } from "../Account/AccountMenu";

export function SettingsContent(): JSX.Element {
  return (
    <vot-block style="max-width: 450px;display:block;margin:0 auto;">
      <AccountMenu />
      <AboutSection />
    </vot-block>
  );
}
