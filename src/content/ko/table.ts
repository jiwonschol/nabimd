import { markCards, type KoDoc } from "./build"

/**
 * 기호 "표": 머리 줄, 구분 줄, 본문 줄. 채점은 `tableShape`로 머리 칸 수와
 * 본문 행 수를 본다(계획서 §4.2) — 본문이 빠졌거나 칸 수가 다르면 실패다.
 */
export const tableDocs: readonly KoDoc[] = [
  {
    slug: "weekly-menu",
    type: "식단표",
    title: "주간 식단",
    target: "# 주간 식단\n\n| 요일 | 메뉴 |\n| --- | --- |\n| 월 | 국수 |\n| 화 | 김밥 |\n| 수 | 카레 |",
    prose: [["국수", "비빔밥"], ["카레", "볶음밥"]],
  },
  {
    slug: "grocery-prices",
    type: "장보기 메모",
    title: "장보기 가격",
    target: "# 장보기 가격\n\n| 품목 | 가격 |\n| --- | --- |\n| 우유 | 2,800원 |\n| 달걀 | 6,500원 |",
    prose: [["2,800원", "3,100원"], ["6,500원", "7,200원"]],
  },
  {
    slug: "trip-costs",
    type: "여행 계획",
    title: "여행 경비",
    target: "# 여행 경비\n\n| 항목 | 금액 | 낸 사람 |\n| --- | --- | --- |\n| 숙소 | 12만 원 | 나 |\n| 기차 | 8만 원 | 동생 |",
    prose: [["12만 원", "15만 원"], ["동생", "언니"]],
  },
  {
    slug: "task-split",
    type: "회의 메모",
    title: "업무 나누기",
    target: "# 업무 나누기\n\n| 일 | 맡은 팀 | 마감 |\n| --- | --- | --- |\n| 시안 | 디자인팀 | 금 |\n| 문구 | 기획팀 | 목 |",
    prose: [["시안", "화면"], ["기획팀", "홍보팀"]],
  },
  {
    slug: "device-repro",
    type: "버그 신고",
    title: "기기별 재현",
    target: "# 기기별 재현\n\n| 기기 | 결과 |\n| --- | --- |\n| 휴대폰 | 멈춤 |\n| 태블릿 | 정상 |\n| 노트북 | 정상 |",
    prose: [["멈춤", "꺼짐"], ["노트북", "컴퓨터"]],
  },
  {
    slug: "moa-shortcuts",
    type: "README 조각",
    title: "모아 메모 단축키",
    target: "# 단축키\n\n| 키 | 동작 |\n| --- | --- |\n| Ctrl+S | 저장 |\n| Ctrl+F | 찾기 |",
    prose: [["저장", "보관"], ["찾기", "검색"]],
  },
  {
    slug: "books-this-year",
    type: "독서 메모",
    title: "올해 읽은 책",
    target: "# 올해 읽은 책\n\n| 책 | 별점 |\n| --- | --- |\n| 작은 숲 | 5 |\n| 먼 바다의 편지 | 4 |",
    prose: [["작은 숲", "푸른 숲"], ["먼 바다의 편지", "긴 겨울의 편지"]],
  },
  {
    slug: "ai-schedule-table",
    type: "AI에게 보내는 요청문",
    title: "일정표 정리 요청",
    target: "# 요청: 일정표 정리\n\n| 날짜 | 할 일 |\n| --- | --- |\n| 3일 | 자료 모으기 |\n| 5일 | 초안 쓰기 |\n\n이 표에 담당 칸을 더해 다시 쓴다.",
    prose: [["자료 모으기", "자료 찾기"], ["초안 쓰기", "초안 다듬기"]],
  },
]

export const tableCards = markCards("table", tableDocs)
