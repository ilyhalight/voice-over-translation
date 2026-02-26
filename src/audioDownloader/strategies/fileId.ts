import type { AudioDownloadType } from "@vot.js/core/types/yandex";

export function makeFileId(
  downloadType: AudioDownloadType,
  itag: number,
  fileSize: string,
  minChunkSize: number,
) {
  return JSON.stringify({
    downloadType,
    itag,
    minChunkSize,
    fileSize,
  });
}
