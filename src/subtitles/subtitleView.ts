import { createRenderEffect, createRoot, createSignal } from "solid-js";

import { buildSubtitleInlineStyleCssText } from "./inlineStyle";
import type {
  SubtitleRenderPlanPart,
  SubtitleRenderPlanPartBreak,
  SubtitleRenderPlanPartText,
  SubtitleRenderPlanSpanPart,
} from "./renderPlan";

export type SubtitleViewOptions = {
  /** BCP-47 tag for the rendered block; empty string clears the attribute. */
  lang: () => string;
  onClick: (event: PointerEvent) => void;
};

export type SubtitleViewHandle = {
  /** Replaces the rendered plan and applies it synchronously. */
  setParts: (parts: SubtitleRenderPlanPart[]) => void;
  /** The `.vot-subtitles` block element. */
  block: () => HTMLElement;
  /** Highlightable spans in plan order, collected while rendering. */
  highlightEls: () => HTMLSpanElement[];
  dispose: () => void;
};

type PartShape = "break" | "span" | "text";

type ClassifiedPart =
  | { shape: "break"; part: SubtitleRenderPlanPartBreak }
  | { shape: "span"; part: SubtitleRenderPlanSpanPart }
  | { shape: "text"; part: SubtitleRenderPlanPartText };

function classifyPart(part: SubtitleRenderPlanPart): ClassifiedPart {
  if (part.kind === "break") return { shape: "break", part };
  if (part.kind === "word" || part.style || part.highlightIndex !== undefined) {
    return { shape: "span", part };
  }
  return { shape: "text", part };
}

function shapeMatches(node: Node, shape: PartShape): boolean {
  if (shape === "text") return node.nodeType === Node.TEXT_NODE;
  if (shape === "break") return (node as Element).nodeName === "BR";
  return (node as Element).nodeName === "SPAN";
}

/** Write-if-changed: an unchanged attribute write still costs a style recalc. */
function setAttr(el: Element, name: string, value: string | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
    return;
  }
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function applySpan(
  el: HTMLSpanElement,
  part: SubtitleRenderPlanSpanPart,
): void {
  if (el.textContent !== part.text) el.textContent = part.text;
  setAttr(el, "data-vot-token", part.kind === "word" ? "1" : null);
  setAttr(
    el,
    "data-vot-highlight-index",
    part.highlightIndex === undefined ? null : String(part.highlightIndex),
  );
  setAttr(el, "data-vot-style-italic", part.style?.italic ? "1" : "0");
  setAttr(el, "data-vot-style-bold", part.style?.bold ? "1" : "0");
  setAttr(el, "data-vot-style-underline", part.style?.underline ? "1" : "0");
  setAttr(el, "data-vot-style-color", part.style?.color ? "1" : "0");

  const cssText = buildSubtitleInlineStyleCssText(part.style);
  if (cssText) {
    if (el.style.cssText !== cssText) el.style.cssText = cssText;
  } else if (el.style.cssText) {
    el.style.cssText = "";
  }
}

function createNode(classified: ClassifiedPart): ChildNode {
  switch (classified.shape) {
    case "break": {
      const br = document.createElement("br");
      br.className = "vot-subtitles-br";
      return br;
    }
    case "text":
      return document.createTextNode(classified.part.text);
    case "span": {
      const span = document.createElement("span");
      applySpan(span, classified.part);
      return span;
    }
  }
}

/**
 * Subtitle block rendered from a Solid reactive root.
 *
 * - One signal holds the whole plan; `equals: false` because the widget rebuilds
 *   the array on every tick and the identity check would be wasted work.
 * - `createRenderEffect` (not `createEffect`) so DOM writes happen synchronously
 *   on `setParts`; the widget reads `block()` / `highlightEls()` immediately
 *   afterwards. Render effects are the same phase Solid uses for its own DOM
 *   bindings.
 * - Rows are reconciled positionally and reused whenever the shape at an index
 *   is unchanged (measured in Chromium: 6.32 ms reuse vs 29.80 ms rebuild over
 *   200 cue swaps). Plans are replaced wholesale and never reordered, so
 *   identity keying would only destroy reusable nodes.
 * - No JSX: the build has no JSX transform, so the view drives the DOM with
 *   Solid's reactive primitives directly instead of compiled templates.
 * - A native `click` listener is used because the container can live inside a
 *   shadow root, where Solid's document-level event delegation never sees the
 *   retargeted event.
 */
export function mountSubtitleView(
  container: HTMLElement,
  options: SubtitleViewOptions,
): SubtitleViewHandle {
  const [parts, setParts] = createSignal<SubtitleRenderPlanPart[]>([], {
    equals: false,
  });

  const blockEl = document.createElement("vot-block");
  blockEl.className = "vot-subtitles";
  blockEl.setAttribute("dir", "auto");

  const onClick = options.onClick as EventListener;
  blockEl.addEventListener("click", onClick);

  const highlights: HTMLSpanElement[] = [];

  const disposeRoot = createRoot((dispose) => {
    createRenderEffect(() => {
      setAttr(blockEl, "lang", options.lang() || null);
    });

    createRenderEffect(() => {
      const plan = parts();
      highlights.length = 0;

      let node = blockEl.firstChild;
      for (let i = 0; i < plan.length; i += 1) {
        const classified = classifyPart(plan[i]);
        const shape = classified.shape;

        if (!node || !shapeMatches(node, shape)) {
          const created = createNode(classified);
          if (node) blockEl.replaceChild(created, node);
          else blockEl.appendChild(created);
          node = created;
        } else if (classified.shape === "span") {
          applySpan(node as HTMLSpanElement, classified.part);
        } else if (
          classified.shape === "text" &&
          node.nodeValue !== classified.part.text
        ) {
          node.nodeValue = classified.part.text;
        }

        if (
          classified.shape === "span" &&
          classified.part.highlightIndex !== undefined
        ) {
          highlights.push(node as HTMLSpanElement);
        }
        node = node.nextSibling;
      }

      while (node) {
        const next = node.nextSibling;
        blockEl.removeChild(node);
        node = next;
      }
    });

    return dispose;
  });

  container.replaceChildren(blockEl);

  return {
    setParts: (next) => setParts(next),
    block: () => blockEl,
    highlightEls: () => highlights.slice(),
    dispose: () => {
      disposeRoot();
      blockEl.removeEventListener("click", onClick);
      highlights.length = 0;
      container.textContent = "";
    },
  };
}
