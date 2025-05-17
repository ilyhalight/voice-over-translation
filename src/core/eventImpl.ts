import type { EventHandler } from "../types/core/eventImpl";

export class EventImpl {
  listeners: Set<EventHandler>;
  constructor() {
    this.listeners = new Set();
  }

  addListener(handler: EventHandler) {
    if (this.listeners.has(handler)) {
      throw new Error("[VOT] The listener has already been added.");
    }
    this.listeners.add(handler);
  }

  removeListener(handler: EventHandler) {
    this.listeners.delete(handler);
  }

  dispatch(...args: any[]) {
    for (const handler of this.listeners) {
      try {
        handler(...args);
      } catch (exception) {
        console.error("[VOT]", exception);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
