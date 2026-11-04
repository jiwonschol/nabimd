import { markCards, type KoDoc } from "./build"

/** 기호 "번호 목록": 순서가 있는 단계를 1. 2. 3. 으로 쓴다. */
export const orderedListDocs: readonly KoDoc[] = [
  {
    slug: "ramen",
    type: "레시피",
    title: "라면 끓이기",
    target: "# 라면 끓이기\n\n1. 물 500mL를 끓인다\n2. 면과 수프를 넣는다\n3. 4분 뒤 불을 끈다",
    prose: [["500mL", "550mL"], ["4분", "3분"]],
  },
  {
    slug: "moa-install",
    type: "README 조각",
    title: "모아 메모 설치",
    target: "# 모아 메모 설치\n\n1. 설치 파일을 내려받는다\n2. 파일을 두 번 눌러 연다\n3. 안내에 따라 다음을 누른다",
    prose: [["내려받는다", "받아 둔다"], ["두 번 눌러", "골라서"]],
  },
  {
    slug: "photo-upload-bug",
    type: "버그 신고",
    title: "사진 올리기 오류",
    target: "# 사진이 안 올라간다\n\n1. 새 글을 연다\n2. 사진 두 장을 고른다\n3. 올리기를 누르면 멈춘다",
    prose: [["새 글", "빈 글"], ["두 장", "세 장"]],
  },
  {
    slug: "day-trip",
    type: "여행 계획",
    title: "당일치기 일정",
    target: "# 당일치기 일정\n\n1. 아침 8시 기차를 탄다\n2. 시장에서 점심을 먹는다\n3. 해 질 녘 바닷가를 걷는다\n4. 저녁 7시 기차로 돌아온다",
    prose: [["아침 8시", "아침 9시"], ["시장", "골목 식당"]],
  },
  {
    slug: "monday-order",
    type: "할 일",
    title: "월요일 할 일 순서",
    target: "# 월요일 할 일 순서\n\n1. 메일 답장\n2. 견적서 보내기\n3. 회의 자료 인쇄",
    prose: [["견적서", "계약서"], ["인쇄", "복사"]],
  },
  {
    slug: "quarter-agenda",
    type: "회의 메모",
    title: "분기 회의 안건",
    target: "# 분기 회의 안건\n\n1. 지난 분기 매출 정리\n2. 새 매장 후보 검토\n3. 다음 회의 날짜",
    prose: [["매출", "지출"], ["새 매장", "새 창고"]],
  },
  {
    slug: "ai-slides",
    type: "AI에게 보내는 요청문",
    title: "발표 자료 정리 요청",
    target: "# 요청: 발표 자료 정리\n\n1. 슬라이드 내용을 다섯 줄로 줄인다\n2. 줄마다 핵심어를 하나 고른다\n3. 마지막에 질문 두 개를 덧붙인다",
    prose: [["다섯 줄", "여섯 줄"], ["질문 두 개", "질문 세 개"]],
  },
  {
    slug: "room-booking",
    type: "공지",
    title: "회의실 예약 방법",
    target: "# 회의실 예약 방법\n\n1. 사내 게시판에서 예약표를 연다\n2. 빈 시간을 고른다\n3. 이름과 용도를 적는다",
    prose: [["사내 게시판", "공용 게시판"], ["용도", "인원"]],
  },
]

export const orderedListCards = markCards("ordered-list", orderedListDocs)
