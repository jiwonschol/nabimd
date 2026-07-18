import { describe, expect, it } from "vitest"
import { MemoryStorage } from "../test/MemoryStorage"
import { resolveBrowserStorage } from "./browserStorage"

class ThrowingStorage extends MemoryStorage {
  constructor(
    private readonly operation: "getItem" | "setItem" | "removeItem",
  ) {
    super()
  }

  override getItem(key: string): string | null {
    if (this.operation === "getItem") throw new Error("getItem blocked")
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    if (this.operation === "setItem") throw new Error("setItem blocked")
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    if (this.operation === "removeItem") throw new Error("removeItem blocked")
    super.removeItem(key)
  }
}

class RecordingStorage extends MemoryStorage {
  readonly operations: string[] = []

  override getItem(key: string): string | null {
    this.operations.push(`get:${key}`)
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    this.operations.push(`set:${key}`)
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    this.operations.push(`remove:${key}`)
    super.removeItem(key)
  }
}

function withSessionStorage(storage: Storage, assertion: () => void) {
  const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage")
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  })

  try {
    assertion()
  } finally {
    if (descriptor) {
      Object.defineProperty(window, "sessionStorage", descriptor)
    }
  }
}

describe("resolveBrowserStorage", () => {
  it("uses sessionStorage so a new browser session starts clean", () => {
    expect(resolveBrowserStorage()).toBe(window.sessionStorage)
    expect(resolveBrowserStorage()).not.toBe(window.localStorage)
  })

  it("removes the availability probe before returning sessionStorage", () => {
    const available = new RecordingStorage()

    withSessionStorage(available, () => {
      expect(resolveBrowserStorage()).toBe(available)
      expect(available.operations.some((item) => item.startsWith("set:"))).toBe(
        true,
      )
      expect(
        available.operations.some((item) => item.startsWith("remove:")),
      ).toBe(true)
      expect(available.length).toBe(0)
    })
  })

  it.each(["getItem", "setItem", "removeItem"] as const)(
    "uses volatile storage when sessionStorage.%s throws",
    (operation) => {
      const unavailable = new ThrowingStorage(operation)

      withSessionStorage(unavailable, () => {
        const resolved = resolveBrowserStorage()

        expect(resolved).not.toBe(unavailable)
        expect(() => {
          resolved.setItem("draft", "# Apple")
          expect(resolved.getItem("draft")).toBe("# Apple")
          resolved.removeItem("draft")
        }).not.toThrow()
      })
    },
  )
})
