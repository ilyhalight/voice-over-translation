export type StopSmartVolumeDuckingOptions = {
  restoreVolume?: number;
};

export type ActionContext = {
  gen: number;
  videoId: string;
};

export type ApplyTranslationSourceResult =
  | {
      status: "success";
      didSetSource: boolean;
      appliedSourceUrl: string | null;
    }
  | {
      status: "stale";
      didSetSource: boolean;
      appliedSourceUrl: string | null;
    }
  | {
      status: "error";
      didSetSource: boolean;
      appliedSourceUrl: string | null;
      error: unknown;
    };
