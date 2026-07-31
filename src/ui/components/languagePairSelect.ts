import { localizationProvider } from "../../localization/localizationProvider";
import type { LanguagePairSelectProps } from "../../types/components/languagePairSelect";
import type { SelectItem } from "../../types/components/select";
import UI from "../../ui";
import { ARROW_RIGHT_ICON } from "../icons";
import { render } from "../solid/render";
import { UIComponent } from "./componentShared";
import Select from "./select";

export default class LanguagePairSelect<
  F extends string = string,
  T extends string = string,
> extends UIComponent {
  fromSelect: Select<F>;
  directionIcon: HTMLElement;
  toSelect: Select<T>;

  dialogParent: HTMLElement;

  // from select opts
  private readonly _fromSelectTitle: string;
  private readonly _fromDialogTitle: string;
  private _fromItems: SelectItem<F>[];

  // to select opts
  private readonly _toSelectTitle: string;
  private readonly _toDialogTitle: string;
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
    super();
    this._fromSelectTitle = fromSelectTitle;
    this._fromDialogTitle = fromDialogTitle;
    this._fromItems = fromItems;

    this._toSelectTitle = toSelectTitle;
    this._toDialogTitle = toDialogTitle;
    this._toItems = toItems;

    this.dialogParent = dialogParent;

    const { container, fromSelect, directionIcon, toSelect } =
      this.createElements();
    this.container = container;
    this.fromSelect = fromSelect;
    this.directionIcon = directionIcon;
    this.toSelect = toSelect;
  }

  protected createElements() {
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
    this._fromItems = fromItems as SelectItem<any>[];
    this._toItems = toItems as SelectItem<any>[];
    this.fromSelect = this.fromSelect.updateItems<any>(fromItems);
    this.toSelect = this.toSelect.updateItems<any>(toItems);
    return this as unknown as LanguagePairSelect<U, I>;
  }
}
