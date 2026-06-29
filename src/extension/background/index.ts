import { preseedDnrRules } from "./dnr-rules";
import { registerBackgroundNotifications } from "./notifications";
import { registerBackgroundStorageBridge } from "./storage-bridge";
import { registerXhrPortListener } from "./xhr-handler";

registerBackgroundStorageBridge();
registerBackgroundNotifications();
registerXhrPortListener();
preseedDnrRules();
