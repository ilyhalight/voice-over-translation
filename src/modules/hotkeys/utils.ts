export function normalizeHotkeyPart(key: string): string {
  return key.replace("Key", "").replace("Digit", "");
}

export function formatKeysCombo(keys: Set<string> | string[]): string {
  const keysArray = Array.isArray(keys) ? keys : Array.from(keys);

  return keysArray.map((code) => normalizeHotkeyPart(code)).join("+");
}

export function formatKeysComboDisplay(
  keys: Set<string> | string[] | string,
): string {
  let parts: string[];
  if (typeof keys === "string") {
    parts = keys.split("+").filter(Boolean);
  } else if (Array.isArray(keys)) {
    parts = keys;
  } else {
    parts = Array.from(keys);
  }

  const mapKey = (key: string) => {
    // Stored keys may have removed "Key" / "Digit" already.
    switch (key) {
      case "ControlLeft":
      case "ControlRight":
      case "Control":
        return "Ctrl";
      case "ShiftLeft":
      case "ShiftRight":
      case "Shift":
        return "Shift";
      case "AltLeft":
      case "AltRight":
      case "Alt":
        return "Alt";
      case "MetaLeft":
      case "MetaRight":
      case "Meta":
        return "Meta";
      case "Space":
        return "Space";
      case "ArrowUp":
        return "↑";
      case "ArrowDown":
        return "↓";
      case "ArrowLeft":
        return "←";
      case "ArrowRight":
        return "→";
      default:
        return normalizeHotkeyPart(key);
    }
  };

  // Show modifiers first, then the rest.
  const priority = (key: string) => {
    const m = mapKey(key);
    if (m === "Ctrl") return 0;
    if (m === "Alt") return 1;
    if (m === "Shift") return 2;
    if (m === "Meta") return 3;
    return 10;
  };

  return parts
    .slice()
    .sort((a, b) => priority(a) - priority(b))
    .map(mapKey)
    .join("+");
}
