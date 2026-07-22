import type { GradableProblem } from "../content/types"
import { WordProcessorPage } from "./WordProcessorPage"

type GoalPanelProps = {
  activeOffset?: number
  problem: GradableProblem
}

export function GoalPanel({ activeOffset, problem }: GoalPanelProps) {
  const promptId = `${problem.id}-goal-prompt`
  const leadingBlankRows = (problem.level ?? 1) <= 2 ? 2 : 0

  return (
    <section
      aria-describedby={promptId}
      aria-label="Goal"
      className="cbt-panel goal-panel"
    >
      <header className="cbt-panel__header">
        <h2 className="goal-panel__instruction" id={promptId}>
          {problem.prompt}
        </h2>
      </header>
      <WordProcessorPage
        activeOffset={activeOffset}
        focusTreatment={activeOffset === undefined ? undefined : "goal"}
        key={problem.id}
        label="Goal document"
        leadingBlankRows={leadingBlankRows}
        presentation="rendered"
        value={problem.target}
      />
    </section>
  )
}
