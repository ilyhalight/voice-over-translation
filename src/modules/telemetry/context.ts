import { categorizeFailure } from "../../utils/errors";
import type { Contexts, Tags } from "./event";

type Details = { name?: string; version?: string };

export type EnvironmentInfo = {
  build: string;
  host: string;
  inIframe: boolean;
  browser: Details;
  os: Details;
  scriptHandler?: string;
  scriptHandlerVersion?: string;
};

export type TranslationContextSource = {
  site?: { host?: string };
  data?: { newAudioPlayer?: boolean; translateProxyEnabled?: number };
  videoData?: { isStream?: boolean };
};

const PROXY_MODES = ["direct", "proxy-client", "proxy-full"];

export function compactTags(tags: Record<string, string | undefined>): Tags {
  return Object.fromEntries(
    Object.entries(tags).filter(([, value]) => Boolean(value)),
  ) as Tags;
}

function formatDetails({ name, version }: Details): string | undefined {
  return name && (version ? `${name} ${version}` : name);
}

function getAudioPlayer(newAudioPlayer?: boolean): string | undefined {
  if (newAudioPlayer === undefined) return undefined;
  return newAudioPlayer ? "web-audio" : "audio-element";
}

export function buildEnvironmentTags(env: EnvironmentInfo): Tags {
  return compactTags({
    build: env.build,
    host: env.host,
    in_iframe: String(env.inIframe),
    browser: formatDetails(env.browser),
    script_handler: env.scriptHandler,
    script_handler_version: env.scriptHandlerVersion,
  });
}

export function buildContexts({
  browser,
  os,
}: Pick<EnvironmentInfo, "browser" | "os">): Contexts {
  const contexts: Contexts = {};
  for (const [key, { name, version }] of [
    ["browser", browser],
    ["os", os],
  ] as const) {
    if (name) contexts[key] = compactTags({ name, version });
  }
  return contexts;
}

/** Whitelisted translation state: never ids, urls, titles or proxy hosts. */
export function getTranslationTags(
  { site, data, videoData }: TranslationContextSource,
  langs: { from?: string; to?: string } = {},
): Tags {
  return compactTags({
    service: site?.host,
    from_lang: langs.from,
    to_lang: langs.to,
    proxy_mode:
      data?.translateProxyEnabled === undefined
        ? undefined
        : PROXY_MODES[data.translateProxyEnabled],
    audio_player: getAudioPlayer(data?.newAudioPlayer),
    is_stream: videoData ? String(Boolean(videoData.isStream)) : undefined,
  });
}

/** MediaError.code (1-4) from a MediaError or an error event carrying one. */
export function getMediaErrorCode(value: unknown): number | undefined {
  const candidates = [value, (value as { error?: unknown } | null)?.error];
  for (const candidate of candidates) {
    const { code } = (candidate ?? {}) as { code?: unknown };
    if (
      typeof code === "number" &&
      code >= 1 &&
      code <= 4 &&
      (candidate as object).constructor?.name === "MediaError"
    ) {
      return code;
    }
  }
  return undefined;
}

/** Content-free description of an audio failure; never the error message. */
export function getAudioFailureTags(error: unknown, stage: string): Tags {
  const mediaErrorCode = getMediaErrorCode(error);
  return compactTags({
    audio_stage: stage,
    audio_failure: categorizeFailure(error),
    media_error_code:
      mediaErrorCode === undefined ? undefined : String(mediaErrorCode),
  });
}

const SESSION_MODULES = new Set([
  "video-translation",
  "summarization",
  "neuroapi",
  "neuroedit",
]);

/** Fixed-set description of a failed session creation; never ids or secrets. */
export function getSessionFailureTags(error: unknown, module: string): Tags {
  // VOTJSError carries the raw response: `data` is the transport error message
  // when the request failed, or the response body otherwise.
  const detail = (error as { data?: { data?: unknown } } | null)?.data?.data;
  let failure: string;
  if (detail === undefined) failure = categorizeFailure(error);
  else if (typeof detail === "string") failure = categorizeFailure(detail);
  else failure = "bad_response";

  return compactTags({
    session_module: SESSION_MODULES.has(module) ? module : "other",
    session_failure: failure,
  });
}

export type StrategyFailure = { strategy: string; error: unknown };

/**
 * Failed download strategies worth a warning. When the whole download failed,
 * the last failure is excluded: the final download event already carries it.
 */
export function selectStrategyFailuresToReport(
  failures: StrategyFailure[],
  downloadSucceeded: boolean,
): (StrategyFailure & { recovered: boolean })[] {
  return (downloadSucceeded ? failures : failures.slice(0, -1))
    .filter(({ error }) => categorizeFailure(error) !== "abort")
    .map((failure) => ({ ...failure, recovered: downloadSucceeded }));
}
