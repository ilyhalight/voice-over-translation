import { type JSX, splitProps } from "solid-js";

import "./IconButton.scss";
import { RawButton, type RawButtonProps } from "./RawButton";

export type IconButtonProps = Omit<RawButtonProps, "class" | "ariaLabel"> & {
  ariaLabel: string;
};

export function IconButton(props: IconButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["ariaLabel", "buttonProps"]);

  return (
    <RawButton
      {...rest}
      class="vot-icon-button"
      buttonProps={{
        "aria-label": local.ariaLabel,
        ...local.buttonProps,
      }}
    />
  );
}
