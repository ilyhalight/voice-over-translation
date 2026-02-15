function getComposableParent(node: Node | null): Node | null {
  if (!node) return null;

  if (typeof ShadowRoot !== "undefined" && node instanceof ShadowRoot) {
    return node.host;
  }

  return node.parentNode ?? null;
}

/**
 * Checks whether `target` is a descendant of `container` in the composed tree
 * (crossing ShadowRoot boundaries via hosts).
 */
export function containsCrossShadow(container: Node, target: Node): boolean {
  let node: Node | null = target;
  while (node) {
    if (node === container) return true;
    node = getComposableParent(node);
  }
  return false;
}

export function closestCrossShadow(
  element: Element | Document | null,
  selector: string,
): Element | null {
  if (!element || !selector) return null;
  const origin = element instanceof Document ? null : element;

  const walk = (current: Element | Document | null): Element | null => {
    if (!current) return null;

    if (current instanceof Document) {
      if (origin) {
        const matches = current.querySelectorAll(selector);
        return (
          Array.from(matches).find((match) =>
            containsCrossShadow(match, origin),
          ) ?? null
        );
      }
      return current.querySelector(selector);
    }

    const closest = current.closest(selector);
    if (closest) return closest;

    const root = current.getRootNode();
    if (root instanceof ShadowRoot) {
      return walk(root.host);
    }
    if (root instanceof Document) {
      return walk(root);
    }
    if (root !== current) {
      const parent = getComposableParent(root);
      if (parent && parent !== current && parent instanceof Element) {
        return walk(parent);
      }
    }

    return null;
  };

  return walk(element);
}

type ResolveInteractiveMountOptions = {
  /** Max parent hops while escaping pointer-events:none islands */
  maxPointerEventsHops?: number;
  /** Max parent hops while searching for a positioned ancestor */
  maxPositionedHops?: number;
  /** Whether to prefer a positioned ancestor for stable absolute positioning */
  preferPositioned?: boolean;
};

/**
 * Resolve a mount element for overlays/buttons that must remain clickable.
 *
 * Some video players render inner layers with `pointer-events: none`, which makes
 * any injected UI inside them unclickable. This helper climbs to a parent that
 * can receive pointer events and optionally prefers a positioned ancestor to keep
 * absolute positioning anchored.
 */
export function resolveInteractiveMount(
  base: HTMLElement,
  {
    maxPointerEventsHops = 30,
    maxPositionedHops = 10,
    preferPositioned = true,
  }: ResolveInteractiveMountOptions = {},
): HTMLElement {
  let el: HTMLElement | null = base;

  // Climb out of "pointer-events: none" islands (common in some video players).
  let peHops = 0;
  while (el?.parentElement && peHops < maxPointerEventsHops) {
    const pe = getComputedStyle(el).pointerEvents;
    const parentPe = getComputedStyle(el.parentElement).pointerEvents;
    if (pe === "none" || parentPe === "none") {
      el = el.parentElement;
      peHops++;
      continue;
    }
    break;
  }

  if (!preferPositioned) {
    return el ?? base;
  }

  // Prefer a positioned ancestor so our absolutely-positioned UI stays anchored.
  let positioned: HTMLElement | null = el;
  let hops = 0;
  while (positioned?.parentElement && hops < maxPositionedHops) {
    const pos = getComputedStyle(positioned).position;
    if (pos !== "static") break;
    positioned = positioned.parentElement;
    hops++;
  }

  return positioned ?? el ?? base;
}
