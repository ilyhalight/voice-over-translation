import Bun from "bun";

import * as path from "node:path";

import sites from "@vot.js/ext/sites";

import { extraData, siteData, sitesBlackList } from "./data";
import locales from "./locales";

const availableSites = sites.filter(
  (site) => !sitesBlackList.includes(site.host),
);

function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}

function getDomainFromRegex(domain, optionalBracket) {
  let clearDomain = domain;
  optionalBracket.map((bracket) => {
    clearDomain = clearDomain.replace(bracket, "");
  });

  const brackets = clearDomain
    .match(/\([^()]*\)/g)
    ?.filter((bracket) => bracket.includes("|"));
  if (!brackets?.length) {
    return [clearDomain];
  }

  const domains = [];
  for (const bracket of brackets) {
    const parts = brackets[0].replace(/[?()]+/g, "").split("|");
    for (const part of parts) {
      domains.push(clearDomain.replace(bracket, part));
    }
  }

  return domains;
}

function fixRegexStr(str) {
  let domain = new RegExp(str).source
    .replace(/^[/^]/g, "")
    .replace(/[$/]$/g, "");
  if (typeof str === "function") {
    return [
      /host.includes\(([^()]*)\)/.exec(domain)?.[1]?.replace(/["']/g, ""),
    ];
  }

  let brackets = Array.from(domain.matchAll(/\([^()]*\)(\?)?/g)).filter(
    (bracket) => !bracket[0].includes("(www.)?"),
  );
  if (!brackets.length) {
    return [domain];
  }

  let domains = new Set();
  brackets = brackets.map((bracket) => bracket[0]);
  const optionalBrackets = brackets.filter((bracket) => bracket.includes("?"));
  if (optionalBrackets.length) {
    for (const resultDomain of getDomainFromRegex(domain, optionalBrackets)) {
      domains.add(resultDomain);
    }
  }

  for (const bracket of brackets) {
    const parts = bracket.replace(/[?()]+/g, "").split("|");
    for (const part of parts) {
      let partedDomain = domain.replace(bracket, part);
      for (const resultDomain of getDomainFromRegex(
        partedDomain,
        optionalBrackets,
      )) {
        domains.add(resultDomain);
      }
    }
  }

  return Array.from(domains);
}

function getDomains(match) {
  if (typeof match === "function") {
    return [];
  }

  return Array.isArray(match)
    ? match.map((s) => fixRegexStr(s)).flat()
    : fixRegexStr(match);
}

function removeDuplicatesKeepLast(arr, key) {
  const map = new Map();
  arr.map((obj) => map.set(obj[key], obj));
  return Array.from(map.values());
}

function genMarkdown(supportedSites, lang = "ru") {
  let sitesData = supportedSites.map((site, idx) => {
    let domains = getDomains(site.match);
    let prev = idx > 0 ? supportedSites[idx - 1] : null;
    if (prev?.host === site.host) {
      let previousDomains = getDomains(prev.match);
      domains = Array.from(new Set([...domains, ...previousDomains]));
    }

    return {
      ...site,
      domains: domains
        .map((domain) => `\`${domain.replaceAll("\\.", ".")}\``)
        .join("\n- "),
    };
  });

  return removeDuplicatesKeepLast(sitesData, "host").map((site) => {
    const hasData = Object.hasOwn(siteData, site.host);
    const limitsData = hasData ? (siteData[site.host].limits ?? []) : [];
    if (site.needBypassCSP && !limitsData.includes(locales.needBypassCSP)) {
      limitsData.push(locales.needBypassCSP);
    }

    let limits = "";
    if (limitsData?.length) {
      limits = `\n\n${locales.limitations[lang]}:\n\n- ${limitsData
        .map((limit) => limit[lang])
        .join("\n- ")}`;
    }

    const pathsData = hasData ? Array.from(siteData[site.host].paths) : [];
    let paths = "";
    if (pathsData.length) {
      paths = `\n\n${locales.availabledPaths[lang]}:\n\n- ${pathsData.join(
        "\n- ",
      )}`;
    }

    const extraDomains =
      hasData && siteData[site.host].domains ? siteData[site.host].domains : [];
    const domains = [...extraDomains, site.domains].filter(Boolean);

    return `## ${ucFirst(site.host)}

${locales.status[lang]}: [${site.status}] ${site.statusPhrase[lang]}

${locales.availabledDomains[lang]}:

- ${domains}${paths}${limits}`;
  });
}

async function main() {
  const supportedSites = availableSites.map((site) => {
    const host = site.host.toLowerCase();
    const extra = Object.hasOwn(extraData, host);

    return {
      host,
      match: host === "custom" ? "any" : site.match,
      status: extra ? extraData[host].status : "✅",
      statusPhrase: extra ? extraData[host].statusPhrase : locales.working,
      additionalData: site.additionalData,
      needBypassCSP: site.needBypassCSP,
    };
  });

  const langs = ["ru", "en"];
  for await (const lang of langs) {
    const mdText =
      genMarkdown(supportedSites, lang)
        .join("\n\n")
        .replace("Nine_gag", "9GAG")
        .replace("Mailru", "Mail.ru")
        .replace("Yandexdisk", "Yandex Disk")
        .replace("Googledrive", "Google Drive")
        .replace("Okru", "OK.ru")
        .replace("Custom", "Direct link to MP4/WEBM")
        .replace("Bannedvideo", "Banned.Video")
        .replace(
          "geo.dailymotion.com",
          `geo.dailymotion.com (${locales.dailymotionNotice[lang]})`,
        )
        .replace("Nineanimetv", `9AnimeTV`)
        .replace("rapid-cloud.co", `9animetv.to (vidstreaming / vidcloud)`)
        .replaceAll("\\/", "/") + "\n";

    await Bun.write(
      path.join(__dirname, `SITES-${lang.toUpperCase()}.md`),
      mdText,
    );
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
}
