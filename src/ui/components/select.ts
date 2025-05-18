import { render } from "lit-html";

import UI from "../../ui";
import { CHEVRON_ICON } from "../icons";
import type {
  LanguageSelectKey,
  SelectItem,
  SelectProps,
} from "../../types/components/select";
import { localizationProvider } from "../../localization/localizationProvider";
import { EventImpl } from "../../core/eventImpl";
import Dialog from "./dialog";
import type { Phrase } from "../../types/localization";
import Textfield from "./textfield";

export default class Select<
  T extends string = string,
  MultiSelect extends boolean = false,
> {
  container: HTMLElement;
  outer: HTMLElement;
  arrowIcon: HTMLElement;
  title: HTMLElement;

  dialogParent: HTMLElement;
  labelElement?: HTMLElement | string;

  private _selectTitle: string;
  private _dialogTitle: string;
  private multiSelect: MultiSelect;
  private _items: SelectItem<T>[];

  private isLoading = false;
  private isDialogOpen = false;
  private onSelectItem = new EventImpl();
  private onBeforeOpen = new EventImpl();
  private contentList?: HTMLElement;

  selectedItems: HTMLElement[] = [];
  selectedValues: Set<T>;

  constructor({
    selectTitle,
    dialogTitle,
    items,
    labelElement,
    dialogParent = document.documentElement,
    multiSelect,
  }: SelectProps<T, MultiSelect>) {
    this._selectTitle = selectTitle;
    this._dialogTitle = dialogTitle;
    this._items = items;
    this.multiSelect = (multiSelect ?? false) as MultiSelect;
    this.labelElement = labelElement;
    this.dialogParent = dialogParent;
    this.selectedValues = this.calcSelectedValues();

    const elements = this.createElements();
    this.container = elements.container;
    this.outer = elements.outer;
    this.arrowIcon = elements.arrowIcon;
    this.title = elements.title;
  }

  static genLanguageItems<T extends LanguageSelectKey = LanguageSelectKey>(
    langs: readonly T[],
    conditionString?: string,
  ) {
    return langs.map<SelectItem<T>>((lang) => {
      const phrase = `langs.${lang}` satisfies Phrase;
      const label = localizationProvider.get(phrase);
      return {
        label: label === phrase ? lang.toUpperCase() : label,
        value: lang,
        selected: conditionString === lang,
      };
    });
  }

  private multiSelectItemHandle = (
    contentItem: HTMLElement,
    item: SelectItem<T>,
  ) => {
    const value = item.value;
    if (this.selectedValues.has(value) && this.selectedValues.size > 1) {
      this.selectedValues.delete(value);
      item.selected = false;
    } else {
      this.selectedValues.add(value);
      item.selected = true;
    }

    contentItem.dataset.votSelected = this.selectedValues.has(value).toString();
    this.updateSelectedState();
    this.onSelectItem.dispatch(Array.from(this.selectedValues));
  };

  private singleSelectItemHandle = (item: SelectItem<T>) => {
    const value = item.value;
    this.selectedValues = new Set([value]);
    for (const contentItem of this.selectedItems) {
      contentItem.dataset.votSelected = (
        contentItem.dataset.votValue === value
      ).toString();
    }

    for (const item of this._items) {
      item.selected = item.value === value;
    }

    this.updateTitle();
    this.onSelectItem.dispatch(value);
  };

  private createDialogContentList() {
    const contentList = UI.createEl("vot-block", ["vot-select-content-list"]);

    for (const item of this._items) {
      const contentItem = UI.createEl("vot-block", ["vot-select-content-item"]);
      contentItem.textContent = item.label;
      contentItem.dataset.votSelected =
        item.selected === true ? "true" : "false";
      contentItem.dataset.votValue = item.value;
      if (item.disabled) {
        contentItem.inert = true;
      }

      contentItem.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).inert) {
          return;
        }

        if (this.multiSelect) {
          return this.multiSelectItemHandle(contentItem, item);
        }

        return this.singleSelectItemHandle(item);
      });

      contentList.appendChild(contentItem);
    }

    this.selectedItems = Object.values(contentList.childNodes) as HTMLElement[];

    return contentList;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-select"]);
    if (this.labelElement) {
      container.append(this.labelElement);
    }

    const outer = UI.createEl("vot-block", ["vot-select-outer"]);
    const title = UI.createEl("vot-block", ["vot-select-title"]);
    title.textContent = this.visibleText;

    const arrowIcon = UI.createEl("vot-block", ["vot-select-arrow-icon"]);
    render(CHEVRON_ICON, arrowIcon);
    outer.append(title, arrowIcon);
    outer.addEventListener("click", () => {
      if (this.isLoading || this.isDialogOpen) {
        return;
      }

      try {
        this.isLoading = true;
        const tempDialog = new Dialog({
          titleHtml: this._dialogTitle,
          isTemp: true,
        });

        this.onBeforeOpen.dispatch(tempDialog);
        this.dialogParent.appendChild(tempDialog.container);

        const votSearchLangTextfield = new Textfield({
          labelHtml: localizationProvider.get("searchField"),
        });

        votSearchLangTextfield.addEventListener("input", (searchText) => {
          for (const contentItem of this.selectedItems) {
            contentItem.hidden = !contentItem.textContent
              ?.toLowerCase()
              .includes(searchText);
          }
        });

        this.contentList = this.createDialogContentList();
        tempDialog.bodyContainer.append(
          votSearchLangTextfield.container,
          this.contentList,
        );
        tempDialog.addEventListener("close", () => {
          this.isDialogOpen = false;
          this.selectedItems = [];
        });
      } finally {
        this.isLoading = false;
      }
    });

    container.appendChild(outer);

    return {
      container,
      outer,
      arrowIcon,
      title,
    };
  }

  private calcSelectedValues() {
    return new Set(
      this._items.filter((item) => item.selected).map((item) => item.value),
    );
  }

  addEventListener(
    type: "selectItem",
    listener: (data: typeof this.multiSelect extends true ? T[] : T) => void,
  ): this;
  addEventListener(type: "beforeOpen", listener: (data: Dialog) => void): this;
  addEventListener(
    type: "beforeOpen" | "selectItem",
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener: (...data: any[]) => void,
  ): this {
    if (type === "selectItem") {
      this.onSelectItem.addListener(listener);
    } else if (type === "beforeOpen") {
      this.onBeforeOpen.addListener(listener);
    }

    return this;
  }

  removeEventListener(
    type: "selectItem",
    listener: (
      data: typeof this.multiSelect extends true
        ? SelectItem<T>[]
        : SelectItem<T>,
    ) => void,
  ): this;
  removeEventListener(
    type: "beforeOpen",
    listener: (data: Dialog) => void,
  ): this;
  removeEventListener(
    type: "selectItem" | "beforeOpen",
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener: (...data: any[]) => void,
  ): this {
    if (type === "selectItem") {
      this.onSelectItem.removeListener(listener);
    } else if (type === "beforeOpen") {
      this.onBeforeOpen.removeListener(listener);
    }

    return this;
  }

  updateTitle() {
    this.title.textContent = this.visibleText;
    return this;
  }

  updateSelectedState() {
    if (this.selectedItems.length > 0) {
      for (const item of this.selectedItems) {
        const val = item.dataset.votValue as T;
        if (!val) {
          continue;
        }

        item.dataset.votSelected = this.selectedValues.has(val).toString();
      }
    }

    this.updateTitle();
    return this;
  }

  setSelectedValue(value: typeof this.multiSelect extends true ? T[] : T) {
    if (this.multiSelect) {
      this.selectedValues = new Set<T>(
        Array.isArray(value)
          ? (value.map(String) as T[])
          : [String(value) as T],
      );
    } else {
      this.selectedValues = new Set<T>([String(value) as T]);
    }

    for (const item of this._items) {
      item.selected = this.selectedValues.has(String(item.value) as T);
    }

    this.updateSelectedState();
    return this;
  }

  /**
   * @warning Use chaining with this method or reassign to variable to get the updated type of instance
   */
  updateItems<U extends string = string>(newItems: SelectItem<U>[]): Select<U> {
    this._items = newItems as unknown as SelectItem<T>[];
    this.selectedValues = this.calcSelectedValues();
    this.updateSelectedState();

    const dialogContainer = this.contentList?.parentElement;
    if (!this.contentList || !dialogContainer) {
      return this as unknown as Select<U>;
    }

    const oldContentList = this.contentList;
    this.contentList = this.createDialogContentList();
    dialogContainer.replaceChild(this.contentList, oldContentList);
    return this as unknown as Select<U>;
  }

  get visibleText() {
    if (!this.multiSelect) {
      return (
        this._items.find((item) => item.selected)?.label ?? this._selectTitle
      );
    }

    return (
      this._items
        .filter((item) => this.selectedValues.has(item.value))
        .map((item) => item.label)
        .join(", ") ?? this._selectTitle
    );
  }

  set selectTitle(title: string) {
    this._selectTitle = title;
    this.updateTitle();
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}
