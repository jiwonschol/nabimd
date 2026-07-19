import type { RankingClient } from "./rankingClient"

export const localRankingClient: RankingClient = {
  async getStanding() {
    return { kind: "collecting" }
  },
}
