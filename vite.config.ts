import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // Honour PORT so several worktrees of this repo can run their dev servers
  // side by side instead of fighting over 5173.
  server: { port: Number(process.env.PORT) || 5173 },
})
