import { describe, expect, test } from "bun:test";
import { stringifyCircularSafe } from "../src/utils/json";

describe("stringifyCircularSafe", () => {
  test("keeps key order by default and sorts with sortKeys", () => {
    const value = { b: { d: 1, c: 2 }, a: [{ z: 1, y: 2 }] };

    expect(stringifyCircularSafe(value)).toBe(JSON.stringify(value));
    expect(stringifyCircularSafe(value, { sortKeys: true })).toBe(
      '{"a":[{"y":2,"z":1}],"b":{"c":2,"d":1}}',
    );
  });

  test("marks circular references", () => {
    const value: Record<string, unknown> = { b: 1, a: 2 };
    value.self = value;

    expect(stringifyCircularSafe(value)).toBe(
      '{"b":1,"a":2,"self":"[Circular]"}',
    );
    expect(stringifyCircularSafe(value, { sortKeys: true })).toBe(
      '{"a":2,"b":1,"self":"[Circular]"}',
    );
  });

  test("marks repeated non-circular references", () => {
    const shared = { k: 1 };

    expect(stringifyCircularSafe({ p: shared, q: shared })).toBe(
      '{"p":{"k":1},"q":"[Circular]"}',
    );
  });

  test("behaves like JSON.stringify for unsupported values", () => {
    expect(stringifyCircularSafe(undefined)).toBeUndefined();
    expect(() => stringifyCircularSafe({ a: 1n })).toThrow();
  });
});
