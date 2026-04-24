type DebugMethod = (...text: unknown[]) => void;

const noop: DebugMethod = () => {};

const log: DebugMethod = DEBUG_MODE
  ? (...text: unknown[]) => {
      console.log(
        "%c[VOT DEBUG]",
        "background: #3700ffff; color: #fff; padding: 5px;",
        ...text,
      );
    }
  : noop;

const warn: DebugMethod = DEBUG_MODE
  ? (...text: unknown[]) => {
      console.warn(
        "%c[VOT DEBUG]",
        "background: #e1ff00ff; color: #fff; padding: 5px;",
        ...text,
      );
    }
  : noop;

const error: DebugMethod = DEBUG_MODE
  ? (...text: unknown[]) => {
      console.error(
        "%c[VOT DEBUG]",
        "background: #F2452D; color: #fff; padding: 5px;",
        ...text,
      );
    }
  : noop;

const debug = { log, warn, error };

export default debug;
