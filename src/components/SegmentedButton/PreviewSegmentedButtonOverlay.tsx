import { type JSX, mergeProps, splitProps } from "solid-js";

import "./SegmentedButtonOverlay.scss";
import "./PreviewSegmentedButtonOverlay.scss";

import type { Position } from "../../types/components/votButton";
import { Overlay } from "../Utils/Overlay";
import {
  PreviewSegmentedButton,
  type PreviewSegmentedButtonProps,
} from "./PreviewSegmentedButton";

export type PreviewSegmentedButtonOverlayProps = PreviewSegmentedButtonProps & {
  position?: Position;
};

export function PreviewSegmentedButtonOverlay(
  props: PreviewSegmentedButtonOverlayProps,
): JSX.Element {
  const finalProps = mergeProps(
    {
      position: "default",
    } as Partial<PreviewSegmentedButtonOverlayProps>,
    props,
  );
  const [local, rest] = splitProps(finalProps, ["position"]);

  return (
    <Overlay
      classList={{
        "vot-overlay__segmented-button": true,
        "vot-segmented-button--dock-preview": true,
      }}
      blockProps={{
        "data-position": local.position,
        inert: true,
      }}
    >
      <PreviewSegmentedButton {...rest} />
    </Overlay>
  );
}
