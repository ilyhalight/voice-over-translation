import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  BG_MSG_TELEMETRY_CONSENT,
  MARK,
  TYPE_RES,
} from "../src/extension/shared/constants";
import { getDefaultSendErrorReports } from "../src/modules/telemetry/consent";
import { captureGlobal } from "./helpers/globals";

const INGEST_URL = "https://ingest.nirel.cc/api/1/envelope/";

type Globals = { browser?: unknown; VOT_BUILD_VARIANT?: string };
const globals = globalThis as Globals;

let getAll: () => Promise<unknown> = async () => ({});
type BackgroundListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (value: unknown) => void,
) => boolean | undefined;
let backgroundListener: BackgroundListener;

// webext.ts captures the namespace on import, so it is installed only for that.
globals.browser = {
  permissions: { getAll: () => getAll() },
  runtime: {
    onMessage: {
      addListener: (listener: BackgroundListener) => {
        backgroundListener = listener;
      },
    },
    sendMessage: (message: unknown) =>
      new Promise((resolve) => backgroundListener(message, {}, resolve)),
  },
};
const { isTelemetryBlocked, registerBackgroundTelemetryConsent } = await import(
  "../src/extension/background/telemetry-guard"
);
const { handleBridgeRequest } = await import(
  "../src/extension/bridge/request-handler"
);
registerBackgroundTelemetryConsent();
delete globals.browser;

afterEach(() => {
  delete globals.VOT_BUILD_VARIANT;
});

describe("background telemetry guard", () => {
  test("firefox: allows the telemetry host with technicalAndInteraction", async () => {
    globals.VOT_BUILD_VARIANT = "firefox";
    getAll = async () => ({ data_collection: ["technicalAndInteraction"] });

    expect(await isTelemetryBlocked(INGEST_URL)).toBe(false);
    expect(await isTelemetryBlocked("https://sub.ingest.nirel.cc/x")).toBe(
      false,
    );
  });

  test("firefox: blocks the telemetry host without consent", async () => {
    globals.VOT_BUILD_VARIANT = "firefox";

    for (const answer of [
      { data_collection: [] },
      { data_collection: ["healthInfo"] },
      { permissions: [] },
    ]) {
      getAll = async () => answer;
      expect(await isTelemetryBlocked(INGEST_URL)).toBe(true);
    }
  });

  test("firefox: blocks the telemetry host when permissions.getAll fails", async () => {
    globals.VOT_BUILD_VARIANT = "firefox";
    getAll = async () => {
      throw new Error("unavailable");
    };

    expect(await isTelemetryBlocked(INGEST_URL)).toBe(true);
  });

  test("firefox: leaves other hosts alone", async () => {
    globals.VOT_BUILD_VARIANT = "firefox";
    getAll = async () => ({ data_collection: [] });

    expect(await isTelemetryBlocked("https://api.browser.yandex.ru/x")).toBe(
      false,
    );
    expect(await isTelemetryBlocked("https://evil.com/ingest.nirel.cc")).toBe(
      false,
    );
    expect(await isTelemetryBlocked("https://notingest.nirel.cc/x")).toBe(
      false,
    );
  });

  test("other builds are untouched", async () => {
    getAll = async () => ({ data_collection: [] });

    expect(await isTelemetryBlocked(INGEST_URL)).toBe(false);
    for (const variant of ["chrome", "userscript", "userscript-min"]) {
      globals.VOT_BUILD_VARIANT = variant;
      expect(await isTelemetryBlocked(INGEST_URL)).toBe(false);
    }
  });
});

describe("sendErrorReports default", () => {
  const pageWindow = {};
  const origin = "https://www.youtube.com";
  const listeners = new Set<(event: MessageEvent) => void>();
  const pageGlobals = [
    "window",
    "location",
    "addEventListener",
    "removeEventListener",
    "postMessage",
  ];
  let restoreGlobals: (() => void)[];
  let onRequest: (message: Record<string, unknown>) => void;

  function emit(data: unknown, source = pageWindow, eventOrigin = origin) {
    for (const listener of listeners) {
      listener({ data, source, origin: eventOrigin } as MessageEvent);
    }
  }

  beforeEach(() => {
    globals.VOT_BUILD_VARIANT = "firefox";
    getAll = async () => ({ data_collection: [] });
    restoreGlobals = pageGlobals.map(captureGlobal);
    const values = [
      pageWindow,
      { origin },
      (_type: string, listener: (event: MessageEvent) => void) =>
        listeners.add(listener),
      (_type: string, listener: (event: MessageEvent) => void) =>
        listeners.delete(listener),
      (message: Record<string, unknown>, targetOrigin: string) => {
        expect(targetOrigin).toBe(origin);
        expect(message[MARK]).toBe(true);
        expect(message.action).toBe(BG_MSG_TELEMETRY_CONSENT);
        onRequest(message);
      },
    ];
    pageGlobals.forEach((key, index) => {
      Object.defineProperty(globalThis, key, {
        value: values[index],
        configurable: true,
        writable: true,
      });
    });
    onRequest = (message) => {
      void handleBridgeRequest(String(message.action), {}).then((result) => {
        emit({
          [MARK]: true,
          type: TYPE_RES,
          id: message.id,
          ok: true,
          result,
        });
      });
    };
  });

  afterEach(() => {
    for (const restoreGlobal of restoreGlobals) restoreGlobal();
    expect(listeners.size).toBe(0);
    listeners.clear();
  });

  test("Firefox default follows permission through the bridge and background", async () => {
    expect(await getDefaultSendErrorReports()).toBe(false);
    getAll = async () => ({ data_collection: ["technicalAndInteraction"] });
    expect(await getDefaultSendErrorReports()).toBe(true);
    getAll = async () => ({ data_collection: [] });
    expect(await getDefaultSendErrorReports()).toBe(false);
  });

  test("permission API failure defaults to false", async () => {
    getAll = async () => {
      throw new Error("unavailable");
    };
    expect(await getDefaultSendErrorReports()).toBe(false);
  });

  test("bridge failure defaults to false", async () => {
    onRequest = ({ id }) => {
      emit({ [MARK]: true, type: TYPE_RES, id, ok: false, result: true });
    };
    expect(await getDefaultSendErrorReports()).toBe(false);
  });

  test("postMessage failure defaults to false and removes the listener", async () => {
    onRequest = () => {
      throw new Error("unavailable");
    };
    expect(await getDefaultSendErrorReports()).toBe(false);
  });

  test("timeout defaults to false and removes the listener", async () => {
    onRequest = () => {};
    const timer = spyOn(globalThis, "setTimeout").mockImplementationOnce(
      (callback) => {
        queueMicrotask(callback as () => void);
        return 0 as unknown as ReturnType<typeof setTimeout>;
      },
    );
    try {
      expect(await getDefaultSendErrorReports()).toBe(false);
    } finally {
      timer.mockRestore();
    }
  });

  test("ignores responses with another source, origin, ID, or marker", async () => {
    onRequest = ({ id }) => {
      const response = {
        [MARK]: true,
        type: TYPE_RES,
        id,
        ok: true,
        result: true,
      };
      emit(response, {});
      emit(response, pageWindow, "https://example.com");
      emit({ ...response, id: "unrelated" });
      emit({ ...response, [MARK]: false });
      emit({ ...response, result: false });
    };
    expect(await getDefaultSendErrorReports()).toBe(false);
  });

  test("other builds keep true without contacting the bridge", async () => {
    onRequest = () => {
      throw new Error("unexpected bridge request");
    };
    for (const variant of ["chrome", "userscript", "userscript-min"]) {
      globals.VOT_BUILD_VARIANT = variant;
      expect(await getDefaultSendErrorReports()).toBe(true);
    }
    delete globals.VOT_BUILD_VARIANT;
    expect(await getDefaultSendErrorReports()).toBe(true);
  });
});
