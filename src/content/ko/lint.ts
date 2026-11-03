import type { KoCard } from "./build"

/** 계획서 §4.3의 길이 규칙. */
export const KO_LIMITS = {
  minLines: 3,
  maxLines: 10,
  maxLineLength: 60,
  maxCharacters: 150,
} as const

export type KoLintCategory = "length" | "haeyo" | "forbidden" | "style"

export type KoLintIssue = {
  problemId: string
  category: KoLintCategory
  detail: string
}

const URL_PATTERN = /https?:\/\/[^\s)>"]+/g
const PHONE_PATTERN = /(?:^|[^\d])(?:0\d{1,2}|1\d{3})-\d{3,4}-\d{4}(?!\d)/
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.]+/
const ADDRESS_PATTERN = /\d+번지|[가-힣]+(?:로|길)\s?\d+(?:-\d+)?(?:번길)?(?![\d가-힣])|[가-힣]+(?:시|도)\s[가-힣]+(?:구|군)(?![가-힣])/
/**
 * 실존 서비스·회사 이름 중 이런 문서에 끼어들기 쉬운 것. 사람 실명은 자동으로
 * 가릴 수 없어, 문서에는 사람 이름을 아예 쓰지 않는다.
 */
const REAL_NAMES = [
  "카카오", "네이버", "구글", "애플", "삼성", "쿠팡", "배민", "유튜브", "인스타",
  "ChatGPT", "Claude", "Gemini", "GitHub", "Google", "Apple", "Slack", "Notion",
  "npm", "git ", "Figma", "제주", "서울", "부산",
]
/** 해요체: "요." "요?" "요!"로 끝나는 문장(계획서 §6 G2와 같은 정의). */
const HAEYO_PATTERN = /요[.?!]/

function learnerCopy(card: KoCard) {
  const { problem } = card
  return [
    problem.prompt,
    problem.teaching.concept,
    problem.teaching.howTo,
    problem.hints[0],
    problem.hints[1],
    ...problem.matchChecks.map((check) => check.feedback),
    ...problem.editorialChecks.map((check) => check.review),
  ]
}

export function lintKoCard(card: KoCard): KoLintIssue[] {
  const { problem } = card
  const issues: KoLintIssue[] = []
  const push = (category: KoLintCategory, detail: string) =>
    issues.push({ problemId: problem.id, category, detail })

  const lines = problem.target.split("\n")
  if (lines.length < KO_LIMITS.minLines || lines.length > KO_LIMITS.maxLines) {
    push("length", `${lines.length}줄`)
  }
  lines.forEach((line, index) => {
    if (line.length > KO_LIMITS.maxLineLength) {
      push("length", `${index + 1}번째 줄 ${line.length}자`)
    }
  })
  if (problem.target.length > KO_LIMITS.maxCharacters) {
    push("length", `문서 ${problem.target.length}자`)
  }

  const everything = [problem.target, problem.title, ...problem.hints, ...learnerCopy(card)]
  for (const text of everything) {
    if (HAEYO_PATTERN.test(text)) push("haeyo", text)
    for (const url of text.match(URL_PATTERN) ?? []) {
      if (!url.startsWith("https://example.com/")) push("forbidden", `주소 ${url}`)
    }
    if (PHONE_PATTERN.test(text)) push("forbidden", `전화번호 ${text}`)
    if (EMAIL_PATTERN.test(text)) push("forbidden", `메일 주소 ${text}`)
    if (ADDRESS_PATTERN.test(text)) push("forbidden", `주소 ${text}`)
    for (const name of REAL_NAMES) {
      if (text.includes(name)) push("forbidden", `실존 이름 ${name}`)
    }
  }

  for (const sentence of learnerCopy(card)) {
    const body = sentence.replace(/\s예: .*$/, "")
    if (!body.endsWith("다.")) push("style", sentence)
  }
  return issues
}
