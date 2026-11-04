import { markCards, type KoDoc } from "./build"

/** 기호 "코드 블록": 여러 줄 코드·문구를 ``` 줄 사이에 그대로 둔다. */
export const codeBlockDocs: readonly KoDoc[] = [
  {
    slug: "moa-build",
    type: "README 조각",
    title: "모아 메모 빌드",
    target: "# 모아 메모 빌드\n\n아래 명령을 차례로 실행한다.\n\n```\nmake install\nmake build\n```",
    prose: [["차례로", "순서대로"], ["실행한다", "입력한다"]],
  },
  {
    slug: "sync-error",
    type: "버그 신고",
    title: "동기화 실패",
    target: "# 동기화 실패\n\n동기화할 때 아래 오류가 뜬다.\n\n```\nSyncError: timeout after 30s\n```",
    prose: [["동기화할 때", "저장할 때"], ["뜬다", "나온다"]],
  },
  {
    slug: "ai-explain-code",
    type: "AI에게 보내는 요청문",
    title: "코드 설명 요청",
    target: "# 요청: 코드 설명\n\n아래 코드가 하는 일을 한 줄로 설명한다.\n\n```js\nconst total = prices.reduce((a, b) => a + b, 0)\n```",
    prose: [["한 줄", "두 줄"], ["설명한다", "풀어 쓴다"]],
  },
  {
    slug: "server-settings",
    type: "회의 메모",
    title: "서버 점검 회의",
    target: "# 서버 점검 회의\n\n점검 뒤 설정은 아래처럼 바꾼다.\n\n```\ntimeout = 60\nretry = 3\n```",
    prose: [["점검 뒤", "다음 주부터"], ["바꾼다", "고친다"]],
  },
  {
    slug: "backup-before-leaving",
    type: "할 일",
    title: "퇴근 전 백업",
    target: "# 퇴근 전 할 일\n\n작업 폴더를 압축해 둔다.\n\n```\nzip -r backup.zip work\n```",
    prose: [["작업 폴더", "오늘 폴더"], ["압축해 둔다", "묶어 둔다"]],
  },
  {
    slug: "auto-reply",
    type: "공지",
    title: "부재 중 자동 답장",
    target: "# 부재 중 자동 답장\n\n휴가 동안 아래 문구를 쓴다.\n\n```\n12월 2일까지 휴가다.\n급한 일은 팀 메일로 보낸다.\n```",
    prose: [["휴가 동안", "자리를 비운 동안"], ["문구", "답장"]],
  },
  {
    slug: "dough-ratio",
    type: "레시피",
    title: "반죽 비율 메모",
    target: "# 반죽 비율 메모\n\n빵 반죽 비율을 그대로 적어 둔다.\n\n```\n밀가루 500\n물 350\n소금 10\n```",
    prose: [["빵 반죽", "피자 반죽"], ["적어 둔다", "남겨 둔다"]],
  },
  {
    slug: "packing-file",
    type: "여행 계획",
    title: "짐 목록 붙여 두기",
    target: "# 여행 짐 목록\n\n지난번 짐 목록을 글자 그대로 붙여 둔다.\n\n```\n여권, 충전기, 우산\n상비약, 여벌 옷\n```",
    prose: [["지난번", "작년"], ["붙여 둔다", "옮겨 둔다"]],
  },
]

export const codeBlockCards = markCards("code-block", codeBlockDocs)
