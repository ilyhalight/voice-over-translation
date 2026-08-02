import { avatarServerUrl } from "../../config/config";
import { localizationProvider } from "../../localization/localizationProvider";
import type { AccountButtonProps } from "../../types/components/accountButton";
import UI from "../../ui";
import { KEY_ICON, REFRESH_ICON } from "../icons";
import { UIComponentWithEvents } from "./componentShared";

const DEFAULT_AVATAR_ID = "0/0-0";
const DEFAULT_USERNAME = "unnamed";

export default class AccountButton extends UIComponentWithEvents<{
  click: [];
  "click:secret": [];
  refresh: [];
}> {
  accountWrapper: HTMLElement;
  buttons: HTMLElement;
  usernameEl: HTMLElement;
  avatarEl: HTMLElement;
  avatarImg: HTMLImageElement;
  actionButton: HTMLElement;
  refreshButton: HTMLElement;
  tokenButton: HTMLElement;

  private _loggedIn: boolean;
  private _username: string;
  private _avatarId: string;

  constructor({
    loggedIn = false,
    username = DEFAULT_USERNAME,
    avatarId = DEFAULT_AVATAR_ID,
  }: AccountButtonProps = {}) {
    super(["click", "click:secret", "refresh"]);
    this._loggedIn = loggedIn;
    this._username = username;
    this._avatarId = avatarId;
    const {
      container,
      accountWrapper,
      buttons,
      usernameEl,
      avatarEl,
      avatarImg,
      actionButton,
      refreshButton,
      tokenButton,
    } = this.createElements();
    this.container = container;
    this.accountWrapper = accountWrapper;
    this.buttons = buttons;
    this.usernameEl = usernameEl;
    this.avatarEl = avatarEl;
    this.avatarImg = avatarImg;

    this.actionButton = actionButton;
    this.refreshButton = refreshButton;
    this.tokenButton = tokenButton;
  }

  protected createElements() {
    const container = UI.createEl("vot-block", ["vot-account"]);
    const accountWrapper = UI.createEl("vot-block", ["vot-account-wrapper"]);
    accountWrapper.hidden = !this._loggedIn;

    const avatarImg = UI.createEl("img", [
      "vot-account-avatar-img",
    ]) as HTMLImageElement;
    avatarImg.src = `${avatarServerUrl}/${this._avatarId}/islands-retina-middle`;
    avatarImg.loading = "lazy";
    avatarImg.alt = "user avatar";
    const avatarEl = UI.createEl(
      "vot-block",
      ["vot-account-avatar"],
      avatarImg,
    );
    const usernameEl = UI.createEl("vot-block", ["vot-account-username"]);
    usernameEl.textContent = this._username;
    accountWrapper.append(avatarEl, usernameEl);

    const buttons = UI.createEl("vot-block", ["vot-account-buttons"]);
    const actionButton = UI.createOutlinedButton(this.buttonText);
    actionButton.addEventListener("click", () => {
      this.dispatch("click");
    });
    const tokenButton = UI.createIconButton(KEY_ICON, {
      ariaLabel: localizationProvider.get("VOTLoginViaToken"),
    });
    tokenButton.hidden = this._loggedIn;
    tokenButton.addEventListener("click", () => {
      this.dispatch("click:secret");
    });

    const refreshButton = UI.createIconButton(REFRESH_ICON, {
      ariaLabel: localizationProvider.get("VOTRefresh"),
    });
    refreshButton.addEventListener("click", () => {
      this.dispatch("refresh");
    });
    buttons.append(actionButton, tokenButton, refreshButton);
    container.append(accountWrapper, buttons);

    return {
      container,
      accountWrapper,
      buttons,
      usernameEl,
      avatarImg,
      avatarEl,
      actionButton,
      refreshButton,
      tokenButton,
    };
  }

  get buttonText() {
    return this._loggedIn
      ? localizationProvider.get("VOTLogout")
      : localizationProvider.get("VOTLogin");
  }

  get loggedIn() {
    return this._loggedIn;
  }

  set loggedIn(isLoggedIn: boolean) {
    this._loggedIn = isLoggedIn;
    this.accountWrapper.hidden = !this._loggedIn;
    this.actionButton.textContent = this.buttonText;
    this.tokenButton.hidden = this._loggedIn;
  }

  get avatarId() {
    return this._avatarId;
  }

  set avatarId(avatarId: string | undefined) {
    this._avatarId = avatarId ?? DEFAULT_AVATAR_ID;
    this.avatarImg.src = `${avatarServerUrl}/${this._avatarId}/islands-retina-middle`;
  }

  get username() {
    return this._username;
  }

  set username(username: string | undefined) {
    this._username = username ?? DEFAULT_USERNAME;
    this.usernameEl.textContent = this._username;
  }
}
