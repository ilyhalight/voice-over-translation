import { createStore } from "solid-js/store";

export type UpdaterInfoStore = {
  checkedAt: number;
  remoteVersion: string;
};

export function createDefaultUpdaterInfo(): UpdaterInfoStore {
  return {
    checkedAt: 0,
    remoteVersion: VOT_VERSION,
  };
}

export const [updaterInfo, setUpdaterInfo] = createStore<UpdaterInfoStore>(
  createDefaultUpdaterInfo(),
);
