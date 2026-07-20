import { Target } from "lucide-react"
import type { GradableProblem } from "../content/types"
import { RenderedDocumentBody } from "./RenderedDocument"

type GoalPanelProps = {
  problem: GradableProblem
}

export function GoalPanel({ problem }: GoalPanelProps) {
  return (
    <section
      aria-description={problem.prompt}
      aria-label="Goal"
      className="cbt-panel goal-panel"
    >
      <header className="cbt-panel__header">
        <span aria-hidden="true" className="panel-icon" title="Goal">
          <Target size={18} strokeWidth={1.6} />
        </span>
      </header>
      <RenderedDocumentBody source={problem.target} />
    </section>
  )
}
