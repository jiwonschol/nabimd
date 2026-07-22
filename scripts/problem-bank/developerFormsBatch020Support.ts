import { pathToFileURL } from "node:url"
import { developerFormsBatch020Fixtures } from "../../src/content/batches/developerFormsBatch020Fixtures"
import {
  developerFormsBatch020Id,
  developerFormsBatch020Problems,
} from "../../src/content/batches/developerFormsBatch020Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const developerFormsBatch020Config = {
  batchId: developerFormsBatch020Id,
  sequence: 20,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-22",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildDeveloperFormsBatch020Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: developerFormsBatch020Config,
    problems: developerFormsBatch020Problems,
    fixtures: developerFormsBatch020Fixtures,
  })
}

export function writeDeveloperFormsBatch020Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildDeveloperFormsBatch020Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedDeveloperFormsBatch020({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: developerFormsBatch020Config,
  })
}

export function checkDeveloperFormsBatch020State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildDeveloperFormsBatch020Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedDeveloperFormsBatch020>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildDeveloperFormsBatch020Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildDeveloperFormsBatch020Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedDeveloperFormsBatch020>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishDeveloperFormsBatch020Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildDeveloperFormsBatch020Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}

async function main() {
  const action = process.argv[2]
  if (action !== "prepare" && action !== "publish") {
    throw new Error("Usage: developerFormsBatch020Support.ts <prepare|publish>")
  }
  const repositoryRoot = process.cwd()
  const computed = await buildDeveloperFormsBatch020Artifacts({ repositoryRoot })
  if (action === "prepare") {
    await writeDeveloperFormsBatch020Artifacts({ repositoryRoot, computed })
    return
  }
  await publishDeveloperFormsBatch020Artifacts({ repositoryRoot, computed })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main()
}
