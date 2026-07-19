import type { Command, KeyBinding } from "@codemirror/view"

export type NavigatorLike = {
  userAgentData?: { platform?: string }
  platform?: string
}

type PlatformFamily = "apple" | "windows" | "other"
type ShortcutPlatform = "all" | "apple" | "windows"

type ActionShortcut = {
  aria: string
  codeMirrorKey: string
  label: string
  platform: ShortcutPlatform
  modifiers: {
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
  }
}

// This is the single source of truth for Check and Next. CodeMirror bindings,
// DOM matching, visible labels, and aria-keyshortcuts all derive from it.
const ACTION_SHORTCUTS: readonly ActionShortcut[] = [
  {
    aria: "Control+Enter",
    codeMirrorKey: "Ctrl-Enter",
    label: "Ctrl+↩",
    platform: "all",
    modifiers: {
      altKey: false,
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    },
  },
  {
    aria: "Meta+Enter",
    codeMirrorKey: "Cmd-Enter",
    label: "⌘↩",
    platform: "apple",
    modifiers: {
      altKey: false,
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
    },
  },
  {
    aria: "Shift+Enter",
    codeMirrorKey: "Shift-Enter",
    label: "Shift+↩",
    platform: "windows",
    modifiers: {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
    },
  },
]

export function getPlatformFamily(
  navigatorLike: NavigatorLike,
): PlatformFamily {
  const platform =
    navigatorLike.userAgentData?.platform ?? navigatorLike.platform ?? ""
  if (/mac|iphone|ipad|ipod/i.test(platform)) return "apple"
  if (/win/i.test(platform)) return "windows"
  return "other"
}

function shortcutsFor(navigatorLike: NavigatorLike) {
  const platform = getPlatformFamily(navigatorLike)
  return ACTION_SHORTCUTS.filter(
    (shortcut) => shortcut.platform === "all" || shortcut.platform === platform,
  )
}

export function resolveActionShortcut(navigatorLike: NavigatorLike) {
  const platform = getPlatformFamily(navigatorLike)
  const shortcuts = shortcutsFor(navigatorLike)
  const labels = shortcuts.map((shortcut) =>
    platform === "apple" && shortcut.platform === "all"
      ? "⌃↩"
      : shortcut.label,
  )

  return {
    label: labels.join(" / "),
    ariaKeyShortcuts: shortcuts.map((shortcut) => shortcut.aria).join(" "),
  }
}

export function isActionShortcut(
  event: KeyboardEvent,
  navigatorLike: NavigatorLike,
): boolean {
  if (event.key !== "Enter" || event.repeat) return false

  return shortcutsFor(navigatorLike).some((shortcut) =>
    Object.entries(shortcut.modifiers).every(
      ([modifier, expected]) =>
        event[modifier as keyof ActionShortcut["modifiers"]] === expected,
    ),
  )
}

export function createActionKeyBindings(run: Command): KeyBinding[] {
  return ACTION_SHORTCUTS.map((shortcut) => {
    const binding: KeyBinding = { run }
    if (shortcut.platform === "all") binding.key = shortcut.codeMirrorKey
    if (shortcut.platform === "apple") binding.mac = shortcut.codeMirrorKey
    if (shortcut.platform === "windows") binding.win = shortcut.codeMirrorKey
    return binding
  })
}
