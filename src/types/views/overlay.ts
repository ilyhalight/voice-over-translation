import { VideoHandler } from "../..";
import { StorageData } from "../storage";

export type OverlayViewProps = {
  root: HTMLElement;
  portalContainer: HTMLElement;
  tooltipLayoutRoot: HTMLElement;
  globalPortal: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
};
