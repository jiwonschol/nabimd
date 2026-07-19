import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ElapsedTime,
  formatElapsedTime,
  getElapsedMs,
} from "./ElapsedTime"

describe("ElapsedTime", () => {
  afterEach(() => vi.useRealTimers())

  it("formats short and long runs without wrapping at an hour", () => {
    expect(formatElapsedTime(0)).toBe("00:00")
    expect(formatElapsedTime(65_000)).toBe("01:05")
    expect(formatElapsedTime(3_661_000)).toBe("1:01:01")
  })

  it("clamps elapsed time when the wall clock moves backward", () => {
    expect(getElapsedMs(10_000, null, 9_000)).toBe(0)
    expect(getElapsedMs(10_000, 12_500, 99_000)).toBe(2_500)
  })

  it("ticks during a run and freezes at completion", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const { rerender } = render(
      <ElapsedTime completedAtMs={null} startedAtMs={1_000} />,
    )

    expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00")
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:02")

    rerender(<ElapsedTime completedAtMs={3_000} startedAtMs={1_000} />)
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:02")
  })
})
