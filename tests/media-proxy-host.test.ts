import { describe, expect, test } from "bun:test";

import { MEDIA_PROXY_HOST } from "../src/config/config";

async function normalize(input?: string | null) {
  Object.defineProperty(globalThis, "DEBUG_MODE", {
    configurable: true,
    writable: true,
    value: false,
  });
  const { normalizeMediaProxyHost } = await import(
    "../src/videoHandler/modules/proxyShared"
  );
  return normalizeMediaProxyHost(input);
}

describe("normalizeMediaProxyHost", () => {
  test.each([
    ["proxy.example.org", "proxy.example.org"],
    ["  Proxy.Example.org  ", "proxy.example.org"],
    ["https://proxy.example.org/", "proxy.example.org"],
    ["proxy.example.org:8443", "proxy.example.org:8443"],
    ["proxy.example.org:443", "proxy.example.org"],
    ["127.0.0.1:8080", "127.0.0.1:8080"],
    ["[::1]:8080", "[::1]:8080"],
    ["localhost", "localhost"],
    ["прокси.рф", "xn--h1adldfi.xn--p1ai"],
  ])("accepts %p", async (input, expected) => {
    expect(await normalize(input)).toBe(expected);
  });

  test.each([
    "",
    "   ",
    null,
    undefined,
    "http://proxy.example.org",
    "proxy.example.org/path",
    "proxy.example.org//",
    "proxy.example.org?x=1",
    "proxy.example.org#x",
    "user:pass@proxy.example.org",
    "proxy example.org",
    "proxy.example.org:99999",
  ])("falls back to the default for %p", async (input) => {
    expect(await normalize(input)).toBe(MEDIA_PROXY_HOST);
  });
});
