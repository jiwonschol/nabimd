import { developmentSpecBatch012Fixtures } from "../../src/content/batches/developmentSpecBatch012Fixtures"
import {
  developmentSpecBatch012Id,
  developmentSpecBatch012Problems,
} from "../../src/content/batches/developmentSpecBatch012Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const developmentSpecBatch012Config = {
  batchId: developmentSpecBatch012Id,
  sequence: 12,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildDevelopmentSpecBatch012Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: developmentSpecBatch012Config,
    problems: developmentSpecBatch012Problems,
    fixtures: developmentSpecBatch012Fixtures,
  })
}

export function writeDevelopmentSpecBatch012Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildDevelopmentSpecBatch012Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedDevelopmentSpecBatch012({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: developmentSpecBatch012Config,
  })
}

export function checkDevelopmentSpecBatch012State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildDevelopmentSpecBatch012Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedDevelopmentSpecBatch012>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildDevelopmentSpecBatch012Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildDevelopmentSpecBatch012Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedDevelopmentSpecBatch012>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishDevelopmentSpecBatch012Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildDevelopmentSpecBatch012Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
