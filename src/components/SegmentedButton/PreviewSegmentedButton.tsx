import { type JSX, mergeProps, Show } from "solid-js";

import "./SegmentedButton.scss";

import type { Direction, Status } from "../../types/components/votButton";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";
import { MenuIcon } from "../Icons/MenuIcon";
import { PiPIcon } from "../Icons/PiPIcon";
import { SubtitlesIcon } from "../Icons/SubtitlesIcon";
import { TranslateIcon } from "../Icons/TranslateIcon";

export type PreviewSegmentedButtonProps = {
  direction?: Direction;
  status?: Status;
  isLoading?: boolean;
  isSubtitlesActive?: boolean;
  showPipButton?: boolean;
  labelText: string;
  ref?: (element: HTMLElement) => void;
};

export function PreviewSegmentedButton(
  props: PreviewSegmentedButtonProps,
): JSX.Element {
  const finalProps = mergeProps(
    {
      direction: "default",
      status: "none",
      isLoading: false,
      isSubtitlesActive: false,
      showPipButton: false,
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
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        buttonProps={{
          "data-active": finalProps.isSubtitlesActive,
        }}
      >
        <SubtitlesIcon />
      </RawButton>
      <Show when={finalProps.showPipButton}>
        <vot-block class="vot-separator" />
        <RawButton class="vot-segment-only-icon">
          <PiPIcon />
        </RawButton>
      </Show>
      <vot-block class="vot-separator" />
      <RawButton class="vot-segment-only-icon">
        <MenuIcon />
      </RawButton>
    </vot-block>
  );
}
