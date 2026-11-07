import { type JSX, mergeProps, Show } from "solid-js";
import type { Direction, Status } from "../../types/components/votButton";
import type { QuickAction } from "../../ui/quickAction";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";
import { MenuIcon } from "../Icons/MenuIcon";
import { TranslateIcon } from "../Icons/TranslateIcon";
import { QuickActionIcon } from "./SegmentedButton";

export type PreviewSegmentedButtonProps = {
  direction?: Direction;
  status?: Status;
  isLoading?: boolean;
  quickAction1?: QuickAction;
  isQuickAction1Activated?: boolean;
  quickAction2?: QuickAction;
  isQuickAction2Activated?: boolean;
  labelText: string;
  ref?: (element: HTMLElement) => void;
};

function PreviewQuickActionButton(props: {
  action: QuickAction;
  isActivated?: boolean;
}): JSX.Element {
  return (
    <Show when={props.action !== "none"}>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        buttonProps={{
          "data-active": props.isActivated,
        }}
      >
        <QuickActionIcon action={props.action} />
      </RawButton>
    </Show>
  );
}

export function PreviewSegmentedButton(
  props: PreviewSegmentedButtonProps,
): JSX.Element {
  const finalProps = mergeProps(
    {
      direction: "default",
      status: "none",
      isLoading: false,
      quickAction1: "none",
      isQuickAction1Activated: false,
      quickAction2: "none",
      isQuickAction2Activated: false,
    } as Partial<PreviewSegmentedButtonProps>,
    props,
  );

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-segmented-button"
      data-direction={finalProps.direction}
      data-status={finalProps.status}
      data-loading={finalProps.isLoading}
    >
      <RawButton class="vot-segment vot-translate-button">
        <TranslateIcon loading={finalProps.isLoading} />
        <Show when={finalProps.direction !== "column"}>
          <vot-block class="vot-segment-label">
            {finalProps.labelText}
          </vot-block>
          <RawButton class="vot-dropdown-arrow">
            <ChevronIcon />
          </RawButton>
        </Show>
      </RawButton>
      <PreviewQuickActionButton
        action={finalProps.quickAction1}
        isActivated={finalProps.isQuickAction1Activated}
      />
      <Show when={finalProps.quickAction1 !== finalProps.quickAction2}>
        <PreviewQuickActionButton
          action={finalProps.quickAction2}
          isActivated={finalProps.isQuickAction2Activated}
        />
      </Show>
      <vot-block class="vot-separator" />
      <RawButton class="vot-segment-only-icon">
        <MenuIcon />
      </RawButton>
    </vot-block>
  );
}
