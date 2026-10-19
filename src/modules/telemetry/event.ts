import { toErrorMessage } from "../../utils/errors";

const SENTRY_DSN = "https://fc1094f48d7348878978df534e30c96d@ingest.nirel.cc/1";
const SENTRY_KEY = "fc1094f48d7348878978df534e30c96d";
const SENTRY_CLIENT = "vot";

export const ENVELOPE_URL = "https://ingest.nirel.cc/api/1/envelope/";
export const INGEST_HOST = "ingest.nirel.cc";

const V8_FRAME_RE = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/;
const GECKO_FRAME_RE = /^(.*?)@(.+?):(\d+):(\d+)\s*$/;
const URL_RE = /https?:\/\/[^\s"'<>)]+/g;
// V8 echoes a snippet of the parsed body: `Unexpected token '<', "<!DOCT"... is not valid JSON`.
const JSON_SNIPPET_RE = /"[\s\S]*"(?:\.\.\.)? is not valid JSON/;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const HEX_ID_RE = /\b(?=[0-9a-f]*\d)[0-9a-f]{8,}\b/gi;
const MAX_CAUSE_DEPTH = 5;
const EXTENSION_ORIGIN_RE = /^((?:chrome|moz|safari-web)-extension:\/\/)[^/]+/;
const VOT_FRAME_RE =
  /^(?:(?:chrome|moz|safari-web)-extension:\/\/|user-script:|app:\/\/\/)/;
const PAGE_FILENAME = "<page>";

export type StackFrame = {
  filename: string;
  function?: string;
  lineno: number;
  colno: number;
  in_app?: true;
};

export type ExceptionValue = {
  type: string;
  value: string;
  stacktrace?: { frames: StackFrame[] };
};

export type Tags = Record<string, string>;
export type Contexts = Record<string, Record<string, string>>;

export type EventLevel = "error" | "warning";

export type SentryEvent = {
  event_id: string;
  timestamp: number;
  platform: "javascript";
  level: EventLevel;
  release: string;
  environment: string;
  tags: Tags;
  contexts?: Contexts;
  extra?: Record<string, unknown>;
  fingerprint: string[];
  exception: { values: ExceptionValue[] };
};

export type EventContext = {
  version: string;
  environment: string;
  level?: EventLevel;
  tags: Tags;
  contexts?: Contexts;
  extra?: Record<string, unknown>;
};

// Page scripts, blob/file urls and eval frames may carry private paths and ids,
// so only files served by a userscript manager or the extension keep their name.
function normalizeFilename(filename: string): {
  filename: string;
  inApp: boolean;
} {
  const cleaned = filename.replace(/[?#].*$/, "");
  if (!VOT_FRAME_RE.test(cleaned)) {
    return { filename: PAGE_FILENAME, inApp: false };
  }
  return {
    filename: cleaned.replace(EXTENSION_ORIGIN_RE, "$1extension"),
    inApp: true,
  };
}

function parseFrameLine(line: string): StackFrame | null {
  const match = V8_FRAME_RE.exec(line) ?? GECKO_FRAME_RE.exec(line);
  if (!match) return null;

  const [, fn, rawFilename, lineno, colno] = match;
  const { filename, inApp } = normalizeFilename(rawFilename);
  return {
    filename,
    ...(fn && { function: fn.replace(URL_RE, "<url>") }),
    lineno: Number(lineno),
    colno: Number(colno),
    ...(inApp && { in_app: true as const }),
  };
}

/** Parses V8 and Gecko/WebKit stacks. Frames are ordered oldest-first. */
export function parseStack(stack: string | undefined): StackFrame[] {
  if (!stack) return [];

  const frames: StackFrame[] = [];
  for (const line of stack.split("\n")) {
    const frame = parseFrameLine(line);
    if (frame) frames.push(frame);
  }
  return frames.reverse();
}

// crypto.randomUUID is unavailable on insecure (http) pages.
function createEventId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(toErrorMessage(value));
}

// Messages may embed request URLs with video ids or tokens.
export function scrubMessage(message: string): string {
  return message
    .replace(URL_RE, "<url>")
    .replace(JSON_SNIPPET_RE, "<body> is not valid JSON");
}

/** Replaces volatile parts so that similar errors share one fingerprint. */
export function normalizeMessage(message: string): string {
  return scrubMessage(message)
    .replace(UUID_RE, "<id>")
    .replace(HEX_ID_RE, "<id>")
    .replace(/\d+/g, "<n>");
}

/** Returns the error and its causes, root cause first (Sentry order). */
export function collectCauses(error: Error): unknown[] {
  const chain: unknown[] = [error];
  const seen = new Set<unknown>(chain);

  let current: unknown = error;
  while (chain.length <= MAX_CAUSE_DEPTH) {
    const cause = (current as { cause?: unknown } | null)?.cause;
    if (cause == null || seen.has(cause)) break;
    seen.add(cause);
    chain.push(cause);
    current = cause;
  }

  return chain.reverse();
}

function toExceptionValue(value: unknown): ExceptionValue {
  // Wrapped non-Error values have no stack of their own.
  if (!(value instanceof Error)) {
    return { type: "Error", value: scrubMessage(toErrorMessage(value)) };
  }

  const frames = parseStack(value.stack);
  return {
    type: value.name,
    value: scrubMessage(value.message),
    ...(frames.length > 0 && { stacktrace: { frames } }),
  };
}

export function buildEvent(error: Error, context: EventContext): SentryEvent {
  const { source, service } = context.tags;

  return {
    event_id: createEventId(),
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: context.level ?? "error",
    release: `vot@${context.version}`,
    environment: context.environment,
    tags: context.tags,
    ...(context.contexts && { contexts: context.contexts }),
    ...(context.extra && { extra: context.extra }),
    fingerprint: [
      error.name,
      source,
      service,
      normalizeMessage(error.message),
    ].filter((part): part is string => Boolean(part)),
    exception: { values: collectCauses(error).map(toExceptionValue) },
  };
}

export function buildEnvelope(event: SentryEvent): string {
  return [
    JSON.stringify({
      event_id: event.event_id,
      sent_at: new Date().toISOString(),
      dsn: SENTRY_DSN,
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

export function buildAuthHeader(version: string): string {
  return `Sentry sentry_version=7, sentry_key=${SENTRY_KEY}, sentry_client=${SENTRY_CLIENT}/${version}`;
}
