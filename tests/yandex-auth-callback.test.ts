import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { memoryStorage } from "./helpers/storage";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage(),
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: memoryStorage(),
});

const { updateAccountByCallbackData } = await import(
  "../src/modules/auth/yandex"
);

const originalFetch = globalThis.fetch;
let tokenRequests: string[] = [];

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

function stubFetch(handleToken: (code: string) => Response) {
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    if (init?.method === "POST") {
      const code = new URLSearchParams(String(init.body)).get("code") ?? "";
      tokenRequests.push(code);
      return handleToken(code);
    }
    return jsonResponse({ login: "user", default_avatar_id: "avatar" });
  }) as typeof fetch;
}

const grantToken = () =>
  jsonResponse({ access_token: "token", expires_in: 3600 });

const rejectGrant = () =>
  new Response(
    JSON.stringify({
      error: "invalid_grant",
      error_description: "Code has expired",
    }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );

describe("updateAccountByCallbackData", () => {
  beforeEach(() => {
    tokenRequests = [];
    sessionStorage.setItem("votYandexState", "state");
    sessionStorage.setItem("votYandexCodeVerifier", "verifier");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("shares one token exchange between concurrent and later calls with the same code", async () => {
    stubFetch(grantToken);
    const data = { state: "state", code: "code-1" };

    await Promise.all([
      updateAccountByCallbackData(data),
      updateAccountByCallbackData(data),
      updateAccountByCallbackData(data),
    ]);
    await updateAccountByCallbackData(data);

    expect(tokenRequests).toEqual(["code-1"]);
  });

  test("shares a rejection but still exchanges a different code afterwards", async () => {
    stubFetch((code) => (code === "code-2" ? rejectGrant() : grantToken()));
    sessionStorage.setItem("votYandexState", "state-2");
    const failing = { state: "state-2", code: "code-2" };

    const results = await Promise.allSettled([
      updateAccountByCallbackData(failing),
      updateAccountByCallbackData(failing),
    ]);
    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(tokenRequests).toEqual(["code-2"]);

    sessionStorage.setItem("votYandexState", "state-3");
    await updateAccountByCallbackData({ state: "state-3", code: "code-3" });
    expect(tokenRequests).toEqual(["code-2", "code-3"]);
  });

  test("still rejects an invalid state without sending a request", async () => {
    stubFetch(grantToken);

    await expect(
      updateAccountByCallbackData({ state: "wrong", code: "code-4" }),
    ).rejects.toThrow("[VOT] Invalid state value");
    expect(tokenRequests).toEqual([]);
  });
});
