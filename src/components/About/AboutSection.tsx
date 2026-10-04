import type { TMInfoScriptMeta } from "@toil/gm-types/types/info/tampermonkey";
import type { JSX } from "solid-js";

import { AboutItem } from "./AboutItem";
import "./AboutSection.scss";

import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
import { locale } from "../../stores/locale";
import { getEnvironmentInfo } from "../../utils/environment";
import { votStorage } from "../../utils/storage";
import { OutlinedButton } from "../Button/OutlinedButton";

export type AboutSectionProps = {
  ref?: (element: HTMLElement) => void;
};

export function AboutSection(props: AboutSectionProps): JSX.Element {
  const envInfo = getEnvironmentInfo();
  const safeGMInfo = typeof GM_info === "undefined" ? undefined : GM_info;
  const scriptVersion =
    envInfo.scriptVersion === "unknown"
      ? safeGMInfo?.script?.version || t("notFound")
      : envInfo.scriptVersion;
  const buildAuthors =
    typeof VOT_AUTHORS === "undefined" ? "" : String(VOT_AUTHORS);
  const scriptAuthors =
    (safeGMInfo?.script as TMInfoScriptMeta)?.author ||
    buildAuthors ||
    t("notFound");
  const browserInfo = `${envInfo.browser} (${envInfo.os})`;

  const localeUpdatedAt = () =>
    new Date(locale.updatedAt * 1000).toLocaleString();
  const localeHashValue = () => locale.hash || t("notFound");

  return (
    <vot-block ref={props.ref} class="vot-about-section">
      <AboutItem label={t("VOTVersion")}>{scriptVersion}</AboutItem>
      <AboutItem label={t("VOTAuthors")}>{scriptAuthors}</AboutItem>
      <AboutItem label={t("VOTLoader")}>{envInfo.loader}</AboutItem>
      <AboutItem label={t("VOTBrowser")}>{browserInfo}</AboutItem>
      <AboutItem label={t("VOTLocaleHash")}>
        {localeHashValue()}
        <br />
        <vot-block class="vot-about-item__value_detail">
          ({t("VOTUpdatedAt")} {localeUpdatedAt()})
        </vot-block>
      </AboutItem>
      <OutlinedButton
        onClick={async () => {
          await votStorage.set("localeHash", "");
          await localizationProvider.update(true);
          globalThis.location.reload();
        }}
      >
        {t("VOTUpdateLocaleFiles")}
      </OutlinedButton>
    </vot-block>
  );
}
