import { type JSX, mergeProps, splitProps } from "solid-js";

import "./SegmentedButtonOverlay.scss";

import type { Position } from "../../types/components/votButton";
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
  const finalProps = mergeProps(
    {
      position: "default",
      isDragging: false,
    } as Partial<SegmentedButtonOverlayProps>,
    props,
  );
  const [local, rest] = splitProps(finalProps, [
    "overlayRef",
    "position",
    "isDragging",
    "hidden",
    "opacity",
    "isTransparent",
  ]);
  const isTransparent = () =>
    local.opacity !== undefined && local.opacity < 0.05;

  return (
    <Overlay
      ref={local.overlayRef}
      hidden={local.hidden}
      classList={{
        "vot-overlay__segmented-button": true,
      }}
      blockProps={{
        "data-position": local.position,
        "data-dragging": local.isDragging ? "true" : undefined,
        style: {
          opacity: local.opacity,
        },
      }}
    >
      <SegmentedButton
        {...rest}
        isTransparent={isTransparent()}
        isDragging={local.isDragging}
      />
    </Overlay>
  );
}
