import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const packageJson = JSON.parse(
  await readFile("package.json", "utf8"),
)

describe("Cloudflare deployment", () => {
  it("applies the feedback database migration before deploying its consumers", () => {
    const command = packageJson.scripts["deploy:cloudflare"]
    const migrate = command.indexOf(
      "wrangler d1 migrations apply NABIMD_DB --remote",
    )
    const build = command.indexOf("npm run build:cloudflare")
    const deploy = command.indexOf("wrangler deploy")
    const requireBuildSha = command.indexOf(
      "${NABI_BUILD_SHA:?Set NABI_BUILD_SHA}",
    )

    expect(requireBuildSha).toBeGreaterThanOrEqual(0)
    expect(build).toBeGreaterThanOrEqual(requireBuildSha)
    expect(migrate).toBeGreaterThanOrEqual(0)
    expect(migrate).toBeGreaterThan(build)
    expect(deploy).toBeGreaterThan(migrate)
  })
})
