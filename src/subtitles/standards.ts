import type { SubtitlesData } from "@vot.js/shared/types/subs";
import { buildStyledDisplayModel } from "./displayModel";
import type {
  AssCueMetadata,
  AssDocumentMetadata,
  ProcessedSubtitles,
  SubtitleFormat,
  SubtitleLine,
  WebVttCueMetadata,
  WebVttDocumentBlock,
  WebVttDocumentMetadata,
} from "./types";

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
  const safeMs = Math.max(0, Math.round(totalMs));
  const hours = Math.floor(safeMs / 3_600_000);
  const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
  const seconds = Math.floor((safeMs % 60_000) / 1000);
  const milliseconds = safeMs % 1000;
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

const formatAssTime = (totalMs: number): string => {
  const safeMs = Math.max(0, Math.round(totalMs));
  const hours = Math.floor(safeMs / 3_600_000);
  const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
  const seconds = Math.floor((safeMs % 60_000) / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10);
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

const toComparableSubtitleOrder = (
  subtitles: TimedCueDraft[],
): SubtitleLine[] =>
  subtitles
    .sort((left, right) => {
      const startDiff = left.line.startMs - right.line.startMs;
      if (startDiff !== 0) return startDiff;

      const endDiff =
        left.line.startMs +
        Math.max(0, left.line.durationMs) -
        (right.line.startMs + Math.max(0, right.line.durationMs));
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

const toSrtDisplayText = (payload: string): string =>
  normalizeSubtitleTextForDisplay(payload);

const toVttDisplayText = (payload: string): string =>
  normalizeSubtitleTextForDisplay(payload);

const toAssDisplayText = (rawText: string): string =>
  normalizeSubtitleTextForDisplay(rawText);

const parseSrt = (text: string): ProcessedSubtitles => {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");
  const cues: TimedCueDraft[] = [];

  const isSrtCueStart = (index: number): boolean => {
    const current = lines[index]?.trim() ?? "";
    const next = lines[index + 1]?.trim() ?? "";
    return (
      SRT_TIMING_RE.test(current) ||
      (/^\d+$/u.test(current) && SRT_TIMING_RE.test(next))
    );
  };

  let cursor = 0;
  let cueIndex = 0;
  while (cursor < lines.length) {
    while (cursor < lines.length && lines[cursor].trim() === "") {
      cursor += 1;
    }
    if (cursor >= lines.length) break;

    let timingLineIndex = cursor;
    if (
      /^\d+$/u.test(lines[cursor].trim()) &&
      SRT_TIMING_RE.test(lines[cursor + 1]?.trim() ?? "")
    ) {
      timingLineIndex = cursor + 1;
    }

    const timingMatch = SRT_TIMING_RE.exec(
      lines[timingLineIndex]?.trim() ?? "",
    );
    if (!timingMatch?.groups) {
      cursor += 1;
      continue;
    }

    const startMs = parseClockTime(timingMatch.groups.start, 3);
    const endMs = parseClockTime(timingMatch.groups.end, 3);
    if (startMs == null || endMs == null || endMs < startMs) {
      cursor = timingLineIndex + 1;
      continue;
    }

    cursor = timingLineIndex + 1;
    const payloadLines: string[] = [];
    while (cursor < lines.length) {
      if (lines[cursor].trim() === "") {
        const nextCursor = cursor + 1;
        if (isSrtCueStart(nextCursor)) {
          break;
        }
        cursor += 1;
        continue;
      }

      if (payloadLines.length > 0 && isSrtCueStart(cursor)) {
        break;
      }

      payloadLines.push(lines[cursor]);
      cursor += 1;
    }

    const rawText = trimEmptyBoundaryLines(payloadLines).join("\n");
    const displayModel = buildStyledDisplayModel(rawText);

    cues.push({
      index: cueIndex,
      line: {
        text: toSrtDisplayText(rawText),
        startMs,
        durationMs: Math.max(0, endMs - startMs),
        speakerId: "0",
        tokens: [],
        metadata: {
          rawText,
          styledSpans: displayModel.styledSpans,
        },
      },
    });
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
      const endMs = line.startMs + Math.max(0, line.durationMs);
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
    return {
      format: "vtt",
      subtitles: [],
      metadata: {
        vtt: {
          headerText: "",
          blocks: [],
        },
      },
    };
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

    if (
      lines[cursor].startsWith("NOTE") ||
      lines[cursor] === "STYLE" ||
      lines[cursor] === "REGION"
    ) {
      const blockLines: string[] = [];
      while (cursor < lines.length && lines[cursor].trim() !== "") {
        blockLines.push(lines[cursor]);
        cursor += 1;
      }
      pushWebVttBlock(metadata.blocks, cues.length, blockLines);
      continue;
    }

    let cueId: string | undefined;
    if (
      !VTT_TIMING_RE.test(lines[cursor] ?? "") &&
      VTT_TIMING_RE.test(lines[cursor + 1] ?? "")
    ) {
      cueId = lines[cursor];
      cursor += 1;
    }

    const timingMatch = VTT_TIMING_RE.exec(lines[cursor] ?? "");
    if (!timingMatch?.groups) {
      cursor += 1;
      continue;
    }

    const startMs = parseClockTime(timingMatch.groups.start, 3);
    const endMs = parseClockTime(timingMatch.groups.end, 3);
    if (startMs == null || endMs == null || endMs < startMs) {
      cursor += 1;
      continue;
    }

    cursor += 1;
    const payloadLines: string[] = [];
    while (cursor < lines.length && lines[cursor].trim() !== "") {
      payloadLines.push(lines[cursor]);
      cursor += 1;
    }

    const rawText = payloadLines.join("\n");
    const displayModel = buildStyledDisplayModel(rawText);
    const voice = extractVttVoice(rawText);
    cues.push({
      index: cues.length,
      line: {
        text: toVttDisplayText(rawText),
        startMs,
        durationMs: Math.max(0, endMs - startMs),
        speakerId: voice ?? "0",
        tokens: [],
        metadata: {
          rawText,
          styledSpans: displayModel.styledSpans,
          vtt: {
            cueId,
            settings: parseCueSettings(timingMatch.groups.settings ?? ""),
            voice,
            rawPayload: payloadLines,
          },
        },
      },
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
  const endMs = line.startMs + Math.max(0, line.durationMs);
  const settings = line.metadata?.vtt?.settings?.raw;
  return `${formatClockTime(line.startMs, {
    delimiter: ".",
    allowOptionalHours: true,
    fractionDigits: 3,
  })} --> ${formatClockTime(endMs, {
    delimiter: ".",
    allowOptionalHours: true,
    fractionDigits: 3,
  })}${settings ? ` ${settings}` : ""}`;
};

const serializeVtt = (processed: ProcessedSubtitles): string => {
  const metadata = processed.metadata?.vtt;
  const sections: string[] = [
    `WEBVTT${metadata?.headerText ? ` ${metadata.headerText}` : ""}`,
  ];

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
      if (line.startsWith("Format:")) {
        metadata.styleFormat = line;
        return;
      }
      if (line.startsWith("Style:")) {
        metadata.styleLines.push(line);
        return;
      }
      metadata.preEventLines.push(line);
      return;
    }

    if (currentSection === "Events") {
      if (line.startsWith("Format:")) {
        metadata.eventFormat = line;
        eventFields = line
          .slice("Format:".length)
          .split(",")
          .map((field) => field.trim());
        return;
      }

      if (!line.includes(":")) {
        metadata.preEventLines.push(line);
        return;
      }

      const separatorIndex = line.indexOf(":");
      const kind = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!eventFields.length && metadata.eventFormat) {
        eventFields = metadata.eventFormat
          .slice("Format:".length)
          .split(",")
          .map((field) => field.trim());
      }

      const values = splitAssFields(value, eventFields.length);
      const event = Object.fromEntries(
        eventFields.map((field, fieldIndex) => [
          field,
          values[fieldIndex] ?? "",
        ]),
      );

      if (kind === "Comment") {
        metadata.commentLines.push(line);
        return;
      }

      if (kind !== "Dialogue") {
        metadata.preEventLines.push(line);
        return;
      }

      const startMs = parseAssTime(event.Start ?? "");
      const endMs = parseAssTime(event.End ?? "");
      if (startMs == null || endMs == null || endMs < startMs) {
        return;
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

      cues.push({
        index,
        line: {
          text: toAssDisplayText(rawText),
          startMs,
          durationMs: Math.max(0, endMs - startMs),
          speakerId: assMetadata.name || "0",
          tokens: [],
          metadata: {
            rawText,
            styledSpans: displayModel.styledSpans,
            ass: assMetadata,
          },
        },
      });
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
  const endMs = line.startMs + Math.max(0, line.durationMs);
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
