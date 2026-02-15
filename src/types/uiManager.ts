import type { VideoHandler } from "..";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import type { Direction, Position } from "./components/votButton";
import type { StorageData } from "./storage";

export type ButtonLayout = {
  direction: Direction;
  position: Position;
};

export type OverlayMount = {
  root: HTMLElement;
  portalContainer: HTMLElement;
  tooltipLayoutRoot?: HTMLElement;
};

export type UIManagerProps = {
  mount: OverlayMount;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
  intervalIdleChecker: IntervalIdleChecker;
};
