export type OnClickEvent = MouseEvent & {
  currentTarget: HTMLElement;
  target: Element;
};

export type DataAttributes = {
  [K in `data-${string}`]?: string | number | boolean | undefined;
};
