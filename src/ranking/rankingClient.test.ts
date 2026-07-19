import { describe, expect, it } from "vitest"
import { localRankingClient } from "./localRankingClient"

describe("localRankingClient", () => {
  it("returns an honest collecting-data placeholder", async () => {
    await expect(
      localRankingClient.getStanding({
        elapsedMs: 42_000,
        level: 1,
        score: 6,
        total: 6,
      }),
    ).resolves.toEqual({ kind: "collecting" })
  })
})
