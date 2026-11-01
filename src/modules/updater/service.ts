import { GM_fetch } from "#utils/gm.ts";
import logger from "#utils/logger.ts";
import { votStorage } from "#utils/storage.ts";
import { compareVersions } from "#utils/utils.ts";
import { REMOTE_VERSION_URL, UPDATE_CHECK_INTERVAL } from "./const.ts";
import { setUpdaterInfo, type UpdaterInfoStore, updaterInfo } from "./store.ts";
import type { ReleaseSchema } from "./types.ts";

async function fetchRemoteVersion(): Promise<string> {
  const res = await GM_fetch(REMOTE_VERSION_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch remote version: ${res.status}`);
  }

  const data = (await res.json()) as ReleaseSchema;
  const version = Object.values(data?.addons ?? {})[0]?.updates?.[0]?.version;
  if (!version) {
    throw new Error("Remote version is missing in the updates manifest");
  }
  return version;
}

function canCheckUpdate() {
  return Date.now() - updaterInfo.checkedAt >= UPDATE_CHECK_INTERVAL;
}

const getAvailableUpdate = (version: string): string | false =>
  compareVersions(version, VOT_VERSION) > 0 ? version : false;

export async function checkUpdate(): Promise<string | false> {
  if (!canCheckUpdate()) {
    return getAvailableUpdate(updaterInfo.remoteVersion);
  }

  let remoteVersion: string;
  try {
    remoteVersion = await fetchRemoteVersion();
  } catch (error) {
    logger.error("[updater] Failed to fetch info about remote version", error);
    throw error;
  }

  const newData: UpdaterInfoStore = {
    remoteVersion,
    checkedAt: Date.now(),
  };
  await votStorage.set("updaterInfo", newData);
  setUpdaterInfo(newData);

  return getAvailableUpdate(remoteVersion);
}
