export function notifyTranslationFailureIfNeeded(options: {
  aborted: boolean;
  translateApiErrorsEnabled: boolean;
  hadAsyncWait: boolean;
  videoId?: string;
  error: unknown;
  notify(params: { videoId?: string; message?: unknown }): void;
}): boolean {
  if (options.aborted) {
    return false;
  }

  if (!options.translateApiErrorsEnabled || !options.hadAsyncWait) {
    return options.hadAsyncWait;
  }

  options.notify({
    videoId: options.videoId,
    message: options.error,
  });
  return false;
}
