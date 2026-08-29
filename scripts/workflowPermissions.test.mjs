import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Codex caught this on PR #202: the reporting script reads the commit's Vercel
// status, the workflow declared only `contents: read` and `issues: write`, and
// unlisted permissions are disabled outright. The call would have thrown before
// anything was classified — the rate-limit case would still have been a red
// check with no diagnosis, which is the whole defect the PR set out to remove.
//
// Unit tests could not see it: the permission lives in YAML and the failure
// only happens against the real API. So the guard reads both files and holds
// them to each other.

const WORKFLOW = ".github/workflows/production-health.yml"
const CALLERS = [
  "scripts/reportProductionHealth.mjs",
  "scripts/classifyDeploymentGap.mjs",
]

// Every Octokit namespace this workflow is allowed to reach, and what it costs
// in permissions. A call into a namespace missing from here fails the test
// rather than passing unpriced — being wrong about a new call's permission is
// the failure mode this guard exists for, so it must not default to silence.
const REQUIRED_BY_NAMESPACE = {
  issues: "issues: write",
  repos: "statuses: read",
}

// Needed by actions/checkout regardless of what the scripts call.
const ALWAYS_REQUIRED = ["contents: read"]

function declaredPermissions(source) {
  const lines = source.split("\n")
  const start = lines.findIndex((line) => line === "permissions:")
  if (start === -1) return []
  const declared = []
  for (const line of lines.slice(start + 1)) {
    if (/^\s*#/.test(line)) continue
    // The block ends at the first line that is not indented under it.
    if (!/^\s+\S/.test(line)) break
    declared.push(line.trim())
  }
  return declared
}

function octokitNamespaces(source) {
  return new Set(
    [...source.matchAll(/github\.rest\.([A-Za-z]+)\.([A-Za-z]+)/g)].map(
      (match) => match[1],
    ),
  )
}

describe("production-health workflow permissions", () => {
  const workflow = readFileSync(WORKFLOW, "utf8")
  const declared = declaredPermissions(workflow)

  it("reads the permissions block it is judging", () => {
    // If this ever returns nothing, every assertion below passes vacuously.
    expect(declared.length).toBeGreaterThan(0)
    expect(declared).toContain("contents: read")
  })

  it("declares every permission the reporting scripts spend", () => {
    const namespaces = new Set()
    for (const file of CALLERS) {
      for (const namespace of octokitNamespaces(readFileSync(file, "utf8"))) {
        namespaces.add(namespace)
      }
    }

    // The scripts must actually call something, or this test proves nothing.
    expect(namespaces.size).toBeGreaterThan(0)

    const unpriced = [...namespaces].filter(
      (namespace) => !(namespace in REQUIRED_BY_NAMESPACE),
    )
    expect(
      unpriced,
      `github.rest.${unpriced.join(", ")} has no permission mapped. Add it to ` +
        "REQUIRED_BY_NAMESPACE and to the workflow, rather than assuming the " +
        "token already carries it.",
    ).toEqual([])

    const required = [
      ...ALWAYS_REQUIRED,
      ...[...namespaces].map((namespace) => REQUIRED_BY_NAMESPACE[namespace]),
    ]
    for (const permission of required) {
      expect(declared, `workflow is missing \`${permission}\``).toContain(
        permission,
      )
    }
  })

  it("names statuses: read specifically, since that is the one that was missing", () => {
    expect(declared).toContain("statuses: read")
    // And the scripts still read a commit status — if that call goes away the
    // permission should go with it rather than linger as cargo.
    const callers = CALLERS.map((file) => readFileSync(file, "utf8")).join("\n")
    expect(callers).toContain("getCombinedStatusForRef")
  })
})
