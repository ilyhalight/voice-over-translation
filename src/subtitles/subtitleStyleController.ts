import type { SubtitleFontFamily } from "../types/subtitles";
import {
  ensureGoogleSubtitleFontLoaded,
  getSubtitleFontFamilyCssValue,
} from "./fonts";

type SubtitleStyleControllerOptions = {
  onStyleChange: () => void;
  onFontLoaded: () => void;
};

export class SubtitleStyleController {
  private container: HTMLElement | null = null;
  private readonly variableValues = new Map<string, string>();
  private lastScaleCompensation: string | null = null;
  private _epoch = 0;
  private _fontSize = 20;
  private _fontSizeOverridden = false;
  private _fontFamily: SubtitleFontFamily = "default-sans";
  private _smartLayoutEnabled = true;
  private opacity = "0.2";

  constructor(private readonly options: SubtitleStyleControllerOptions) {}

  get epoch(): number {
    return this._epoch;
  }

  get fontSize(): number {
    return this._fontSize;
  }

  get fontSizeOverridden(): boolean {
    return this._fontSizeOverridden;
  }

  get fontFamily(): SubtitleFontFamily {
    return this._fontFamily;
  }

  get smartLayoutEnabled(): boolean {
    return this._smartLayoutEnabled;
  }

  get fontFamilyCssValue(): string {
    return getSubtitleFontFamilyCssValue(this._fontFamily);
  }

  attach(container: HTMLElement): void {
    this.container = container;
    this.variableValues.clear();
    this.lastScaleCompensation = null;
    this.invalidate();
    this.syncVisualStyles();
  }

  release(): void {
    this.container = null;
    this.variableValues.clear();
  }

  invalidate(): void {
    this._epoch += 1;
    this.options.onStyleChange();
  }

  setVariable(name: string, value: string | null): boolean {
    const container = this.container;
    if (!container) return false;
    const previous = this.variableValues.get(name);
    if (value === null) {
      if (previous === undefined) return false;
      this.variableValues.delete(name);
      container.style.removeProperty(name);
      this.invalidate();
      return true;
    }
    if (previous === value) return false;
    this.variableValues.set(name, value);
    container.style.setProperty(name, value);
    this.invalidate();
    return true;
  }

  setSmartLayout(enabled: boolean): boolean {
    const next = enabled !== false;
    if (next === this._smartLayoutEnabled) return false;
    this._smartLayoutEnabled = next;
    this.setVariable("--vot-subtitles-max-width", null);
    this.applyManualFontSize();
    return true;
  }

  setFontSize(size: number): boolean {
    this._fontSize = size;
    this._fontSizeOverridden = true;
    if (this._smartLayoutEnabled) return false;
    this.applyManualFontSize();
    return true;
  }

  setFontFamily(fontFamily: SubtitleFontFamily): void {
    this._fontFamily = fontFamily;
    this.applyFontFamily();
  }

  setOpacity(rate: number): void {
    const numericRate = Number(rate);
    const clampedRate = Number.isFinite(numericRate)
      ? Math.min(100, Math.max(0, numericRate))
      : 0;
    this.opacity = ((100 - clampedRate) / 100).toFixed(2);
    this.setVariable("--vot-subtitles-opacity", this.opacity);
  }

  applyScaleCompensation(visualScale: number): void {
    const compensate =
      visualScale > 0 && visualScale < 0.999 ? Math.min(1 / visualScale, 3) : 1;
    const nextValue =
      Math.abs(compensate - 1) < 0.001 ? null : compensate.toFixed(3);
    if (nextValue === this.lastScaleCompensation) return;
    this.lastScaleCompensation = nextValue;
    this.setVariable("--vot-subtitles-scale-compensation", nextValue);
  }

  private syncVisualStyles(): void {
    this.setVariable("--vot-subtitles-opacity", this.opacity);
    this.applyManualFontSize();
    this.applyFontFamily();
  }

  private applyManualFontSize(): void {
    this.setVariable(
      "--vot-subtitles-font-size",
      !this._smartLayoutEnabled && this._fontSizeOverridden
        ? `${this._fontSize}px`
        : null,
    );
  }

  private applyFontFamily(): void {
    const fontFamily = this._fontFamily;
    this.setVariable(
      "--vot-subtitles-font-family-custom",
      getSubtitleFontFamilyCssValue(fontFamily),
    );
    void ensureGoogleSubtitleFontLoaded(fontFamily, {
      forceGmXhr: true,
      onLoaded: () => {
        if (this._fontFamily === fontFamily) this.options.onFontLoaded();
      },
    });
  }
}
