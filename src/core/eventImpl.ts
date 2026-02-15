import type { EventHandler } from "../types/core/eventImpl";

/**
 * Tiny, dependency-free event emitter.
 *
 * Notes:
 * - Uses generics so emitted arguments stay strongly typed.
 * - Adding the same listener twice is a no-op (idempotent).
 * - Listener errors are isolated so one bad subscriber doesn't break the emitter.
 */
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

  clear(): void {
    this.listeners.clear();
  }
}
