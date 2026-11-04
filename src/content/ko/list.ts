import { markCards, type KoDoc } from "./build"

/** 기호 "목록": 나란한 항목을 - 로 한 줄에 하나씩 쓴다. */
export const listDocs: readonly KoDoc[] = [
  {
    slug: "weekend-groceries",
    type: "장보기 메모",
    title: "주말 장보기",
    target: "# 주말 장보기\n\n- 우유\n- 달걀 한 판\n- 식빵\n- 사과",
    prose: [["식빵", "모닝빵"], ["사과", "귤"]],
  },
  {
    slug: "today-errands",
    type: "할 일",
    title: "오늘 할 일",
    target: "# 오늘 할 일\n\n- 택배 반품 신청\n- 세탁소에 셔츠 맡기기\n- 화분에 물 주기",
    prose: [["셔츠", "코트"], ["화분", "텃밭"]],
  },
  {
    slug: "monday-meeting",
    type: "회의 메모",
    title: "월요 회의",
    target: "# 월요 회의\n\n- 새 메뉴는 다음 달에 낸다\n- 가격은 그대로 둔다\n- 홍보물은 디자인팀이 맡는다",
    prose: [["새 메뉴", "봄 메뉴"], ["디자인팀", "홍보팀"]],
  },
  {
    slug: "camping-gear",
    type: "여행 계획",
    title: "캠핑 준비물",
    target: "# 캠핑 준비물\n\n- 텐트와 침낭\n- 손전등\n- 여벌 양말\n- 상비약",
    prose: [["손전등", "랜턴"], ["여벌 양말", "여벌 옷"]],
  },
  {
    slug: "soybean-stew",
    type: "레시피",
    title: "된장찌개 재료",
    target: "# 된장찌개 재료\n\n- 된장 두 숟가락\n- 두부 반 모\n- 애호박 반 개\n- 양파 하나",
    prose: [["두 숟가락", "한 숟가락"], ["애호박", "감자"]],
  },
  {
    slug: "favorite-lines",
    type: "독서 메모",
    title: "다시 읽고 싶은 문장",
    target: "# 다시 읽고 싶은 문장\n\n- 천천히 가도 길은 남는다\n- 오늘의 나는 어제를 닮았다\n- 작은 일이 큰 하루를 만든다",
    prose: [["천천히", "느리게"], ["작은 일", "사소한 일"]],
  },
  {
    slug: "ai-email-reply",
    type: "AI에게 보내는 요청문",
    title: "답장 초안 요청",
    target: "# 요청: 이메일 답장\n\n- 목표: 회의 일정을 미루자고 답한다\n- 조건: 정중하게, 다섯 줄 안으로\n- 결과: 제목과 본문을 함께 준다",
    prose: [["회의 일정", "면담 일정"], ["다섯 줄", "여섯 줄"]],
  },
  {
    slug: "moa-features",
    type: "README 조각",
    title: "모아 메모 기능",
    target: "# 모아 메모 기능\n\n- 메모를 태그로 묶는다\n- 지운 메모를 30일 동안 보관한다\n- 글자 크기를 바꾼다",
    prose: [["30일", "14일"], ["글자 크기", "글꼴"]],
  },
]

export const listCards = markCards("list", listDocs)
