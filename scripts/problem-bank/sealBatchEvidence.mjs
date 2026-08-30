import { readdir, readFile, writeFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { basename, dirname, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import {
  buildPublishedBatchArtifacts,
  evaluateBatchEvidence,
  loadBatchDirectories,
  publishedBatchHistory,
  sealEditorial,
  sealReview,
} from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

const run = promisify(execFile)

export function repositoryRelativePath(path, cwd = process.cwd(), relativePath = relative) {
  return relativePath(cwd, path).replaceAll("\\", "/")
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function updatePublishedChain({ batchDirs, projectedBatches, write }) {
  const bankRoot = dirname(dirname(batchDirs[0]))
  const targetBatchIds = new Set(batchDirs.map((batchDir) => basename(batchDir)))
  const loaded = await loadBatchDirectories(bankRoot)
  const targets = loaded.filter((batch) =>
    targetBatchIds.has(batch.normalized?.batchId),
  )
  if (targets.length === 0) return []

  const projected = loaded.map((batch) => {
    const replacement = projectedBatches.get(batch.normalized?.batchId)
    return replacement ? { ...batch, ...replacement } : batch
  })
  const trackerPath = resolve(bankRoot, "tracker.generated.json")
  let committedTracker = null
  try {
    committedTracker = JSON.parse(await readFile(trackerPath, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const trackedBatchIds = new Set(
    (committedTracker?.batches ?? []).map((batch) => batch.batchId),
  )
  const missingPublishedEditorial = projected.filter(
    (batch) =>
      (batch.summary?.status === "published" ||
        trackedBatchIds.has(batch.normalized?.batchId)) &&
      batch.editorial == null,
  )
  if (missingPublishedEditorial.length > 0) {
    throw new Error(
      `Cannot rebuild published evidence with missing editorial artifacts:\n${missingPublishedEditorial
        .map((batch) => `- ${batch.normalized?.batchId ?? "<unknown>"}`)
        .join("\n")}`,
    )
  }
  const targetEvidenceErrors = projected
    .filter((batch) => targetBatchIds.has(batch.normalized?.batchId))
    .filter((batch) => (batch.reviews?.length ?? 0) > 0 || batch.editorial != null)
    .flatMap((batch) => {
      const errors = evaluateBatchEvidence(batch).errors
      if (batch.editorial != null) return errors
      return errors.filter(
        (error) =>
          !error.startsWith("Editorial artifact is invalid:") &&
          !error.startsWith("Invalid editorial schema:") &&
          !error.startsWith("Stale editorial scope:") &&
          !error.startsWith("Stale editorial digest:") &&
          !error.startsWith("Editorial actor") &&
          !error.startsWith("Missing editorial decision:"),
      )
    })
  if (targetEvidenceErrors.length > 0) {
    throw new Error(
      `Cannot reseal invalid target evidence:\n${targetEvidenceErrors.join("\n")}`,
    )
  }
  const publishedFromSummaries = publishedBatchHistory(
    projected.filter((batch) => batch.editorial !== null && batch.editorial !== undefined),
  )
  const lastPublishedSequence = Math.max(
    0,
    ...publishedFromSummaries.map((batch) => batch.normalized.sequence),
    ...projected
      .filter((batch) => trackedBatchIds.has(batch.normalized?.batchId))
      .map((batch) => batch.normalized?.sequence ?? 0),
  )
  const published = projected.filter(
    (batch) =>
      batch.editorial !== null &&
      batch.editorial !== undefined &&
      (batch.normalized?.sequence ?? Number.MAX_SAFE_INTEGER) <= lastPublishedSequence,
  ).sort(
    (left, right) =>
      left.normalized.sequence - right.normalized.sequence ||
      left.normalized.batchId.localeCompare(right.normalized.batchId),
  )
  if (!published.some((batch) => targetBatchIds.has(batch.normalized.batchId))) {
    return []
  }
  const targetSequence = Math.min(...targets.map((batch) => batch.normalized.sequence))
  const changed = []
  let finalArtifacts = null
  for (let index = 0; index < published.length; index += 1) {
    const currentBatch = published[index]
    const artifacts = buildPublishedBatchArtifacts({
      batches: published.slice(0, index + 1),
      currentBatch,
    })
    if (artifacts.errors.length > 0) {
      throw new Error(
        `Cannot rebuild published evidence after resealing ${[...targetBatchIds].join(", ")}:\n${artifacts.errors.join("\n")}`,
      )
    }
    finalArtifacts = artifacts
    const summaryMissing = currentBatch.summary === null || currentBatch.summary === undefined
    const missingPublishedSummary = summaryMissing && artifacts.summary.accepted > 0
    if (currentBatch.normalized.sequence < targetSequence && !missingPublishedSummary) continue
    if (summaryMissing && !missingPublishedSummary) continue
    if (!summaryMissing && canonicalJson(artifacts.summary) === canonicalJson(currentBatch.summary)) continue
    const relative = `${currentBatch.normalized.batchId}/summary.generated.json`
    changed.push(relative)
    if (write) {
      await writeFile(
        resolve(bankRoot, "batches", relative),
        prettyJson(artifacts.summary),
      )
    }
  }

  if (finalArtifacts === null) return changed
  for (const [name, expected, committed] of [
    ["runtime-projections.generated.json", finalArtifacts.runtimeProjections, null],
    ["tracker.generated.json", finalArtifacts.tracker, committedTracker],
  ]) {
    const path = resolve(bankRoot, name)
    let current = committed
    if (current === null) {
      try {
        current = JSON.parse(await readFile(path, "utf8"))
      } catch (error) {
        if (error.code !== "ENOENT") throw error
      }
    }
    if (current !== null && canonicalJson(expected) === canonicalJson(current)) continue
    changed.push(name)
    if (write) await writeFile(path, prettyJson(expected))
  }
  return changed
}

/**
 * Re-derive the seals a batch's evidence carries.
 *
 * `sealReview` and `sealEditorial` existed, but nothing called them on a
 * committed batch: `writeAuthoredBatchArtifacts` stops before the review
 * stage, so both seals were closed by hand. A reviewer correcting one field in
 * their own artifact had to keep hand-adjusting digests until the chain lined
 * up — and one of those hand steps lands in someone else's sealed file, which
 * is the exact action sealing exists to make visible (#195). Two throwaway
 * scripts in `scripts/` were built for one reviewer on one batch, with the
 * review body inlined as source; this replaces both.
 *
 * The editorial seal cites review digests, so reviews are resealed first.
 *
 * A file is only written when its canonical content actually changes. Seal
 * order is not canonical order — `sealEditorial` moves the digest fields to
 * the end — so rewriting an unchanged batch would reorder keys in four of the
 * committed batches for no reason. Touching sealed files nobody asked to
 * change is the cost this tool exists to remove.
 */
async function resealOneBatch({ batchDir, write }) {
  const reviewsDir = resolve(batchDir, "reviews")
  let reviewNames = []
  try {
    reviewNames = (await readdir(reviewsDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  const changed = []
  const sealedReviews = []
  for (const name of reviewNames) {
    const path = resolve(reviewsDir, name)
    const committed = JSON.parse(await readFile(path, "utf8"))
    const sealed = sealReview(committed)
    sealedReviews.push(sealed)
    if (canonicalJson(sealed) === canonicalJson(committed)) continue
    changed.push(`reviews/${name}`)
    if (write) await writeFile(path, `${JSON.stringify(sealed, null, 2)}\n`)
  }

  const editorialPath = resolve(batchDir, "editorial.json")
  let editorial = null
  try {
    editorial = JSON.parse(await readFile(editorialPath, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  if (editorial !== null) {
    const sealedEditorial = sealEditorial(editorial, sealedReviews)
    if (canonicalJson(sealedEditorial) !== canonicalJson(editorial)) {
      changed.push("editorial.json")
      if (write) {
        await writeFile(editorialPath, prettyJson(sealedEditorial))
      }
    }
    editorial = sealedEditorial
  }

  return {
    report: {
      reviewCount: reviewNames.length,
      hasEditorial: editorial !== null,
      changed,
    },
    projectedBatch: { reviews: sealedReviews, editorial },
  }
}

export async function resealBatchEvidenceSet({ batchDirs, write = false }) {
  const bankRoots = new Set(
    batchDirs.map((batchDir) => resolve(dirname(dirname(batchDir)))),
  )
  if (bankRoots.size > 1) {
    throw new Error("Cannot reseal batches from different problem-bank roots together.")
  }

  if (write && batchDirs.length > 0) {
    const bankRoot = dirname(dirname(batchDirs[0]))
    const loaded = await loadBatchDirectories(bankRoot)
    const loaderErrors = loaded.flatMap((batch) => batch.loaderErrors ?? [])
    if (loaderErrors.length > 0) {
      throw new Error(
        `Cannot reseal while the problem bank is unreadable:\n${loaderErrors.join("\n")}`,
      )
    }
  }

  const sealed = []
  for (const batchDir of batchDirs) {
    sealed.push({ batchDir, ...(await resealOneBatch({ batchDir, write: false })) })
  }

  if (sealed.length > 0) {
    const projectedBatches = new Map(
      sealed.map(({ batchDir, projectedBatch }) => [
        basename(batchDir),
        projectedBatch,
      ]),
    )
    const generated = await updatePublishedChain({
      batchDirs: sealed.map(({ batchDir }) => batchDir),
      projectedBatches,
      write: false,
    })
    sealed[0].report.changed.push(...generated)

    if (write) {
      for (const { batchDir } of sealed) {
        await resealOneBatch({ batchDir, write: true })
      }
      await updatePublishedChain({
        batchDirs: sealed.map(({ batchDir }) => batchDir),
        projectedBatches,
        write: true,
      })
    }
  }

  return sealed.map(({ batchDir, report }) => ({ batchDir, ...report }))
}

export async function resealBatchEvidence({ batchDir, write = false }) {
  const [report] = await resealBatchEvidenceSet({ batchDirs: [batchDir], write })
  return report
}

export async function listBatchDirectories(bankRoot) {
  const entries = await readdir(bankRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(bankRoot, entry.name))
    .sort()
}

export const DEFAULT_BANK_ROOT = "curriculum/problem-bank/batches"

async function assertTrackedBatchDirectoriesExist(batchDirs) {
  if (batchDirs.length === 0) return
  const bankRoot = dirname(dirname(batchDirs[0]))
  let tracker
  try {
    tracker = JSON.parse(
      await readFile(resolve(bankRoot, "tracker.generated.json"), "utf8"),
    )
  } catch (error) {
    if (error.code === "ENOENT") return
    throw error
  }
  const directoryIds = new Set(batchDirs.map((batchDir) => basename(batchDir)))
  const missing = (tracker.batches ?? [])
    .map((batch) => batch.batchId)
    .filter((batchId) => !directoryIds.has(batchId))
  if (missing.length > 0) {
    throw new Error(
      "Tracker-recorded batch directories are missing; refusing to shrink the published chain:\n" +
        missing.map((batchId) => `- ${batchId}`).join("\n"),
    )
  }
}

export async function resolveBaselineSha(
  cwd = process.cwd(),
  explicitBaseSha = process.env.NABI_BASE_SHA,
) {
  const explicit = explicitBaseSha?.trim()
  if (explicit && !/^0+$/.test(explicit)) return explicit

  const candidates = []
  const head = (await run("git", ["rev-parse", "HEAD"], { cwd })).stdout.trim()
  let mainRefAtHead = false
  for (const mainRef of ["origin/main", "main"]) {
    try {
      const baseline = (
        await run("git", ["merge-base", mainRef, "HEAD"], { cwd })
      ).stdout.trim()
      if (baseline === head) {
        mainRefAtHead = true
      } else if (baseline && !candidates.includes(baseline)) {
        candidates.push(baseline)
      }
    } catch {
      // Try the next stable main ref before falling back to the parent commit.
    }
  }
  if (mainRefAtHead) {
    try {
      return (await run("git", ["rev-parse", "HEAD^"], { cwd })).stdout.trim()
    } catch {
      return null
    }
  }
  if (candidates.length > 0) {
    for (let left = 0; left < candidates.length; left += 1) {
      for (let right = left + 1; right < candidates.length; right += 1) {
        const [leftContainsRight, rightContainsLeft] = await Promise.all(
          [
            [candidates[left], candidates[right]],
            [candidates[right], candidates[left]],
          ].map(async ([ancestor, descendant]) => {
            try {
              await run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
                cwd,
              })
              return true
            } catch (error) {
              if (error.code === 1) return false
              throw error
            }
          }),
        )
        if (!leftContainsRight && !rightContainsLeft) {
          throw new Error(
            "Local and remote main baselines have diverged; refusing to choose an incomplete immutable baseline.",
          )
        }
      }
    }
    const distances = await Promise.all(
      candidates.map(async (candidate) => ({
        candidate,
        distance: Number(
          (await run("git", ["rev-list", "--count", `${candidate}..HEAD`], { cwd }))
            .stdout.trim(),
        ),
      })),
    )
    distances.sort((left, right) => left.distance - right.distance)
    return distances[0].candidate
  }

  try {
    return (await run("git", ["rev-parse", "HEAD^"], { cwd })).stdout.trim()
  } catch {
    return null
  }
}

async function immutableBaselineTargets(targets) {
  const baseline = await resolveBaselineSha()
  if (!baseline) {
    throw new Error(
      "Cannot identify an immutable baseline; refusing to write sealed evidence.",
    )
  }
  try {
    await run("git", ["cat-file", "-e", `${baseline}^{commit}`], {
      cwd: process.cwd(),
    })
  } catch {
    throw new Error(
      `Immutable baseline ${baseline} is not a locally available commit; refusing to write sealed evidence.`,
    )
  }

  const protectedTargets = []
  for (const batchDir of targets) {
    const repositoryPath = repositoryRelativePath(batchDir)
    try {
      await run("git", ["cat-file", "-e", `${baseline}:${repositoryPath}`], {
        cwd: process.cwd(),
      })
      protectedTargets.push(repositoryPath)
    } catch (error) {
      if (error.code !== 128) throw error
    }
  }
  return new Set(protectedTargets)
}

async function main(argv) {
  const args = argv.filter((value) => value !== "--check")
  const check = argv.includes("--check")
  let targets = args.length > 0
    ? args.map((value) => resolve(process.cwd(), value))
    : await listBatchDirectories(resolve(process.cwd(), DEFAULT_BANK_ROOT))

  if (args.length === 0) await assertTrackedBatchDirectoriesExist(targets)

  if (args.length > 0) {
    const missing = []
    for (const target of targets) {
      const bankRoot = dirname(dirname(target))
      const loaded = await loadBatchDirectories(bankRoot)
      const matched = loaded.some(
        (batch) =>
          batch.normalized?.batchId === basename(target) &&
          resolve(bankRoot, "batches", batch.normalized.batchId) === target,
      )
      if (!matched) missing.push(target)
    }
    if (missing.length > 0) {
      throw new Error(
        "Explicit evidence target is not a loaded problem-bank batch:\n" +
          missing.map((target) => `- ${target}`).join("\n"),
      )
    }
  }

  if (!check) {
    const protectedTargets = await immutableBaselineTargets(targets)
    if (args.length > 0 && protectedTargets.size > 0) {
      throw new Error(
        "Refusing to reseal immutable baseline batches; publish a new replacement batch instead:\n" +
          [...protectedTargets].map((target) => `- ${target}`).join("\n"),
      )
    }
    if (args.length === 0 && protectedTargets.size > 0) {
      const protectedDirs = targets.filter((batchDir) =>
        protectedTargets.has(repositoryRelativePath(batchDir)),
      )
      const protectedReports = await resealBatchEvidenceSet({
        batchDirs: protectedDirs,
        write: false,
      })
      const driftedProtected = protectedReports.filter((report) =>
        report.changed.some(
          (name) => name === "editorial.json" || name.startsWith("reviews/"),
        ),
      )
      if (driftedProtected.length > 0) {
        throw new Error(
          "Immutable baseline evidence has drifted; publish a new replacement batch instead:\n" +
            driftedProtected.map((report) => `- ${report.batchDir}`).join("\n"),
        )
      }
    }
  }

  const drifted = []
  const reports = await resealBatchEvidenceSet({ batchDirs: targets, write: !check })
  for (const { batchDir, ...report } of reports) {
    if (report.changed.length === 0) continue
    drifted.push({ batchDir, changed: report.changed })
  }

  if (drifted.length === 0) {
    console.log(`Seals reproduce from content across ${targets.length} batch(es).`)
    return 0
  }

  for (const { batchDir, changed } of drifted) {
    console.log(`${check ? "DRIFT" : "resealed"} ${batchDir}`)
    for (const name of changed) console.log(`    ${name}`)
  }
  if (!check) return 0
  console.log(
    "\nA seal no longer matches the content it covers. Run" +
      " `npm run bank:evidence:reseal` and commit the result rather than" +
      " adjusting digests by hand.",
  )
  return 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await main(process.argv.slice(2))
}
