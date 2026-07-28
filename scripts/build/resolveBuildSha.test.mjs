import { describe, expect, it } from "vitest"
import { resolveBuildSha } from "./resolveBuildSha.mjs"

// If this resolver quietly returns "unknown", the production SHA check compares
// a placeholder against a real commit and reports a mismatch forever — or worse,
// a future edit makes it return something truthy and the check passes on any
// build. Both failure modes are silent, so every branch is pinned here.
describe("resolveBuildSha", () => {
  const neverRead = () => {
    throw new Error("git must not be consulted when CI supplies the commit")
  }

  it("prefers the Vercel commit over the Actions commit", () => {
    expect(
      resolveBuildSha({
        env: { VERCEL_GIT_COMMIT_SHA: "vercel-sha", GITHUB_SHA: "actions-sha" },
        readHead: neverRead,
      }),
    ).toBe("vercel-sha")
  })

  it("falls back to the Actions commit", () => {
    expect(
      resolveBuildSha({
        env: { GITHUB_SHA: "actions-sha" },
        readHead: neverRead,
      }),
    ).toBe("actions-sha")
  })

  it("ignores blank CI values rather than publishing an empty commit", () => {
    expect(
      resolveBuildSha({
        env: { VERCEL_GIT_COMMIT_SHA: "   ", GITHUB_SHA: "" },
        readHead: () => "local-sha\n",
      }),
    ).toBe("local-sha")
  })

  it("falls back to the working copy outside CI", () => {
    expect(resolveBuildSha({ env: {}, readHead: () => "local-sha\n" })).toBe(
      "local-sha",
    )
  })

  it("reports unknown when git is unavailable", () => {
    expect(
      resolveBuildSha({
        env: {},
        readHead: () => {
          throw new Error("not a git repository")
        },
      }),
    ).toBe("unknown")
  })

  it("reports unknown when git returns nothing", () => {
    expect(resolveBuildSha({ env: {}, readHead: () => "  \n" })).toBe("unknown")
  })
})
