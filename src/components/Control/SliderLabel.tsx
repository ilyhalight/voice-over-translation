import { type JSX, mergeProps } from "solid-js";

import "./SliderLabel.scss";

export type SliderLabelProps = {
  children: JSX.Element;
  value: string;
  disabled?: boolean;
  ref?: (element: HTMLElement) => void;
};

export type SliderLabelDescProps = {
  children: JSX.Element;
  ref?: (element: HTMLElement) => void;
};

export function SliderLabelDesc(props: SliderLabelDescProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-slider-label__text-desc">
      {props.children}
    </vot-block>
  );
}

export function SliderLabel(props: SliderLabelProps): JSX.Element {
  const finalProps = mergeProps(
    {
      disabled: false,
      value: "0",
    },
    props,
  );

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-slider-label"
      aria-disabled={finalProps.disabled}
    >
      <vot-block class="vot-slider-label__text">
        {finalProps.children}
      </vot-block>
      <vot-block class="vot-slider-label__value">{finalProps.value}</vot-block>
    </vot-block>
  );
}
