import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Codex caught this on PR #202, and a sentinel run confirmed it: Playwright
// empties its output directory at the start of every invocation. With both
// checks on the default `test-results`, the freshness run deleted the smoke
// run's screenshots and traces before the upload step ever saw them — so the
// evidence link on a failed health check was empty, which is worst exactly
// when someone is following it.
//
// Reproduced here for the record, at Playwright 1.61.1:
//
//   with --output=test-results/deployment-freshness
//     test-results/production-health/sentinel.txt   survived
//     test-results/loose-sentinel.txt               survived
//   without --output
//     both sentinels gone; only .last-run.json remained
//
// The wipe is real and only the separation stops it, so this guard holds the
// two commands apart rather than trusting the comment.

const WORKFLOW = ".github/workflows/production-health.yml"
const SCRIPTS = ["test:e2e:production", "test:e2e:deployment"]

const packageScripts = JSON.parse(readFileSync("package.json", "utf8")).scripts
const workflow = readFileSync(WORKFLOW, "utf8")

const outputDirOf = (script) =>
  packageScripts[script]?.match(/--output=(\S+)/)?.[1] ?? null

describe("production health artifacts survive both checks", () => {
  it("runs each check in its own Playwright output directory", () => {
    const dirs = SCRIPTS.map(outputDirOf)

    for (const [index, dir] of dirs.entries()) {
      expect(dir, `${SCRIPTS[index]} has no --output`).toBeTruthy()
    }
    expect(new Set(dirs).size, "both checks share one output directory").toBe(
      dirs.length,
    )
  })

  it("uploads a path that contains both output directories", () => {
    const uploaded = workflow.match(/name: production-health-.*\n\s+path: (\S+)/)
    expect(uploaded, "artifact upload path not found").toBeTruthy()
    for (const dir of SCRIPTS.map(outputDirOf)) {
      expect(dir.startsWith(uploaded[1])).toBe(true)
    }
  })

  it("keeps the served-commit receipt out of any Playwright output directory", () => {
    const receipt = workflow.match(/DEPLOYED_SHA_RECEIPT: (\S+)/)?.[1]
    expect(receipt, "DEPLOYED_SHA_RECEIPT not set").toBeTruthy()

    // A receipt written under an output directory is deleted by the next run
    // before the report step reads it, and the report then calls the served
    // commit unknown while the page answered perfectly well.
    for (const dir of SCRIPTS.map(outputDirOf)) {
      expect(receipt.includes(dir)).toBe(false)
    }
    expect(receipt.includes("test-results")).toBe(false)
  })
})
