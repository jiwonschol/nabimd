import { markCards, type KoDoc } from "./build"

/** 기호 "이미지": ![대체 글](주소). 주소는 모두 example.com 아래다. */
export const imageDocs: readonly KoDoc[] = [
  {
    slug: "potato-pancake",
    type: "레시피",
    title: "감자전",
    target: "# 감자전\n\n![노릇하게 부친 감자전](https://example.com/img/potato.jpg)\n\n감자 두 개를 갈아 얇게 부친다.",
    prose: [["두 개", "세 개"], ["얇게", "넓게"]],
  },
  {
    slug: "overlap-bug",
    type: "버그 신고",
    title: "단추 겹침",
    target: "# 단추가 겹친다\n\n![겹친 단추 화면](https://example.com/img/bug-12.png)\n\n작은 화면에서만 겹친다.",
    prose: [["작은 화면", "좁은 화면"], ["겹친다.", "포개진다."]],
  },
  {
    slug: "lake-walk",
    type: "여행 계획",
    title: "호숫가 산책",
    target: "# 호숫가 산책\n\n![호숫가 산책 지도](https://example.com/img/lake-map.png)\n\n한 바퀴에 40분 걸린다.",
    prose: [["한 바퀴", "한 번 도는 데"], ["40분", "50분"]],
  },
  {
    slug: "moa-screen",
    type: "README 조각",
    title: "모아 메모 화면",
    target: "# 모아 메모 화면\n\n![메모 목록 화면](https://example.com/img/list.png)\n\n왼쪽에서 메모를 고른다.",
    prose: [["왼쪽", "오른쪽"], ["고른다", "연다"]],
  },
  {
    slug: "lost-umbrella",
    type: "공지",
    title: "분실물 안내",
    target: "# 분실물 안내\n\n![검은 우산](https://example.com/img/umbrella.jpg)\n\n1층 안내 데스크에 맡겨 두었다.",
    prose: [["1층", "2층"], ["안내 데스크", "관리실"]],
  },
  {
    slug: "book-covers",
    type: "독서 메모",
    title: "책 표지 모음",
    target: "# 책 표지 모음\n\n![작은 숲 표지](https://example.com/img/forest.jpg)\n![먼 바다의 편지 표지](https://example.com/img/sea.jpg)\n\n둘 다 이번 달에 읽었다.",
    prose: [["이번 달", "지난달"], ["둘 다", "두 권 모두"]],
  },
  {
    slug: "draft-meeting",
    type: "회의 메모",
    title: "시안 회의",
    target: "# 시안 회의\n\n고른 시안은 아래 그림이다.\n\n![흰 바탕 시안](https://example.com/img/draft-a.png)",
    prose: [["고른 시안", "정한 시안"], ["아래 그림", "다음 그림"]],
  },
  {
    slug: "ai-describe-image",
    type: "AI에게 보내는 요청문",
    title: "그림 설명 요청",
    target: "# 요청: 그림 설명\n\n![창가의 화분](https://example.com/img/plant.jpg)\n\n이 그림을 한 문장으로 설명한다.",
    prose: [["한 문장", "두 문장"], ["설명한다", "묘사한다"]],
  },
]

export const imageCards = markCards("image", imageDocs)
