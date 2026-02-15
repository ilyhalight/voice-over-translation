import type { SelectItem } from "./select";

export type LanguageSelectItem<T extends string = string> = {
  selectTitle?: string;
  dialogTitle?: string;
  items: SelectItem<T>[];
};

export type LanguagePairSelectProps<
  F extends string = string,
  T extends string = string,
> = {
  from: LanguageSelectItem<F>;
  to: LanguageSelectItem<T>;
  dialogParent?: HTMLElement;
};
