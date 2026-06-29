import type { Direction, Position } from "../types/components/votButton";
import type { ButtonLayout } from "../types/uiManager";
import { clampNumber } from "../utils/number";

const SIDE_EDGE_FRACTION = 0.18;
const SIDE_TOP_FRACTION = 0.36;
const MIN_SIDE_EDGE_PX = 84;
const MAX_SIDE_EDGE_PX = 220;
const MIN_SIDE_TOP_PX = 140;
const MAX_SIDE_TOP_PX = 280;

export function normalizeButtonPosition(
  position: string | undefined,
): Position {
  switch (position) {
    case "left":
    case "right":
    case "leftCenter":
    case "rightCenter":
      return position;
    default:
      return "default";
  }
}

export function isSideButtonPosition(
  position: Position,
): position is "left" | "right" | "leftCenter" | "rightCenter" {
  return (
    position === "left" ||
    position === "right" ||
    position === "leftCenter" ||
    position === "rightCenter"
  );
}

export function getButtonDirection(position: Position): Direction {
  return isSideButtonPosition(position) ? "column" : "row";
}

export function resolveButtonLayout(
  isBigContainer: boolean,
  preferredPosition: string | undefined = "default",
): ButtonLayout {
  const normalizedPosition = normalizeButtonPosition(preferredPosition);
  const position =
    isBigContainer || !isSideButtonPosition(normalizedPosition)
      ? normalizedPosition
      : "default";

  return {
    position,
    direction: getButtonDirection(position),
  };
}

function getEdgeSize(
  size: number,
  fraction: number,
  minPx: number,
  maxPx: number,
): number {
  return clampNumber(size * fraction, minPx, maxPx);
}

function resolveSideVerticalPosition(
  side: "left" | "right",
  y: number,
  height: number,
): Position {
  const upperSideZone = getEdgeSize(
    height,
    SIDE_TOP_FRACTION,
    MIN_SIDE_TOP_PX,
    MAX_SIDE_TOP_PX,
  );
  if (y <= upperSideZone) {
    return side;
  }
  return side === "left" ? "leftCenter" : "rightCenter";
}

export function resolveButtonPositionFromPointer(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  isBigContainer: boolean,
): Position {
  const width = containerRect.width;
  const height = containerRect.height;
  if (!(width > 0 && height > 0)) {
    return "default";
  }

  const x = clampNumber(clientX - containerRect.left, 0, width);
  const y = clampNumber(clientY - containerRect.top, 0, height);
  if (!isBigContainer) {
    return "default";
  }

  const sideEdge = getEdgeSize(
    width,
    SIDE_EDGE_FRACTION,
    MIN_SIDE_EDGE_PX,
    MAX_SIDE_EDGE_PX,
  );

  if (x <= sideEdge) {
    return resolveSideVerticalPosition("left", y, height);
  }

  if (x >= width - sideEdge) {
    return resolveSideVerticalPosition("right", y, height);
  }

  return "default";
}
