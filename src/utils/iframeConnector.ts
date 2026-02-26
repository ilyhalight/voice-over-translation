/**
 * Runtime frame detection helper.
 *
 * Audio download no longer relies on service iframes or postMessage bridges.
 * We keep only the minimal utility used by bootstrap policy.
 */
export const isIframe = () => globalThis.self !== globalThis.top;
