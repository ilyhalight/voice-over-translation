import { createSignal } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Slider } from "./Slider";
import { SliderLabel } from "./SliderLabel";
import { SliderWrapper } from "./SliderWrapper";

const meta = {
  component: SliderWrapper,
} satisfies Meta<typeof SliderWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const [value, setValue] = createSignal(50);

const SliderWrapperContent = (
  disabled: boolean,
  title = "Auto Hide Button Delay",
) => (
  <>
    <SliderLabel value={`${value()}%`} disabled={disabled}>
      {title}
    </SliderLabel>
    <Slider
      value={value()}
      disabled={disabled}
      onInput={(val) => {
        setValue(val);
      }}
    />
  </>
);

export const SliderWrapperDefault: Story = {
  args: {
    children: SliderWrapperContent(false),
  },
};

export const SliderWrapperWithDisabled: Story = {
  args: {
    children: SliderWrapperContent(true),
  },
};
