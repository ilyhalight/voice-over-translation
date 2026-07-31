import type { LabelProps } from "../../types/components/label";
import { mountComponent } from "../solid/mountComponent";
import { render } from "../solid/render";
import { UIComponent } from "./componentShared";

type LabelViewProps = LabelProps & {
  rootRef: (el: HTMLDivElement) => void;
  iconRef: (el: HTMLSpanElement) => void;
  textRef: (el: HTMLSpanElement) => void;
};

function LabelView(props: LabelViewProps): HTMLDivElement {
  const root = document.createElement("div");
  const text = document.createElement("span");
  const icon = document.createElement("span");
  root.className = "vot-label";
  text.className = "vot-label-text";
  icon.className = "vot-label-icon";
  text.textContent = props.labelText;
  icon.hidden = props.icon == null;
  if (props.icon != null) render(props.icon, icon);
  root.append(text, icon);
  props.rootRef(root);
  props.iconRef(icon);
  props.textRef(text);
  return root;
}

export default class Label extends UIComponent {
  icon!: HTMLElement;
  text!: HTMLElement;
  private dispose: () => void;
  constructor(props: LabelProps) {
    super();
    const mounted = mountComponent<HTMLDivElement>((rootRef) =>
      LabelView({
        ...props,
        rootRef,
        iconRef: (el) => (this.icon = el),
        textRef: (el) => (this.text = el),
      }),
    );
    this.container = mounted.root;
    this.dispose = mounted.dispose;
  }
  remove() {
    this.dispose();
    this.container.remove();
  }
}
