import {
  cursorCharBackward,
  cursorCharForward,
  cursorGroupBackward,
  cursorGroupForward,
  cursorLineEnd,
  cursorLineStart,
} from "@codemirror/commands"
import { EditorView, type Command, type KeyBinding } from "@codemirror/view"
import {
  getPlatformFamily,
  type NavigatorLike,
} from "./keyboardShortcut"

function consume(command: Command): Command {
  return (view) => {
    command(view)
    return true
  }
}

const crossPlatformReadlineKeymap: readonly KeyBinding[] = [
  { key: "Ctrl-a", run: consume(cursorLineStart), preventDefault: true },
  { key: "Ctrl-e", run: consume(cursorLineEnd), preventDefault: true },
  { key: "Ctrl-f", run: consume(cursorCharForward), preventDefault: true },
  { key: "Ctrl-b", run: consume(cursorCharBackward), preventDefault: true },
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
  if (event.code === "KeyF") {
    cursorGroupForward(view)
    return true
  }
  if (event.code === "KeyB") {
    cursorGroupBackward(view)
    return true
  }
  return false
}

const missingWordMotions: readonly KeyBinding[] = [
  {
    any: runOptionWordMotion,
    key: "Alt-f",
    run: consume(cursorGroupForward),
    preventDefault: true,
  },
  { key: "Alt-b", run: consume(cursorGroupBackward), preventDefault: true },
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
