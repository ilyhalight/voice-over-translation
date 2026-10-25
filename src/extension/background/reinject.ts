import debug from "../../utils/debug";
import { LIFECYCLE_PORT_NAME } from "../shared/constants";
import { ext, lastErrorMessage } from "../shared/webext";

/**
 * Chromium does not inject manifest content scripts into tabs that were
 * already open when the extension is installed/updated/reloaded. Those tabs
 * keep orphaned scripts whose extension context is invalidated, so we
 * re-inject every manifest content script (in manifest order: MAIN-world
 * prelude before the ISOLATED bridge) into matching tabs.
 */

type ManifestContentScript = {
  matches?: string[];
  exclude_matches?: string[];
  js?: string[];
  all_frames?: boolean;
  world?: "MAIN" | "ISOLATED";
};

type TabLike = {
  id?: number;
  url?: string;
  active?: boolean;
  discarded?: boolean;
};

type PortLike = {
  name?: string;
  onDisconnect?: { addListener?: (fn: () => void) => void };
};

type ReinjectApi = {
  runtime?: {
    getManifest?: () => { content_scripts?: ManifestContentScript[] };
    onInstalled?: {
      addListener?: (fn: (details: { reason?: string }) => void) => void;
    };
    onConnect?: { addListener?: (fn: (port: unknown) => void) => void };
    getBrowserInfo?: unknown;
  };
  tabs?: { query?: (info: { url?: string[] }) => Promise<TabLike[]> };
  scripting?: {
    executeScript?: (injection: {
      target: { tabId: number; allFrames?: boolean };
      files: string[];
      world?: "MAIN" | "ISOLATED";
      injectImmediately?: boolean;
    }) => Promise<unknown>;
  };
};

const LOG = "[VOT EXT][background][reinject]";

const RESTRICTED_URL_RE =
  /^(?:chrome|edge|brave|opera|vivaldi|devtools|view-source|chrome-extension|moz-extension|about):|^https?:\/\/(?:chrome\.google\.com\/webstore|chromewebstore\.google\.com|microsoftedge\.microsoft\.com\/addons)(?:[/?#]|$)/i;

/** Ports exist only so content scripts can detect extension unload. */
const lifecyclePorts = new Set<PortLike>();
const api = ext as unknown as ReinjectApi | null;

function isInjectableTab(tab: TabLike): tab is TabLike & { id: number } {
  if (typeof tab.id !== "number" || tab.id < 0) return false;
  if (tab.discarded) return false;
  const url = tab.url ?? "";
  if (!url) return false;
  return !RESTRICTED_URL_RE.test(url);
}

async function queryTabs(api: ReinjectApi, patterns?: string[]) {
  if (!patterns?.length || typeof api.tabs?.query !== "function") return [];
  try {
    return (await api.tabs.query({ url: patterns })) ?? [];
  } catch (error) {
    debug.warn(`${LOG} tabs.query failed`, patterns, error);
    return [];
  }
}

async function injectIntoTab(
  api: ReinjectApi,
  tabId: number,
  entries: ManifestContentScript[],
) {
  // Sequential on purpose: keeps manifest order (prelude before bridge).
  for (const entry of entries) {
    try {
      await api.scripting!.executeScript!({
        target: { tabId, allFrames: !!entry.all_frames },
        files: entry.js!,
        world: entry.world ?? "ISOLATED",
        injectImmediately: true,
      });
    } catch (error) {
      debug.warn(
        `${LOG} executeScript failed`,
        { tabId, files: entry.js },
        error,
      );
    }
  }
}

export async function reinjectContentScripts(): Promise<void> {
  if (typeof api?.scripting?.executeScript !== "function") {
    debug.warn(`${LOG} scripting API unavailable, skipping re-injection`);
    return;
  }

  let contentScripts: ManifestContentScript[] = [];
  try {
    contentScripts = api.runtime?.getManifest?.()?.content_scripts ?? [];
  } catch (error) {
    debug.warn(`${LOG} getManifest failed`, error);
    return;
  }

  const plan = new Map<
    number,
    { tab: TabLike & { id: number }; entries: ManifestContentScript[] }
  >();
  const queries = contentScripts
    .filter((entry) => entry?.js?.length)
    .map(async (entry) => {
      const [tabs, excludedTabs] = await Promise.all([
        queryTabs(api, entry.matches),
        queryTabs(api, entry.exclude_matches),
      ]);
      return { entry, tabs, excludedTabs };
    });
  for (const { entry, tabs, excludedTabs } of await Promise.all(queries)) {
    const excluded = new Set(excludedTabs.map((tab) => tab.id));
    for (const tab of tabs) {
      if (!isInjectableTab(tab) || excluded.has(tab.id)) continue;
      const item = plan.get(tab.id) ?? { tab, entries: [] };
      item.entries.push(entry);
      plan.set(tab.id, item);
    }
  }

  const items = [...plan.values()];
  const active = items.filter((item) => item.tab.active);
  const rest = items.filter((item) => !item.tab.active);

  // Active tabs first (the user is most likely looking at them).
  await Promise.all(
    active.map(({ tab, entries }) => injectIntoTab(api, tab.id, entries)),
  );
  await Promise.allSettled(
    rest.map(({ tab, entries }) => injectIntoTab(api, tab.id, entries)),
  );

  debug.log(`${LOG} re-injected content scripts`, { tabs: items.length });
}

export function registerContentScriptReinjection(): void {
  if (!api?.runtime) return;

  api.runtime.onConnect?.addListener?.((port: unknown) => {
    if (!port || typeof port !== "object") return;
    const typedPort = port as PortLike;
    if (typedPort.name !== LIFECYCLE_PORT_NAME) return;
    lifecyclePorts.add(typedPort);
    typedPort.onDisconnect?.addListener?.(() => {
      lastErrorMessage(); // silence "Unchecked runtime.lastError"
      lifecyclePorts.delete(typedPort);
    });
  });

  // Firefox already injects manifest content scripts into open tabs on
  // install/update; re-injecting there would duplicate them.
  if (typeof api.runtime.getBrowserInfo === "function") return;

  api.runtime.onInstalled?.addListener?.((details) => {
    const reason = details?.reason;
    if (reason !== "install" && reason !== "update") return;
    reinjectContentScripts().catch((error) => {
      debug.warn(`${LOG} re-injection failed`, error);
    });
  });
}
