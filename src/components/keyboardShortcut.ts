import type { Command, KeyBinding } from "@codemirror/view"

export type NavigatorLike = {
  userAgentData?: { platform?: string }
  platform?: string
}

type PlatformFamily = "apple" | "windows" | "other"
type ShortcutPlatform = "all" | "apple" | "windows"

type ActionShortcut = {
  aria: string
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
  return !event.repeat && matchesActionCombination(event, navigatorLike)
}

function matchesActionCombination(
  event: KeyboardEvent,
  navigatorLike: NavigatorLike,
): boolean {
  if (event.key !== "Enter") return false

  return shortcutsFor(navigatorLike).some((shortcut) =>
    Object.entries(shortcut.modifiers).every(
      ([modifier, expected]) =>
        event[modifier as keyof ActionShortcut["modifiers"]] === expected,
    ),
  )
}

export function createActionKeyBindings(
  run: Command,
  navigatorLike: NavigatorLike,
): KeyBinding[] {
  return [
    {
      any(view, event) {
        if (!matchesActionCombination(event, navigatorLike)) return false
        if (event.repeat) return true
        return run(view)
      },
    },
  ]
}
