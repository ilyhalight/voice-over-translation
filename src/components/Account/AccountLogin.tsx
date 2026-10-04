import { type JSX, mergeProps } from "solid-js";
import { produce } from "solid-js/store";
import "./AccountLogin.scss";

import { YANDEX_TOKEN_DEFAULT_LIFETIME } from "../../config/auth";
import { t } from "../../localization/localizationProvider";
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

export function AccountLogin(props: AccountLoginProps): JSX.Element {
  const finalProps = mergeProps(
    { disableExternalLogin: votStorage.isSupportOnlyLS },
    props,
  );

  return (
    <vot-block ref={finalProps.ref} class="vot-account-login">
      <vot-block
        class="vot-account-login__btn"
        aria-disabled={finalProps.disableExternalLogin}
        onClick={() => {
          if (finalProps.disableExternalLogin) {
            return;
          }

          props.onClickLogin?.();
        }}
      >
        <vot-block class="vot-account-login__btn-icon" />
        <vot-block class="vot-account-login__btn-text">
          {t("VOTSignInWithYandex")}
        </vot-block>
      </vot-block>
      <OrBlock>{t("VOTOrUseToken")}</OrBlock>
      <vot-block class="vot-account-login__token">
        <Textfield
          labelText={t("VOTLoginViaToken")}
          placeholder={t("VOTYandexToken")}
          onChange={async (value) => {
            const data = value
              ? {
                  token: value,
                  expires: Date.now() + YANDEX_TOKEN_DEFAULT_LIFETIME,
                }
              : {};
            const isLoggedIn = Boolean(value);

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
