import { proxyWorkerHost } from "../../config/config";

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
  return host ?? proxyWorkerHost;
}

export function isProxyClientEnabled(config: ProxyConfig): boolean {
  return Boolean(config.translateProxyEnabled);
}

export function isProxyRoutingEnabled(config: ProxyConfig): boolean {
  return config.translateProxyEnabled === 2;
}

export function shouldForceProxyClientGmXhr(
  config: ProxyConfig & {
    gmXhrSupported?: boolean | null;
  },
): boolean {
  return Boolean(config.gmXhrSupported && isProxyClientEnabled(config));
}

export function proxifyYandexAudioUrl(
  audioUrl: string,
  config: ProxyConfig,
): string {
  if (
    !isProxyRoutingEnabled(config) ||
    !audioUrl.startsWith(AUDIO_SOURCE_PREFIX)
  ) {
    return audioUrl;
  }

  return audioUrl.replace(
    AUDIO_SOURCE_PREFIX,
    `https://${resolveProxyWorkerHost(config.proxyWorkerHost)}${AUDIO_PROXY_PATH_PREFIX}`,
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
  if (
    !isProxyRoutingEnabled(config) ||
    !subtitlesUrl.startsWith(SUBTITLE_SOURCE_PREFIX)
  ) {
    return subtitlesUrl;
  }

  const subtitlesPath = subtitlesUrl.slice(SUBTITLE_SOURCE_PREFIX.length);
  return `https://${resolveProxyWorkerHost(config.proxyWorkerHost)}${SUBTITLE_PROXY_PATH_PREFIX}${subtitlesPath}`;
}
