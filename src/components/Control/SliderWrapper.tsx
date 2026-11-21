import type { JSX } from "@solidjs/web";

export type SliderWrapperProps = {
  children: JSX.Element;
  ref?: (element: HTMLElement) => void;
};

export function SliderWrapper(props: SliderWrapperProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-slider-wrapper">
      {props.children}
    </vot-block>
  );
}
