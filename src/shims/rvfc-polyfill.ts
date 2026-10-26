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

type VideoWithFrameCallbacks = HTMLVideoElement & {
  _rvfcpolyfillmap?: Record<number, number>;
  requestVideoFrameCallback?: (callback: RvfcCallback) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const VidProto =
  typeof HTMLVideoElement === "undefined"
    ? ({} as Partial<HTMLVideoElement>)
    : HTMLVideoElement.prototype;

const hasQuality = "getVideoPlaybackQuality" in VidProto;

if (
  !("requestVideoFrameCallback" in VidProto) &&
  hasQuality &&
  typeof requestAnimationFrame === "function"
) {
  (VidProto as VideoWithFrameCallbacks)._rvfcpolyfillmap = {};

  const getPlaybackQuality = (
    video: HTMLVideoElement,
  ): { presentedFrames: number } => {
    const quality = video.getVideoPlaybackQuality();
    return {
      presentedFrames: quality.totalVideoFrames - quality.droppedVideoFrames,
    };
  };

  VidProto.requestVideoFrameCallback = function (
    this: VideoWithFrameCallbacks,
    callback: RvfcCallback,
  ): number {
    const handle = performance.now();
    const quality = getPlaybackQuality(this);
    const baseline = quality.presentedFrames;

    const check = (old: number, now: number): void => {
      const newquality = getPlaybackQuality(this);
      const presentedFrames = newquality.presentedFrames;

      if (presentedFrames > baseline) {
        const timediff = now - old;

        callback(now, {
          presentationTime: now,
          expectedDisplayTime: now + timediff,
          width: this.videoWidth,
          height: this.videoHeight,
          mediaTime: Math.max(0, this.currentTime || 0) + timediff / 1000,
          presentedFrames,
          processingDuration: 0,
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
    this: VideoWithFrameCallbacks,
    handle: number,
  ): void {
    const rafHandle = this._rvfcpolyfillmap?.[handle];
    if (rafHandle != null) {
      cancelAnimationFrame(rafHandle);
      delete this._rvfcpolyfillmap[handle];
    }
  };
}
