import { describe, expect, test } from "bun:test";
import { categorizeFailure } from "../src/utils/errors";

describe("categorizeFailure", () => {
  test("generic TypeError returns error name", () => {
    expect(categorizeFailure(new TypeError("something broken"))).toBe(
      "TypeError",
    );
  });

  test("network failures", () => {
    expect(categorizeFailure(new TypeError("Failed to fetch"))).toBe("network");
  });

  test("status extraction", () => {
    expect(categorizeFailure(new Error("player request failed (403)"))).toBe(
      "status:403",
    );
    expect(categorizeFailure({ status: 404 })).toBe("status:404");
    expect(categorizeFailure({ status: 200 })).toBe("unknown");
    expect(
      categorizeFailure(new Error("Audio format (140) not available")),
    ).not.toBe("status:140");
  });

  test("timeout and stall messages", () => {
    expect(categorizeFailure(new Error("timed out"))).toBe("timeout");
    expect(categorizeFailure(new Error("stall"))).toBe("timeout");
    expect(categorizeFailure(new Error("stalled"))).toBe("timeout");
    expect(categorizeFailure(new Error("stalling"))).toBe("timeout");
    expect(categorizeFailure(new Error("time: out of memory"))).not.toBe(
      "timeout",
    );
  });

  test("SABR no audio track", () => {
    expect(
      categorizeFailure(new Error("SABR found no VOT-supported audio track")),
    ).toBe("no_audio_track");
  });

  test("VOTJSError handling", () => {
    expect(
      categorizeFailure(
        Object.assign(new Error("audio request failed"), {
          name: "VOTJSError",
          data: { data: "network error" },
        }),
      ),
    ).toBe("network");
    expect(
      categorizeFailure(
        Object.assign(new Error("audio request failed"), {
          name: "VOTJSError",
        }),
      ),
    ).toBe("VOTJSError");
  });

  test("abort handling", () => {
    expect(categorizeFailure(new DOMException("aborted", "AbortError"))).toBe(
      "abort",
    );
    expect(
      categorizeFailure(
        Object.assign(new Error("aborted"), {
          code: 1,
          name: "MediaError",
        }),
      ),
    ).toBe("abort");
    expect(categorizeFailure({ code: 1 })).not.toBe("abort");
  });

  test("name sanitization and unknown fallback", () => {
    expect(categorizeFailure(null)).toBe("unknown");
    expect(categorizeFailure(undefined)).toBe("unknown");
    expect(categorizeFailure(new Error("unmatched message"))).toBe("unknown");
    expect(
      categorizeFailure(
        Object.assign(new Error("x"), { name: "A".repeat(100) }),
      ),
    ).toBe("unknown");
  });
});
