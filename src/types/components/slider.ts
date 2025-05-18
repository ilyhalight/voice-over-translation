import type { LitHtml } from "./shared";

export type SliderProps = {
  labelHtml: LitHtml;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
};
