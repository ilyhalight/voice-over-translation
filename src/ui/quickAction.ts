import type { Phrase } from "#types/localization.ts";
import { isPiPAvailable } from "#utils/utils.ts";

export type QuickAction =
  | "none"
  | "subtitles"
  | "pip"
  | "autoTranslate"
  | "autoPauseOnTranslate";

export type QuickActionItem = {
  id: QuickAction;
  phrase: Phrase;
  disabled?: boolean;
};

export const quickActionSlots = ["quickAction1", "quickAction2"] as const;
export type QuickActionSlot = (typeof quickActionSlots)[number];

export const quickActions: QuickActionItem[] = [
  {
    id: "none",
    phrase: "None",
  },
  {
    id: "subtitles",
    phrase: "VOTSubtitles",
  },
  {
    id: "pip",
    phrase: "VOTPiP",
    disabled: !isPiPAvailable(),
  },
  {
    id: "autoTranslate",
    phrase: "VOTAutoTranslate",
  },
  {
    id: "autoPauseOnTranslate",
    phrase: "VOTAutoPauseOnTranslate",
  },
] as const;
