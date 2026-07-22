function matchesMedia(query: string): boolean {
  try {
    return (
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia(query).matches
    );
  } catch {
    return false;
  }
}

export function hasTouchScreen(): boolean {
  const navigatorLike = globalThis.navigator;
  const maxTouchPoints = navigatorLike?.maxTouchPoints ?? 0;
  return (
    maxTouchPoints > 0 ||
    matchesMedia("(pointer: coarse)") ||
    matchesMedia("(hover: none)")
  );
}

export function isTouchFirstInput(): boolean {
  return (
    matchesMedia("(pointer: coarse)") ||
    (hasTouchScreen() && !matchesMedia("(hover: hover)"))
  );
}
