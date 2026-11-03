import type {
  FixtureKind,
  FixtureRole,
  MatchCheck,
  NormalizedProblem,
  ProblemFixture,
} from "../types"

/**
 * 한국어 문제은행 v1(계획서 §4.3)을 짓는 공용 틀.
 *
 * 문서 한 장은 `KoDoc` 하나로 쓴다: 문서 유형, 카드 제목, 목표 원문, 산문만
 * 바꾼 변형을 만들 낱말 쌍. 채점 검사·지시·힌트·픽스처는 기호마다 한 번
 * 정의한 규칙(`marks`)이 목표 원문에서 찍어 낸다. 그래서 같은 기호의 여덟
 * 장은 같은 말로 가르치고 같은 기준으로 채점된다.
 *
 * 모든 목표 원문은 첫 줄이 `# 제목`이고, 그 제목도 채점한다(Setext는 통과가
 * 아니다 — D11). 기호 문서에는 제목과 그 기호 말고 다른 마크다운 구조를 두지
 * 않는다. 채점하지 않는 구조를 건너뛰고도 통과하는 일이 없게 하려는 것이다.
 */

export const KO_DOC_TYPES = [
  "장보기 메모",
  "할 일",
  "회의 메모",
  "공지",
  "레시피",
  "독서 메모",
  "여행 계획",
  "버그 신고",
  "README 조각",
  "AI에게 보내는 요청문",
] as const

export type KoDocType = (typeof KO_DOC_TYPES)[number]

export const KO_MARKS = [
  "heading",
  "bold",
  "italic",
  "list",
  "ordered-list",
  "link",
  "inline-code",
  "code-block",
  "blockquote",
  "image",
  "table",
  "task-list",
] as const

export type KoMark = (typeof KO_MARKS)[number]

export type KoDoc = {
  /** 문제 id의 끝부분. 기호 안에서 겹치지 않는다. */
  slug: string
  type: KoDocType
  /** 카드 제목. 짧게. */
  title: string
  target: string
  /** 산문만 바꾼 변형 픽스처를 만들 [원래 낱말, 바꿀 낱말] 쌍. */
  prose: readonly (readonly [string, string])[]
}

export type KoMixedDoc = KoDoc & {
  /** 이 문서가 함께 연습하는 기호 2~3개(제목 `#`은 늘 채점하므로 세지 않는다). */
  marks: readonly KoMark[]
}

export type KoCard = {
  problem: NormalizedProblem
  /** 화면 지시 한 줄의 "이번 기호" 자리에 들어가는 이름. */
  focusMark: string
  marks: readonly KoMark[]
  docType: KoDocType
}

type FixtureDraft = {
  suffix: string
  role: FixtureRole
  kind: FixtureKind
  source: string
  exercisesCheckId?: string
  expectedStatus: "fail" | "matched"
  expectedFeedbackId?: string
}

type MarkRule = {
  name: string
  skillId: string
  syntaxTokens: readonly string[]
  teaching: NormalizedProblem["teaching"]
  /** 힌트 두 줄. 셋째 줄은 목표 원문에서 그 기호가 쓰인 첫 줄이다. */
  hints: readonly [string, string]
  /** 셋째 힌트로 보여줄 줄을 고른다. */
  exampleLine: RegExp
  /** 누락·오형 픽스처가 겨누는 검사. 없으면 첫 검사다. */
  primaryCheckId?: string
  /** 한 줄로 보여주기 어려운 기호는 셋째 힌트를 따로 만든다. */
  example?: (target: string) => string
  checks: (target: string, priority: number) => readonly MatchCheck[]
  /** 기호를 통째로 뺀 원문. */
  missing: (target: string) => string
  /** 학습자가 흔히 틀리는 모양으로 쓴 원문. */
  malformed: (target: string) => string
  /** 같은 구조로 읽히는 다른 표기(동치로 통과, 계획서 §4.2). */
  variant: (target: string) => string
  extraFixtures?: (target: string) => readonly FixtureDraft[]
}

const KO_BATCH = "2026-11-04-ko-bank-v1"
const KO_CURRICULUM_VERSION = "2026-11-04"

const linesMatching = (target: string, pattern: RegExp) =>
  target.split("\n").filter((line) => pattern.test(line))

const countMatches = (target: string, pattern: RegExp) =>
  [...target.matchAll(pattern)].length

function replaceLast(target: string, pattern: RegExp, replacement: string) {
  const lines = target.split("\n")
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (pattern.test(lines[index]!)) {
      lines[index] = lines[index]!.replace(pattern, replacement)
      break
    }
  }
  return lines.join("\n")
}

function replaceFirst(target: string, pattern: RegExp, replacement: string) {
  const lines = target.split("\n")
  const index = lines.findIndex((line) => pattern.test(line))
  if (index >= 0) lines[index] = lines[index]!.replace(pattern, replacement)
  return lines.join("\n")
}

function mustChange(name: string, before: string, after: string) {
  if (before === after) {
    throw new Error(`${name} transform left the target unchanged:\n${before}`)
  }
  return after
}

const doc = { kind: "document" } as const

// 제목: 모든 문서의 첫 줄. 기호 "제목"의 문서는 여기에 ## 소제목이 더해진다.

function titleChecks(title: string): readonly MatchCheck[] {
  return [
    {
      id: "space-after-hash",
      kind: "heading-spacing",
      level: 1,
      priority: 10,
      feedback: "# 뒤에 공백 하나를 둔다.",
    },
    {
      id: "use-hash-heading-style",
      kind: "hash-heading-style",
      level: 1,
      priority: 20,
      feedback: `제목 아래에 선을 긋지 말고 줄 처음에 # 을 쓴다. 예: # ${title}`,
    },
    {
      id: "use-h1-heading",
      kind: "has-heading",
      level: 1,
      priority: 30,
      feedback: "첫 줄은 # 과 공백으로 시작하는 제목이다.",
    },
  ]
}

const H1 = /^# (.+)$/
const H2 = /^## (.+)$/
const TABLE_ROW = /^\|.*\|$/
const TABLE_DELIMITER = /^\|(?:\s*:?-{3,}:?\s*\|)+$/
const FENCE = /^```/
const TASK = /^- \[[ xX]\] /

function tableCells(row: string) {
  return row.slice(1, -1).split("|")
}

function tableShapeOf(target: string) {
  const rows = linesMatching(target, TABLE_ROW)
  const delimiterIndex = rows.findIndex((row) => TABLE_DELIMITER.test(row))
  if (delimiterIndex !== 1) throw new Error(`table target needs a header and delimiter row:\n${target}`)
  return {
    headerCells: tableCells(rows[0]!).length,
    bodyRows: rows.length - 2,
  }
}

function mapTableRows(target: string, map: (row: string, isDelimiter: boolean) => string | null) {
  return target
    .split("\n")
    .flatMap((line) => {
      if (!TABLE_ROW.test(line)) return [line]
      const mapped = map(line, TABLE_DELIMITER.test(line))
      return mapped === null ? [] : [mapped]
    })
    .join("\n")
}

const marks: Readonly<Record<KoMark, MarkRule>> = {
  heading: {
    name: "제목",
    skillId: "heading-h2",
    syntaxTokens: ["#", "##"],
    teaching: {
      concept: "제목은 문서와 그 안의 구획에 이름을 붙인다.",
      howTo: "문서 제목은 # 과 공백, 구획 제목은 ## 과 공백으로 시작한다.",
      example: "# 주간 회의\n\n## 결정",
    },
    hints: [
      "구획 이름 줄은 ## 과 공백으로 시작한다.",
      "# 은 문서에 하나, 그 아래 구획은 ## 이다.",
    ],
    exampleLine: H2,
    primaryCheckId: "section-headings",
    checks: (target, priority) => [
      {
        id: "heading-order",
        kind: "heading-depth-order",
        allowSkippedDepths: false,
        priority,
        feedback: "# 다음에는 ## 이 온다. 단계를 건너뛰지 않는다.",
      },
      {
        id: "use-hash-section-style",
        kind: "hash-heading-style",
        level: 2,
        priority: priority + 1,
        feedback: "구획 이름 아래에 --- 선을 긋지 말고 줄 처음에 ## 을 쓴다.",
      },
      {
        id: "section-headings",
        kind: "block-count",
        scope: doc,
        block: "heading",
        depth: 2,
        min: linesMatching(target, H2).length,
        priority: priority + 2,
        feedback: "구획 이름 줄마다 ## 과 공백을 앞에 쓴다.",
      },
    ],
    missing: (target) => target.replace(/^## /gm, ""),
    malformed: (target) => target.replace(/^## /gm, "##"),
    variant: (target) => target.replace(/^## (.+)$/gm, "## $1 ##"),
    extraFixtures: (target) => [
      {
        suffix: "setext-sections",
        role: "edge-case",
        kind: "setext",
        source: target.replace(/^## (.+)$/gm, "$1\n---"),
        exercisesCheckId: "use-hash-section-style",
        expectedStatus: "fail",
        expectedFeedbackId: "use-hash-section-style",
      },
      {
        suffix: "skipped-depth",
        role: "edge-case",
        kind: "h2",
        source: replaceFirst(target, /^## /, "### "),
        exercisesCheckId: "heading-order",
        expectedStatus: "fail",
        expectedFeedbackId: "heading-order",
      },
    ],
  },
  bold: {
    name: "굵게",
    skillId: "bold-emphasis",
    syntaxTokens: ["**"],
    teaching: {
      concept: "굵게는 꼭 봐야 할 말을 눈에 띄게 한다.",
      howTo: "굵게 할 말을 ** 로 양쪽에서 붙여 감싼다.",
      example: "**내일까지** 낸다",
    },
    hints: [
      "굵게 할 말 앞뒤에 ** 를 붙인다.",
      "** 와 글자 사이에는 공백을 두지 않는다.",
    ],
    exampleLine: /\*\*[^*]+\*\*/,
    checks: (target, priority) => [
      {
        id: "bold-words",
        kind: "inline-presence",
        scope: doc,
        inline: "strong",
        min: countMatches(target, /\*\*[^*\n]+\*\*/g),
        requireNonemptyContent: true,
        priority,
        feedback: "굵게 할 말을 ** 로 양쪽에서 감싼다.",
      },
    ],
    missing: (target) => target.replace(/\*\*([^*\n]+)\*\*/g, "$1"),
    malformed: (target) => target.replace(/\*\*([^*\n]+)\*\*/g, "** $1 **"),
    variant: (target) => target.replace(/\*\*([^*\n]+)\*\*/g, "__$1__"),
  },
  italic: {
    name: "기울임",
    skillId: "italic-emphasis",
    syntaxTokens: ["*"],
    teaching: {
      concept: "기울임은 제목·용어처럼 결이 다른 말을 구분한다.",
      howTo: "기울일 말을 * 하나로 양쪽에서 붙여 감싼다.",
      example: "*작은 숲* 을 읽었다",
    },
    hints: [
      "기울일 말 앞뒤에 * 를 하나씩 붙인다.",
      "* 와 글자 사이에는 공백을 두지 않는다.",
    ],
    exampleLine: /\*[^*]+\*/,
    checks: (target, priority) => [
      {
        id: "italic-words",
        kind: "inline-presence",
        scope: doc,
        inline: "emphasis",
        min: countMatches(target, /\*[^*\n]+\*/g),
        requireNonemptyContent: true,
        priority,
        feedback: "기울일 말을 * 하나로 양쪽에서 감싼다.",
      },
    ],
    missing: (target) => target.replace(/\*([^*\n]+)\*/g, "$1"),
    malformed: (target) => target.replace(/\*([^*\n]+)\*/g, "*$1"),
    variant: (target) => target.replace(/\*([^*\n]+)\*/g, "_$1_"),
  },
  list: {
    name: "목록",
    skillId: "unordered-list",
    syntaxTokens: ["-"],
    teaching: {
      concept: "목록은 나란한 항목을 한 줄에 하나씩 보여준다.",
      howTo: "줄 처음에 - 와 공백을 쓰고 항목을 적는다.",
      example: "- 우유\n- 달걀",
    },
    hints: [
      "항목 줄마다 맨 앞에 - 를 쓴다.",
      "- 뒤에는 공백 하나를 두고 항목을 쓴다.",
    ],
    exampleLine: /^- /,
    checks: (target, priority) => {
      const items = linesMatching(target, /^- /).length
      return [
        {
          id: "bullet-items",
          kind: "list-shape",
          scope: doc,
          ordered: false,
          minItems: items,
          maxItems: items,
          requireNonemptyItems: true,
          priority,
          feedback: `항목 ${items}개를 - 와 공백으로 시작하는 목록으로 쓴다.`,
        },
      ]
    },
    missing: (target) => target.replace(/^- /gm, ""),
    malformed: (target) => target.replace(/^- /gm, "-"),
    variant: (target) => target.replace(/^- /gm, "* "),
  },
  "ordered-list": {
    name: "번호 목록",
    skillId: "ordered-list",
    syntaxTokens: ["1."],
    teaching: {
      concept: "번호 목록은 순서가 있는 단계를 보여준다.",
      howTo: "줄 처음에 1. 과 공백을 쓰고, 다음 줄은 2. 로 잇는다.",
      example: "1. 물을 끓인다\n2. 면을 넣는다",
    },
    hints: [
      "단계 줄마다 맨 앞에 번호와 점을 쓴다.",
      "점 뒤에는 공백 하나를 두고 단계를 쓴다.",
    ],
    exampleLine: /^\d+\. /,
    checks: (target, priority) => {
      const items = linesMatching(target, /^\d+\. /).length
      return [
        {
          id: "numbered-steps",
          kind: "list-shape",
          scope: doc,
          ordered: true,
          minItems: items,
          maxItems: items,
          requireNonemptyItems: true,
          priority,
          feedback: `단계 ${items}개를 1. 과 공백으로 시작하는 번호 목록으로 쓴다.`,
        },
      ]
    },
    missing: (target) => target.replace(/^\d+\. /gm, ""),
    malformed: (target) => target.replace(/^(\d+)\. /gm, "$1."),
    variant: (target) => target.replace(/^(\d+)\. /gm, "$1) "),
  },
  link: {
    name: "링크",
    skillId: "inline-link",
    syntaxTokens: ["[", "](", ")"],
    teaching: {
      concept: "링크는 글자를 눌러 다른 주소로 가게 한다.",
      howTo: "[보일 글자] 바로 뒤에 (주소)를 붙여 쓴다.",
      example: "[신청서](https://example.com/form)",
    },
    hints: [
      "누를 글자를 [ ] 로 감싸고 바로 뒤에 ( ) 로 주소를 쓴다.",
      "] 와 ( 사이에는 공백을 두지 않는다.",
    ],
    exampleLine: /(?<!!)\[[^\]]+\]\(/,
    checks: (target, priority) => [
      {
        id: "inline-links",
        kind: "link-shape",
        scope: doc,
        min: countMatches(target, /(?<!!)\[[^\]\n]+\]\([^)\n]+\)/g),
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: false,
        allowAutolinks: false,
        priority,
        feedback: "링크는 [글자](주소) 모양으로 붙여 쓴다.",
      },
    ],
    missing: (target) => target.replace(/(?<!!)\[([^\]\n]+)\]\([^)\n]+\)/g, "$1"),
    malformed: (target) => target.replace(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/g, "[$1] ($2)"),
    variant: (target) => target.replace(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/g, "[$1](<$2>)"),
  },
  "inline-code": {
    name: "코드",
    skillId: "inline-code",
    syntaxTokens: ["`"],
    teaching: {
      concept: "코드는 명령어·파일 이름을 글자 그대로 보여준다.",
      howTo: "코드로 보일 말을 백틱(`) 하나로 양쪽에서 감싼다.",
      example: "`notes.txt` 를 연다",
    },
    hints: [
      "명령어나 파일 이름 앞뒤에 백틱(`)을 붙인다.",
      "한글 자판에서 ₩ 가 찍히면 영문 자판으로 바꿔 ` 를 쓴다.",
    ],
    exampleLine: /`[^`]+`/,
    checks: (target, priority) => [
      {
        id: "inline-code-spans",
        kind: "inline-code-shape",
        scope: doc,
        min: countMatches(target, /`[^`\n]+`/g),
        requireNonemptyContent: true,
        priority,
        feedback: "코드로 보일 말을 ` 로 양쪽에서 감싼다.",
      },
    ],
    missing: (target) => target.replace(/`([^`\n]+)`/g, "$1"),
    malformed: (target) => target.replace(/`([^`\n]+)`/g, "₩$1₩"),
    variant: (target) => target.replace(/`([^`\n]+)`/g, "``$1``"),
  },
  "code-block": {
    name: "코드 블록",
    skillId: "fenced-code-block",
    syntaxTokens: ["```"],
    teaching: {
      concept: "코드 블록은 여러 줄의 코드를 칸 안에 그대로 보여준다.",
      howTo: "코드 위아래 줄에 ``` 를 하나씩 쓴다. 위쪽 ``` 뒤에 언어 이름을 붙여도 된다.",
      example: "```\nls\n```",
    },
    hints: [
      "코드 줄 바로 위와 아래에 ``` 줄을 하나씩 둔다.",
      "여는 ``` 를 썼으면 닫는 ``` 도 쓴다.",
    ],
    exampleLine: FENCE,
    example: (target) => {
      const lines = target.split("\n")
      const opening = lines.findIndex((line) => FENCE.test(line))
      return `예: ${lines[opening]} 줄 다음에 ${lines[opening + 1]}, 그 아래에 \`\`\` 줄`
    },
    checks: (_target, priority) => [
      {
        id: "fenced-code",
        kind: "code-block",
        scope: doc,
        min: 1,
        max: 1,
        requireFenced: true,
        requireClosedFence: true,
        requireNonemptyContent: true,
        priority,
        feedback: "코드 줄을 위아래 ``` 줄 사이에 넣는다.",
      },
    ],
    missing: (target) =>
      target
        .split("\n")
        .filter((line) => !FENCE.test(line))
        .join("\n"),
    malformed: (target) => {
      const lines = target.split("\n")
      const closing = lines.lastIndexOf("```")
      return lines.filter((_line, index) => index !== closing).join("\n")
    },
    variant: (target) => target.replace(/^```/gm, "~~~"),
  },
  blockquote: {
    name: "인용",
    skillId: "blockquote",
    syntaxTokens: [">"],
    teaching: {
      concept: "인용은 남의 말이나 따로 짚을 문장을 들여 보여준다.",
      howTo: "줄 처음에 > 와 공백을 쓰고 문장을 적는다.",
      example: "> 내일 비가 온다.",
    },
    hints: [
      "인용할 줄 맨 앞에 > 를 쓴다.",
      "한글 자판의 ＞(전각)가 아니라 영문 > 다.",
    ],
    exampleLine: /^> /,
    checks: (target, priority) => [
      {
        id: "quoted-lines",
        kind: "block-count",
        scope: doc,
        block: "blockquote",
        min: countMatches(target, /(?:^|\n\n)> /g),
        priority,
        feedback: "인용할 줄을 > 와 공백으로 시작한다.",
      },
      {
        id: "quote-has-text",
        kind: "blockquote-shape",
        scope: doc,
        requireNonemptyContent: true,
        priority: priority + 1,
        feedback: "> 뒤에 인용할 문장을 쓴다.",
      },
    ],
    missing: (target) => target.replace(/^> /gm, ""),
    malformed: (target) => target.replace(/^> /gm, "＞ "),
    variant: (target) => target.replace(/^> /gm, ">"),
    extraFixtures: (target) => [
      {
        suffix: "empty-quote",
        role: "edge-case",
        kind: "empty-blockquote",
        source: target.replace(/^> .*$/gm, ">"),
        exercisesCheckId: "quote-has-text",
        expectedStatus: "fail",
        expectedFeedbackId: "quote-has-text",
      },
    ],
  },
  image: {
    name: "이미지",
    skillId: "image",
    syntaxTokens: ["![", "](", ")"],
    teaching: {
      concept: "이미지는 그림을 넣고 대체 글로 무엇인지 알린다.",
      howTo: "! 다음에 [대체 글], 바로 뒤에 (주소)를 붙여 쓴다.",
      example: "![지도](https://example.com/map.png)",
    },
    hints: [
      "맨 앞의 ! 가 링크와 이미지를 가른다.",
      "[ ] 안에는 그림을 설명하는 글을 쓴다.",
    ],
    exampleLine: /!\[/,
    checks: (target, priority) => [
      {
        id: "images",
        kind: "inline-presence",
        scope: doc,
        inline: "image",
        min: countMatches(target, /!\[[^\]\n]+\]\([^)\n]+\)/g),
        requireNonemptyContent: true,
        requireNonemptyDestination: true,
        priority,
        feedback: "이미지는 ![대체 글](주소) 모양으로 쓴다.",
      },
    ],
    missing: (target) => target.replace(/!\[([^\]\n]+)\]\(([^)\n]+)\)/g, "[$1]($2)"),
    malformed: (target) => target.replace(/!\[([^\]\n]+)\]\(([^)\n]+)\)/g, "![$1] ($2)"),
    variant: (target) => target.replace(/!\[([^\]\n]+)\]\(([^)\n]+)\)/g, '![$1]($2 "$1")'),
    extraFixtures: (target) => [
      {
        suffix: "empty-alt",
        role: "edge-case",
        kind: "empty-image-alt-list",
        source: target.replace(/!\[[^\]\n]+\]/g, "![]"),
        exercisesCheckId: "images",
        expectedStatus: "fail",
        expectedFeedbackId: "images",
      },
    ],
  },
  table: {
    name: "표",
    skillId: "table",
    syntaxTokens: ["|", "---"],
    teaching: {
      concept: "표는 같은 항목을 칸과 줄로 나란히 비교한다.",
      howTo: "칸을 | 로 나누고, 머리 줄 아래에 | --- | 구분 줄을 둔다.",
      example: "| 요일 | 메뉴 |\n| --- | --- |\n| 월 | 국수 |",
    },
    hints: [
      "머리 줄 바로 아래에 칸 수만큼 --- 를 쓴 구분 줄을 둔다.",
      "줄마다 칸 수를 머리 줄과 맞추고 | 로 나눈다.",
    ],
    exampleLine: TABLE_ROW,
    checks: (target, priority) => {
      const shape = tableShapeOf(target)
      return [
        {
          id: "shaped-table",
          kind: "block-count",
          scope: doc,
          block: "table",
          min: 1,
          max: 1,
          tableShape: {
            headerCells: shape.headerCells,
            minBodyRows: shape.bodyRows,
            maxBodyRows: shape.bodyRows,
          },
          priority,
          feedback: `머리 칸 ${shape.headerCells}개, 본문 ${shape.bodyRows}줄인 표를 쓴다. 머리 줄 아래에는 구분 줄을 둔다.`,
        },
      ]
    },
    missing: (target) => mapTableRows(target, (row, isDelimiter) => (isDelimiter ? null : row)),
    malformed: (target) => mapTableRows(target, (row, isDelimiter) => (isDelimiter ? "| --- |" : row)),
    variant: (target) =>
      mapTableRows(target, (row, isDelimiter) =>
        isDelimiter
          ? tableCells(row).map(() => ":---").join(" | ")
          : tableCells(row).map((cell) => cell.trim()).join(" | "),
      ),
    extraFixtures: (target) => {
      let rowIndex = 0
      return [
        {
          suffix: "no-body-rows",
          role: "edge-case",
          kind: "missing",
          source: mapTableRows(target, (row) => (rowIndex++ < 2 ? row : null)),
          exercisesCheckId: "shaped-table",
          expectedStatus: "fail",
          expectedFeedbackId: "shaped-table",
        },
        {
          suffix: "fewer-header-cells",
          role: "edge-case",
          kind: "malformed",
          source: mapTableRows(target, (row) => `|${tableCells(row).slice(0, -1).join("|")}|`),
          exercisesCheckId: "shaped-table",
          expectedStatus: "fail",
          expectedFeedbackId: "shaped-table",
        },
      ]
    },
  },
  "task-list": {
    name: "할 일 목록",
    skillId: "task-list",
    syntaxTokens: ["- [ ]", "- [x]"],
    teaching: {
      concept: "할 일 목록은 항목마다 했는지 안 했는지를 표시한다.",
      howTo: "- 와 공백 다음에 [ ] 를 쓰고, 끝낸 일은 [x] 로 쓴다.",
      example: "- [x] 우유 사기\n- [ ] 빨래",
    },
    hints: [
      "항목 줄마다 - 다음에 [ ] 또는 [x] 를 쓴다.",
      "[ ] 의 괄호 안에는 공백 하나가 들어간다.",
    ],
    exampleLine: TASK,
    checks: (target, priority) => {
      const items = linesMatching(target, TASK).length
      return [
        {
          id: "task-items",
          kind: "list-shape",
          scope: doc,
          ordered: false,
          minItems: items,
          maxItems: items,
          requireNonemptyItems: true,
          requireTaskItems: true,
          priority,
          feedback: `항목 ${items}개를 - [ ] 또는 - [x] 로 시작하는 할 일 목록으로 쓴다.`,
        },
      ]
    },
    missing: (target) => target.replace(/^- \[[ xX]\] /gm, "- "),
    malformed: (target) => target.replace(/^- \[[ xX]\] /gm, "- [] "),
    variant: (target) => target.replace(/^- \[x\] /gm, "- [X] ").replace(/^- /gm, "* "),
  },
}

export function markName(mark: KoMark) {
  return marks[mark].name
}

function objectParticle(word: string) {
  const last = word.at(-1) ?? ""
  const code = last.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return "을(를)"
  return code % 28 === 0 ? "를" : "을"
}

function exampleLine(target: string, rule: MarkRule) {
  if (rule.example) return rule.example(target)
  const line = target.split("\n").find((candidate) => rule.exampleLine.test(candidate))
  if (!line) throw new Error(`no example line for ${rule.name}:\n${target}`)
  return `예: ${line}`
}

function applyProse(source: KoDoc) {
  return source.prose.reduce((text, [from, to]) => {
    if (!text.includes(from)) {
      throw new Error(`${source.slug}: prose word "${from}" is not in the target`)
    }
    return text.replaceAll(from, to)
  }, source.target)
}

function headingFixtures(target: string): readonly FixtureDraft[] {
  const title = target.split("\n")[0]!.match(H1)?.[1]
  if (!title) throw new Error(`target must start with "# 제목":\n${target}`)
  const rest = target.split("\n").slice(1).join("\n")
  return [
    {
      suffix: "title-no-space",
      role: "malformed",
      kind: "compound-missing-space",
      source: `#${title}\n${rest}`,
      exercisesCheckId: "space-after-hash",
      expectedStatus: "fail",
      expectedFeedbackId: "space-after-hash",
    },
    {
      suffix: "title-setext",
      role: "edge-case",
      kind: "setext",
      source: `${title}\n===\n${rest}`,
      exercisesCheckId: "use-hash-heading-style",
      expectedStatus: "fail",
      expectedFeedbackId: "use-hash-heading-style",
    },
    {
      suffix: "title-missing",
      role: "missing",
      kind: "missing",
      source: `${title}\n${rest}`,
      exercisesCheckId: "use-h1-heading",
      expectedStatus: "fail",
      expectedFeedbackId: "use-h1-heading",
    },
  ]
}

type BuiltCard = { card: KoCard; fixtures: readonly ProblemFixture[] }

function buildCard(source: KoDoc, cardMarks: readonly KoMark[]): BuiltCard {
  const rules = cardMarks.map((mark) => marks[mark])
  const isMixed = cardMarks.length > 1
  const family = isMixed ? "ko-mixed" : `ko-${cardMarks[0]}`
  const id = `${family}-${source.slug}`
  const title = source.target.split("\n")[0]!.match(H1)?.[1] ?? ""
  const markChecks = rules.map((rule, index) => rule.checks(source.target, 40 + index * 10))
  const matchChecks = [...titleChecks(title), ...markChecks.flat()]

  const problem: NormalizedProblem = {
    id,
    locale: "ko",
    schemaVersion: 2,
    level: 1,
    flavor: "standard",
    familyId: family,
    skillIds: [...new Set(["heading-h1", ...rules.map((rule) => rule.skillId)])],
    difficulty: isMixed ? "mixed" : "warmup",
    teachingMode: "introduce",
    teaching: rules[0]!.teaching,
    syntaxTokens: [...new Set(["#", ...rules.flatMap((rule) => rule.syntaxTokens)])],
    title: source.title,
    prompt: `이 ${source.type}${objectParticle(source.type)} 마크다운으로 쓴다.`,
    target: source.target,
    starterText: "",
    protectedContent: [],
    matchChecks,
    editorialChecks: [
      {
        id: "one-document-title",
        kind: "single-h1",
        review: "# 제목은 문서에 하나만 둔다. 구획 이름은 ## 로 쓴다.",
      },
    ],
    hints: isMixed
      ? [rules[0]!.hints[0], rules[1]!.hints[0], exampleLine(source.target, rules[0]!)]
      : [rules[0]!.hints[0], rules[0]!.hints[1], exampleLine(source.target, rules[0]!)],
    retryFamily: family,
    reviewTags: ["ko", ...cardMarks],
    vocabulary: {
      profile: "everyday",
      domains: [source.type],
      terms: source.prose.map(([from]) => from),
    },
    sourceBatchId: KO_BATCH,
    revision: 1,
    curriculumVersion: KO_CURRICULUM_VERSION,
    contentVariant: source.slug,
  }

  const drafts: FixtureDraft[] = [
    {
      suffix: "canonical",
      role: "canonical",
      kind: "canonical",
      source: source.target,
      expectedStatus: "matched",
    },
    {
      suffix: "different-prose",
      role: "different-prose",
      kind: "alternate",
      source: mustChange(`${id} prose`, source.target, applyProse(source)),
      expectedStatus: "matched",
    },
    {
      suffix: "equivalent-spelling",
      role: "case-spelling-variation",
      kind: "case-variation",
      source: rules.reduce(
        (text, rule) => mustChange(`${id} ${rule.name} variant`, text, rule.variant(text)),
        source.target,
      ),
      expectedStatus: "matched",
    },
    {
      suffix: "second-title",
      role: "matched-with-review",
      kind: "matched-with-refinement",
      source: `${source.target}\n\n# 덧붙임`,
      expectedStatus: "matched",
    },
    ...headingFixtures(source.target),
  ]

  rules.forEach((rule, index) => {
    const primary =
      markChecks[index]!.find((check) => check.id === rule.primaryCheckId) ?? markChecks[index]![0]!
    const mark = cardMarks[index]!
    drafts.push(
      {
        suffix: `${mark}-missing`,
        role: "missing",
        kind: "missing",
        source: mustChange(`${id} ${rule.name} missing`, source.target, rule.missing(source.target)),
        exercisesCheckId: primary.id,
        expectedStatus: "fail",
        expectedFeedbackId: primary.id,
      },
      {
        suffix: `${mark}-malformed`,
        role: "malformed",
        kind: "malformed",
        source: mustChange(`${id} ${rule.name} malformed`, source.target, rule.malformed(source.target)),
        exercisesCheckId: primary.id,
        expectedStatus: "fail",
        expectedFeedbackId: primary.id,
      },
      ...(rule.extraFixtures?.(source.target) ?? []).map((draft) => ({
        ...draft,
        suffix: `${mark}-${draft.suffix}`,
      })),
    )
  })

  const fixtures = drafts.map(
    (draft): ProblemFixture => ({
      id: `${id}--${draft.suffix}`,
      problemId: id,
      problemRevision: 1,
      role: draft.role,
      kind: draft.kind,
      source: draft.source,
      expectedStatus: draft.expectedStatus,
      ...(draft.exercisesCheckId ? { exercisesCheckId: draft.exercisesCheckId } : {}),
      ...(draft.expectedFeedbackId ? { expectedFeedbackId: draft.expectedFeedbackId } : {}),
      ...(draft.expectedStatus === "matched"
        ? { expectedReviewIds: draft.role === "matched-with-review" ? ["one-document-title"] : [] }
        : {}),
    }),
  )

  return {
    card: {
      problem,
      focusMark: cardMarks.map(markName).join("·"),
      marks: cardMarks,
      docType: source.type,
    },
    fixtures,
  }
}

export function markCards(mark: KoMark, docs: readonly KoDoc[]) {
  return docs.map((source) => buildCard(source, [mark]).card)
}

export function markFixtures(mark: KoMark, docs: readonly KoDoc[]) {
  return docs.flatMap((source) => buildCard(source, [mark]).fixtures)
}

export function mixedCards(docs: readonly KoMixedDoc[]) {
  return docs.map((source) => buildCard(source, source.marks).card)
}

export function mixedFixtures(docs: readonly KoMixedDoc[]) {
  return docs.flatMap((source) => buildCard(source, source.marks).fixtures)
}
