/** Static DOM content or a factory that creates it for each insertion. */
export type UiTemplate = string | Node | (() => string | Node);

export type OnClickEvent = MouseEvent & {
  currentTarget: HTMLElement;
  target: Element;
};
