import type { JSX } from "solid-js";
import "./AccountLogin.scss";

import { produce } from "solid-js/store";
import { localizationProvider } from "../../localization/localizationProvider";
import { setAccount } from "../../stores/account";
import { votStorage } from "../../utils/storage";
import { Textfield } from "../Textfield/Textfield";
import { OrBlock } from "../Utils/OrBlock";
import { AccountRefreshButton } from "./AccountRefreshButton";

export type AccountLoginProps = {
  ref?: (element: HTMLElement) => void;
  disableExternalLogin?: boolean;
  onClickLogin?: () => void;
};

const TOKEN_LIFETIME = 31_534_180_000; // 1 year in milliseconds

export function AccountLogin(props: AccountLoginProps): JSX.Element {
  const disabledExternalLogin = () =>
    props.disableExternalLogin ?? votStorage.isSupportOnlyLS;

  return (
    <vot-block ref={props.ref} class="vot-account-login">
      <vot-block
        class="vot-account-login__btn"
        aria-disabled={disabledExternalLogin()}
        onClick={() => {
          if (disabledExternalLogin()) {
            return;
          }

          props.onClickLogin?.();
        }}
      >
        <vot-block class="vot-account-login__btn-icon" />
        <vot-block class="vot-account-login__btn-text">
          {localizationProvider.get("VOTSignInWithYandex")}
        </vot-block>
      </vot-block>
      <OrBlock>{localizationProvider.get("VOTOrUseToken")}</OrBlock>
      <vot-block class="vot-account-login__token">
        <Textfield
          labelText={localizationProvider.get("VOTLoginViaToken")}
          placeholder={localizationProvider.get("VOTYandexToken")}
          onChange={async (value) => {
            const data = value
              ? {
                  token: value,
                  expires: Date.now() + TOKEN_LIFETIME,
                }
              : {};
            const isLoggedIn = Boolean(value);

            // TODO: add get account info via token and set username and avatarId
            await votStorage.set("account", { ...data });
            setAccount(
              produce((state) => {
                state.token = data.token;
                state.expires = data.expires;
                state.isLoggedIn = isLoggedIn;
              }),
            );
          }}
        />
        <AccountRefreshButton />
      </vot-block>
    </vot-block>
  );
}
