import type { JSX } from "@solidjs/web";

export type OnClickEvent = MouseEvent & {
  currentTarget: HTMLElement;
  target: Element;
};

export type DataAttributes = {
  [K in `data-${string}`]?: string | number | boolean | undefined;
};

export type AriaAttributes = {
  [key in keyof JSX.AriaAttributes]?: boolean | string | number | undefined;
};

export type VOTElementAttributes<
  T = HTMLElement,
  A = JSX.HTMLAttributes<T>,
> = Omit<A, `aria-${string}`> & AriaAttributes & DataAttributes;
