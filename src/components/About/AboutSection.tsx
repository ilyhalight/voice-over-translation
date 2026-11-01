import type { TMInfoScriptMeta } from "@toil/gm-types/types/info/tampermonkey";
import { createResource, type JSX, Match, Switch } from "solid-js";
import { LoadingDotsIcon } from "#components/Icons/LoadingDotsIcon.tsx";
import { LATEST_RELEASE_URL } from "#modules/updater/const.ts";
import { checkUpdate } from "#modules/updater/service.ts";
import { getGMInfo } from "#utils/gm.ts";
import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
import { locale } from "../../stores/locale";
import { getEnvironmentInfo } from "../../utils/environment";
import { votStorage } from "../../utils/storage";
import { OutlinedButton } from "../Button/OutlinedButton";
import { AboutItem } from "./AboutItem";

export type AboutSectionProps = {
  ref?: (element: HTMLElement) => void;
};

export function AboutSection(props: AboutSectionProps): JSX.Element {
  const [updaterResult] = createResource(checkUpdate);

  const envInfo = getEnvironmentInfo();
  const safeGMInfo = getGMInfo();
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
  const updaterState = () => {
    if (updaterResult.loading) return "loading";
    if (updaterResult.error) return "error";
    return updaterResult() ? "available" : "latest";
  };

  function openLatestRelease() {
    globalThis.open(LATEST_RELEASE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <vot-block ref={props.ref} class="vot-about-section">
      <AboutItem
        label={t("VOTVersion")}
        hasLink={updaterState() === "available"}
      >
        {scriptVersion}
        <vot-block
          class="vot-about-item__value_detail"
          data-state={updaterState()}
        >
          <Switch>
            <Match when={updaterResult.loading}>
              <LoadingDotsIcon />
              {t("VOTCheckingForUpdate")}
            </Match>
            <Match when={updaterResult.error}>
              {t("VOTUpdateCheckFailed")}
            </Match>
            <Match when={updaterResult()}>
              <vot-block
                class="vot-about-item__link"
                role="link"
                tabIndex={0}
                onPointerUp={() => openLatestRelease()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  openLatestRelease();
                }}
              >
                {t("VOTUpdateAvailable").replace("{0}", updaterResult())}
              </vot-block>
            </Match>
          </Switch>
        </vot-block>
      </AboutItem>
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
