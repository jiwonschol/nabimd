import { markCards, type KoDoc } from "./build"

/** 기호 "제목": 문서 제목 # 과 구획 제목 ## 를 함께 쓴다. */
export const headingDocs: readonly KoDoc[] = [
  {
    slug: "weekly-meeting",
    type: "회의 메모",
    title: "주간 회의",
    target: "# 주간 회의\n\n## 결정\n다음 주부터 회의는 30분으로 줄인다.\n\n## 할 일\n회의록은 금요일까지 공유한다.",
    prose: [["30분", "20분"], ["금요일", "목요일"]],
  },
  {
    slug: "island-trip",
    type: "여행 계획",
    title: "바람섬 여행",
    target: "# 바람섬 여행\n\n## 첫째 날\n오후에 도착해 숙소에 짐을 푼다.\n\n## 둘째 날\n아침 일찍 오름에 오른다.",
    prose: [["숙소", "민박"], ["오름", "등대"]],
  },
  {
    slug: "moa-memo-readme",
    type: "README 조각",
    title: "모아 메모 안내",
    target: "# 모아 메모\n\n## 설치\n내려받은 파일을 풀고 앱 폴더로 옮긴다.\n\n## 사용\n메모를 쓰고 저장 단추를 누른다.",
    prose: [["앱 폴더", "응용 프로그램 폴더"], ["저장 단추", "완료 단추"]],
  },
  {
    slug: "rolled-omelet",
    type: "레시피",
    title: "달걀말이",
    target: "# 달걀말이\n\n## 재료\n달걀 세 개, 소금 조금, 대파 반 줄.\n\n## 만들기\n달걀을 풀어 약한 불에 말아 익힌다.",
    prose: [["대파 반 줄", "당근 조금"], ["약한 불", "중간 불"]],
  },
  {
    slug: "save-bug",
    type: "버그 신고",
    title: "저장 오류",
    target: "# 저장이 안 된다\n\n## 증상\n메모를 저장하면 빈 화면이 뜬다.\n\n## 재현\n새 메모를 쓰고 바로 닫는다.",
    prose: [["빈 화면", "오류 창"], ["바로 닫는다", "곧장 뒤로 간다"]],
  },
  {
    slug: "ai-minutes-summary",
    type: "AI에게 보내는 요청문",
    title: "회의록 요약 요청",
    target: "# 요청: 회의록 요약\n\n## 목표\n회의록을 세 줄로 줄인다.\n\n## 조건\n결정 사항은 빼지 않는다.\n\n## 결과\n줄마다 한 문장으로 쓴다.",
    prose: [["세 줄", "다섯 줄"], ["한 문장", "짧은 문장"]],
  },
  {
    slug: "small-forest-notes",
    type: "독서 메모",
    title: "작은 숲 독서 메모",
    target: "# 작은 숲 읽기\n\n## 줄거리\n숲을 지키는 아이가 마을을 떠난다.\n\n## 느낀 점\n끝까지 다정한 결말이 좋았다.",
    prose: [["마을", "고향"], ["다정한", "조용한"]],
  },
  {
    slug: "office-move",
    type: "공지",
    title: "사무실 이전",
    target: "# 사무실 이전 안내\n\n## 날짜\n다음 달 첫째 주 월요일이다.\n\n## 준비\n개인 짐은 금요일까지 상자에 담는다.",
    prose: [["월요일", "화요일"], ["상자", "바구니"]],
  },
]

export const headingCards = markCards("heading", headingDocs)
