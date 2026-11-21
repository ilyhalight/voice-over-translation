import type { JSX } from "@solidjs/web";
import type { TMInfoScriptMeta } from "@toil/gm-types/types/info/tampermonkey";
import { createSignal, Match, onSettled, Show, Switch } from "solid-js";

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
import { formatDateTime } from "../../utils/timeFormatting";
import { OutlinedButton } from "../Button/OutlinedButton";
import { AboutItem } from "./AboutItem";

export type AboutSectionProps = {
  ref?: (element: HTMLElement) => void;
};

export type UpdaterState = "loading" | "error" | "available" | "latest";

export function AboutSection(props: AboutSectionProps): JSX.Element {
  const [updaterState, setUpdaterState] = createSignal<UpdaterState>("loading");
  const [availableVersion, setAvailableVersion] = createSignal("");

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
    locale.updatedAt > 0
      ? formatDateTime(locale.updatedAt, localizationProvider.lang)
      : undefined;
  const localeHashValue = () => locale.hash || t("notFound");

  function openLatestRelease() {
    globalThis.open(LATEST_RELEASE_URL, "_blank", "noopener,noreferrer");
  }

  onSettled(() => {
    checkUpdate()
      .then((result) => {
        setUpdaterState(result ? "available" : "latest");
        if (!result) {
          return;
        }

        setAvailableVersion(result);
      })
      .catch(() => {
        setUpdaterState("error");
      });
  });

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
            <Match when={updaterState() === "loading"}>
              <LoadingDotsIcon />
              {t("VOTCheckingForUpdate")}
            </Match>
            <Match when={updaterState() === "error"}>
              {t("VOTUpdateCheckFailed")}
            </Match>
            <Match when={updaterState() === "available"}>
              <vot-block
                class="vot-about-item__link"
                role="link"
                tabindex="0"
                onPointerUp={() => openLatestRelease()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  openLatestRelease();
                }}
              >
                {t("VOTUpdateAvailable").replace("{0}", availableVersion())}
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
        <Show when={localeUpdatedAt()}>
          {(updatedAt) => (
            <>
              <br />
              <vot-block class="vot-about-item__value_detail">
                ({t("VOTUpdatedDate").replace("{0}", updatedAt())})
              </vot-block>
            </>
          )}
        </Show>
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
