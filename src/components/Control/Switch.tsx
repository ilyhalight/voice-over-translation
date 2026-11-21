import type { JSX } from "@solidjs/web";
import { createSignal, createUniqueId, merge, Show } from "solid-js";

export type SwitchProps = {
  checked?: boolean;
  description?: JSX.Element;
  disabled?: boolean;
  heading?: JSX.Element;
  isSubSwitch?: boolean;
  hidden?: boolean;
  onChange?: (checked: boolean) => void;
  ref?: (element: HTMLLabelElement) => void;
};

export function Switch(props: SwitchProps): JSX.Element {
  const finalProps = merge(
    { checked: false, disabled: false, isSubSwitch: false },
    props,
  );
  const textId = createUniqueId();

  const [checked, setChecked] = createSignal(() => finalProps.checked);

  return (
    <label
      ref={finalProps.ref}
      class={{
        "vot-switch": true,
        "vot-switch_sub": finalProps.isSubSwitch,
      }}
      hidden={finalProps.hidden}
      data-disabled={finalProps.disabled}
    >
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
        disabled={finalProps.disabled}
        onChange={(event) => {
          const nextChecked = event.currentTarget.checked;
          setChecked(nextChecked);
          finalProps.onChange?.(nextChecked);
        }}
      />
      <Show when={finalProps.heading || finalProps.description}>
        <vot-block class="vot-switch-text">
          <Show when={finalProps.heading}>
            <vot-block class="vot-switch-heading" id={`${textId}-heading`}>
              {finalProps.heading}
            </vot-block>
          </Show>
          <Show when={finalProps.description}>
            <vot-block
              class="vot-switch-description"
              id={`${textId}-description`}
            >
              {finalProps.description}
            </vot-block>
          </Show>
        </vot-block>
      </Show>
      <vot-block class="vot-switch-track" data-checked={checked()}>
        <vot-block class="vot-switch-handle" />
      </vot-block>
    </label>
  );
}
