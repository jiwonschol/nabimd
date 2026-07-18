import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  evaluateBankGate,
  loadBatchDirectories,
  verifyLegacyEvidence,
} from "./batchPipeline.mjs"

const run = promisify(execFile)
const repositoryRoot = process.cwd()
const bankRoot = resolve(repositoryRoot, "curriculum/problem-bank")

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8"))
}

async function resolveBaselineSha(): Promise<string | null> {
  const explicit = process.env.NABI_BASE_SHA?.trim()
  if (explicit && !/^0+$/.test(explicit)) return explicit

  try {
    const { stdout } = await run("git", ["merge-base", "origin/main", "HEAD"], {
      cwd: repositoryRoot,
    })
    const mergeBase = stdout.trim()
    if (mergeBase && mergeBase !== (await run("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot })).stdout.trim()) {
      return mergeBase
    }
  } catch {
    // A local checkout without origin/main falls through to the parent commit.
  }

  try {
    return (await run("git", ["rev-parse", "HEAD^"], { cwd: repositoryRoot })).stdout.trim()
  } catch {
    return null
  }
}

async function readBaselineTracker() {
  const sha = await resolveBaselineSha()
  if (!sha) return null

  const trackerPath = "curriculum/problem-bank/tracker.generated.json"
  const { stdout: trackedPaths } = await run(
    "git",
    ["ls-tree", "--name-only", sha, "--", trackerPath],
    { cwd: repositoryRoot },
  )
  if (!trackedPaths.trim()) return null

  const { stdout } = await run("git", ["show", `${sha}:${trackerPath}`], {
    cwd: repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  })
  return JSON.parse(stdout)
}

const [batches, published, committedTracker, baselineTracker, legacyIndex] =
  await Promise.all([
    loadBatchDirectories(bankRoot),
    readJson(resolve(bankRoot, "runtime-projections.generated.json")),
    readJson(resolve(bankRoot, "tracker.generated.json")),
    readBaselineTracker(),
    readJson(resolve(bankRoot, "legacy/v1-128.index.json")),
  ])

describe("repository-wide problem-bank integrity", () => {
  it("loads every batch and enforces current publication plus append-only history", () => {
    const result = evaluateBankGate({
      batches,
      published,
      committedTracker,
      baselineTracker,
    })
    expect(result.errors).toEqual([])
  })

  it("keeps frozen legacy evidence intact without promoting its counts", async () => {
    expect(await verifyLegacyEvidence({ repositoryRoot, index: legacyIndex })).toEqual([])
  })
})
