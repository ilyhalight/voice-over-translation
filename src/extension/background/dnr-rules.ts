import { browser, type Browser } from "wxt/browser";
import debug from "../../utils/debug";
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

const FORBIDDEN_HEADERS = new Set(["user-agent", "origin", "referer"]);

function createHeaderRule(
  id: number,
  requestHeaders: readonly DnrRequestHeader[],
  urlFilter: string,
): Browser.declarativeNetRequest.Rule {
  return {
    id,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [...requestHeaders],
    },
    condition: { urlFilter, resourceTypes: ["xmlhttprequest"] },
  } as Browser.declarativeNetRequest.Rule;
}

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
  rule: Browser.declarativeNetRequest.Rule,
): Promise<boolean> {
  if (signature === dnrAppliedSignatures.get(ruleId)) {
    return false;
  }

  const update = dnrRuleUpdateQueue.then(async () => {
    if (signature !== dnrAppliedSignatures.get(ruleId)) {
      await browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [ruleId],
        addRules: [rule],
      });
      dnrAppliedSignatures.set(ruleId, signature);
    }
    return true;
  });
  // A failed update still rejects its caller, but must not poison the queue.
  dnrRuleUpdateQueue = update.then(
    () => {},
    () => {},
  );
  return update;
}

export async function ensureDnrHeaderRuleForYandex(
  url: string,
  forbiddenHeaders: Record<string, string>,
): Promise<void> {
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
  const rule = createHeaderRule(
    DNR_RULE_ID_YANDEX_HEADERS,
    requestHeaders,
    "|https://api.browser.yandex.ru/",
  );

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
  ruleId: number,
  requestHeaders: DnrRequestHeader[],
  urlFilter: string,
): Promise<boolean> {
  const signature = signatureFromDnrRequestHeaders(requestHeaders);
  const rule = createHeaderRule(ruleId, requestHeaders, urlFilter);

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

function buildRequestHeaders(
  baseHeaders: DnrRequestHeader[],
  forbiddenHeaders: Record<string, string>,
): DnrRequestHeader[] {
  const requestHeaders: DnrRequestHeader[] = [...baseHeaders];
  for (const [header, value] of Object.entries(forbiddenHeaders)) {
    const name = normalizeHeaderName(header);
    if (!name || name.toLowerCase() === "origin") continue;
    requestHeaders.push({
      header: name,
      operation: "set",
      value: String(value),
    });
  }
  return requestHeaders;
}

export async function ensureDnrOriginStripRuleForYoutubei(
  url: string,
  forbiddenHeaders: Record<string, string> = {},
): Promise<boolean> {
  if (!isYoutubeMobileUrl(url)) return false;
  const requestHeaders = buildRequestHeaders(
    YOUTUBEI_BASE_HEADERS,
    forbiddenHeaders,
  );

  return ensureDnrHeaderStripRule(
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
  const requestHeaders = buildRequestHeaders(
    GOOGLEVIDEO_BASE_HEADERS,
    forbiddenHeaders,
  );

  return ensureDnrHeaderStripRule(
    DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
    requestHeaders,
    "||googlevideo.com/",
  );
}

export async function preseedDnrRules(): Promise<void> {
  const seeds = [
    [DNR_RULE_ID_YOUTUBEI_ORIGIN, YOUTUBEI_BASE_HEADERS, "||m.youtube.com/"],
    [
      DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
      GOOGLEVIDEO_BASE_HEADERS,
      "||googlevideo.com/",
    ],
  ] as const;
  // Serialized through the shared queue: running outside it races with
  // queueDnrSessionRuleUpdate (a request-specific rule could be clobbered and
  // dnrAppliedSignatures would stop matching the installed session rules).
  const update = dnrRuleUpdateQueue.then(async () => {
    // Never overwrite a rule a request already installed via the queue.
    const pending = seeds.filter(([id]) => !dnrAppliedSignatures.has(id));
    if (!pending.length) return;
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: pending.map(([id]) => id),
      addRules: pending.map(([id, headers, urlFilter]) =>
        createHeaderRule(id, headers, urlFilter),
      ),
    });
    for (const [id, headers] of pending) {
      dnrAppliedSignatures.set(id, signatureFromDnrRequestHeaders(headers));
    }
  });
  dnrRuleUpdateQueue = update.then(
    () => {},
    () => {},
  );
  try {
    await update;
    debug.log("[VOT EXT][background] DNR rules pre-seeded");
  } catch (e) {
    debug.warn("[VOT EXT][background] Failed to pre-seed DNR rules:", e);
  }
}
