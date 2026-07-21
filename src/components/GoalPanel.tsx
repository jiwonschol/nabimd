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
      <header className="cbt-panel__header">
        <p className="goal-panel__instruction" id={promptId}>
          {problem.prompt}
        </p>
      </header>
      <WritingProcessor
        key={problem.id}
        label="Goal document"
        mode="read-only"
      >
        <RenderedDocumentBody source={problem.target} />
      </WritingProcessor>
    </section>
  )
}
