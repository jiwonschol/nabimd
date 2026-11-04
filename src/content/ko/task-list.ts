import { markCards, type KoDoc } from "./build"

/** 기호 "할 일 목록": - [ ] 와 - [x] 로 했는지 안 했는지 표시한다. */
export const taskListDocs: readonly KoDoc[] = [
  {
    slug: "moving-prep",
    type: "할 일",
    title: "이사 준비",
    target: "# 이사 준비\n\n- [x] 이삿짐 업체 예약\n- [ ] 인터넷 이전 신청\n- [ ] 냉장고 비우기",
    prose: [["인터넷", "가스"], ["냉장고", "옷장"]],
  },
  {
    slug: "grocery-check",
    type: "장보기 메모",
    title: "장보기 체크",
    target: "# 장보기 체크\n\n- [x] 쌀\n- [x] 계란\n- [ ] 휴지\n- [ ] 세제",
    prose: [["계란", "두부"], ["세제", "비누"]],
  },
  {
    slug: "before-departure",
    type: "여행 계획",
    title: "출발 전 확인",
    target: "# 출발 전 확인\n\n- [ ] 여권 챙기기\n- [ ] 환전\n- [x] 숙소 예약 확인",
    prose: [["여권", "신분증"], ["환전", "교통카드 충전"]],
  },
  {
    slug: "meeting-followup",
    type: "회의 메모",
    title: "회의 후속 조치",
    target: "# 회의 후속 조치\n\n- [ ] 회의록 공유\n- [ ] 예산안 수정\n- [x] 다음 회의실 예약",
    prose: [["예산안", "일정표"], ["회의록", "결정 사항"]],
  },
  {
    slug: "bug-checks",
    type: "버그 신고",
    title: "신고 전 확인한 것",
    target: "# 확인한 것\n\n- [x] 앱을 다시 켰다\n- [x] 최신 버전이다\n- [ ] 다른 기기에서 해 보기",
    prose: [["다시 켰다", "껐다 켰다"], ["다른 기기", "다른 휴대폰"]],
  },
  {
    slug: "moa-roadmap",
    type: "README 조각",
    title: "만들 기능",
    target: "# 만들 기능\n\n- [x] 메모 쓰기\n- [x] 태그 붙이기\n- [ ] 메모 내보내기",
    prose: [["태그 붙이기", "폴더 만들기"], ["내보내기", "공유하기"]],
  },
  {
    slug: "kimjang",
    type: "레시피",
    title: "김장 준비",
    target: "# 김장 준비\n\n- [ ] 배추 절이기\n- [ ] 양념 만들기\n- [ ] 통에 담기",
    prose: [["배추", "무"], ["통에 담기", "항아리에 담기"]],
  },
  {
    slug: "ai-checklist",
    type: "AI에게 보내는 요청문",
    title: "체크리스트 요청",
    target: "# 요청: 체크리스트 만들기\n\n아래 항목을 빠짐없이 넣는다.\n\n- [ ] 준비물\n- [ ] 일정\n- [ ] 연락처",
    prose: [["빠짐없이", "모두"], ["연락처", "비상 연락처"]],
  },
]

export const taskListCards = markCards("task-list", taskListDocs)
