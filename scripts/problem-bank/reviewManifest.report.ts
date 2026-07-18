import { describe, expect, it } from "vitest"
import { buildGateInput } from "./gateSupport"

describe("independent review manifest", () => {
  it("prints the exact content and fixture digests", async () => {
    const { reviewManifest, reviewManifestIsCurrent } = await buildGateInput()
    console.log(
      "Computed the current real-engine review manifest; this test verifies the committed file matches it.",
    )
    console.log(JSON.stringify(reviewManifest, null, 2))
    expect(reviewManifest).toHaveLength(16)
    expect(reviewManifestIsCurrent).toBe(true)
    expect(
      reviewManifest.every(
        (item) => item.candidateDigest && item.fixtureResultsDigest,
      ),
    ).toBe(true)
  })
})
