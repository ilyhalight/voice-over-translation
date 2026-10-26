import { describe, expect, test } from "bun:test";
import vm from "node:vm";
import { readDebugIdRegistry } from "../src/modules/telemetry/debug-ids";
import {
  buildEvent,
  type DebugIdEntry,
  type DebugIdRegistry,
} from "../src/modules/telemetry/event";
import { createRegistration } from "../vite/lib/debug-id";

const ID_A = "bf364c45-035a-4648-811e-f44f8f52ee0c";
const ID_B = "4a42a49b-1324-48f7-9970-2843877f6a42";
const context = { version: "1", environment: "dev", tags: {} };

function entry(debugId: string, lineOffset = 0): DebugIdEntry {
  return { debugId, lineOffset };
}

function errorWithStack(stack: string): Error {
  const error = new Error("boom");
  error.stack = `Error: boom\n${stack}`;
  return error;
}

function framesOf(error: Error, debugIds: DebugIdRegistry) {
  return buildEvent(error, { ...context, debugIds }).exception.values[0]
    .stacktrace?.frames;
}

describe("debug_meta", () => {
  test("matches frames to the registry by normalized filename", () => {
    const registry: DebugIdRegistry = new Map([
      ["chrome-extension://extension/assets/a.js", entry(ID_A)],
      ["chrome-extension://extension/assets/b.js", entry(ID_B)],
    ]);
    const error = errorWithStack(
      [
        "    at f (chrome-extension://abc/assets/a.js:1:2)",
        "    at g (chrome-extension://abc/assets/b.js?x=1:3:4)",
        "    at h (chrome-extension://abc/assets/c.js:5:6)",
        "    at https://example.com/page.js:7:8",
      ].join("\n"),
    );

    expect(
      buildEvent(error, { ...context, debugIds: registry }).debug_meta,
    ).toEqual({
      images: [
        {
          type: "sourcemap",
          code_file: "chrome-extension://extension/assets/b.js",
          debug_id: ID_B,
        },
        {
          type: "sourcemap",
          code_file: "chrome-extension://extension/assets/a.js",
          debug_id: ID_A,
        },
      ],
    });
  });

  test("uses the sole registry entry for unmatched in-app frames", () => {
    const registry: DebugIdRegistry = new Map([
      ["user-script:1/vot.user.js", entry(ID_A)],
    ]);
    const error = errorWithStack(
      [
        "    at f (user-script:9/other.user.js:1:2)",
        "    at https://example.com/page.js:7:8",
      ].join("\n"),
    );

    expect(
      buildEvent(error, { ...context, debugIds: registry }).debug_meta?.images,
    ).toEqual([
      {
        type: "sourcemap",
        code_file: "user-script:9/other.user.js",
        debug_id: ID_A,
      },
    ]);
  });

  test("omits debug_meta without a match", () => {
    const error = errorWithStack("    at https://example.com/page.js:7:8");
    const registry: DebugIdRegistry = new Map([
      ["app:///vot.user.js", entry(ID_A)],
    ]);

    expect(buildEvent(error, context)).not.toHaveProperty("debug_meta");
    expect(
      buildEvent(error, { ...context, debugIds: registry }),
    ).not.toHaveProperty("debug_meta");
    expect(
      buildEvent(errorWithStack("    at f (app:///x.js:1:2)"), {
        ...context,
        debugIds: new Map(),
      }),
    ).not.toHaveProperty("debug_meta");
  });

  test("does not use the fallback when several bundles registered", () => {
    const registry: DebugIdRegistry = new Map([
      ["app:///a.js", entry(ID_A, 5)],
      ["app:///b.js", entry(ID_B, 5)],
    ]);
    const error = errorWithStack("    at f (app:///c.js:10:2)");

    const event = buildEvent(error, { ...context, debugIds: registry });
    expect(event).not.toHaveProperty("debug_meta");
    expect(event.exception.values[0].stacktrace?.frames[0].lineno).toBe(10);
  });
});

describe("line offset", () => {
  const stack = [
    "    at f (app:///a.js:12:7)",
    "    at g (app:///b.js:12:7)",
    "    at h (https://example.com/page.js:12:7)",
  ].join("\n");

  test("is subtracted from frames of the matching bundle only", () => {
    const registry: DebugIdRegistry = new Map([
      ["app:///a.js", entry(ID_A, 4)],
      ["app:///b.js", entry(ID_B, 0)],
    ]);

    expect(
      framesOf(errorWithStack(stack), registry)?.map(
        ({ filename, lineno, colno }) => [filename, lineno, colno],
      ),
    ).toEqual([
      ["<page>", 12, 7],
      ["app:///b.js", 12, 7],
      ["app:///a.js", 8, 7],
    ]);
  });

  test("applies to the sole-entry fallback", () => {
    const registry: DebugIdRegistry = new Map([
      ["user-script:1/vot.user.js", entry(ID_A, 10)],
    ]);
    const frames = framesOf(
      errorWithStack(
        [
          "    at f (user-script:9/other.user.js:15:3)",
          "    at https://example.com/page.js:15:3",
        ].join("\n"),
      ),
      registry,
    );

    expect(frames?.map(({ lineno }) => lineno)).toEqual([15, 5]);
  });

  test("leaves a frame unchanged when the result would be below 1", () => {
    const registry: DebugIdRegistry = new Map([
      ["app:///a.js", entry(ID_A, 12)],
    ]);
    const frames = framesOf(
      errorWithStack(
        ["    at f (app:///a.js:12:1)", "    at g (app:///a.js:13:1)"].join(
          "\n",
        ),
      ),
      registry,
    );

    expect(frames?.map(({ lineno }) => lineno)).toEqual([1, 12]);
  });
});

describe("readDebugIdRegistry", () => {
  function register(filename: string, debugId: string, line = 1): object {
    const scope = vm.createContext({});
    new vm.Script(createRegistration(debugId, line), {
      filename,
    }).runInContext(scope);
    return scope;
  }

  test("reads the registration emitted by the build plugin", () => {
    const scope = register("chrome-extension://abcdef/assets/x.js", ID_A);
    const registry = readDebugIdRegistry(scope);

    expect([...registry]).toEqual([
      ["chrome-extension://extension/assets/x.js", entry(ID_A)],
    ]);
  });

  test("never stores the raw extension origin", () => {
    for (const filename of [
      "chrome-extension://abcdefghijklmnop/assets/x.js",
      "moz-extension://1234-abcd/content.module.js",
    ]) {
      const scope = register(filename, ID_A);
      const symbol = Object.getOwnPropertySymbols(scope)[0];
      const keys = Object.keys((scope as Record<symbol, object>)[symbol]);

      expect(keys).toHaveLength(1);
      expect(keys[0]).not.toMatch(/abcdefghijklmnop|1234-abcd/);
    }
  });

  test("keeps the registry out of enumeration and string keys", () => {
    const scope = register("app:///vot.user.js", ID_A);

    expect(Object.keys(scope)).toEqual([]);
    expect(
      Object.getOwnPropertyDescriptor(
        scope,
        Object.getOwnPropertySymbols(scope)[0],
      )?.enumerable,
    ).toBe(false);
  });

  test("ignores malformed and non-vot entries", () => {
    const symbol = Symbol.for("vot.debugIds");
    const scope = {
      [symbol]: {
        "Error\n    at app:///ok.js:3:2": { d: ID_A, l: 3 },
        "Error\n    at https://example.com/page.js:1:2": { d: ID_B, l: 1 },
        "Error\n    at app:///bad.js:1:2": { d: "not-a-uuid", l: 1 },
        "Error\n    at app:///num.js:1:2": 5,
        "Error\n    at app:///str.js:1:2": ID_A,
        "Error\n    at app:///null.js:1:2": null,
        "Error\n    at app:///line-type.js:1:2": { d: ID_A, l: "1" },
        "Error\n    at app:///line-zero.js:1:2": { d: ID_A, l: 0 },
        "Error\n    at app:///line-frac.js:1:2": { d: ID_A, l: 1.5 },
        "Error\n    at app:///no-line.js:1:2": { d: ID_A },
      },
    };

    expect([...readDebugIdRegistry(scope)]).toEqual([
      ["app:///ok.js", entry(ID_A)],
    ]);
    expect(readDebugIdRegistry({}).size).toBe(0);
  });

  test("never reports a negative offset", () => {
    const symbol = Symbol.for("vot.debugIds");
    const scope = {
      [symbol]: { "Error\n    at app:///a.js:2:2": { d: ID_A, l: 9 } },
    };

    expect(readDebugIdRegistry(scope).get("app:///a.js")?.lineOffset).toBe(0);
  });
});

describe("line calibration end to end", () => {
  const LEADING = ["// ==UserScript==", "// ==/UserScript=="];
  const THROWING_LINE = 6;

  // The snippet sits on line 3 and the throwing function on line 6, as in a
  // built userscript; `prefixLines` simulates what a userscript manager adds.
  function runWrapped(prefixLines: number, filename: string) {
    const original = [
      ...LEADING,
      createRegistration(ID_A, LEADING.length + 1),
      "",
      "",
      "function boom() { throw new Error('x'); }",
    ].join("\n");
    const scope = vm.createContext({});
    const script = new vm.Script(`${"\n".repeat(prefixLines)}${original}`, {
      filename,
    });
    script.runInContext(scope);

    let stack = "";
    try {
      vm.runInContext("boom()", scope, { filename: "user-script:run" });
    } catch (error) {
      stack = (error as Error).stack ?? "";
    }
    return { scope, stack };
  }

  for (const prefixLines of [0, 7]) {
    test(`maps frames back to the built file with ${prefixLines} extra lines`, () => {
      const filename = "user-script:1/vot.user.js";
      const { scope, stack } = runWrapped(prefixLines, filename);
      const registry = readDebugIdRegistry(scope);

      expect(registry.get(filename)?.lineOffset).toBe(prefixLines);

      const frames = framesOf(
        errorWithStack(stack.split("\n").slice(1).join("\n")),
        registry,
      )?.filter((frame) => frame.in_app && frame.filename === filename);

      expect(frames?.map(({ lineno }) => lineno)).toEqual([THROWING_LINE]);
    });
  }

  test("keeps lines aligned when the code after the snippet is minified", () => {
    const filename = "user-script:1/vot-min.user.js";
    const original = [
      ...LEADING,
      createRegistration(ID_A, LEADING.length + 1),
      "function boom(){throw Error(`x`)}",
    ].join("\n");
    const scope = vm.createContext({});
    new vm.Script(`${"\n".repeat(20)}${original}`, { filename }).runInContext(
      scope,
    );

    let stack = "";
    try {
      vm.runInContext("boom()", scope, { filename: "user-script:run" });
    } catch (error) {
      stack = (error as Error).stack ?? "";
    }
    const frames = framesOf(
      errorWithStack(stack.split("\n").slice(1).join("\n")),
      readDebugIdRegistry(scope),
    )?.filter((frame) => frame.filename === filename);

    expect(frames?.map(({ lineno }) => lineno)).toEqual([LEADING.length + 2]);
  });
});
