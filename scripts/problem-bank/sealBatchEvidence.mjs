import { readdir, readFile, writeFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { basename, dirname, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import {
  buildPublishedBatchArtifacts,
  loadBatchDirectories,
  publishedBatchHistory,
  sealEditorial,
  sealReview,
} from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

const run = promisify(execFile)

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
  const published = publishedBatchHistory(
    projected.filter((batch) => batch.editorial !== null && batch.editorial !== undefined),
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
    if (currentBatch.normalized.sequence < targetSequence) continue
    if (currentBatch.summary === null || currentBatch.summary === undefined) continue
    if (canonicalJson(artifacts.summary) === canonicalJson(currentBatch.summary)) continue
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
  for (const [name, expected] of [
    ["runtime-projections.generated.json", finalArtifacts.runtimeProjections],
    ["tracker.generated.json", finalArtifacts.tracker],
  ]) {
    const path = resolve(bankRoot, name)
    const committed = JSON.parse(await readFile(path, "utf8"))
    if (canonicalJson(expected) === canonicalJson(committed)) continue
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
  const sealed = []
  for (const batchDir of batchDirs) {
    sealed.push({ batchDir, ...(await resealOneBatch({ batchDir, write })) })
  }

  const changedBatches = sealed.filter(({ report }) => report.changed.length > 0)
  if (changedBatches.length > 0) {
    const projectedBatches = new Map(
      sealed.map(({ batchDir, projectedBatch }) => [
        basename(batchDir),
        projectedBatch,
      ]),
    )
    const generated = await updatePublishedChain({
      batchDirs: changedBatches.map(({ batchDir }) => batchDir),
      projectedBatches,
      write,
    })
    changedBatches[0].report.changed.push(...generated)
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

export async function resolveBaselineSha(cwd = process.cwd()) {
  const explicit = process.env.NABI_BASE_SHA?.trim()
  if (explicit && !/^0+$/.test(explicit)) return explicit

  try {
    const baseline = (
      await run("git", ["merge-base", "origin/main", "HEAD"], {
        cwd,
      })
    ).stdout.trim()
    if (baseline) return baseline
  } catch {
    // A checkout without origin/main falls through to its parent commit.
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

  const protectedTargets = []
  for (const batchDir of targets) {
    const repositoryPath = relative(process.cwd(), batchDir)
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

  if (!check) {
    const protectedTargets = await immutableBaselineTargets(targets)
    if (args.length > 0 && protectedTargets.size > 0) {
      throw new Error(
        "Refusing to reseal immutable baseline batches; publish a new replacement batch instead:\n" +
          [...protectedTargets].map((target) => `- ${target}`).join("\n"),
      )
    }
    targets = targets.filter(
      (batchDir) => !protectedTargets.has(relative(process.cwd(), batchDir)),
    )
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
