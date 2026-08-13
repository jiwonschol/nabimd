import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string }

/**
 * The commit this bundle was built from. Production health compares it against
 * the commit it expects to be live, which is the only way to notice that
 * deployments stopped arriving — the app itself keeps working on a stale build.
 *
 * Vercel and GitHub Actions both supply the commit; a local build falls back to
 * the working copy so `npm run build` never fails outside CI.
 */
function resolveBuildSha(): string {
  const fromCi =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.GITHUB_SHA?.trim()
  if (fromCi) return fromCi

  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_SHA__: JSON.stringify(resolveBuildSha()),
  },
  // Honour PORT so several worktrees of this repo can run their dev servers
  // side by side instead of fighting over 5173.
  server: { port: Number(process.env.PORT) || 5173 },
})
