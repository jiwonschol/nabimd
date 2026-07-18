import { describe, expect, it, vi } from "vitest"
import { MemoryStorage } from "../test/MemoryStorage"
import { resolveBrowserStorage } from "./browserStorage"

const PROBE_PREFIX = "__nabimd_session_storage_probe__:"
const PROBE_VALUE = "available"
const PREEXISTING_VALUE = "unrelated learner data"

class RecordingStorage extends MemoryStorage {
  readonly operations: string[] = []

  protected seedValue(key: string, value: string): void {
    super.setItem(key, value)
  }

  readValue(key: string): string | null {
    return super.getItem(key)
  }

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

class ThrowingStorage extends RecordingStorage {
  constructor(
    private readonly operation: "getItem" | "setItem" | "removeItem",
  ) {
    super()
  }

  override getItem(key: string): string | null {
    if (this.operation === "getItem") {
      this.operations.push(`get:${key}`)
      throw new Error("getItem blocked")
    }
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    if (this.operation === "setItem") {
      this.operations.push(`set:${key}`)
      throw new Error("setItem blocked")
    }
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    if (this.operation === "removeItem") {
      this.operations.push(`remove:${key}`)
      throw new Error("removeItem blocked")
    }
    super.removeItem(key)
  }
}

class FirstCandidateCollisionStorage extends RecordingStorage {
  collidedKey: string | null = null

  constructor(private readonly failProbeRead = false) {
    super()
  }

  override getItem(key: string): string | null {
    if (key.startsWith(PROBE_PREFIX) && this.collidedKey === null) {
      this.collidedKey = key
      this.seedValue(key, PREEXISTING_VALUE)
      this.operations.push(`occupy:${key}`)
    }

    const value = super.getItem(key)
    if (
      this.failProbeRead &&
      key !== this.collidedKey &&
      value === PROBE_VALUE
    ) {
      throw new Error("probe read blocked")
    }
    return value
  }
}

class AlwaysCollidingStorage extends RecordingStorage {
  readonly collidedKeys = new Set<string>()

  override getItem(key: string): string | null {
    if (key.startsWith(PROBE_PREFIX) && !this.collidedKeys.has(key)) {
      this.collidedKeys.add(key)
      this.seedValue(key, PREEXISTING_VALUE)
      this.operations.push(`occupy:${key}`)
    }
    return super.getItem(key)
  }
}

class PostRemoveReadFailureStorage extends RecordingStorage {
  probeKey: string | null = null
  private failNextPostRemoveRead = false

  override setItem(key: string, value: string): void {
    super.setItem(key, value)
    if (key.startsWith(PROBE_PREFIX) && value === PROBE_VALUE) {
      this.probeKey = key
    }
  }

  override removeItem(key: string): void {
    super.removeItem(key)
    if (key === this.probeKey) this.failNextPostRemoveRead = true
  }

  override getItem(key: string): string | null {
    if (key === this.probeKey && this.failNextPostRemoveRead) {
      this.failNextPostRemoveRead = false
      this.seedValue(key, PREEXISTING_VALUE)
      throw new Error("post-remove verification blocked")
    }
    return super.getItem(key)
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

function operationKeys(storage: RecordingStorage, operation: string): string[] {
  return storage.operations
    .filter((item) => item.startsWith(`${operation}:`))
    .map((item) => item.slice(operation.length + 1))
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
      expect(operationKeys(available, "set")).toHaveLength(1)
      expect(operationKeys(available, "remove")).toHaveLength(1)
      expect(available.length).toBe(0)
    })
  })

  it("skips the exact first candidate collision without setting or removing it", () => {
    const available = new FirstCandidateCollisionStorage()

    withSessionStorage(available, () => {
      expect(resolveBrowserStorage()).toBe(available)
      expect(available.collidedKey).not.toBeNull()

      const collidedKey = available.collidedKey!
      expect(available.readValue(collidedKey)).toBe(PREEXISTING_VALUE)
      expect(operationKeys(available, "set")).not.toContain(collidedKey)
      expect(operationKeys(available, "remove")).not.toContain(collidedKey)
      expect(operationKeys(available, "set")[0]).not.toBe(collidedKey)
    })
  })

  it("preserves the exact collision when the later probe fails and cleans up", () => {
    const unavailable = new FirstCandidateCollisionStorage(true)

    withSessionStorage(unavailable, () => {
      expect(resolveBrowserStorage()).not.toBe(unavailable)
      const collidedKey = unavailable.collidedKey!
      const writtenKey = operationKeys(unavailable, "set")[0]
      expect(writtenKey).toBeDefined()
      if (writtenKey === undefined) throw new Error("Expected a probe write")

      expect(unavailable.readValue(collidedKey)).toBe(PREEXISTING_VALUE)
      expect(operationKeys(unavailable, "set")).not.toContain(collidedKey)
      expect(operationKeys(unavailable, "remove")).not.toContain(collidedKey)
      expect(unavailable.readValue(writtenKey)).toBeNull()
      expect(operationKeys(unavailable, "remove")).toEqual([writtenKey])
    })
  })

  it("uses unique per-call probe keys when Date.now is fixed", () => {
    const available = new RecordingStorage()
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(42)

    try {
      withSessionStorage(available, () => {
        expect(resolveBrowserStorage()).toBe(available)
        expect(resolveBrowserStorage()).toBe(available)
      })
    } finally {
      dateNow.mockRestore()
    }

    const writtenKeys = operationKeys(available, "set")
    expect(writtenKeys).toHaveLength(2)
    expect(new Set(writtenKeys).size).toBe(2)
  })

  it("falls back after exactly ten occupied candidate keys", () => {
    const unavailable = new AlwaysCollidingStorage()
    const dateNow = vi.spyOn(Date, "now").mockReturnValue(42)

    try {
      withSessionStorage(unavailable, () => {
        expect(resolveBrowserStorage()).not.toBe(unavailable)
      })
    } finally {
      dateNow.mockRestore()
    }

    expect(unavailable.collidedKeys.size).toBe(10)
    expect(operationKeys(unavailable, "set")).toEqual([])
    expect(operationKeys(unavailable, "remove")).toEqual([])
  })

  it("does not re-remove a key after removal succeeds but verification throws", () => {
    const unavailable = new PostRemoveReadFailureStorage()

    withSessionStorage(unavailable, () => {
      expect(resolveBrowserStorage()).not.toBe(unavailable)
    })

    const probeKey = unavailable.probeKey!
    expect(operationKeys(unavailable, "remove")).toEqual([probeKey])
    expect(unavailable.readValue(probeKey)).toBe(PREEXISTING_VALUE)
  })

  it.each([
    {
      operation: "getItem",
      expected: { get: 1, set: 0, remove: 0 },
    },
    {
      operation: "setItem",
      expected: { get: 1, set: 1, remove: 0 },
    },
    {
      operation: "removeItem",
      expected: { get: 2, set: 1, remove: 2 },
    },
  ] as const)(
    "uses volatile storage when sessionStorage.$operation throws",
    ({ operation, expected }) => {
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

      expect(operationKeys(unavailable, "get")).toHaveLength(expected.get)
      expect(operationKeys(unavailable, "set")).toHaveLength(expected.set)
      expect(operationKeys(unavailable, "remove")).toHaveLength(
        expected.remove,
      )
    },
  )
})
