import type { JSX } from "solid-js";
import "./AccountInfo.scss";
import { localizationProvider } from "../../localization/localizationProvider";
import { AccountLogout } from "./AccountLogout";
import { AccountRefreshButton } from "./AccountRefreshButton";

export type AccountInfoProps = {
  username: string;
  avatarUrl: string;
  ref?: (element: HTMLElement) => void;
};

export function AccountInfo(props: AccountInfoProps): JSX.Element {
  return (
    <vot-block ref={props.ref} class="vot-account-info">
      <vot-block class="vot-account-info__block">
        <vot-block class="vot-account-info__avatar">
          <img
            class="vot-account-info__avatar-img"
            src={props.avatarUrl}
            alt={`Avatar of ${props.username}`}
          ></img>
        </vot-block>
        <vot-block class="vot-account-info__content">
          <vot-block class="vot-account-info__label">
            {localizationProvider.get("VOTSignedInAs")}
          </vot-block>
          <vot-block class="vot-account-info__username">
            {props.username}
          </vot-block>
        </vot-block>
        <vot-block class="vot-account-info__refresh">
          <AccountRefreshButton />
        </vot-block>
      </vot-block>
      <vot-block class="vot-account-info__block">
        <AccountLogout />
      </vot-block>
    </vot-block>
  );
}
