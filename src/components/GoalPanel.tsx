import { Target } from "lucide-react"
import type { GradableProblem } from "../content/types"
import { RenderedDocumentBody } from "./RenderedDocument"
import { WritingProcessor } from "./WritingProcessor"

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
          <Target size={32} strokeWidth={1.5} />
        </span>
      </header>
      <WritingProcessor
        contentVersion={problem.target}
        label="Goal document"
        mode="read-only"
      >
        <RenderedDocumentBody source={problem.target} />
      </WritingProcessor>
    </section>
  )
}
