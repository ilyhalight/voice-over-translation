import type { OverlayMount } from "../types/uiManager";

/**
 * Compare overlay mount points by DOM identity.
 *
 * Mount updates should only run when one of the attachment roots actually
 * changes (root/portal/tooltip layout root).
 */
export function isSameOverlayMount(
  previous: OverlayMount,
  next: OverlayMount,
): boolean {
  return (
    previous.root === next.root &&
    previous.portalContainer === next.portalContainer &&
    previous.subtitlesMountContainer === next.subtitlesMountContainer
  );
}

/**
 * Runs `onChanged` only when mount targets are actually different.
 * Returns the mount that should become current state.
 */
export function applyOverlayMountUpdate(
  previous: OverlayMount,
  next: OverlayMount,
  onChanged: (mount: OverlayMount) => void,
): OverlayMount {
  if (isSameOverlayMount(previous, next)) {
    return previous;
  }

  onChanged(next);
  return next;
}
