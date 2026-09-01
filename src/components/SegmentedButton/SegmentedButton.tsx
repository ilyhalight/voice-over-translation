import {
  createEffect,
  createSignal,
  type JSX,
  mergeProps,
  Show,
} from "solid-js";

import "./SegmentedButton.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { Direction, Status } from "../../types/components/votButton";
import { isTouchFirstInput } from "../../utils/inputDevice";
import { RawButton } from "../Button/RawButton";
import {
  isKeyboardActivation,
  isPrimaryPointerAction,
} from "../componentShared";
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

export type SegmentedButtonControls = {
  closeFloatingUI: () => void;
  getVoicePopoverEl: () => HTMLElement | undefined;
  isVoicePopoverOpen: () => boolean;
};

export type SegmentedButtonProps = {
  controlsRef?: (controls: SegmentedButtonControls) => void;
  direction?: Direction;
  tooltipPos?: SegmentedButtonTooltipPosition;
  status?: Status;
  isLoading?: boolean;
  isTransparent?: boolean;
  isSubtitlesActive?: boolean;
  isDragging?: boolean;
  showPipButton?: boolean;
  layoutRoot?: HTMLElement;
  labelText: string;
  menuOpened?: boolean;
  onTranslateClick?: () => void;
  onVoiceChange?: (voice: VoiceType) => void;
  onSubtitlesClick?: () => void;
  onMenuClick?: () => void;
  onPiPClick?: () => void;
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
      isTransparent: false,
      isDragging: false,
      showPipButton: false,
      menuOpened: false,
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

  const [isVoicePopoverOpen, setIsVoicePopoverOpen] = createSignal(false);
  const [suppressVoiceTooltip, setSuppressVoiceTooltip] = createSignal(false);
  let voicePopover: HTMLElement | undefined;
  let voicePopoverControls: VoicePopoverControls | undefined;
  let suppressRestoredVoiceTooltipFocus = false;

  const needHideTooltip = () =>
    finalProps.isTransparent || finalProps.isDragging;
  const isColumnDirection = () => finalProps.direction === "column";
  const allowsVoicePopover = () =>
    !isColumnDirection() || finalProps.status !== "error";
  const shouldUseTouchVoiceInteraction = (event: PointerEvent) =>
    event.pointerType === "touch" || isTouchFirstInput();
  const shouldUseHoverVoiceInteraction = (event: PointerEvent) =>
    event.pointerType !== "touch" && !isTouchFirstInput();
  const voicePopoverAnchor = () =>
    isColumnDirection() ? translationButton() : voiceSelectionButton();

  const activeVoice = () => (settings.useLivelyVoice ? "live" : "standard");
  const tooltipLayoutRoot = () =>
    finalProps.layoutRoot ??
    segmentedButton()?.closest<HTMLElement>(".vot-overlay-root") ??
    document.body;

  const handleVoiceChange = (voice: VoiceType) => {
    if (voice === activeVoice()) {
      return;
    }

    setSettings("useLivelyVoice", voice === "live");
    finalProps.onVoiceChange?.(voice);
  };

  const handleVoiceTooltipFocus = () => {
    if (finalProps.isDragging) {
      return;
    }
    if (suppressRestoredVoiceTooltipFocus) {
      return;
    }
    setSuppressVoiceTooltip(false);
  };

  const handleVoiceTooltipPointerEnter = () => {
    if (finalProps.isDragging) {
      return;
    }
    suppressRestoredVoiceTooltipFocus = false;
    setSuppressVoiceTooltip(false);
  };

  const handleVoiceTooltipFocusOut = () => {
    suppressRestoredVoiceTooltipFocus = false;
  };

  const handleVoicePopoverOpenChange = (isOpen: boolean) => {
    setSuppressVoiceTooltip(true);
    setIsVoicePopoverOpen(isOpen);
    suppressRestoredVoiceTooltipFocus = !isOpen;
  };

  finalProps.controlsRef?.({
    closeFloatingUI: () => {
      voicePopoverControls?.hideNow();
      setSuppressVoiceTooltip(true);
    },
    getVoicePopoverEl: () => voicePopover,
    isVoicePopoverOpen,
  });

  createEffect(() => {
    if (finalProps.status === "error" && finalProps.direction === "column") {
      voicePopoverControls?.hideNow();
    }
  });

  return (
    <vot-block
      ref={(element) => {
        setSegmentedButton(element);
        finalProps.ref?.(element);
      }}
      class="vot-segmented-button"
      data-direction={finalProps.direction}
      data-status={finalProps.status}
      data-loading={finalProps.isLoading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }}
    >
      <RawButton
        ref={(element) => setTranslationButton(element)}
        class="vot-segment vot-translate-button"
        buttonProps={{
          "aria-label": finalProps.labelText,
          onPointerEnter: (event) => {
            handleVoiceTooltipPointerEnter();
            if (
              isColumnDirection() &&
              allowsVoicePopover() &&
              shouldUseHoverVoiceInteraction(event)
            ) {
              voicePopoverControls?.scheduleShow();
            }
          },
          onPointerLeave: (event) => {
            if (isColumnDirection() && shouldUseHoverVoiceInteraction(event)) {
              voicePopoverControls?.scheduleHide();
            }
          },
          onFocusIn: handleVoiceTooltipFocus,
          onFocusOut: handleVoiceTooltipFocusOut,
          onKeyDown: (event) => {
            if (
              event.target !== event.currentTarget ||
              !isKeyboardActivation(event)
            ) {
              return;
            }

            event.preventDefault();
            finalProps.onTranslateClick?.();
          },
          onPointerUp: (event) => {
            if (!isPrimaryPointerAction(event)) {
              return;
            }

            if (
              isColumnDirection() &&
              allowsVoicePopover() &&
              shouldUseTouchVoiceInteraction(event)
            ) {
              event.preventDefault();
              event.stopPropagation();
              voicePopoverControls?.toggle();
              return;
            }

            finalProps.onTranslateClick?.();
          },
        }}
      >
        <TranslateIcon loading={finalProps.isLoading} />
        <Show
          when={!isColumnDirection()}
          fallback={
            <Tooltip
              content={finalProps.labelText}
              parentElement={tooltipLayoutRoot()}
              target={translationButton()}
              position={finalProps.tooltipPos}
              autoLayout={false}
              bordered={false}
              hidden={
                needHideTooltip() ||
                isVoicePopoverOpen() ||
                suppressVoiceTooltip()
              }
            />
          }
        >
          <vot-block class="vot-segment-label">
            {finalProps.labelText}
          </vot-block>
          <RawButton
            class="vot-dropdown-arrow"
            ref={(element) => setVoiceSelectionButton(element)}
            buttonProps={{
              "aria-label": localizationProvider.get("VOTVoiceSelection"),
              "aria-haspopup": "menu",
              "aria-expanded": isVoicePopoverOpen(),
              onPointerEnter: handleVoiceTooltipPointerEnter,
              onFocusIn: handleVoiceTooltipFocus,
              onFocusOut: handleVoiceTooltipFocusOut,
              onKeyDown: (event) => {
                if (!isKeyboardActivation(event)) {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                voicePopoverControls?.toggle();
              },
              onPointerDown: (event) => {
                if (isPrimaryPointerAction(event)) {
                  event.stopPropagation();
                }
              },
              onPointerUp: (event) => {
                if (!isPrimaryPointerAction(event)) {
                  return;
                }

                event.stopPropagation();
                voicePopoverControls?.toggle();
              },
            }}
          >
            <ChevronIcon />
            <Tooltip
              content={localizationProvider.get("VOTVoiceSelection")}
              parentElement={tooltipLayoutRoot()}
              target={voiceSelectionButton()}
              edgeAnchor={translationButton()}
              position={finalProps.tooltipPos}
              autoLayout={false}
              bordered={false}
              hidden={
                needHideTooltip() ||
                isVoicePopoverOpen() ||
                suppressVoiceTooltip()
              }
            />
          </RawButton>
        </Show>
      </RawButton>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        ref={(element) => setSubtitlesButton(element)}
        buttonProps={{
          "data-active": finalProps.isSubtitlesActive,
          "aria-label": localizationProvider.get("VOTSubtitles"),
          "aria-pressed": finalProps.isSubtitlesActive,
          onKeyDown: (event) => {
            if (!isKeyboardActivation(event)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            finalProps.onSubtitlesClick?.();
          },
          onPointerUp: (event) => {
            if (!isPrimaryPointerAction(event)) {
              return;
            }

            event.stopPropagation();
            finalProps.onSubtitlesClick?.();
          },
        }}
      >
        <SubtitlesIcon />
        <Tooltip
          content={localizationProvider.get("VOTSubtitles")}
          parentElement={tooltipLayoutRoot()}
          target={subtitlesButton()}
          position={finalProps.tooltipPos}
          autoLayout={false}
          bordered={false}
          hidden={needHideTooltip()}
        />
      </RawButton>
      <Show when={finalProps.showPipButton}>
        <vot-block class="vot-separator" />
        <RawButton
          class="vot-segment-only-icon"
          ref={(element) => setPiPButton(element)}
          buttonProps={{
            "aria-label": localizationProvider.get("VOTPiP"),
            onKeyDown: (event) => {
              if (!isKeyboardActivation(event)) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              finalProps.onPiPClick?.();
            },
            onPointerUp: (event) => {
              if (!isPrimaryPointerAction(event)) {
                return;
              }

              event.stopPropagation();
              finalProps.onPiPClick?.();
            },
          }}
        >
          <PiPIcon />
          <Tooltip
            content={localizationProvider.get("VOTPiP")}
            parentElement={tooltipLayoutRoot()}
            target={pipButton()}
            position={finalProps.tooltipPos}
            autoLayout={false}
            bordered={false}
            hidden={needHideTooltip()}
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
          "aria-expanded": finalProps.menuOpened,
          onKeyDown: (event) => {
            if (!isKeyboardActivation(event)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            finalProps.onMenuClick?.();
          },
          onPointerUp: (event) => {
            if (!isPrimaryPointerAction(event)) {
              return;
            }

            event.stopPropagation();
            finalProps.onMenuClick?.();
          },
        }}
      >
        <MenuIcon />
        <Tooltip
          content={localizationProvider.get("VOTMenu")}
          parentElement={tooltipLayoutRoot()}
          target={menuButton()}
          position={finalProps.tooltipPos}
          autoLayout={false}
          bordered={false}
          hidden={needHideTooltip()}
        />
      </RawButton>
      <Show when={voicePopoverAnchor()}>
        {(anchor) => (
          <VoicePopover
            ref={(element) => (voicePopover = element)}
            activeVoice={activeVoice()}
            anchor={anchor()}
            layoutRoot={tooltipLayoutRoot()}
            controlsRef={(controls) => (voicePopoverControls = controls)}
            onOpenChange={handleVoicePopoverOpenChange}
            onTranslate={finalProps.onTranslateClick}
            onVoiceChange={handleVoiceChange}
          />
        )}
      </Show>
    </vot-block>
  );
}
