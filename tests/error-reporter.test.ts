import { describe, expect, test } from "bun:test";
import {
  buildContexts,
  buildEnvironmentTags,
  getAudioFailureTags,
  getMediaErrorCode,
  getSessionFailureTags,
  getTranslationTags,
  selectStrategyFailuresToReport,
} from "../src/modules/telemetry/context";
import {
  buildAuthHeader,
  buildEnvelope,
  buildEvent,
  collectCauses,
  normalizeMessage,
  parseStack,
  type SentryEvent,
  scrubMessage,
  toError,
} from "../src/modules/telemetry/event";
import {
  type CaptureOptions,
  classifyLevel,
  createGmFetchFailureHandler,
  createReporter,
  isExpectedError,
  toPublicHost,
} from "../src/modules/telemetry/reporter";
import { categorizeFailure } from "../src/utils/errors";

describe("parseStack", () => {
  test("parses V8 frames oldest-first and hides page files", () => {
    const stack = [
      "Error: boom",
      "    at inner (chrome-extension://abcdef/userscript.html?name=VOT:10:5)",
      "    at https://example.com/private-video/SECRETID/b.js:20:7",
    ].join("\n");

    expect(parseStack(stack)).toEqual([
      { filename: "<page>", lineno: 20, colno: 7 },
      {
        filename: "chrome-extension://extension/userscript.html",
        function: "inner",
        lineno: 10,
        colno: 5,
        in_app: true,
      },
    ]);
  });

  test("parses Firefox frames and strips extension uuids", () => {
    const stack = [
      "inner@moz-extension://1234-abcd/content.js:3:9",
      "@https://example.com/b.js:4:1",
    ].join("\n");

    expect(parseStack(stack)).toEqual([
      { filename: "<page>", lineno: 4, colno: 1 },
      {
        filename: "moz-extension://extension/content.js",
        function: "inner",
        lineno: 3,
        colno: 9,
        in_app: true,
      },
    ]);
  });

  test("keeps only recognizable VOT files", () => {
    const filenames = [
      "safari-web-extension://UUID/content.js",
      "app:///vot.user.js",
      "user-script:1/vot.user.js",
      "blob:https://example.com/SECRETID",
      "file:///C:/Users/me/secret/vot.js",
      "<anonymous>",
      "eval",
    ].map((file) => parseStack(`    at fn (${file}:1:2)`)[0]);

    expect(filenames.map((frame) => frame.filename)).toEqual([
      "safari-web-extension://extension/content.js",
      "app:///vot.user.js",
      "user-script:1/vot.user.js",
      "<page>",
      "<page>",
      "<page>",
      "<page>",
    ]);
    expect(filenames.map((frame) => frame.in_app)).toEqual([
      true,
      true,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  test("scrubs urls from function names", () => {
    const [frame] = parseStack("    at https://a.b/SECRET (app:///x.js:1:2)");

    expect(frame.function).toBe("<url>");
  });

  test("returns no frames for unparsable input", () => {
    expect(parseStack(undefined)).toEqual([]);
    expect(parseStack("nothing useful here")).toEqual([]);
  });
});
describe("event building", () => {
  const context = {
    version: "1.2.3",
    environment: "dev",
    tags: { runtime: "userscript", host: "example.com" },
  };

  test("wraps non-Error values", () => {
    const error = toError("plain failure");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("plain failure");
  });

  test("builds a sentry event without leaking urls", () => {
    const error = new Error("failed https://example.com/watch?v=secret now");
    const event = buildEvent(error, context);

    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(event.release).toBe("vot@1.2.3");
    expect(event.environment).toBe("dev");
    expect(event.exception.values[0].type).toBe("Error");
    expect(event.exception.values[0].value).toBe("failed <url> now");
  });

  test("omits stacktrace when the stack is unparsable", () => {
    const error = new Error("no stack");
    error.stack = "garbage";

    expect(buildEvent(error, context).exception.values[0]).not.toHaveProperty(
      "stacktrace",
    );
  });

  test("builds a three-line envelope", () => {
    const event = buildEvent(new Error("x"), context);
    const [header, item, payload] = buildEnvelope(event).split("\n");

    expect(JSON.parse(header)).toMatchObject({
      event_id: event.event_id,
      dsn: "https://fc1094f48d7348878978df534e30c96d@ingest.nirel.cc/1",
    });
    expect(JSON.parse(item)).toEqual({ type: "event" });
    expect(JSON.parse(payload).event_id).toBe(event.event_id);
  });

  test("builds the auth header", () => {
    expect(buildAuthHeader("1.2.3")).toBe(
      "Sentry sentry_version=7, sentry_key=fc1094f48d7348878978df534e30c96d, sentry_client=vot/1.2.3",
    );
  });
});

describe("cause chain", () => {
  const context = { version: "1", environment: "dev", tags: {} };

  test("orders root cause first and outermost last", () => {
    const root = new TypeError("root https://example.com/a?id=1");
    const middle = new Error("middle", { cause: root });
    const top = new Error("top", { cause: middle });

    const values = buildEvent(top, context).exception.values;

    expect(values.map((value) => value.type)).toEqual([
      "TypeError",
      "Error",
      "Error",
    ]);
    expect(values.map((value) => value.value)).toEqual([
      "root <url>",
      "middle",
      "top",
    ]);
  });

  test("wraps non-Error causes without a stacktrace", () => {
    const top = new Error("top", { cause: "string cause" });
    const [cause] = buildEvent(top, context).exception.values;

    expect(cause).toEqual({ type: "Error", value: "string cause" });
  });

  test("stops on cycles", () => {
    const a = new Error("a");
    const b = new Error("b", { cause: a });
    (a as { cause?: unknown }).cause = b;

    expect(collectCauses(b)).toEqual([a, b]);
  });

  test("caps the chain depth", () => {
    let error = new Error("0");
    for (let i = 1; i < 20; i++) error = new Error(String(i), { cause: error });

    expect(collectCauses(error)).toHaveLength(6);
  });
});

describe("fingerprint", () => {
  test("normalizes urls, ids and numbers", () => {
    expect(
      normalizeMessage(
        "Failed https://a.b/c?x=1 for 550e8400-e29b-41d4-a716-446655440000 / dQw4w9WgXcQ0 / abcdef1234 after 30s",
      ),
    ).toBe("Failed <url> for <id> / dQw<n>w<n>WgXcQ<n> / <id> after <n>s");
  });

  test("leaves plain words untouched", () => {
    expect(normalizeMessage("deadbeef is not a decoded id")).toBe(
      "deadbeef is not a decoded id",
    );
  });

  test("uses name, source, service and message and omits missing parts", () => {
    const error = new Error("timeout after 15000 ms");

    expect(
      buildEvent(error, {
        version: "1",
        environment: "dev",
        tags: { source: "translation", service: "youtube" },
      }).fingerprint,
    ).toEqual(["Error", "translation", "youtube", "timeout after <n> ms"]);

    expect(
      buildEvent(error, { version: "1", environment: "dev", tags: {} })
        .fingerprint,
    ).toEqual(["Error", "timeout after <n> ms"]);
  });
});

describe("tags and contexts", () => {
  const env = {
    build: "userscript-min",
    host: "www.youtube.com",
    inIframe: false,
    browser: { name: "Chrome", version: "141.0.0" },
    os: { name: "Windows", version: "10" },
    scriptHandler: "Tampermonkey",
    scriptHandlerVersion: "5.4.0",
  };

  test("builds environment tags", () => {
    expect(buildEnvironmentTags(env)).toEqual({
      build: "userscript-min",
      host: "www.youtube.com",
      in_iframe: "false",
      browser: "Chrome 141.0.0",
      script_handler: "Tampermonkey",
      script_handler_version: "5.4.0",
    });
  });

  test("omits unavailable environment tags", () => {
    const tags = buildEnvironmentTags({
      ...env,
      browser: {},
      scriptHandler: undefined,
      scriptHandlerVersion: undefined,
    });

    expect(tags).not.toHaveProperty("browser");
    expect(tags).not.toHaveProperty("script_handler");
    expect(tags).not.toHaveProperty("script_handler_version");
  });

  test("builds browser and os contexts", () => {
    expect(buildContexts(env)).toEqual({
      browser: { name: "Chrome", version: "141.0.0" },
      os: { name: "Windows", version: "10" },
    });
    expect(buildContexts({ browser: {}, os: { name: "Linux" } })).toEqual({
      os: { name: "Linux" },
    });
  });

  test("builds whitelisted translation tags", () => {
    const handler = {
      site: { host: "twitch", url: "https://twitch.tv/secret" },
      data: {
        newAudioPlayer: true,
        translateProxyEnabled: 2,
        proxyWorkerHost: "worker.example.com",
        account: { token: "secret" },
      },
      videoData: { isStream: true, videoId: "abc123" },
    };

    const tags = getTranslationTags(handler, { from: "en", to: "ru" });

    expect(tags).toEqual({
      service: "twitch",
      from_lang: "en",
      to_lang: "ru",
      proxy_mode: "proxy-full",
      audio_player: "web-audio",
      is_stream: "true",
    });
    expect(JSON.stringify(tags)).not.toMatch(/secret|worker|abc123/);
  });

  test("tolerates a handler without state", () => {
    expect(getTranslationTags({})).toEqual({});
  });

  test("includes tags and contexts in the event", () => {
    const event = buildEvent(new Error("x"), {
      version: "1",
      environment: "dev",
      tags: { source: "playback", operation: "translateFunc" },
      contexts: buildContexts(env),
    });

    expect(event.tags).toEqual({
      source: "playback",
      operation: "translateFunc",
    });
    expect(event.contexts?.browser?.name).toBe("Chrome");
    expect(event.contexts?.os?.name).toBe("Windows");
  });
});

function votError(message: string): Error {
  const error = new Error(message);
  error.name = "VOTJSError";
  return error;
}

describe("classifyLevel", () => {
  test("downgrades only the Yandex translation refusal", () => {
    expect(classifyLevel(votError("Yandex couldn't translate video"))).toBe(
      "warning",
    );
    expect(classifyLevel(votError("Audio link wasn't received"))).toBe("error");
    expect(
      classifyLevel(new TypeError("Yandex couldn't translate video")),
    ).toBe("error");
    expect(classifyLevel("Yandex couldn't translate video")).toBe("error");
    expect(classifyLevel(null)).toBe("error");
  });
});

describe("reporter", () => {
  const options: CaptureOptions = { source: "translation" };

  function setup(enabled = true) {
    const sent: SentryEvent[] = [];
    const report = createReporter({
      isEnabled: async () => enabled,
      getRuntimeInfo: () => ({
        version: "1",
        environment: "dev",
        env: {
          build: "userscript",
          host: "example.com",
          inIframe: false,
          browser: {},
          os: {},
        },
      }),
      send: async (event) => {
        sent.push(event);
      },
    });
    return { sent, report };
  }

  test("dedupes identical name and message by default", async () => {
    const { sent, report } = setup();
    await report(new Error("same"), options);
    await report(new Error("same"), options);

    expect(sent).toHaveLength(1);
  });

  test("dedupe: false bypasses dedupe", async () => {
    const { sent, report } = setup();
    await report(new Error("same"), { ...options, dedupe: false });
    await report(new Error("same"), { ...options, dedupe: false });

    expect(sent).toHaveLength(2);
  });

  test("dedupe: false still respects the session cap", async () => {
    const { sent, report } = setup();
    for (let i = 0; i < 30; i++) {
      await report(new Error("same"), { ...options, dedupe: false });
    }

    expect(sent).toHaveLength(20);
  });

  test("respects the sendErrorReports setting", async () => {
    const { sent, report } = setup(false);
    await report(new Error("x"), { ...options, dedupe: false });

    expect(sent).toHaveLength(0);
  });

  test("errors while disabled do not consume dedupe or cap budget", async () => {
    let enabled = false;
    const sent: SentryEvent[] = [];
    const report = createReporter({
      isEnabled: async () => enabled,
      getRuntimeInfo: () => ({
        version: "1",
        environment: "dev",
        env: {
          build: "userscript",
          host: "example.com",
          inIframe: false,
          browser: {},
          os: {},
        },
      }),
      send: async (event) => {
        sent.push(event);
      },
    });
    const error = new Error("same");

    await report(error, options);
    for (let i = 0; i < 30; i++) await report(new Error(`n${i}`), options);
    enabled = true;
    await report(error, options);

    expect(sent).toHaveLength(1);
  });

  test("does not resend an already captured error object", async () => {
    const { sent, report } = setup();
    const error = new Error("network");
    await report(error, { ...options, dedupe: false });
    await report(error, { ...options, dedupe: false });

    expect(sent).toHaveLength(1);
  });

  test("does not resend an error wrapping a captured one", async () => {
    const { sent, report } = setup();
    const root = new Error("root");
    await report(new Error("outer", { cause: root }), options);
    await report(new Error("other", { cause: root }), options);

    expect(sent).toHaveLength(1);
  });

  test("sends the same error for different video keys", async () => {
    const { sent, report } = setup();
    await report(new Error("same"), { ...options, dedupeKey: "video-a" });
    await report(new Error("same"), { ...options, dedupeKey: "video-b" });

    expect(sent).toHaveLength(2);
  });

  test("dedupes the same error for the same video key", async () => {
    const { sent, report } = setup();
    await report(new Error("same"), { ...options, dedupeKey: "video-a" });
    await report(new Error("same"), { ...options, dedupeKey: "video-a" });

    expect(sent).toHaveLength(1);
  });

  test("never puts the video key into the event", async () => {
    const { sent, report } = setup();
    await report(new Error("boom"), {
      ...options,
      dedupeKey: "SECRETvideo1",
      tags: { service: "youtube" },
    });

    expect(sent).toHaveLength(1);
    expect(buildEnvelope(sent[0])).not.toContain("SECRETvideo1");
  });

  test("does not report the same object twice across video keys", async () => {
    const { sent, report } = setup();
    const error = new Error("shared");
    await report(error, { ...options, dedupeKey: "video-a" });
    await report(error, { ...options, dedupeKey: "video-a" });

    expect(sent).toHaveLength(1);
  });

  test("sends Yandex refusals as warnings and others as errors", async () => {
    const { sent, report } = setup();
    await report(votError("Yandex couldn't translate video"), options);
    await report(votError("Failed to request video translation"), options);
    await report(new Error("Yandex couldn't translate video"), options);

    expect(sent.map((event) => event.level)).toEqual([
      "warning",
      "error",
      "error",
    ]);
  });

  test("does not resend a captured non-Error object", async () => {
    const { sent, report } = setup();
    const thrown = { message: "plain object" };
    await report(thrown, { ...options, dedupe: false });
    await report(thrown, { ...options, dedupe: false });

    expect(sent).toHaveLength(1);
  });
});

describe("GM_fetch failure handler", () => {
  const failure = {
    error: new Error("All GM approaches failed"),
    method: "GET",
    attempts: [
      {
        approach: "GM_xmlhttpRequest" as const,
        category: "timeout",
      },
    ],
  };

  test("reports with network source, public host, method and attempt categories", () => {
    const calls: [unknown, CaptureOptions][] = [];
    const handler = createGmFetchFailureHandler((error, options) =>
      calls.push([error, options]),
    );

    handler({ ...failure, host: "api.browser.yandex.ru" });

    expect(calls).toHaveLength(1);
    const [error, options] = calls[0];
    expect(error).toBe(failure.error);
    expect(options).toEqual({
      source: "network",
      operation: "GM_fetch",
      dedupe: false,
      tags: { request_host: "api.browser.yandex.ru", request_method: "GET" },
      extra: { attempts: ["GM_xmlhttpRequest: timeout"] },
    });
  });

  test("hides custom hosts", () => {
    const calls: [unknown, CaptureOptions][] = [];
    const handler = createGmFetchFailureHandler((error, options) =>
      calls.push([error, options]),
    );

    handler({ ...failure, host: "my-private-proxy.example.org" });

    expect(calls[0][1].tags?.request_host).toBe("other");
    expect(JSON.stringify(calls[0][1])).not.toContain("private");
  });

  test("never reports failures of the reporter's own request", () => {
    const calls: unknown[] = [];
    const handler = createGmFetchFailureHandler((error) => calls.push(error));

    handler({ ...failure, host: "ingest.nirel.cc" });

    expect(calls).toHaveLength(0);
  });
});

describe("toPublicHost", () => {
  test("keeps known hosts and collapses subdomains", () => {
    expect(toPublicHost("api.browser.yandex.ru")).toBe("api.browser.yandex.ru");
    expect(toPublicHost("vot-worker.eu.cc")).toBe("vot-worker.eu.cc");
    expect(toPublicHost("rr3---sn-abc.googlevideo.com")).toBe(
      "googlevideo.com",
    );
  });

  test("hides unknown hosts and tolerates a missing one", () => {
    expect(toPublicHost("proxy.example.org")).toBe("other");
    expect(toPublicHost("notyoutube.com")).toBe("other");
    expect(toPublicHost(undefined)).toBeUndefined();
  });
});

describe("scrubMessage", () => {
  test("hides parsed response bodies from JSON errors", () => {
    expect(
      scrubMessage(`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`),
    ).toBe("Unexpected token '<', <body> is not valid JSON");
  });

  test("hides urls", () => {
    expect(scrubMessage("GET https://a.b/c?token=x failed")).toBe(
      "GET <url> failed",
    );
  });
});

describe("isExpectedError", () => {
  function named(name: string, message: string): Error {
    const error = new Error(message);
    error.name = name;
    return error;
  }

  test("skips unsupported-link video data errors only", () => {
    expect(
      isExpectedError(named("VideoDataError", 'Entered unsupported link: "x"')),
    ).toBe(true);
    expect(
      isExpectedError(named("VideoDataError", "Not found video URL in assets")),
    ).toBe(false);
    expect(
      isExpectedError(named("VideoHelperError", "Entered unsupported link")),
    ).toBe(false);
  });

  test("skips localized and abort errors but not regular ones", () => {
    expect(isExpectedError(named("VOTLocalizedError", "x"))).toBe(true);
    expect(isExpectedError(named("AbortError", "x"))).toBe(true);
    expect(isExpectedError(new Error("x"))).toBe(false);
    expect(isExpectedError(null)).toBe(false);
  });
});

describe("OrangeMonkey illegal invocation", () => {
  function setup(scriptHandler: string | undefined) {
    const sent: SentryEvent[] = [];
    const report = createReporter({
      isEnabled: async () => true,
      getRuntimeInfo: () => ({
        version: "1",
        environment: "dev",
        env: {
          build: "userscript",
          host: "example.com",
          inIframe: false,
          browser: {},
          os: {},
          scriptHandler,
        },
      }),
      send: async (event) => {
        sent.push(event);
      },
    });
    return { sent, report };
  }
  const options: CaptureOptions = { source: "translation" };

  test("is not reported", async () => {
    const { sent, report } = setup("OrangeMonkey");

    await report(new TypeError("Illegal invocation"), options);

    expect(sent).toHaveLength(0);
  });

  test("matches the handler name case-insensitively", async () => {
    const { sent, report } = setup("Orange Monkey");

    await report(new TypeError("Illegal invocation"), options);

    expect(sent).toHaveLength(0);
  });

  test("is reported on other script managers", async () => {
    for (const handler of ["Tampermonkey", "Violentmonkey", undefined]) {
      const { sent, report } = setup(handler);

      await report(new TypeError("Illegal invocation"), options);

      expect(sent).toHaveLength(1);
    }
  });

  test("does not hide other errors on OrangeMonkey", async () => {
    const { sent, report } = setup("OrangeMonkey");

    await report(new TypeError("x is not a function"), options);
    await report(new Error("Illegal invocation"), options);

    expect(sent).toHaveLength(2);
  });
});

describe("redactedMessage", () => {
  const options: CaptureOptions = { source: "auth", operation: "exchangeCode" };

  function setup() {
    const sent: SentryEvent[] = [];
    const report = createReporter({
      isEnabled: async () => true,
      getRuntimeInfo: () => ({
        version: "1",
        environment: "dev",
        env: {
          build: "userscript",
          host: "example.com",
          inIframe: false,
          browser: {},
          os: {},
        },
      }),
      send: async (event) => {
        sent.push(event);
      },
    });
    return { sent, report };
  }

  test("replaces the message, drops causes and keeps name and stack", async () => {
    const { sent, report } = setup();
    const cause = new Error("cause with SECRETTOKEN");
    const error = new TypeError("bad SECRETTOKEN", { cause });

    await report(error, { ...options, redactedMessage: "Fixed message" });

    const [value, ...rest] = sent[0].exception.values;
    expect(rest).toHaveLength(0);
    expect(value.type).toBe("TypeError");
    expect(value.value).toBe("Fixed message");
    expect(value.stacktrace?.frames.length).toBeGreaterThan(0);
    expect(buildEnvelope(sent[0])).not.toContain("SECRETTOKEN");
  });

  test("dedupes on the redacted message", async () => {
    const { sent, report } = setup();
    const redactedMessage = "Fixed message";

    await report(new Error("token one"), { ...options, redactedMessage });
    await report(new Error("token two"), { ...options, redactedMessage });

    expect(sent).toHaveLength(1);
  });

  test("drops an error re-captured by an outer init hook", async () => {
    const { sent, report } = setup();
    const error = new Error("auto translation failed");

    await report(error, { source: "translation", operation: "translateVideo" });
    await report(error, { source: "init", operation: "setCanPlay" });

    expect(sent).toHaveLength(1);
    expect(sent[0].tags.source).toBe("translation");
  });
});

describe("proxy_mode", () => {
  test("is omitted when the settings are unknown", () => {
    expect(getTranslationTags({ site: { host: "youtube" } })).toEqual({
      service: "youtube",
    });
  });

  test("maps known modes", () => {
    expect(
      getTranslationTags({ data: { translateProxyEnabled: 0 } }).proxy_mode,
    ).toBe("direct");
  });
});

describe("audio failure helpers", () => {
  class MediaError {
    constructor(readonly code: number) {}
  }

  test("categorizeFailure returns fixed labels only", () => {
    expect(categorizeFailure({ status: 403 })).toBe("status:403");
    expect(categorizeFailure(new Error("HTTP 429"))).toBe("status:429");
    expect(categorizeFailure(new Error("Timeout"))).toBe("timeout");
    expect(categorizeFailure("Failed to fetch audio file")).toBe("network");
    expect(categorizeFailure({ error: "aborted" })).toBe("abort");
    expect(categorizeFailure(new Error("secret https://a.b/SECRETID"))).toBe(
      "unknown",
    );
    expect(categorizeFailure(undefined)).toBe("unknown");
  });

  test("getMediaErrorCode reads MediaError and error events", () => {
    expect(getMediaErrorCode(new MediaError(4))).toBe(4);
    expect(getMediaErrorCode({ error: new MediaError(3) })).toBe(3);
    expect(getMediaErrorCode({ code: 4 })).toBeUndefined();
    expect(getMediaErrorCode(new MediaError(9))).toBeUndefined();
    expect(getMediaErrorCode(null)).toBeUndefined();
  });

  test("getAudioFailureTags never includes the message", () => {
    const tags = getAudioFailureTags(
      Object.assign(new Error("HTTP 403 https://a.b/SECRETID"), {}),
      "download",
    );

    expect(tags).toEqual({
      audio_stage: "download",
      audio_failure: "status:403",
    });
    expect(
      getAudioFailureTags(new MediaError(4), "playback").media_error_code,
    ).toBe("4");
  });

  test("autoplay blocks are expected, other play errors are not", () => {
    const named = (name: string) => Object.assign(new Error("x"), { name });

    expect(isExpectedError(named("NotAllowedError"))).toBe(true);
    expect(isExpectedError(named("NotSupportedError"))).toBe(false);
  });
});

describe("getSessionFailureTags", () => {
  const votError = (data: unknown) =>
    Object.assign(new Error("Failed to request create session"), { data });

  test("categorizes transport errors from the response data", () => {
    expect(
      getSessionFailureTags(
        votError({ success: false, data: "Failed to fetch" }),
        "video-translation",
      ),
    ).toEqual({
      session_module: "video-translation",
      session_failure: "network",
    });
    expect(
      getSessionFailureTags(
        votError({ success: false, data: "The operation was aborted" }),
        "video-translation",
      ).session_failure,
    ).toBe("abort");
  });

  test("never reads response bodies and hides unknown modules", () => {
    const tags = getSessionFailureTags(
      votError({ success: false, data: new ArrayBuffer(8) }),
      "SECRET-module",
    );

    expect(tags).toEqual({
      session_module: "other",
      session_failure: "bad_response",
    });
  });

  test("falls back to the error itself without response data", () => {
    expect(
      getSessionFailureTags(new Error("Timeout"), "neuroapi").session_failure,
    ).toBe("timeout");
  });
});

describe("selectStrategyFailuresToReport", () => {
  const sabr = { strategy: "web_sabr", error: new Error("Timeout") };
  const abr = { strategy: "web_abr", error: new Error("boom") };
  const mse = { strategy: "web_mse_proxy", error: new Error("boom2") };

  test("reports every failure as recovered when the download succeeded", () => {
    expect(selectStrategyFailuresToReport([sabr, abr], true)).toEqual([
      { ...sabr, recovered: true },
      { ...abr, recovered: true },
    ]);
  });

  test("leaves the last failure to the final event when all failed", () => {
    expect(selectStrategyFailuresToReport([sabr, abr, mse], false)).toEqual([
      { ...sabr, recovered: false },
      { ...abr, recovered: false },
    ]);
    expect(selectStrategyFailuresToReport([sabr], false)).toEqual([]);
    expect(selectStrategyFailuresToReport([], true)).toEqual([]);
  });

  test("skips aborted attempts", () => {
    const aborted = { strategy: "web_abr", error: new Error("aborted") };

    expect(selectStrategyFailuresToReport([aborted, sabr], true)).toEqual([
      { ...sabr, recovered: true },
    ]);
  });
});

describe("level override", () => {
  test("forces the level over the classifier", async () => {
    const sent: SentryEvent[] = [];
    const report = createReporter({
      isEnabled: async () => true,
      getRuntimeInfo: () => ({
        version: "1",
        environment: "dev",
        env: {
          build: "userscript",
          host: "example.com",
          inIframe: false,
          browser: {},
          os: {},
        },
      }),
      send: async (event) => {
        sent.push(event);
      },
    });

    await report(new Error("x"), { source: "audio", level: "warning" });

    expect(sent[0].level).toBe("warning");
  });
});
