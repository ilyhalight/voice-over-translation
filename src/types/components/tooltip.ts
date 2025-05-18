export const positions = ["left", "top", "right", "bottom"] as const;
export type Position = (typeof positions)[number];

export const triggers = ["hover", "click"] as const;
export type Trigger = (typeof triggers)[number];

export type Offset = {
  x: number;
  y: number;
};

export type PagePosition = {
  top: number;
  left: number;
};

export type TooltipOpts = {
  /**
   * target for connect all events
   */
  target: HTMLElement;
  /**
   * element for calculating position
   * @default undefined (equal to target)
   */
  anchor?: HTMLElement;
  content?: string | HTMLElement;
  position?: Position;
  trigger?: Trigger;
  offset?: number | Offset;
  hidden?: boolean;
  autoLayout?: boolean;
  maxWidth?: number;
  backgroundColor?: string;
  borderRadius?: number;
  /**
   * add border to tooltip
   * @default true
   */
  bordered?: boolean;
  parentElement?: HTMLElement;
  layoutRoot?: HTMLElement;
};
