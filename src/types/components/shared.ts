import type { JSX } from "solid-js";

/** Anything that can be mounted by `src/ui/solid/render`. */
export type UiTemplate =
  | string
  | Node
  | JSX.Element
  | (() => JSX.Element)
  | (() => Node);
