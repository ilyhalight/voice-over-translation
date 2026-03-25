export type {
  VideoData,
  VideoData as RuntimeVideoData,
} from "../types/videoHandler";

/**
 * Country code used for proxy settings. Populated lazily during init.
 */
export let countryCode: string | undefined;

export function setCountryCode(next: string | undefined) {
  countryCode = next;
}
