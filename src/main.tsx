import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles/global.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

// Published so production health can tell a working app from a working app
// that stopped receiving deployments.
document.documentElement.dataset.buildSha = __BUILD_SHA__

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
