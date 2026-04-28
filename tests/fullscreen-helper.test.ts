import { describe, expect, test } from "bun:test";
import { FullscreenHelper } from "../src/utils/fullscreenHelper.ts";

function createListenerTarget() {
  const listeners = new Map<string, Set<EventListener>>();

  return {
    addEventListener(type: string, listener: EventListener) {
      const typeListeners = listeners.get(type) ?? new Set<EventListener>();
      typeListeners.add(listener);
      listeners.set(type, typeListeners);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    listenerCount() {
      return [...listeners.values()].reduce(
        (sum, typeListeners) => sum + typeListeners.size,
        0,
      );
    },
  };
}

describe("FullscreenHelper", () => {
  test("removes the same native listeners that it added", () => {
    const previousDocument = globalThis.document;
    const documentTarget = createListenerTarget();
    const videoTarget = createListenerTarget();

    try {
      (globalThis as unknown as { document: unknown }).document =
        documentTarget;

      const helper = new FullscreenHelper({
        container: {} as HTMLElement,
        video: videoTarget as unknown as HTMLVideoElement,
      });
      const listener = () => {};

      helper.addFullscreenChangeListener(listener);
      expect(documentTarget.listenerCount()).toBe(2);
      expect(videoTarget.listenerCount()).toBe(2);

      helper.removeFullscreenChangeListener(listener);
      expect(documentTarget.listenerCount()).toBe(0);
      expect(videoTarget.listenerCount()).toBe(0);
    } finally {
      (globalThis as unknown as { document: unknown }).document =
        previousDocument;
    }
  });
});
