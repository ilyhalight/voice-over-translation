type DebugMethod = (...text: unknown[]) => void;

const noop: DebugMethod = () => {};

// Resolve `DEBUG_MODE` safely. In production builds Vite replaces it with
// `false` (a literal). In tests, however, the global may not be defined at
// all (the test harness sometimes sets it lazily AFTER modules load), so a
// direct reference throws `ReferenceError`. Use `typeof` to guard.
const DEBUG_MODE_ACTIVE: boolean =
  typeof DEBUG_MODE !== "undefined" ? Boolean(DEBUG_MODE) : false;

// NOTE: `DEBUG_MODE` is `true` in development/serve builds and `false` in
// production. Logging must be enabled ONLY when `DEBUG_MODE` is true.
// Previously the condition was inverted (`!DEBUG_MODE ? realLog : noop`),
// which enabled verbose logging (including auth tokens via GM_setValue
// payloads) in production builds. See src/extension/prelude/gm-polyfills.ts.
const log: DebugMethod = DEBUG_MODE_ACTIVE
  ? (...text: unknown[]) => {
      console.log(
        "%c[VOT DEBUG]",
        "background: #3700ffff; color: #fff; padding: 5px;",
        ...text,
      );
    }
  : noop;

const warn: DebugMethod = DEBUG_MODE_ACTIVE
  ? (...text: unknown[]) => {
      console.warn(
        "%c[VOT DEBUG]",
        "background: #e1ff00ff; color: #fff; padding: 5px;",
        ...text,
      );
    }
  : noop;

// `error` stays enabled in production because error reporting must never be
// silenced — but it never logs sensitive payloads (only error objects).
const error: DebugMethod = (...text: unknown[]) => {
  console.error(
    "%c[VOT DEBUG]",
    "background: #F2452D; color: #fff; padding: 5px;",
    ...text,
  );
};

const debug = { log, warn, error };

export default debug;
