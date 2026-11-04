import { markCards, type KoDoc } from "./build"

/** 기호 "링크": [글자](주소). 주소는 모두 example.com 아래다. */
export const linkDocs: readonly KoDoc[] = [
  {
    slug: "spring-festival",
    type: "공지",
    title: "봄 축제 신청",
    target: "# 봄 축제 신청\n\n신청은 [참가 신청서](https://example.com/spring-form)에서 받는다.\n마감은 이번 주 금요일이다.",
    prose: [["참가 신청서", "신청 양식"], ["금요일", "목요일"]],
  },
  {
    slug: "moa-help",
    type: "README 조각",
    title: "모아 메모 도움말",
    target: "# 모아 메모 도움말\n\n자주 묻는 질문은 [도움말](https://example.com/help)에 있다.\n오류는 [문의 게시판](https://example.com/board)에 남긴다.",
    prose: [["자주 묻는 질문", "사용법"], ["오류", "제안"]],
  },
  {
    slug: "next-book",
    type: "독서 메모",
    title: "다음에 읽을 책",
    target: "# 다음에 읽을 책\n\n[먼 바다의 편지](https://example.com/books/sea) 서평을 읽었다.\n도서관에 예약해 둔다.",
    prose: [["서평", "소개글"], ["도서관", "동네 서점"]],
  },
  {
    slug: "braised-tofu",
    type: "레시피",
    title: "두부조림",
    target: "# 두부조림\n\n자세한 순서는 [영상](https://example.com/tofu-video)을 본다.\n간장은 두 숟가락만 넣는다.",
    prose: [["자세한 순서", "만드는 순서"], ["두 숟가락", "세 숟가락"]],
  },
  {
    slug: "meeting-files",
    type: "회의 메모",
    title: "회의 자료 모음",
    target: "# 회의 자료 모음\n\n지난 회의록: [11월 첫 주](https://example.com/notes/1)\n발표 자료: [시안 비교](https://example.com/slides)",
    prose: [["지난 회의록", "이전 회의록"], ["발표 자료", "공유 자료"]],
  },
  {
    slug: "checkout-freeze",
    type: "버그 신고",
    title: "결제 화면 멈춤",
    target: "# 결제 화면 멈춤\n\n화면 녹화는 [여기](https://example.com/rec/42)에 올렸다.\n휴대폰에서만 생긴다.",
    prose: [["화면 녹화", "녹화 영상"], ["휴대폰에서만", "태블릿에서만"]],
  },
  {
    slug: "port-stay",
    type: "여행 계획",
    title: "은빛 항구 숙소",
    target: "# 은빛 항구 숙소\n\n숙소 위치는 [지도](https://example.com/map/port)에서 본다.\n체크인은 오후 3시다.",
    prose: [["숙소 위치", "가는 길"], ["오후 3시", "오후 4시"]],
  },
  {
    slug: "ai-summary",
    type: "AI에게 보내는 요청문",
    title: "글 요약 요청",
    target: "# 요청: 글 요약\n\n[이 글](https://example.com/post/7)을 세 줄로 요약한다.\n어려운 말은 쉬운 말로 바꾼다.",
    prose: [["세 줄", "네 줄"], ["쉬운 말", "흔한 말"]],
  },
]

export const linkCards = markCards("link", linkDocs)
