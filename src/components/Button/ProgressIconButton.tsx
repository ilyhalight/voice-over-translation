import type { JSX } from "@solidjs/web";
import { merge, omit, Show } from "solid-js";

import { ProgressIcon } from "../Icons/ProgressIcon";
import { IconButton, type IconButtonProps } from "./IconButton";

export type ProgressIconButtonProps = IconButtonProps & {
  progress?: number;
  showProgress?: boolean;
};

export function ProgressIconButton(
  props: ProgressIconButtonProps,
): JSX.Element {
  const finalProps = merge({ progress: 0, showProgress: false }, props);
  const rest = omit(finalProps, "children", "showProgress", "progress");

  return (
    <IconButton {...rest}>
      <Show when={finalProps.showProgress} fallback={finalProps.children}>
        <ProgressIcon progress={finalProps.progress} />
      </Show>
    </IconButton>
  );
}
