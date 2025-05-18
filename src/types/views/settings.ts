import { VideoHandler } from "../..";
import { StorageData } from "../storage";

export type SettingsViewProps = {
  globalPortal: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
};
