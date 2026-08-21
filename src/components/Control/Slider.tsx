import { createSignal, type JSX, mergeProps } from "solid-js";
import "./Slider.scss";
import { effect } from "solid-js/web";
import { clampNumber } from "../../utils/number";
import { clamp } from "../../utils/utils";

export type SliderProps = {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
  onInput?: (value: number) => void;
  ref?: (element: HTMLElement) => void;
};

const DRAG_THRESHOLD = 4;
type PointerStart = { id: number; x: number; y: number };

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

  let pointerStart: PointerStart | undefined;

  const clampVal = (val: number) => clamp(val, finalProps.min, finalProps.max);

  const [value, setValue] = createSignal(clampVal(finalProps.value));
  const [dragging, setDragging] = createSignal(false);

  const progress = () => {
    const range = finalProps.max - finalProps.min;
    const raw = range <= 0 ? 0 : (value() - finalProps.min) / range;
    return clampNumber(raw, 0, 1);
  };

  effect(() => {
    setValue(clampVal(finalProps.value));
  });

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-slider_new"
      data-dragging={dragging() ? "" : undefined}
      style={{ "--vot-progress": progress() }}
      aria-disabled={finalProps.disabled}
    >
      <input
        class="vot-slider_new__control"
        type="range"
        min={finalProps.min}
        max={finalProps.max}
        value={value()}
        step={finalProps.step}
        disabled={finalProps.disabled}
        onpointerdown={(event) => {
          pointerStart = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onpointermove={(event) => {
          if (!pointerStart || pointerStart.id !== event.pointerId) {
            return;
          }

          const distance = Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          );

          if (distance >= DRAG_THRESHOLD) {
            setDragging(true);
          }
        }}
        onpointerup={() => {
          pointerStart = undefined;
          setDragging(false);
        }}
        onpointercancel={() => {
          pointerStart = undefined;
          setDragging(false);
        }}
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
