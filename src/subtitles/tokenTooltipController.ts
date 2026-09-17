import {
  mountSubtitleTokenTooltip,
  type SubtitleTokenTooltipHandle,
} from "../components/SubtitlesWidget/SubtitleTokenTooltip";
import { DEFAULT_TRANSLATION_SERVICE } from "../config/config";
import { translate } from "../core/translateApis";
import { localizationProvider } from "../localization/localizationProvider";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "../ui/shadowMount";
import { votStorage } from "../utils/storage";
import { LEADING_PUNCTUATION_RE, TRAILING_PUNCTUATION_RE } from "./renderPlan";

export type TokenTooltipContext = {
  container: HTMLElement | ShadowRoot;
  subtitlesContainer: HTMLElement | null;
  subtitlesBlock: HTMLElement | null;
  subtitleLang?: string;
  subtitleMaxWidthPx: number;
  tokenText: string;
  suppressClicksUntil: number;
};

export type TokenTooltipControllerOptions = {
  getContext: () => TokenTooltipContext;
  getTranslationService?: () => Promise<string>;
  translateText?: typeof translate;
};

const trimEdgePunctuation = (value: string): string =>
  value
    .trim()
    .replace(LEADING_PUNCTUATION_RE, "")
    .replace(TRAILING_PUNCTUATION_RE, "");

export class TokenTooltipController {
  private readonly getContext: () => TokenTooltipContext;
  private readonly getTranslationService: () => Promise<string>;
  private readonly translateText: typeof translate;
  private tooltipMount?: ShadowMount;
  private tooltip?: SubtitleTokenTooltipHandle;
  private target?: HTMLElement;
  private translationRequestId = 0;
  private translatedContext = "";

  constructor(options: TokenTooltipControllerOptions) {
    this.getContext = options.getContext;
    this.getTranslationService =
      options.getTranslationService ??
      (() => votStorage.get("translationService", DEFAULT_TRANSLATION_SERVICE));
    this.translateText = options.translateText ?? translate;
  }

  resetTranslationContext(releaseTooltip = false): void {
    this.translatedContext = "";
    if (releaseTooltip) this.release();
  }

  updateMount(): void {
    if (!this.tooltipMount) return;
    reparentShadowMount(this.tooltipMount, this.getContext().container);
    this.tooltip?.updateMount(this.tooltipMount.root);
  }

  update(): void {
    this.tooltip?.update();
  }

  release(): void {
    this.translationRequestId += 1;
    this.target?.classList.remove("selected");
    this.target = undefined;
    this.tooltip?.dispose();
    this.tooltip = undefined;
    destroyShadowMount(this.tooltipMount);
    this.tooltipMount = undefined;
  }

  readonly onGlobalPointerDown = (event: PointerEvent): void => {
    if (
      this.tooltip &&
      this.tooltipMount &&
      event.composedPath().includes(this.tooltipMount.host)
    ) {
      return;
    }

    const { subtitlesContainer } = this.getContext();
    if (
      subtitlesContainer &&
      !subtitlesContainer.contains(event.target as Node)
    ) {
      this.release();
    }
  };

  readonly onActivate = async (
    event: MouseEvent | KeyboardEvent,
  ): Promise<void> => {
    if (performance.now() < this.getContext().suppressClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const target = this.resolveTokenSpanFromEvent(event);
    if (!target) {
      this.release();
      return;
    }
    if (this.toggleCurrentTarget(target, event)) return;

    this.release();
    const requestId = this.translationRequestId;
    const text = trimEdgePunctuation(target.textContent ?? "");
    if (!text) return;
    try {
      const service = await this.getTranslationService();
      if (requestId !== this.translationRequestId) return;
      const context = this.getContext();
      target.classList.add("selected");
      const tooltip = this.createTooltip(target, {
        source: text,
        context: this.translatedContext || context.tokenText,
        translationService: service,
      });
      this.tooltip = tooltip;
      this.target = target;
      tooltip.show();
      const tokenText = context.tokenText;
      const translated = await this.translateTokens(text, context);
      if (this.shouldSkipUpdate(requestId, tooltip, target, tokenText)) return;
      this.translatedContext = translated[0];
      tooltip.setTranslation(translated[1], translated[0]);
    } catch (error) {
      if (requestId !== this.translationRequestId) return;
      console.error("[VOT] Failed to translate subtitle token:", error);
      if (this.tooltip && this.target === target) {
        const { tokenText } = this.getContext();
        this.tooltip.setTranslation(
          localizationProvider.get("requestTranslationFailed"),
          this.translatedContext || tokenText,
        );
      } else {
        this.release();
      }
    }
  };

  private async translateTokens(
    text: string,
    context: TokenTooltipContext,
  ): Promise<[string, string]> {
    const fromLang = context.subtitleLang ?? "";
    const toLang = localizationProvider.lang;
    if (this.translatedContext) {
      const translated = await this.translateText(text, fromLang, toLang);
      return [
        this.translatedContext,
        typeof translated === "string" ? translated : "",
      ];
    }
    const translated = await this.translateText(
      [context.tokenText, text],
      fromLang,
      toLang,
    );
    const pair = Array.isArray(translated)
      ? translated
      : [translated, translated];
    return [
      typeof pair[0] === "string" ? pair[0] : "",
      typeof pair[1] === "string" ? pair[1] : "",
    ];
  }

  private findTokenSpan(
    candidate: EventTarget | null,
    root: HTMLElement,
  ): HTMLSpanElement | null {
    let element: Element | null = null;
    if (candidate instanceof Element) {
      element = candidate;
    } else if (candidate instanceof Text) {
      element = candidate.parentElement;
    }
    const token = element?.closest<HTMLSpanElement>('span[data-vot-token="1"]');
    return token instanceof HTMLSpanElement && root.contains(token)
      ? token
      : null;
  }

  private resolveTokenSpanFromEvent(
    event: MouseEvent | KeyboardEvent,
  ): HTMLSpanElement | null {
    const { subtitlesBlock, subtitlesContainer } = this.getContext();
    const root = subtitlesBlock ?? subtitlesContainer;
    if (!root) return null;
    const fromTarget = this.findTokenSpan(event.target, root);
    if (fromTarget) return fromTarget;
    const path =
      typeof event.composedPath === "function" ? event.composedPath() : [];
    for (const node of path) {
      const fromPath = this.findTokenSpan(node, root);
      if (fromPath) return fromPath;
    }
    if (!(event instanceof MouseEvent)) return null;
    return Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
      ? this.findTokenSpan(
          document.elementFromPoint(event.clientX, event.clientY),
          root,
        )
      : null;
  }

  private toggleCurrentTarget(
    target: HTMLElement,
    event: MouseEvent | KeyboardEvent,
  ): boolean {
    const tooltip = this.tooltip;
    if (this.target !== target || !tooltip) return false;
    const syncSelectedState = () => {
      if (this.target === target && this.tooltip === tooltip) {
        target.classList.toggle("selected", tooltip.isOpen());
      }
    };
    if (event instanceof KeyboardEvent) {
      requestAnimationFrame(syncSelectedState);
    } else {
      syncSelectedState();
    }
    return true;
  }

  private createTooltip(
    target: HTMLElement,
    content: {
      source: string;
      context: string;
      translationService: string;
    },
  ): SubtitleTokenTooltipHandle {
    const context = this.getContext();
    const viewportWidth = Math.max(320, globalThis.innerWidth || 0);
    const preferredWidth = Math.max(
      360,
      context.subtitlesContainer?.offsetWidth ?? 0,
      context.subtitlesBlock?.offsetWidth ?? 0,
      Math.min(context.subtitleMaxWidthPx || 0, 720),
    );
    this.tooltipMount = createShadowMount({
      parent: context.container,
      rootClasses: ["vot-portal-local"],
      hostStyles: {
        position: "absolute",
        inset: "0",
        display: "block",
        "pointer-events": "none",
      },
      rootStyles: {
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        "pointer-events": "none",
      },
    });
    return mountSubtitleTokenTooltip({
      target,
      anchor: context.subtitlesBlock ?? target,
      parentElement: this.tooltipMount.root,
      maxWidth: Math.min(viewportWidth - 24, preferredWidth, 720),
      source: content.source,
      context: content.context,
      translationService: content.translationService,
    });
  }

  private shouldSkipUpdate(
    requestId: number,
    tooltip: SubtitleTokenTooltipHandle,
    target: HTMLElement,
    tokenText: string,
  ): boolean {
    return (
      requestId !== this.translationRequestId ||
      tokenText !== this.getContext().tokenText ||
      this.tooltip !== tooltip ||
      this.target !== target ||
      !tooltip.isOpen()
    );
  }
}
