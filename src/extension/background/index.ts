import { preseedDnrRules } from "./dnr-rules";
import { registerBackgroundNotifications } from "./notifications";
import { registerBackgroundStorageBridge } from "./storage-bridge";
import { registerBackgroundTelemetryConsent } from "./telemetry-guard";
import { registerXhrPortListener } from "./xhr-handler";

registerBackgroundStorageBridge();
registerBackgroundTelemetryConsent();
registerBackgroundNotifications();
registerXhrPortListener();
preseedDnrRules();
