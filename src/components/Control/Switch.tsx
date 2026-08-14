import {
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  Show,
} from "solid-js";
import "./Switch.scss";

export type SwitchProps = {
  checked?: boolean;
  description?: JSX.Element;
  disabled?: boolean;
  heading?: JSX.Element;
  onChange?: (checked: boolean) => void;
  ref?: (element: HTMLLabelElement) => void;
};

export function Switch(props: SwitchProps): JSX.Element {
  const finalProps = mergeProps({ checked: false, disabled: false }, props);
  const textId = createUniqueId();

  const [checked, setChecked] = createSignal(finalProps.checked);
  const [disabled] = createSignal(finalProps.disabled);

  return (
    <label ref={finalProps.ref} class="vot-switch" data-disabled={disabled()}>
      <input
        class="vot-switch-control"
        aria-checked={checked()}
        aria-describedby={
          finalProps.description ? `${textId}-description` : undefined
        }
        aria-labelledby={finalProps.heading ? `${textId}-heading` : undefined}
        role="switch"
        type="checkbox"
        name={textId}
        checked={checked()}
        disabled={disabled()}
        onChange={(event) => {
          const nextChecked = event.currentTarget.checked;
          setChecked(nextChecked);
          finalProps.onChange?.(nextChecked);
        }}
      />
      <Show when={finalProps.heading || finalProps.description}>
        <span class="vot-switch-text">
          <Show when={finalProps.heading}>
            <span class="vot-switch-heading" id={`${textId}-heading`}>
              {finalProps.heading}
            </span>
          </Show>
          <Show when={finalProps.description}>
            <span class="vot-switch-description" id={`${textId}-description`}>
              {finalProps.description}
            </span>
          </Show>
        </span>
      </Show>
      <span class="vot-switch-track" data-checked={checked()}>
        <span class="vot-switch-handle"></span>
      </span>
    </label>
  );
}
