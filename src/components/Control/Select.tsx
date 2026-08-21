import {
  createMemo,
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
import { localizationProvider } from "../../localization/localizationProvider";
import type { LanguageSelectKey } from "../../types/components/select";
import type { Phrase } from "../../types/localization";
import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";
import { LoadingDotsIcon } from "../Icons/LoadingDotsIcon";
import { Textfield } from "../Textfield/Textfield";
import { createFloatingPosition } from "../Utils/createFloatingPosition";

export function genSelectOptionsByLangs<
  T extends LanguageSelectKey = LanguageSelectKey,
>(langs: readonly T[]): SelectOption[] {
  return langs.map<SelectOption>((lang) => {
    const phrase = `langs.${lang}` satisfies Phrase;
    const label = localizationProvider.get(phrase);
    return {
      label: label === phrase ? lang.toUpperCase() : label,
      value: lang,
    };
  });
}

export type SelectValue = string | number | boolean;

export type SelectOption = {
  value: SelectValue;
  label: string;
  disabled?: boolean;
};

export type SearchItemsProvider = (
  query: string,
) => SelectOption[] | Promise<SelectOption[]>;

export type SelectControls = {
  close: () => void;
};

export type BaseSelectProps = {
  title: string;
  options: SelectOption[];
  children?: JSX.Element;
  isOpen?: boolean;
  search?: boolean;
  loading?: boolean;
  disabled?: boolean;
  ref?: (element: HTMLElement) => void;
  controlsRef?: (controls: SelectControls) => void;
  onOpen?: () => void;
  searchItemsProvider?: SearchItemsProvider;
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
      search: false,
      loading: false,
      isOpen: false,
      selectedValue: undefined,
      selectedValues: [],
      minSelected: 1,
    },
    props,
  );

  let outerRef!: HTMLElement;
  let innerRef!: HTMLElement;
  let searchRequestId = 0;

  const selectId = createUniqueId();
  const [selectedValues, setSelectedValues] = createSignal(
    new Set<SelectValue>(
      finalProps.multiple
        ? finalProps.selectedValues
        : [finalProps.selectedValue],
    ),
  );
  const [options, setOptions] = createSignal(finalProps.options);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(finalProps.isOpen);
  const [isSearching, setIsSearching] = createSignal(false);

  const [searchOptions, setSearchOptions] = createSignal<
    SelectOption[] | undefined
  >();
  const [selectedOptionCache, setSelectedOptionCache] = createSignal(
    new Map<SelectValue, SelectOption>(),
  );

  const baseOptions = createMemo(() => {
    const result = [...options()];
    const existingValues = new Set(result.map((option) => option.value));

    for (const [value, option] of selectedOptionCache()) {
      if (selectedValues().has(value) && !existingValues.has(value)) {
        result.push(option);
      }
    }

    return result;
  });

  const currentOptions = () => searchOptions() ?? baseOptions();

  const visibleTitle = () => {
    if (finalProps.multiple) {
      return (
        baseOptions()
          .filter((o) => selectedValues().has(o.value))
          .map((o) => o.label)
          .join(", ") || finalProps.title
      );
    }

    return (
      baseOptions().find((o) => selectedValues().has(o.value))?.label ||
      finalProps.title
    );
  };

  const filteredOptions = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    const current = currentOptions();
    if (!query) {
      return current;
    }

    return current.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  });

  effect(() => {
    const nextSelectedValues = new Set<SelectValue>(
      finalProps.multiple
        ? finalProps.selectedValues
        : [finalProps.selectedValue],
    );
    setSelectedValues(nextSelectedValues);
    setSelectedOptionCache((previous) => {
      const next = new Map<SelectValue, SelectOption>();
      for (const [value, option] of previous) {
        if (nextSelectedValues.has(value)) {
          next.set(value, option);
        }
      }

      return next;
    });
  });

  effect(() => {
    setIsOpen(finalProps.isOpen);
  });

  effect(() => {
    setOptions(finalProps.options);
  });

  createFloatingPosition({
    anchor: () => outerRef,
    popup: () => innerRef,
    isOpen,
    onOutsideScroll: () => closeSelect(),
    stablePlacementWhileOpen: Boolean(
      finalProps.search || finalProps.searchItemsProvider,
    ),
  });

  onMount(() => {
    effect(() => {
      if (!isOpen()) {
        return;
      }

      const handlePointerDown = (event: PointerEvent) => {
        const path = event.composedPath();
        if (!path.includes(innerRef) && !path.includes(outerRef)) {
          closeSelect();
        }
      };

      window.addEventListener("pointerdown", handlePointerDown, {
        capture: true,
        passive: true,
      });

      onCleanup(() => {
        window.removeEventListener("pointerdown", handlePointerDown, {
          capture: true,
        });
      });
    });
  });

  function singleSelectHandle(option: SelectOption) {
    setSelectedValues(new Set([option.value]));
    setSelectedOptionCache(new Map([[option.value, option]]));
    closeSelect();
    finalProps.onSelect?.(option);
  }

  function multiSelectHandle(option: SelectOption) {
    const value = option.value;
    const currentSelectedValues = selectedValues();
    if (!currentSelectedValues.has(value)) {
      setSelectedOptionCache((previous) => {
        const next = new Map(previous);
        next.set(value, option);
        return next;
      });
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

    if (currentSelectedValues.size <= finalProps.minSelected) {
      return;
    }

    setSelectedOptionCache((previous) => {
      const next = new Map(previous);
      next.delete(value);
      return next;
    });
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

  function closeSelect() {
    ++searchRequestId;
    setIsOpen(false);
    setSearchQuery("");
    setSearchOptions(undefined);
    setIsSearching(false);
  }

  async function handleSearchInput(query: string) {
    setSearchQuery(query);

    const provider = finalProps.searchItemsProvider;
    if (!provider) {
      return;
    }

    setIsSearching(true);
    const requestId = ++searchRequestId;

    try {
      const providedOptions = await provider(query);
      if (requestId !== searchRequestId || !isOpen()) {
        return;
      }

      setSearchOptions(providedOptions);
    } catch {
      if (requestId === searchRequestId) {
        setSearchOptions(undefined);
      }
    } finally {
      if (requestId === searchRequestId) {
        setIsSearching(false);
      }
    }
  }

  finalProps.controlsRef?.({
    close: () => {
      if (isOpen()) {
        closeSelect();
      }
    },
  });

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-select_new"
      aria-disabled={finalProps.disabled}
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
        disabled={finalProps.disabled}
        onClick={() => {
          if (isOpen()) {
            return closeSelect();
          }

          setIsOpen(true);
          finalProps.onOpen?.();
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
        hidden={!isOpen()}
      >
        <Show when={finalProps.search || finalProps.searchItemsProvider}>
          <Textfield
            labelText={localizationProvider.get("searchField")}
            value={searchQuery()}
            onInput={handleSearchInput}
          />
        </Show>
        <vot-block
          class="vot-select_new-inner__options"
          role="listbox"
          aria-busy={finalProps.loading ? "true" : undefined}
          aria-multiselectable={finalProps.multiple ? "true" : undefined}
        >
          <For each={filteredOptions()}>
            {(option) => (
              <RawButton
                class="vot-select_new-inner__option"
                disabled={option.disabled || finalProps.disabled}
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
        <Show when={finalProps.loading}>
          <vot-block
            class="vot-select_new-inner__no-options"
            data-searching="true"
          >
            <LoadingDotsIcon />
          </vot-block>
        </Show>
        <Show when={filteredOptions().length === 0 && !finalProps.loading}>
          <vot-block
            class="vot-select_new-inner__no-options"
            data-searching={isSearching()}
          >
            <Show
              when={isSearching()}
              fallback={localizationProvider.get("notFound")}
            >
              <LoadingDotsIcon />
            </Show>
          </vot-block>
        </Show>
      </vot-block>
    </vot-block>
  );
}
