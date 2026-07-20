import { Target } from "lucide-react"
import type { GradableProblem } from "../content/types"
import { RenderedDocumentBody } from "./RenderedDocument"

type GoalPanelProps = {
  problem: GradableProblem
}

export function GoalPanel({ problem }: GoalPanelProps) {
  const promptId = `${problem.id}-goal-prompt`

  return (
    <section
      aria-describedby={promptId}
      aria-label="Goal"
      className="cbt-panel goal-panel"
    >
      <p className="visually-hidden" id={promptId}>
        {problem.prompt}
      </p>
      <header className="cbt-panel__header">
        <span aria-hidden="true" className="panel-icon" title="Goal">
          <Target size={18} strokeWidth={1.6} />
        </span>
      </header>
      <RenderedDocumentBody source={problem.target} />
    </section>
  )
}
