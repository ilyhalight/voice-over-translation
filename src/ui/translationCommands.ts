import type { VideoHandler } from "../index";
import { localizationProvider } from "../localization/localizationProvider";
import type { Status } from "../types/components/votButton";
import debug from "../utils/debug";
import { isAbortError } from "../utils/errors";
import VOTLocalizedError from "../utils/VOTLocalizedError";

type TranslationButtonCommandDeps = {
  videoHandler?: VideoHandler;
  currentStatus: Status;
  currentLoading: boolean;
  transformBtn(status: Status, text: string): void;
};

async function getVideoDataForTranslation(videoHandler: VideoHandler) {
  if (!videoHandler.videoData?.videoId) {
    throw new VOTLocalizedError("VOTNoVideoIDFound");
  }

  if (shouldRefreshVideoDataBeforeTranslation(videoHandler)) {
    videoHandler.videoData = await videoHandler.getVideoData();
  }

  if (!videoHandler.videoData?.videoId) {
    throw new VOTLocalizedError("VOTNoVideoIDFound");
  }

  return videoHandler.videoData;
}

function shouldRefreshVideoDataBeforeTranslation(videoHandler: VideoHandler) {
  return (
    (videoHandler.site.host === "vk" &&
      videoHandler.site.additionalData === "clips") ||
    videoHandler.site.host === "douyin"
  );
}

export async function handleTranslationButtonCommand(
  deps: TranslationButtonCommandDeps,
) {
  const videoHandler = deps.videoHandler;
  if (!videoHandler) {
    return;
  }

  debug.log("[handleTranslationBtnClick] click translationBtn");
  if (videoHandler.hasActiveSource()) {
    debug.log("[handleTranslationBtnClick] video has active source");
    await videoHandler.stopTranslation();
    return;
  }

  if (deps.currentStatus === "error" && !deps.currentLoading) {
    deps.transformBtn("none", localizationProvider.get("translateVideo"));
  }

  if (deps.currentStatus !== "none" || deps.currentLoading) {
    debug.log("[handleTranslationBtnClick] translationBtn isn't in none state");
    videoHandler.actionsAbortController.abort();
    await videoHandler.stopTranslation();
    return;
  }

  try {
    debug.log("[handleTranslationBtnClick] trying execute translation");
    const videoData = await getVideoDataForTranslation(videoHandler);
    await videoHandler.videoManager.ensureDetectedLanguageForTranslation(
      videoData,
    );

    debug.log(
      "[handleTranslationBtnClick] Run translateFunc",
      videoData.videoId,
    );
    await videoHandler.translateFunc(
      videoData.videoId,
      videoData.isStream,
      videoData.detectedLanguage,
      videoData.responseLanguage,
      videoData.translationHelp,
    );
  } catch (err) {
    if (isAbortError(err)) {
      deps.transformBtn("none", localizationProvider.get("translateVideo"));
      return;
    }

    console.error("[VOT]", err);
    if (!(err instanceof Error)) {
      deps.transformBtn("error", String(err));
      return;
    }

    const message =
      err.name === "VOTLocalizedError"
        ? (err as VOTLocalizedError).localizedMessage
        : err.message;
    deps.transformBtn("error", message);
  }
}
