import { createSignal, type JSX, mergeProps } from "solid-js";
import { effect } from "solid-js/web";
import { clamp } from "#utils/number.ts";

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
type PointerStart = {
  id: number;
  x: number;
  y: number;
  origin: number;
  trackWidth: number;
};

const decimalPlaces = (num: number) => String(num).split(".")[1]?.length ?? 0;

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
  let handleHitbox: HTMLElement | undefined;
  let input: HTMLInputElement | undefined;

  const clampVal = (val: number) => clamp(val, finalProps.min, finalProps.max);

  const [value, setValue] = createSignal(clampVal(finalProps.value));
  const [dragging, setDragging] = createSignal(false);

  const progress = () => {
    const range = finalProps.max - finalProps.min;
    const raw = range <= 0 ? 0 : (value() - finalProps.min) / range;
    return clamp(raw, 0, 1);
  };

  const updateValue = (next: number) => {
    if (next === value()) {
      return;
    }

    setValue(next);
    finalProps.onInput?.(next);
  };

  const updateValueFromPointer = (clientX: number) => {
    if (!pointerStart) {
      return;
    }

    const { origin, trackWidth } = pointerStart;
    const ratio =
      trackWidth <= 0 ? 0 : clamp((clientX - origin) / trackWidth, 0, 1);
    const { min, max, step } = finalProps;
    const raw = min + ratio * (max - min);
    const snapped =
      step > 0 ? min + Math.round((raw - min) / step) * step : raw;
    const precision = Math.max(decimalPlaces(step), decimalPlaces(min));

    updateValue(clampVal(Number(snapped.toFixed(precision))));
  };

  const stopDragging = () => {
    pointerStart = undefined;
    setDragging(false);
  };

  effect(() => {
    setValue(clampVal(finalProps.value));
  });

  return (
    <vot-block
      ref={finalProps.ref}
      class="vot-slider"
      data-dragging={dragging() ? "" : undefined}
      style={{ "--vot-progress": progress() }}
      aria-disabled={finalProps.disabled}
      onpointerdown={(event) => {
        if (finalProps.disabled || event.button !== 0 || !handleHitbox) {
          return;
        }

        const root = event.currentTarget;

        event.preventDefault();
        input?.focus({ preventScroll: true });
        root.setPointerCapture(event.pointerId);

        const rect = root.getBoundingClientRect();
        const hitbox = handleHitbox.getBoundingClientRect();
        const thumbWidth = hitbox.width;
        const offset = event.clientX - (hitbox.left + thumbWidth / 2);
        const grabbed = Math.abs(offset) <= thumbWidth / 2;

        pointerStart = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          origin: rect.left + thumbWidth / 2 + (grabbed ? offset : 0),
          trackWidth: rect.width - thumbWidth,
        };

        if (!grabbed) {
          updateValueFromPointer(event.clientX);
        }
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

        updateValueFromPointer(event.clientX);
      }}
      onpointerup={stopDragging}
      onpointercancel={stopDragging}
      onlostpointercapture={stopDragging}
    >
      <input
        ref={input}
        class="vot-slider__control"
        type="range"
        min={finalProps.min}
        max={finalProps.max}
        value={value()}
        step={finalProps.step}
        disabled={finalProps.disabled}
        oninput={(e) => updateValue(e.currentTarget.valueAsNumber)}
      />
      <vot-block class="vot-slider__track" />
      <vot-block class="vot-slider__track vot-slider__track-progress" />
      <vot-block class="vot-slider__handle">
        <vot-block
          class="vot-slider__handle-hitbox"
          ref={(element) => (handleHitbox = element)}
        />
      </vot-block>
    </vot-block>
  );
}
