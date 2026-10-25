import { clamp } from "./number";
import { type DownloadBlobOptions, downloadBlob } from "./utils";

function toUint32BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function toSynchsafeInt(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 21) & 0x7f,
    (value >>> 14) & 0x7f,
    (value >>> 7) & 0x7f,
    value & 0x7f,
  ]);
}

function createTitleId3Tag(title: string): Uint8Array {
  const titleBytes = new TextEncoder().encode(title);
  const frameData = new Uint8Array(titleBytes.length + 1);
  frameData[0] = 0x03; // UTF-8
  frameData.set(titleBytes, 1);

  const frame = new Uint8Array(10 + frameData.length);
  frame.set([0x54, 0x49, 0x54, 0x32], 0); // TIT2
  frame.set(toUint32BE(frameData.length), 4);
  frame.set(frameData, 10);

  const tag = new Uint8Array(10 + frame.length);
  tag.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00], 0); // ID3v2.3
  tag.set(toSynchsafeInt(frame.length), 6);
  tag.set(frame, 10);
  return tag;
}

async function readResponseChunks(
  res: Response,
  onProgress: (progress: number) => void,
): Promise<Uint8Array[]> {
  if (!res.body) return [];

  const total = Number(res.headers.get("Content-Length") ?? 0);
  // ReadableStream async iteration is unavailable in Chrome 106.
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;

    chunks.push(value);
    loaded += value.byteLength;
    if (total > 0) {
      onProgress(clamp(Math.round((loaded / total) * 100)));
    }
  }

  return chunks;
}

/**
 * Downloads a translation file and saves it as an MP3 file with metadata,
 * tracking progress when Content-Length is available.
 */
export async function downloadTranslation(
  res: Response,
  filename: string,
  onProgress: (progress: number) => void = () => {},
  saveOptions: DownloadBlobOptions = {},
) {
  const chunks = await readResponseChunks(res, onProgress);
  onProgress(100);

  const blob = new Blob([createTitleId3Tag(filename), ...chunks] as BlobPart[], {
    type: "audio/mpeg",
  });
  return await downloadBlob(blob, `${filename}.mp3`, saveOptions);
}
