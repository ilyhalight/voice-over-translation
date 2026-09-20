import type { JSX } from "solid-js";
import { updateAccountInfo } from "../../core/auth/yandex";
import { t } from "../../localization/localizationProvider";
import { updateAccountFromStorage } from "../../stores/account";
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
      onClick={async () => {
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
