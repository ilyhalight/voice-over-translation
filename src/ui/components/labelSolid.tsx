import type { JSX } from "solid-js";
import type { LabelProps } from "../../types/components/label";
import { resolveTemplate } from "../appendTemplate";
import { mountComponent } from "../solid/mountComponent";
import { UIComponent } from "./componentShared";

function LabelView(
  props: LabelProps & {
    rootRef: (el: HTMLDivElement) => void;
    iconRef: (el: HTMLSpanElement) => void;
    textRef: (el: HTMLSpanElement) => void;
  },
): JSX.Element {
  const icon = props.icon == null ? undefined : resolveTemplate(props.icon);
  return (
    <div ref={props.rootRef} class="vot-label">
      <span ref={props.textRef} class="vot-label-text">
        {props.labelText}
      </span>
      <span
        ref={props.iconRef}
        class="vot-label-icon"
        hidden={props.icon == null}
      >
        {icon}
      </span>
    </div>
  );
}

export default class Label extends UIComponent {
  icon!: HTMLElement;
  text!: HTMLElement;
  private dispose: () => void;
  constructor(props: LabelProps) {
    super();
    const mounted = mountComponent<HTMLDivElement>((rootRef) => (
      <LabelView
        {...props}
        rootRef={rootRef}
        iconRef={(el) => (this.icon = el)}
        textRef={(el) => (this.text = el)}
      />
    ));
    this.container = mounted.root;
    this.dispose = mounted.dispose;
  }
  protected createElements(): never {
    throw new Error("Solid component");
  }
  remove() {
    this.dispose();
    this.container.remove();
  }
}
