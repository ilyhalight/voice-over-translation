import { createHash } from "node:crypto";
import path from "node:path";
import type { Plugin, Rollup } from "vite";

// The telemetry client reads this symbol-keyed registry (see
// src/modules/telemetry/debug-ids.ts); keep both in sync.
const REGISTRY_SYMBOL = "vot.debugIds";
const USERSCRIPT_HEADER_END = "// ==/UserScript==";
const SOURCE_MAPPING_URL_RE = /\n\/\/# sourceMappingURL=[^\n]*\n?$/;

export interface DebugIdPluginOptions {
  /** Mixed into the id so that variants built from equal code stay distinct. */
  variant: string;
  /** Chunks that never report errors must not touch the shared global scope. */
  registerChunk?: (chunk: Rollup.OutputChunk) => boolean;
  /** Moves emitted maps into this outDir subfolder (hidden maps only). */
  sourcemapDir?: string;
}

interface RawSourceMap {
  file?: string;
  mappings: string;
  debug_id?: string;
  debugId?: string;
  [key: string]: unknown;
}

// Derived from the chunk content so that rebuilding the same sources (e.g. an
// AMO review rebuild) yields the same ids.
function createDebugId(variant: string, code: string): string {
  const hex = createHash("sha256")
    .update(variant)
    .update("\0")
    .update(code)
    .digest("hex");
  const variantNibble = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(
    16,
  );
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variantNibble}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

// Telemetry runs in the page's MAIN world for the extension, so the registry
// key is a symbol and the stack is stripped of the per-profile extension origin.
// Userscript managers prepend their own lines to the script, so the expected
// line lets the reader measure that shift from the stack captured here.
export function createRegistration(
  debugId: string,
  expectedLine: number,
): string {
  return (
    `(function(){try{var g=globalThis,k=Symbol.for("${REGISTRY_SYMBOL}"),` +
    's=(new Error().stack||"").replace(/(extension:\\/\\/)[^\\/\\s]+/g,"$1extension");' +
    "if(s){g[k]||Object.defineProperty(g,k,{value:{}});" +
    `g[k][s]={d:"${debugId}",l:${expectedLine}}}}catch(e){}})();`
  );
}

function getHeaderLineCount(lines: string[]): number {
  if (!lines[0]?.startsWith("// ==UserScript==")) return 0;
  const end = lines.findIndex((line) => line.startsWith(USERSCRIPT_HEADER_END));
  return end === -1 ? 0 : end + 1;
}

function insertEmptyMappingLine(mappings: string, index: number): string {
  const lines = mappings.split(";");
  while (lines.length < index) lines.push("");
  lines.splice(index, 0, "");
  return lines.join(";");
}

export function debugIdPlugin({
  variant,
  registerChunk = () => true,
  sourcemapDir,
}: DebugIdPluginOptions): Plugin {
  return {
    name: "vot-debug-id",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== "chunk" || !chunk.sourcemapFileName) continue;

          const mapAsset = bundle[chunk.sourcemapFileName];
          if (mapAsset?.type !== "asset") continue;

          const debugId = createDebugId(variant, chunk.code);
          const map = JSON.parse(String(mapAsset.source)) as RawSourceMap;
          let code = chunk.code;

          if (registerChunk(chunk)) {
            const lines = code.split("\n");
            const headerLines = getHeaderLineCount(lines);
            lines.splice(
              headerLines,
              0,
              createRegistration(debugId, headerLines + 1),
            );
            code = lines.join("\n");
            map.mappings = insertEmptyMappingLine(map.mappings, headerLines);
          }

          const debugIdComment = `//# debugId=${debugId}`;
          chunk.code = SOURCE_MAPPING_URL_RE.test(code)
            ? code.replace(
                SOURCE_MAPPING_URL_RE,
                (url) => `\n${debugIdComment}${url}`,
              )
            : `${code.replace(/\n?$/, "\n")}${debugIdComment}\n`;

          map.debug_id = debugId;
          map.debugId = debugId;
          const source = JSON.stringify(map);

          if (sourcemapDir) {
            delete bundle[chunk.sourcemapFileName];
            const fileName = path.posix.join(
              sourcemapDir,
              chunk.sourcemapFileName,
            );
            this.emitFile({ type: "asset", fileName, source });
          } else {
            mapAsset.source = source;
          }
        }
      },
    },
  };
}
