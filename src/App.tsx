import { EditorialDesk } from "./components/EditorialDesk"
import { useLearningSession } from "./session/useLearningSession"

export function App() {
  const learningSession = useLearningSession()

  return <EditorialDesk {...learningSession} />
}
