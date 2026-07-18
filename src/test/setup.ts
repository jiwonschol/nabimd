import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"
import { MemoryStorage } from "./MemoryStorage"

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
})

if (!Range.prototype.getClientRects) {
  Object.defineProperty(Range.prototype, "getClientRects", {
    value: () => [],
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})
