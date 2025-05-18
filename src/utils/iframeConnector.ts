import { MessagePayload } from "../types/iframeConnector";
import { timeout } from "./utils";

export const IFRAME_HASH = "vot_iframe";
export const isIframe = () => window.self !== window.top;
export const generateMessageId = () =>
  `main-world-bridge-${performance.now()}-${Math.random()}`;

export const hasServiceIframe = (iframeId: string) =>
  document.getElementById(iframeId) as HTMLIFrameElement | null;

export async function setupServiceIframe(
  src: string,
  id: string,
  service: string,
) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.zIndex = "-1";
  iframe.style.display = "none";
  iframe.id = id;
  iframe.src = `${src}#${IFRAME_HASH}`;
  document.body.appendChild(iframe);

  const ready = new Promise<boolean>((resolve) => {
    const handleMessage = ({ data }: MessageEvent<MessagePayload>) => {
      if (data.messageType === `say-${service}-iframe-is-ready`) {
        window.removeEventListener("message", handleMessage);
        resolve(true);
      }
    };
    window.addEventListener("message", handleMessage);
  });

  await Promise.race([
    ready,
    timeout(15000, "Service iframe did not have time to be ready"),
  ]);

  return iframe;
}

export async function ensureServiceIframe(
  iframe: HTMLIFrameElement | null,
  src: string,
  iframeId: string,
  service: string,
): Promise<HTMLIFrameElement> {
  if (src.includes("#")) {
    throw new Error(
      "The src parameter should not contain a hash (#) character.",
    );
  }

  if (hasServiceIframe(iframeId)) {
    if (iframe !== null) {
      return iframe;
    }

    throw new Error(
      "Service iframe already exists in DOM, but added not by us.",
    );
  }

  iframe = await setupServiceIframe(src, iframeId, service);
  return iframe;
}

export function initIframeService(
  service: string,
  onmessage: ({ data }: MessageEvent<MessagePayload>) => Promise<void>,
) {
  window.addEventListener("message", onmessage);
  window.parent.postMessage(
    {
      messageType: `say-${service}-iframe-is-ready`,
      messageDirection: "response",
    },
    "*",
  );
}

export function requestDataFromMainWorld<PayloadType, ResponseType = unknown>(
  messageType: string,
  payload?: PayloadType,
): Promise<ResponseType> {
  const messageId = generateMessageId();
  return new Promise((resolve, reject) => {
    const handleMessage = ({
      data,
    }: MessageEvent<MessagePayload<ResponseType>>) => {
      if (
        data?.messageId === messageId &&
        data.messageType === messageType &&
        data.messageDirection === "response"
      ) {
        window.removeEventListener("message", handleMessage);
        data.error ? reject(data.error) : resolve(data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    window.postMessage(
      {
        messageId,
        messageType,
        messageDirection: "request",
        ...(payload !== undefined && { payload }),
      },
      "*",
    );
  });
}
