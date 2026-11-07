import {
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  Match,
  mergeProps,
  on,
  Show,
  Switch,
} from "solid-js";
import { RawButton } from "#components/Button/RawButton.tsx";
import { AutoPauseIcon } from "#components/Icons/AutoPauseIcon.tsx";
import { AutoTranslateIcon } from "#components/Icons/AutoTranslateIcon.tsx";
import { ChevronIcon } from "#components/Icons/ChevronIcon.tsx";
import { MenuIcon } from "#components/Icons/MenuIcon.tsx";
import { PiPIcon } from "#components/Icons/PiPIcon.tsx";
import { SubtitlesIcon } from "#components/Icons/SubtitlesIcon.tsx";
import { TranslateIcon } from "#components/Icons/TranslateIcon.tsx";
import { Tooltip } from "#components/Utils/Tooltip.tsx";
import { t } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { Direction, Status } from "../../types/components/votButton";
import { type QuickAction, quickActions } from "../../ui/quickAction";
import { isTouchFirstInput } from "../../utils/inputDevice";
import {
  isKeyboardActivation,
  isPrimaryPointerAction,
} from "../componentShared";
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
  isDragging?: boolean;
  layoutRoot?: HTMLElement;
  labelText: string;
  menuOpened?: boolean;
  quickAction1?: QuickAction;
  isQuickAction1Activated?: boolean;
  quickAction2?: QuickAction;
  isQuickAction2Activated?: boolean;
  onTranslateClick?: () => void;
  onVoiceChange?: (voice: VoiceType) => void;
  onMenuClick?: () => void;
  onQuickActionClick?: (action: QuickAction) => void;
  ref?: (element: HTMLElement) => void;
};

export type QuickActionButtonProps = {
  action: QuickAction;
  isActivated: boolean;
  ref?: (element: HTMLElement) => void;
  onQuickActionClick?: () => void;
  tooltipLayoutRoot: HTMLElement;
  tooltipHidden: boolean;
  tooltipPos: SegmentedButtonTooltipPosition;
};

export function QuickActionIcon(props: { action: QuickAction }): JSX.Element {
  return (
    <Switch>
      <Match when={props.action === "subtitles"}>
        <SubtitlesIcon />
      </Match>
      <Match when={props.action === "pip"}>
        <PiPIcon />
      </Match>
      <Match when={props.action === "autoPauseOnTranslate"}>
        <AutoPauseIcon />
      </Match>
      <Match when={props.action === "autoTranslate"}>
        <AutoTranslateIcon />
      </Match>
    </Switch>
  );
}

export function QuickActionButton(props: QuickActionButtonProps): JSX.Element {
  const [quickActionButton, setQuickActionButton] = createSignal<HTMLElement>();

  const quickAction = createMemo(() =>
    quickActions.find((qa) => qa.id === props.action),
  );

  return (
    <Show when={props.action !== "none" && quickAction()}>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        ref={(element) => {
          setQuickActionButton(element);
          props.ref?.(element);
        }}
        buttonProps={{
          "data-active": props.isActivated,
          "aria-pressed": props.isActivated,
          "aria-label": t(quickAction().phrase),
          onKeyDown: (event) => {
            if (!isKeyboardActivation(event)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            props.onQuickActionClick?.();
          },
          onPointerUp: (event) => {
            if (!isPrimaryPointerAction(event)) {
              return;
            }

            event.stopPropagation();
            props.onQuickActionClick?.();
          },
        }}
      >
        <QuickActionIcon action={props.action} />
        <Tooltip
          content={t(quickAction().phrase)}
          parentElement={props.tooltipLayoutRoot}
          target={quickActionButton()}
          position={props.tooltipPos}
          autoLayout={false}
          bordered={false}
          hidden={props.tooltipHidden}
        />
      </RawButton>
    </Show>
  );
}

export function SegmentedButton(props: SegmentedButtonProps): JSX.Element {
  const finalProps = mergeProps(
    {
      direction: "default",
      tooltipPos: "bottom",
      status: "none",
      isLoading: false,
      isTransparent: false,
      isDragging: false,
      quickAction1: "none",
      isQuickAction1Activated: false,
      quickAction2: "none",
      isQuickAction2Activated: false,
      menuOpened: false,
    } as Partial<SegmentedButtonProps>,
    props,
  );

  const [segmentedButton, setSegmentedButton] = createSignal<HTMLElement>();
  const [translationButton, setTranslationButton] = createSignal<HTMLElement>();
  const [voiceSelectionButton, setVoiceSelectionButton] =
    createSignal<HTMLElement>();
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

  createEffect(
    on(
      () => finalProps.status,
      (status, previousStatus) => {
        if (finalProps.direction !== "column") {
          return;
        }

        if (status === "error") {
          voicePopoverControls?.hideNow();
          setSuppressVoiceTooltip(false);
        } else if (
          previousStatus === "error" &&
          translationButton()?.matches(":hover")
        ) {
          voicePopoverControls?.showNow();
        }
      },
      { defer: true },
    ),
  );

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
              "aria-label": t("VOTVoiceSelection"),
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
              content={t("VOTVoiceSelection")}
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
      <QuickActionButton
        action={finalProps.quickAction1}
        isActivated={finalProps.isQuickAction1Activated}
        tooltipLayoutRoot={tooltipLayoutRoot()}
        tooltipHidden={needHideTooltip()}
        tooltipPos={finalProps.tooltipPos}
        onQuickActionClick={() =>
          finalProps.onQuickActionClick?.(finalProps.quickAction1)
        }
      />
      <Show when={finalProps.quickAction1 !== finalProps.quickAction2}>
        <QuickActionButton
          action={finalProps.quickAction2}
          isActivated={finalProps.isQuickAction2Activated}
          tooltipLayoutRoot={tooltipLayoutRoot()}
          tooltipHidden={needHideTooltip()}
          tooltipPos={finalProps.tooltipPos}
          onQuickActionClick={() =>
            finalProps.onQuickActionClick?.(finalProps.quickAction2)
          }
        />
      </Show>
      <vot-block class="vot-separator" />
      <RawButton
        class="vot-segment-only-icon"
        ref={(element) => setMenuButton(element)}
        buttonProps={{
          "aria-label": t("VOTMenu"),
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
          content={t("VOTMenu")}
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
