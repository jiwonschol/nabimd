import "@testing-library/jest-dom/vitest"
import { beforeEach } from "vitest"
import { MemoryStorage } from "./MemoryStorage"

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
})

beforeEach(() => {
  window.localStorage.clear()
})
