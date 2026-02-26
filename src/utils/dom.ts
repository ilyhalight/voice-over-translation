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
        for (const match of matches) {
          if (containsCrossShadow(match, origin)) {
            return match;
          }
        }
        return null;
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
