export const PAGE_TURN_DURATION_MS = 720
export const PROBLEM_TRANSITION_DURATION_MS = 250
export const VERDICT_BEAT_DURATION_MS = 900
export const REDUCED_MOTION_DURATION_MS = 120

export function getMotionDuration(defaultDurationMs: number) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return defaultDurationMs
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? REDUCED_MOTION_DURATION_MS
    : defaultDurationMs
}
