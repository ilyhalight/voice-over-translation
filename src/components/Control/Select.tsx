import {
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  onCleanup,
  Show,
} from "solid-js";
import { effect } from "solid-js/web";

import "./Select.scss";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";

export type SelectOption = {
  value: string | number | boolean;
  label: string;
};

export type SelectProps = {
  title: string;
  options: SelectOption[];
  children?: JSX.Element;
  selectedValue?: number;
  disabled?: boolean;
  isOpen?: boolean;
  onSelect?: (option: SelectOption) => void;
  ref?: (element: HTMLElement) => void;
};

export function Select(props: SelectProps): JSX.Element {
  const finalProps = mergeProps(
    {
      disabled: false,
      isOpen: false,
      selectedValue: -1,
    },
    props,
  );

  let outerRef!: HTMLElement;
  let innerRef!: HTMLElement;

  const selectId = createUniqueId();
  const [disabled, setDisabled] = createSignal(finalProps.disabled);
  const [selectedValue, setSelectedValue] = createSignal<number>(
    finalProps.selectedValue,
  );

  const visibleTitle = () =>
    finalProps.options[selectedValue()]?.label || finalProps.title;
  const [isOpen, setIsOpen] = createSignal(finalProps.isOpen);

  effect(() => {
    setDisabled(finalProps.disabled);
    setIsOpen(finalProps.isOpen);
    setSelectedValue(finalProps.selectedValue);
  });

  effect(() => {
    if (!isOpen()) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const path = event.composedPath();
      if (!path.includes(innerRef) && !path.includes(outerRef)) {
        console.log("click outside select, closing", path);
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    onCleanup(() => {
      window.removeEventListener("pointerdown", handlePointerDown);
    });
  });

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-select_new"
      aria-disabled={disabled()}
    >
      <Show when={finalProps.children}>
        <vot-block class="vot-select_new-label">
          {finalProps.children}
        </vot-block>
      </Show>
      <RawButton
        ref={(el) => (outerRef = el)}
        class="vot-select_new-outer"
        buttonProps={{
          "aria-haspopup": "menu",
          "aria-controls": selectId,
          "aria-expanded": isOpen(),
        }}
        disabled={disabled()}
        onClick={() => {
          console.log("current state", isOpen());
          setIsOpen(!isOpen());
          console.log("new state", isOpen());
        }}
      >
        <vot-block class="vot-select_new-outer__title">
          {visibleTitle()}
        </vot-block>
        <vot-block class="vot-select_new-outer__arrow">
          <ChevronIcon />
        </vot-block>
      </RawButton>
      <vot-block
        class="vot-select_new-inner"
        ref={innerRef}
        id={selectId}
        role="menu"
        hidden={!isOpen()}
      >
        <For each={finalProps.options}>
          {(option, idx) => (
            <RawButton
              class="vot-select_new-inner__option"
              disabled={disabled()}
              buttonProps={{
                role: "menuitem",
                classList: {
                  "vot-select_new-inner__option--selected":
                    idx() === selectedValue(),
                },
              }}
              onClick={() => {
                setSelectedValue(idx());
                setIsOpen(false);
                finalProps.onSelect?.(option);
              }}
            >
              {option.label}
            </RawButton>
          )}
        </For>
      </vot-block>
    </vot-block>
  );
}
