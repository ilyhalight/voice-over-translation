import type { JSX } from "solid-js";

import "./IconButton.scss";
import { RawButton, type RawButtonProps } from "./RawButton";

export type IconButtonProps = Omit<RawButtonProps, "class" | "ariaLabel"> & {
  ariaLabel: string;
};

export function IconButton(props: IconButtonProps): JSX.Element {
  return <RawButton {...props} class="vot-icon-button" />;
}
