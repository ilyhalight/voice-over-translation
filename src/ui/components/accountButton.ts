import UI from "../../ui";
import { EventImpl } from "../../core/eventImpl";
import { AccountButtonProps } from "../../types/components/accountButton";
import { REFRESH_ICON, KEY_ICON } from "../icons";
import { avatarServerUrl } from "../../config/config";

export default class AccountButton {
  container: HTMLElement;
  accountWrapper: HTMLElement;
  buttons: HTMLElement;
  usernameEl: HTMLElement;
  avatarEl: HTMLElement;
  avatarImg: HTMLImageElement;
  actionButton: HTMLElement;
  refreshButton: HTMLElement;
  tokenButton: HTMLElement;

  private onClick = new EventImpl();
  private onRefresh = new EventImpl();
  private onClickSecret = new EventImpl();
  private _loggedIn: boolean;
  private _username: string;
  private _avatarId: string;

  constructor({
    loggedIn = false,
    username = "unnamed",
    avatarId = "0/0-0",
  }: AccountButtonProps = {}) {
    this._loggedIn = loggedIn;
    this._username = username;
    this._avatarId = avatarId;
    const elements = this.createElements();
    this.container = elements.container;
    this.accountWrapper = elements.accountWrapper;
    this.buttons = elements.buttons;
    this.usernameEl = elements.usernameEl;
    this.avatarEl = elements.avatarEl;
    this.avatarImg = elements.avatarImg;

    this.actionButton = elements.actionButton;
    this.refreshButton = elements.refreshButton;
    this.tokenButton = elements.tokenButton;
  }

  private createElements() {
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
      this.onClick.dispatch();
    });
    const tokenButton = UI.createIconButton(KEY_ICON);
    tokenButton.hidden = this._loggedIn;
    tokenButton.addEventListener("click", () => {
      this.onClickSecret.dispatch();
    });

    const refreshButton = UI.createIconButton(REFRESH_ICON);
    refreshButton.addEventListener("click", () => {
      this.onRefresh.dispatch();
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

  addEventListener(
    type: "click" | "click:secret" | "refresh",
    listener: () => void,
  ): this {
    switch (type) {
      case "click":
        this.onClick.addListener(listener);
        break;
      case "click:secret":
        this.onClickSecret.addListener(listener);
        break;
      case "refresh":
        this.onRefresh.addListener(listener);
        break;
    }

    return this;
  }

  removeEventListener(
    type: "click" | "click:secret" | "refresh",
    listener: () => void,
  ): this {
    switch (type) {
      case "click":
        this.onClick.removeListener(listener);
        break;
      case "click:secret":
        this.onClickSecret.removeListener(listener);
        break;
      case "refresh":
        this.onRefresh.removeListener(listener);
        break;
    }

    return this;
  }

  get buttonText() {
    return this._loggedIn ? `Logout` : "Login";
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
    this._avatarId = avatarId ?? "0/0-0";
    this.avatarImg.src = `${avatarServerUrl}/${this._avatarId}/islands-retina-middle`;
  }

  get username() {
    return this._username;
  }

  set username(username: string | undefined) {
    this._username = username ?? "unnamed";
    this.usernameEl.textContent = this._username;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}
