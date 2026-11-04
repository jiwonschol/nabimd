import { useEffect, useState } from "react"
import type { Lang } from "../i18n/text"
import { loadBank } from "./bank"
import type { PracticeItem } from "./practiceItem"

export type BankState =
  | { status: "loading"; lang: Lang }
  | { status: "failed"; lang: Lang }
  | { status: "ready"; lang: Lang; items: readonly PracticeItem[] }

export function useBank(lang: Lang): BankState {
  const [state, setState] = useState<BankState>({ status: "loading", lang })

  useEffect(() => {
    let live = true
    setState((current) =>
      current.lang === lang && current.status === "ready"
        ? current
        : { status: "loading", lang },
    )
    loadBank(lang).then(
      (items) => {
        if (live) setState({ status: "ready", lang, items })
      },
      () => {
        if (live) setState({ status: "failed", lang })
      },
    )
    return () => {
      live = false
    }
  }, [lang])

  // A state left over from the other language is never handed out.
  return state.lang === lang ? state : { status: "loading", lang }
}
