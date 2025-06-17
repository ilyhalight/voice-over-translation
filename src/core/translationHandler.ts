import { VOTJSError } from "@vot.js/core/client";
import {
  StreamTranslationResponse,
  TranslatedStreamTranslationResponse,
  TranslatedVideoTranslationResponse,
  TranslationHelp,
  VideoTranslationStatus,
  WaitingStreamTranslationResponse,
} from "@vot.js/core/types/yandex";
import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import { VideoData, VideoHandler } from "..";
import { AudioDownloader } from "../audioDownloader";
import { localizationProvider } from "../localization/localizationProvider";
import debug from "../utils/debug";
import { secsToStrTime } from "../utils/localization";
import { waitForCondition } from "../utils/utils";
import { VOTLocalizedError } from "../utils/VOTLocalizedError";

export class VOTTranslationHandler {
  videoHandler: VideoHandler;
  audioDownloader: AudioDownloader;
  downloading: boolean;

  constructor(videoHandler: VideoHandler) {
    this.videoHandler = videoHandler;
    this.audioDownloader = new AudioDownloader();
    this.downloading = false;
    this.audioDownloader
      .addEventListener("downloadedAudio", async (translationId, data) => {
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
        this.downloading = false;
      })
      .addEventListener(
        "downloadedPartialAudio",
        async (translationId, data) => {
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
            this.downloading = false;
          }

          if (index === amount - 1) {
            this.downloading = false;
          }
        },
      )
      .addEventListener("downloadAudioError", async (videoId) => {
        if (!this.downloading) {
          debug.log("skip downloadAudioError");
          return;
        }

        debug.log(`Failed to download audio ${videoId}`);
        const videoUrl = this.getCanonicalUrl(videoId);
        await this.videoHandler.votClient.requestVtransFailAudio(videoUrl);
        this.downloading = false;
      });
  }

  private getCanonicalUrl(videoId: string) {
    // i guess hardcoded > videoData.url (in this case)
    return `https://youtu.be/${videoId}`;
  }

  private isWaitingStreamRes(
    data: StreamTranslationResponse,
  ): data is WaitingStreamTranslationResponse {
    return !!(data as WaitingStreamTranslationResponse).message;
  }

  async translateVideoImpl(
    videoData: VideoData,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    translationHelp: TranslationHelp[] | null = null,
    shouldSendFailedAudio = false,
    signal = new AbortController().signal,
  ): Promise<TranslatedVideoTranslationResponse | null> {
    clearTimeout(this.videoHandler.autoRetry);
    this.downloading = false;
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      if (signal.aborted) {
        throw new Error("AbortError");
      }

      const useLivelyVoice =
        this.videoHandler.isLivelyVoiceAllowed() &&
        this.videoHandler.data?.useLivelyVoice;
      const res = await this.videoHandler.votClient.translateVideo({
        videoData,
        requestLang,
        responseLang,
        translationHelp,
        extraOpts: {
          useLivelyVoice,
          videoTitle: this.videoHandler.videoData?.title,
        },
        shouldSendFailedAudio,
      });
      debug.log("Translate video result", res);
      if (signal.aborted) {
        throw new Error("AbortError");
      }

      if (res.translated && res.remainingTime < 1) {
        debug.log("Video translation finished with this data: ", res);
        return res;
      }

      const message =
        res.message ?? localizationProvider.get("translationTakeFewMinutes");
      await this.videoHandler.updateTranslationErrorMsg(
        res.remainingTime > 0 ? secsToStrTime(res.remainingTime) : message,
      );

      if (
        res.status === VideoTranslationStatus.AUDIO_REQUESTED &&
        this.videoHandler.isYouTubeHosts()
      ) {
        debug.log("Start audio download");
        this.downloading = true;
        await this.audioDownloader.runAudioDownload(
          videoData.videoId,
          res.translationId,
          signal,
        );

        debug.log("waiting downloading finish");
        // 15000 is fetch timeout, so there's no point in waiting longer
        await waitForCondition(
          () => !this.downloading || signal.aborted,
          15000,
        );
        if (signal.aborted) {
          debug.log("aborted after audio downloader vtrans");
          throw new Error("AbortError");
        }

        // for get instant result on download end
        return await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
          true,
          signal,
        );
      }
    } catch (err) {
      if ((err as Error).message === "AbortError") {
        debug.log("aborted video translation");
        return null;
      }

      await this.videoHandler.updateTranslationErrorMsg(
        (err as any).data?.message ?? err,
      );
      console.error("[VOT]", err);
      const cacheKey = `${videoData.videoId}_${requestLang}_${responseLang}_${this.videoHandler.data?.useLivelyVoice}`;
      this.videoHandler.cacheManager.setTranslation(cacheKey, {
        error: err as VOTJSError,
      });
      return null;
    }
    return new Promise((resolve) => {
      this.videoHandler.autoRetry = setTimeout(async () => {
        resolve(
          await this.translateVideoImpl(
            videoData,
            requestLang,
            responseLang,
            translationHelp,
            true,
            signal,
          ),
        );
      }, 20000);
    });
  }

  async translateStreamImpl(
    videoData: VideoData,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    signal = new AbortController().signal,
  ): Promise<TranslatedStreamTranslationResponse | null> {
    clearTimeout(this.videoHandler.autoRetry);
    debug.log(
      videoData,
      `Translate stream (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      if (signal.aborted) {
        throw new Error("AbortError");
      }

      const res = await this.videoHandler.votClient.translateStream({
        videoData,
        requestLang,
        responseLang,
      });

      if (signal.aborted) {
        throw new Error("AbortError");
      }

      debug.log("Translate stream result", res);
      if (!res.translated && res.interval === 10) {
        await this.videoHandler.updateTranslationErrorMsg(
          localizationProvider.get("translationTakeFewMinutes"),
        );
        return new Promise((resolve) => {
          this.videoHandler.autoRetry = setTimeout(async () => {
            resolve(
              await this.translateStreamImpl(
                videoData,
                requestLang,
                responseLang,
                signal,
              ),
            );
          }, res.interval * 1000);
        });
      }
      if (this.isWaitingStreamRes(res)) {
        debug.log(`Stream translation aborted! Message: ${res.message}`);
        throw new VOTLocalizedError("streamNoConnectionToServer");
      }

      if (!res.result) {
        debug.log("Failed to find translation result! Data:", res);
        throw new VOTLocalizedError("audioNotReceived");
      }

      debug.log("Stream translated successfully. Running...", res);
      this.videoHandler.streamPing = setInterval(async () => {
        debug.log("Ping stream translation", res.pingId);
        this.videoHandler.votClient.pingStream({
          pingId: res.pingId,
        });
      }, res.interval * 1000);
      return res;
    } catch (err) {
      if ((err as Error).message === "AbortError") {
        debug.log("aborted stream translation");
        return null;
      }

      console.error("[VOT] Failed to translate stream", err);
      await this.videoHandler.updateTranslationErrorMsg(
        (err as any).data?.message ?? err,
      );
      return null;
    }
  }
}
