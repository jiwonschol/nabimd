import { emphasisBatch003Fixtures } from "../../src/content/batches/emphasisBatch003Fixtures"
import { emphasisBatch003Problems } from "../../src/content/batches/emphasisBatch003Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const EMPHASIS_BATCH_003_ID = "2026-07-19-l1-l2-emphasis-003"

export const emphasisBatch003Config = {
  batchId: EMPHASIS_BATCH_003_ID,
  sequence: 3,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildEmphasisBatch003Artifacts({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: emphasisBatch003Config,
    problems: emphasisBatch003Problems,
    fixtures: emphasisBatch003Fixtures,
  })
}

export function writeEmphasisBatch003Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildEmphasisBatch003Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedEmphasisBatch003({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: emphasisBatch003Config,
  })
}

export function checkEmphasisBatch003State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildEmphasisBatch003Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedEmphasisBatch003>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildEmphasisBatch003Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildEmphasisBatch003Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedEmphasisBatch003>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishEmphasisBatch003Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildEmphasisBatch003Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
