import * as path from "node:path";
import sites from "@vot.js/ext/sites";
import Bun from "bun";

import { extraData, siteData, sitesBlackList } from "./data";
import locales from "./locales";

const availableSites = sites.filter(
  (site) => !sitesBlackList.includes(site.host),
);

const MAX_VARIANTS = 256;
const REGEX_FLAGS = "dgimsuvy";

const hostTitleMap = {
  nine_gag: "9GAG",
  mailru: "Mail.ru",
  mail_ru: "Mail.ru",
  yandexdisk: "Yandex Disk",
  googledrive: "Google Drive",
  okru: "OK.ru",
  custom: "Direct link to MP4/WEBM",
  bannedvideo: "Banned.Video",
  nineanimetv: "9AnimeTV",
  "rapid-cloud.co": "9animetv.to (vidstreaming / vidcloud)",
};

function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}

function formatHostTitle(host) {
  return hostTitleMap[host] ?? ucFirst(host);
}

function normalizeDomain(domain) {
  if (!domain) {
    return "";
  }

  return domain
    .trim()
    .toLowerCase()
    .replaceAll(String.raw`\.`,".")
    .replaceAll(String.raw`\-`,"-")
    .replaceAll(String.raw`\/`,"/")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[()]/g, "")
    .replace(/^\./, "")
    .replace(/\.$/, "")
    .replace(/:\d+$/, "")
    .replace(/\s+/g, "")
    .replace(/\*{2,}/g, "*")
    .replace(/\.\./g, ".")
    .trim();
}

function wildcardToRegExp(wildcardPattern) {
  if (wildcardPattern === "*") {
    return /^.*$/i;
  }

  const escaped = wildcardPattern
    .replace(/[|\\{}()[\]^$+?.]/g, String.raw`\$&`)
    .replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function removeWildcardCoveredDomains(domains) {
  const uniqueDomains = Array.from(new Set(domains.filter(Boolean)));
  const wildcards = uniqueDomains.filter((domain) => domain.includes("*"));

  return uniqueDomains.filter((domain) => {
    if (domain.includes("*")) {
      return true;
    }

    return !wildcards.some((wildcard) => {
      if (wildcard === domain) {
        return false;
      }

      return wildcardToRegExp(wildcard).test(domain);
    });
  });
}

function getDomainNotice(domain, lang) {
  if (domain === "geo.dailymotion.com" || domain === "geo*.dailymotion.com") {
    return locales.dailymotionNotice[lang];
  }

  return "";
}

function formatDomain(domain, lang) {
  const notice = getDomainNotice(domain, lang);
  const suffix = notice ? ` (${notice})` : "";
  return `\`${domain}\`${suffix}`;
}

function unique(values) {
  return Array.from(new Set(values));
}

function joinVariants(baseVariants, tailVariants) {
  const variants = [];
  for (const base of baseVariants) {
    for (const tail of tailVariants) {
      variants.push(`${base}${tail}`);
      if (variants.length > MAX_VARIANTS) {
        return ["*"];
      }
    }
  }

  return unique(variants);
}

function skipEscaped(regexSource, index) {
  if (index >= regexSource.length) {
    return index;
  }

  if (regexSource[index] === "\\") {
    return Math.min(index + 2, regexSource.length);
  }

  return index + 1;
}

function parseCharClass(regexSource, startIndex) {
  let index = startIndex + 1;
  const chars = [];
  let negated = false;
  let canExpand = true;

  if (regexSource[index] === "^") {
    negated = true;
    canExpand = false;
    index += 1;
  }

  while (index < regexSource.length) {
    const char = regexSource[index];
    if (char === "]") {
      index += 1;
      break;
    }

    if (char === "\\") {
      const escaped = regexSource[index + 1];
      if (!escaped) {
        canExpand = false;
        index += 1;
        continue;
      }

      if ("dDsSwW".includes(escaped)) {
        canExpand = false;
      } else {
        chars.push(escaped);
      }
      index += 2;
      continue;
    }

    if (
      regexSource[index + 1] === "-" &&
      regexSource[index + 2] &&
      regexSource[index + 2] !== "]"
    ) {
      canExpand = false;
      index += 3;
      continue;
    }

    chars.push(char);
    index += 1;
  }

  if (negated || !canExpand || !chars.length || chars.length > 10) {
    return { variants: ["*"], index };
  }

  return { variants: unique(chars), index };
}

function parseQuantifier(regexSource, startIndex) {
  if (startIndex >= regexSource.length) {
    return null;
  }

  const quantifier = regexSource[startIndex];
  if (quantifier === "?") {
    let index = startIndex + 1;
    if (regexSource[index] === "?") {
      index += 1;
    }
    return { min: 0, max: 1, index };
  }

  if (quantifier === "+") {
    let index = startIndex + 1;
    if (regexSource[index] === "?") {
      index += 1;
    }
    return { min: 1, max: Number.POSITIVE_INFINITY, index };
  }

  if (quantifier === "*") {
    let index = startIndex + 1;
    if (regexSource[index] === "?") {
      index += 1;
    }
    return { min: 0, max: Number.POSITIVE_INFINITY, index };
  }

  if (quantifier !== "{") {
    return null;
  }

  const closeIndex = regexSource.indexOf("}", startIndex + 1);
  if (closeIndex === -1) {
    return null;
  }

  const body = regexSource.slice(startIndex + 1, closeIndex).trim();
  const exactMatch = /^(\d+)$/.exec(body);
  const rangeMatch = /^(\d+),(\d+)?$/.exec(body);

  if (exactMatch) {
    const value = Number(exactMatch[1]);
    let index = closeIndex + 1;
    if (regexSource[index] === "?") {
      index += 1;
    }
    return { min: value, max: value, index };
  }

  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max =
      rangeMatch[2] === undefined
        ? Number.POSITIVE_INFINITY
        : Number(rangeMatch[2]);
    let index = closeIndex + 1;
    if (regexSource[index] === "?") {
      index += 1;
    }
    return { min, max, index };
  }

  return null;
}

function applyQuantifier(variants, quantifier) {
  if (!quantifier) {
    return variants;
  }

  if (quantifier.min === 1 && quantifier.max === 1) {
    return variants;
  }

  if (quantifier.min === 0 && quantifier.max === 1) {
    return unique(["", ...variants]);
  }

  if (quantifier.min === 0) {
    return ["", "*"];
  }

  return ["*"];
}

function parseExpression(regexSource, startIndex = 0) {
  const allVariants = [];
  let index = startIndex;

  while (true) {
    const sequence = parseSequence(regexSource, index);
    allVariants.push(...sequence.variants);
    index = sequence.index;

    if (regexSource[index] !== "|") {
      break;
    }

    index += 1;
    if (index > regexSource.length) {
      break;
    }
  }

  return { variants: unique(allVariants), index };
}

function parseSequence(regexSource, startIndex) {
  let variants = [""];
  let index = startIndex;

  while (index < regexSource.length) {
    const char = regexSource[index];
    if (char === "|" || char === ")") {
      break;
    }

    const atom = parseAtom(regexSource, index);
    index = atom.index;
    const quantifier = parseQuantifier(regexSource, index);
    const atomVariants = applyQuantifier(atom.variants, quantifier);
    if (quantifier) {
      index = quantifier.index;
    }

    variants = joinVariants(variants, atomVariants);
  }

  return { variants, index };
}

function parseAtom(regexSource, startIndex) {
  const char = regexSource[startIndex];

  if (char === "\\") {
    const escaped = regexSource[startIndex + 1];
    if (!escaped) {
      return { variants: [""], index: startIndex + 1 };
    }

    if ("dDsSwW".includes(escaped)) {
      return { variants: ["*"], index: startIndex + 2 };
    }

    return { variants: [escaped], index: startIndex + 2 };
  }

  if (char === "[") {
    return parseCharClass(regexSource, startIndex);
  }

  if (char === "(") {
    let index = startIndex + 1;
    if (regexSource[index] === "?" && regexSource[index + 1] === ":") {
      index += 2;
    } else if (regexSource[index] === "?") {
      const closeIndex = findGroupEnd(regexSource, startIndex);
      return {
        variants: ["*"],
        index: closeIndex === -1 ? regexSource.length : closeIndex + 1,
      };
    }

    const parsedGroup = parseExpression(regexSource, index);
    if (regexSource[parsedGroup.index] !== ")") {
      return { variants: ["*"], index: parsedGroup.index };
    }

    return { variants: parsedGroup.variants, index: parsedGroup.index + 1 };
  }

  if (char === ".") {
    return { variants: ["."], index: startIndex + 1 };
  }

  if (char === "^" || char === "$") {
    return { variants: [""], index: startIndex + 1 };
  }

  return { variants: [char], index: startIndex + 1 };
}

function skipCharClassContent(regexSource, startIndex) {
  let index = startIndex + 1;
  while (index < regexSource.length && regexSource[index] !== "]") {
    index = skipEscaped(regexSource, index);
  }
  return index < regexSource.length ? index + 1 : regexSource.length;
}

function findGroupEnd(regexSource, startIndex) {
  let depth = 0;
  let index = startIndex;
  while (index < regexSource.length) {
    const char = regexSource[index];
    if (char === "[") {
      index = skipCharClassContent(regexSource, index);
      continue;
    }

    if (char === "\\") {
      index = Math.min(index + 2, regexSource.length);
      continue;
    }

    if (char === "(") {
      depth += 1;
      index += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }

  return -1;
}

function extractDomainsFromRegex(regex) {
  const source = regex.source.replace(/^\^/, "").replace(/\$$/, "");
  const parsed = parseExpression(source, 0);
  const variants = parsed.variants.length ? parsed.variants : [source];

  return unique(variants.map((domain) => normalizeDomain(domain)).filter(Boolean));
}

function parseRegexLiteral(literal) {
  if (!literal || literal[0] !== "/") {
    return null;
  }

  const lastSlash = literal.lastIndexOf("/");
  if (lastSlash <= 0) {
    return null;
  }

  const pattern = literal.slice(1, lastSlash);
  const flags = literal.slice(lastSlash + 1);
  if ([...flags].some((flag) => !REGEX_FLAGS.includes(flag))) {
    return null;
  }

  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

function extractDomainsFromFunction(matchFn) {
  const source = matchFn.toString();
  const domains = new Set();

  const hostRegexUsage =
    /(?<literal>\/(?:\\.|[^/\\\r\n])+\/[dgimsuvy]*)\s*\.\s*(?:test|exec)\s*\(\s*url\.(?:host|hostname)\s*\)/g;
  for (const entry of source.matchAll(hostRegexUsage)) {
    const regex = parseRegexLiteral(entry.groups?.literal);
    if (!regex) {
      continue;
    }

    for (const domain of extractDomainsFromRegex(regex)) {
      domains.add(domain);
    }
  }

  const hostIncludes =
    /url\.(?:host|hostname)\.includes\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  for (const entry of source.matchAll(hostIncludes)) {
    domains.add(normalizeDomain(entry[2]));
  }

  const hostEquals = /url\.(?:host|hostname)\s*===\s*(['"`])([^'"`]+)\1/g;
  for (const entry of source.matchAll(hostEquals)) {
    domains.add(normalizeDomain(entry[2]));
  }

  return Array.from(domains).filter(Boolean);
}

function extractDomainsFromMatch(match) {
  if (Array.isArray(match)) {
    return unique(match.flatMap((entry) => extractDomainsFromMatch(entry)));
  }

  if (match instanceof RegExp) {
    return extractDomainsFromRegex(match);
  }

  if (typeof match === "function") {
    return extractDomainsFromFunction(match);
  }

  if (typeof match === "string") {
    const normalized = normalizeDomain(match);
    return normalized ? [normalized] : [];
  }

  return [];
}

function mergeByHost(supportedSites) {
  const merged = new Map();

  for (const site of supportedSites) {
    const existing = merged.get(site.host) ?? {
      host: site.host,
      status: site.status,
      statusPhrase: site.statusPhrase,
      needBypassCSP: false,
      domains: new Set(),
    };

    existing.needBypassCSP = existing.needBypassCSP || Boolean(site.needBypassCSP);
    for (const domain of extractDomainsFromMatch(site.match)) {
      existing.domains.add(domain);
    }

    merged.set(site.host, existing);
  }

  return Array.from(merged.values()).map((site) => ({
    ...site,
    domains: Array.from(site.domains),
  }));
}

function renderSiteMarkdown(site, lang = "ru") {
  const hasData = Object.hasOwn(siteData, site.host);
  const limitsData = hasData ? [...(siteData[site.host].limits ?? [])] : [];
  if (site.needBypassCSP && !limitsData.includes(locales.needBypassCSP)) {
    limitsData.push(locales.needBypassCSP);
  }

  let limits = "";
  if (limitsData.length) {
    limits = `\n\n${locales.limitations[lang]}:\n\n- ${limitsData
      .map((limit) => limit[lang])
      .join("\n- ")}`;
  }

  const pathsData = hasData ? Array.from(siteData[site.host].paths ?? []) : [];
  let paths = "";
  if (pathsData.length) {
    paths = `\n\n${locales.availabledPaths[lang]}:\n\n- ${pathsData.join(
      "\n- ",
    )}`;
  }

  const extraDomains =
    hasData && siteData[site.host].domains ? siteData[site.host].domains : [];
  const baseDomains = extraDomains.length ? extraDomains : site.domains;
  const domains = removeWildcardCoveredDomains(
    baseDomains.map((domain) => normalizeDomain(domain)).filter(Boolean),
  ).map((domain) => formatDomain(domain, lang));
  const domainsList = domains.join("\n- ");

  return `## ${formatHostTitle(site.host)}

${locales.status[lang]}: [${site.status}] ${site.statusPhrase[lang]}

${locales.availabledDomains[lang]}:

- ${domainsList}${paths}${limits}`;
}

function genMarkdown(supportedSites, lang = "ru") {
  return mergeByHost(supportedSites).map((site) => renderSiteMarkdown(site, lang));
}

function getSupportedSites() {
  return availableSites.map((site) => {
    const host = site.host.toLowerCase();
    const hasExtraData = Object.hasOwn(extraData, host);

    return {
      host,
      match: host === "custom" ? "any" : site.match,
      status: hasExtraData ? extraData[host].status : "✅",
      statusPhrase: hasExtraData ? extraData[host].statusPhrase : locales.working,
      needBypassCSP: site.needBypassCSP,
    };
  });
}

async function main() {
  const supportedSites = getSupportedSites();
  const langs = ["ru", "en"];
  for await (const lang of langs) {
    const mdText = `${genMarkdown(supportedSites, lang).join("\n\n")}\n`;

    await Bun.write(
      path.join(import.meta.dir, `SITES-${lang.toUpperCase()}.md`),
      mdText,
    );
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error(err);
  }
}

export {
  extractDomainsFromFunction,
  extractDomainsFromMatch,
  extractDomainsFromRegex,
  genMarkdown,
  getSupportedSites,
  main,
  normalizeDomain,
};
