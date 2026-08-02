import UI from "../../ui";
import { clampPercentInt } from "../../utils/volume";
import { DOWNLOAD_ICON } from "../icons";
import { UIComponentWithEvents } from "./componentShared";

export default class DownloadButton extends UIComponentWithEvents<{
  click: [];
}> {
  loaderMain: SVGPathElement;
  loaderCircle: SVGCircleElement;

  private _progress = 0;

  constructor() {
    super(["click"]);
    const { container, loaderMain, loaderCircle } = this.createElements();
    this.container = container;
    this.loaderMain = loaderMain;
    this.loaderCircle = loaderCircle;
    this.progress = 0;
  }

  protected createElements() {
    const container = UI.createIconButton(DOWNLOAD_ICON, {
      ariaLabel: "Download translation",
    });
    const loaderMain =
      container.querySelector<SVGPathElement>(".vot-loader-main");
    if (!loaderMain) {
      throw new Error("[VOT] DownloadButton loader main element not found");
    }

    const loaderCircle = container.querySelector<SVGCircleElement>(
      ".vot-loader-progress",
    );
    if (!loaderCircle) {
      throw new Error("[VOT] DownloadButton loader circle element not found");
    }
    container.addEventListener("click", () => {
      this.dispatch("click");
    });
    return { container, loaderMain, loaderCircle };
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
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // We treat values in the 0..1 range as a *fraction* EXCEPT for `1`.
  // `1` is ambiguous (could mean 1% or 100%). Our download code reports
  // integer percentages, so `1` should be treated as 1%.
  const asPercent = value < 1 ? value * 100 : value;
  return clampPercentInt(asPercent);
}
