import type {
  GradableProblem,
  NormalizedProblem,
  ProblemInput,
} from "./types"

export function normalizeProblem(
  input: GradableProblem | ProblemInput,
): NormalizedProblem {
  const { convention, ...inputWithoutConvention } = input
  const protectedText = input.protectedContent.at(0) ?? input.id
  const vocabulary = input.vocabulary ?? {
    profile: "everyday" as const,
    domains: ["everyday"],
    terms: [protectedText],
  }

  return {
    ...inputWithoutConvention,
    schemaVersion: 2,
    level: input.level ?? 1,
    flavor: input.flavor ?? "standard",
    vocabulary: {
      ...vocabulary,
      domains: [...vocabulary.domains],
      terms: [...vocabulary.terms],
    },
    sourceBatchId: input.sourceBatchId ?? "legacy-heading-v1",
    revision: input.revision ?? 1,
    curriculumVersion: input.curriculumVersion ?? "2026-07-19",
    contentVariant: input.contentVariant ?? protectedText,
    skillIds: [...input.skillIds],
    syntaxTokens: [...input.syntaxTokens],
    protectedContent: [...input.protectedContent],
    matchChecks: input.matchChecks.map((check) => ({ ...check })),
    editorialChecks: input.editorialChecks.map((check) => ({ ...check })),
    hints: [...input.hints],
    reviewTags: [...input.reviewTags],
    ...(convention ? { convention: { ...convention } } : {}),
  }
}
