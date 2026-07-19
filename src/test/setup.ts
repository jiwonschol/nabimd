import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"
import { MemoryStorage } from "./MemoryStorage"

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
})

Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  value: new MemoryStorage(),
})

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: () => Promise.resolve(),
})

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: () => {},
})

if (!Range.prototype.getClientRects) {
  Object.defineProperty(Range.prototype, "getClientRects", {
    value: () => [],
  })
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
})
