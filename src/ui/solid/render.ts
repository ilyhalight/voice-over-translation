import { render as solidRender } from "solid-js/web";

import type { UiTemplate } from "../../types/components/shared";

/**
 * Imperative mounting helper for the hand-built host elements used across the
 * UI layer.
 *
 * Solid returns a `dispose()` per root and does not track the container, so one
 * dispose is kept per container and called before mounting again; otherwise a
 * re-render leaks the previous root's computations. `render(null, container)`
 * disposes and empties the host.
 */
const roots = new WeakMap<Element | DocumentFragment, () => void>();

function disposeRoot(container: Element | DocumentFragment): void {
  const dispose = roots.get(container);
  if (!dispose) return;
  roots.delete(container);
  dispose();
}

export function render(
  template: UiTemplate | null | undefined,
  container: Element | DocumentFragment,
): void {
  disposeRoot(container);
  if (template === null || template === undefined) {
    container.textContent = "";
    return;
  }

  const code = typeof template === "function" ? template : () => template;
  roots.set(container, solidRender(code as never, container as HTMLElement));
}

/** Tear down a root without mounting a new one. */
export function unmount(container: Element | DocumentFragment): void {
  disposeRoot(container);
  container.textContent = "";
}
