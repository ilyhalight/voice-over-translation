/**
 * CONSOLIDATION — timings that more than one strategy keys behavior off.
 *
 * `PROGRESS_INTERVAL_MS` was declared twice with the same value
 * (`pageAudioHandler.ts:39` and `mseProxy.ts:41`). Both sides of the bridge
 * have to agree on it — the requester drops a stream that reports nothing for
 * too long — so two independent literals were a latent divergence.
 */

/** How often a long-running download pings the requesting realm. */
export const PROGRESS_INTERVAL_MS = 30_000;
