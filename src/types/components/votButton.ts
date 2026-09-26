export const positions = [
  "default",
  "left",
  "right",
  "leftCenter",
  "rightCenter",
] as const;
export type Position = (typeof positions)[number];

const directions = ["default", "row", "column"] as const;
export type Direction = (typeof directions)[number];

export type Status = "none" | "error" | "success";
