/**
 * Coursera on-demand item types that can embed the same Video.js player
 * as lectures. vot.js currently only parses `/lecture/` routes.
 */
export const COURSERA_VIDEO_ITEM_TYPES = [
  "lecture",
  "ungradedLab",
  "ungradedWidget",
  "supplement",
  "programmingLab",
  "programmingAssignment",
  "notebook",
  "lab",
  "quiz",
  "exam",
  "peer",
  "discussionPrompt",
  "honors",
  "staffGraded",
  "assignment",
  "review",
  "workspaceLab",
  "ungradedLti",
  "gradedLti",
] as const;

const COURSERA_LEARN_ITEM_RE = new RegExp(
  `learn/([^/]+)/(${COURSERA_VIDEO_ITEM_TYPES.join("|")})/([^/]+)`,
);
const COURSERA_PREVIEW_LECTURE_RE = /lecture\/([^/]+)\/([^/]+)/;
const COURSERA_LEARN_SLUG_RE = /learn\/([^/]+)/;

/**
 * Returns the same ID shape as `@vot.js/ext` CourseraHelper for lectures:
 * `learn/COURSE/lecture/ITEM_ID`. Also accepts labs and other item routes.
 */
export function getCourseraVideoIdFromPath(
  pathname: string,
): string | undefined {
  return (
    COURSERA_LEARN_ITEM_RE.exec(pathname)?.[0] ??
    COURSERA_PREVIEW_LECTURE_RE.exec(pathname)?.[0]
  );
}

export function getCourseraCourseSlugFromPath(
  pathname: string,
): string | undefined {
  return (
    COURSERA_LEARN_SLUG_RE.exec(pathname)?.[1] ??
    COURSERA_PREVIEW_LECTURE_RE.exec(pathname)?.[1]
  );
}
