import type { UiTemplate } from "./shared";

export type SliderProps = {
  labelHtml: UiTemplate;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
};
