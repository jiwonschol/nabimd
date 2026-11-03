export type RedesignVariant = "a" | "b" | "c"

export const REDESIGN_VARIANTS: readonly RedesignVariant[] = ["a", "b", "c"]

/**
 * `?variant=a|b|c` opens the Level 1 redesign candidate instead of the old
 * app. The branch exists only for the design round (plan §4.8); WS2 removes
 * it together with the two candidates Jiwon did not choose.
 */
export function readRedesignVariant(search: string): RedesignVariant | null {
  const value = new URLSearchParams(search).get("variant")?.toLowerCase()
  return value === "a" || value === "b" || value === "c" ? value : null
}

/** `?doc=0..2` picks which of the three Korean sample documents opens first. */
export function readSampleIndex(search: string): number {
  const value = Number(new URLSearchParams(search).get("doc"))
  return Number.isInteger(value) && value >= 0 ? value : 0
}
