import {
  type ChangeSpec,
  EditorState,
  type Extension,
  Transaction,
} from "@codemirror/state"

const WON_SIGN = "₩"

/**
 * macOS Korean input sources type ₩ on the backtick key, which would lock
 * Korean learners out of every inline code and fence. The won sign is never
 * a Markdown mark, so typed or pasted input normalizes it to a backtick.
 *
 * The replacement keeps the same length, so the transaction's own selection
 * and effects still apply unchanged. IME composition transactions are left
 * alone: Hangul never composes into ₩, and rewriting mid-composition would
 * desynchronize the browser's composition state.
 */
export function wonSignToBacktick(): Extension {
  return EditorState.transactionFilter.of((transaction) => {
    if (
      !transaction.docChanged ||
      !transaction.isUserEvent("input") ||
      transaction.isUserEvent("input.type.compose")
    ) {
      return transaction
    }

    let touched = false
    const changes: ChangeSpec[] = []
    transaction.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
      const text = inserted.toString()
      if (text.includes(WON_SIGN)) touched = true
      changes.push({
        from: fromA,
        to: toA,
        insert: text.replaceAll(WON_SIGN, "`"),
      })
    })
    if (!touched) return transaction

    const userEvent = transaction.annotation(Transaction.userEvent)
    return {
      changes,
      selection: transaction.selection,
      effects: transaction.effects,
      scrollIntoView: transaction.scrollIntoView,
      ...(userEvent ? { userEvent } : {}),
    }
  })
}
