import type { JSX } from "solid-js";

import type { DataAttributes } from "../../types/components/shared";

export type OverlayProps = {
  children: JSX.Element;
  classList?: Record<string, boolean>;
  blockProps?: JSX.HTMLAttributes<HTMLElement> & DataAttributes;
  hidden?: boolean;
  ref?: (element: HTMLElement) => void;
};

export function Overlay(props: OverlayProps): JSX.Element {
  return (
    <vot-block
      classList={{ "vot-overlay": true, ...props.classList }}
      ref={props.ref}
      aria-hidden={props.hidden ? "true" : undefined}
      {...props.blockProps}
    >
      {props.children}
    </vot-block>
  );
}
