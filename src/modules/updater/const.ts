import { repositoryUrl } from "#config/config.ts";

export const LATEST_RELEASE_URL = `${repositoryUrl}/releases/latest`;
export const REMOTE_VERSION_URL = `${LATEST_RELEASE_URL}/download/vot-extension-firefox-updates.json`;

// 6 hours in milliseconds
export const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000;
