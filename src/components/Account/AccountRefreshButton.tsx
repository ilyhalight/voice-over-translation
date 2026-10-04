import type { JSX } from "solid-js";
import { t } from "../../localization/localizationProvider";
import { updateAccountInfo } from "../../modules/auth/yandex";
import { account, updateAccountFromStorage } from "../../stores/account";
import { IconButton } from "../Button/IconButton";
import { RefreshIcon } from "../Icons/RefreshIcon";

export type AccountRefreshButtonProps = {
  ref?: (element: HTMLElement) => void;
};

export function AccountRefreshButton(
  props: AccountRefreshButtonProps,
): JSX.Element {
  return (
    <IconButton
      ref={props.ref}
      ariaLabel={t("VOTRefresh")}
      disabled={account.isRefreshing}
      onClick={async () => {
        if (account.isRefreshing) {
          return;
        }

        try {
          await updateAccountInfo();
        } catch {
          await updateAccountFromStorage();
        }
      }}
    >
      <RefreshIcon />
    </IconButton>
  );
}
