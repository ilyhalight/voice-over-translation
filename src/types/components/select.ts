import { Phrases } from "../localization";

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

export type LanguageSelectKey = Partial<keyof Phrases["langs"]>;
