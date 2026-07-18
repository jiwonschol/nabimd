import type { Root } from "mdast"
import type { EditorialCheck, Problem } from "../content/types"
import {
  hasSameRenderedSemantics,
  headingsAtLevel,
  parseMarkdown,
} from "./markdownAst"
import type { ReviewItem } from "./types"

function editorialCheckPasses(
  check: EditorialCheck,
  problem: Problem,
  root: Root,
): boolean {
  switch (check.kind) {
    case "matches-target-exactly":
      return hasSameRenderedSemantics(root, parseMarkdown(problem.target))
    case "single-h1":
      return headingsAtLevel(root, 1).length === 1
  }
}

export function evaluateEditorial(
  problem: Problem,
  root: Root,
): ReviewItem[] {
  return problem.editorialChecks
    .filter((check) => !editorialCheckPasses(check, problem, root))
    .map((check) => ({ id: check.id, message: check.review }))
    .slice(0, 3)
}
