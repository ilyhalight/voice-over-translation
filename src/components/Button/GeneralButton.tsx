import type { JSX } from "solid-js";

import "./GeneralButton.scss";
import { RawButton, type RawButtonProps } from "./RawButton";

export type GeneralButtonProps = Omit<RawButtonProps, "class">;

export function GeneralButton(props: GeneralButtonProps): JSX.Element {
  return <RawButton {...props} class="vot-button" />;
}
