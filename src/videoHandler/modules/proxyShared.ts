import { MEDIA_PROXY_HOST, PROXY_WORKER_HOST } from "../../config/config";
import debug from "../../utils/debug";

const AUDIO_SOURCE_PREFIX =
  "https://vtrans.s3-private.mds.yandex.net/tts/prod/";
const AUDIO_PROXY_PATH_PREFIX = "/video-translation/audio-proxy/";

const SUBTITLE_SOURCE_PREFIX =
  "https://brosubs.s3-private.mds.yandex.net/vtrans/";
const SUBTITLE_PROXY_PATH_PREFIX = "/video-subtitles/subtitles-proxy/";

export type ProxyConfig = {
  translateProxyEnabled?: number | null;
  proxyWorkerHost?: string | null;
};

export function resolveProxyWorkerHost(host?: string | null): string {
  return host ?? PROXY_WORKER_HOST;
}

export function normalizeMediaProxyHost(value?: string | null): string {
  let host = (value ?? "").trim();
  if (!host) {
    return MEDIA_PROXY_HOST;
  }

  if (/^http:\/\//i.test(host)) {
    debug.log("mediaProxyHost must use https, using the default:", host);
    return MEDIA_PROXY_HOST;
  }

  host = host.replace(/^https:\/\//i, "").replace(/\/$/, "");
  try {
    const url = new URL(`https://${host}`);
    if (
      host.includes("/") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      debug.log("mediaProxyHost must be a bare host, using the default:", host);
      return MEDIA_PROXY_HOST;
    }
    return url.host || MEDIA_PROXY_HOST;
  } catch {
    debug.log("mediaProxyHost is invalid, using the default:", host);
    return MEDIA_PROXY_HOST;
  }
}

export function isProxyClientEnabled(config: ProxyConfig): boolean {
  return Boolean(config.translateProxyEnabled);
}

function isProxyRoutingEnabled(config: ProxyConfig): boolean {
  return config.translateProxyEnabled === 2;
}

export function shouldForceProxyClientGmXhr(
  config: ProxyConfig & {
    gmXhrSupported?: boolean | null;
  },
): boolean {
  return Boolean(config.gmXhrSupported && isProxyClientEnabled(config));
}

/**
 * Generic proxy URL rewriter. Replaces a known source prefix with the
 * proxy-worker host + path when proxy routing is enabled.
 *
 * Centralizes the shared logic previously duplicated across
 * proxifyYandexAudioUrl and proxifyYandexSubtitlesUrl.
 */
function proxifyUrl(
  url: string,
  config: ProxyConfig,
  sourcePrefix: string,
  proxyPathPrefix: string,
): string {
  if (!isProxyRoutingEnabled(config) || !url.startsWith(sourcePrefix)) {
    return url;
  }

  return url.replace(
    sourcePrefix,
    `https://${resolveProxyWorkerHost(config.proxyWorkerHost)}${proxyPathPrefix}`,
  );
}

export function proxifyYandexAudioUrl(
  audioUrl: string,
  config: ProxyConfig,
): string {
  return proxifyUrl(
    audioUrl,
    config,
    AUDIO_SOURCE_PREFIX,
    AUDIO_PROXY_PATH_PREFIX,
  );
}

export function unproxifyYandexAudioUrl(audioUrl: string): string {
  const str = String(audioUrl || "");
  if (!str) return str;

  try {
    const url = new URL(str);
    if (!url.pathname.startsWith(AUDIO_PROXY_PATH_PREFIX)) {
      return str;
    }

    url.host = "vtrans.s3-private.mds.yandex.net";
    url.pathname = `/tts/prod/${url.pathname
      .slice(AUDIO_PROXY_PATH_PREFIX.length)
      .replace(/^\/+/, "")}`;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return str;
  }
}

export function isYandexAudioUrlOrProxy(
  url: string,
  config: {
    proxyWorkerHost?: string | null;
  },
): boolean {
  return (
    url.startsWith(AUDIO_SOURCE_PREFIX) ||
    url.startsWith(
      `https://${resolveProxyWorkerHost(config.proxyWorkerHost)}${AUDIO_PROXY_PATH_PREFIX}`,
    )
  );
}

export function proxifyYandexSubtitlesUrl(
  subtitlesUrl: string,
  config: ProxyConfig,
): string {
  return proxifyUrl(
    subtitlesUrl,
    config,
    SUBTITLE_SOURCE_PREFIX,
    SUBTITLE_PROXY_PATH_PREFIX,
  );
}
