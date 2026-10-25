export type AnyObject = Record<string, any>;

export const MARK = "__VOT_EXT_BRIDGE__";

export const TYPE_REQ = "VOT_EXT_REQ";
export const TYPE_RES = "VOT_EXT_RES";

export const TYPE_XHR_START = "VOT_EXT_XHR_START";
export const TYPE_XHR_ABORT = "VOT_EXT_XHR_ABORT";
export const TYPE_XHR_ACK = "VOT_EXT_XHR_ACK";
export const TYPE_XHR_EVENT = "VOT_EXT_XHR_EVENT";

export const TYPE_NOTIFY = "VOT_EXT_NOTIFY";

// Bridge lifecycle (bridge -> page). A bridge instance announces itself with
// READY (new instance id) and, when its extension context dies (reload/update),
// with DOWN so the page can queue work until the next READY. PING is sent by
// the page to ask any live bridge to re-announce itself.
export const TYPE_BRIDGE_READY = "VOT_EXT_BRIDGE_READY";
export const TYPE_BRIDGE_DOWN = "VOT_EXT_BRIDGE_DOWN";
export const TYPE_BRIDGE_PING = "VOT_EXT_BRIDGE_PING";

/** Error code put into TYPE_RES / XHR error payloads when the bridge died. */
export const BRIDGE_RESTART_ERROR_CODE = "VOT_EXT_BRIDGE_RESTARTED";

/** DOM event (shared between worlds) used by a fresh bridge to retire orphans. */
export const BRIDGE_TAKEOVER_EVENT = "vot-ext:bridge-takeover";

/** Long-lived port used only to detect extension unload from content scripts. */
export const LIFECYCLE_PORT_NAME = "vot_lifecycle";

export const PORT_NAME = "vot_gm_xhr";

export const BG_MSG_STORAGE = "gm_storage";
export const BG_MSG_NOTIFICATION = "gm_notification";
export const BG_MSG_TELEMETRY_CONSENT = "telemetry_consent";

type BridgeMarked = { [MARK]: true };

export type BridgeReqMessage = BridgeMarked & {
  type: typeof TYPE_REQ;
  id: string;
  action: string;
  payload?: AnyObject;
};

export type BridgeResMessage = BridgeMarked & {
  type: typeof TYPE_RES;
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
};

export type BridgeNotifyMessage = BridgeMarked & {
  type: typeof TYPE_NOTIFY;
  details?: AnyObject;
};

export type BridgeXhrStartMessage = BridgeMarked & {
  type: typeof TYPE_XHR_START;
  requestId: string;
  details?: AnyObject;
};

export type BridgeXhrAbortMessage = BridgeMarked & {
  type: typeof TYPE_XHR_ABORT;
  requestId: string;
};

export type BridgeXhrAckMessage = BridgeMarked & {
  type: typeof TYPE_XHR_ACK;
  requestId: string;
  payload?: AnyObject;
};

export type BridgeXhrEventMessage = BridgeMarked & {
  type: typeof TYPE_XHR_EVENT;
  requestId: string;
  payload?: AnyObject;
};

export type BridgeLifecycleMessage = BridgeMarked &
  (
    | { type: typeof TYPE_BRIDGE_READY; instanceId: string }
    | { type: typeof TYPE_BRIDGE_DOWN; instanceId: string; reason?: string }
    | { type: typeof TYPE_BRIDGE_PING }
  );

export type BridgeWireMessage =
  | BridgeLifecycleMessage
  | BridgeReqMessage
  | BridgeResMessage
  | BridgeNotifyMessage
  | BridgeXhrStartMessage
  | BridgeXhrAbortMessage
  | BridgeXhrAckMessage
  | BridgeXhrEventMessage;

const BRIDGE_MESSAGE_TYPES = new Set<string>([
  TYPE_REQ,
  TYPE_RES,
  TYPE_NOTIFY,
  TYPE_XHR_START,
  TYPE_XHR_ABORT,
  TYPE_XHR_ACK,
  TYPE_XHR_EVENT,
  TYPE_BRIDGE_READY,
  TYPE_BRIDGE_DOWN,
  TYPE_BRIDGE_PING,
]);

export function isOurMessage(data: unknown): data is BridgeWireMessage {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as Record<string, unknown>)[MARK] === true &&
      typeof (data as { type?: unknown }).type === "string" &&
      BRIDGE_MESSAGE_TYPES.has((data as { type: string }).type),
  );
}
