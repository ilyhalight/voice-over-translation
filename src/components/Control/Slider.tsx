import { createSignal, type JSX, mergeProps } from "solid-js";
import "./Slider.scss";
import { effect } from "solid-js/web";
import { clampNumber } from "../../utils/number";

export type SliderProps = {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
  onInput?: (value: number) => void;
  ref?: (element: HTMLElement) => void;
};

export function Slider(props: SliderProps): JSX.Element {
  const finalProps = mergeProps(
    {
      min: 0,
      max: 100,
      value: 50,
      step: 1,
      disabled: false,
    },
    props,
  );

  const [value, setValue] = createSignal(finalProps.value);
  const [disabled, setDisabled] = createSignal(finalProps.disabled);
  const [min, setMin] = createSignal(finalProps.min);
  const [max, setMax] = createSignal(finalProps.max);
  const [step, setStep] = createSignal(finalProps.step);

  const progress = () => {
    const range = max() - min();
    const raw = range <= 0 ? 0 : (value() - min()) / range;
    return clampNumber(raw, 0, 1);
  };

  effect(() => {
    setValue(finalProps.value);
    setDisabled(finalProps.disabled);
    setMin(finalProps.min);
    setMax(finalProps.max);
    setStep(finalProps.step);
  });

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-slider_new"
      style={{ "--vot-progress": progress() }}
      aria-disabled={disabled()}
    >
      <input
        class="vot-slider_new__control"
        type="range"
        min={min()}
        max={max()}
        value={value()}
        step={step()}
        disabled={disabled()}
        oninput={(e) => {
          const newValue = e.target.valueAsNumber;
          setValue(newValue);
          finalProps.onInput?.(newValue);
        }}
      />
      <vot-block class="vot-slider_new__track" />
      <vot-block class="vot-slider_new__track vot-slider_new__track-progress" />
      <vot-block class="vot-slider_new__handle" />
    </vot-block>
  );
}
