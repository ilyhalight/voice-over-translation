import { describe, expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const { setGeneratedSabrAudioTrackId } = await import(
  "../src/audioDownloader/strategies/youtubeSabrSupport"
);

const encoder = new TextEncoder();

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const varint = (value: number): Uint8Array => {
  const out: number[] = [];
  let current = value;
  do {
    let byte = current % 128;
    current = Math.floor(current / 128);
    if (current > 0) byte |= 0x80;
    out.push(byte);
  } while (current > 0);
  return new Uint8Array(out);
};

const tag = (field: number, wire: number): Uint8Array =>
  varint(field * 8 + wire);

const varintField = (field: number, value: number): Uint8Array =>
  concat(tag(field, 0), varint(value));

const bytesField = (field: number, payload: Uint8Array): Uint8Array =>
  concat(tag(field, 2), varint(payload.length), payload);

const stringField = (field: number, value: string): Uint8Array =>
  bytesField(field, encoder.encode(value));

const fixed32Field = (field: number, value: number): Uint8Array => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return concat(tag(field, 5), out);
};

const fixed64Field = (field: number, value: bigint): Uint8Array => {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, value, true);
  return concat(tag(field, 1), out);
};

describe("setGeneratedSabrAudioTrackId", () => {
  test("appends field 69 to ClientAbrState and keeps other fields intact", () => {
    const innerFields = varintField(2, 150);
    const before = varintField(2, 7);
    const after = concat(
      fixed32Field(5, 0xdeadbeef),
      fixed64Field(6, 0x0102030405060708n),
    );

    const generated = concat(before, bytesField(1, innerFields), after);
    const expected = concat(
      before,
      bytesField(1, concat(innerFields, stringField(69, "en.4"))),
      after,
    );

    expect(setGeneratedSabrAudioTrackId(generated, "en.4")).toEqual(expected);
  });

  test("replaces an existing field 69 in ClientAbrState", () => {
    const head = varintField(2, 150);
    const tail = varintField(3, 1);

    const generated = bytesField(
      1,
      concat(head, stringField(69, "ar.10"), tail),
    );
    const expected = bytesField(
      1,
      concat(head, tail, stringField(69, "de-DE.10")),
    );

    expect(setGeneratedSabrAudioTrackId(generated, "de-DE.10")).toEqual(
      expected,
    );
  });

  test("throws when ClientAbrState is missing", () => {
    const generated = concat(varintField(2, 150), stringField(3, "x"));

    expect(() => setGeneratedSabrAudioTrackId(generated, "en.4")).toThrow(
      "SABR ClientAbrState field is unavailable",
    );
  });

  test("throws on truncated input", () => {
    const generated = bytesField(
      1,
      concat(varintField(2, 150), varintField(3, 1)),
    );

    expect(() =>
      setGeneratedSabrAudioTrackId(generated.slice(0, -2), "en.4"),
    ).toThrow("truncated protobuf field");
  });
});
