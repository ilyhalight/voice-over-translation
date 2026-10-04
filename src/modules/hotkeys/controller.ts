import debug from "#utils/debug.ts";
import { getDeepActiveElement, isInputElement } from "#utils/dom.ts";
import type { HotkeyActionItem, ParsedHotkey, RawHotkey } from "./types";

export class HotkeyController {
  private userPressedKeys = new Set<string>();
  private hotkeyCache = new Map<string, ParsedHotkey>();
  actions: HotkeyActionItem[];

  constructor(actions: HotkeyActionItem[] = []) {
    this.actions = actions;
  }

  clearUserPressedKeys() {
    this.userPressedKeys.clear();
  }

  normalizeHotkeyPart(key: string): string {
    return key.replace("Key", "").replace("Digit", "");
  }

  isHotkeyMatch(
    pressedParts: ReadonlySet<string>,
    hotkey: ParsedHotkey | null,
  ): boolean {
    if (!hotkey) {
      return false;
    }

    if (pressedParts.size !== hotkey.parts.length) {
      return false;
    }

    for (const key of hotkey.partsSet) {
      if (!pressedParts.has(key)) {
        return false;
      }
    }

    return true;
  }

  getParsedHotkey(hotkey: RawHotkey): ParsedHotkey | null {
    if (!hotkey) {
      return null;
    }

    const cached = this.hotkeyCache.get(hotkey);
    if (cached) {
      return cached;
    }

    const parts = hotkey
      .split("+")
      .filter(Boolean)
      .map<string>(this.normalizeHotkeyPart.bind(this));
    const parsed: ParsedHotkey = {
      parts,
      partsSet: new Set(parts),
    };
    this.hotkeyCache.set(hotkey, parsed);
    return parsed;
  }

  get normalizedUserPressedKeys(): Set<string> {
    const pressedParts = new Set<string>();
    for (const key of this.userPressedKeys) {
      pressedParts.add(this.normalizeHotkeyPart(key));
    }

    return pressedParts;
  }

  keydownHandler(event: KeyboardEvent) {
    if (event.repeat) {
      return;
    }

    this.userPressedKeys.add(event.code);
    const activeElement = getDeepActiveElement(document) as HTMLElement | null;
    if (isInputElement(activeElement)) {
      return;
    }

    const pressedParts = this.normalizedUserPressedKeys;
    const matchedHotkeys = this.actions.find(({ hotkey }) => {
      return this.isHotkeyMatch(pressedParts, this.getParsedHotkey(hotkey));
    });
    if (!matchedHotkeys) {
      return;
    }

    const { action, localizationPhrase } = matchedHotkeys;
    this.clearUserPressedKeys();
    action().catch((error) => {
      debug.log(`[VOT] ${localizationPhrase} hotkey action failed`, error);
    });
  }

  keyupHandler(event: KeyboardEvent) {
    this.userPressedKeys.delete(event.code);
  }

  blurHandler() {
    this.clearUserPressedKeys();
  }

  visibilitychangeHandler() {
    if (document.hidden) {
      this.clearUserPressedKeys();
    }
  }
}
