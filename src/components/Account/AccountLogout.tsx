import type { JSX } from "solid-js";

import "./AccountLogout.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import { resetAccount } from "../../stores/account";
import { votStorage } from "../../utils/storage";
import { TextButton } from "../Button/TextButton";
import { LogoutIcon } from "../Icons/LogoutIcon";

export type AccountLogoutProps = {
  ref?: (element: HTMLElement) => void;
};

export function AccountLogout(props: AccountLogoutProps): JSX.Element {
  return (
    <vot-block class="vot-account-logout">
      <TextButton
        ref={props.ref}
        onClick={async () => {
          await votStorage.delete("account");
          resetAccount();
        }}
      >
        <vot-block class="vot-account-logout__content">
          <LogoutIcon />
          {localizationProvider.get("VOTLogout")}
        </vot-block>
      </TextButton>
    </vot-block>
  );
}
