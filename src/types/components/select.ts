import type { Phrases } from "../localization";

export type SelectItem<T extends string = string> = {
  label: string;
  value: T;
  selected?: boolean;
  disabled?: boolean;
};

export type SelectProps<
  T extends string = string,
  M extends boolean = boolean,
> = {
  selectTitle: string;
  dialogTitle: string;
  items: SelectItem<T>[];
  labelElement?: HTMLElement | string;
  dialogParent?: HTMLElement;
  multiSelect?: M;
};

/**
 * Language keys supported by the built-in locale dictionaries.
 *
 * NOTE:
 * `Partial<keyof ...>` was previously used here, but `Partial` is meant for
 * object types and produces an unintuitive type when applied to a string
 * union (it maps string method keys instead). We want a simple, strict union
 * of the known language keys.
 */
export type LanguageSelectKey = keyof Phrases["langs"];
