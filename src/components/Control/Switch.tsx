import { createSignal, type JSX, mergeProps } from "solid-js";
import "./Switch.scss";

export type SwitchProps = {
  checked?: boolean;
  disabled?: boolean;
  name?: string;
};

export function Switch(props: SwitchProps): JSX.Element {
  const finalProps = mergeProps({ checked: false, disabled: false }, props);

  const [checked, setChecked] = createSignal(finalProps.checked);
  const [disabled] = createSignal(finalProps.disabled);

  return (
    <label class="vot-switch">
      <input
        class="vot-switch-control"
        aria-checked={checked()}
        role="switch"
        type="checkbox"
        name={finalProps.name}
        checked={checked()}
        disabled={disabled()}
        onChange={(event) => setChecked(event.currentTarget.checked)}
      />
      <span class="vot-switch-track" data-checked={checked()}>
        <span class="vot-switch-handle"></span>
      </span>
    </label>
  );
}
