import type { JSX } from "@solidjs/web";
import { merge, omit } from "solid-js";

import type { Position } from "#types/components/votButton.ts";
import { Overlay } from "../Utils/Overlay";
import {
  SegmentedButtonMenu,
  type SegmentedButtonMenuProps,
} from "./SegmentedButtonMenu";

export type SegmentedButtonMenuOverlayProps = SegmentedButtonMenuProps & {
  ref?: (element: HTMLElement) => void;
  position?: Position;
  hidden?: boolean;
};

export function SegmentedButtonMenuOverlay(
  props: SegmentedButtonMenuOverlayProps,
): JSX.Element {
  const finalProps = merge(
    {
      position: "default",
      hidden: false,
    } as Partial<SegmentedButtonMenuOverlayProps>,
    props,
  );
  const rest = omit(finalProps, "ref", "position", "hidden");

  return (
    <Overlay
      ref={finalProps.ref}
      hidden={finalProps.hidden}
      class={{
        "vot-overlay__segmented-button-menu": true,
      }}
      blockProps={{
        "data-position": finalProps.position,
      }}
    >
      <SegmentedButtonMenu {...rest} />
    </Overlay>
  );
}
