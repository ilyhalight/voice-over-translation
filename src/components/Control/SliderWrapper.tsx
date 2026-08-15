import type { JSX } from "solid-js";

import "./SliderWrapper.scss";

export type SliderWrapperProps = {
  children: JSX.Element;
  ref?: (element: HTMLElement) => void;
};

export function SliderWrapper(props: SliderWrapperProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-slider_new-wrapper">
      {props.children}
    </vot-block>
  );
}
