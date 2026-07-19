import {
  cursorCharBackward,
  cursorCharForward,
  cursorGroupBackward,
  cursorGroupForward,
  cursorLineEnd,
  cursorLineStart,
} from "@codemirror/commands"
import { EditorView, type KeyBinding } from "@codemirror/view"
import {
  getPlatformFamily,
  type NavigatorLike,
} from "./keyboardShortcut"

const crossPlatformReadlineKeymap: readonly KeyBinding[] = [
  { key: "Ctrl-a", run: cursorLineStart },
  { key: "Ctrl-e", run: cursorLineEnd },
  { key: "Ctrl-f", run: cursorCharForward },
  { key: "Ctrl-b", run: cursorCharBackward, preventDefault: true },
]

function runOptionWordMotion(view: EditorView, event: KeyboardEvent): boolean {
  if (
    !event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return false
  }
  if (event.code === "KeyF") return cursorGroupForward(view)
  if (event.code === "KeyB") return cursorGroupBackward(view)
  return false
}

const missingWordMotions: readonly KeyBinding[] = [
  {
    any: runOptionWordMotion,
    key: "Alt-f",
    run: cursorGroupForward,
  },
  { key: "Alt-b", run: cursorGroupBackward, preventDefault: true },
]

export function resolveReadlineNavigationKeymap(
  navigatorLike: NavigatorLike,
): readonly KeyBinding[] {
  // defaultKeymap already provides Ctrl-A/E/F/B on macOS and document motion
  // through Mod-Home/Mod-End everywhere. Add only the missing readline keys.
  return getPlatformFamily(navigatorLike) === "apple"
    ? missingWordMotions
    : [...crossPlatformReadlineKeymap, ...missingWordMotions]
}
