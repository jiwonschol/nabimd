import { boldFixtures } from "./bold.fixtures"
import { codeBlockFixtures } from "./code-block.fixtures"
import { headingFixtures } from "./heading.fixtures"
import { inlineCodeFixtures } from "./inline-code.fixtures"
import { italicFixtures } from "./italic.fixtures"
import { linkFixtures } from "./link.fixtures"
import { listFixtures } from "./list.fixtures"
import { orderedListFixtures } from "./ordered-list.fixtures"

/** 한국어 문제은행의 실엔진 픽스처 전부. 테스트와 보고서만 읽는다. */
export const koFixtures = [
  ...headingFixtures,
  ...boldFixtures,
  ...italicFixtures,
  ...listFixtures,
  ...orderedListFixtures,
  ...linkFixtures,
  ...inlineCodeFixtures,
  ...codeBlockFixtures,
]
