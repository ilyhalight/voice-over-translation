import { type JSX, mergeProps } from "solid-js";

import "./Overlay.scss";
import type { DataAttributes } from "../../types/components/shared";

export type OverlayProps = {
  children: JSX.Element;
  classList?: Record<string, boolean>;
  blockProps?: JSX.HTMLAttributes<HTMLElement> & DataAttributes;
  hidden?: boolean;
  ref?: (element: HTMLElement) => void;
};

export function Overlay(props: OverlayProps): JSX.Element {
  const finalProps = mergeProps(
    {
      hidden: false,
    } as Partial<OverlayProps>,
    props,
  );

  return (
    <vot-block
      classList={{ "vot-overlay": true, ...finalProps.classList }}
      ref={finalProps.ref}
      aria-hidden={finalProps.hidden ? "true" : undefined}
      {...finalProps.blockProps}
    >
      {finalProps.children}
    </vot-block>
  );
}
