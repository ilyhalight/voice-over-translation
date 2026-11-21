import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";

import { RawButton, type RawButtonProps } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";

export type DetailsButtonProps = Omit<RawButtonProps, "class"> & {
  children: JSX.Element;
};

export function DetailsButton(props: DetailsButtonProps): JSX.Element {
  const buttonProps = omit(props, "children");

  return (
    <RawButton {...buttonProps} class="vot-details">
      <vot-block>{props.children}</vot-block>
      <vot-block class="vot-details-arrow-icon">
        <ChevronIcon />
      </vot-block>
    </RawButton>
  );
}
