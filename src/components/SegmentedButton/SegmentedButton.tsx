import { createSignal, type JSX, mergeProps, Show } from "solid-js";
import { effect } from "solid-js/web";

import "./SegmentedButton.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import type { Direction, Status } from "../../types/components/votButton";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";
import { MenuIcon } from "../Icons/MenuIcon";
import { PiPIcon } from "../Icons/PiPIcon";
import { SubtitlesIcon } from "../Icons/SubtitlesIcon";
import { TranslateIcon } from "../Icons/TranslateIcon";
import { Tooltip } from "../Utils/Tooltip";
import {
  VoicePopover,
  type VoicePopoverControls,
  type VoiceType,
} from "./VoicePopover";

export type SegmentedButtonTooltipPosition = "right" | "left" | "bottom";

export type SegmentedButtonProps = {
  direction?: Direction;
  tooltipPos?: SegmentedButtonTooltipPosition;
  status?: Status;
  isLoading?: boolean;
  isSubtitlesActive?: boolean;
  showPipButton?: boolean;
  activeVoice?: VoiceType;
  layoutRoot?: HTMLElement;
  labelText: string;
  onTranslate?: () => void;
  onVoiceChange?: (voice: VoiceType) => void;
  ref?: (element: HTMLElement) => void;
};

export function SegmentedButton(props: SegmentedButtonProps): JSX.Element {
  const finalProps = mergeProps(
    {
      direction: "default",
      tooltipPos: "bottom",
      status: "none",
      isLoading: false,
      isSubtitlesActive: false,
      showPipButton: false,
      activeVoice: "standard" as VoiceType,
    } as Partial<SegmentedButtonProps>,
    props,
  );

  const [segmentedButton, setSegmentedButton] = createSignal<HTMLElement>();
  const [translationButton, setTranslationButton] = createSignal<HTMLElement>();
  const [voiceSelectionButton, setVoiceSelectionButton] =
    createSignal<HTMLElement>();
  const [subtitlesButton, setSubtitlesButton] = createSignal<HTMLElement>();
  const [pipButton, setPiPButton] = createSignal<HTMLElement>();
  const [menuButton, setMenuButton] = createSignal<HTMLElement>();

  const [direction, setDirection] = createSignal(finalProps.direction);
  const [tooltipPos, setTooltipPos] = createSignal(finalProps.tooltipPos);
  const [status, setStatus] = createSignal(finalProps.status);
  const [isLoading, setIsLoading] = createSignal(finalProps.isLoading);
  const [isSubtitlesActive, setIsSubtitlesActive] = createSignal(
    finalProps.isSubtitlesActive,
  );
  const [labelText, setLabelText] = createSignal(finalProps.labelText);
  const [showPipButton, setShowPipButton] = createSignal(
    finalProps.showPipButton,
  );
  const [activeVoice, setActiveVoice] = createSignal(finalProps.activeVoice);
  const [isVoicePopoverOpen, setIsVoicePopoverOpen] = createSignal(false);
  const [suppressVoiceTooltip, setSuppressVoiceTooltip] = createSignal(false);
  let voicePopoverControls: VoicePopoverControls | undefined;

  const voicePopoverAnchor = () =>
    direction() === "column" ? translationButton() : voiceSelectionButton();
  const voicePopoverLayoutRoot = () =>
    finalProps.layoutRoot ??
    segmentedButton()?.closest<HTMLElement>(".vot-overlay-root") ??
    document.body;

  const handleVoiceChange = (voice: VoiceType) => {
    setActiveVoice(voice);
    finalProps.onVoiceChange?.(voice);
  };

  const handleVoicePopoverOpenChange = (isOpen: boolean) => {
    setSuppressVoiceTooltip(true);
    setIsVoicePopoverOpen(isOpen);
  };

  effect(() => {
    setDirection(finalProps.direction);
    setTooltipPos(finalProps.tooltipPos);
    setStatus(finalProps.status);
    setIsLoading(finalProps.isLoading);
    setIsSubtitlesActive(finalProps.isSubtitlesActive);
    setLabelText(finalProps.labelText);
    setShowPipButton(finalProps.showPipButton);
    setActiveVoice(finalProps.activeVoice);
  });

  return (
    <vot-block
      ref={(element) => {
        setSegmentedButton(element);
        finalProps.ref?.(element);
      }}
      class="vot-segmented-button"
      data-direction={direction()}
      data-status={status()}
      data-loading={isLoading()}
    >
      <RawButton
        ref={(element) => setTranslationButton(element)}
        class="vot-segment vot-translate-button"
        buttonProps={{
          "aria-label": labelText(),
          onPointerEnter: (event) => {
            setSuppressVoiceTooltip(false);
            if (direction() === "column" && event.pointerType !== "touch") {
              voicePopoverControls?.scheduleShow();
            }
          },
          onPointerLeave: (event) => {
            setSuppressVoiceTooltip(false);
            if (direction() === "column" && event.pointerType !== "touch") {
              voicePopoverControls?.scheduleHide();
            }
          },
          onFocusOut: () => setSuppressVoiceTooltip(false),
        }}
        onClick={(event) => {
          if (direction() === "column") {
            event.stopPropagation();
            voicePopoverControls?.toggle();
            return;
          }
          finalProps.onTranslate?.();
        }}
      >
        <TranslateIcon loading={isLoading()} />
        <Show
          when={direction() !== "column"}
          fallback={
            <Tooltip
              content={localizationProvider.get("translateVideo")}
              target={translationButton()}
              position={tooltipPos()}
              autoLayout={false}
              bordered={false}
              hidden={isVoicePopoverOpen() || suppressVoiceTooltip()}
            />
          }
        >
          <vot-block class="vot-segment-label">{labelText()}</vot-block>
          <RawButton
            class="vot-dropdown-arrow"
            ref={(element) => setVoiceSelectionButton(element)}
            buttonProps={{
              "aria-label": localizationProvider.get("VOTVoiceSelection"),
              "aria-haspopup": "menu",
              "aria-expanded": isVoicePopoverOpen(),
              onPointerEnter: () => setSuppressVoiceTooltip(false),
              onPointerLeave: () => setSuppressVoiceTooltip(false),
              onFocusOut: () => setSuppressVoiceTooltip(false),
            }}
            onClick={(event) => {
              event.stopPropagation();
              voicePopoverControls?.toggle();
            }}
          >
            <ChevronIcon />
            <Tooltip
              content={localizationProvider.get("VOTVoiceSelection")}
              target={voiceSelectionButton()}
              edgeAnchor={translationButton()}
              position={tooltipPos()}
              autoLayout={false}
              bordered={false}
              hidden={isVoicePopoverOpen() || suppressVoiceTooltip()}
            />
          </RawButton>
        </Show>
      </RawButton>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        ref={(element) => setSubtitlesButton(element)}
        buttonProps={{
          "data-active": isSubtitlesActive(),
          "aria-label": localizationProvider.get("VOTSubtitles"),
          "aria-pressed": isSubtitlesActive(),
        }}
      >
        <SubtitlesIcon />
        <Tooltip
          content={localizationProvider.get("VOTSubtitles")}
          target={subtitlesButton()}
          position={tooltipPos()}
          autoLayout={false}
          bordered={false}
        />
      </RawButton>
      <Show when={showPipButton()}>
        <vot-block class="vot-separator" />
        <RawButton
          class="vot-segment-only-icon"
          ref={(element) => setPiPButton(element)}
          buttonProps={{
            "aria-label": localizationProvider.get("VOTPiP"),
          }}
        >
          <PiPIcon />
          <Tooltip
            content={localizationProvider.get("VOTPiP")}
            target={pipButton()}
            position={tooltipPos()}
            autoLayout={false}
            bordered={false}
          />
        </RawButton>
      </Show>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        ref={(element) => setMenuButton(element)}
        buttonProps={{
          "aria-label": localizationProvider.get("VOTMenu"),
          "aria-haspopup": "dialog",
          "aria-expanded": "false",
        }}
      >
        <MenuIcon />
        <Tooltip
          content={localizationProvider.get("VOTMenu")}
          target={menuButton()}
          position={tooltipPos()}
          autoLayout={false}
          bordered={false}
        />
      </RawButton>
      <Show when={voicePopoverAnchor()}>
        {(anchor) => (
          <VoicePopover
            activeVoice={activeVoice()}
            anchor={anchor()}
            layoutRoot={voicePopoverLayoutRoot()}
            controlsRef={(controls) => (voicePopoverControls = controls)}
            onOpenChange={handleVoicePopoverOpenChange}
            onTranslate={finalProps.onTranslate}
            onVoiceChange={handleVoiceChange}
          />
        )}
      </Show>
    </vot-block>
  );
}
