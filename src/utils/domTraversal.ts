export type ComposedTreeNode<T> = {
  parentElement?: T | null;
  getRootNode?: () => Node | null | undefined;
};

export function getComposedParentElement<T extends object>(
  node: ComposedTreeNode<T> | null | undefined,
): T | null {
  if (!node) return null;

  const parentElement = node.parentElement ?? null;
  if (parentElement) return parentElement;

  if (typeof node.getRootNode !== "function") {
    return null;
  }

  const root = node.getRootNode();
  if (root && "host" in root) {
    return (root as { host?: T | null }).host ?? null;
  }

  return null;
}

export function someComposedAncestor<T extends object>(
  node: ComposedTreeNode<T> | null | undefined,
  predicate: (candidate: T) => boolean,
): boolean {
  for (
    let parent = getComposedParentElement(node);
    parent;
    parent = getComposedParentElement(parent as ComposedTreeNode<T>)
  ) {
    if (predicate(parent)) return true;
  }

  return false;
}

export type ShadowTreeTraversalAdapter<T> = {
  getChildren(node: T): Iterable<T>;
  getShadowRoot(node: T): T | null | undefined;
};

function isArrayLikeChildren<T>(children: Iterable<T>): boolean {
  return "length" in children;
}

export function walkShadowIncludingSubtree<T>(
  root: T,
  adapter: ShadowTreeTraversalAdapter<T>,
  visit: (node: T) => void,
): void {
  const stack: T[] = [root];
  const { getChildren, getShadowRoot } = adapter;
  let stackSize = 1;

  while (stackSize > 0) {
    const node = stack[stackSize - 1];
    stackSize -= 1;
    visit(node);

    const children = getChildren(node);
    if (isArrayLikeChildren(children)) {
      const arrayLike = children as unknown as ArrayLike<T | null | undefined>;
      for (let index = 0; index < arrayLike.length; index += 1) {
        const child = arrayLike[index];
        if (child !== undefined && child !== null) {
          stack[stackSize] = child;
          stackSize += 1;
        }
      }
    } else {
      for (const child of children) {
        if (child !== undefined && child !== null) {
          stack[stackSize] = child;
          stackSize += 1;
        }
      }
    }

    const shadowRoot = getShadowRoot(node);
    if (shadowRoot) {
      stack[stackSize] = shadowRoot;
      stackSize += 1;
    }
  }
}
