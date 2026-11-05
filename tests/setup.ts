import { memoryStorage } from "./helpers/storage";

Object.assign(globalThis, {
  DEBUG_MODE: false,
  IS_EXTENSION: false,
  VOT_VERSION: "1.0.0",
  VOT_AUTHORS: "test",
});

if (globalThis.localStorage === undefined) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
}

if (globalThis.sessionStorage === undefined) {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: memoryStorage(),
  });
}

if (globalThis.location === undefined) {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { origin: "https://example.com" },
  });
}

if (globalThis.addEventListener === undefined) {
  Object.defineProperty(globalThis, "addEventListener", {
    configurable: true,
    value: () => undefined,
  });
}
