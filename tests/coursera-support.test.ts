import { describe, expect, test } from "bun:test";
import {
  getCourseraCourseSlugFromPath,
  getCourseraVideoIdFromPath,
} from "../src/core/courseraSupport";

describe("getCourseraVideoIdFromPath", () => {
  test("keeps the lecture id shape used by vot.js", () => {
    expect(
      getCourseraVideoIdFromPath(
        "/learn/google-ai-for-app-building/lecture/iutP3/learn-how-to-build-a-custom-ai-tool",
      ),
    ).toBe("learn/google-ai-for-app-building/lecture/iutP3");
  });

  test("resolves ungraded lab instruction and workspace routes", () => {
    const labId = "learn/google-ai-for-app-building/ungradedLab/SoZNK";

    expect(
      getCourseraVideoIdFromPath(
        "/learn/google-ai-for-app-building/ungradedLab/SoZNK/build-with-ai-brand-builder-app-to-visualize-any-product",
      ),
    ).toBe(labId);
    expect(
      getCourseraVideoIdFromPath(
        "/learn/google-ai-for-app-building/ungradedLab/SoZNK/build-with-ai-brand-builder-app-to-visualize-any-product/lab",
      ),
    ).toBe(labId);
  });

  test("resolves course preview lecture urls", () => {
    expect(
      getCourseraVideoIdFromPath(
        "/lecture/learning-how-to-learn/welcome-to-the-course",
      ),
    ).toBe("lecture/learning-how-to-learn/welcome-to-the-course");
  });

  test("ignores course home paths without a video item id", () => {
    expect(
      getCourseraVideoIdFromPath(
        "/learn/google-ai-for-app-building/home/week/1",
      ),
    ).toBeUndefined();
  });
});

describe("getCourseraCourseSlugFromPath", () => {
  test("reads the slug from lecture and lab routes", () => {
    expect(
      getCourseraCourseSlugFromPath(
        "/learn/google-ai-for-app-building/lecture/iutP3/title",
      ),
    ).toBe("google-ai-for-app-building");
    expect(
      getCourseraCourseSlugFromPath(
        "/learn/google-ai-for-app-building/ungradedLab/SoZNK/title/lab",
      ),
    ).toBe("google-ai-for-app-building");
  });
});
