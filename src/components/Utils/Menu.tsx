import { createUniqueId, type JSX, Show } from "solid-js";

export type MenuProps = {
  title: JSX.Element;
  headerChildren?: JSX.Element;
  children: JSX.Element;
  footerChildren?: JSX.Element;
};

export function Menu(props: MenuProps): JSX.Element {
  const menuId = `vot-menu-${createUniqueId()}`;
  const titleId = `vot-menu-title-${createUniqueId()}`;

  return (
    <vot-block
      class="vot-menu"
      id={menuId}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }}
    >
      <vot-block class="vot-menu__header">
        <vot-block class="vot-menu__title-container">
          <vot-block class="vot-menu-title" id={titleId}>
            {props.title}
          </vot-block>
        </vot-block>
        <Show when={props.headerChildren}>{props.headerChildren}</Show>
      </vot-block>
      <vot-block class="vot-menu__body">{props.children}</vot-block>
      <vot-block class="vot-menu__footer">
        <Show when={props.footerChildren}>{props.footerChildren}</Show>
      </vot-block>
    </vot-block>
  );
}
