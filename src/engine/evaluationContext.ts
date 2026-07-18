import type { Root, RootContent } from "mdast"
import type { CheckScope } from "../content/types"
import { headingsAtLevel, parseMarkdown } from "./markdownAst"
import { createSectionIndex, type MarkdownSection } from "./sectionIndex"

export type AstNode = {
  type: string
  children?: readonly AstNode[]
}

export type EvaluationContext = {
  source: string
  root: Root
  blocks: readonly RootContent[]
  sections: readonly MarkdownSection[]
  headings: readonly ReturnType<typeof headingsAtLevel>[number][]
  lineCount: number
  sourceCharacterCount: number
}

export function createEvaluationContext(source: string): EvaluationContext {
  const root = parseMarkdown(source)
  const headings = ([1, 2, 3, 4, 5, 6] as const).flatMap((depth) =>
    headingsAtLevel(root, depth),
  ).sort(
    (left, right) =>
      (left.position?.start.offset ?? 0) - (right.position?.start.offset ?? 0),
  )

  return {
    source,
    root,
    blocks: root.children,
    sections: createSectionIndex(root.children),
    headings,
    lineCount: source.length === 0 ? 0 : source.split(/\r?\n/).length,
    sourceCharacterCount: source.length,
  }
}

export function nodesInScope(
  context: EvaluationContext,
  scope: CheckScope,
): readonly RootContent[] {
  if (scope.kind === "document") return context.blocks

  return context.sections.find(
    (section) =>
      section.headingDepth === scope.headingDepth &&
      section.occurrence === scope.occurrence,
  )?.nodes ?? []
}

export function descendants(nodes: readonly AstNode[]): AstNode[] {
  const result: AstNode[] = []
  const queue = [...nodes]
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const node = queue[cursor]!
    result.push(node)
    if (node.children) queue.push(...node.children)
  }
  return result
}
