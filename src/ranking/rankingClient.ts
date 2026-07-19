import type { CurriculumLevel } from "../content/types"

export type RankingQuery = {
  level: CurriculumLevel
  score: number
  total: number
  elapsedMs: number
}

export type RankingStanding =
  | { kind: "collecting" }
  | {
      kind: "percentile"
      topPercent: number
      sampleSize?: number
    }

export type RankingClient = {
  getStanding(query: RankingQuery): Promise<RankingStanding>
}
