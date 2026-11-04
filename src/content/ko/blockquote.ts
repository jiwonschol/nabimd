import { markCards, type KoDoc } from "./build"

/** 기호 "인용": 남의 말이나 따로 짚을 문장을 > 로 들여 쓴다. */
export const blockquoteDocs: readonly KoDoc[] = [
  {
    slug: "forest-underline",
    type: "독서 메모",
    title: "작은 숲 밑줄",
    target: "# 작은 숲 밑줄\n\n가장 오래 남은 문장이다.\n\n> 숲은 지키는 사람을 기억한다.",
    prose: [["가장 오래", "제일 오래"], ["기억한다", "알아본다"]],
  },
  {
    slug: "customer-interview",
    type: "회의 메모",
    title: "고객 인터뷰 메모",
    target: "# 고객 인터뷰 메모\n\n가장 많이 나온 말을 옮긴다.\n\n> 저장 단추를 찾기 어렵다.",
    prose: [["가장 많이", "자주"], ["저장 단추", "검색 단추"]],
  },
  {
    slug: "parking-work",
    type: "공지",
    title: "주차장 공사",
    target: "# 주차장 공사\n\n관리실 안내를 그대로 옮긴다.\n\n> 다음 주 월요일부터 지하 2층을 막는다.",
    prose: [["월요일", "수요일"], ["지하 2층", "지하 1층"]],
  },
  {
    slug: "update-notice-bug",
    type: "버그 신고",
    title: "업데이트 뒤 알림 오류",
    target: "# 업데이트 뒤 오류\n\n사용자 문의를 그대로 붙인다.\n\n> 업데이트하고 나서 알림이 오지 않는다.",
    prose: [["사용자 문의", "받은 문의"], ["알림", "메시지"]],
  },
  {
    slug: "sujebi-tip",
    type: "레시피",
    title: "할머니 수제비",
    target: "# 할머니 수제비\n\n반죽 비결은 이 한마디다.\n\n> 반죽은 귓불만큼 말랑하게 한다.",
    prose: [["비결", "요령"], ["말랑하게", "부드럽게"]],
  },
  {
    slug: "port-tip",
    type: "여행 계획",
    title: "은빛 항구 귀띔",
    target: "# 은빛 항구 귀띔\n\n숙소 주인이 해 준 말이다.\n\n> 해 질 녘에는 등대 쪽 길이 가장 예쁘다.",
    prose: [["숙소 주인", "민박 주인"], ["등대 쪽", "바닷가 쪽"]],
  },
  {
    slug: "ai-sentence-polish",
    type: "AI에게 보내는 요청문",
    title: "문장 다듬기 요청",
    target: "# 요청: 문장 다듬기\n\n아래 문장을 더 짧게 고친다.\n\n> 이번 행사는 여러분의 참여 덕분에 잘 마쳤다.\n\n뜻은 바꾸지 않는다.",
    prose: [["더 짧게", "더 쉽게"], ["행사", "모임"]],
  },
  {
    slug: "moa-warning",
    type: "README 조각",
    title: "모아 메모 주의",
    target: "# 모아 메모 주의\n\n> 앱을 지우면 기기에만 있던 메모도 사라진다.\n\n중요한 메모는 먼저 내보낸다.",
    prose: [["중요한 메모", "꼭 남길 메모"], ["내보낸다", "백업한다"]],
  },
]

export const blockquoteCards = markCards("blockquote", blockquoteDocs)
