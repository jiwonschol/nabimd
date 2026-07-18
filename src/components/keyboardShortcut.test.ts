import { describe, expect, it } from "vitest"
import { resolveCheckShortcut } from "./keyboardShortcut"

describe("resolveCheckShortcut", () => {
  it("uses the modern Apple platform value for the displayed and ARIA shortcut", () => {
    expect(
      resolveCheckShortcut({
        userAgentData: { platform: "macOS" },
        platform: "Linux x86_64",
      }),
    ).toEqual({ label: "⌘↩", ariaKeyShortcuts: "Meta+Enter" })
  })

  it("falls back to navigator.platform for Apple devices", () => {
    expect(
      resolveCheckShortcut({ userAgentData: {}, platform: "iPhone" }),
    ).toEqual({
      label: "⌘↩",
      ariaKeyShortcuts: "Meta+Enter",
    })
  })

  it("uses the Control shortcut on other platforms", () => {
    expect(resolveCheckShortcut({ platform: "Win32" })).toEqual({
      label: "Ctrl+↩",
      ariaKeyShortcuts: "Control+Enter",
    })
  })
})
