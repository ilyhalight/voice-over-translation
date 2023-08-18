const VideoTranslationRequest = new protobuf.Type("VideoTranslationRequest")
  .add(new protobuf.Field("url", 3, "string"))
  .add(new protobuf.Field("deviceId", 4, "string")) // removed?
  .add(new protobuf.Field("firstRequest", 5, "bool")) // true for the first request, false for subsequent ones
  .add(new protobuf.Field("duration", 6, "double"))
  .add(new protobuf.Field("unknown2", 7, "int32")) // 1 1
  .add(new protobuf.Field("language", 8, "string")) // source language code
  .add(new protobuf.Field("unknown3", 9, "int32")) // 0 0
  .add(new protobuf.Field("unknown4", 10, "int32")) // 0 0
  .add(new protobuf.Field("translationHelp", 11, "int32")) // array for translation assistance ([0] -> {2: link to video, 1: "video_file_url"}, [1] -> {2: link to subtitles, 1: "subtitles_file_url"})
  .add(new protobuf.Field("responseLanguage", 14, "string")); // target language code

const VideoSubtitlesRequest = new protobuf.Type("VideoSubtitlesRequest")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("language", 2, "string")); // source language code

// const VideoWhitelistStreamRequest = new protobuf.Type("VideoWhitelistStreamRequest")
//   .add(new protobuf.Field("url", 1, "string"))
//   .add(new protobuf.Field("deviceId", 4, "string"))

// const VideoTranslationStreamRequest = new protobuf.Type("VideoTranslationStreamRequest")
//   .add(new protobuf.Field("url", 1, "string"))
//   .add(new protobuf.Field("language", 2, "string"))
//   .add(new protobuf.Field("responseLanguage", 3, "string"))

const VideoTranslationResponse = new protobuf.Type("VideoTranslationResponse")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("duration", 2, "double"))
  .add(new protobuf.Field("status", 4, "int32")) // status
  .add(new protobuf.Field("remainingTime", 5, "int32")) // secs before translation
  .add(new protobuf.Field("unknown0", 6, "int32")) // unknown 0 (1st request) -> 10 (2nd, 3th and etc requests)
  .add(new protobuf.Field("unknown1", 7, "string"))
  .add(new protobuf.Field("language", 8, "string")) // detected language (if the wrong one is set)
  .add(new protobuf.Field("message", 9, "string"));

const VideoSubtitlesObject = new protobuf.Type("VideoSubtitlesObject")
  .add(new protobuf.Field("language", 1, "string"))
  .add(new protobuf.Field("url", 2, "string"))
  .add(new protobuf.Field("unknown2", 3, "int32"))
  .add(new protobuf.Field("translatedLanguage", 4, "string"))
  .add(new protobuf.Field("translatedUrl", 5, "string"))
  .add(new protobuf.Field("unknown5", 6, "int32"))
  .add(new protobuf.Field("unknown6", 7, "int32"));

const VideoSubtitlesResponse = new protobuf.Type("VideoSubtitlesResponse")
  .add(new protobuf.Field("unknown0", 1, "int32"))
  .add(new protobuf.Field("subtitles", 2, "VideoSubtitlesObject", "repeated"));

// const VideoWhitelistStreamResponse = new protobuf.Type("VideoWhitelistStreamResponse")
//   .add(new protobuf.Field("inWhitelist", 1, "bool"))

// const VideoTranslationStreamResponse = new protobuf.Type("VideoTranslationStreamResponse")
//   .add(new protobuf.Field("unknown1", 1, "int32"))
//   .add(new protobuf.Field("array", 2, "string"))
//   .add(new protobuf.Field("ping", 3, "int32"))

// Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoWhitelistStreamRequest).add(VideoWhitelistStreamResponse);

// // Export the encoding and decoding functions
// export const yandexProtobuf = {
//   encodeTranslationRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoWhitelistStreamRequest.encode({
//       url,
//       deviceId: 'UCLA_DiR1FfKNvjuUpBHmylQ'
//     }).finish();
//   },
//   decodeTranslationResponse(response) {
//     return root.VideoWhitelistStreamResponse.decode(new Uint8Array(response));
//   }
// };

// // Create a root namespace and add the types
// const root = new protobuf.Root().define("yandex").add(VideoTranslationStreamRequest).add(VideoTranslationStreamResponse);

// // Export the encoding and decoding functions
// export const yandexProtobuf = {
//   encodeTranslationRequest(url, deviceId, unknown1, requestLang, responseLang) {
//     return root.VideoTranslationStreamRequest.encode({
//       url,
//       language: requestLang,
//       responseLanguage: responseLang
//     }).finish();
//   },
//   decodeTranslationResponse(response) {
//     return root.VideoTranslationStreamResponse.decode(new Uint8Array(response));
//   }
// };

// Create a root namespace and add the types
const root = new protobuf.Root()
  .define("yandex")
  .add(VideoTranslationRequest)
  .add(VideoTranslationResponse)
  .add(VideoSubtitlesRequest)
  .add(VideoSubtitlesObject)
  .add(VideoSubtitlesResponse);

// Export the encoding and decoding functions
export const yandexProtobuf = {
  encodeTranslationRequest(url, duration, requestLang, responseLang) {
    return root.VideoTranslationRequest.encode({
      url,
      firstRequest: true,
      duration,
      unknown2: 1,
      language: requestLang,
      unknown3: 0,
      unknown4: 0,
      responseLanguage: responseLang,
    }).finish();
  },
  decodeTranslationResponse(response) {
    return root.VideoTranslationResponse.decode(new Uint8Array(response));
  },
  encodeSubtitlesRequest(url, requestLang) {
    return root.VideoSubtitlesRequest.encode({
      url,
      language: requestLang,
    }).finish();
  },
  decodeSubtitlesResponse(response) {
    return root.VideoSubtitlesResponse.decode(new Uint8Array(response));
  },
};
