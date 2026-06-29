import { describe, expect, test } from "bun:test";

describe("account auth state", () => {
  test("detects expired token", async () => {
    Object.defineProperty(globalThis, "DEBUG_MODE", {
      configurable: true,
      writable: true,
      value: false,
    });
    const { hasAccountToken, hasValidAccountToken, isAccountExpired } =
      await import("../src/utils/account");
    const now = 1_000;
    const account = { token: "token", expires: now - 1 };

    expect(hasAccountToken(account)).toBe(true);
    expect(isAccountExpired(account, now)).toBe(true);
    expect(hasValidAccountToken(account, now)).toBe(false);
  });

  test("keeps manual token without expires valid", async () => {
    Object.defineProperty(globalThis, "DEBUG_MODE", {
      configurable: true,
      writable: true,
      value: false,
    });
    const { hasAccountToken, hasValidAccountToken, isAccountExpired } =
      await import("../src/utils/account");
    const account = { token: "token" };

    expect(hasAccountToken(account)).toBe(true);
    expect(isAccountExpired(account, 1_000)).toBe(false);
    expect(hasValidAccountToken(account, 1_000)).toBe(true);
  });
});
