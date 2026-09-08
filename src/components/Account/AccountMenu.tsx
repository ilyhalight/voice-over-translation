import { type JSX, Show } from "solid-js";
import "./AccountMenu.scss";

import { AVATAR_SERVER_URL } from "../../config/config";
import { account } from "../../stores/account";
import { AccountInfo } from "./AccountInfo";
import { AccountLogin } from "./AccountLogin";

export type AccountMenuProps = {
  disableExternalLogin?: boolean;
  onClickLogin?: () => void;
  ref?: (element: HTMLElement) => void;
};

export function AccountMenu(props: AccountMenuProps): JSX.Element {
  const avatarId = () => account.avatarId ?? "0/0-0";
  const username = () => account.username ?? "unnamed";
  const avatarUrl = () =>
    `${AVATAR_SERVER_URL}/${avatarId()}/islands-retina-middle`;

  return (
    <vot-block ref={props.ref} class="vot-account-menu">
      <Show
        when={account.isLoggedIn}
        fallback={
          <AccountLogin
            disableExternalLogin={props.disableExternalLogin}
            onClickLogin={props.onClickLogin}
          />
        }
      >
        <AccountInfo username={username()} avatarUrl={avatarUrl()} />
      </Show>
    </vot-block>
  );
}
