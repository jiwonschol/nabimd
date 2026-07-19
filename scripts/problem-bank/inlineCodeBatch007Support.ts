import { inlineCodeBatch007Fixtures } from "../../src/content/batches/inlineCodeBatch007Fixtures"
import { inlineCodeBatch007Problems } from "../../src/content/batches/inlineCodeBatch007Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const INLINE_CODE_BATCH_007_ID =
  "2026-07-19-l1-l2-inline-code-007"

export const inlineCodeBatch007Config = {
  batchId: INLINE_CODE_BATCH_007_ID,
  sequence: 7,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildInlineCodeBatch007Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: inlineCodeBatch007Config,
    problems: inlineCodeBatch007Problems,
    fixtures: inlineCodeBatch007Fixtures,
  })
}

export function writeInlineCodeBatch007Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildInlineCodeBatch007Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedInlineCodeBatch007({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: inlineCodeBatch007Config,
  })
}

export function checkInlineCodeBatch007State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildInlineCodeBatch007Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedInlineCodeBatch007>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildInlineCodeBatch007Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildInlineCodeBatch007Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedInlineCodeBatch007>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishInlineCodeBatch007Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildInlineCodeBatch007Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
