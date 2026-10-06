import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import { requestSafariPagePoToken } from "./safariPageBridge";
import type { WebAbrWindow } from "./webAbr";
import { getTopPageWindow } from "./youtubePage";

/** Mint a GVS PO token in the native YouTube page realm when possible. */
export async function mintPagePoToken(
  pageWindow: WebAbrWindow,
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  const mainWindow = getTopPageWindow(pageWindow);
  const realms = new Set<WebAbrWindow>([mainWindow]);
  if (mainWindow !== pageWindow) realms.add(pageWindow);
  try {
    realms.add(mainWindow.parent as WebAbrWindow);
    realms.add(mainWindow.top as WebAbrWindow);
  } catch {
    // Cross-origin access is denied.
  }

  debug.log("[VOT][PO_TOKEN] mint started", {
    bindingLength: binding.length,
    realmCount: realms.size,
  });

  for (const realm of realms) {
    let keys: string[];
    try {
      keys = Object.getOwnPropertyNames(realm).filter(
        (key) => key === "bevasrsg" || key.startsWith("havuokmhhs-"),
      );
    } catch {
      continue;
    }

    for (const key of keys) {
      let bevasrs: { wpc?: unknown } | undefined;
      try {
        bevasrs = (
          (realm as unknown as Record<string, unknown>)[key] as {
            bevasrs?: { wpc?: unknown };
          }
        )?.bevasrs;
      } catch {
        continue;
      }

      const wpc = bevasrs?.wpc;
      if (typeof wpc !== "function") continue;

      for (let attempt = 0; attempt < 10; attempt++) {
        if (signal.aborted) throw signal.reason;
        try {
          const minter = await wpc.call(bevasrs);
          const token = await minter?.mws?.({
            c: binding,
            mc: false,
            me: false,
          });
          if (typeof token === "string" && token) {
            debug.log("[VOT][PO_TOKEN] mint success", {
              tokenLength: token.length,
              provider: key,
              attempt,
            });
            return token;
          }
          debug.log("[VOT][PO_TOKEN] mint returned no token", {
            provider: key,
            attempt,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          debug.log("[VOT][PO_TOKEN] mint attempt failed", {
            provider: key,
            attempt,
            message,
          });
          if (!message.includes("SDF:notready")) break;
        }
        await createAbortableDelay(500, signal);
      }
    }
  }

  // Safari Userscripts keeps granted scripts outside the true page realm.
  const safariToken = await requestSafariPagePoToken(binding, signal);
  if (safariToken) {
    debug.log("[VOT][PO_TOKEN] Safari page-realm mint success", {
      tokenLength: safariToken.length,
    });
    return safariToken;
  }

  debug.error("[VOT][PO_TOKEN] mint failed", {
    bindingLength: binding.length,
    realmCount: realms.size,
  });
  return undefined;
}

/** Select the binding expected by YouTube's current GVS PO-token policy. */
export function selectGvsPoTokenBinding(
  videoId: string,
  options: {
    loggedIn: boolean;
    dataSyncId: unknown;
    visitorData: unknown;
    experimentFlags: string[];
  },
): { kind: "video" | "datasync" | "visitor"; value: string } | undefined {
  if (
    options.experimentFlags.some(
      (flags) =>
        new URLSearchParams(flags)
          .getAll("html5_generate_content_po_token")
          .at(-1) === "true",
    )
  ) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "video",
      loggedIn: options.loggedIn,
      hasDataSyncId:
        typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
      reason: "html5_generate_content_po_token",
    });
    return { kind: "video", value: videoId };
  }

  if (
    options.loggedIn &&
    typeof options.dataSyncId === "string" &&
    options.dataSyncId
  ) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "datasync",
      loggedIn: true,
      hasDataSyncId: true,
    });
    return { kind: "datasync", value: options.dataSyncId };
  }

  if (typeof options.visitorData === "string" && options.visitorData) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "visitor",
      loggedIn: options.loggedIn,
      hasDataSyncId:
        typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
    });
    return { kind: "visitor", value: options.visitorData };
  }

  debug.error("[VOT][WEB_CREATOR] no GVS PO binding available", {
    loggedIn: options.loggedIn,
    hasDataSyncId:
      typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
    hasVisitorData:
      typeof options.visitorData === "string" && Boolean(options.visitorData),
  });
  return undefined;
}
