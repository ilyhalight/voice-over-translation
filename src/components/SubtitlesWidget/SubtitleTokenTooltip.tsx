import { createSignal, type JSX } from "solid-js";

import { localizationProvider } from "../../localization/localizationProvider";
import { render } from "../../ui/solid/renderer";
import { Tooltip, type TooltipControls } from "../Utils/Tooltip";

export type SubtitleTokenTooltipOptions = {
  target: HTMLElement;
  anchor: HTMLElement;
  parentElement: HTMLElement | ShadowRoot;
  maxWidth: number;
  source: string;
  context: string;
  translationService: string;
};

export type SubtitleTokenTooltipHandle = {
  show: () => void;
  update: () => void;
  isOpen: () => boolean;
  setTranslation: (header: string, context: string) => void;
  updateMount: (parentElement: HTMLElement | ShadowRoot) => void;
  dispose: () => void;
};

function SubtitleTokenInfo(props: {
  source: string;
  context: () => string;
  header: () => string;
  translationService: string;
}): JSX.Element {
  return (
    <vot-block class="vot-subtitles-info" id="vot-subtitles-info">
      <vot-block class="vot-subtitles-info-service" hidden>
        {localizationProvider
          .get("VOTTranslatedBy")
          .replace("{0}", props.translationService)}
      </vot-block>
      <vot-block class="vot-subtitles-info-title">
        <span class="vot-subtitles-info-source">{props.source}</span>
        <span class="vot-subtitles-info-divider">—</span>
        <span class="vot-subtitles-info-header">{props.header()}</span>
      </vot-block>
      <vot-block class="vot-subtitles-info-context">
        {props.context()}
      </vot-block>
    </vot-block>
  );
}

export function mountSubtitleTokenTooltip(
  options: SubtitleTokenTooltipOptions,
): SubtitleTokenTooltipHandle {
  const [header, setHeader] = createSignal(options.source);
  const [context, setContext] = createSignal(options.context);
  const [parentElement, setParentElement] = createSignal<
    HTMLElement | ShadowRoot
  >(options.parentElement);
  let tooltipControls: TooltipControls | undefined;

  const view = (): JSX.Element => (
    <Tooltip
      target={options.target}
      anchor={options.anchor}
      parentElement={parentElement()}
      maxWidth={options.maxWidth}
      offset={{ x: 4, y: 12 }}
      mode="follow"
      borderRadius={12}
      bordered={false}
      position="top"
      trigger="click"
      content={
        <SubtitleTokenInfo
          source={options.source}
          context={context}
          header={header}
          translationService={options.translationService}
        />
      }
      controls={(c) => {
        tooltipControls = c;
      }}
    />
  );

  const dispose = render(() => view() as Node, parentElement());

  return {
    show: () => tooltipControls?.show(),
    update: () => tooltipControls?.update(),
    isOpen: () => tooltipControls?.isOpen() ?? false,
    setTranslation: (nextHeader, nextContext) => {
      setHeader(nextHeader);
      setContext(nextContext);
      tooltipControls?.update();
    },
    updateMount: (nextParentElement) => {
      setParentElement(nextParentElement);
      tooltipControls?.update();
    },
    dispose: () => {
      dispose();
    },
  };
}
