import { type DebugIdRegistry, parseStack } from "./event";

// Written by vite/lib/debug-id.ts; keep both in sync.
const REGISTRY_SYMBOL = Symbol.for("vot.debugIds");
const DEBUG_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Registration = { d: string; l: number };

function isRegistration(value: unknown): value is Registration {
  if (typeof value !== "object" || value === null) return false;
  const { d, l } = value as Partial<Registration>;
  return (
    typeof d === "string" &&
    DEBUG_ID_RE.test(d) &&
    typeof l === "number" &&
    Number.isInteger(l) &&
    l >= 1
  );
}

/**
 * Each bundle registers its debug id under the stack captured while it loaded,
 * so the key holds the URL the bundle was really served from. Frames of that
 * bundle get the same normalized filename. The registering line is also the
 * newest frame of that stack, which shows how far the runtime shifted the file.
 */
export function readDebugIdRegistry(
  scope: object = globalThis,
): DebugIdRegistry {
  const registry: DebugIdRegistry = new Map();
  const raw = (scope as Record<symbol, unknown>)[REGISTRY_SYMBOL];
  if (typeof raw !== "object" || raw === null) return registry;

  for (const [stack, registration] of Object.entries(raw)) {
    if (!isRegistration(registration)) continue;
    // Frames are oldest-first; the newest in-app one is the registering file.
    const frame = parseStack(stack).findLast((item) => item.in_app);
    if (frame) {
      registry.set(frame.filename, {
        debugId: registration.d,
        lineOffset: Math.max(0, frame.lineno - registration.l),
      });
    }
  }
  return registry;
}
