import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"
import { resolveBuildSha } from "./scripts/build/resolveBuildSha.mjs"

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string }

export default defineConfig({
  // Production is mounted under onsoonlabs.com/nabimd/. Local development
  // remains at / so the existing test and development commands keep working.
  base: process.env.NABI_BASE_PATH?.trim() || "/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_SHA__: JSON.stringify(resolveBuildSha()),
  },
  // Honour PORT so several worktrees of this repo can run their dev servers
  // side by side instead of fighting over 5173.
  server: { port: Number(process.env.PORT) || 5173 },
})
