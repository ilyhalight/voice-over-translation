import type { JSX } from "solid-js";

export type AboutInfoProps = {
  label: string;
  children: JSX.Element;
  hasLink?: boolean;
  ref?: (element: HTMLElement) => void;
};

export function AboutItem(props: AboutInfoProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-about-item">
      <vot-block class="vot-about-item__label">{props.label}</vot-block>
      <vot-block class="vot-about-item__value" data-has-link={props.hasLink}>
        {props.children}
      </vot-block>
    </vot-block>
  );
}
