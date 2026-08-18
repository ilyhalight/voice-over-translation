import {
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { effect } from "solid-js/web";

import "./Select.scss";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";
import { createFloatingPosition } from "../Utils/createFloatingPosition";

export type SelectValue = string | number | boolean;

export type SelectOption = {
  value: SelectValue;
  label: string;
  disabled?: boolean;
};

export type BaseSelectProps = {
  title: string;
  options: SelectOption[];
  children?: JSX.Element;
  isOpen?: boolean;
  disabled?: boolean;
  ref?: (element: HTMLElement) => void;
};

export type SingleSelectProps = BaseSelectProps & {
  multiple?: false;
  selectedValue?: SelectValue;
  selectedValues?: never;
  onSelect?: (option: SelectOption) => void;
  onSelectionChange?: never;
  minSelected?: never;
};

export type MultiSelectProps = BaseSelectProps & {
  multiple: true;
  selectedValue?: never;
  selectedValues?: SelectValue[];
  onSelect?: never;
  onSelectionChange?: (
    values: SelectValue[],
    // the option that was added or removed in this selection change
    changedOption: SelectOption,
  ) => void;
  minSelected?: number;
};

export type SelectProps = BaseSelectProps &
  (SingleSelectProps | MultiSelectProps);

export function Select(props: SelectProps): JSX.Element {
  const finalProps = mergeProps(
    {
      disabled: false,
      multiple: false,
      isOpen: false,
      selectedValue: undefined,
      selectedValues: [],
      minSelected: 1,
    },
    props,
  );

  let outerRef!: HTMLElement;
  let innerRef!: HTMLElement;

  const selectId = createUniqueId();
  const [disabled, setDisabled] = createSignal(finalProps.disabled);
  const [multiple, setMultiple] = createSignal(finalProps.multiple);
  const [selectedValues, setSelectedValues] = createSignal(
    new Set<SelectValue>(
      finalProps.multiple
        ? finalProps.selectedValues
        : [finalProps.selectedValue],
    ),
  );
  const [minSelected, setMinSelected] = createSignal(finalProps.minSelected);
  const [isOpen, setIsOpen] = createSignal(finalProps.isOpen);

  const visibleTitle = () => {
    if (multiple()) {
      return (
        finalProps.options
          .filter((o) => selectedValues().has(o.value))
          .map((o) => o.label)
          .join(", ") || finalProps.title
      );
    }

    return (
      finalProps.options.find((o) => selectedValues().has(o.value))?.label ||
      finalProps.title
    );
  };

  effect(() => {
    setDisabled(finalProps.disabled);
    setMultiple(finalProps.multiple);
    setIsOpen(finalProps.isOpen);
    setSelectedValues(
      new Set<SelectValue>(
        finalProps.multiple
          ? finalProps.selectedValues
          : [finalProps.selectedValue],
      ),
    );
    setMinSelected(finalProps.minSelected);
  });

  createFloatingPosition({
    anchor: () => outerRef,
    popup: () => innerRef,
    isOpen,
    onOutsideScroll: () => setIsOpen(false),
  });

  onMount(() => {
    effect(() => {
      if (!isOpen()) {
        return;
      }

      const handlePointerDown = (event: PointerEvent) => {
        const path = event.composedPath();
        if (!path.includes(innerRef) && !path.includes(outerRef)) {
          setIsOpen(false);
        }
      };

      window.addEventListener("pointerdown", handlePointerDown);

      onCleanup(() => {
        window.removeEventListener("pointerdown", handlePointerDown);
      });
    });
  });

  function singleSelectHandle(option: SelectOption) {
    setSelectedValues(new Set([option.value]));
    setIsOpen(false);
    finalProps.onSelect?.(option);
  }

  function multiSelectHandle(option: SelectOption) {
    const value = option.value;
    const currentSelectedValues = selectedValues();
    if (!currentSelectedValues.has(value)) {
      setSelectedValues((prev) => {
        const next = new Set(prev);
        next.add(value);
        return next;
      });
      return finalProps.onSelectionChange?.(
        Array.from(selectedValues()),
        option,
      );
    }

    if (currentSelectedValues.size <= minSelected()) {
      return;
    }

    setSelectedValues((prev) => {
      const next = new Set(prev);
      next.delete(value);
      return next;
    });

    finalProps.onSelectionChange?.(Array.from(selectedValues()), option);
  }

  function handleSelectOption(option: SelectOption) {
    if (!finalProps.multiple) {
      return singleSelectHandle(option);
    }

    multiSelectHandle(option);
  }

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
          "aria-haspopup": "listbox",
          "aria-controls": selectId,
          "aria-expanded": isOpen(),
        }}
        disabled={disabled()}
        onClick={() => {
          setIsOpen(!isOpen());
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
        role="listbox"
        aria-multiselectable={multiple() ? "true" : undefined}
        hidden={!isOpen()}
      >
        <For each={finalProps.options}>
          {(option) => (
            <RawButton
              class="vot-select_new-inner__option"
              disabled={option.disabled || disabled()}
              buttonProps={{
                role: "option",
                "aria-selected": selectedValues().has(option.value),
              }}
              onClick={() => {
                if (option.disabled) {
                  return;
                }

                handleSelectOption(option);
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
