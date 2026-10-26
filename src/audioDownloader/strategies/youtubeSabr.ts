import { config as votConfig } from "@vot.js/shared";
import { SabrStream } from "googlevideo/sabr-stream";
import { EnabledTrackTypes } from "googlevideo/utils";
import debug from "../../utils/debug";
import {
  normalizeAudioLanguageTag as normalizeAudioLanguage,
  toPrimitiveString,
} from "../utils";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import {
  getConfigValue,
  getYouTubeAuthorization,
  mintPagePoToken,
  postInnertubePlayer,
  resolveYtcfg,
  selectGvsPoTokenBinding,
  type WebAbrWindow,
} from "./webAbr";
import { isUsableYouTubeAudioFormat } from "./youtubeAudioSelection";
import {
  buildSabrPlayerRequest,
  getNativePlayerResponse,
  resolveSabrStreamingUrl,
} from "./youtubeSabrPlayer";
import {
  sabrTrackLanguage,
  selectSabrAudioFormat,
  switchYouTubeSabrAudioTrack,
  toSabrFormat,
  WEB_ABR_RESOLVED_AUDIO_LANGUAGES,
  waitForSabrAudioTrackId,
} from "./youtubeSabrSupport";

export async function* trySabrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  debug.log("[SABR][PRIMARY] entered trySabrAudioChunks", { videoId });
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
  const clientVersion = toPrimitiveString(context.client.clientVersion);
  const visitorData =
    context.client.visitorData ?? getConfigValue(config, "VISITOR_DATA");
  if (typeof visitorData === "string") context.client.visitorData = visitorData;

  const dataSyncId = getConfigValue(config, "DATASYNC_ID");
  const [firstSyncId, secondSyncId] =
    typeof dataSyncId === "string" ? dataSyncId.split("||") : [];
  const authorization = await getYouTubeAuthorization(
    targetWindow,
    toPrimitiveString(
      getConfigValue(config, "USER_SESSION_ID") ??
        (secondSyncId || firstSyncId),
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

  // Resolve a concrete runtime track ID rather than deriving a suffix from language.
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

  const sabrAudioTrackId = resolvedSabrTrack.trackId;
  let sabrTrackSelection:
    | "ui-language"
    | "supported-alternative"
    | "native-only"
    | "native-auto";

  if (resolvedSabrTrack.usedSupportedAlternative) {
    sabrTrackSelection = "supported-alternative";
  } else if (sabrAudioTrackId) {
    sabrTrackSelection = "ui-language";
  } else if (sabrAvailableTrackIds.length === 0) {
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

  const availableSabrFormats = rawFormats.flatMap((format) => {
    if (!isUsableYouTubeAudioFormat(format)) return [];
    try {
      const converted = toSabrFormat(format);
      return converted ? [converted] : [];
    } catch {
      // Malformed xtags cannot provide a trustworthy representation identity.
      return [];
    }
  });
  const selected = selectSabrAudioFormat(
    availableSabrFormats,
    sabrAudioTrackId,
    sourceLanguage,
  );
  if (!selected) {
    throw new Error(
      `Audio downloader. SABR has no compatible available audio format for selected track ` +
        `${sabrAudioTrackId ?? sourceLanguage ?? "native/default"}`,
    );
  }
  // Trackless player metadata describes an available representation, not a
  // foreign track. Bind only that case to the resolved runtime audio track.
  const selectedSabr =
    selected.audioTrackId || !sabrAudioTrackId
      ? selected
      : { ...selected, audioTrackId: sabrAudioTrackId };

  const rawInnertubeContext = getConfigValue(config, "INNERTUBE_CONTEXT") as
    | { client?: Record<string, unknown> }
    | undefined;
  const nativeClient = rawInnertubeContext?.client ?? {};
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

  // Number-based varint reader (no BigInt). Values above 2^53 lose precision,
  // which is harmless here: they are only compared against small field numbers
  // or the payload length, and any such length is rejected as truncated.
  const readSabrVarint = (
    bytes: Uint8Array,
    start: number,
  ): { value: number; next: number } | undefined => {
    let value = 0;
    let scale = 1;
    const end = Math.min(bytes.length, start + 10);
    for (let offset = start; offset < end; offset++) {
      const byte = bytes[offset];
      value += (byte & 0x7f) * scale;
      if ((byte & 0x80) === 0) return { value, next: offset + 1 };
      scale *= 128;
    }
    return undefined;
  };

  // Early-exit scan of top-level protobuf fields: true as soon as a well-formed
  // `targetField` is found before the first malformed field (512-field cap).
  // Replaces a full summary builder whose only consumer read field 3's count.
  const hasSabrProtoField = (
    bytes: Uint8Array,
    targetField: number,
  ): boolean => {
    let offset = 0;
    for (let parsed = 0; offset < bytes.length && parsed < 512; parsed++) {
      const wireType = bytes[offset] & 7;
      const tag = readSabrVarint(bytes, offset);
      if (!tag || tag.value < 8) return false;
      offset = tag.next;
      if (wireType === 0) {
        const item = readSabrVarint(bytes, offset);
        if (!item) return false;
        offset = item.next;
      } else if (wireType === 1 || wireType === 5) {
        offset += wireType === 1 ? 8 : 4;
        if (offset > bytes.length) return false;
      } else if (wireType === 2) {
        const length = readSabrVarint(bytes, offset);
        if (!length || length.next + length.value > bytes.length) return false;
        offset = length.next + length.value;
      } else {
        return false;
      }
      if (Math.floor(tag.value / 8) === targetField) return true;
    }
    return false;
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
      RequestCtor !== undefined && input instanceof RequestCtor;
    const requestInput = inputIsRequest ? (input as Request) : undefined;
    // Let SabrStream own the request URL/session sequence.  A native capture
    // belongs to another request pump and must not be grafted onto this one.
    let requestUrl: string;
    if (typeof input === "string") {
      requestUrl = input;
    } else if (input instanceof URL) {
      requestUrl = input.toString();
    } else {
      requestUrl = input.url;
    }
    const url = new URL(requestUrl, targetWindow.location.href);
    const isSabrRequest =
      url.hostname.endsWith("googlevideo.com") &&
      url.pathname === "/videoplayback" &&
      url.searchParams.get("sabr") === "1";
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
    if (isSabrRequest && BlobCtor !== undefined && body instanceof BlobCtor) {
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
      }

      // A healthy post-bootstrap SabrStream must start reporting buffered
      // ranges. Without field 3 the server can keep returning data while the
      // client's playback position never advances, producing a request storm.
      if (bytes && index > 1) {
        consecutivePostBootstrapRequestsWithoutBufferedRanges =
          hasSabrProtoField(bytes, 3)
            ? 0
            : consecutivePostBootstrapRequestsWithoutBufferedRanges + 1;
        if (consecutivePostBootstrapRequestsWithoutBufferedRanges >= 8) {
          throw new Error(
            "SABR state did not produce buffered ranges after bootstrap",
          );
        }
      }
    }

    const fetchWithGmFallback = async (): Promise<Response> => {
      try {
        const nativeInit: RequestInit = {
          ...init,
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
        let gm = callbackGm;
        if (typeof gm !== "function" && typeof promiseGm === "function") {
          gm = promiseGm.bind(gmGlobal.GM);
        }
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
          BlobCtor !== undefined &&
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

  const stream = new SabrStream({
    videoId,
    fetchFunction: sabrDiagnosticFetch,
    poToken: sabrPoToken,
    serverAbrStreamingUrl,
    videoPlaybackUstreamerConfig,
    clientInfo,
    formats: [selectedSabr],
  });
  debug.log("[SABR][PURE_ONLY] SabrStream created", {
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
    const started = stream.start({
      audioFormat: (formats) =>
        formats.find((format) => format === selectedSabr),
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
      maxRetries: 3,
      stallDetectionMs: 20_000,
      isPostLiveDvr: false,
    });
    debug.log("[SABR][PURE_ONLY] SabrStream started", {
      videoId,
      sabrAudioTrackId,
    });

    const audioReader = started.audioStream.getReader();

    // SABR is a stream too: emit normal AudioChunks while downloading instead
    // of buffering the complete track in memory and uploading one huge chunk.
    // Keep one completed chunk pending so only the actual final chunk is marked
    // with isLastChunk=true.
    const pending: Uint8Array[] = [];
    let pendingSize = 0;
    let readyChunk: Uint8Array | null = null;
    let total = 0;

    const { minChunkSize } = votConfig;
    try {
      while (true) {
        signal.throwIfAborted();

        let result: ReadableStreamReadResult<ArrayBufferView>;
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
              debug.log("[SABR] yielding chunk", {
                size: readyChunk.byteLength,
                isLastChunk: false,
                total,
                pendingSize,
                aborted: signal.aborted,
              });
              yield { buffer: readyChunk, isLastChunk: false };
              debug.log("[SABR] resumed after yield", {
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
          debug.log("[SABR] yielding chunk", {
            size: readyChunk.byteLength,
            isLastChunk: false,
            total,
            pendingSize,
            aborted: signal.aborted,
          });
          yield { buffer: readyChunk, isLastChunk: false };
          debug.log("[SABR] resumed after yield", {
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

      debug.log("[SABR] yielding final chunk", {
        size: readyChunk.byteLength,
        isLastChunk: true,
        total,
        aborted: signal.aborted,
      });
      yield { buffer: readyChunk, isLastChunk: true };
      debug.log("[SABR] resumed after final yield", {
        total,
        aborted: signal.aborted,
      });
    } catch (error) {
      debug.error("[SABR] audio reader failed", {
        error,
        total,
        pendingSize,
        readyChunkSize: readyChunk?.byteLength ?? 0,
        aborted: signal.aborted,
        reason: signal.reason,
      });
      throw error;
    } finally {
      debug.log("[SABR] releasing audio reader", {
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
