import type { JSX } from "@solidjs/web";
import { merge, omit } from "solid-js";

import type { Position } from "#types/components/votButton.ts";
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
  const finalProps = merge(
    {
      position: "default",
    } as Partial<PreviewSegmentedButtonOverlayProps>,
    props,
  );
  const rest = omit(finalProps, "position");

  return (
    <Overlay
      class={{
        "vot-overlay__segmented-button": true,
        "vot-segmented-button--dock-preview": true,
      }}
      blockProps={{
        "data-position": finalProps.position,
        inert: true,
      }}
    >
      <PreviewSegmentedButton {...rest} />
    </Overlay>
  );
}
