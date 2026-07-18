import type { Heading, RootContent } from "mdast"

export type MarkdownSection = {
  heading: Heading
  headingDepth: Heading["depth"]
  occurrence: number
  nodes: readonly RootContent[]
}

export function createSectionIndex(
  blocks: readonly RootContent[],
): readonly MarkdownSection[] {
  const occurrences = new Map<Heading["depth"], number>()
  const sections: MarkdownSection[] = []

  for (let start = 0; start < blocks.length; start += 1) {
    const node = blocks[start]
    if (node?.type !== "heading") continue

    const occurrence = occurrences.get(node.depth) ?? 0
    occurrences.set(node.depth, occurrence + 1)

    let end = start + 1
    while (end < blocks.length) {
      const candidate = blocks[end]
      if (candidate?.type === "heading" && candidate.depth <= node.depth) break
      end += 1
    }

    sections.push({
      heading: node,
      headingDepth: node.depth,
      occurrence,
      nodes: blocks.slice(start, end),
    })
  }

  return sections
}
