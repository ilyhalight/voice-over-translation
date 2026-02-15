import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import { localizationProvider } from "../../localization/localizationProvider";
import type {
  LanguageSelectKey,
  SelectItem,
  SelectProps,
} from "../../types/components/select";
import type { Phrase } from "../../types/localization";
import UI from "../../ui";
import { CHEVRON_ICON } from "../icons";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";
import Dialog from "./dialog";
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
  private readonly _dialogTitle: string;
  private readonly multiSelect: MultiSelect;
  private _items: SelectItem<T>[];

  private isLoading = false;
  private isDialogOpen = false;
  private readonly onSelectItem = new EventImpl();
  private readonly onBeforeOpen = new EventImpl();
  private readonly events = {
    selectItem: this.onSelectItem as EventImpl<any[]>,
    beforeOpen: this.onBeforeOpen as EventImpl<any[]>,
  };
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

  private readonly multiSelectItemHandle = (
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

  private readonly singleSelectItemHandle = (item: SelectItem<T>) => {
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

    // Use Element children only (childNodes may include Text/Comment nodes).
    this.selectedItems = Array.from(contentList.children) as HTMLElement[];

    return contentList;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-select"]);
    if (this.labelElement) {
      container.classList.add("vot-select--labeled");
      container.append(this.labelElement);
    } else {
      container.classList.add("vot-select--control-only");
    }

    const outer = UI.createEl("vot-block", ["vot-select-outer"]);
    // A11y: make it behave like a button that opens a dialog.
    UI.makeButtonLike(outer);
    outer.setAttribute("aria-haspopup", "dialog");
    outer.setAttribute("aria-expanded", "false");
    const title = UI.createEl("vot-block", ["vot-select-title"]);
    title.textContent = this.visibleText;

    const arrowIcon = UI.createEl("vot-block", ["vot-select-arrow-icon"]);
    render(CHEVRON_ICON, arrowIcon);
    outer.append(title, arrowIcon);
    outer.addEventListener("click", () => {
      const isDisabled =
        outer.getAttribute("disabled") === "true" ||
        outer.getAttribute("aria-disabled") === "true";
      if (isDisabled) {
        return;
      }

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
        this.isDialogOpen = true;
        outer.setAttribute("aria-expanded", "true");

        // Always show the search box (even for small lists) for consistent UX.
        const votSearchLangTextfield = new Textfield({
          labelHtml: localizationProvider.get("searchField"),
        });

        votSearchLangTextfield.addEventListener("input", (searchText) => {
          const normalizedSearchText = searchText.toLowerCase();
          for (const contentItem of this.selectedItems) {
            contentItem.hidden = !contentItem.textContent
              ?.toLowerCase()
              .includes(normalizedSearchText);
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
          this.contentList = undefined;
          outer.setAttribute("aria-expanded", "false");
        });

        // Let Dialog handle focus & Escape.
        tempDialog.open();
        // NOTE: Do not force focus into the search field; automatic focus can be
        // disruptive. Users can Tab into it when they want to filter.
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
    listener: (...data: any[]) => void,
  ): this {
    addComponentEventListener(this.events, type, listener);

    return this;
  }

  removeEventListener(
    type: "selectItem",
    listener: (data: typeof this.multiSelect extends true ? T[] : T) => void,
  ): this;
  removeEventListener(
    type: "beforeOpen",
    listener: (data: Dialog) => void,
  ): this;
  removeEventListener(
    type: "selectItem" | "beforeOpen",
    listener: (...data: any[]) => void,
  ): this {
    removeComponentEventListener(this.events, type, listener);

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
        .join(", ") || this._selectTitle
    );
  }

  set selectTitle(title: string) {
    this._selectTitle = title;
    this.updateTitle();
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }

  get disabled() {
    return this.outer.getAttribute("disabled") === "true";
  }

  set disabled(isDisabled: boolean) {
    this.outer.toggleAttribute("disabled", isDisabled);
  }
}
