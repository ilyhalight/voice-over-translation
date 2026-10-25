import { memoryStorage } from "./helpers/storage";

Object.assign(globalThis, {
  DEBUG_MODE: false,
  VOT_VERSION: "test",
  VOT_AUTHORS: "test",
});

if (globalThis.localStorage === undefined) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
}
