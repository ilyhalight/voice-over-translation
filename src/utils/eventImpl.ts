import type { EventHandler } from "../types/core/eventImpl";

export class EventImpl<Args extends unknown[] = unknown[]> {
  private readonly listeners = new Set<EventHandler<Args>>();

  get size(): number {
    return this.listeners.size;
  }

  addListener(handler: EventHandler<Args>): this {
    this.listeners.add(handler);
    return this;
  }

  removeListener(handler: EventHandler<Args>): this {
    this.listeners.delete(handler);
    return this;
  }

  dispatch(...args: Args): void {
    for (const handler of this.listeners) {
      try {
        handler(...args);
      } catch (exception) {
        console.error("[VOT]", exception);
      }
    }
  }

  async dispatchAsync(...args: Args): Promise<void> {
    const pending: Promise<void>[] = [];

    for (const handler of this.listeners) {
      try {
        const result = handler(...args);
        if (result && typeof result.then === "function") {
          pending.push(Promise.resolve(result));
        }
      } catch (exception) {
        console.error("[VOT]", exception);
      }
    }

    if (!pending.length) {
      return;
    }

    const settled = await Promise.allSettled(pending);
    for (const item of settled) {
      if (item.status === "rejected") {
        console.error("[VOT]", item.reason);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
