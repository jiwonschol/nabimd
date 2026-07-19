import { useEffect, useState } from "react"

export function getElapsedMs(
  startedAtMs: number | null,
  completedAtMs: number | null,
  nowMs: number,
): number {
  if (startedAtMs === null) return 0
  return Math.max(0, (completedAtMs ?? nowMs) - startedAtMs)
}

export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1_000)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)
  const clock = [minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
  return hours > 0 ? `${hours}:${clock}` : clock
}

type ElapsedTimeProps = {
  startedAtMs: number | null
  completedAtMs: number | null
  now?: () => number
}

export function ElapsedTime({
  startedAtMs,
  completedAtMs,
  now = Date.now,
}: ElapsedTimeProps) {
  const [nowMs, setNowMs] = useState(() => now())

  useEffect(() => {
    setNowMs(now())
    if (startedAtMs === null || completedAtMs !== null) return

    const timer = window.setInterval(() => setNowMs(now()), 1_000)
    return () => window.clearInterval(timer)
  }, [completedAtMs, now, startedAtMs])

  const elapsedMs = getElapsedMs(startedAtMs, completedAtMs, nowMs)
  const elapsedSeconds = Math.floor(elapsedMs / 1_000)

  return (
    <time aria-label="Elapsed time" dateTime={`PT${elapsedSeconds}S`}>
      {formatElapsedTime(elapsedMs)}
    </time>
  )
}
