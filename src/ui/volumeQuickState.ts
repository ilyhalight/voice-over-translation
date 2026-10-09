import type { StorageData } from "../types/storage";
export type VolumeQuickKey =
  | "enabledAutoVolume"
  | "syncVolume"
  | "audioBooster";
export function getVolumeQuickStates(
  data: Partial<StorageData>,
  supportsBoost: boolean,
): Array<{
  key: VolumeQuickKey;
  active: boolean;
  disabled: boolean;
  detail: string;
  emoji: string;
  labelKey: "VOTQuickReduce" | "VOTQuickLink" | "VOTQuickBoost";
}> {
  return [
    {
      key: "enabledAutoVolume",
      active: Boolean(data.enabledAutoVolume),
      disabled: false,
      detail: `${data.autoVolume ?? 15}%`,
      emoji: "🔉",
      labelKey: "VOTQuickReduce",
    },
    {
      key: "syncVolume",
      active: Boolean(data.syncVolume),
      disabled: false,
      detail:
        data.volumeLinkMode === "offset"
          ? `+${data.translationVolumeOffset ?? 10}`
          : "Δ",
      emoji: "🔗",
      labelKey: "VOTQuickLink",
    },
    {
      key: "audioBooster",
      active: Boolean(data.audioBooster),
      disabled: !supportsBoost || Boolean(data.syncVolume),
      detail: "",
      emoji: "🔊",
      labelKey: "VOTQuickBoost",
    },
  ];
}
