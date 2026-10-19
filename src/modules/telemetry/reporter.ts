import {
  m3u8ProxyHost,
  PROXY_WORKER_HOST,
  proxyWorkerHostMode1,
  workerHost,
} from "../../config/config";
import { isAbortError } from "../../utils/errors";
import type { GmFetchFailure } from "../../utils/gm";
import {
  buildContexts,
  buildEnvironmentTags,
  compactTags,
  type EnvironmentInfo,
} from "./context";
import {
  buildEvent,
  collectCauses,
  type EventLevel,
  INGEST_HOST,
  type SentryEvent,
  type Tags,
  toError,
} from "./event";

const MAX_EVENTS_PER_SESSION = 20;

// Users can point VOT at private proxy hosts, so only these are reported by name.
const PUBLIC_HOSTS = [
  workerHost,
  PROXY_WORKER_HOST,
  proxyWorkerHostMode1,
  m3u8ProxyHost.split("/")[0],
  "youtube.com",
  "googlevideo.com",
];

export function toPublicHost(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const lower = host.toLowerCase();
  return (
    PUBLIC_HOSTS.find(
      (known) => lower === known || lower.endsWith(`.${known}`),
    ) ?? "other"
  );
}

export type CaptureOptions = {
  /** Subsystem that caught the error. */
  source:
    | "translation"
    | "playback"
    | "bootstrap"
    | "network"
    | "auth"
    | "subtitles"
    | "init"
    | "videoData"
    | "audio"
    | "session";
  operation?: string;
  /**
   * Replaces the message and drops the cause chain, keeping the error name and
   * stack. For errors whose text may echo tokens or response bodies.
   */
  redactedMessage?: string;
  /** Overrides the level that the classifier would pick. */
  level?: EventLevel;
  /** Set to false to bypass the name:message session dedupe. */
  dedupe?: boolean;
  /** Narrows the dedupe key (e.g. a video id). Used locally only, never sent. */
  dedupeKey?: string;
  tags?: Tags;
  extra?: Record<string, unknown>;
};

export type RuntimeInfo = {
  version: string;
  environment: string;
  env: EnvironmentInfo;
};

type ReporterDeps = {
  isEnabled(): Promise<boolean>;
  getRuntimeInfo(): RuntimeInfo;
  send(event: SentryEvent): Promise<void>;
};

export function isExpectedError(error: unknown): boolean {
  const { name, message } = (error ?? {}) as {
    name?: unknown;
    message?: unknown;
  };
  return (
    isAbortError(error) ||
    // VOTLocalizedError is a user-facing condition (e.g. video is too long), not a bug.
    name === "VOTLocalizedError" ||
    // play() rejected by the autoplay policy; the user has to interact first.
    name === "NotAllowedError" ||
    // @vot.js/ext throws this when the page simply has no supported video.
    (name === "VideoDataError" &&
      typeof message === "string" &&
      message.startsWith("Entered unsupported link"))
  );
}

function redactError(error: Error, message: string): Error {
  const redacted = new Error(message);
  redacted.name = error.name;
  // V8 prefixes the stack with the original message.
  const header = `${error.name}: ${error.message}`;
  redacted.stack = error.stack?.startsWith(header)
    ? error.stack.slice(header.length)
    : error.stack;
  return redacted;
}

// Message of the VOTJSError that @vot.js/core throws when Yandex reports the
// FAILED status. Other VOTJSError messages indicate transport or parsing bugs.
const YANDEX_REFUSAL_MESSAGE = "Yandex couldn't translate video";

/** Server-side translation refusals are expected noise, not client bugs. */
export function classifyLevel(error: unknown): EventLevel {
  const { name, message } = (error ?? {}) as {
    name?: unknown;
    message?: unknown;
  };
  return name === "VOTJSError" && message === YANDEX_REFUSAL_MESSAGE
    ? "warning"
    : "error";
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function createReporter({
  isEnabled,
  getRuntimeInfo,
  send,
}: ReporterDeps) {
  const reportedKeys = new Set<string>();
  const capturedErrors = new WeakSet<object>();
  let eventCount = 0;

  return async function report(
    error: unknown,
    options: CaptureOptions,
  ): Promise<void> {
    if (isExpectedError(error)) return;
    // Checked first so that errors while disabled do not consume the budget.
    if (!(await isEnabled())) return;

    const normalized = toError(error);
    // The same error object may be caught again further up the call stack.
    const involved = [error, ...collectCauses(normalized)].filter(isObject);
    if (involved.some((item) => capturedErrors.has(item))) return;
    for (const item of involved) capturedErrors.add(item);

    const reported =
      options.redactedMessage === undefined
        ? normalized
        : redactError(normalized, options.redactedMessage);
    const key = `${reported.name}:${reported.message}:${options.dedupeKey ?? ""}`;
    if (options.dedupe !== false && reportedKeys.has(key)) return;
    if (eventCount >= MAX_EVENTS_PER_SESSION) return;
    reportedKeys.add(key);
    eventCount++;

    const { version, environment, env } = getRuntimeInfo();
    await send(
      buildEvent(reported, {
        version,
        environment,
        level: options.level ?? classifyLevel(error),
        tags: compactTags({
          ...buildEnvironmentTags(env),
          ...options.tags,
          source: options.source,
          operation: options.operation,
        }),
        contexts: buildContexts(env),
        extra: options.extra,
      }),
    );
  };
}

export function createGmFetchFailureHandler(
  capture: (error: unknown, options: CaptureOptions) => void,
) {
  return ({ error, host, method, attempts }: GmFetchFailure): void => {
    // The reporter sends through GM_fetch itself; reporting its failures would loop.
    if (host === INGEST_HOST) return;

    capture(error, {
      source: "network",
      operation: "GM_fetch",
      dedupe: false,
      tags: compactTags({
        request_host: toPublicHost(host),
        request_method: method,
      }),
      extra: {
        attempts: attempts.map(
          ({ approach, category }) => `${approach}: ${category}`,
        ),
      },
    });
  };
}
