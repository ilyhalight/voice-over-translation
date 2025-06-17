import { ChunkRange } from "../../../types/audioDownloader";
import { ACCEPTABLE_LENGTH_DIFF, MIN_ARRAY_BUFFER_LENGTH } from "../../shared";
import { textDecoder } from "./consts";

let mediaQuaryIndex = 1;

export function patchMediaUrl(
  url: string,
  { start, end }: { start: number; end: number },
) {
  const modifiedUrl = new URL(url);
  modifiedUrl.searchParams.set("range", `${start}-${end}`);
  modifiedUrl.searchParams.set("rn", String(mediaQuaryIndex++));
  modifiedUrl.searchParams.delete("ump");
  return modifiedUrl.toString();
}

export function isChunkLengthAcceptable(
  buffer: ArrayBuffer,
  { start, end }: ChunkRange,
) {
  const rangeLength = end - start;
  if (
    rangeLength > MIN_ARRAY_BUFFER_LENGTH &&
    buffer.byteLength < MIN_ARRAY_BUFFER_LENGTH
  ) {
    return false;
  }

  return (
    Math.min(rangeLength, buffer.byteLength) /
      Math.max(rangeLength, buffer.byteLength) >
    ACCEPTABLE_LENGTH_DIFF
  );
}

export const getUrlFromArrayBuffer = (
  buffer: ArrayBuffer,
): string | undefined => {
  return textDecoder.decode(buffer).match(/https:\/\/.*$/)?.[0];
};
