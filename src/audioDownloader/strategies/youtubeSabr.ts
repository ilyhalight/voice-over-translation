import { config as votConfig } from "@vot.js/shared";
import { SabrStream } from "googlevideo/sabr-stream";
import debug from "../../utils/debug";
import {
  getYoutubeAudioFormatLanguage as getAudioFormatLanguage,
  normalizeAudioLanguageTag as normalizeAudioLanguage,
} from "../utils";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import {
  audioLanguageMatches,
  getConfigValue,
  getYouTubeAuthorization,
  mintPagePoToken,
  postInnertubePlayer,
  resolveYtcfg,
  selectGvsPoTokenBinding,
  type WebAbrWindow,
  type WebEmbeddedFormat,
} from "./webAbr";
import {
  buildSabrPlayerRequest,
  getNativePlayerResponse,
  getTopPageWindow,
  resolveSabrStreamingUrl,
  selectEconomyAudioFormat,
} from "./youtubeSabrPlayer";
import {
  sabrTrackLanguage,
  setGeneratedSabrAudioTrackId,
  switchYouTubeSabrAudioTrack,
  toSabrFormat,
  VOT_SABR_INSTANCE_CONTEXT,
  WEB_ABR_RESOLVED_AUDIO_LANGUAGES,
  waitForSabrAudioTrackId,
} from "./youtubeSabrSupport";

function readProtoVarint(
  bytes: Uint8Array,
  start: number,
): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let offset = start;
  while (offset < bytes.length && shift <= 35) {
    const byte = bytes[offset++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return { value, next: offset };
    shift += 7;
  }
  throw new Error("invalid protobuf varint");
}

function getGeneratedSabrAudioTrackId(bytes: Uint8Array): string | undefined {
  try {
    let offset = 0;
    while (offset < bytes.length) {
      const tag = readProtoVarint(bytes, offset);
      offset = tag.next;
      const field = Math.floor(tag.value / 8);
      const wire = tag.value & 7;
      if (wire !== 2) {
        if (wire === 0) offset = readProtoVarint(bytes, offset).next;
        else if (wire === 1) offset += 8;
        else if (wire === 5) offset += 4;
        else return undefined;
        continue;
      }
      const length = readProtoVarint(bytes, offset);
      const start = length.next;
      const end = start + length.value;
      if (end > bytes.length) return undefined;
      if (field === 1) {
        let inner = start;
        while (inner < end) {
          const innerTag = readProtoVarint(bytes, inner);
          inner = innerTag.next;
          const innerField = Math.floor(innerTag.value / 8);
          const innerWire = innerTag.value & 7;
          if (innerWire === 2) {
            const innerLength = readProtoVarint(bytes, inner);
            const valueStart = innerLength.next;
            const valueEnd = valueStart + innerLength.value;
            if (valueEnd > end) return undefined;
            if (innerField === 69) {
              const trackId = new TextDecoder().decode(
                bytes.slice(valueStart, valueEnd),
              );
              return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?\.\d{1,3}$/.test(
                trackId,
              )
                ? trackId
                : undefined;
            }
            inner = valueEnd;
          } else if (innerWire === 0)
            inner = readProtoVarint(bytes, inner).next;
          else if (innerWire === 1) inner += 8;
          else if (innerWire === 5) inner += 4;
          else return undefined;
        }
      }
      offset = end;
    }
  } catch {}
  return undefined;
}

export async function* trySabrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  debug.log("[VOT][SABR][PRIMARY] entered trySabrAudioChunks", { videoId });
  WEB_ABR_RESOLVED_AUDIO_LANGUAGES.delete(videoId);
  const config = await resolveYtcfg(targetWindow, signal);
  const apiKey = getConfigValue(config, "INNERTUBE_API_KEY");
  if (typeof apiKey !== "string")
    throw new Error("Audio downloader. SABR config is unavailable");

  const body = buildSabrPlayerRequest(
    config,
    videoId,
    Number(getConfigValue(config, "STS")),
  );
  const context = body.context as { client: Record<string, unknown> };
  const clientVersion = String(context.client.clientVersion ?? "");
  const visitorData =
    context.client.visitorData ?? getConfigValue(config, "VISITOR_DATA");
  if (typeof visitorData === "string") context.client.visitorData = visitorData;

  const dataSyncId = getConfigValue(config, "DATASYNC_ID");
  const [firstSyncId, secondSyncId] =
    typeof dataSyncId === "string" ? dataSyncId.split("||") : [];
  const authorization = await getYouTubeAuthorization(
    targetWindow,
    String(
      getConfigValue(config, "USER_SESSION_ID") ??
        (secondSyncId || firstSyncId) ??
        "",
    ) || undefined,
  );
  const auth = authorization
    ? {
        authorization,
        sessionIndex: getConfigValue(config, "SESSION_INDEX"),
        delegatedSessionId:
          getConfigValue(config, "DELEGATED_SESSION_ID") ??
          (secondSyncId ? firstSyncId : undefined),
      }
    : {};

  let player = await postInnertubePlayer(
    targetWindow,
    signal,
    apiKey,
    body,
    "1",
    clientVersion,
    {},
  );
  if (
    authorization &&
    /LOGIN_REQUIRED|AGE_CHECK_REQUIRED|CONTENT_CHECK_REQUIRED/.test(
      player.playabilityStatus?.status ?? "",
    )
  ) {
    player = await postInnertubePlayer(
      targetWindow,
      signal,
      apiKey,
      body,
      "1",
      clientVersion,
      auth,
    );
  }

  // Prefer the exact player response used by the native YouTube player.
  // SABR authorization is tied to its ustreamer config/format metadata; a
  // separately generated /player response can be valid while still producing
  // a different SABR request payload. Keep our fetched response as fallback.
  const nativePlayer = getNativePlayerResponse(targetWindow, videoId);
  if (nativePlayer) player = nativePlayer;

  const playerServerAbrStreamingUrl =
    player.streamingData?.serverAbrStreamingUrl;

  // The translation request language and the YouTube audio-track selection are
  // different things. A user can ask VOT to translate from English while the
  // YouTube player is currently playing Japanese (or any other alternate audio
  // track). Never derive SABR trackId from requestLang/sourceLanguage.
  //
  // Instead capture a fresh native SABR request from the current YouTube player
  // and read its concrete ClientAbrState.audioTrackId (field 1 -> field 69).
  // This preserves YouTube's actual selection exactly: ja.10, en.4, en-US.4,
  // es-US.10, etc. No suffix/region is constructed or hard-coded.
  // Native SABR capture is diagnostic/track-selection assistance only.
  // Do not make VOT depend on the native player having already emitted a SABR POST.
  // YouTube keeps the document alive between watch pages. Explicitly drop a
  // snapshot from the previous video, while preserving the original fast SABR
  // request loop and all of its timing/backoff behavior.
  const requestedSabrLanguage = normalizeAudioLanguage(sourceLanguage);
  const resolvedSabrTrack = await waitForSabrAudioTrackId(
    targetWindow,
    signal,
    sourceLanguage,
    2000,
  );
  const sabrAvailableTrackIds = resolvedSabrTrack.availableTrackIds;
  if (resolvedSabrTrack.trackId)
    switchYouTubeSabrAudioTrack(targetWindow, resolvedSabrTrack.trackId);

  // PURE-ONLY build: do not arm, inspect, wait for, replay, or compare against
  // YouTube's native SABR requests. This path starts exclusively from /player.
  const nativeSabrAudioTrackId: string | undefined = undefined;

  // Track selection policy:
  // 1. Prefer the VOT UI language when YouTube exposes that real track.
  // 2. If it is absent, only consider tracks whose language exists in VOT's
  //    local SABR_ALTERNATIVE_SOURCE_LANGUAGES whitelist. Never use availableTrackIds[0] blindly.
  // 3. Among supported alternatives prefer the native YouTube track, because
  //    it is already bound to the captured SABR session.
  // 4. With no runtime list, preserve the native/default track.
  let sabrAudioTrackId = resolvedSabrTrack.trackId;
  let sabrTrackSelection:
    | "ui-language"
    | "supported-alternative"
    | "native-only"
    | "native-auto";

  if (resolvedSabrTrack.usedSupportedAlternative) {
    const supportedSet = new Set(
      resolvedSabrTrack.supportedAlternativeTrackIds,
    );
    if (nativeSabrAudioTrackId && supportedSet.has(nativeSabrAudioTrackId)) {
      sabrAudioTrackId = nativeSabrAudioTrackId;
    }
    sabrTrackSelection = "supported-alternative";
  } else if (sabrAudioTrackId) {
    sabrTrackSelection = "ui-language";
  } else if (sabrAvailableTrackIds.length === 0) {
    sabrAudioTrackId = nativeSabrAudioTrackId;
    sabrTrackSelection =
      requestedSabrLanguage && requestedSabrLanguage !== "auto"
        ? "native-only"
        : "native-auto";
  } else {
    throw new Error(
      `Audio downloader. SABR found no VOT-supported audio track ` +
        `(requested: ${sourceLanguage ?? "auto"}, available: ${sabrAvailableTrackIds.join(", ")})`,
    );
  }

  const actualSabrLanguage = sabrAudioTrackId
    ? sabrTrackLanguage(sabrAudioTrackId)
    : requestedSabrLanguage || undefined;

  WEB_ABR_RESOLVED_AUDIO_LANGUAGES.set(videoId, {
    videoId,
    requestedLanguage: requestedSabrLanguage || undefined,
    actualLanguage: actualSabrLanguage,
    trackId: sabrAudioTrackId,
    selection: sabrTrackSelection,
  });

  // Keep config/formats from one coherent player response. SabrStream starts
  // from that response URL, while sabrDiagnosticFetch may substitute a fresh
  // passively observed native URL at transport time. This avoids reprocessing
  // the signed `n` value while keeping request-body construction independent.
  const serverAbrStreamingUrl = playerServerAbrStreamingUrl
    ? await resolveSabrStreamingUrl(
        targetWindow,
        playerServerAbrStreamingUrl,
        config,
        signal,
      )
    : undefined;
  const videoPlaybackUstreamerConfig =
    player.playerConfig?.mediaCommonConfig?.mediaUstreamerRequestConfig
      ?.videoPlaybackUstreamerConfig;

  if (!serverAbrStreamingUrl || !videoPlaybackUstreamerConfig) {
    throw new Error(
      "Audio downloader. SABR metadata is unavailable in player response",
    );
  }

  const rawFormats = [
    ...(player.streamingData?.adaptiveFormats ?? []),
    ...(player.streamingData?.formats ?? []),
  ];

  const audioCandidates = rawFormats.filter(
    (format) =>
      format.mimeType?.includes("audio/") &&
      !format.mimeType?.includes("video/"),
  );

  // Multi-audio videos reuse the same itags (249/250/251/140...) for every
  // language. Selecting by itag alone therefore aliases all tracks to whichever
  // duplicate happens to occur first (observed as ar.10 / array index 0).
  // Resolve the concrete track first, then choose the economy representation
  // *inside that track*. Never convert a track position into a hard-coded index.
  const normalizedSelectedTrackId = sabrAudioTrackId?.toLowerCase();
  const requestedTrackLanguage = normalizedSelectedTrackId
    ? normalizeAudioLanguage(normalizedSelectedTrackId.split(".")[0])
    : normalizeAudioLanguage(sourceLanguage);
  const formatTrackId = (format: WebEmbeddedFormat): string | undefined =>
    format.audioTrackId ?? format.audioTrack?.id;

  const exactTrackAudioCandidates = normalizedSelectedTrackId
    ? audioCandidates.filter(
        (format) =>
          formatTrackId(format)?.toLowerCase() === normalizedSelectedTrackId,
      )
    : [];
  const languageTrackAudioCandidates =
    exactTrackAudioCandidates.length === 0 && requestedTrackLanguage
      ? audioCandidates.filter((format) =>
          audioLanguageMatches(
            getAudioFormatLanguage(format),
            requestedTrackLanguage,
          ),
        )
      : [];
  // Some native WEB SABR responses expose the concrete audioTrackId only in
  // ClientAbrState while adaptiveFormats contains no audioTrackId/language at
  // all. In that case requiring the player-format metadata to prove the track
  // again rejects a selection that the native SABR request already proves.
  //
  // This is deliberately NOT an itag/array[0] fallback. We only open the
  // representation set when (a) every audio format is track-unscoped and
  // (b) this exact selected track is present in the captured native request.
  // The preserved native ClientAbrState remains the authority for which audio
  // track the SABR server serves; selectEconomyAudioFormat only chooses the
  // representation/quality (249/250/251/140, DRC vs non-DRC).
  const playerHasConcreteAudioTrackMetadata = audioCandidates.some((format) =>
    Boolean(
      formatTrackId(format) ||
        normalizeAudioLanguage(getAudioFormatLanguage(format)),
    ),
  );
  const nativeRequestConfirmsSelectedTrack = false;
  const nativeBoundUnscopedAudioCandidates =
    exactTrackAudioCandidates.length === 0 &&
    languageTrackAudioCandidates.length === 0 &&
    !playerHasConcreteAudioTrackMetadata &&
    nativeRequestConfirmsSelectedTrack
      ? audioCandidates
      : [];

  const selectedTrackAudioCandidates =
    exactTrackAudioCandidates.length > 0
      ? exactTrackAudioCandidates
      : languageTrackAudioCandidates.length > 0
        ? languageTrackAudioCandidates
        : nativeBoundUnscopedAudioCandidates.length > 0
          ? nativeBoundUnscopedAudioCandidates
          : sabrAvailableTrackIds.length <= 1
            ? audioCandidates
            : [];

  if (selectedTrackAudioCandidates.length === 0) {
    throw new Error(
      `Audio downloader. SABR has no concrete formats for selected track ` +
        `${sabrAudioTrackId ?? "native/default"}; refusing array[0] fallback`,
    );
  }

  const selected = selectEconomyAudioFormat(selectedTrackAudioCandidates);
  if (!selected?.itag)
    throw new Error("Audio downloader. SABR audio format is unavailable");

  // Do not recover the selected format with find(itag): the same itag exists in
  // several audio tracks. Convert the exact object that won track + quality
  // selection so its audioTrackId/language metadata stays attached.
  const selectedSabr = toSabrFormat(selected);
  if (!selectedSabr)
    throw new Error(
      "Audio downloader. SABR selected format metadata is incomplete",
    );

  // SabrStream also indexes/chooses formats by itag. Supplying duplicate audio
  // itags for 20+ languages can collapse back to the first track. Keep all video
  // representations, but expose only the selected audio track to this instance.
  const selectedTrackAudioObjects = new Set(selectedTrackAudioCandidates);
  const sabrFormatsForStream = rawFormats.flatMap((format) => {
    const isAudio =
      format.mimeType?.includes("audio/") &&
      !format.mimeType?.includes("video/");
    if (isAudio && !selectedTrackAudioObjects.has(format)) return [];
    const converted = toSabrFormat(format);
    return converted ? [converted] : [];
  });

  const rawInnertubeContext = getConfigValue(config, "INNERTUBE_CONTEXT") as
    | { client?: Record<string, unknown> }
    | undefined;
  const nativeClient = rawInnertubeContext?.client ?? {};
  const pageWindow = getTopPageWindow(targetWindow);
  const clientInfo = {
    clientName:
      Number(getConfigValue(config, "INNERTUBE_CONTEXT_CLIENT_NAME")) || 1,
    clientVersion,
    ...(typeof nativeClient.hl === "string" && nativeClient.hl
      ? { acceptLanguage: nativeClient.hl }
      : {}),
    ...(typeof nativeClient.deviceMake === "string" && nativeClient.deviceMake
      ? { deviceMake: nativeClient.deviceMake }
      : {}),
    ...(typeof nativeClient.deviceModel === "string" && nativeClient.deviceModel
      ? { deviceModel: nativeClient.deviceModel }
      : {}),
    ...(typeof nativeClient.osName === "string" && nativeClient.osName
      ? { osName: nativeClient.osName }
      : {}),
    ...(typeof nativeClient.osVersion === "string" && nativeClient.osVersion
      ? { osVersion: nativeClient.osVersion }
      : {}),
  } as ConstructorParameters<typeof SabrStream>[0]["clientInfo"];

  // SABR (sabr=1) does not send the GVS PO token as a `pot=` URL query.
  // googlevideo/SabrStream serializes `poToken` into the SABR protobuf payload.
  // Reuse the same page BotGuard minter/binding policy as the direct Web-ABR path.
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS");
  const pageExperimentFlags = Object.values(
    playerContexts && typeof playerContexts === "object" ? playerContexts : {},
  ).flatMap((entry: { serializedExperimentFlags?: unknown } | null) =>
    typeof entry?.serializedExperimentFlags === "string"
      ? [entry.serializedExperimentFlags]
      : [],
  );
  const sabrPoTokenBinding = selectGvsPoTokenBinding(videoId, {
    loggedIn: Boolean(authorization),
    dataSyncId:
      player.responseContext?.mainAppWebResponseContext?.datasyncId ??
      dataSyncId,
    visitorData,
    experimentFlags: pageExperimentFlags,
  });
  const sabrPoToken = sabrPoTokenBinding
    ? await mintPagePoToken(targetWindow, sabrPoTokenBinding.value, signal)
    : undefined;

  type SabrProtoFieldSummary = {
    field: number;
    wireType: number;
    length?: number;
    value?: string;
  };

  const readSabrVarint = (
    bytes: Uint8Array,
    start: number,
  ): { value: bigint; next: number } | undefined => {
    let value = 0n;
    let shift = 0n;
    for (
      let offset = start;
      offset < bytes.length && offset < start + 10;
      offset++
    ) {
      const byte = bytes[offset];
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return { value, next: offset + 1 };
      shift += 7n;
    }
  };

  const inspectSabrProto = (bytes: Uint8Array) => {
    const fields: SabrProtoFieldSummary[] = [];
    let offset = 0;
    let parseError: string | undefined;
    while (offset < bytes.length && fields.length < 512) {
      const tag = readSabrVarint(bytes, offset);
      if (!tag) {
        parseError = `invalid tag at ${offset}`;
        break;
      }
      offset = tag.next;
      const field = Number(tag.value >> 3n);
      const wireType = Number(tag.value & 7n);
      if (!field) {
        parseError = `field 0 at ${offset}`;
        break;
      }
      if (wireType === 0) {
        const item = readSabrVarint(bytes, offset);
        if (!item) {
          parseError = `invalid varint field ${field}`;
          break;
        }
        offset = item.next;
        fields.push({ field, wireType, value: item.value.toString() });
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          parseError = `truncated fixed64 field ${field}`;
          break;
        }
        fields.push({ field, wireType, length: 8 });
        offset += 8;
      } else if (wireType === 2) {
        const length = readSabrVarint(bytes, offset);
        if (!length) {
          parseError = `invalid length field ${field}`;
          break;
        }
        offset = length.next;
        const size = Number(length.value);
        if (
          !Number.isSafeInteger(size) ||
          size < 0 ||
          offset + size > bytes.length
        ) {
          parseError = `truncated bytes field ${field} length ${length.value}`;
          break;
        }
        fields.push({ field, wireType, length: size });
        offset += size;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          parseError = `truncated fixed32 field ${field}`;
          break;
        }
        fields.push({ field, wireType, length: 4 });
        offset += 4;
      } else {
        parseError = `unsupported wire type ${wireType} field ${field}`;
        break;
      }
    }
    const counts: Record<string, number> = {};
    const lengths: Record<string, number[]> = {};
    for (const item of fields) {
      const key = String(item.field);
      counts[key] = (counts[key] ?? 0) + 1;
      if (item.length !== undefined) {
        lengths[key] ??= [];
        lengths[key].push(item.length);
      }
    }
    return {
      byteLength: bytes.byteLength,
      fieldFingerprint: fields
        .map(
          (item) =>
            `${item.field}:${item.wireType}:${item.length ?? item.value ?? ""}`,
        )
        .join("|"),
      fieldCounts: counts,
      fieldLengths: lengths,
      targetFields: Object.fromEntries(
        [1, 2, 3, 5, 16, 19].map((field) => [
          String(field),
          {
            count: counts[String(field)] ?? 0,
            lengths: lengths[String(field)] ?? [],
          },
        ]),
      ),
      parseError: parseError ?? null,
      parsedBytes: offset,
    };
  };

  // SELF_BUILT transport authority is the solved serverAbrStreamingUrl from
  // this /player response. SabrStream owns cpn/rn and all continuation URLs.

  let sabrRequestIndex = 0;
  let consecutivePostBootstrapRequestsWithoutBufferedRanges = 0;
  type SabrFetchRealm = WebAbrWindow & {
    Request?: typeof Request;
    Headers: typeof Headers;
    Blob?: typeof Blob;
    ReadableStream?: typeof ReadableStream;
    Response: typeof Response;
  };
  const fetchRealm = targetWindow as SabrFetchRealm;

  const sabrDiagnosticFetch: typeof fetch = async (input, init) => {
    const index = ++sabrRequestIndex;
    const RequestCtor = fetchRealm.Request;
    const inputIsRequest =
      typeof RequestCtor !== "undefined" && input instanceof RequestCtor;
    const requestInput = inputIsRequest ? (input as Request) : undefined;
    // Let SabrStream own the request URL/session sequence.  A native capture
    // belongs to another request pump and must not be grafted onto this one.
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const url = new URL(requestUrl, targetWindow.location.href);
    const isSabrRequest =
      url.hostname.endsWith("googlevideo.com") &&
      url.pathname === "/videoplayback" &&
      url.searchParams.get("sabr") === "1";
    if (isSabrRequest) {
      // Do not graft a native player's signed URL/cpn/rn onto this pump.
      // serverAbrStreamingUrl was independently n-solved above and SabrStream
      // is authoritative for this request sequence and redirects.
    }
    const method = init?.method ?? requestInput?.method ?? "GET";
    const body = init?.body ?? null;

    const headers = new fetchRealm.Headers(
      init?.headers ?? requestInput?.headers,
    );

    // Browser compatibility transport: googlevideo/SabrStream normally uses
    // application/x-protobuf, but a page-level cross-origin fetch in Firefox
    // can preflight that header and be rejected before SABR sees the request.
    // Removing it changes only HTTP metadata; the body remains protobuf.
    if (isSabrRequest) {
      headers.delete("content-type");
      headers.delete("Content-Type");
    }

    // A Blob with type="application/x-protobuf" makes Fetch synthesize the
    // Content-Type header again even after Headers.delete(). Materialize the
    // custom SABR body as raw bytes so Firefox cannot re-add that header.
    let transportBody: BodyInit | null = body;
    const BlobCtor = fetchRealm.Blob;
    if (
      isSabrRequest &&
      typeof BlobCtor !== "undefined" &&
      body instanceof BlobCtor
    ) {
      transportBody = await (body as Blob).arrayBuffer();
    }

    const headerEntries = Object.fromEntries(headers.entries());
    if (body !== null) {
      let bytes: Uint8Array | null = null;
      if (typeof body === "string") {
        bytes = new TextEncoder().encode(body);
      } else if (body instanceof ArrayBuffer) {
        bytes = new Uint8Array(body);
      } else if (ArrayBuffer.isView(body)) {
        bytes = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
      } else if (typeof BlobCtor !== "undefined" && body instanceof BlobCtor) {
      }

      if (bytes) {
        const protobuf = inspectSabrProto(bytes);
        const encodedAudioTrackId = getGeneratedSabrAudioTrackId(bytes);
        if (index <= 3 || encodedAudioTrackId !== sabrAudioTrackId) {
        }

        // A healthy post-bootstrap SabrStream must start reporting buffered
        // ranges. Without field 3 the server can keep returning data while the
        // client's playback position never advances, producing a request storm.
        if (index > 1) {
          const hasBufferedRanges =
            (protobuf.targetFields?.["3"]?.count ?? 0) > 0;
          consecutivePostBootstrapRequestsWithoutBufferedRanges =
            hasBufferedRanges
              ? 0
              : consecutivePostBootstrapRequestsWithoutBufferedRanges + 1;
          if (consecutivePostBootstrapRequestsWithoutBufferedRanges >= 8) {
            throw new Error(
              "SABR state did not produce buffered ranges after bootstrap",
            );
          }
        }
      }
    }

    const fetchWithGmFallback = async (): Promise<Response> => {
      try {
        const nativeInit: RequestInit = {
          ...(init ?? {}),
          headers,
          body: transportBody,
          credentials: "include",
          mode: "cors",
          cache: "no-store",
          redirect: "follow",
        };

        // SabrStream currently calls this adapter with a URL + body. Use the
        // rewritten URL so cpn/cver are not lost. Keep a conservative Request
        // fallback for unexpected callers.
        if (!inputIsRequest) {
          return await targetWindow.fetch(url.toString(), nativeInit);
        }

        if (!RequestCtor) {
          throw new Error(
            "Audio downloader. SABR Request constructor is unavailable",
          );
        }
        const rewrittenRequest = new RequestCtor(url.toString(), {
          method,
          headers,
          body: transportBody ?? undefined,
          credentials: "include",
          mode: "cors",
          cache: "no-store",
          redirect: "follow",
          signal: init?.signal ?? requestInput?.signal,
        });
        return await targetWindow.fetch(rewrittenRequest);
      } catch (nativeError) {
        const gmGlobal = globalThis as typeof globalThis & {
          GM_xmlhttpRequest?: (details: Record<string, unknown>) => unknown;
          GM?: {
            xmlHttpRequest?: (details: Record<string, unknown>) => unknown;
            xmlhttpRequest?: (details: Record<string, unknown>) => unknown;
          };
        };
        const callbackGm = gmGlobal.GM_xmlhttpRequest;
        const promiseGm =
          gmGlobal.GM?.xmlHttpRequest ?? gmGlobal.GM?.xmlhttpRequest;
        const gm =
          typeof callbackGm === "function"
            ? callbackGm
            : typeof promiseGm === "function"
              ? promiseGm.bind(gmGlobal.GM)
              : undefined;
        if (typeof gm !== "function") throw nativeError;

        let gmBody: string | ArrayBuffer | Blob | undefined;
        if (typeof transportBody === "string") {
          gmBody = transportBody;
        } else if (transportBody instanceof ArrayBuffer) {
          gmBody = transportBody.slice(0);
        } else if (ArrayBuffer.isView(transportBody)) {
          gmBody = transportBody.buffer.slice(
            transportBody.byteOffset,
            transportBody.byteOffset + transportBody.byteLength,
          ) as ArrayBuffer;
        } else if (
          typeof BlobCtor !== "undefined" &&
          transportBody instanceof BlobCtor
        ) {
          gmBody = await (transportBody as Blob).arrayBuffer();
        } else if (transportBody !== null || requestInput?.body) {
          throw nativeError;
        }

        return await new Promise<Response>((resolve, reject) => {
          let settled = false;
          let requestHandle: unknown;
          const signal = init?.signal ?? requestInput?.signal;
          const cleanup = () => signal?.removeEventListener("abort", onAbort);
          const finishReject = (error: unknown) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
          };
          const onAbort = () => {
            try {
              (requestHandle as { abort?: () => void } | undefined)?.abort?.();
            } catch {}
            finishReject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          };
          if (signal?.aborted) {
            onAbort();
            return;
          }
          signal?.addEventListener("abort", onAbort, { once: true });

          const parseHeaders = (raw: string | undefined) => {
            const result = new fetchRealm.Headers();
            for (const line of (raw ?? "").split(/\r?\n/)) {
              const colon = line.indexOf(":");
              if (colon > 0) {
                try {
                  result.append(
                    line.slice(0, colon).trim(),
                    line.slice(colon + 1).trim(),
                  );
                } catch {}
              }
            }
            return result;
          };

          type GmSabrResponse = {
            status?: number;
            statusText?: string;
            response?: ArrayBuffer;
            responseHeaders?: string;
            finalUrl?: string;
          };

          const finishResolve = (gmResponse: GmSabrResponse) => {
            if (settled) return;
            settled = true;
            cleanup();
            const responseHeaders = parseHeaders(gmResponse.responseHeaders);
            const response = new fetchRealm.Response(
              gmResponse.response ?? new ArrayBuffer(0),
              {
                status: gmResponse.status || 200,
                statusText: gmResponse.statusText ?? "",
                headers: responseHeaders,
              },
            );
            resolve(response);
          };

          const details: Record<string, unknown> = {
            method,
            url: url.toString(),
            headers: headerEntries,
            data: gmBody,
            responseType: "arraybuffer",
            anonymous: false,
            onload: finishResolve,
            onerror: (gmError: unknown) =>
              finishReject(
                gmError instanceof Error
                  ? gmError
                  : new TypeError("GM_xmlhttpRequest SABR request failed"),
              ),
            ontimeout: () =>
              finishReject(
                new TypeError("GM_xmlhttpRequest SABR request timed out"),
              ),
            onabort: () =>
              finishReject(
                new DOMException("The operation was aborted.", "AbortError"),
              ),
          };

          try {
            requestHandle = gm(details);
            if (
              requestHandle &&
              typeof (requestHandle as Promise<GmSabrResponse>).then ===
                "function"
            ) {
              (requestHandle as Promise<GmSabrResponse>).then(
                finishResolve,
                finishReject,
              );
            }
          } catch (gmError) {
            finishReject(gmError);
          }
        });
      }
    };
    const response = await fetchWithGmFallback();
    // `targetWindow.fetch()` (and the GM fallback above) return a Response
    // whose body chunks are created in the YouTube page realm. googlevideo's
    // CompositeBuffer currently distinguishes Uint8Array with `instanceof`.
    // A cross-realm Uint8Array fails that check and is then incorrectly
    // treated as CompositeBuffer (`chunk.chunks.forEach(...)`), which crashes.
    //
    // Re-stream the body and copy every chunk into this userscript realm.
    // Keep it streaming: buffering the whole SABR response here would add
    // unnecessary latency/memory use.
    if (response.body) {
      const foreignReader = response.body.getReader();
      const localBody = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { value, done } = await foreignReader.read();
            if (done) {
              controller.close();
              return;
            }
            if (!value) return;

            const source = ArrayBuffer.isView(value)
              ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
              : new Uint8Array(value as ArrayBuffer);
            const localChunk = new Uint8Array(source.byteLength);
            localChunk.set(source);
            controller.enqueue(localChunk);
          } catch (error) {
            controller.error(error);
          }
        },
        cancel(reason) {
          return foreignReader.cancel(reason);
        },
      });

      return new Response(localBody, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
    }

    return response;
  };

  // Do not synthesize native-only ClientAbrState fields here.
  //
  // The current YouTube player serializes ClientAbrState with a versioned
  // protobuf schema (fields 13,16,17,18,19,21,23,28,29,34,35,36,38,39,40,
  // 44,46,48,50,51,54,55,56,57,58,59,60,61,62,63,64,66,67,68,69,71,72,
  // 73,74,75,76,79,80,85). googlevideo/SabrStream already owns its cold-start
  // ABR state. Mixing guessed WEB-player values into that state can create a
  // syntactically valid but semantically inconsistent request.
  //
  // Keep only the one VOT-specific edit we actually need for multi-audio:
  // ClientAbrState.audioTrackId (protobuf field 69).
  const sabrPrototype = SabrStream.prototype as unknown as {
    buildRequestBody?: (
      abrState: Record<string, unknown>,
      selectedAudioFormat: unknown,
      selectedVideoFormat: unknown,
    ) => Uint8Array;
    __votNativeAbrStatePatched?: boolean;
  };

  if (
    typeof sabrPrototype.buildRequestBody === "function" &&
    !sabrPrototype.__votNativeAbrStatePatched
  ) {
    const originalBuildRequestBody = sabrPrototype.buildRequestBody;
    sabrPrototype.buildRequestBody = function (
      abrState,
      selectedAudioFormat,
      selectedVideoFormat,
    ) {
      const context = VOT_SABR_INSTANCE_CONTEXT.get(this as object);
      const generated = originalBuildRequestBody.call(
        this,
        abrState,
        selectedAudioFormat,
        selectedVideoFormat,
      );
      if (!context) return generated;

      context.buildIndex += 1;
      try {
        // PURE SELF_BUILT: never copy/splice/replay any native YouTube SABR
        // protobuf bytes. The complete request is generated by SabrStream.
        // VOT only applies its independently resolved multi-audio track id.
        let selfBuilt = generated;
        if (context.sabrAudioTrackId) {
          selfBuilt = setGeneratedSabrAudioTrackId(
            selfBuilt,
            context.sabrAudioTrackId,
          );
        }
        return selfBuilt;
      } catch {
        return generated;
      }
    };
    sabrPrototype.__votNativeAbrStatePatched = true;
  }

  let stream: SabrStream;
  stream = new SabrStream({
    fetch: sabrDiagnosticFetch,
    poToken: sabrPoToken,
    serverAbrStreamingUrl,
    videoPlaybackUstreamerConfig,
    clientInfo,
    formats: sabrFormatsForStream,
  });
  VOT_SABR_INSTANCE_CONTEXT.set(stream as unknown as object, {
    videoId,
    // Deliberately do not expose the captured body to PURE SELF_BUILT.
    // Capture remains available only to diagnostics and the later DIRECT fallback.
    sabrAudioTrackId,
    buildIndex: 0,
    pageWindow,
  });
  debug.log("[VOT][SABR][PURE_ONLY] SabrStream created", {
    videoId,
    sabrAudioTrackId,
    bootstrap: "playerResponse+SabrStream-generated-protobuf",
    nativeSabrCapture: "disabled",
    nativeBodyUsed: false,
    nativeUrlUsed: false,
    nativeCpnUsed: false,
    nativeRnUsed: false,
    serverAbrSource: "playerResponse",
    onlySabrStrategy: "PURE_SELF_BUILT",
  });

  const abort = () => stream.abort();
  signal.addEventListener("abort", abort, { once: true });
  try {
    const started = await stream.start({
      audioFormat: selectedSabr,
      // SABR currently initializes both tracks. Pick the smallest video and
      // drain it below so video backpressure cannot stall the audio download.
      videoFormat: (formats) =>
        formats
          .filter((format) => format.mimeType?.includes("video/"))
          .sort((a, b) => a.bitrate - b.bitrate)[0],
      // We only consume audio. Telling SabrStream this explicitly makes it
      // mark the dummy video format as discarded and, crucially, emit a
      // BufferedRange (protobuf field 3) from the first post-bootstrap
      // request instead of waiting for both tracks to initialize.
      enabledTrackTypes: 1,
      maxRetries: 3,
      stallDetectionMs: 20_000,
    });
    debug.log("[VOT][SABR][PURE_ONLY] SabrStream started", {
      videoId,
      sabrAudioTrackId,
    });

    // Do not cancel videoStream while SabrStream is active. Some versions use
    // both exposed streams as part of their internal scheduling/backpressure
    // state even when enabledTrackTypes=1. Cancelling video here can therefore
    // stop the request pump while audioReader is still waiting for more bytes.
    // enabledTrackTypes=1 already tells SABR that only audio is wanted; abort the
    // whole SabrStream during final cleanup instead.

    const audioReader = started.audioStream.getReader();

    // SABR is a stream too: emit normal AudioChunks while downloading instead
    // of buffering the complete track in memory and uploading one huge chunk.
    // Keep one completed chunk pending so only the actual final chunk is marked
    // with isLastChunk=true.
    const pending: Uint8Array[] = [];
    let pendingSize = 0;
    let readyChunk: Uint8Array | null = null;
    let total = 0;

    // In some userscript builds @vot.js/shared exposes config without
    // minChunkSize at runtime. Do not let `undefined` poison the arithmetic
    // below and turn pendingSize into NaN.
    const configuredMinChunkSize = Number(votConfig.minChunkSize);
    const minChunkSize =
      Number.isFinite(configuredMinChunkSize) && configuredMinChunkSize > 0
        ? Math.floor(configuredMinChunkSize)
        : 5_295_308;

    console.log("[VOT][SABR] chunk config", {
      configuredMinChunkSize: votConfig.minChunkSize,
      minChunkSize,
      usedFallback: minChunkSize !== configuredMinChunkSize,
    });
    try {
      while (true) {
        signal.throwIfAborted();

        let result: ReadableStreamReadResult<Uint8Array>;
        const readTimeoutMs = 25_000;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new Error(
                `Audio downloader. SABR audio stream stalled for ${readTimeoutMs}ms`,
              ),
            );
          }, readTimeoutMs);
        });
        try {
          result = await Promise.race([audioReader.read(), timeout]);
        } finally {
          if (timeoutId !== undefined) clearTimeout(timeoutId);
        }

        const { value, done } = result;

        if (done) break;
        if (!value?.byteLength) continue;

        const copy = new Uint8Array(value.byteLength);
        copy.set(
          new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
        );

        total += copy.byteLength;

        // A single SABR read can be much larger than minChunkSize. Split the
        // read itself so upload chunks do not inherit SABR stream boundaries.
        let copyOffset = 0;
        while (copyOffset < copy.byteLength) {
          const remaining = minChunkSize - pendingSize;
          const take = Math.min(remaining, copy.byteLength - copyOffset);

          pending.push(copy.subarray(copyOffset, copyOffset + take));
          pendingSize += take;
          copyOffset += take;

          if (pendingSize >= minChunkSize) {
            const nextChunk = concatBuffers(pending);
            pending.length = 0;
            pendingSize = 0;

            if (readyChunk) {
              console.log("[VOT][SABR] yielding chunk", {
                size: readyChunk.byteLength,
                isLastChunk: false,
                total,
                pendingSize,
                aborted: signal.aborted,
              });
              yield { buffer: readyChunk, isLastChunk: false };
              console.log("[VOT][SABR] resumed after yield", {
                total,
                aborted: signal.aborted,
              });
            }
            readyChunk = nextChunk;
          }
        }
      }

      if (pendingSize > 0) {
        const tail = concatBuffers(pending);
        pending.length = 0;
        pendingSize = 0;

        if (readyChunk) {
          console.log("[VOT][SABR] yielding chunk", {
            size: readyChunk.byteLength,
            isLastChunk: false,
            total,
            pendingSize,
            aborted: signal.aborted,
          });
          yield { buffer: readyChunk, isLastChunk: false };
          console.log("[VOT][SABR] resumed after yield", {
            total,
            aborted: signal.aborted,
          });
        }
        readyChunk = tail;
      }

      if (total < 1 || !readyChunk)
        throw new Error("Audio downloader. SABR returned empty audio");

      // A SABR ReadableStream can occasionally close cleanly even though only
      // the beginning of the selected representation was delivered. Treat a
      // large deficit as a premature EOF so the outer recovery layer can build
      // a completely fresh PURE SABR session instead of uploading truncated
      // audio. Keep tolerance for container/init differences (SabrStream uses
      // stripDuplicateInit) rather than requiring byte-for-byte equality.
      const expectedContentLength = Number(selected.contentLength);
      if (Number.isFinite(expectedContentLength) && expectedContentLength > 0) {
        const missingBytes = expectedContentLength - total;
        // HAR captures show that tiny UMP control responses are normal and must
        // not be treated as EOF. Completeness is checked only after the
        // googlevideo SabrStream closes its audio stream. At that point tolerate
        // only container/init accounting differences, not a large percentage of
        // the representation (the old 10% tolerance could hide a real truncation).
        const allowedDeficit = Math.max(
          256 * 1024,
          expectedContentLength * 0.02,
        );
        if (missingBytes > allowedDeficit) {
          throw new Error(
            `Audio downloader. SABR premature EOF (${total}/${expectedContentLength} bytes)`,
          );
        }
      }

      console.log("[VOT][SABR] yielding final chunk", {
        size: readyChunk.byteLength,
        isLastChunk: true,
        total,
        aborted: signal.aborted,
      });
      yield { buffer: readyChunk, isLastChunk: true };
      console.log("[VOT][SABR] resumed after final yield", {
        total,
        aborted: signal.aborted,
      });
    } catch (error) {
      console.error("[VOT][SABR] audio reader failed", {
        error,
        total,
        pendingSize,
        readyChunkSize: readyChunk?.byteLength ?? 0,
        aborted: signal.aborted,
        reason: signal.reason,
      });
      throw error;
    } finally {
      console.log("[VOT][SABR] releasing audio reader", {
        total,
        pendingSize,
        readyChunkSize: readyChunk?.byteLength ?? 0,
        aborted: signal.aborted,
        reason: signal.reason,
      });
      try {
        audioReader.releaseLock();
      } catch {
        // Ignore diagnostic cleanup errors.
      }
    }
  } finally {
    signal.removeEventListener("abort", abort);
    stream.abort();
  }
}
