interface AudioChunkSink {
  write(chunk: Uint8Array): Promise<void>;
}

interface AacExtractionOptions {
  codecHint?: string;
  sampleRateHint?: number;
  channelsHint?: number;
}

interface AacExtractionResult {
  codec: string;
  sampleRate: number;
  channels: number;
  bytesWritten: number;
}

interface Box {
  type: string;
  start: number;
  size: number;
  end: number;
  payloadStart: number;
  payloadEnd: number;
}

interface StscEntry {
  firstChunk: number;
  samplesPerChunk: number;
}

interface AudioTrackTables {
  sampleSizes: number[];
  chunkOffsets: number[];
  sampleToChunk: StscEntry[];
}

interface AdtsConfig {
  profile: number;
  sampleRateIndex: number;
  channelConfig: number;
}

const AAC_SAMPLE_RATES = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
  8000, 7350,
] as const;

function readUint64(view: DataView, offset: number): number {
  const high = view.getUint32(offset, false);
  const low = view.getUint32(offset + 4, false);
  const value = high * 2 ** 32 + low;
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(
      "Encountered 64-bit MP4 offset larger than Number.MAX_SAFE_INTEGER",
    );
  }
  return value;
}

function readBox(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
): Box | null {
  if (start + 8 > end) {
    return null;
  }

  let size = view.getUint32(start, false);
  const type = String.fromCodePoint(
    bytes[start + 4] ?? 0,
    bytes[start + 5] ?? 0,
    bytes[start + 6] ?? 0,
    bytes[start + 7] ?? 0,
  );
  let headerSize = 8;

  if (size === 1) {
    if (start + 16 > end) {
      return null;
    }
    size = readUint64(view, start + 8);
    headerSize = 16;
  } else if (size === 0) {
    size = end - start;
  }

  if (size < headerSize || start + size > end) {
    return null;
  }

  return {
    type,
    start,
    size,
    end: start + size,
    payloadStart: start + headerSize,
    payloadEnd: start + size,
  };
}

function listChildBoxes(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
): Box[] {
  const result: Box[] = [];
  let offset = start;

  while (offset + 8 <= end) {
    const box = readBox(bytes, view, offset, end);
    if (!box) {
      break;
    }
    result.push(box);
    offset = box.end;
  }

  return result;
}

function findChildBox(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
  type: string,
): Box | null {
  const type0 = type.codePointAt(0) ?? 0;
  const type1 = type.codePointAt(1) ?? 0;
  const type2 = type.codePointAt(2) ?? 0;
  const type3 = type.codePointAt(3) ?? 0;
  const isComparableType = type.length === 4;

  let offset = start;
  while (offset + 8 <= end) {
    let boxSize = view.getUint32(offset, false);
    let headerSize = 8;

    if (boxSize === 1) {
      if (offset + 16 > end) {
        return null;
      }
      boxSize = readUint64(view, offset + 8);
      headerSize = 16;
    } else if (boxSize === 0) {
      boxSize = end - offset;
    }

    const boxEnd = offset + boxSize;
    if (boxSize < headerSize || boxEnd > end) {
      return null;
    }

    if (
      isComparableType &&
      bytes[offset + 4] === type0 &&
      bytes[offset + 5] === type1 &&
      bytes[offset + 6] === type2 &&
      bytes[offset + 7] === type3
    ) {
      return {
        type,
        start: offset,
        size: boxSize,
        end: boxEnd,
        payloadStart: offset + headerSize,
        payloadEnd: boxEnd,
      };
    }

    offset = boxEnd;
  }
  return null;
}

function findBoxPath(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
  path: string[],
): Box | null {
  let currentStart = start;
  let currentEnd = end;
  let current: Box | null = null;

  for (const step of path) {
    current = findChildBox(bytes, view, currentStart, currentEnd, step);
    if (!current) {
      return null;
    }
    currentStart = current.payloadStart;
    currentEnd = current.payloadEnd;
  }

  return current;
}

function parseStsz(view: DataView, box: Box): number[] {
  let offset = box.payloadStart;
  offset += 4; // version + flags

  const sampleSize = view.getUint32(offset, false);
  offset += 4;

  const sampleCount = view.getUint32(offset, false);
  offset += 4;

  if (sampleSize !== 0) {
    return new Array(sampleCount).fill(sampleSize);
  }

  const sampleSizes = new Array<number>(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    sampleSizes[i] = view.getUint32(offset, false);
    offset += 4;
  }
  return sampleSizes;
}

function parseStsc(view: DataView, box: Box): StscEntry[] {
  let offset = box.payloadStart;
  offset += 4; // version + flags

  const entryCount = view.getUint32(offset, false);
  offset += 4;

  const entries = new Array<StscEntry>(entryCount);
  for (let i = 0; i < entryCount; i++) {
    entries[i] = {
      firstChunk: view.getUint32(offset, false),
      samplesPerChunk: view.getUint32(offset + 4, false),
    };
    offset += 12;
  }
  return entries;
}

function parseChunkOffsets(view: DataView, box: Box): number[] {
  let offset = box.payloadStart;
  offset += 4; // version + flags

  const entryCount = view.getUint32(offset, false);
  offset += 4;

  const offsets: number[] = new Array<number>(entryCount);

  if (box.type === "co64") {
    for (let i = 0; i < entryCount; i++) {
      offsets[i] = readUint64(view, offset);
      offset += 8;
    }
    return offsets;
  }

  for (let i = 0; i < entryCount; i++) {
    offsets[i] = view.getUint32(offset, false);
    offset += 4;
  }
  return offsets;
}

function getAudioTrackTables(
  bytes: Uint8Array,
  view: DataView,
): AudioTrackTables {
  const moov = findChildBox(bytes, view, 0, bytes.byteLength, "moov");
  if (!moov) {
    throw new Error("MP4 does not contain moov box");
  }

  const traks = listChildBoxes(
    bytes,
    view,
    moov.payloadStart,
    moov.payloadEnd,
  ).filter((box) => box.type === "trak");
  let audioTrak: Box | null = null;

  for (const trak of traks) {
    const hdlr = findBoxPath(bytes, view, trak.payloadStart, trak.payloadEnd, [
      "mdia",
      "hdlr",
    ]);
    if (!hdlr) {
      continue;
    }
    if (hdlr.payloadStart + 12 > hdlr.payloadEnd) {
      continue;
    }
    const handlerType = String.fromCodePoint(
      bytes[hdlr.payloadStart + 8] ?? 0,
      bytes[hdlr.payloadStart + 9] ?? 0,
      bytes[hdlr.payloadStart + 10] ?? 0,
      bytes[hdlr.payloadStart + 11] ?? 0,
    );
    if (handlerType === "soun") {
      audioTrak = trak;
      break;
    }
  }

  if (!audioTrak) {
    throw new Error("Failed to locate audio track in MP4");
  }

  const stbl = findBoxPath(
    bytes,
    view,
    audioTrak.payloadStart,
    audioTrak.payloadEnd,
    ["mdia", "minf", "stbl"],
  );
  if (!stbl) {
    throw new Error("Audio track is missing stbl box");
  }

  const stblChildren = listChildBoxes(
    bytes,
    view,
    stbl.payloadStart,
    stbl.payloadEnd,
  );

  let stsz: Box | null = null;
  let stsc: Box | null = null;
  let stco: Box | null = null;
  let co64: Box | null = null;

  for (const child of stblChildren) {
    if (!stsz && child.type === "stsz") {
      stsz = child;
    } else if (!stsc && child.type === "stsc") {
      stsc = child;
    } else if (!stco && child.type === "stco") {
      stco = child;
    } else if (!co64 && child.type === "co64") {
      co64 = child;
    }
  }

  const chunkOffsetBox = stco ?? co64;

  if (!stsz || !stsc || !chunkOffsetBox) {
    throw new Error("Audio track is missing one of stsz/stsc/stco/co64 tables");
  }

  return {
    sampleSizes: parseStsz(view, stsz),
    sampleToChunk: parseStsc(view, stsc),
    chunkOffsets: parseChunkOffsets(view, chunkOffsetBox),
  };
}

function parseAacObjectType(codec: string): number {
  const match = /mp4a\.40\.(\d+)/i.exec(codec);
  const value = match?.[1] ? Number.parseInt(match[1], 10) : 2;
  return Number.isFinite(value) && value > 0 ? value : 2;
}

function sampleRateToAdtsIndex(sampleRate: number): number {
  const idx = (AAC_SAMPLE_RATES as readonly number[]).indexOf(sampleRate);
  if (idx >= 0) {
    return idx;
  }
  return 4;
}

function buildAdtsConfig(
  aacObjectType: number,
  sampleRate: number,
  channels: number,
): AdtsConfig {
  return {
    profile: Math.max(0, Math.min(3, aacObjectType - 1)),
    sampleRateIndex: sampleRateToAdtsIndex(sampleRate),
    channelConfig: Math.max(1, Math.min(7, channels)),
  };
}

function buildAdtsHeader(frameLength: number, config: AdtsConfig): Uint8Array {
  const header = new Uint8Array(7);
  const adtsFrameLength = frameLength + 7;

  header[0] = 0xff;
  header[1] = 0xf1;
  header[2] =
    ((config.profile & 0x03) << 6) |
    ((config.sampleRateIndex & 0x0f) << 2) |
    ((config.channelConfig >> 2) & 0x01);
  header[3] =
    ((config.channelConfig & 0x03) << 6) | ((adtsFrameLength >> 11) & 0x03);
  header[4] = (adtsFrameLength >> 3) & 0xff;
  header[5] = ((adtsFrameLength & 0x07) << 5) | 0x1f;
  header[6] = 0xfc;

  return header;
}

export async function extractAacFromMp4(
  mp4Bytes: Uint8Array,
  sink: AudioChunkSink,
  options: AacExtractionOptions = {},
): Promise<AacExtractionResult> {
  const view = new DataView(
    mp4Bytes.buffer,
    mp4Bytes.byteOffset,
    mp4Bytes.byteLength,
  );
  const { sampleSizes, sampleToChunk, chunkOffsets } = getAudioTrackTables(
    mp4Bytes,
    view,
  );

  const codec = options.codecHint ?? "mp4a.40.2";
  const sampleRate = options.sampleRateHint ?? 44100;
  const channels = options.channelsHint ?? 2;
  const aacObjectType = parseAacObjectType(codec);
  const adtsConfig = buildAdtsConfig(aacObjectType, sampleRate, channels);

  let sampleIndex = 0;
  let stscIndex = 0;
  let bytesWritten = 0;

  for (let chunkIndex = 1; chunkIndex <= chunkOffsets.length; chunkIndex++) {
    while (
      stscIndex + 1 < sampleToChunk.length &&
      chunkIndex >=
        (sampleToChunk[stscIndex + 1]?.firstChunk ?? Number.POSITIVE_INFINITY)
    ) {
      stscIndex++;
    }

    const chunkRule = sampleToChunk[stscIndex];
    if (!chunkRule) {
      throw new Error("stsc table lookup failed for current chunk index");
    }

    const chunkOffsetValue = chunkOffsets[chunkIndex - 1];
    if (typeof chunkOffsetValue !== "number") {
      throw new TypeError(
        "Chunk offset table lookup failed for current chunk index",
      );
    }
    let chunkOffset = chunkOffsetValue;

    for (
      let i = 0;
      i < chunkRule.samplesPerChunk && sampleIndex < sampleSizes.length;
      i++
    ) {
      const sampleSize = sampleSizes[sampleIndex++];
      if (typeof sampleSize !== "number") {
        throw new TypeError(
          "Sample size table lookup failed for current sample index",
        );
      }
      const sampleEnd: number = chunkOffset + sampleSize;

      if (sampleEnd > mp4Bytes.byteLength) {
        throw new Error("MP4 sample offset points outside file boundaries");
      }

      const adtsHeader = buildAdtsHeader(sampleSize, adtsConfig);
      const sampleBytes = mp4Bytes.subarray(chunkOffset, sampleEnd);

      await sink.write(adtsHeader);
      await sink.write(sampleBytes);

      bytesWritten += adtsHeader.byteLength + sampleBytes.byteLength;
      chunkOffset = sampleEnd;
    }
  }

  if (sampleIndex !== sampleSizes.length) {
    throw new Error("MP4 audio sample table traversal ended prematurely");
  }

  return {
    codec,
    sampleRate,
    channels,
    bytesWritten,
  };
}
