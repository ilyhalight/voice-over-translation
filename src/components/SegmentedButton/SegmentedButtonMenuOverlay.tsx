import { type JSX, mergeProps, splitProps } from "solid-js";

import "./SegmentedButtonMenuOverlay.scss";
import type { Position } from "../../types/components/votButton";
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
  const finalProps = mergeProps(
    {
      position: "default",
      hidden: false,
    } as Partial<SegmentedButtonMenuOverlayProps>,
    props,
  );
  const [local, rest] = splitProps(finalProps, ["ref", "position", "hidden"]);

  return (
    <Overlay
      ref={local.ref}
      hidden={local.hidden}
      classList={{
        "vot-overlay__segmented-button-menu": true,
      }}
      blockProps={{
        "data-position": local.position,
      }}
    >
      <SegmentedButtonMenu {...rest} />
    </Overlay>
  );
}
