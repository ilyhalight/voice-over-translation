export type {
  VideoData,
  VideoData as RuntimeVideoData,
} from "../types/videoHandler";

/**
 * Country code used for proxy settings. Populated lazily during init.
 */
let _countryCode: string | undefined;

export function getCountryCode(): string | undefined {
  return _countryCode;
}

export function setCountryCode(next: string | undefined) {
  _countryCode = next;
}
