import { describe, expect, it } from "vitest"
import { resolveBrowserStorage } from "./browserStorage"

describe("resolveBrowserStorage", () => {
  it("uses sessionStorage so a new browser session starts clean", () => {
    expect(resolveBrowserStorage()).toBe(window.sessionStorage)
    expect(resolveBrowserStorage()).not.toBe(window.localStorage)
  })
})
