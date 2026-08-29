import { describe, expect, it } from "vitest"
import { curriculumLevels } from "./curriculumLevels"
import { getCurriculumElements, getProblemEntryId } from "./curriculumElements"
import { getSyntaxFamily } from "../selection/runComposition"
import { SYNTAX_FAMILY_WEIGHTS } from "../selection/runPolicy"

const problem = (skill: string) => ({
  id: `probe-${skill}`,
  skillIds: [skill] as const,
  syntaxTokens: [] as const,
  target: "",
  starterText: "",
})

describe("a table problem is owned and scheduled by Level 1", () => {
  // `#182` made a table something the card can ask for, the engine can grade,
  // and the bank gate accepts. It could still not be *scheduled*: the skill id
  // reached neither the curriculum owner nor the run scheduler, so a
  // `skillIds: ["table"]` problem was owned by no level and belonged to no
  // syntax family. Found by 현철 running the real path rather than trusting
  // that the earlier three places were the whole path.
  it.each(["table", "task-list"])("gives %s a Level 1 owner", (skill) => {
    expect(getCurriculumElements(problem(skill))).toEqual([skill])
    expect(getProblemEntryId(problem(skill))).toBe("level-1")
  })

  it.each(["table", "task-list"])("gives %s its own syntax family", (skill) => {
    expect(getSyntaxFamily(problem(skill))).toBe(skill)
    expect(SYNTAX_FAMILY_WEIGHTS).toHaveProperty(skill)
  })

  it("keeps a skill the curriculum does not declare unowned", () => {
    // The pass case's counterpart: this is not a mapping that answers for
    // anything it is handed.
    expect(getCurriculumElements(problem("footnote"))).toEqual([])
    expect(getSyntaxFamily(problem("footnote"))).toBeNull()
  })

  it("weights every Level 1 element the scheduler can serve", () => {
    // The scheduler rotates families by weight; an element with no weight is
    // an element the turn can never plan for. Level 1 is the open level, so
    // its declared elements have to be schedulable once they have problems.
    const levelOne = curriculumLevels.find(
      (entry) => entry.curriculumLevel === 1,
    )!
    for (const element of levelOne.elements) {
      expect(SYNTAX_FAMILY_WEIGHTS, element).toHaveProperty(element)
    }
  })
})
