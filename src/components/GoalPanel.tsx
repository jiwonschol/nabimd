import { Target } from "lucide-react"
import type { GradableProblem } from "../content/types"
import { RenderedDocumentBody } from "./RenderedDocument"

type GoalPanelProps = {
  problem: GradableProblem
}

export function GoalPanel({ problem }: GoalPanelProps) {
  const promptId = `${problem.id}-goal-prompt`
  const lineNumbers = Array.from({ length: 40 }, (_, index) => index + 1)

  return (
    <section
      aria-describedby={promptId}
      aria-label="Goal"
      className="cbt-panel goal-panel writing-sheet"
    >
      <p className="visually-hidden" id={promptId}>
        {problem.prompt}
      </p>
      <header className="cbt-panel__header">
        <span aria-hidden="true" className="panel-icon" title="Goal">
          <Target size={18} strokeWidth={1.6} />
        </span>
      </header>
      <ol aria-hidden="true" className="writing-sheet__line-numbers">
        {lineNumbers.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <RenderedDocumentBody source={problem.target} />
    </section>
  )
}
