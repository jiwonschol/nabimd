import type { MatchCheck, NormalizedProblem } from "../types"

/**
 * 재설계 시안(계획서 §4.8)이 띄우는 한국어 표본 문서 세 장.
 *
 * WS3(이슈 #253)이 한국어 문제은행 120장을 만들면서 이 파일을 대체한다.
 * 그때까지 이 세 장은 `?variant=` 화면과 그 캡처에만 쓰이고, 영어 문제은행
 * (problemBank)에는 들어가지 않는다. 스키마는 기존 v2 그대로다.
 *
 * 문장은 "~다"로 끝낸다(onsoonlabs intend.md). 길이는 한 줄 60자, 한 장 150자
 * 이하이고 실존 이름·주소는 없다(계획서 §4.3).
 */
export type KoSample = {
  problem: NormalizedProblem
  /** 지시 한 줄의 "이번 기호" 자리에 들어가는 기호 이름. */
  focusMark: string
}

const SAMPLE_BATCH = "2026-11-03-ko-samples"
const CURRICULUM_VERSION = "2026-11-03"

function headingChecks(title: string): readonly MatchCheck[] {
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
      feedback: `제목은 # 으로 시작하는 방식으로 쓴다. 예: # ${title}`,
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

const singleTitle = {
  id: "one-document-title",
  kind: "single-h1",
  review: "제목(#)은 문서에 하나만 둔다.",
} as const

const grocery: NormalizedProblem = {
  id: "ko-sample-grocery-memo",
  schemaVersion: 2,
  level: 1,
  flavor: "standard",
  familyId: "ko-sample",
  skillIds: ["heading-h1", "unordered-list"],
  difficulty: "mixed",
  teachingMode: "introduce",
  teaching: {
    concept: "목록은 관련 항목을 한 줄에 하나씩 보여준다.",
    howTo: "줄 처음에 - 와 공백을 쓰고 항목을 적는다.",
    example: "- 우유\n- 달걀",
  },
  syntaxTokens: ["#", "-"],
  title: "장보기 메모",
  prompt: "이 문서를 마크다운으로 쓴다.",
  target: "# 장보기 메모\n\n- 우유\n- 달걀\n- 식빵",
  starterText: "",
  protectedContent: [],
  matchChecks: [
    ...headingChecks("장보기 메모"),
    {
      id: "three-bullet-items",
      kind: "list-shape",
      scope: { kind: "document" },
      ordered: false,
      minItems: 3,
      maxItems: 3,
      requireNonemptyItems: true,
      priority: 40,
      feedback: "항목 세 개를 - 와 공백으로 시작하는 목록으로 쓴다.",
    },
  ],
  editorialChecks: [singleTitle],
  hints: [
    "목록 항목은 - 와 공백으로 시작한다.",
    "제목은 # 과 공백, 그다음 제목 글자다.",
    "예: `- 우유`",
  ],
  retryFamily: "ko-sample-grocery-memo",
  reviewTags: ["ko-sample"],
  vocabulary: {
    profile: "everyday",
    domains: ["grocery"],
    terms: ["우유", "달걀", "식빵"],
  },
  sourceBatchId: SAMPLE_BATCH,
  revision: 1,
  curriculumVersion: CURRICULUM_VERSION,
  contentVariant: "grocery-memo",
}

const meeting: NormalizedProblem = {
  id: "ko-sample-meeting-memo",
  schemaVersion: 2,
  level: 1,
  flavor: "standard",
  familyId: "ko-sample",
  skillIds: ["heading-h1", "bold-emphasis", "ordered-list"],
  difficulty: "mixed",
  teachingMode: "introduce",
  teaching: {
    concept: "번호 목록은 순서가 있는 단계를 보여준다.",
    howTo: "줄 처음에 1. 과 공백을 쓰고, 다음 줄은 2. 로 잇는다.",
    example: "1. 캡처한다\n2. 비교한다",
  },
  syntaxTokens: ["#", "**", "1."],
  title: "회의 메모",
  prompt: "이 문서를 마크다운으로 쓴다.",
  target:
    "# 11월 기획 회의\n\n**결정**: 금요일에 시안을 고른다.\n\n1. 시안 세 개를 캡처한다\n2. 비교표를 쓴다\n3. 금요일에 고른다",
  starterText: "",
  protectedContent: [],
  matchChecks: [
    ...headingChecks("11월 기획 회의"),
    {
      id: "bold-decision",
      kind: "inline-presence",
      scope: { kind: "document" },
      inline: "strong",
      min: 1,
      requireNonemptyContent: true,
      priority: 40,
      feedback: "굵게 할 말을 ** 로 양쪽에서 감싼다.",
    },
    {
      id: "three-numbered-steps",
      kind: "list-shape",
      scope: { kind: "document" },
      ordered: true,
      minItems: 3,
      maxItems: 3,
      requireNonemptyItems: true,
      priority: 50,
      feedback: "단계 세 개를 1. 2. 3. 과 공백으로 시작하는 번호 목록으로 쓴다.",
    },
  ],
  editorialChecks: [singleTitle],
  hints: [
    "번호 목록은 1. 과 공백으로 시작한다.",
    "굵게는 ** 로 열고 ** 로 닫는다.",
    "예: `1. 캡처한다`",
  ],
  retryFamily: "ko-sample-meeting-memo",
  reviewTags: ["ko-sample"],
  vocabulary: {
    profile: "everyday",
    domains: ["meeting"],
    terms: ["결정", "시안", "비교표"],
  },
  sourceBatchId: SAMPLE_BATCH,
  revision: 1,
  curriculumVersion: CURRICULUM_VERSION,
  contentVariant: "meeting-memo",
}

const aiRequest: NormalizedProblem = {
  id: "ko-sample-ai-request",
  schemaVersion: 2,
  level: 1,
  flavor: "standard",
  familyId: "ko-sample",
  skillIds: ["heading-h1", "unordered-list", "blockquote"],
  difficulty: "mixed",
  teachingMode: "introduce",
  teaching: {
    concept: "인용은 남의 말이나 따로 떼어 둘 조건을 보여준다.",
    howTo: "줄 처음에 > 와 공백을 쓰고 문장을 적는다.",
    example: "> 결과는 마크다운으로 준다",
  },
  syntaxTokens: ["#", "-", ">"],
  title: "AI 요청문",
  prompt: "이 문서를 마크다운으로 쓴다.",
  target:
    "# 요청: 회의 메모 정리\n\n- 아래 메모를 세 줄로 요약한다\n- 결정 사항은 굵게 표시한다\n\n> 결과는 마크다운으로 준다",
  starterText: "",
  protectedContent: [],
  matchChecks: [
    ...headingChecks("요청: 회의 메모 정리"),
    {
      id: "two-condition-items",
      kind: "list-shape",
      scope: { kind: "document" },
      ordered: false,
      minItems: 2,
      maxItems: 2,
      requireNonemptyItems: true,
      priority: 40,
      feedback: "조건 두 개를 - 와 공백으로 시작하는 목록으로 쓴다.",
    },
    {
      id: "quoted-output-rule",
      kind: "blockquote-shape",
      scope: { kind: "document" },
      requireNonemptyContent: true,
      priority: 50,
      feedback: "마지막 문장은 > 와 공백으로 시작하는 인용으로 쓴다.",
    },
  ],
  editorialChecks: [singleTitle],
  hints: [
    "인용 줄은 > 와 공백으로 시작한다.",
    "조건은 - 와 공백으로 시작하는 목록이다.",
    "예: `> 결과는 마크다운으로 준다`",
  ],
  retryFamily: "ko-sample-ai-request",
  reviewTags: ["ko-sample"],
  vocabulary: {
    profile: "everyday",
    domains: ["ai-request"],
    terms: ["요약", "결정 사항", "마크다운"],
  },
  sourceBatchId: SAMPLE_BATCH,
  revision: 1,
  curriculumVersion: CURRICULUM_VERSION,
  contentVariant: "ai-request",
}

export const koSamples: readonly [KoSample, ...KoSample[]] = [
  { problem: grocery, focusMark: "목록" },
  { problem: meeting, focusMark: "번호 목록" },
  { problem: aiRequest, focusMark: "인용" },
]

export function getKoSample(index: number): KoSample {
  const count = koSamples.length
  return koSamples[((index % count) + count) % count] ?? koSamples[0]
}
