import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectUsedUserscriptGrantsFromEntry } from "../vite/lib/userscript/grants";

test("collects grants once through shared and cyclic local dependencies", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "vot-grants-"));
  try {
    await Promise.all([
      writeFile(
        path.join(dir, "entry.ts"),
        'import "./left"; import "./right"; GM_getValue("key");',
      ),
      writeFile(
        path.join(dir, "left.ts"),
        'import "./shared"; GM.setValue("key", 1);',
      ),
      writeFile(
        path.join(dir, "right.ts"),
        'export * from "./shared"; window.focus();',
      ),
      writeFile(
        path.join(dir, "shared.ts"),
        'import "./entry"; GM_xmlhttpRequest({});',
      ),
    ]);
    expect(
      await collectUsedUserscriptGrantsFromEntry(path.join(dir, "entry.ts")),
    ).toEqual([
      "GM_getValue",
      "GM_xmlhttpRequest",
      "GM.setValue",
      "window.focus",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
