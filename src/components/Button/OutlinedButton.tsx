import type { JSX } from "solid-js";

import "./OutlinedButton.scss";
import { RawButton, type RawButtonProps } from "./RawButton";

export type OutlinedButtonProps = Omit<RawButtonProps, "class">;

export function OutlinedButton(props: OutlinedButtonProps): JSX.Element {
  return <RawButton {...props} class="vot-outlined-button" />;
}
