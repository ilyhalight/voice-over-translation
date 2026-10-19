import type { JSX } from "solid-js";

import "./AboutItem.scss";

export type AccountInfoProps = {
  label: string;
  children: JSX.Element;
  ref?: (element: HTMLElement) => void;
};

export function AboutItem(props: AccountInfoProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-about-item">
      <vot-block class="vot-about-item__label">{props.label}</vot-block>
      <vot-block class="vot-about-item__value">{props.children}</vot-block>
    </vot-block>
  );
}
