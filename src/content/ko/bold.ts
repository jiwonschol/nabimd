import { markCards, type KoDoc } from "./build"

/**
 * 기호 "굵게". 굵게 감싼 말 바로 뒤에는 공백·문장부호·줄 끝만 온다.
 * 조사를 붙이면 `**`는 되지만 같은 뜻의 `__` 표기가 닫히지 않는다.
 */
export const boldDocs: readonly KoDoc[] = [
  {
    slug: "elevator-check",
    type: "공지",
    title: "엘리베이터 점검",
    target: "# 엘리베이터 점검\n\n**목요일 오전 10시부터** 두 시간 동안 멈춘다.\n계단을 이용한다.",
    prose: [["두 시간", "세 시간"], ["계단", "옆 동 엘리베이터"]],
  },
  {
    slug: "weekly-deadlines",
    type: "할 일",
    title: "이번 주 마감",
    target: "# 이번 주 할 일\n\n보고서 초안은 **수요일까지** 낸다.\n발표는 **금요일 오전**, 회의실에서 한다.",
    prose: [["보고서 초안", "예산안"], ["회의실", "큰 강당"]],
  },
  {
    slug: "evening-groceries",
    type: "장보기 메모",
    title: "저녁 장보기",
    target: "# 저녁 장보기\n\n두부, 애호박, 양파를 산다.\n**우유는 꼭** 산다.",
    prose: [["애호박", "버섯"], ["양파", "대파"]],
  },
  {
    slug: "design-meeting",
    type: "회의 메모",
    title: "디자인 회의",
    target: "# 디자인 회의\n\n**결정**: 첫 화면은 흰 바탕으로 간다.\n다음 회의에서 글꼴을 고른다.",
    prose: [["흰 바탕", "밝은 바탕"], ["글꼴", "아이콘"]],
  },
  {
    slug: "kimchi-fried-rice",
    type: "레시피",
    title: "김치볶음밥",
    target: "# 김치볶음밥\n\n김치와 밥을 볶다가 달걀을 올린다.\n**센 불은 쓰지 않는다.**",
    prose: [["달걀", "김 가루"], ["센 불은", "기름은 많이"]],
  },
  {
    slug: "login-button-bug",
    type: "버그 신고",
    title: "로그인 단추 오류",
    target: "# 로그인 단추 오류\n\n**휴대폰에서만** 단추가 눌리지 않는다.\n컴퓨터에서는 잘 된다.",
    prose: [["휴대폰에서만", "태블릿에서만"], ["컴퓨터", "노트북"]],
  },
  {
    slug: "island-packing",
    type: "여행 계획",
    title: "바람섬 여행 준비",
    target: "# 바람섬 여행 준비\n\n챙길 것: **신분증**, 우비, 충전기.\n배 시간: **오전 9시**.",
    prose: [["우비", "모자"], ["오전 9시", "오전 10시"]],
  },
  {
    slug: "ai-notice-edit",
    type: "AI에게 보내는 요청문",
    title: "공지문 다듬기 요청",
    target: "# 요청: 공지문 다듬기\n\n아래 공지를 짧게 고친다.\n**날짜와 장소는 바꾸지 않는다.**\n결과는 다섯 줄 안으로 준다.",
    prose: [["짧게", "읽기 쉽게"], ["다섯 줄", "네 줄"]],
  },
]

export const boldCards = markCards("bold", boldDocs)
