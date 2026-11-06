import { createSignal, type JSX } from "solid-js";
import { render } from "../../ui/solid/renderer";

export type UdemyCaptureOverlayProps = {
  title: string;
  detail: string;
};

export type UdemyCaptureOverlayHandle = {
  update: (title: string, detail: string) => void;
  dispose: () => void;
};

export function UdemyCaptureOverlay(
  props: UdemyCaptureOverlayProps,
): JSX.Element {
  return (
    <vot-block class="vot-udemy-capture-overlay" role="status">
      <vot-block class="vot-udemy-capture-overlay__title">
        {props.title}
      </vot-block>
      <vot-block class="vot-udemy-capture-overlay__detail">
        {props.detail}
      </vot-block>
    </vot-block>
  );
}

/**
 * Covers the player while the lecture is replayed at high speed for audio
 * capture, so the user does not see it racing. Controls stay clickable.
 */
export function mountUdemyCaptureOverlay(
  video: HTMLVideoElement,
): UdemyCaptureOverlayHandle {
  const [title, setTitle] = createSignal("");
  const [detail, setDetail] = createSignal("");
  const host = document.createElement("vot-block");
  host.className = "vot-udemy-capture-overlay-host";
  video.insertAdjacentElement("afterend", host);
  const dispose = render(
    () => (<UdemyCaptureOverlay title={title()} detail={detail()} />) as Node,
    host,
  );
  return {
    update: (nextTitle, nextDetail) => {
      setTitle(nextTitle);
      setDetail(nextDetail);
    },
    dispose: () => {
      dispose();
      host.remove();
    },
  };
}
