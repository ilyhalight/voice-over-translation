import { browser, type Browser } from "wxt/browser";
import type { ScriptPublicPath } from "wxt/utils/inject-script";
import debug from "../../utils/debug";
import { LIFECYCLE_PORT_NAME } from "../shared/constants";

/**
 * Chromium does not inject manifest content scripts into tabs that were
 * already open when the extension is installed/updated/reloaded. Those tabs
 * keep orphaned scripts whose extension context is invalidated, so we
 * re-inject every manifest content script (in manifest order: MAIN-world
 * prelude before the ISOLATED bridge) into matching tabs.
 */

type ManifestContentScript = NonNullable<
  Browser.runtime.Manifest["content_scripts"]
>[number] & { world?: "MAIN" | "ISOLATED" };

type InjectableTab = Browser.tabs.Tab & { id: number };

const LOG = "[VOT EXT][background][reinject]";

const RESTRICTED_URL_RE =
  /^(?:chrome|edge|brave|opera|vivaldi|devtools|view-source|chrome-extension|moz-extension|about):|^https?:\/\/(?:chrome\.google\.com\/webstore|chromewebstore\.google\.com|microsoftedge\.microsoft\.com\/addons)(?:[/?#]|$)/i;

/** Ports exist only so content scripts can detect extension unload. */
const lifecyclePorts = new Set<Browser.runtime.Port>();

function isInjectableTab(tab: Browser.tabs.Tab): tab is InjectableTab {
  if (typeof tab.id !== "number" || tab.id < 0) return false;
  if (tab.discarded) return false;
  const url = tab.url ?? "";
  if (!url) return false;
  return !RESTRICTED_URL_RE.test(url);
}

async function queryTabs(patterns?: string[]): Promise<Browser.tabs.Tab[]> {
  if (!patterns?.length) return [];
  try {
    return await browser.tabs.query({ url: patterns });
  } catch (error) {
    debug.warn(`${LOG} tabs.query failed`, patterns, error);
    return [];
  }
}

async function injectIntoTab(tabId: number, entries: ManifestContentScript[]) {
  // Sequential on purpose: keeps manifest order (prelude before bridge).
  for (const entry of entries) {
    try {
      await browser.scripting.executeScript({
        target: { tabId, allFrames: !!entry.all_frames },
        files: (entry.js ?? []).map(
          (file) => `/${file.replace(/^\//, "")}` as ScriptPublicPath,
        ),
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

async function reinjectContentScripts(): Promise<void> {
  const contentScripts: ManifestContentScript[] =
    browser.runtime.getManifest().content_scripts ?? [];

  const plan = new Map<
    number,
    { tab: InjectableTab; entries: ManifestContentScript[] }
  >();
  const queries = contentScripts
    .filter((entry) => entry.js?.length)
    .map(async (entry) => {
      const [tabs, excludedTabs] = await Promise.all([
        queryTabs(entry.matches),
        queryTabs(entry.exclude_matches),
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
    active.map(({ tab, entries }) => injectIntoTab(tab.id, entries)),
  );
  await Promise.allSettled(
    rest.map(({ tab, entries }) => injectIntoTab(tab.id, entries)),
  );

  debug.log(`${LOG} re-injected content scripts`, { tabs: items.length });
}

export function registerContentScriptReinjection(): void {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== LIFECYCLE_PORT_NAME) return;
    lifecyclePorts.add(port);
    port.onDisconnect.addListener(() => {
      void browser.runtime.lastError; // silence "Unchecked runtime.lastError"
      lifecyclePorts.delete(port);
    });
  });

  // Firefox already injects manifest content scripts into open tabs on
  // install/update; re-injecting there would duplicate them.
  if (import.meta.env.FIREFOX) return;

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason !== "install" && reason !== "update") return;
    reinjectContentScripts().catch((error) => {
      debug.warn(`${LOG} re-injection failed`, error);
    });
  });
}
