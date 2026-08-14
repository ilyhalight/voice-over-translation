import type { TMInfoScriptMeta } from "@toil/gm-types/types/info/tampermonkey";
import type { JSX } from "solid-js";

import { AboutItem } from "./AboutItem";
import "./AboutSection.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import { locale } from "../../stores/locale";
import { getEnvironmentInfo } from "../../utils/environment";
import { votStorage } from "../../utils/storage";
import { OutlinedButton } from "../Button/OutlinedButton";

export type AccountSectionProps = {
  ref?: (element: HTMLElement) => void;
};

export function AboutSection(props: AccountSectionProps): JSX.Element {
  const envInfo = getEnvironmentInfo();
  const safeGMInfo = typeof GM_info === "undefined" ? undefined : GM_info;

  const scriptVersion = () =>
    envInfo.scriptVersion === "unknown"
      ? safeGMInfo?.script?.version || localizationProvider.get("notFound")
      : envInfo.scriptVersion;
  const buildAuthors = () =>
    typeof VOT_AUTHORS === "undefined" ? "" : String(VOT_AUTHORS);
  const scriptAuthors = () =>
    (safeGMInfo?.script as TMInfoScriptMeta)?.author ||
    buildAuthors() ||
    localizationProvider.get("notFound");
  const loaderInfo = () => envInfo.loader;
  const browserInfo = () => `${envInfo.browser} (${envInfo.os})`;
  const localeUpdatedAt = () =>
    new Date(locale.updatedAt * 1000).toLocaleString();
  const localeHashValue = () =>
    locale.hash || localizationProvider.get("notFound");

  return (
    <vot-block ref={props.ref} class="vot-about-section">
      <AboutItem label={localizationProvider.get("VOTVersion")}>
        {scriptVersion()}
      </AboutItem>
      <AboutItem label={localizationProvider.get("VOTAuthors")}>
        {scriptAuthors()}
      </AboutItem>
      <AboutItem label={localizationProvider.get("VOTLoader")}>
        {loaderInfo()}
      </AboutItem>
      <AboutItem label={localizationProvider.get("VOTBrowser")}>
        {browserInfo()}
      </AboutItem>
      <AboutItem label={localizationProvider.get("VOTLocaleHash")}>
        {localeHashValue()}
        <br />({localizationProvider.get("VOTUpdatedAt")} {localeUpdatedAt})
      </AboutItem>
      <OutlinedButton
        onClick={async () => {
          await votStorage.set("localeHash", "");
          await localizationProvider.update(true);
          globalThis.location.reload();
        }}
      >
        {localizationProvider.get("VOTUpdateLocaleFiles")}
      </OutlinedButton>
    </vot-block>
  );
}
