import type { Lang } from "../i18n/text"

export type ChangelogEntry = {
  date: string
  title: string
  items: readonly string[]
}

/**
 * What changed for learners, newest first, in both screen languages. The home
 * footer shows it under "변경 이력" next to the version.
 */
export const changelogEntries: Readonly<Record<Lang, readonly ChangelogEntry[]>> = {
  ko: [
    {
      date: "2026년 11월",
      title: "Level 1을 새로 지었다",
      items: [
        "짧은 실제 문서 한 장을 에디터에 마크다운으로 쓰고, 구조로 채점받는다.",
        "한국어 문서 120장을 더했다. 영어 화면에서는 영어 문서를 그대로 쓴다.",
        "기호 열두 개의 지도에서 배운 기호가 이 브라우저에 남는다. 설정에서 지울 수 있다.",
        "방문 통계는 동의한 사람에게만 켠다.",
        "기기가 어두운 화면으로 설정돼 있으면 어두운 테마로 보인다.",
      ],
    },
    {
      date: "2026년 8월",
      title: "버전 표시와 신고 경로",
      items: [
        "첫 화면에 앱 버전과 빌드 식별자를 보여 준다.",
        "버그 신고와 보안 신고의 경로를 나눴다.",
      ],
    },
    {
      date: "2026년 7월",
      title: "차분한 연습 화면",
      items: [
        "한 번에 마크다운 패턴 하나에 집중해 연습한다.",
        "자주 쓰는 문법 순으로 세 단계를 나눴다.",
      ],
    },
  ],
  en: [
    {
      date: "November 2026",
      title: "Level 1, rebuilt",
      items: [
        "Write one short, real document in Markdown in the editor and get it graded by structure.",
        "Added 120 Korean documents. The English screen keeps the English documents.",
        "A map of twelve marks remembers what you have practised in this browser. Settings can clear it.",
        "Visit statistics run only for people who agree to them.",
        "A dark theme follows your device setting.",
      ],
    },
    {
      date: "August 2026",
      title: "Release details and reporting",
      items: [
        "The landing page now shows the app version and build identifier.",
        "Bug reports and security reports now have clear, separate paths.",
      ],
    },
    {
      date: "July 2026",
      title: "A calmer practice workspace",
      items: [
        "Practice now focuses on one Markdown pattern at a time.",
        "Three frequency-based levels focus practice on useful Markdown syntax.",
      ],
    },
  ],
}
