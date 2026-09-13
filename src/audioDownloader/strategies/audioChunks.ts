export type AudioChunk = {
  buffer: Uint8Array;
  isLastChunk: boolean;
};

export function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  // The common case is a single buffer: copying it again would double the
  // memory traffic of every chunk for nothing.
  if (buffers.length === 1) return buffers[0];
  const result = new Uint8Array(
    buffers.reduce((length, buffer) => length + buffer.byteLength, 0),
  );
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.byteLength;
  }
  return result;
}
