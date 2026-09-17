import { createUniqueId, type JSX, mergeProps, Show } from "solid-js";

import "./Menu.scss";

export type MenuProps = {
  title: JSX.Element;
  headerChildren?: JSX.Element;
  children: JSX.Element;
  footerChildren?: JSX.Element;
};

export function Menu(props: MenuProps): JSX.Element {
  const finalProps = mergeProps({} as Partial<MenuProps>, props);

  const menuId = `vot-menu-${createUniqueId()}`;
  const titleId = `vot-menu-title-${createUniqueId()}`;

  return (
    <vot-block
      class="vot-menu"
      id={menuId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <vot-block class="vot-menu__header">
        <vot-block class="vot-menu__title-container">
          <vot-block class="vot-menu-title" id={titleId}>
            {finalProps.title}
          </vot-block>
        </vot-block>
        <Show when={finalProps.headerChildren}>
          {finalProps.headerChildren}
        </Show>
      </vot-block>
      <vot-block class="vot-menu__body">{finalProps.children}</vot-block>
      <vot-block class="vot-menu__footer">
        <Show when={finalProps.footerChildren}>
          {finalProps.footerChildren}
        </Show>
      </vot-block>
    </vot-block>
  );
}
