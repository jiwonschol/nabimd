import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolveBuildSha } from "./scripts/build/resolveBuildSha.mjs"

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(resolveBuildSha()),
  },
  // Honour PORT so several worktrees of this repo can run their dev servers
  // side by side instead of fighting over 5173.
  server: { port: Number(process.env.PORT) || 5173 },
})
