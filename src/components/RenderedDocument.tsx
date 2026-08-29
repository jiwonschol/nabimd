import type { ReactNode } from "react"
import Markdown, { type ExtraProps } from "react-markdown"
import remarkGfm from "remark-gfm"
import { GFM_OPTIONS } from "../markdown/parser"

type RenderedDocumentProps = {
  label: string
  source: string
  emptyMessage?: string
}

/**
 * Teacher's-return corrections, keyed by the source line the missed mark sits
 * on. The values are the note numbers printed beside the line, which are the
 * same numbers the teacher's note uses.
 */
export type LineCorrections = ReadonlyMap<number, readonly number[]>

type RenderedDocumentBodyProps = Pick<
  RenderedDocumentProps,
  "source" | "emptyMessage"
> & {
  corrections?: LineCorrections
}

export function RenderedDocumentBody({
  source,
  emptyMessage,
  corrections,
}: RenderedDocumentBodyProps) {
  // A correction belongs to the smallest block that starts on its line, so a
  // list marks the one item that was missed rather than the whole list.
  const correctionsFor = (node: ExtraProps["node"]): readonly number[] => {
    const line = node?.position?.start.line
    if (line === undefined) return []
    return corrections?.get(line) ?? []
  }

  const withCorrection = (
    node: ExtraProps["node"],
    render: (marked: boolean, marks: ReactNode) => ReactNode,
  ): ReactNode => {
    const numbers = correctionsFor(node)
    if (numbers.length === 0) return render(false, null)
    return render(
      true,
      <span className="rendered-document__correction-numbers">
        {numbers.map((number) => (
          <sup
            className="rendered-document__correction-number"
            key={number}
          >
            <span className="visually-hidden">Correction {number}</span>
            <span aria-hidden="true">{number}</span>
          </sup>
        ))}
      </span>,
    )
  }

  return (
    <div className="rendered-document__body">
      {source ? (
        <Markdown
          remarkPlugins={[[remarkGfm, GFM_OPTIONS]]}
          components={{
            a: ({ children }) => (
              <span className="rendered-document__link">{children}</span>
            ),
            blockquote: ({ children }) => (
              <blockquote className="rendered-document__quote">
                {children}
              </blockquote>
            ),
            img: ({ alt }) => (
              <span className="rendered-document__media-placeholder">
                [Image: {alt || "image"}]
              </span>
            ),
            p: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <p data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </p>
              )),
            li: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <li data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </li>
              )),
            h1: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h1 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h1>
              )),
            h2: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h2 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h2>
              )),
            h3: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h3 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h3>
              )),
            h4: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h4 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h4>
              )),
            h5: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h5 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h5>
              )),
            h6: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <h6 data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </h6>
              )),
            pre: ({ children, node }) =>
              withCorrection(node, (marked, marks) => (
                <pre data-corrected={marked || undefined}>
                  {children}
                  {marks}
                </pre>
              )),
            hr: ({ node }) =>
              withCorrection(node, (marked, marks) => (
                <div
                  className="rendered-document__break"
                  data-corrected={marked || undefined}
                >
                  <hr />
                  {marks}
                </div>
              )),
          }}
        >
          {source}
        </Markdown>
      ) : emptyMessage ? (
        <span className="rendered-document__empty">{emptyMessage}</span>
      ) : null}
    </div>
  )
}

export function RenderedDocument({
  label,
  source,
  emptyMessage,
}: RenderedDocumentProps) {
  return (
    <section aria-label={label} className="rendered-document">
      <header className="document-toolbar">
        <span>{label}</span>
      </header>
      <RenderedDocumentBody emptyMessage={emptyMessage} source={source} />
    </section>
  )
}
