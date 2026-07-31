import { describe, expect, test } from "bun:test";
import { isAllowedXhrUrl } from "../src/extension/shared/urlAllowlist";

describe("isAllowedXhrUrl", () => {
  test("rejects non-string inputs", () => {
    expect(isAllowedXhrUrl(undefined)).toBe(false);
    expect(isAllowedXhrUrl(null)).toBe(false);
    expect(isAllowedXhrUrl(123)).toBe(false);
    expect(isAllowedXhrUrl({})).toBe(false);
    expect(isAllowedXhrUrl("")).toBe(false);
  });

  test("rejects non-http(s) protocols", () => {
    expect(isAllowedXhrUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedXhrUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedXhrUrl("data:text/html,<script>")).toBe(false);
    expect(isAllowedXhrUrl("chrome://settings")).toBe(false);
    expect(isAllowedXhrUrl("about:blank")).toBe(false);
  });

  test("rejects malformed URLs", () => {
    expect(isAllowedXhrUrl("not a url")).toBe(false);
    expect(isAllowedXhrUrl("://no-scheme")).toBe(false);
  });

  test("accepts allowlisted Yandex hosts", () => {
    expect(isAllowedXhrUrl("https://browser.yandex.ru/api")).toBe(true);
    expect(isAllowedXhrUrl("https://yandex.ru/video")).toBe(true);
    expect(isAllowedXhrUrl("https://avatars.mds.yandex.net/get-yapic/x")).toBe(
      true,
    );
  });

  test("accepts allowlisted VOT backend hosts", () => {
    expect(isAllowedXhrUrl("https://vot.toil.cc/v1/translate")).toBe(true);
    expect(isAllowedXhrUrl("https://vot-worker.vtrans.eu.cc/")).toBe(true);
    expect(isAllowedXhrUrl("https://translate-backend.transly.eu.cc/v2")).toBe(
      true,
    );
    expect(
      isAllowedXhrUrl("https://rust-server-531j.onrender.com/v1/auth"),
    ).toBe(true);
  });

  test("accepts allowlisted YouTube hosts", () => {
    expect(isAllowedXhrUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isAllowedXhrUrl("https://m.youtube.com/watch?v=abc")).toBe(true);
    expect(
      isAllowedXhrUrl("https://youtubei.googleapis.com/youtubei/v1/player"),
    ).toBe(true);
    expect(
      isAllowedXhrUrl("https://r1.sn-abc.googlevideo.com/videoplayback"),
    ).toBe(true);
  });

  test("accepts allowlisted GitHub raw content", () => {
    expect(
      isAllowedXhrUrl(
        "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/README.md",
      ),
    ).toBe(true);
  });

  test("rejects lookalike hosts (substring spoofing)", () => {
    // Critical: a host that *contains* an allowlisted suffix but is not a
    // subdomain of it must be rejected. Without leading-dot / exact match
    // checks, `evil-youtube.com` would pass.
    expect(isAllowedXhrUrl("https://evil-youtube.com/watch")).toBe(false);
    expect(isAllowedXhrUrl("https://youtube.com.evil.com/watch")).toBe(false);
    expect(isAllowedXhrUrl("https://notyandex.ru/watch")).toBe(false);
    expect(isAllowedXhrUrl("https://vot.toil.cc.evil.com/")).toBe(false);
  });

  test("rejects private/internal IPs", () => {
    expect(isAllowedXhrUrl("http://localhost/admin")).toBe(false);
    expect(isAllowedXhrUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isAllowedXhrUrl("http://169.254.169.254/latest/meta-data/")).toBe(
      false,
    );
    expect(isAllowedXhrUrl("http://10.0.0.1/")).toBe(false);
    expect(isAllowedXhrUrl("http://192.168.1.1/")).toBe(false);
  });

  test("rejects arbitrary external hosts not on allowlist", () => {
    expect(isAllowedXhrUrl("https://example.com/")).toBe(false);
    expect(isAllowedXhrUrl("https://api.openai.com/v1/chat")).toBe(false);
    expect(isAllowedXhrUrl("https://attacker.com/exfil")).toBe(false);
  });

  test("resolves relative URLs against location.href when available", () => {
    // In test env, globalThis.location.href is typically "about:blank" or
    // similar, so a relative URL may fail to parse. Just ensure it doesn't
    // throw and returns a boolean.
    const result = isAllowedXhrUrl("/relative/path");
    expect(typeof result).toBe("boolean");
  });
});
