import { defineBackground } from "wxt/utils/define-background";
import debug from "../utils/debug";
import { preseedDnrRules } from "../extension/background/dnr-rules";
import { registerBackgroundNotifications } from "../extension/background/notifications";
import { registerContentScriptReinjection } from "../extension/background/reinject";
import { registerBackgroundStorageBridge } from "../extension/background/storage-bridge";
import { registerBackgroundTelemetryConsent } from "../extension/background/telemetry-guard";
import { registerXhrPortListener } from "../extension/background/xhr-handler";

export default defineBackground({
  type: "module",
  main() {
    registerBackgroundStorageBridge();
    registerBackgroundTelemetryConsent();
    registerBackgroundNotifications();
    registerXhrPortListener();
    registerContentScriptReinjection();
    preseedDnrRules().catch((error) => {
      debug.warn("[VOT EXT][background] Failed to initialize DNR rules", error);
    });
  },
});
