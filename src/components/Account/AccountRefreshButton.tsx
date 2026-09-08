import type { JSX } from "solid-js";

import { localizationProvider } from "../../localization/localizationProvider";
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
      ariaLabel={localizationProvider.get("VOTRefresh")}
      onClick={async () => {
        await updateAccountFromStorage();
      }}
    >
      <RefreshIcon />
    </IconButton>
  );
}
