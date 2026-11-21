import type { JSX } from "@solidjs/web";

import type { DataAttributes } from "../../types/components/shared";

export type OverlayProps = {
  children: JSX.Element;
  class?: Record<string, boolean | undefined>;
  blockProps?: JSX.HTMLAttributes<HTMLElement> & DataAttributes;
  hidden?: boolean;
  ref?: (element: HTMLElement) => void;
};

export function Overlay(props: OverlayProps): JSX.Element {
  return (
    <vot-block
      class={{ "vot-overlay": true, ...props.class }}
      ref={props.ref}
      aria-hidden={props.hidden ? "true" : undefined}
      {...props.blockProps}
    >
      {props.children}
    </vot-block>
  );
}
