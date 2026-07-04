/**
 * IIFE entry point for CRXJS Chrome builds.
 *
 * CRXJS emits `.iife.ts` files as standalone bundles with imports inlined
 * and no loader wrapper. Chrome runs this file directly at document_start.
 * Because it is synchronous, GM polyfills are guaranteed to be on
 * globalThis before any subsequent MAIN-world content script evaluates.
 *
 * The async handshake (GM_info metadata) is fire-and-forget — it does
 * not block polyfill availability.
 */
import { bootstrapExtensionPrelude } from "./prelude/index";

bootstrapExtensionPrelude();
