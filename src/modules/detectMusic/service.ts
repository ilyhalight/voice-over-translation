import type { APIPlayerResponse } from "@vot.js/ext/types/helpers/youtube";
import debug from "#utils/debug.ts";
import { isAbortError } from "#utils/errors.ts";
import { GM_fetch } from "#utils/gm.ts";

export async function detectMusicYT(videoId: string, signal?: AbortSignal) {
  try {
    const res = await GM_fetch("https://music.youtube.com/youtubei/v1/player", {
      signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // it's works without these headers, but... better to have them
        "X-YouTube-Client-Name": "67",
        "X-YouTube-Client-Version": "1.20261011.16.00",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20261011.16.00",
          },
        },
        captionParams: {},
        videoId,
      }),
    });

    const data = (await res.json()) as APIPlayerResponse;
    const musicVideoType = data.videoDetails?.musicVideoType;
    if (
      musicVideoType?.startsWith("MUSIC_VIDEO_") &&
      musicVideoType !== "MUSIC_VIDEO_TYPE_PODCAST_EPISODE"
    ) {
      return true;
    }
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }

    debug.error("[musicDetect] Failed to detect music on YouTube", err);
  }
  return false;
}
