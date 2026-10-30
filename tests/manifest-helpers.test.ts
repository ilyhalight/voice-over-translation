import { expect, test } from "bun:test";
import {
  buildExtensionManifest,
  getAllMatches,
  getAltMatchPatterns,
  splitMatchesForOriginFallback,
} from "../vite/lib/extension/manifest-helpers";

test("alt patterns use a wildcard subdomain only for apex hosts", () => {
  const patterns = getAltMatchPatterns();

  expect(patterns).toContain("*://*.yewtu.be/*");
  expect(patterns).toContain("*://*.piped.video/*");
  expect(patterns).toContain("*://inv.nadeko.net/*");
  expect(patterns).toContain("*://*.coursehunter.net/*");
});

test("getAllMatches appends alt patterns without duplicates", () => {
  const matches = getAllMatches({
    match: ["*://*.youtube.com/*", "*://*.yewtu.be/*"],
  });

  expect(matches.slice(0, 2)).toEqual([
    "*://*.youtube.com/*",
    "*://*.yewtu.be/*",
  ]);
  expect(matches.filter((m) => m === "*://*.yewtu.be/*")).toHaveLength(1);
  expect(matches).toContain("*://inv.nadeko.net/*");
  expect(new Set(matches).size).toBe(matches.length);
});

test("alt patterns land in the origin-fallback group", () => {
  const { originFallbackMatches, directMatches } =
    splitMatchesForOriginFallback(getAllMatches({ match: [] }));

  expect(originFallbackMatches).toEqual(getAltMatchPatterns());
  expect(directMatches).toEqual([]);
});

test("manifest web_accessible_resources include alt frontends", () => {
  const manifest = buildExtensionManifest({
    headers: { match: ["*://*.youtube.com/*"] },
  });
  const [{ matches }] = manifest.web_accessible_resources as Array<{
    matches: string[];
  }>;

  expect(matches).toContain("*://*.youtube.com/*");
  expect(matches).toContain("*://inv.nadeko.net/*");
  expect(matches).toContain("*://*.piped.video/*");
});
