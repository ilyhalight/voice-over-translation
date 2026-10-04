import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import type { VideoHandler } from "../VideoHandler";
import type { StorageData } from "./storage";

export type OverlayMount = {
  root: HTMLElement | ShadowRoot;
  portalContainer: HTMLElement;
  subtitlesMountContainer: HTMLElement | ShadowRoot;
};

export type UIManagerProps = {
  mount: OverlayMount;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
  intervalIdleChecker: IntervalIdleChecker;
};
