import { render } from "lit-html";

import Select from "./select";
import UI from "../../ui";
import { ARROW_RIGHT_ICON } from "../icons";
import { localizationProvider } from "../../localization/localizationProvider";
import type { LanguagePairSelectProps } from "../../types/components/languagePairSelect";
import type { SelectItem } from "../../types/components/select";

export default class LanguagePairSelect<
  F extends string = string,
  T extends string = string,
> {
  container: HTMLElement;
  fromSelect: Select<F>;
  directionIcon: HTMLElement;
  toSelect: Select<T>;

  dialogParent: HTMLElement;

  // from select opts
  private _fromSelectTitle: string;
  private _fromDialogTitle: string;
  private _fromItems: SelectItem<F>[];

  // to select opts
  private _toSelectTitle: string;
  private _toDialogTitle: string;
  private _toItems: SelectItem<T>[];

  constructor({
    from: {
      selectTitle: fromSelectTitle = localizationProvider.get("videoLanguage"),
      dialogTitle: fromDialogTitle = localizationProvider.get("videoLanguage"),
      items: fromItems,
    },
    to: {
      selectTitle: toSelectTitle = localizationProvider.get(
        "translationLanguage",
      ),
      dialogTitle: toDialogTitle = localizationProvider.get(
        "translationLanguage",
      ),
      items: toItems,
    },
    dialogParent = document.documentElement,
  }: LanguagePairSelectProps<F, T>) {
    this._fromSelectTitle = fromSelectTitle;
    this._fromDialogTitle = fromDialogTitle;
    this._fromItems = fromItems;

    this._toSelectTitle = toSelectTitle;
    this._toDialogTitle = toDialogTitle;
    this._toItems = toItems;

    this.dialogParent = dialogParent;

    const elements = this.createElements();
    this.container = elements.container;
    this.fromSelect = elements.fromSelect;
    this.directionIcon = elements.directionIcon;
    this.toSelect = elements.toSelect;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-lang-select"]);
    const fromSelect = new Select<F>({
      selectTitle: this._fromSelectTitle,
      dialogTitle: this._fromDialogTitle,
      items: this._fromItems,
      dialogParent: this.dialogParent,
    });

    const directionIcon = UI.createEl("vot-block", ["vot-lang-select-icon"]);
    render(ARROW_RIGHT_ICON, directionIcon);

    const toSelect = new Select<T>({
      selectTitle: this._toSelectTitle,
      dialogTitle: this._toDialogTitle,
      items: this._toItems,
      dialogParent: this.dialogParent,
    });

    container.append(fromSelect.container, directionIcon, toSelect.container);

    return {
      container,
      fromSelect,
      directionIcon,
      toSelect,
    };
  }

  setSelectedValues(from: F, to: T) {
    this.fromSelect.setSelectedValue(from);
    this.toSelect.setSelectedValue(to);
    return this;
  }

  updateItems<U extends string = string, I extends string = string>(
    fromItems: SelectItem<U>[],
    toItems: SelectItem<I>[],
  ): LanguagePairSelect<U, I> {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this._fromItems = fromItems as SelectItem<any>[];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this._toItems = toItems as SelectItem<any>[];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this.fromSelect = this.fromSelect.updateItems<any>(fromItems);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this.toSelect = this.toSelect.updateItems<any>(toItems);
    return this as unknown as LanguagePairSelect<U, I>;
  }
}
