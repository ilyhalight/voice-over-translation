import { afterEach, expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const MESSAGE_TYPE = "get-audio-chunks-by-mse-in-main-world";
const READY_MESSAGE_TYPE = "vot-mse-proxy-ready";
const BOOT_KEY = "__VOT_MSE_PROXY_HANDLER__";
const IFRAME_ORIGIN = "https://www.youtube.com";
const VIDEO_ID = "dQw4w9WgXcQ";

const { initMseProxyHandler } = await import(
  "../src/audioDownloader/strategies/mseProxyHandler"
);
const { getAudioFromBridge } = await import(
  "../src/audioDownloader/strategies/webAudioBridge"
);
const { WEB_MSE_PROXY_STRATEGY } = await import(
  "../src/audioDownloader/strategies/audioStrategy"
);

type AnyMessage = {
  messageId?: string;
  messageType?: string;
  messageDirection?: string;
  payload?: { buffer: Uint8Array; isLastChunk: boolean };
  error?: string;
  isProgress?: boolean;
  isStreamFinished?: boolean;
};
type Listener = (event: {
  data: AnyMessage;
  origin: string;
  source: unknown;
}) => unknown;
type FakeWindow = {
  posted: AnyMessage[];
  postMessage: (message: AnyMessage) => void;
};
type FakeIframe = {
  tabIndex: number;
  id: string;
  src: string;
  removed: boolean;
  style: { cssText: string };
  contentWindow: FakeWindow;
  setAttribute: () => void;
  remove: () => void;
};

const patchedKeys = [
  "location",
  "document",
  "addEventListener",
  "removeEventListener",
  "postMessage",
  "fetch",
] as const;

let restore: (() => void) | undefined;

afterEach(() => {
  restore?.();
  restore = undefined;
});

const tick = (ms = 5) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (condition()) return;
    await tick();
  }
  throw new Error("waitFor timed out");
}

function createFakeWindow(): FakeWindow {
  const fakeWindow: FakeWindow = {
    posted: [],
    postMessage: (message) => {
      fakeWindow.posted.push(message);
    },
  };
  return fakeWindow;
}

/**
 * Turns the test's global object into a fake top page window: a message bus
 * (like `window.postMessage` to self), `location`, a minimal `document`, and
 * a stubbed `fetch` for the embed config request.
 */
function installTopPage(href: string) {
  const url = new URL(href);
  const target = globalThis as unknown as Record<string, unknown>;
  const saved = patchedKeys.map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
  );
  const listeners = new Set<Listener>();
  const iframes: FakeIframe[] = [];
  const posted: { message: AnyMessage; targetOrigin: string }[] = [];

  const emit = (data: AnyMessage, origin: string, source: unknown) => {
    for (const listener of [...listeners]) listener({ data, origin, source });
  };

  const define = (key: string, value: unknown) =>
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  define("location", {
    href: url.href,
    origin: url.origin,
    hostname: url.hostname,
    hash: "",
  });
  define("addEventListener", (type: string, listener: Listener) => {
    if (type === "message") listeners.add(listener);
  });
  define("removeEventListener", (type: string, listener: Listener) => {
    if (type === "message") listeners.delete(listener);
  });
  define("postMessage", (message: AnyMessage, targetOrigin: string) => {
    posted.push({ message, targetOrigin });
    setTimeout(() => emit(message, url.origin, globalThis), 0);
  });
  define("fetch", async () => ({ text: async () => "" }));
  define("document", {
    createElement: () => {
      const iframe: FakeIframe = {
        tabIndex: 0,
        id: "",
        src: "",
        removed: false,
        style: { cssText: "" },
        contentWindow: createFakeWindow(),
        setAttribute: () => {},
        remove: () => {
          iframe.removed = true;
        },
      };
      return iframe;
    },
    body: {
      appendChild: (iframe: FakeIframe) => {
        iframes.push(iframe);
      },
    },
  });

  delete target[BOOT_KEY];
  initMseProxyHandler();

  restore = () => {
    delete target[BOOT_KEY];
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete target[key];
    }
  };

  return { emit, iframes, posted };
}

async function startMseDownload(href: string) {
  const env = installTopPage(href);
  const controller = new AbortController();
  const bridge = await getAudioFromBridge(
    { videoId: VIDEO_ID, signal: controller.signal } as never,
    WEB_MSE_PROXY_STRATEGY,
  );

  const received: { buffer: Uint8Array; isLastChunk: boolean }[] = [];
  const done = (async () => {
    for await (const chunk of bridge.getMediaBuffers()) received.push(chunk);
  })();
  // Avoid unhandled rejections for tests that expect a failure.
  done.catch(() => {});

  await waitFor(() => env.iframes.length > 0);
  const iframe = env.iframes[0];
  env.emit(
    { messageType: READY_MESSAGE_TYPE, messageDirection: "response" },
    IFRAME_ORIGIN,
    iframe.contentWindow,
  );
  await waitFor(() => iframe.contentWindow.posted.length > 0);
  const messageId = iframe.contentWindow.posted[0].messageId as string;

  const fromIframe = (message: AnyMessage) =>
    env.emit(
      {
        messageId,
        messageType: MESSAGE_TYPE,
        messageDirection: "iframe-response",
        ...message,
      },
      IFRAME_ORIGIN,
      iframe.contentWindow,
    );
  const relayed = () =>
    env.posted
      .filter(({ message }) => message.messageDirection === "response")
      .map(({ message, targetOrigin }) => ({ ...message, targetOrigin }));

  return { ...env, iframe, messageId, received, done, fromIframe, relayed };
}

function chunk(value: number, isLastChunk: boolean) {
  return { buffer: new Uint8Array([value]), isLastChunk };
}

test("relays iframe responses to the bridge on m.youtube.com", async () => {
  const session = await startMseDownload(
    `https://m.youtube.com/watch?v=${VIDEO_ID}`,
  );

  expect(session.iframe.src).toContain(`/embed/${VIDEO_ID}`);
  expect(session.iframe.contentWindow.posted[0]).toMatchObject({
    messageType: MESSAGE_TYPE,
    messageDirection: "request",
  });

  session.fromIframe({ isProgress: true });
  session.fromIframe({ payload: chunk(1, false) });
  session.fromIframe({ payload: chunk(2, true) });
  session.fromIframe({ isStreamFinished: true });
  await session.done;

  expect(session.received.map((item) => [...item.buffer])).toEqual([[1], [2]]);
  expect(session.received.map((item) => item.isLastChunk)).toEqual([
    false,
    true,
  ]);

  const relayed = session.relayed();
  expect(relayed.map((message) => message.messageId)).toEqual(
    relayed.map(() => session.messageId),
  );
  expect(
    relayed.map((message) =>
      message.isProgress
        ? "progress"
        : message.isStreamFinished
          ? "finished"
          : "chunk",
    ),
  ).toEqual(["progress", "chunk", "chunk", "finished"]);
  expect(relayed.map((message) => message.targetOrigin)).toEqual(
    relayed.map(() => "https://m.youtube.com"),
  );

  await tick();
  expect(session.iframe.removed).toBe(true);
});

test("relays iframe errors to the bridge and cleans up", async () => {
  const session = await startMseDownload(
    `https://m.youtube.com/watch?v=${VIDEO_ID}`,
  );

  session.fromIframe({ error: "boom" });

  await expect(session.done).rejects.toThrow("boom");
  expect(session.relayed()).toHaveLength(1);
  await tick();
  expect(session.iframe.removed).toBe(true);
});

test("delivers each chunk to the bridge exactly once on www.youtube.com", async () => {
  const session = await startMseDownload(
    `https://www.youtube.com/watch?v=${VIDEO_ID}`,
  );

  session.fromIframe({ isProgress: true });
  session.fromIframe({ payload: chunk(1, false) });
  session.fromIframe({ payload: chunk(2, false) });
  session.fromIframe({ payload: chunk(3, true) });
  session.fromIframe({ isStreamFinished: true });
  await session.done;

  expect(session.received.map((item) => [...item.buffer])).toEqual([
    [1],
    [2],
    [3],
  ]);
  expect(session.relayed().filter((message) => message.payload)).toHaveLength(
    3,
  );
});

test("ignores messages that do not come from the iframe session", async () => {
  const session = await startMseDownload(
    `https://m.youtube.com/watch?v=${VIDEO_ID}`,
  );
  const otherWindow = createFakeWindow();

  // Same payload, but sent by a window other than the iframe's.
  session.emit(
    {
      messageId: session.messageId,
      messageType: MESSAGE_TYPE,
      messageDirection: "iframe-response",
      payload: chunk(9, false),
    },
    IFRAME_ORIGIN,
    otherWindow,
  );
  session.emit(
    {
      messageId: session.messageId,
      messageType: MESSAGE_TYPE,
      messageDirection: "iframe-response",
      isStreamFinished: true,
    },
    IFRAME_ORIGIN,
    otherWindow,
  );
  // Wrong message id, type and direction from the real iframe.
  session.emit(
    {
      messageId: "another-message-id",
      messageType: MESSAGE_TYPE,
      messageDirection: "iframe-response",
      payload: chunk(8, false),
    },
    IFRAME_ORIGIN,
    session.iframe.contentWindow,
  );
  session.emit(
    {
      messageId: session.messageId,
      messageType: "another-message-type",
      messageDirection: "iframe-response",
      payload: chunk(7, false),
    },
    IFRAME_ORIGIN,
    session.iframe.contentWindow,
  );
  session.emit(
    {
      messageId: session.messageId,
      messageType: MESSAGE_TYPE,
      messageDirection: "request",
      payload: chunk(6, false),
    },
    IFRAME_ORIGIN,
    session.iframe.contentWindow,
  );
  await tick(20);

  expect(session.relayed()).toHaveLength(0);
  expect(session.received).toHaveLength(0);
  expect(session.iframe.removed).toBe(false);

  session.fromIframe({ payload: chunk(1, true) });
  session.fromIframe({ isStreamFinished: true });
  await session.done;

  expect(session.received.map((item) => [...item.buffer])).toEqual([[1]]);
  expect(session.relayed()).toHaveLength(2);
});
