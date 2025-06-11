import { VideoHandler } from "..";
import { Direction, Position } from "./components/votButton";
import { StorageData } from "./storage";

export type ButtonLayout = {
  direction: Direction;
  position: Position;
};

export type UIManagerProps = {
  root: HTMLElement;
  portalContainer: HTMLElement;
  tooltipLayoutRoot?: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
};
