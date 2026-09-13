import { expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const { mintGvsPoToken, mintPageWorldPoToken } = await import(
  "../src/audioDownloader/strategies/poToken"
);

type FakeRealm = {
  window: Window;
  /** Source of the script that was injected into the document, if any. */
  injected: () => string | undefined;
  removed: () => boolean;
  reply: (data: Record<string, unknown>) => void;
};

/** A realm carrying only what the minter touches. */
function createRealm(botguardToken?: string): FakeRealm {
  const listeners = new Set<(event: MessageEvent) => void>();
  let injected: { textContent: string; removed: boolean } | undefined;
  const realm: Record<string, unknown> = {
    addEventListener(type: string, listener: (event: MessageEvent) => void) {
      if (type === "message") listeners.add(listener);
    },
    removeEventListener(
      _type: string,
      listener: (event: MessageEvent) => void,
    ) {
      listeners.delete(listener);
    },
    document: {
      documentElement: {
        append(script: { textContent: string }) {
          injected = script as { textContent: string; removed: boolean };
        },
      },
      createElement() {
        const script = {
          textContent: "",
          removed: false,
          remove() {
            script.removed = true;
          },
        };
        return script;
      },
    },
  };
  if (botguardToken) {
    const bevasrs = {
      async wpc() {
        return { async mws() { return botguardToken; } };
      },
    };
    realm.bevasrsg = { bevasrs };
  }
  return {
    window: realm as unknown as Window,
    injected: () => injected?.textContent,
    removed: () => injected?.removed === true,
    reply: (data) => {
      for (const listener of [...listeners]) {
        listener({ data } as MessageEvent);
      }
    },
  };
}

/** Waits for the value a pending promise produces on a later microtask. */
async function waitFor<T>(read: () => T | undefined): Promise<T> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const value = read();
    if (value !== undefined) return value;
    await new Promise((done) => setTimeout(done, 0));
  }
  throw new Error("the value never arrived");
}

function readNonce(source: string): string {
  const nonce = /const nonce = "([^"]+)"/.exec(source)?.[1];
  if (!nonce) throw new Error("the injected script carries no nonce");
  return nonce;
}

test("mints the token in the page realm of a sandboxed userscript realm", async () => {
  const realm = createRealm();
  const pending = mintPageWorldPoToken(
    realm.window,
    "video-binding",
    new AbortController().signal,
  );
  const source = await waitFor(realm.injected);
  // The binding travels with the script, the answer behind a random nonce.
  expect(source).toContain("video-binding");
  realm.reply({ votPoTokenNonce: readNonce(source), token: "page-token" });
  expect(await pending).toBe("page-token");
  // An inline script only has to live long enough to run.
  expect(realm.removed()).toBe(true);
});

test("answers an unrelated message and a failed mint with no token", async () => {
  const realm = createRealm();
  const pending = mintPageWorldPoToken(
    realm.window,
    "video-binding",
    new AbortController().signal,
  );
  const source = await waitFor(realm.injected);
  realm.reply({ votPoTokenNonce: "someone-else", token: "foreign-token" });
  realm.reply({ votPoTokenNonce: readNonce(source), error: "no BotGuard" });
  expect(await pending).toBeUndefined();
});

test("prefers the BotGuard instance of its own realm", async () => {
  const realm = createRealm("realm-token");
  const token = await mintGvsPoToken(
    realm.window,
    "video-binding",
    new AbortController().signal,
  );
  expect(token).toBe("realm-token");
  // Nothing is injected when the realm can mint the token itself.
  expect(realm.injected()).toBeUndefined();
});

test("falls back to the page realm when its own realm is sandboxed", async () => {
  const realm = createRealm();
  const pending = mintGvsPoToken(
    realm.window,
    "video-binding",
    new AbortController().signal,
  );
  const source = await waitFor(realm.injected);
  realm.reply({ votPoTokenNonce: readNonce(source), token: "page-token" });
  expect(await pending).toBe("page-token");
});

test("gives up when the download is aborted", async () => {
  const realm = createRealm();
  const controller = new AbortController();
  const pending = mintPageWorldPoToken(
    realm.window,
    "video-binding",
    controller.signal,
  );
  await waitFor(realm.injected);
  controller.abort();
  expect(await pending).toBeUndefined();
  expect(realm.removed()).toBe(true);
});
