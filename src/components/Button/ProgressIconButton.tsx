import { type JSX, mergeProps, Show, splitProps } from "solid-js";
import { ProgressIcon } from "../Icons/ProgressIcon";
import { IconButton, type IconButtonProps } from "./IconButton";

export type ProgressIconButtonProps = IconButtonProps & {
  progress?: number;
  showProgress?: boolean;
};

export function ProgressIconButton(
  props: ProgressIconButtonProps,
): JSX.Element {
  const finalProps = mergeProps({ progress: 0, showProgress: false }, props);
  const [local, rest] = splitProps(finalProps, [
    "children",
    "showProgress",
    "progress",
  ]);

  return (
    <IconButton {...rest}>
      <Show when={local.showProgress} fallback={local.children}>
        <ProgressIcon progress={local.progress} />
      </Show>
    </IconButton>
  );
}
