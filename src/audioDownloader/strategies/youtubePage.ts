import type { WebAbrWindow } from "./webAbr";

declare const unsafeWindow: WebAbrWindow | undefined;

/** Resolve the real YouTube page realm when the userscript manager exposes it. */
export function getMainWorldWindow(targetWindow: WebAbrWindow): WebAbrWindow {
  try {
    if (typeof unsafeWindow !== "undefined" && unsafeWindow) {
      const unsafe = unsafeWindow as WebAbrWindow;
      if (
        unsafe.document &&
        unsafe.location?.hostname.endsWith("youtube.com")
      ) {
        return unsafe;
      }
    }
  } catch {}

  try {
    const unsafe = (
      globalThis as typeof globalThis & { unsafeWindow?: WebAbrWindow }
    ).unsafeWindow;
    if (unsafe?.document && unsafe.location?.hostname.endsWith("youtube.com")) {
      return unsafe;
    }
  } catch {}

  try {
    const wrapped = (
      targetWindow as WebAbrWindow & { wrappedJSObject?: WebAbrWindow }
    ).wrappedJSObject;
    if (
      wrapped?.document &&
      wrapped.location?.hostname.endsWith("youtube.com")
    ) {
      return wrapped;
    }
  } catch {}

  return targetWindow;
}

/** Resolve the top same-origin YouTube page while preserving the native page realm. */
export function getTopPageWindow(targetWindow: WebAbrWindow): WebAbrWindow {
  const pageWindow = getMainWorldWindow(targetWindow);
  try {
    const top = pageWindow.top as
      | (WebAbrWindow & { wrappedJSObject?: WebAbrWindow })
      | null;
    if (top?.document && top.location?.hostname.endsWith("youtube.com")) {
      try {
        return top.wrappedJSObject ?? top;
      } catch {
        return top;
      }
    }
  } catch {
    // Cross-origin frames cannot expose the top page.
  }
  return pageWindow;
}
