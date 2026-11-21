import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";

import { RawButton, type RawButtonProps } from "./RawButton";

export type IconButtonProps = Omit<RawButtonProps, "class" | "ariaLabel"> & {
  ariaLabel: string;
};

export function IconButton(props: IconButtonProps): JSX.Element {
  const rest = omit(props, "ariaLabel", "buttonProps");

  return (
    <RawButton
      {...rest}
      class="vot-icon-button"
      buttonProps={{
        "aria-label": props.ariaLabel,
        ...props.buttonProps,
      }}
    />
  );
}
