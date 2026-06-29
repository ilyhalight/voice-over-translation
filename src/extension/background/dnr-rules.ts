import debug from "../../utils/debug";
import { ext } from "../shared/webext";
import {
  filterYandexHeadersForDnr,
  isYandexApiHostname,
  normalizeHeaderName,
  SUPPRESSED_UA_CH_HEADERS,
} from "../shared/yandexHeaders";

const DNR_RULE_ID_YANDEX_HEADERS = 9001;
const DNR_RULE_ID_YOUTUBEI_ORIGIN = 9002;
const DNR_RULE_ID_GOOGLEVIDEO_HEADERS = 9003;
const dnrAppliedSignatures = new Map<number, string>();
let dnrRuleUpdateQueue: Promise<void> = Promise.resolve();

type DnrRequestHeaderRemove = { header: string; operation: "remove" };
type DnrRequestHeaderSet = { header: string; operation: "set"; value: string };
type DnrRequestHeader = DnrRequestHeaderRemove | DnrRequestHeaderSet;

const YOUTUBEI_BASE_HEADERS: DnrRequestHeader[] = [
  { header: "Origin", operation: "remove" },
  { header: "x-client-data", operation: "remove" },
  { header: "x-goog-visitor-id", operation: "remove" },
];
const GOOGLEVIDEO_BASE_HEADERS: DnrRequestHeader[] = [
  { header: "x-client-data", operation: "remove" },
];

function hasDnr(): boolean {
  return Boolean(ext?.declarativeNetRequest?.updateSessionRules);
}

function updateSessionRules(args: {
  addRules?: unknown[];
  removeRuleIds?: number[];
}): Promise<void> {
  const result = ext?.declarativeNetRequest?.updateSessionRules({
    addRules: args.addRules ?? [],
    removeRuleIds: args.removeRuleIds ?? [],
  });
  return (result as Promise<void> | undefined) ?? Promise.resolve();
}

const FORBIDDEN_HEADERS = new Set(["user-agent", "origin", "referer"]);

export function isForbiddenToSetViaFetch(headerName: string): boolean {
  const n = headerName.trim().toLowerCase();
  return (
    n.startsWith("sec-") || n.startsWith("proxy-") || FORBIDDEN_HEADERS.has(n)
  );
}

function signatureFromDnrRequestHeaders(
  requestHeaders: readonly DnrRequestHeader[],
): string {
  const entries = requestHeaders
    .map(
      (h) =>
        [
          `${normalizeHeaderName(String(h.header)).toLowerCase()}:${String(h.operation)}`,
          String("value" in h ? h.value : ""),
        ] as const,
    )
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

async function queueDnrSessionRuleUpdate(
  ruleId: number,
  signature: string,
  rule: unknown,
): Promise<boolean> {
  if (signature === dnrAppliedSignatures.get(ruleId)) {
    return false;
  }

  const prev = dnrRuleUpdateQueue;
  let releaseNext!: () => void;
  dnrRuleUpdateQueue = new Promise<void>((resolve) => {
    releaseNext = resolve;
  });

  try {
    await prev;
  } catch {
    // Previous update failed; continue with next in queue.
  }

  try {
    if (signature !== dnrAppliedSignatures.get(ruleId)) {
      await updateSessionRules({ removeRuleIds: [ruleId], addRules: [rule] });
      dnrAppliedSignatures.set(ruleId, signature);
    }
    return true;
  } finally {
    releaseNext();
  }
}

export async function ensureDnrHeaderRuleForYandex(
  url: string,
  forbiddenHeaders: Record<string, string>,
): Promise<void> {
  if (!hasDnr()) return;

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }
  if (!isYandexApiHostname(hostname)) return;

  const requestHeaders: DnrRequestHeader[] = [
    { header: "Origin", operation: "remove" },
    { header: "Referer", operation: "remove" },
    ...SUPPRESSED_UA_CH_HEADERS.map(
      (h): DnrRequestHeaderRemove => ({ header: h, operation: "remove" }),
    ),
  ];

  for (const [header, value] of Object.entries(
    filterYandexHeadersForDnr(forbiddenHeaders),
  )) {
    requestHeaders.push({
      header: normalizeHeaderName(header),
      operation: "set",
      value: String(value),
    });
  }

  const signature = signatureFromDnrRequestHeaders(requestHeaders);
  const rule = {
    id: DNR_RULE_ID_YANDEX_HEADERS,
    priority: 1,
    action: { type: "modifyHeaders", requestHeaders },
    condition: {
      urlFilter: "|https://api.browser.yandex.ru/",
      resourceTypes: ["xmlhttprequest"],
    },
  };

  await queueDnrSessionRuleUpdate(DNR_RULE_ID_YANDEX_HEADERS, signature, rule);
}

function isYoutubeMobileUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.toLowerCase() === "m.youtube.com";
  } catch {
    return false;
  }
}

function isGooglevideoUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    const host = hostname.toLowerCase();
    return (
      protocol === "https:" &&
      (host === "googlevideo.com" || host.endsWith(".googlevideo.com"))
    );
  } catch {
    return false;
  }
}

async function ensureDnrHeaderStripRule(
  url: string,
  isTargetUrl: (url: string) => boolean,
  ruleId: number,
  requestHeaders: DnrRequestHeader[],
  urlFilter: string,
): Promise<boolean> {
  if (!hasDnr() || !isTargetUrl(url)) return false;

  const signature = signatureFromDnrRequestHeaders(requestHeaders);
  const rule = {
    id: ruleId,
    priority: 1,
    action: { type: "modifyHeaders", requestHeaders },
    condition: { urlFilter, resourceTypes: ["xmlhttprequest"] },
  };

  debug.log("[VOT EXT][background][dnr] applying rule", {
    ruleId,
    urlFilter,
    headerOps: requestHeaders.map((h) => `${h.operation}:${h.header}`),
    isDuplicate: signature === dnrAppliedSignatures.get(ruleId),
  });

  const isNew = await queueDnrSessionRuleUpdate(ruleId, signature, rule);
  debug.log("[VOT EXT][background][dnr] rule applied", { ruleId, isNew });
  return isNew;
}

export async function ensureDnrOriginStripRuleForYoutubei(
  url: string,
  forbiddenHeaders: Record<string, string> = {},
): Promise<boolean> {
  if (!isYoutubeMobileUrl(url)) return false;

  const requestHeaders: DnrRequestHeader[] = [...YOUTUBEI_BASE_HEADERS];

  for (const [header, value] of Object.entries(forbiddenHeaders)) {
    const name = normalizeHeaderName(header);
    if (!name || name.toLowerCase() === "origin") continue;
    requestHeaders.push({
      header: name,
      operation: "set",
      value: String(value),
    });
  }

  return ensureDnrHeaderStripRule(
    url,
    isYoutubeMobileUrl,
    DNR_RULE_ID_YOUTUBEI_ORIGIN,
    requestHeaders,
    "||m.youtube.com/",
  );
}

export async function ensureDnrStripRuleForGooglevideo(
  url: string,
  forbiddenHeaders: Record<string, string> = {},
): Promise<boolean> {
  if (!isGooglevideoUrl(url)) return false;

  const requestHeaders: DnrRequestHeader[] = [...GOOGLEVIDEO_BASE_HEADERS];

  for (const [header, value] of Object.entries(forbiddenHeaders)) {
    const name = normalizeHeaderName(header);
    if (!name || name.toLowerCase() === "origin") continue;
    requestHeaders.push({
      header: name,
      operation: "set",
      value: String(value),
    });
  }

  return ensureDnrHeaderStripRule(
    url,
    isGooglevideoUrl,
    DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
    requestHeaders,
    "||googlevideo.com/",
  );
}

export async function preseedDnrRules(): Promise<void> {
  if (!hasDnr()) return;

  try {
    await updateSessionRules({
      removeRuleIds: [
        DNR_RULE_ID_YOUTUBEI_ORIGIN,
        DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
      ],
      addRules: [
        {
          id: DNR_RULE_ID_YOUTUBEI_ORIGIN,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: YOUTUBEI_BASE_HEADERS,
          },
          condition: {
            urlFilter: "||m.youtube.com/",
            resourceTypes: ["xmlhttprequest"],
          },
        },
        {
          id: DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: GOOGLEVIDEO_BASE_HEADERS,
          },
          condition: {
            urlFilter: "||googlevideo.com/",
            resourceTypes: ["xmlhttprequest"],
          },
        },
      ],
    });
    dnrAppliedSignatures.set(
      DNR_RULE_ID_YOUTUBEI_ORIGIN,
      signatureFromDnrRequestHeaders(YOUTUBEI_BASE_HEADERS),
    );
    dnrAppliedSignatures.set(
      DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
      signatureFromDnrRequestHeaders(GOOGLEVIDEO_BASE_HEADERS),
    );
    debug.log("[VOT EXT][background] DNR rules pre-seeded");
  } catch (e) {
    debug.warn("[VOT EXT][background] Failed to pre-seed DNR rules:", e);
  }
}
