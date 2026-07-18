import { describe, expect, it } from "vitest"
import { buildGateInput } from "./gateSupport"

describe("independent review manifest", () => {
  it("prints the exact content and fixture digests", async () => {
    const { reviewManifest } = await buildGateInput()
    console.log(JSON.stringify(reviewManifest, null, 2))
    expect(reviewManifest).toHaveLength(16)
    expect(
      reviewManifest.every(
        (item) => item.candidateDigest && item.fixtureResultsDigest,
      ),
    ).toBe(true)
  })
})
