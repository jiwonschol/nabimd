import type { GradableProblem } from "../content/types"
import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import { RenderedDocumentBody } from "./RenderedDocument"

type GoalPanelProps = {
  coach: LearningSession["coach"]
  evaluation: Evaluation | null
  hintLevel: LearningSession["hintLevel"]
  problem: GradableProblem
  onNextHint: () => void
}

export function GoalPanel({
  coach,
  evaluation,
  hintLevel,
  problem,
  onNextHint,
}: GoalPanelProps) {
  const hintOpen = coach === "hint"
  const visibleHint = problem.hints[Math.max(0, hintLevel - 1)]

  return (
    <section aria-label="Goal" className="cbt-panel goal-panel">
      <header className="cbt-panel__header">
        <span>Goal</span>
        <span className="cbt-panel__context">Make this document</span>
      </header>
      {hintOpen ? (
        <aside aria-label="Hint" className="goal-hint" id="goal-hint">
          <div aria-label="Markdown pattern" className="syntax-sequence">
            {problem.syntaxTokens.map((token) => (
              <code key={token}>{token}</code>
            ))}
          </div>
          <p>
            {problem.teaching.concept} {problem.teaching.howTo}
          </p>
          {evaluation?.status === "fail" ? (
            <div className="goal-hint__coaching">
              <p>{visibleHint}</p>
              <span>{hintLevel} of 3</span>
              {hintLevel < 3 ? (
                <button className="text-button" onClick={onNextHint} type="button">
                  Next hint
                </button>
              ) : null}
            </div>
          ) : null}
        </aside>
      ) : null}
      <RenderedDocumentBody source={problem.target} />
    </section>
  )
}
