import type { JSX } from "@solidjs/web";
import { merge } from "solid-js";

import type {
  OnClickEvent,
  VOTElementAttributes,
} from "#types/components/shared.ts";
import { isKeyboardActivation } from "../componentShared";

export type RawButtonProps = {
  class: string;
  hidden?: boolean;
  disabled?: boolean;
  ref?: (element: HTMLElement) => void;
  children: JSX.Element;
  onClick?: (event: OnClickEvent) => void;
  buttonProps?: VOTElementAttributes;
};

export function RawButton(props: RawButtonProps): JSX.Element {
  const finalProps = merge({ hidden: false, disabled: false }, props);
  const tabIndex = () => (finalProps.disabled ? -1 : 0);

  return (
    <vot-block
      ref={finalProps.ref}
      class={finalProps.class}
      role="button"
      tabindex={tabIndex()}
      aria-disabled={finalProps.disabled ? "true" : undefined}
      hidden={finalProps.hidden}
      onClick={(event) => {
        if (finalProps.disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        finalProps.onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (!isKeyboardActivation(event)) {
          return;
        }

        event.preventDefault();
        if (finalProps.disabled) {
          return;
        }

        event.currentTarget.click();
      }}
      {...finalProps.buttonProps}
    >
      {finalProps.children}
    </vot-block>
  );
}
