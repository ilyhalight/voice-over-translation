export const positions = ["left", "top", "right", "bottom"] as const;
export type Position = (typeof positions)[number];

export const triggers = ["hover", "click"] as const;
export type Trigger = (typeof triggers)[number];

export const tooltipModes = ["default", "follow"] as const;
export type TooltipMode = (typeof tooltipModes)[number];

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
   * Element used for the tooltip center line.
   * @default undefined (equal to target)
   */
  anchor?: HTMLElement;
  /**
   * Element used for the edge on the main placement axis.
   * This keeps a tooltip centered on a small nested control while aligning its
   * top/bottom/left/right edge with a larger visual button.
   * @default undefined (equal to anchor)
   */
  edgeAnchor?: HTMLElement;
  content?: string | HTMLElement;
  position?: Position;
  trigger?: Trigger;
  /**
   * `follow` keeps tooltip in the same coordinate space as moving content and
   * enables text selection. Used by subtitle token translations.
   * @default "default"
   */
  mode?: TooltipMode;
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
  parentElement?: HTMLElement | ShadowRoot;
};
