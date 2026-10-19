/**
 * A strongly-typed event handler.
 *
 * Prefer tuple types for listener arguments so TypeScript can keep emitter and
 * listeners in sync.
 *
 * @example
 * type Events = {
 *   ready: [];
 *   message: [text: string];
 * };
 * const onMessage: EventHandler<Events["message"]> = (text) => console.log(text);
 */
export type EventHandler<Args extends unknown[] = unknown[]> = (
  ...args: Args
) => void | Promise<void>;
