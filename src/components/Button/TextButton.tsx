import type { JSX } from "solid-js";

import { RawButton, type RawButtonProps } from "./RawButton";

export type TextButtonProps = Omit<RawButtonProps, "class">;

export function TextButton(props: TextButtonProps): JSX.Element {
  return <RawButton {...props} class="vot-text-button" />;
}
