import { describe, expect, it, vi } from "vitest"
import {
  createActionKeyBindings,
  isActionShortcut,
  resolveActionShortcut,
} from "./keyboardShortcut"

describe("the shared Check-or-Next shortcut", () => {
  it("uses Control and Command on Apple platforms", () => {
    expect(
      resolveActionShortcut({
        userAgentData: { platform: "macOS" },
        platform: "Linux x86_64",
      }),
    ).toEqual({
      label: "⌃↩ / ⌘↩",
      ariaKeyShortcuts: "Control+Enter Meta+Enter",
    })
  })

  it("falls back to navigator.platform and includes the Windows alternative", () => {
    expect(
      resolveActionShortcut({ userAgentData: {}, platform: "iPhone" }),
    ).toEqual({
      label: "⌃↩ / ⌘↩",
      ariaKeyShortcuts: "Control+Enter Meta+Enter",
    })
    expect(resolveActionShortcut({ platform: "Win32" })).toEqual({
      label: "Ctrl+↩ / Shift+↩",
      ariaKeyShortcuts: "Control+Enter Shift+Enter",
    })
  })

  it("recognizes only the exact platform-approved modifier sets", () => {
    const enter = (overrides: Partial<KeyboardEvent>) =>
      ({
        key: "Enter",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        repeat: false,
        ...overrides,
      }) as KeyboardEvent

    expect(
      isActionShortcut(enter({ ctrlKey: true }), { platform: "Linux" }),
    ).toBe(true)
    expect(
      isActionShortcut(enter({ metaKey: true }), { platform: "MacIntel" }),
    ).toBe(true)
    expect(
      isActionShortcut(enter({ shiftKey: true }), { platform: "Win32" }),
    ).toBe(true)

    expect(isActionShortcut(enter({}), { platform: "Win32" })).toBe(false)
    expect(
      isActionShortcut(enter({ shiftKey: true }), { platform: "MacIntel" }),
    ).toBe(false)
    expect(
      isActionShortcut(enter({ ctrlKey: true, shiftKey: true }), {
        platform: "Win32",
      }),
    ).toBe(false)
    expect(
      isActionShortcut(enter({ ctrlKey: true, repeat: true }), {
        platform: "Linux",
      }),
    ).toBe(false)
  })

  it("uses the shared definitions in the editor without repeating an action", () => {
    const run = vi.fn(() => true)
    const [binding] = createActionKeyBindings(run, {
      platform: "MacIntel",
    })
    if (!binding) throw new Error("Expected an editor action key binding")
    const view = {} as Parameters<NonNullable<typeof binding.any>>[0]
    const enter = (overrides: Partial<KeyboardEvent>) =>
      ({
        key: "Enter",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        repeat: false,
        ...overrides,
      }) as KeyboardEvent

    expect(binding.any?.(view, enter({ metaKey: true }))).toBe(true)
    expect(run).toHaveBeenCalledOnce()

    expect(
      binding.any?.(view, enter({ metaKey: true, repeat: true })),
    ).toBe(true)
    expect(run).toHaveBeenCalledOnce()

    expect(binding.any?.(view, enter({ shiftKey: true }))).toBe(false)
  })
})
