import { expect, test } from "bun:test";
import { getVolumeQuickStates } from "../src/ui/volumeQuickState";

test("quick states show live values and disable boost while volume is linked", () => {
  const states = getVolumeQuickStates(
    {
      enabledAutoVolume: true,
      autoVolume: 15,
      syncVolume: true,
      volumeLinkMode: "offset",
      translationVolumeOffset: 17,
      audioBooster: true,
    },
    true,
  );
  expect(states.map((s) => [s.key, s.active, s.disabled, s.detail])).toEqual([
    ["enabledAutoVolume", true, false, "15%"],
    ["syncVolume", true, false, "+17"],
    ["audioBooster", true, true, ""],
  ]);
});
