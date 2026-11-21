import type { JSX } from "@solidjs/web";
import {
  createMemo,
  createSignal,
  createUniqueId,
  merge,
  Show,
} from "solid-js";

import { RawButton } from "../Button/RawButton";
import { ChevronIcon } from "../Icons/ChevronIcon";

export type SettingsSectionProps = {
  title: string;
  children: JSX.Element;
  isOpen?: boolean;
  lazy?: boolean;
};

export function SettingsSection(props: SettingsSectionProps): JSX.Element {
  const finalProps = merge({ isOpen: false }, props);

  const sectionId = createUniqueId();
  const headerId = `${sectionId}-header`;
  const contentId = `${sectionId}-content`;

  const [isOpen, setIsOpen] = createSignal(() => finalProps.isOpen);

  // stays mounted after first open so collapsing doesn't re-run its resources
  const wasOpened = createMemo<boolean>((prev) => prev || isOpen(), {
    loadingValue: false,
  });

  return (
    <vot-block class="vot-settings-section">
      <RawButton
        class="vot-details vot-settings-section__header"
        buttonProps={{
          id: headerId,
          "aria-controls": contentId,
          "data-open": isOpen(),
          "aria-expanded": isOpen(),
        }}
        onClick={() => {
          setIsOpen(!isOpen());
        }}
      >
        <vot-block>{finalProps.title}</vot-block>
        <vot-block class="vot-details-arrow-icon">
          <ChevronIcon />
        </vot-block>
      </RawButton>

      <vot-block
        class="vot-settings-section__content"
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen()}
      >
        <Show when={!finalProps.lazy || wasOpened()}>
          {finalProps.children}
        </Show>
      </vot-block>
    </vot-block>
  );
}
