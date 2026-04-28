import type { SubtitlesData } from "@vot.js/shared/types/subs";
import type {
  AssCueMetadata,
  AssDocumentMetadata,
  ProcessedSubtitles,
  SubtitleFormat,
  SubtitleLine,
  WebVttCueMetadata,
  WebVttDocumentBlock,
  WebVttDocumentMetadata,
} from "../types/subtitles";
import { buildStyledDisplayModel } from "./displayModel";

const BOM = "\uFEFF";
const ASS_OVERRIDE_TAG_RE = /\{[^}]*\}/gu;
const SRT_TIMING_RE =
  /^\s*(?<start>\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(?<end>\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*$/u;
const VTT_TIMING_RE =
  /^(?<start>(?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+(?<end>(?:\d{2}:)?\d{2}:\d{2}\.\d{3})(?<settings>(?:[ \t]+.+)?)$/u;

type TimedCueDraft = {
  index: number;
  line: SubtitleLine;
};

export type SubtitleSerializeOptions = {
  assTitle?: string;
};

type StyledCueMetadata = NonNullable<SubtitleLine["metadata"]>;

const normalizeNewlines = (value: string): string =>
  value.replace(BOM, "").replaceAll(/\r\n?/gu, "\n");

const padMilliseconds = (value: string): string =>
  value.length >= 3 ? value.slice(0, 3) : value.padEnd(3, "0");

const parseClockTime = (
  value: string,
  millisecondsLength: number,
): number | null => {
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const normalizedParts = parts.length === 2 ? ["00", ...parts] : parts;
  const [hoursRaw, minutesRaw, secondsRaw] = normalizedParts;
  const [secondsPart, millisecondsPart = "0"] = secondsRaw.split(/[.,]/u);

  if (
    !/^\d+$/u.test(hoursRaw) ||
    !/^\d{2}$/u.test(minutesRaw) ||
    !/^\d{2}$/u.test(secondsPart) ||
    !/^\d+$/u.test(millisecondsPart)
  ) {
    return null;
  }

  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  const seconds = Number(secondsPart);
  const milliseconds = Number(
    padMilliseconds(millisecondsPart).slice(0, millisecondsLength),
  );

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
};

const formatClockTime = (
  totalMs: number,
  {
    delimiter,
    allowOptionalHours,
    fractionDigits,
  }: {
    delimiter: "," | ".";
    allowOptionalHours: boolean;
    fractionDigits: number;
  },
): string => {
  const { hours, minutes, seconds, milliseconds } = splitTimestampParts(
    totalMs,
    Math.round,
  );
  const fraction = milliseconds
    .toString()
    .padStart(3, "0")
    .slice(0, fractionDigits);

  const hourPart =
    allowOptionalHours && hours === 0
      ? ""
      : `${hours.toString().padStart(2, "0")}:`;

  return `${hourPart}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}${delimiter}${fraction}`;
};

const splitTimestampParts = (
  totalMs: number,
  normalizeMs: (value: number) => number,
): {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
} => {
  const safeMs = Math.max(0, normalizeMs(totalMs));
  return {
    hours: Math.floor(safeMs / 3_600_000),
    minutes: Math.floor((safeMs % 3_600_000) / 60_000),
    seconds: Math.floor((safeMs % 60_000) / 1000),
    milliseconds: safeMs % 1000,
  };
};

const formatAssTime = (totalMs: number): string => {
  const { hours, minutes, seconds, milliseconds } = splitTimestampParts(
    totalMs,
    Math.round,
  );
  const centiseconds = Math.floor(milliseconds / 10);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
};

const parseAssTime = (value: string): number | null => {
  const match =
    /^(?<hours>\d+):(?<minutes>\d{2}):(?<seconds>\d{2})\.(?<centiseconds>\d{2})$/u.exec(
      value.trim(),
    );
  if (!match?.groups) return null;

  const hours = Number(match.groups.hours);
  const minutes = Number(match.groups.minutes);
  const seconds = Number(match.groups.seconds);
  const centiseconds = Number(match.groups.centiseconds);

  if (
    minutes > 59 ||
    seconds > 59 ||
    !Number.isFinite(hours) ||
    !Number.isFinite(centiseconds)
  ) {
    return null;
  }

  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + centiseconds * 10;
};

export const normalizeSubtitleTextForDisplay = (value: string): string =>
  buildStyledDisplayModel(value).text;

const getSubtitleLineEndMs = (line: SubtitleLine): number =>
  line.startMs + Math.max(0, line.durationMs);

const getCueDurationMs = (startMs: number, endMs: number): number =>
  Math.max(0, endMs - startMs);

const toComparableSubtitleOrder = (
  subtitles: TimedCueDraft[],
): SubtitleLine[] =>
  subtitles
    .toSorted((left, right) => {
      const startDiff = left.line.startMs - right.line.startMs;
      if (startDiff !== 0) return startDiff;

      const endDiff =
        getSubtitleLineEndMs(left.line) - getSubtitleLineEndMs(right.line);
      if (endDiff !== 0) return endDiff;

      return left.index - right.index;
    })
    .map(({ line }) => line);

const trimEmptyBoundaryLines = (lines: string[]): string[] => {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start] === "") {
    start += 1;
  }
  while (end > start && lines[end - 1] === "") {
    end -= 1;
  }

  return lines.slice(start, end);
};

const parseCueSettings = (
  rawSettings: string,
): WebVttCueMetadata["settings"] => {
  const raw = rawSettings.trim();
  if (!raw) return undefined;

  const values: Record<string, string> = {};
  for (const token of raw.split(/\s+/u)) {
    const separatorIndex = token.indexOf(":");
    if (separatorIndex <= 0) continue;
    values[token.slice(0, separatorIndex)] = token.slice(separatorIndex + 1);
  }

  return {
    raw,
    values,
  };
};

const extractVttVoice = (payload: string): string | undefined => {
  const match =
    /^\s*<v(?:\.[^ >]+)?(?:\s+([^>]*?))?>/iu.exec(payload) ??
    /^\s*<v\s+([^>]*?)>/iu.exec(payload);
  const voice = match?.[1]?.trim();
  return voice ? voice : undefined;
};

const isSrtCueStart = (lines: string[], index: number): boolean => {
  const current = lines[index]?.trim() ?? "";
  const next = lines[index + 1]?.trim() ?? "";
  return (
    SRT_TIMING_RE.test(current) ||
    (/^\d+$/u.test(current) && SRT_TIMING_RE.test(next))
  );
};

const getSrtTimingLineIndex = (lines: string[], cursor: number): number =>
  /^\d+$/u.test(lines[cursor]?.trim() ?? "") &&
  SRT_TIMING_RE.test(lines[cursor + 1]?.trim() ?? "")
    ? cursor + 1
    : cursor;

const parseSrtTiming = (
  lines: string[],
  timingLineIndex: number,
): { startMs: number; endMs: number } | null => {
  const timingMatch = SRT_TIMING_RE.exec(lines[timingLineIndex]?.trim() ?? "");
  if (!timingMatch?.groups) {
    return null;
  }

  const startMs = parseClockTime(timingMatch.groups.start, 3);
  const endMs = parseClockTime(timingMatch.groups.end, 3);
  return startMs == null || endMs == null || endMs < startMs
    ? null
    : { startMs, endMs };
};

const readSrtPayload = (
  lines: string[],
  startCursor: number,
): {
  rawText: string;
  nextCursor: number;
} => {
  let cursor = startCursor;
  const payloadLines: string[] = [];

  while (cursor < lines.length) {
    if (lines[cursor].trim() === "") {
      const nextCursor = cursor + 1;
      if (isSrtCueStart(lines, nextCursor)) {
        break;
      }
      cursor += 1;
      continue;
    }

    if (payloadLines.length > 0 && isSrtCueStart(lines, cursor)) {
      break;
    }

    payloadLines.push(lines[cursor]);
    cursor += 1;
  }

  return {
    rawText: trimEmptyBoundaryLines(payloadLines).join("\n"),
    nextCursor: cursor,
  };
};

const createStyledCueDraft = (
  index: number,
  {
    rawText,
    startMs,
    endMs,
    speakerId,
    displayModel,
    metadata,
  }: {
    rawText: string;
    startMs: number;
    endMs: number;
    speakerId: string;
    displayModel: ReturnType<typeof buildStyledDisplayModel>;
    metadata?: Omit<StyledCueMetadata, "rawText" | "styledSpans">;
  },
): TimedCueDraft => ({
  index,
  line: {
    text: displayModel.text,
    startMs,
    durationMs: getCueDurationMs(startMs, endMs),
    speakerId,
    tokens: [],
    metadata: {
      rawText,
      styledSpans: displayModel.styledSpans,
      ...metadata,
    },
  },
});

const createEmptyVttResult = (): ProcessedSubtitles => ({
  format: "vtt",
  subtitles: [],
  metadata: {
    vtt: {
      headerText: "",
      blocks: [],
    },
  },
});

const isWebVttDocumentBlock = (line: string): boolean =>
  line.startsWith("NOTE") || line === "STYLE" || line === "REGION";

const readVttBlockLines = (
  lines: string[],
  startCursor: number,
): {
  blockLines: string[];
  nextCursor: number;
} => {
  const blockLines: string[] = [];
  let cursor = startCursor;
  while (cursor < lines.length && lines[cursor].trim() !== "") {
    blockLines.push(lines[cursor]);
    cursor += 1;
  }

  return { blockLines, nextCursor: cursor };
};

const resolveVttCueIdentity = (
  lines: string[],
  cursor: number,
): {
  cueId: string | undefined;
  timingCursor: number;
} => {
  if (
    !VTT_TIMING_RE.test(lines[cursor] ?? "") &&
    VTT_TIMING_RE.test(lines[cursor + 1] ?? "")
  ) {
    return {
      cueId: lines[cursor],
      timingCursor: cursor + 1,
    };
  }

  return {
    cueId: undefined,
    timingCursor: cursor,
  };
};

const parseVttTiming = (
  line: string,
): {
  startMs: number;
  endMs: number;
  settingsRaw: string;
} | null => {
  const timingMatch = VTT_TIMING_RE.exec(line);
  if (!timingMatch?.groups) {
    return null;
  }

  const startMs = parseClockTime(timingMatch.groups.start, 3);
  const endMs = parseClockTime(timingMatch.groups.end, 3);
  if (startMs == null || endMs == null || endMs < startMs) {
    return null;
  }

  return {
    startMs,
    endMs,
    settingsRaw: timingMatch.groups.settings ?? "",
  };
};

const readVttPayloadLines = (
  lines: string[],
  startCursor: number,
): {
  payloadLines: string[];
  nextCursor: number;
} => {
  const payloadLines: string[] = [];
  let cursor = startCursor;
  while (cursor < lines.length && lines[cursor].trim() !== "") {
    payloadLines.push(lines[cursor]);
    cursor += 1;
  }

  return { payloadLines, nextCursor: cursor };
};

const parseAssEventFormatFields = (formatLine: string): string[] =>
  formatLine
    .slice("Format:".length)
    .split(",")
    .map((field) => field.trim());

const ensureAssEventFields = (
  eventFields: string[],
  metadata: AssDocumentMetadata,
): string[] =>
  eventFields.length || !metadata.eventFormat
    ? eventFields
    : parseAssEventFormatFields(metadata.eventFormat);

const buildAssEventRecord = (
  eventFields: string[],
  value: string,
): Record<string, string> => {
  const values = splitAssFields(value, eventFields.length);
  return Object.fromEntries(
    eventFields.map((field, fieldIndex) => [field, values[fieldIndex] ?? ""]),
  );
};

const applyAssStyleSectionLine = (
  metadata: AssDocumentMetadata,
  line: string,
): void => {
  if (line.startsWith("Format:")) {
    metadata.styleFormat = line;
    return;
  }

  if (line.startsWith("Style:")) {
    metadata.styleLines.push(line);
    return;
  }

  metadata.preEventLines.push(line);
};

const createAssCueDraft = (
  index: number,
  event: Record<string, string>,
): TimedCueDraft | null => {
  const startMs = parseAssTime(event.Start ?? "");
  const endMs = parseAssTime(event.End ?? "");
  if (startMs == null || endMs == null || endMs < startMs) {
    return null;
  }

  const rawText = event.Text ?? "";
  const displayModel = buildStyledDisplayModel(rawText);
  const assMetadata: AssCueMetadata = {
    kind: "dialogue",
    layer: event.Layer ?? "0",
    style: event.Style ?? "Default",
    name: event.Name ?? "",
    marginL: event.MarginL ?? "0",
    marginR: event.MarginR ?? "0",
    marginV: event.MarginV ?? "0",
    effect: event.Effect ?? "",
    rawText,
    overrideTags: rawText.match(ASS_OVERRIDE_TAG_RE) ?? [],
  };

  return {
    index,
    line: createStyledCueDraft(index, {
      rawText,
      startMs,
      endMs,
      speakerId: assMetadata.name || "0",
      displayModel,
      metadata: {
        ass: assMetadata,
      },
    }).line,
  };
};

const processAssEventLine = (
  metadata: AssDocumentMetadata,
  line: string,
  index: number,
  eventFields: string[],
): {
  eventFields: string[];
  cue: TimedCueDraft | null;
} => {
  if (line.startsWith("Format:")) {
    return {
      eventFields: parseAssEventFormatFields(line),
      cue: null,
    };
  }

  if (!line.includes(":")) {
    metadata.preEventLines.push(line);
    return { eventFields, cue: null };
  }

  const separatorIndex = line.indexOf(":");
  const kind = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  const resolvedEventFields = ensureAssEventFields(eventFields, metadata);
  const event = buildAssEventRecord(resolvedEventFields, value);

  if (kind === "Comment") {
    metadata.commentLines.push(line);
    return { eventFields: resolvedEventFields, cue: null };
  }

  if (kind !== "Dialogue") {
    metadata.preEventLines.push(line);
    return { eventFields: resolvedEventFields, cue: null };
  }

  return {
    eventFields: resolvedEventFields,
    cue: createAssCueDraft(index, event),
  };
};

const parseSrt = (text: string): ProcessedSubtitles => {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const cues: TimedCueDraft[] = [];

  let cursor = 0;
  let cueIndex = 0;
  while (cursor < lines.length) {
    while (cursor < lines.length && lines[cursor].trim() === "") {
      cursor += 1;
    }
    if (cursor >= lines.length) break;

    const timingLineIndex = getSrtTimingLineIndex(lines, cursor);
    const timing = parseSrtTiming(lines, timingLineIndex);
    if (!timing) {
      cursor += 1;
      continue;
    }

    const payload = readSrtPayload(lines, timingLineIndex + 1);
    cursor = payload.nextCursor;
    const rawText = payload.rawText;
    const displayModel = buildStyledDisplayModel(rawText);

    cues.push(
      createStyledCueDraft(cueIndex, {
        rawText,
        startMs: timing.startMs,
        endMs: timing.endMs,
        speakerId: "0",
        displayModel,
      }),
    );
    cueIndex += 1;
  }

  return {
    format: "srt",
    subtitles: toComparableSubtitleOrder(cues),
  };
};

const resolveSerializedText = (
  processed: ProcessedSubtitles,
  line: SubtitleLine,
  format: "srt" | "ass",
): string => {
  if (processed.format === format) {
    return line.metadata?.rawText ?? line.text;
  }
  if (format === "ass") {
    return line.text.replaceAll("\n", "\\N");
  }
  return line.text;
};

const serializeSrt = (processed: ProcessedSubtitles): string =>
  processed.subtitles
    .map((line, index) => {
      const rawText = resolveSerializedText(processed, line, "srt");
      const endMs = getSubtitleLineEndMs(line);
      return [
        String(index + 1),
        `${formatClockTime(line.startMs, {
          delimiter: ",",
          allowOptionalHours: false,
          fractionDigits: 3,
        })} --> ${formatClockTime(endMs, {
          delimiter: ",",
          allowOptionalHours: false,
          fractionDigits: 3,
        })}`,
        rawText,
      ].join("\n");
    })
    .join("\n\n");

const pushWebVttBlock = (
  blocks: WebVttDocumentBlock[],
  cueIndex: number,
  lines: string[],
): void => {
  blocks.push({
    cueIndex,
    lines,
  });
};

const parseVtt = (text: string): ProcessedSubtitles => {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const headerLine = lines[0] ?? "";
  if (!headerLine.startsWith("WEBVTT")) {
    return createEmptyVttResult();
  }

  const metadata: WebVttDocumentMetadata = {
    headerText: headerLine.slice("WEBVTT".length).trim(),
    blocks: [],
  };
  const cues: TimedCueDraft[] = [];

  let cursor = 1;
  while (cursor < lines.length) {
    while (cursor < lines.length && lines[cursor].trim() === "") {
      cursor += 1;
    }
    if (cursor >= lines.length) break;

    if (isWebVttDocumentBlock(lines[cursor])) {
      const block = readVttBlockLines(lines, cursor);
      cursor = block.nextCursor;
      pushWebVttBlock(metadata.blocks, cues.length, block.blockLines);
      continue;
    }

    const identity = resolveVttCueIdentity(lines, cursor);
    const timing = parseVttTiming(lines[identity.timingCursor] ?? "");
    if (!timing) {
      cursor += 1;
      continue;
    }

    const payload = readVttPayloadLines(lines, identity.timingCursor + 1);
    cursor = payload.nextCursor;
    const payloadLines = payload.payloadLines;
    const rawText = payloadLines.join("\n");
    const displayModel = buildStyledDisplayModel(rawText);
    const voice = extractVttVoice(rawText);
    cues.push({
      index: cues.length,
      line: createStyledCueDraft(cues.length, {
        rawText,
        startMs: timing.startMs,
        endMs: timing.endMs,
        speakerId: voice ?? "0",
        displayModel,
        metadata: {
          vtt: {
            cueId: identity.cueId,
            settings: parseCueSettings(timing.settingsRaw),
            voice,
            rawPayload: payloadLines,
          },
        },
      }).line,
    });
  }

  return {
    format: "vtt",
    subtitles: toComparableSubtitleOrder(cues),
    metadata: {
      vtt: metadata,
    },
  };
};

const serializeVttTiming = (line: SubtitleLine): string => {
  const endMs = getSubtitleLineEndMs(line);
  const settings = line.metadata?.vtt?.settings?.raw;
  const settingsSuffix = settings ? ` ${settings}` : "";
  return `${formatClockTime(line.startMs, {
    delimiter: ".",
    allowOptionalHours: true,
    fractionDigits: 3,
  })} --> ${formatClockTime(endMs, {
    delimiter: ".",
    allowOptionalHours: true,
    fractionDigits: 3,
  })}${settingsSuffix}`;
};

const serializeVtt = (processed: ProcessedSubtitles): string => {
  const metadata = processed.metadata?.vtt;
  const headerSuffix = metadata?.headerText ? ` ${metadata.headerText}` : "";
  const sections: string[] = [`WEBVTT${headerSuffix}`];

  const blocksByIndex = new Map<number, string[][]>();
  for (const block of metadata?.blocks ?? []) {
    const existing = blocksByIndex.get(block.cueIndex) ?? [];
    existing.push(block.lines);
    blocksByIndex.set(block.cueIndex, existing);
  }

  const emitBlocks = (cueIndex: number) => {
    for (const lines of blocksByIndex.get(cueIndex) ?? []) {
      sections.push(lines.join("\n"));
    }
  };

  emitBlocks(0);
  processed.subtitles.forEach((line, index) => {
    const cueId = line.metadata?.vtt?.cueId;
    const cueSections = [
      ...(cueId ? [cueId] : []),
      serializeVttTiming(line),
      (processed.format === "vtt"
        ? line.metadata?.vtt?.rawPayload
        : line.text.split("\n")
      )?.join("\n") ?? line.text,
    ];
    sections.push(cueSections.join("\n"));
    emitBlocks(index + 1);
  });

  return sections.filter(Boolean).join("\n\n");
};

const splitAssFields = (value: string, fieldCount: number): string[] => {
  if (fieldCount <= 1) {
    return [value];
  }

  const fields: string[] = [];
  let cursor = 0;
  for (let i = 0; i < fieldCount - 1; i += 1) {
    const separatorIndex = value.indexOf(",", cursor);
    if (separatorIndex < 0) {
      fields.push(value.slice(cursor).trim());
      cursor = value.length;
      break;
    }
    fields.push(value.slice(cursor, separatorIndex).trim());
    cursor = separatorIndex + 1;
  }
  fields.push(value.slice(cursor).trim());
  return fields;
};

const createEmptyAssMetadata = (): AssDocumentMetadata => ({
  scriptInfoLines: [],
  styleFormat: "",
  styleLines: [],
  eventFormat: "",
  preEventLines: [],
  commentLines: [],
});

const createDefaultAssMetadata = (
  title = "Exported subtitles",
): AssDocumentMetadata => ({
  scriptInfoLines: [
    `Title: ${title}`,
    "ScriptType: v4.00+",
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
  ],
  styleFormat:
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  styleLines: [
    "Style: Default,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,20,1",
  ],
  eventFormat:
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  preEventLines: [],
  commentLines: [],
});

const parseAss = (text: string): ProcessedSubtitles => {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const metadata = createEmptyAssMetadata();
  const cues: TimedCueDraft[] = [];
  let currentSection = "";
  let eventFields: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const sectionMatch = /^\[(.+)\]$/u.exec(trimmed);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      return;
    }

    if (currentSection === "Script Info") {
      metadata.scriptInfoLines.push(line);
      return;
    }

    if (currentSection === "V4+ Styles" || currentSection === "V4 Styles") {
      applyAssStyleSectionLine(metadata, line);
      return;
    }

    if (currentSection === "Events") {
      if (line.startsWith("Format:")) {
        metadata.eventFormat = line;
      }

      const result = processAssEventLine(metadata, line, index, eventFields);
      eventFields = result.eventFields;
      if (result.cue) {
        cues.push(result.cue);
      }
    }
  });

  return {
    format: "ass",
    subtitles: toComparableSubtitleOrder(cues),
    metadata: {
      ass: metadata,
    },
  };
};

const serializeAssDialogue = (line: SubtitleLine): string => {
  const ass = line.metadata?.ass;
  const endMs = getSubtitleLineEndMs(line);
  const rawText =
    ass?.rawText ?? line.metadata?.rawText ?? line.text.replaceAll("\n", "\\N");
  return [
    ass?.kind === "comment" ? "Comment" : "Dialogue",
    ": ",
    [
      ass?.layer ?? "0",
      formatAssTime(line.startMs),
      formatAssTime(endMs),
      ass?.style ?? "Default",
      ass?.name ?? "",
      ass?.marginL ?? "0",
      ass?.marginR ?? "0",
      ass?.marginV ?? "0",
      ass?.effect ?? "",
      rawText,
    ].join(","),
  ].join("");
};

const withAssTitle = (
  metadata: AssDocumentMetadata,
  assTitle?: string,
): AssDocumentMetadata => {
  if (!assTitle) {
    return metadata;
  }

  const titleLine = `Title: ${assTitle}`;
  const scriptInfoLines = [...metadata.scriptInfoLines];
  const existingIndex = scriptInfoLines.findIndex((line) =>
    line.startsWith("Title:"),
  );

  if (existingIndex >= 0) {
    if (scriptInfoLines[existingIndex] === "Title: Exported subtitles") {
      scriptInfoLines[existingIndex] = titleLine;
    }
  } else {
    scriptInfoLines.unshift(titleLine);
  }

  return {
    ...metadata,
    scriptInfoLines,
  };
};

const serializeAss = (
  processed: ProcessedSubtitles,
  options?: SubtitleSerializeOptions,
): string => {
  const sourceMetadata = processed.metadata?.ass;
  const metadataBase =
    sourceMetadata &&
    sourceMetadata.scriptInfoLines.length > 0 &&
    sourceMetadata.styleFormat &&
    sourceMetadata.styleLines.length > 0 &&
    sourceMetadata.eventFormat
      ? sourceMetadata
      : createDefaultAssMetadata(options?.assTitle);
  const metadata = withAssTitle(metadataBase, options?.assTitle);
  const sections: string[] = [
    "[Script Info]",
    ...metadata.scriptInfoLines,
    "",
    "[V4+ Styles]",
    metadata.styleFormat,
    ...metadata.styleLines,
    ...metadata.preEventLines,
    "",
    "[Events]",
    metadata.eventFormat,
    ...metadata.commentLines,
    ...processed.subtitles.map((line) =>
      serializeAssDialogue({
        ...line,
        metadata:
          processed.format === "ass"
            ? line.metadata
            : {
                ...line.metadata,
                rawText: resolveSerializedText(processed, line, "ass"),
              },
      }),
    ),
  ];

  return sections.join("\n").trim();
};

export const parseSubtitleText = (
  text: string,
  format: Exclude<SubtitleFormat, "json">,
): ProcessedSubtitles => {
  if (format === "srt") return parseSrt(text);
  if (format === "vtt") return parseVtt(text);
  return parseAss(text);
};

export const sortProcessedSubtitles = (
  processed: ProcessedSubtitles,
): ProcessedSubtitles => ({
  ...processed,
  subtitles: toComparableSubtitleOrder(
    processed.subtitles.map((line, index) => ({
      index,
      line,
    })),
  ),
});

export const toSubtitlesData = (
  processed: ProcessedSubtitles,
): SubtitlesData => {
  const subtitles = processed.subtitles.map((line) => ({
    text: line.text,
    startMs: line.startMs,
    durationMs: line.durationMs,
    speakerId: line.speakerId,
    tokens: line.tokens.map((token) => ({
      text: token.text,
      startMs: token.startMs,
      durationMs: token.durationMs,
    })),
  }));

  return {
    containsTokens: subtitles.some((line) => line.tokens.length > 0),
    subtitles,
  };
};

export const serializeProcessedSubtitles = (
  processed: ProcessedSubtitles,
  format: SubtitleFormat,
  options?: SubtitleSerializeOptions,
): string | SubtitlesData => {
  if (format === "json") {
    return toSubtitlesData(processed);
  }
  if (format === "srt") return serializeSrt(processed);
  if (format === "vtt") return serializeVtt(processed);
  return serializeAss(processed, options);
};
