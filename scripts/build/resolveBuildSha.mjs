import { execSync } from "node:child_process"

/**
 * The commit a bundle was built from.
 *
 * Production health compares this against the commit it expects to be live,
 * which is the only way to notice that deployments stopped arriving — the app
 * itself keeps working on a stale build.
 *
 * Vercel and GitHub Actions both supply the commit. A local build falls back to
 * the working copy so `npm run build` never fails outside CI, and to the literal
 * "unknown" when even git is unavailable.
 *
 * @param {{ env?: NodeJS.ProcessEnv, readHead?: () => string }} [options]
 */
export function resolveBuildSha({ env = process.env, readHead } = {}) {
  const fromCi = env.VERCEL_GIT_COMMIT_SHA?.trim() || env.GITHUB_SHA?.trim()
  if (fromCi) return fromCi

  const head =
    readHead ?? (() => execSync("git rev-parse HEAD", { encoding: "utf8" }))

  try {
    return head().trim() || "unknown"
  } catch {
    return "unknown"
  }
}
