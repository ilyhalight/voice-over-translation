import { EventImpl } from "../../core/eventImpl";
import UI from "../../ui";
import { DOWNLOAD_ICON } from "../icons";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";

export default class DownloadButton {
  button: HTMLElement;
  loaderMain: SVGPathElement;
  loaderCircle: SVGCircleElement;

  private readonly onClick = new EventImpl();
  private readonly events = {
    click: this.onClick,
  };
  private _progress = 0;

  constructor() {
    const elements = this.createElements();
    this.button = elements.button;
    this.loaderMain = elements.loaderMain;
    this.loaderCircle = elements.loaderCircle;
    this.progress = 0;
  }

  private createElements() {
    const button = UI.createIconButton(DOWNLOAD_ICON, {
      ariaLabel: "Download translation",
    });
    const loaderMain = button.querySelector<SVGPathElement>(".vot-loader-main");
    if (!loaderMain) {
      throw new Error("[VOT] DownloadButton loader main element not found");
    }

    const loaderCircle = button.querySelector<SVGCircleElement>(
      ".vot-loader-progress",
    );
    if (!loaderCircle) {
      throw new Error("[VOT] DownloadButton loader circle element not found");
    }
    button.addEventListener("click", () => {
      this.onClick.dispatch();
    });
    return { button, loaderMain, loaderCircle };
  }

  addEventListener(_type: "click", listener: () => void): this {
    addComponentEventListener(this.events, "click", listener);

    return this;
  }

  removeEventListener(_type: "click", listener: () => void): this {
    removeComponentEventListener(this.events, "click", listener);

    return this;
  }

  get progress() {
    return this._progress;
  }

  set progress(value: number) {
    // Accept both 0..1 (fraction) and 0..100 (percent).
    const normalized = clampProgress(value);
    this._progress = normalized;
    const circumference = this.getCircleCircumference();
    this.loaderCircle.style.strokeDasharray = `${circumference}`;
    const offset = circumference * (1 - normalized / 100);
    this.loaderCircle.style.strokeDashoffset = `${offset}`;
    // Show the main icon only when idle.
    this.loaderMain.style.opacity = normalized === 0 ? "1" : "0";
    this.loaderCircle.style.opacity = normalized === 0 ? "0" : "1";
  }

  private getCircleCircumference(): number {
    const radius = this.loaderCircle.r?.baseVal?.value ?? 0;
    return 2 * Math.PI * radius;
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.button, isHidden);
  }

  get hidden() {
    return getHiddenState(this.button);
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // We treat values in the 0..1 range as a *fraction* EXCEPT for `1`.
  // `1` is ambiguous (could mean 1% or 100%). Our download code reports
  // integer percentages, so `1` should be treated as 1%.
  const asPercent = value < 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(asPercent)));
}
