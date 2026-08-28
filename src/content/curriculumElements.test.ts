import { describe, expect, it } from "vitest"
import { curriculumLevels } from "./curriculumLevels"
import {
  type CurriculumElement,
  type CurriculumElementProblem,
  getCurriculumElement,
  getCurriculumElements,
  getImplementedElementsForEntry,
  validateCurriculumCoverage,
} from "./curriculumElements"
import { problemBank } from "./problemBank"

describe("curriculum element classification", () => {
  it("finds exactly the currently implemented frequency-based elements", () => {
    expect(
      new Set(
        problemBank
          .map((problem) => getCurriculumElement(problem))
          .filter((element) => element !== null),
      ),
    ).toEqual(
      new Set([
        "heading",
        "bold",
        "italic",
        "unordered-list",
        "ordered-list",
        "link",
        "inline-code",
        "code-block",
        "blockquote",
        "thematic-break",
        "nested-list",
      ]),
    )
  })

  it("derives readiness from five unique served elements", () => {
    const levelOne = curriculumLevels[0]
    const representatives = [...getImplementedElementsForEntry(levelOne, problemBank)]
      .map((element) =>
        problemBank.find(
          (problem) => getCurriculumElement(problem) === element,
        ),
      )
      .filter((problem) => problem !== undefined)

    expect(
      getImplementedElementsForEntry(levelOne, representatives.slice(0, 4)),
    ).toHaveLength(4)
    expect(
      getImplementedElementsForEntry(levelOne, representatives.slice(0, 5)),
    ).toHaveLength(5)

    expect(
      getImplementedElementsForEntry(
        levelOne,
        [
          ...representatives.slice(0, 4),
          {
            ...representatives[4]!,
            flavor: "transfer",
          } satisfies CurriculumElementProblem,
        ],
      ),
    ).toHaveLength(4)
  })

  it("identifies the 80 runtime mixed exercises composed only of Level 1 syntax", () => {
    const levelOneElements = new Set<CurriculumElement>(
      curriculumLevels[0].elements,
    )
    const implementedLevelOneElements = new Set(
      getImplementedElementsForEntry(curriculumLevels[0], problemBank),
    )
    const compatibleMixedProblems = problemBank.filter((problem) => {
      const elements = getCurriculumElements(problem)
      return (
        problem.flavor === "standard" &&
        elements.length > 1 &&
        elements.every((element) => levelOneElements.has(element))
      )
    })
    const strictOverlapFallbacks = compatibleMixedProblems.filter(
      (problem) =>
        implementedLevelOneElements.size -
          getCurriculumElements(problem).length <
        4,
    )

    expect(compatibleMixedProblems).toHaveLength(80)
    expect(strictOverlapFallbacks).toHaveLength(4)
  })

  it("keeps the unimplemented list honest in both directions", () => {
    expect(validateCurriculumCoverage(curriculumLevels, problemBank)).toEqual([])

    const levelOneWithoutImageGap = {
      ...curriculumLevels[0],
      unimplementedElements: ["table", "task-list"] as CurriculumElement[],
    }
    expect(
      validateCurriculumCoverage(
        [levelOneWithoutImageGap, ...curriculumLevels.slice(1)],
        problemBank,
      ),
    ).toContain("level-1 declares image but has no runtime problem")

    const imageProblem = {
      ...problemBank[0]!,
      id: "synthetic-image",
      skillIds: ["image"],
      syntaxTokens: ["![", "](", ")"],
    }
    expect(
      validateCurriculumCoverage(curriculumLevels, [
        ...problemBank,
        imageProblem,
      ]),
    ).toContain("level-1 still lists implemented image as unimplemented")

    expect(
      validateCurriculumCoverage(
        curriculumLevels.slice(0, 2),
        problemBank,
      ),
    ).toContain("curriculum omits footnote")
  })

  it("serves image syntax as an implemented Level 1 element", () => {
    const levelOne = curriculumLevels[0]

    expect(getImplementedElementsForEntry(levelOne, problemBank)).toContain(
      "image",
    )
    expect(levelOne.unimplementedElements).not.toContain("image")
  })
})
