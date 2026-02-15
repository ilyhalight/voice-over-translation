import { clamp, downloadBlob } from "./utils";

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

function addTitleId3Tag(mp3Buffer: ArrayBufferLike, title: string): Blob {
  const titleBytes = new TextEncoder().encode(title);
  const frameData = new Uint8Array(titleBytes.length + 1);
  frameData[0] = 0x03; // UTF-8
  frameData.set(titleBytes, 1);

  const frame = new Uint8Array(10 + frameData.length);
  frame.set([0x54, 0x49, 0x54, 0x32], 0); // TIT2
  frame.set(toUint32BE(frameData.length), 4);
  frame.set(frameData, 10);

  const header = new Uint8Array(10);
  header.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00], 0); // ID3v2.3
  header.set(toSynchsafeInt(frame.length), 6);

  const audioBytes = new Uint8Array(mp3Buffer);
  const out = new Uint8Array(header.length + frame.length + audioBytes.length);
  out.set(header, 0);
  out.set(frame, header.length);
  out.set(audioBytes, header.length + frame.length);

  return new Blob([out], { type: "audio/mpeg" });
}

async function readResponseArrayBuffer(
  res: Response,
  onProgress: (progress: number) => void,
) {
  const total = Number(res.headers.get("Content-Length") ?? 0);

  if (!res.body) return res.arrayBuffer();

  const reader = res.body.getReader();
  let loaded = 0;

  // If Content-Length is known, preallocate to avoid a second pass and extra allocations.
  let out: Uint8Array | null = total > 0 ? new Uint8Array(total) : null;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || value.byteLength === 0) continue;

    if (out) {
      const needed = loaded + value.byteLength;
      if (needed > out.length) {
        const grown = new Uint8Array(Math.max(needed, out.length * 2));
        grown.set(out.subarray(0, loaded));
        out = grown;
      }
      out.set(value, loaded);
      loaded = needed;
    } else {
      chunks.push(value);
      loaded += value.byteLength;
    }

    if (total > 0) {
      onProgress(clamp(Math.round((loaded / total) * 100)));
    }
  }

  if (out) {
    return out.buffer.slice(0, loaded);
  }

  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }

  return merged.buffer;
}

/**
 * Downloads a translation file and saves it as an MP3 file with metadata,
 * tracking progress when Content-Length is available.
 */
export async function downloadTranslation(
  res: Response,
  filename: string,
  onProgress: (progress: number) => void = () => {},
) {
  const blob = await buildTranslationBlob(res, filename, onProgress);
  downloadBlob(blob, `${filename}.mp3`);
  return true;
}

export async function buildTranslationBlob(
  res: Response,
  filename: string,
  onProgress: (progress: number) => void = () => {},
): Promise<Blob> {
  const arrayBuffer = await readResponseArrayBuffer(res, onProgress);
  onProgress(100);

  return addTitleId3Tag(arrayBuffer, filename);
}
