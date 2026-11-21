import type { JSX } from "@solidjs/web";
import { t } from "#localizationProvider";
import { YANDEX_TOKEN_DEFAULT_LIFETIME } from "#modules/auth/consts.ts";
import { votStorage } from "#utils/storage.ts";
import { setAccount } from "../../stores/account";
import { Textfield } from "../Textfield/Textfield";
import { OrBlock } from "../Utils/OrBlock";
import { AccountRefreshButton } from "./AccountRefreshButton";

export type AccountLoginProps = {
  ref?: (element: HTMLElement) => void;
  disableExternalLogin?: boolean;
  onClickLogin?: () => void;
};

export function AccountLogin(props: AccountLoginProps): JSX.Element {
  const disableExternalLogin = () =>
    props.disableExternalLogin ?? votStorage.isSupportOnlyLS;

  return (
    <vot-block ref={props.ref} class="vot-account-login">
      <vot-block
        class="vot-account-login__btn"
        aria-disabled={disableExternalLogin()}
        onClick={() => {
          if (disableExternalLogin()) {
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
            setAccount((state) => {
              state.token = data.token;
              state.expires = data.expires;
              state.isLoggedIn = isLoggedIn;
            });
          }}
        />
        <AccountRefreshButton />
      </vot-block>
    </vot-block>
  );
}
