export function isPrimaryPointerAction(event: PointerEvent): boolean {
  return event.isPrimary && event.button === 0;
}

export function isKeyboardActivation(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}
