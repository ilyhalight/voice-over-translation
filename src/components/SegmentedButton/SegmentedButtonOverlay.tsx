import type { JSX } from "@solidjs/web";
import { merge, omit } from "solid-js";

import type { Position } from "#types/components/votButton.ts";
import { Overlay } from "../Utils/Overlay";
import { SegmentedButton, type SegmentedButtonProps } from "./SegmentedButton";

export type SegmentedButtonOverlayProps = SegmentedButtonProps & {
  overlayRef?: (element: HTMLElement) => void;
  position?: Position;
  hidden?: boolean;
  opacity?: number;
} & {
  isTransparent?: never;
};

export function SegmentedButtonOverlay(
  props: SegmentedButtonOverlayProps,
): JSX.Element {
  const finalProps = merge(
    {
      position: "default",
      isDragging: false,
    } as Partial<SegmentedButtonOverlayProps>,
    props,
  );
  const rest = omit(
    finalProps,
    "overlayRef",
    "position",
    "isDragging",
    "hidden",
    "opacity",
    "isTransparent",
  );
  const isTransparent = () =>
    finalProps.opacity !== undefined && finalProps.opacity < 0.05;

  return (
    <Overlay
      ref={finalProps.overlayRef}
      hidden={finalProps.hidden}
      class={{
        "vot-overlay__segmented-button": true,
      }}
      blockProps={{
        "data-position": finalProps.position,
        "data-dragging": finalProps.isDragging ? "true" : undefined,
        style: {
          opacity: finalProps.opacity,
        },
      }}
    >
      <SegmentedButton
        {...rest}
        isTransparent={isTransparent()}
        isDragging={finalProps.isDragging}
      />
    </Overlay>
  );
}
