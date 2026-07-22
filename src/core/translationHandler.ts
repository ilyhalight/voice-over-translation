import {
  type TranslatedVideoTranslationResponse,
  type TranslationHelp,
  type VideoTranslationResponse,
  VideoTranslationStatus,
} from "@vot.js/core/types/yandex";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { AudioDownloader } from "../audioDownloader";
import { localizationProvider } from "../localization/localizationProvider";
import type {
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import {
  createAbortableDelay,
  createAbortableWaiter,
  NEVER_ABORTED_SIGNAL,
  throwIfAborted,
} from "../utils/abort";
import { deleteAccount, hasAccountToken } from "../utils/account";
import debug from "../utils/debug";
import { getErrorMessage, isAbortError, safeNestedGet } from "../utils/errors";
import type { VideoHandler } from "../VideoHandler";
import VOTLocalizedError from "../VOTLocalizedError";
import type { VideoData } from "../videoHandler/shared";
import { openAuthWindow } from "./authWindow";
import {
  getTranslationAuthErrorKind,
  getTranslationServerErrorMessage,
  isTranslationAuthError,
} from "./translationAuthError";
import { notifyTranslationFailureIfNeeded } from "./translationErrors";
import { TranslationEtaCountdown } from "./translationEtaCountdown";

/**
 * Historically we used `patch-package` to make `@vot.js/core` throw
 * `VOTLocalizedError` for a few common failure cases.
 *
 * We now keep the dependency unpatched and instead map known error messages
 * coming from the VOT client to the corresponding localized UI errors.
 */
function mapVotClientErrorForUi(
  error: unknown,
  hasProvidedAccountToken = false,
): unknown {
  const authErrorKind = getTranslationAuthErrorKind(error, {
    hasAccountToken: hasProvidedAccountToken,
  });
  if (authErrorKind) {
    return new VOTLocalizedError(
      authErrorKind === "session-expired"
        ? "VOTYandexTokenExpired"
        : "VOTAccountRequired",
    );
  }

  // Only VOT client errors (objects with name === "VOTJSError") need mapping.
  if (!error || typeof error !== "object") {
    return error;
  }

  const errName = safeNestedGet(error, ["name"]);
  if (errName !== "VOTJSError") {
    return error;
  }

  const message =
    typeof safeNestedGet(error, ["message"]) === "string"
      ? (safeNestedGet(error, ["message"]) as string)
      : "";
  const serverMessage = safeNestedGet(error, ["data", "message"]);
  const hasServerMessage =
    typeof serverMessage === "string" && serverMessage.length > 0;

  // Keep server-provided messages when available.
  if (message === "Yandex couldn't translate video" && !hasServerMessage) {
    return new VOTLocalizedError("requestTranslationFailed");
  }

  if (message === "Failed to request video translation") {
    return new VOTLocalizedError("requestTranslationFailed");
  }

  if (
    message === "Audio link wasn't received" ||
    message === "Audio link wasn't received from VOT response"
  ) {
    return new VOTLocalizedError("audioNotReceived");
  }

  return error;
}

type TranslateVideoImplOptions = {
  disableLivelyVoice?: boolean;
  retryAttempt?: number;
};

function summarizeTranslationResponse(
  response: VideoTranslationResponse,
): Record<string, unknown> {
  return {
    status: response.status,
    translated: response.translated,
    remainingTime: response.remainingTime,
    translationId: response.translationId,
  };
}

export class VOTTranslationHandler {
  readonly videoHandler: VideoHandler;
  readonly audioDownloader: AudioDownloader;
  downloading: boolean;
  private readonly downloadSettlers = new Set<{
    resolve: () => void;
    reject: (error: Error) => void;
  }>();
  private readonly etaCountdown: TranslationEtaCountdown;

  // Avoid spamming the fail-audio-js fallback for the same video URL.
  // In normal operation we should upload audio from the direct ytAudio path.
  private readonly requestedFailAudio = new Set<string>();

  constructor(videoHandler: VideoHandler) {
    this.videoHandler = videoHandler;
    this.audioDownloader = new AudioDownloader();
    this.downloading = false;
    this.etaCountdown = new TranslationEtaCountdown(
      (message, signal, options) =>
        this.videoHandler.updateTranslationErrorMsg(message, signal, options),
    );

    this.audioDownloader
      .addEventListener("downloadedAudio", this.onDownloadedAudio)
      .addEventListener("downloadedPartialAudio", this.onDownloadedPartialAudio)
      .addEventListener("downloadAudioError", this.onDownloadAudioError);
  }

  private readonly onDownloadedAudio = async (
    translationId: string,
    data: DownloadedAudioData,
  ) => {
    debug.log("downloadedAudio", data);
    if (!this.downloading) {
      debug.log("skip downloadedAudio");
      return;
    }

    const { videoId, fileId, audioData } = data;
    const videoUrl = this.getCanonicalUrl(videoId);
    try {
      await this.retryAudioUpload(() =>
        this.videoHandler.votClient.requestVtransAudio(
          videoUrl,
          translationId,
          {
            audioFile: audioData,
            fileId,
          },
        ),
      );
    } catch (error) {
      debug.error("Failed to upload downloaded audio", error);
      this.finishDownloadFailure(
        error instanceof Error
          ? error
          : new Error("Audio downloader failed while uploading full audio"),
      );
      return;
    }
    this.finishDownloadSuccess();
  };

  private readonly onDownloadedPartialAudio = async (
    translationId: string,
    data: DownloadedPartialAudioData,
  ) => {
    debug.log("downloadedPartialAudio", data);
    if (!this.downloading) {
      debug.log("skip downloadedPartialAudio");
      return;
    }

    const { audioData, fileId, videoId, amount, version, index } = data;
    const videoUrl = this.getCanonicalUrl(videoId);
    try {
      await this.retryAudioUpload(() =>
        this.videoHandler.votClient.requestVtransAudio(
          videoUrl,
          translationId,
          {
            audioFile: audioData,
            chunkId: index,
          },
          {
            audioPartsLength: amount,
            fileId,
            version,
          },
        ),
      );
    } catch (error) {
      debug.error("Failed to upload downloaded audio chunk", error);
      this.finishDownloadFailure(
        new Error("Audio downloader failed while uploading chunk"),
      );
      return;
    }

    if (index === amount - 1) {
      this.finishDownloadSuccess();
    }
  };

  private readonly onDownloadAudioError = async (videoId: string) => {
    if (!this.downloading) {
      debug.log("skip downloadAudioError");
      return;
    }

    debug.log(`Failed to download audio ${videoId}`);
    const videoUrl = this.getCanonicalUrl(videoId);

    // The fail-audio-js endpoint is a rare fallback. Keep its usage minimal and
    // only call it for YouTube when the audio downloader is enabled.
    const shouldUseFallback =
      this.videoHandler.site.host === "youtube" &&
      Boolean(this.videoHandler.data?.useAudioDownload);

    if (!shouldUseFallback) {
      this.finishDownloadFailure(
        new VOTLocalizedError("VOTFailedDownloadAudio"),
      );
      return;
    }

    try {
      if (this.requestedFailAudio.has(videoUrl)) {
        debug.log("fail-audio-js request already sent for this video");
      } else {
        debug.log("Sending fail-audio-js request");
        await this.videoHandler.votClient.requestVtransFailAudio(videoUrl);
        this.requestedFailAudio.add(videoUrl);
      }

      this.finishDownloadSuccess();
    } catch (error) {
      debug.error("fail-audio-js request failed", error);
      this.finishDownloadFailure(
        new VOTLocalizedError("VOTFailedDownloadAudio"),
      );
    }
  };

  private finishDownloadSuccess() {
    this.downloading = false;
    this.settleDownloadWaiters();
  }

  private finishDownloadFailure(error: Error) {
    this.downloading = false;
    this.settleDownloadWaiters(error);
  }

  private getCanonicalUrl(videoId: string) {
    return `https://youtu.be/${videoId}`;
  }

  private static readonly AUDIO_UPLOAD_MAX_RETRIES = 2;
  private static readonly AUDIO_UPLOAD_RETRY_DELAY_MS = 1500;

  private async retryAudioUpload<T>(fn: () => Promise<T>): Promise<T> {
    const maxRetries = VOTTranslationHandler.AUDIO_UPLOAD_MAX_RETRIES;
    const delayMs = VOTTranslationHandler.AUDIO_UPLOAD_RETRY_DELAY_MS;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
        debug.log(
          `[AudioUpload] retry ${attempt + 1}/${maxRetries} after ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  // Cancellation helpers live in utils/abort.ts.

  /**
   * Detector for cases when server rejects the request because
   * "Lively/Live voices" are unavailable (unsupported language pair).
   */
  private isLivelyVoiceUnavailableError(value: unknown): boolean {
    if (isTranslationAuthError(value)) {
      return false;
    }

    const msg = getErrorMessage(value);
    return !!msg && msg.toLowerCase().includes("обычная озвучка");
  }

  private async scheduleRetry<T>(
    fn: () => Promise<T>,
    delayMs: number,
    signal: AbortSignal,
  ): Promise<T> {
    await createAbortableDelay(delayMs, signal, {
      onScheduled: (timeoutId) => {
        this.videoHandler.autoRetry = timeoutId;
      },
    });
    return await fn();
  }

  private static readonly MAX_INITIAL_WAIT_SEC = 180;
  private static readonly LONG_WAIT_MS = 120_000;
  private static readonly RETRY_INTERVAL_MS = 30_000;

  private getRetryDelayMs(
    retryAttempt: number,
    remainingTimeSeconds: number | null = 0,
  ): number {
    if (retryAttempt > 0) {
      return VOTTranslationHandler.RETRY_INTERVAL_MS;
    }

    const eta = remainingTimeSeconds ?? 0;
    if (eta <= 0) {
      return VOTTranslationHandler.RETRY_INTERVAL_MS;
    }

    if (eta <= VOTTranslationHandler.MAX_INITIAL_WAIT_SEC) {
      return eta * 1000;
    }

    return VOTTranslationHandler.LONG_WAIT_MS;
  }

  private async handleTranslationUiError(uiError: unknown): Promise<void> {
    if (!(uiError instanceof VOTLocalizedError)) return;

    if (uiError.unlocalizedMessage === "VOTYandexTokenExpired") {
      await deleteAccount(this.videoHandler);
      openAuthWindow();
    } else if (uiError.unlocalizedMessage === "VOTAccountRequired") {
      openAuthWindow();
    }
  }

  async translateVideoImpl(
    videoData: VideoData,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    translationHelp: TranslationHelp[] | null = null,
    shouldSendFailedAudio = false,
    signal = NEVER_ABORTED_SIGNAL,
    options: TranslateVideoImplOptions = {},
  ): Promise<
    (TranslatedVideoTranslationResponse & { usedLivelyVoice: boolean }) | null
  > {
    const { disableLivelyVoice = false, retryAttempt = 0 } = options;
    clearTimeout(this.videoHandler.autoRetry);
    this.finishDownloadSuccess();
    const requestLangForApi = this.videoHandler.getRequestLangForTranslation(
      requestLang,
      responseLang,
    );
    debug.log("[Translation] translateVideoImpl start", {
      videoId: videoData.videoId,
      duration: videoData.duration,
      requestLang,
      requestLangForApi,
      responseLang,
      retryAttempt,
      disableLivelyVoice,
      shouldSendFailedAudio,
      translationHelpCount: translationHelp?.length ?? 0,
    });
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, requestLangForApi: ${requestLangForApi}, responseLang: ${responseLang})`,
    );

    let livelyDisabled = disableLivelyVoice;
    let translationResponse: VideoTranslationResponse | undefined;

    try {
      throwIfAborted(signal);

      const livelyVoiceAllowed = this.videoHandler.isLivelyVoiceAllowed(
        requestLangForApi,
        responseLang,
      );
      const translationAttempt =
        await this.requestTranslationWithLivelyFallback({
          videoData,
          requestLangForApi,
          responseLang,
          translationHelp,
          shouldSendFailedAudio,
          livelyDisabled,
          livelyVoiceAllowed,
        });
      livelyDisabled = translationAttempt.livelyDisabled;
      const useLivelyVoice = translationAttempt.useLivelyVoice;
      const res = translationAttempt.response;
      translationResponse = res;

      if (!res) {
        throw new Error("Failed to get translation response");
      }

      if (
        isTranslationAuthError(res, {
          hasAccountToken: hasAccountToken(this.videoHandler.data?.account),
        })
      ) {
        throw mapVotClientErrorForUi(
          res,
          hasAccountToken(this.videoHandler.data?.account),
        );
      }

      debug.log("[Translation] translateVideoImpl response", {
        videoId: videoData.videoId,
        useLivelyVoice,
        ...summarizeTranslationResponse(res),
      });
      throwIfAborted(signal);

      if (res.translated && res.remainingTime < 1) {
        this.etaCountdown.stop();
        debug.log("[Translation] translation finished", {
          videoId: videoData.videoId,
          useLivelyVoice,
          ...summarizeTranslationResponse(res),
        });
        return { ...res, usedLivelyVoice: useLivelyVoice };
      }

      const message =
        res.message ?? localizationProvider.get("translationTakeFewMinutes");
      debug.log("[Translation] translation still processing", {
        videoId: videoData.videoId,
        useLivelyVoice,
        ...summarizeTranslationResponse(res),
        message,
      });
      if (res.remainingTime > 0) {
        await this.etaCountdown.sync(res.remainingTime, signal, {
          countLongWaitOnFirstRender: true,
        });
      } else {
        this.etaCountdown.stop();
        await this.videoHandler.updateTranslationErrorMsg(message, signal);
      }

      if (
        res.status === VideoTranslationStatus.AUDIO_REQUESTED &&
        this.videoHandler.isYouTubeHosts()
      ) {
        this.videoHandler.hadAsyncWait = true;

        debug.log("[Translation] audio download started", {
          videoId: videoData.videoId,
          translationId: res.translationId,
        });
        this.downloading = true;

        await this.audioDownloader.runAudioDownload(
          videoData.videoId,
          res.translationId,
          signal,
        );

        debug.log("[Translation] waiting for audio download completion", {
          videoId: videoData.videoId,
          translationId: res.translationId,
          timeoutMs: 30_000,
        });
        await this.waitForAudioDownloadCompletion(signal, 30_000);

        // for get instant result on download end
        return await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          true,
          signal,
          {
            disableLivelyVoice: livelyDisabled,
            retryAttempt,
          },
        );
      }
    } catch (err) {
      if (isAbortError(err)) {
        this.etaCountdown.stop();
        debug.log("[Translation] translation aborted", {
          videoId: videoData.videoId,
          retryAttempt,
        });
        return null;
      }

      this.etaCountdown.stop();
      const uiError = mapVotClientErrorForUi(
        err,
        hasAccountToken(this.videoHandler.data?.account),
      );
      debug.error("[Translation] translation failed", {
        videoId: videoData.videoId,
        retryAttempt,
        error: err,
        mappedError: uiError,
      });

      await this.handleTranslationUiError(uiError);

      await this.videoHandler.updateTranslationErrorMsg(
        getTranslationServerErrorMessage(uiError) ?? uiError,
        signal,
      );

      // Most translation errors are handled inside the translation handler and
      // returned as `null` to the caller. This means higher-level try/catch
      // blocks won't see a rejected promise. Send the failure notification here
      // so users still get a desktop alert (respecting user settings).
      this.videoHandler.hadAsyncWait = notifyTranslationFailureIfNeeded({
        aborted: Boolean(
          this.videoHandler.actionsAbortController?.signal?.aborted,
        ),
        translateApiErrorsEnabled: Boolean(
          this.videoHandler.data?.translateAPIErrors,
        ),
        hadAsyncWait: this.videoHandler.hadAsyncWait,
        videoId: videoData.videoId,
        error: err,
        notify: (params) =>
          this.videoHandler.notifier.translationFailed(params),
      });
      return null;
    }

    this.videoHandler.hadAsyncWait = true;

    const retryDelayMs = this.getRetryDelayMs(
      retryAttempt,
      translationResponse?.remainingTime ?? null,
    );
    debug.log("[Translation] scheduling translation retry", {
      videoId: videoData.videoId,
      retryAttempt,
      retryDelayMs,
      remainingTime: translationResponse?.remainingTime,
    });

    return this.scheduleRetry(
      () =>
        this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          shouldSendFailedAudio,
          signal,
          {
            disableLivelyVoice: livelyDisabled,
            retryAttempt: retryAttempt + 1,
          },
        ),
      retryDelayMs,
      signal,
    );
  }

  stopTranslationEtaCountdown(): void {
    this.etaCountdown.stop();
  }

  private async requestTranslationWithLivelyFallback({
    videoData,
    requestLangForApi,
    responseLang,
    translationHelp,
    shouldSendFailedAudio,
    livelyDisabled,
    livelyVoiceAllowed,
  }: {
    videoData: VideoData;
    requestLangForApi: RequestLang;
    responseLang: ResponseLang;
    translationHelp: TranslationHelp[] | null;
    shouldSendFailedAudio: boolean;
    livelyDisabled: boolean;
    livelyVoiceAllowed: boolean;
  }): Promise<{
    response?: VideoTranslationResponse;
    useLivelyVoice: boolean;
    livelyDisabled: boolean;
  }> {
    let useLivelyVoice =
      !livelyDisabled &&
      livelyVoiceAllowed &&
      this.videoHandler.data?.useLivelyVoice !== false;

    debug.log("[Translation] requesting translation from VOT client", {
      videoId: videoData.videoId,
      requestLangForApi,
      responseLang,
      shouldSendFailedAudio,
      livelyDisabled,
      livelyVoiceAllowed,
      useLivelyVoice,
      translationHelpCount: translationHelp?.length ?? 0,
    });

    while (true) {
      try {
        debug.log("[Translation] votClient.translateVideo call", {
          videoId: videoData.videoId,
          requestLangForApi,
          responseLang,
          useLivelyVoice,
          shouldSendFailedAudio,
          translationHelpCount: translationHelp?.length ?? 0,
        });
        const response = await this.videoHandler.votClient.translateVideo({
          videoData,
          requestLang: requestLangForApi,
          responseLang,
          translationHelp,
          extraOpts: {
            useLivelyVoice,
            videoTitle: this.videoHandler.videoData?.title,
          },
          shouldSendFailedAudio,
        });

        if (!useLivelyVoice || !this.isLivelyVoiceUnavailableError(response)) {
          debug.log("[Translation] votClient.translateVideo resolved", {
            videoId: videoData.videoId,
            useLivelyVoice,
            ...summarizeTranslationResponse(response),
          });
          return { response, useLivelyVoice, livelyDisabled };
        }

        debug.warn("[Translation] lively voice unavailable in response", {
          videoId: videoData.videoId,
          useLivelyVoice,
          ...summarizeTranslationResponse(response),
        });
      } catch (err) {
        if (!useLivelyVoice || !this.isLivelyVoiceUnavailableError(err)) {
          throw err;
        }

        debug.warn("[Translation] lively voice unavailable in error", {
          videoId: videoData.videoId,
          useLivelyVoice,
          error: err,
        });
      }

      livelyDisabled = true;
      useLivelyVoice = false;
      debug.log("[Translation] retrying translation without lively voice", {
        videoId: videoData.videoId,
        requestLangForApi,
        responseLang,
      });
    }
  }

  private waitForAudioDownloadCompletion(
    signal: AbortSignal,
    timeoutMs: number,
  ): Promise<void> {
    if (!this.downloading) {
      return Promise.resolve();
    }

    const { promise, settle } = createAbortableWaiter(signal, timeoutMs);
    this.downloadSettlers.add(settle);
    return promise;
  }

  private settleDownloadWaiters(error?: Error) {
    if (!this.downloadSettlers.size) {
      return;
    }

    const settlers = Array.from(this.downloadSettlers);
    this.downloadSettlers.clear();
    for (const settle of settlers) {
      if (error) {
        settle.reject(error);
      } else {
        settle.resolve();
      }
    }
  }
}
