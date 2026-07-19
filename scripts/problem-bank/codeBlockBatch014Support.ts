import { codeBlockBatch014Fixtures } from "../../src/content/batches/codeBlockBatch014Fixtures"
import { codeBlockBatch014Problems } from "../../src/content/batches/codeBlockBatch014Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const CODE_BLOCK_BATCH_014_ID =
  "2026-07-20-l1-code-block-l2-rebuilds-014"

export const codeBlockBatch014Config = {
  batchId: CODE_BLOCK_BATCH_014_ID,
  sequence: 14,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-20",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildCodeBlockBatch014Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: codeBlockBatch014Config,
    problems: codeBlockBatch014Problems,
    fixtures: codeBlockBatch014Fixtures,
  })
}

export function writeCodeBlockBatch014Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildCodeBlockBatch014Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedCodeBlockBatch014({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: codeBlockBatch014Config,
  })
}

export function checkCodeBlockBatch014State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildCodeBlockBatch014Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedCodeBlockBatch014>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildCodeBlockBatch014Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildCodeBlockBatch014Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedCodeBlockBatch014>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishCodeBlockBatch014Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildCodeBlockBatch014Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
