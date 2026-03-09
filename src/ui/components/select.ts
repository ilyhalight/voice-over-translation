import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import { localizationProvider } from "../../localization/localizationProvider";
import type {
  LanguageSelectKey,
  SelectItem,
  SelectProps,
  SelectUpdateItemsOptions,
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
  private baseItems: SelectItem<T>[];
  private _items: SelectItem<T>[];
  private readonly searchItemsProvider?: SelectProps<
    T,
    MultiSelect
  >["searchItemsProvider"];

  private isLoading = false;
  private isDialogOpen = false;
  private searchRequestId = 0;
  private readonly onSelectItem = new EventImpl();
  private readonly onBeforeOpen = new EventImpl();
  private readonly events = {
    selectItem: this.onSelectItem as EventImpl<any[]>,
    beforeOpen: this.onBeforeOpen as EventImpl<any[]>,
  };
  private contentList?: HTMLElement;
  private readonly contentItemSearchDatasetKey = "votSearchLabel";
  private readonly contentItemIndexDatasetKey = "votIndex";

  selectedItems: HTMLElement[] = [];
  selectedValues: Set<T>;

  constructor({
    selectTitle,
    dialogTitle,
    items,
    searchItemsProvider,
    labelElement,
    dialogParent = document.documentElement,
    multiSelect,
  }: SelectProps<T, MultiSelect>) {
    this._selectTitle = selectTitle;
    this._dialogTitle = dialogTitle;
    this.baseItems = this.cloneItems(items);
    this._items = this.cloneItems(items);
    this.searchItemsProvider = searchItemsProvider;
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

  private cloneItems<U extends string>(
    items: SelectItem<U>[],
  ): SelectItem<U>[] {
    return items.map((item) => ({ ...item }));
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

  private readonly multiSelectItemHandle = (item: SelectItem<T>) => {
    const value = item.value;
    if (this.selectedValues.has(value) && this.selectedValues.size > 1) {
      this.selectedValues.delete(value);
    } else {
      this.selectedValues.add(value);
    }

    this.syncItemsSelectionState();
    this.syncItemsSelectionState(this.baseItems);
    this.updateSelectedState();
    this.onSelectItem.dispatch(Array.from(this.selectedValues));
  };

  private readonly singleSelectItemHandle = (item: SelectItem<T>) => {
    const value = item.value;
    this.selectedValues = new Set([value]);
    this.syncItemsSelectionState();
    this.syncItemsSelectionState(this.baseItems);
    this.updateSelectedState();
    this.onSelectItem.dispatch(value);
  };

  private readonly onContentItemClick = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    const contentItem = event.target.closest<HTMLElement>(
      ".vot-select-content-item",
    );
    if (
      !contentItem ||
      contentItem.inert ||
      !this.contentList?.contains(contentItem)
    ) {
      return;
    }

    const rawIndex = contentItem.dataset[this.contentItemIndexDatasetKey];
    if (!rawIndex) {
      return;
    }

    const item = this._items[Number(rawIndex)];
    if (!item) {
      return;
    }

    if (this.multiSelect) {
      this.multiSelectItemHandle(item);
      return;
    }

    this.singleSelectItemHandle(item);
  };

  private syncItemsSelectionState(items: SelectItem<T>[] = this._items) {
    for (const item of items) {
      item.selected = this.selectedValues.has(item.value);
    }
  }

  private restoreBaseItems() {
    this._items = this.cloneItems(this.baseItems);
    this.syncItemsSelectionState();
    this.updateSelectedState();
  }

  private createDialogContentList() {
    const contentList = UI.createEl("vot-block", ["vot-select-content-list"]);

    for (const [index, item] of this._items.entries()) {
      const contentItem = UI.createEl("vot-block", ["vot-select-content-item"]);
      contentItem.textContent = item.label;
      contentItem.dataset.votSelected =
        item.selected === true ? "true" : "false";
      contentItem.dataset.votValue = item.value;
      contentItem.dataset[this.contentItemSearchDatasetKey] =
        item.label.toLowerCase();
      contentItem.dataset[this.contentItemIndexDatasetKey] = String(index);
      if (item.disabled) {
        contentItem.inert = true;
      }

      contentList.appendChild(contentItem);
    }

    contentList.addEventListener("click", this.onContentItemClick);

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
      if (this.disabled) {
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

        votSearchLangTextfield.addEventListener("input", async (searchText) => {
          const requestId = ++this.searchRequestId;
          if (this.searchItemsProvider) {
            const providedItems = await this.searchItemsProvider(searchText);
            if (requestId !== this.searchRequestId) {
              return;
            }
            this.updateItems(providedItems, { persist: false });
          }

          const normalizedSearchText = searchText.toLowerCase();
          for (const contentItem of this.selectedItems) {
            const searchableText =
              contentItem.dataset[this.contentItemSearchDatasetKey] ?? "";
            contentItem.hidden = !searchableText.includes(normalizedSearchText);
          }
        });

        this.contentList = this.createDialogContentList();
        tempDialog.bodyContainer.append(
          votSearchLangTextfield.container,
          this.contentList,
        );

        tempDialog.addEventListener("close", () => {
          this.isDialogOpen = false;
          this.restoreBaseItems();
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
        const val = item.dataset.votValue;
        if (val === undefined) {
          continue;
        }

        item.dataset.votSelected = this.selectedValues.has(val as T).toString();
      }
    }

    this.updateTitle();
    return this;
  }

  setSelectedValue(value: typeof this.multiSelect extends true ? T[] : T) {
    const values = (Array.isArray(value) ? value : [value]) as T[];
    let selectedValues: T[];
    if (this.multiSelect) {
      selectedValues = values;
    } else {
      selectedValues = values.length > 0 ? [values[0]] : [];
    }
    this.selectedValues = new Set<T>(selectedValues);
    this.syncItemsSelectionState();
    this.syncItemsSelectionState(this.baseItems);

    this.updateSelectedState();
    return this;
  }

  /**
   * @warning Use chaining with this method or reassign to variable to get the updated type of instance
   */
  updateItems<U extends string = string>(
    newItems: SelectItem<U>[],
    options: SelectUpdateItemsOptions = {},
  ): Select<U> {
    const { persist = true } = options;
    const nextItems = this.cloneItems(newItems as unknown as SelectItem<T>[]);
    if (persist) {
      this.baseItems = this.cloneItems(nextItems);
    }
    this._items = nextItems;
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
    return (
      this.outer.getAttribute("disabled") === "true" ||
      this.outer.getAttribute("aria-disabled") === "true"
    );
  }

  set disabled(isDisabled: boolean) {
    if (isDisabled) {
      this.outer.setAttribute("disabled", "true");
      return;
    }

    this.outer.removeAttribute("disabled");
  }
}
