import { readdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { sealEditorial, sealReview } from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

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
export async function resealBatchEvidence({ batchDir, write = false }) {
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
    const sealed = sealEditorial(editorial, sealedReviews)
    if (canonicalJson(sealed) !== canonicalJson(editorial)) {
      changed.push("editorial.json")
      if (write) {
        await writeFile(editorialPath, `${JSON.stringify(sealed, null, 2)}\n`)
      }
    }
  }

  return { reviewCount: reviewNames.length, hasEditorial: editorial !== null, changed }
}

export async function listBatchDirectories(bankRoot) {
  const entries = await readdir(bankRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(bankRoot, entry.name))
    .sort()
}

export const DEFAULT_BANK_ROOT = "curriculum/problem-bank/batches"

async function main(argv) {
  const args = argv.filter((value) => value !== "--check")
  const check = argv.includes("--check")
  const targets = args.length > 0
    ? args.map((value) => resolve(process.cwd(), value))
    : await listBatchDirectories(resolve(process.cwd(), DEFAULT_BANK_ROOT))

  const drifted = []
  for (const batchDir of targets) {
    const report = await resealBatchEvidence({ batchDir, write: !check })
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
