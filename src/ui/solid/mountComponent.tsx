import type { JSX } from "solid-js";
import { render } from "./renderer";

export type MountedComponent<T extends HTMLElement> = {
  root: T;
  dispose: () => void;
};

/**
 * Compatibility bridge while callers still expect a concrete root element.
 * The JSX tree remains owned by a Solid root even after the returned element
 * is moved into a shadow root or portal.
 */
export function mountComponent<T extends HTMLElement>(
  view: (setRoot: (element: T) => void) => JSX.Element,
): MountedComponent<T> {
  const host = document.createElement("vot-block");
  let root: T | undefined;
  const dispose = render(
    () => view((element) => (root = element)) as Node,
    host,
  );
  if (!root) {
    dispose();
    throw new Error("[VOT] Solid component did not expose a root element");
  }
  return { root, dispose };
}
