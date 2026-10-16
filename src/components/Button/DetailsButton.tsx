import { type JSX, splitProps } from "solid-js";

import "./DetailsButton.scss";
import { RawButton, type RawButtonProps } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";

export type DetailsButtonProps = Omit<RawButtonProps, "class"> & {
  children: JSX.Element;
};

export function DetailsButton(props: DetailsButtonProps): JSX.Element {
  const [local, buttonProps] = splitProps(props, ["children"]);

  return (
    <RawButton {...buttonProps} class="vot-details">
      <vot-block>{local.children}</vot-block>
      <vot-block class="vot-details-arrow-icon">
        <ChevronIcon />
      </vot-block>
    </RawButton>
  );
}
