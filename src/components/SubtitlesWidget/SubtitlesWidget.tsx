import {
  batch,
  createSignal,
  Index,
  type JSX,
  Match,
  onCleanup,
  Switch,
} from "solid-js";

import "./SubtitlesWidget.scss";

import { buildSubtitleInlineStyleCssText } from "../../subtitles/inlineStyle";
import type {
  SubtitleRenderPlanPart,
  SubtitleRenderPlanSpanPart,
} from "../../subtitles/renderPlan";
import { effect, render } from "../../ui/solid/renderer";

export type SubtitlesWidgetProps = {
  parts: SubtitleRenderPlanPart[];
  lang: string;
  onClick: (event: MouseEvent) => void;
  onHighlightRef?: (index: number, element?: HTMLSpanElement) => void;
  ref: (element: HTMLElement) => void;
};

export type SolidSubtitlesWidgetHandle = {
  setParts: (parts: SubtitleRenderPlanPart[]) => void;
  block: () => HTMLElement;
  highlightEls: () => HTMLSpanElement[];
  dispose: () => void;
};

function isSpanPart(
  part: SubtitleRenderPlanPart,
): part is SubtitleRenderPlanSpanPart {
  if (part.kind === "break") return false;
  return (
    part.kind === "word" ||
    Boolean(part.style) ||
    part.highlightIndex !== undefined
  );
}

function SubtitlePart(props: {
  index: number;
  part: SubtitleRenderPlanPart;
  onHighlightRef?: (index: number, element?: HTMLSpanElement) => void;
}): JSX.Element {
  let span: HTMLSpanElement | undefined;
  const spanPart = (): SubtitleRenderPlanSpanPart | undefined =>
    isSpanPart(props.part) ? props.part : undefined;
  const syncHighlightRef = () => {
    const part = props.part;
    props.onHighlightRef?.(
      props.index,
      span && isSpanPart(part) && part.highlightIndex !== undefined
        ? span
        : undefined,
    );
  };

  effect(syncHighlightRef);
  onCleanup(() => props.onHighlightRef?.(props.index));

  return (
    <Switch fallback={props.part.kind === "text" ? props.part.text : undefined}>
      <Match when={props.part.kind === "break"}>
        <br class="vot-subtitles-br" />
      </Match>
      <Match when={spanPart()}>
        {(part) => (
          <span
            ref={(element) => {
              span = element;
              syncHighlightRef();
            }}
            data-vot-token={part().kind === "word" ? "1" : undefined}
            data-vot-highlight-index={part().highlightIndex}
            data-vot-style-italic={part().style?.italic ? "1" : "0"}
            data-vot-style-bold={part().style?.bold ? "1" : "0"}
            data-vot-style-underline={part().style?.underline ? "1" : "0"}
            data-vot-style-color={part().style?.color ? "1" : "0"}
            style={buildSubtitleInlineStyleCssText(part().style)}
          >
            {part().text}
          </span>
        )}
      </Match>
    </Switch>
  );
}

export function SolidSubtitlesWidget(props: SubtitlesWidgetProps): JSX.Element {
  let block: HTMLElement | undefined;
  const syncLang = () => {
    const lang = props.lang;
    if (!block) return;
    if (lang) block.setAttribute("lang", lang);
    else block.removeAttribute("lang");
  };

  effect(syncLang);

  return (
    <vot-block
      ref={(element) => {
        block = element;
        props.ref(element);
        syncLang();
      }}
      class="vot-subtitles"
      dir="auto"
      onClick={props.onClick}
    >
      <Index each={props.parts}>
        {(part, index) => (
          <SubtitlePart
            index={index}
            part={part()}
            onHighlightRef={props.onHighlightRef}
          />
        )}
      </Index>
    </vot-block>
  );
}

export function mountSolidSubtitlesWidget(
  container: HTMLElement,
  options: {
    lang: () => string;
    onClick: (event: MouseEvent) => void;
  },
): SolidSubtitlesWidgetHandle {
  const [parts, setParts] = createSignal<SubtitleRenderPlanPart[]>([]);
  const [lang, setLang] = createSignal(options.lang());
  const highlightRefs = new Map<number, HTMLSpanElement>();
  let block: HTMLElement | undefined;

  container.replaceChildren();
  const subtitlesView = (): JSX.Element => (
    <SolidSubtitlesWidget
      ref={(element) => {
        block = element;
      }}
      parts={parts()}
      lang={lang()}
      onClick={options.onClick}
      onHighlightRef={(index, element) => {
        if (element) highlightRefs.set(index, element);
        else highlightRefs.delete(index);
      }}
    />
  );
  const disposeRoot = render(() => subtitlesView() as Node, container);

  return {
    setParts: (nextParts) => {
      batch(() => {
        setLang(options.lang());
        setParts(nextParts);
      });
    },
    block: () => {
      if (!block) throw new Error("Subtitles widget failed to mount");
      return block;
    },
    highlightEls: () =>
      Array.from(highlightRefs.entries())
        .sort(([left], [right]) => left - right)
        .map(([, element]) => element),
    dispose: () => {
      disposeRoot();
      highlightRefs.clear();
      block = undefined;
      container.replaceChildren();
    },
  };
}
