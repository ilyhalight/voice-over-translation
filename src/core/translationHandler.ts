import {
  type TranslatedVideoTranslationResponse,
  type TranslationHelp,
  type VideoTranslationResponse,
  VideoTranslationStatus,
} from "@vot.js/core/types/yandex";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import type { VideoData, VideoHandler } from "..";
import { AudioDownloader } from "../audioDownloader";
import { localizationProvider } from "../localization/localizationProvider";
import type {
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import { throwIfAborted } from "../utils/abort";
import debug from "../utils/debug";
import { getErrorMessage, isAbortError, makeAbortError } from "../utils/errors";
import { formatTranslationEta } from "../utils/timeFormatting";
import VOTLocalizedError from "../utils/VOTLocalizedError";
import { notifyTranslationFailureIfNeeded } from "../videoHandler/modules/translationShared";

type VotClientErrorShape = {
  name?: unknown;
  message?: unknown;
  data?: {
    message?: unknown;
  };
};

function asVotClientErrorShape(value: unknown): VotClientErrorShape | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    name?: unknown;
    message?: unknown;
    data?: unknown;
  };
  const data =
    candidate.data && typeof candidate.data === "object"
      ? (candidate.data as { message?: unknown })
      : undefined;

  return {
    name: candidate.name,
    message: candidate.message,
    data,
  };
}

function getServerErrorMessage(value: unknown): string | undefined {
  const err = asVotClientErrorShape(value);
  const message = err?.data?.message;
  return typeof message === "string" && message.length > 0
    ? message
    : undefined;
}

/**
 * Historically we used `patch-package` to make `@vot.js/core` throw
 * `VOTLocalizedError` for a few common failure cases.
 *
 * We now keep the dependency unpatched and instead map known error messages
 * coming from the VOT client to the corresponding localized UI errors.
 */
function mapVotClientErrorForUi(error: unknown): unknown {
  const err = asVotClientErrorShape(error);
  if (!err) {
    return error;
  }
  if (err.name !== "VOTJSError") {
    return error;
  }

  const message = typeof err.message === "string" ? err.message : "";
  const hasServerMessage =
    typeof err.data?.message === "string" && err.data.message.length > 0;

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

type DownloadWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

export class VOTTranslationHandler {
  readonly videoHandler: VideoHandler;
  readonly audioDownloader: AudioDownloader;
  downloading: boolean;
  private readonly downloadWaiters = new Set<DownloadWaiter>();

  // Avoid spamming the fail-audio-js fallback for the same video URL.
  // In normal operation we should extract the audio request from the iframe.
  private readonly requestedFailAudio = new Set<string>();

  constructor(videoHandler: VideoHandler) {
    this.videoHandler = videoHandler;
    this.audioDownloader = new AudioDownloader();
    this.downloading = false;

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
      await this.videoHandler.votClient.requestVtransAudio(
        videoUrl,
        translationId,
        {
          audioFile: audioData,
          fileId,
        },
      );
    } catch {
      /* empty */
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
      await this.videoHandler.votClient.requestVtransAudio(
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
      );
    } catch {
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
    this.resolveDownloadWaiters();
  }

  private finishDownloadFailure(error: Error) {
    this.downloading = false;
    this.rejectDownloadWaiters(error);
  }

  private getCanonicalUrl(videoId: string) {
    return `https://youtu.be/${videoId}`;
  }

  // Cancellation helpers live in utils/abort.ts.

  /**
   * Detector for cases when server rejects the request because
   * "Lively/Live voices" are unavailable (unsupported language pair).
   */
  private isLivelyVoiceUnavailableError(value: unknown): boolean {
    const msg = getErrorMessage(value);
    return !!msg && msg.toLowerCase().includes("обычная озвучка");
  }

  private scheduleRetry<T>(
    fn: () => Promise<T>,
    delayMs: number,
    signal: AbortSignal,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Avoid a micro-race where the signal gets aborted between checking
      // `signal.aborted` and attaching the abort listener.
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        signal.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        reject(makeAbortError());
      };

      // Attach the listener first, then check `aborted` to close the race.
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
        return;
      }

      timeoutId = setTimeout(async () => {
        if (signal.aborted) {
          onAbort();
          return;
        }
        cleanup();
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);

      // Keep old behavior: allow caller to clear retries via the host.
      if (timeoutId !== null) {
        this.videoHandler.autoRetry = timeoutId;
      }
    });
  }

  async translateVideoImpl(
    videoData: VideoData,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    translationHelp: TranslationHelp[] | null = null,
    shouldSendFailedAudio = false,
    signal = new AbortController().signal,
    disableLivelyVoice = false,
  ): Promise<
    (TranslatedVideoTranslationResponse & { usedLivelyVoice: boolean }) | null
  > {
    clearTimeout(this.videoHandler.autoRetry);
    this.finishDownloadSuccess();
    const requestLangForApi = this.videoHandler.getRequestLangForTranslation(
      requestLang,
      responseLang,
    );
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, requestLangForApi: ${requestLangForApi}, responseLang: ${responseLang})`,
    );

    let livelyDisabled = disableLivelyVoice;

    try {
      throwIfAborted(signal);

      const livelyVoiceAllowed = this.videoHandler.isLivelyVoiceAllowed(
        requestLangForApi,
        responseLang,
      );
      let useLivelyVoice =
        !livelyDisabled &&
        livelyVoiceAllowed &&
        Boolean(this.videoHandler.data?.useLivelyVoice);

      let res: VideoTranslationResponse | undefined;

      // If server says lively voices are unavailable, immediately retry once
      // without lively voices and keep that choice for subsequent retries.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await this.videoHandler.votClient.translateVideo({
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
        } catch (err) {
          if (useLivelyVoice && this.isLivelyVoiceUnavailableError(err)) {
            debug.log(
              "[translateVideoImpl] Lively voices are unavailable. Falling back to standard translation.",
              err,
            );
            livelyDisabled = true;
            useLivelyVoice = false;
            continue;
          }
          throw err;
        }

        if (useLivelyVoice && this.isLivelyVoiceUnavailableError(res)) {
          debug.log(
            "[translateVideoImpl] Server responded that lively voices are unavailable. Falling back to standard translation.",
            res,
          );
          livelyDisabled = true;
          useLivelyVoice = false;
          res = undefined;
          continue;
        }
        break;
      }

      if (!res) {
        throw new Error("Failed to get translation response");
      }

      debug.log("Translate video result", res);
      throwIfAborted(signal);

      if (res.translated && res.remainingTime < 1) {
        debug.log("Video translation finished with this data: ", res);
        return { ...res, usedLivelyVoice: useLivelyVoice };
      }

      const message =
        res.message ?? localizationProvider.get("translationTakeFewMinutes");
      await this.videoHandler.updateTranslationErrorMsg(
        res.remainingTime > 0
          ? formatTranslationEta(
              res.remainingTime,
              // The formatter expects a small set of keys; those keys exist in our phrase set.
              (key) => localizationProvider.get(key),
            )
          : message,
        signal,
      );

      if (
        res.status === VideoTranslationStatus.AUDIO_REQUESTED &&
        this.videoHandler.isYouTubeHosts()
      ) {
        this.videoHandler.hadAsyncWait = true;

        debug.log("Start audio download");
        this.downloading = true;

        await this.audioDownloader.runAudioDownload(
          videoData.videoId,
          res.translationId,
          signal,
        );

        debug.log("waiting downloading finish");
        // 15000 is fetch timeout, so there's no point in waiting longer
        await this.waitForAudioDownloadCompletion(signal, 15000);

        // for get instant result on download end
        return await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          true,
          signal,
          livelyDisabled,
        );
      }
    } catch (err) {
      if (isAbortError(err)) {
        debug.log("aborted video translation");
        return null;
      }

      const uiError = mapVotClientErrorForUi(err);

      await this.videoHandler.updateTranslationErrorMsg(
        getServerErrorMessage(uiError) ?? uiError,
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
      console.error("[VOT]", err);
      return null;
    }

    this.videoHandler.hadAsyncWait = true;

    return this.scheduleRetry(
      () =>
        this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          shouldSendFailedAudio,
          signal,
          livelyDisabled,
        ),
      20000,
      signal,
    );
  }

  private waitForAudioDownloadCompletion(
    signal: AbortSignal,
    timeoutMs: number,
  ): Promise<void> {
    if (!this.downloading) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      let entry!: DownloadWaiter;

      const onAbort = () => {
        cleanup();
        reject(makeAbortError());
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", onAbort);
        this.downloadWaiters.delete(entry);
      };

      entry = {
        resolve: () => {
          cleanup();
          resolve();
        },
        reject: (error: Error) => {
          cleanup();
          reject(error);
        },
      };

      this.downloadWaiters.add(entry);

      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  private resolveDownloadWaiters() {
    this.forEachDownloadWaiter((waiter) => waiter.resolve());
  }

  private rejectDownloadWaiters(error: Error) {
    this.forEachDownloadWaiter((waiter) => waiter.reject(error));
  }

  private forEachDownloadWaiter(handler: (waiter: DownloadWaiter) => void) {
    if (!this.downloadWaiters.size) {
      return;
    }

    const waiters = Array.from(this.downloadWaiters);
    this.downloadWaiters.clear();
    for (const waiter of waiters) {
      handler(waiter);
    }
  }
}
