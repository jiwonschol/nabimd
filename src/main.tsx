import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { startErrorMonitoring } from "./monitoring/errorMonitoring"
import "./styles/global.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

// Published so production health can tell a working app from a working app
// that stopped receiving deployments.
document.documentElement.dataset.buildSha = __BUILD_SHA__

// Started before the first render so a crash during boot is still reported;
// the SDK loads in its own chunk, so this never delays paint.
void startErrorMonitoring()

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
