import type { JSX } from "solid-js";

export type OrBlockProps = {
  ref?: (element: HTMLElement) => void;
  children: JSX.Element;
};

export function OrBlock(props: OrBlockProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-or-block">
      {props.children}
    </vot-block>
  );
}
