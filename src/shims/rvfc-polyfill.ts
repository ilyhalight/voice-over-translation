export {};

type RvfcMetadata = {
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration: number;
};

type RvfcCallback = (now: number, metadata: RvfcMetadata) => void;

type PlaybackQualityWithDelay = VideoPlaybackQuality & {
  totalFrameDelay?: number;
};

type VideoWithLegacyQuality = HTMLVideoElement & {
  mozPresentedFrames?: number;
  mozPaintedFrames?: number;
  webkitDecodedFrameCount?: number;
  webkitDroppedFrameCount?: number;
  mozFrameDelay?: number;
  _rvfcpolyfillmap?: Record<number, number>;
  requestVideoFrameCallback?: (callback: RvfcCallback) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const VidProto =
  typeof HTMLVideoElement === "undefined"
    ? ({} as Partial<HTMLVideoElement>)
    : HTMLVideoElement.prototype;

const hasQuality =
  "getVideoPlaybackQuality" in VidProto ||
  "webkitDecodedFrameCount" in VidProto ||
  "mozPresentedFrames" in VidProto ||
  "mozPaintedFrames" in VidProto;

if (
  !("requestVideoFrameCallback" in VidProto) &&
  hasQuality &&
  typeof requestAnimationFrame === "function"
) {
  (VidProto as VideoWithLegacyQuality)._rvfcpolyfillmap = {};

  const getPlaybackQuality =
    "getVideoPlaybackQuality" in VidProto
      ? (
          video: HTMLVideoElement,
        ): { presentedFrames: number; totalFrameDelay: number } => {
          const quality =
            video.getVideoPlaybackQuality() as PlaybackQualityWithDelay;
          const totalFrameDelay = quality.totalFrameDelay ?? 0;

          return {
            presentedFrames:
              quality.totalVideoFrames - quality.droppedVideoFrames,
            totalFrameDelay,
          };
        }
      : (
          video: VideoWithLegacyQuality,
        ): { presentedFrames: number; totalFrameDelay: number } => ({
          presentedFrames:
            video.mozPresentedFrames ??
            video.mozPaintedFrames ??
            (video.webkitDecodedFrameCount || 0) -
              (video.webkitDroppedFrameCount || 0),
          totalFrameDelay: video.mozFrameDelay || 0,
        });

  VidProto.requestVideoFrameCallback = function (
    this: VideoWithLegacyQuality,
    callback: RvfcCallback,
  ): number {
    const handle = performance.now();
    const quality = getPlaybackQuality(this);
    const baseline = quality.presentedFrames;

    const check = (old: number, now: number): void => {
      const newquality = getPlaybackQuality(this);
      const presentedFrames = newquality.presentedFrames;

      if (presentedFrames > baseline) {
        const processingDuration =
          newquality.totalFrameDelay - quality.totalFrameDelay || 0;
        const timediff = now - old;

        callback(now, {
          presentationTime: now + processingDuration * 1000,
          expectedDisplayTime: now + timediff,
          width: this.videoWidth,
          height: this.videoHeight,
          mediaTime: Math.max(0, this.currentTime || 0) + timediff / 1000,
          presentedFrames,
          processingDuration,
        });

        delete this._rvfcpolyfillmap?.[handle];
      } else {
        this._rvfcpolyfillmap ??= {};
        this._rvfcpolyfillmap[handle] = requestAnimationFrame((newer) =>
          check(now, newer),
        );
      }
    };

    this._rvfcpolyfillmap ??= {};
    this._rvfcpolyfillmap[handle] = requestAnimationFrame((newer) =>
      check(handle, newer),
    );

    return handle;
  };

  VidProto.cancelVideoFrameCallback = function (
    this: VideoWithLegacyQuality,
    handle: number,
  ): void {
    const rafHandle = this._rvfcpolyfillmap?.[handle];
    if (rafHandle != null) {
      cancelAnimationFrame(rafHandle);
      delete this._rvfcpolyfillmap[handle];
    }
  };
}
