import { EditorialDesk } from "./components/EditorialDesk"
import { entryChoices } from "./content/entryChoices"
import { useLearningSession } from "./session/useLearningSession"

export function App() {
  const learningSession = useLearningSession()

  if (!learningSession.session.entryId) {
    return (
      <main className="app-shell greeting-shell">
        <section className="greeting" aria-labelledby="greeting-title">
          <h1 className="wordmark">Nabi Markdown</h1>
          <h2 id="greeting-title">Welcome. Choose where to begin.</h2>
          <p>Practice the heading track at the pace that fits you.</p>
          <div className="greeting__choices">
            {entryChoices.map((entry) => (
              <button
                className="greeting__choice"
                key={entry.id}
                onClick={() => {
                  learningSession.start(entry.id)
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return <EditorialDesk {...learningSession} />
}
