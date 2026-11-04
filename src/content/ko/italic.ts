import { markCards, type KoDoc } from "./build"

/**
 * 기호 "기울임". 책 이름·용어·말투처럼 결이 다른 말을 기울인다.
 * 감싼 말 바로 뒤에는 공백·문장부호·줄 끝만 온다(`_` 표기도 닫히게).
 */
export const italicDocs: readonly KoDoc[] = [
  {
    slug: "monthly-books",
    type: "독서 메모",
    title: "이번 달 책",
    target: "# 이번 달 책\n\n다 읽은 책: *작은 숲*.\n읽을 책: *먼 바다의 편지*.",
    prose: [["다 읽은 책", "끝낸 책"], ["읽을 책", "다음 책"]],
  },
  {
    slug: "feature-name",
    type: "회의 메모",
    title: "기획 회의 메모",
    target: "# 기획 회의 메모\n\n새 기능 이름: *빠른 메모*.\n출시는 다음 분기로 미룬다.",
    prose: [["새 기능 이름", "기능 이름"], ["다음 분기", "내년 봄"]],
  },
  {
    slug: "tomato-soup",
    type: "레시피",
    title: "토마토 수프",
    target: "# 토마토 수프\n\n토마토를 *뭉근히*, 약한 불에서 끓인다.\n마지막에 바질을 올린다.",
    prose: [["약한 불", "아주 약한 불"], ["바질", "파슬리"]],
  },
  {
    slug: "library-closed",
    type: "공지",
    title: "도서관 휴관",
    target: "# 도서관 휴관\n\n이번 주 토요일: *임시 휴관*.\n반납은 입구 반납함에 한다.",
    prose: [["토요일", "일요일"], ["입구", "정문"]],
  },
  {
    slug: "train-trip",
    type: "여행 계획",
    title: "기차 여행",
    target: "# 기차 여행\n\n목적지는 *은빛 항구*, 오후 2시에 도착한다.\n돌아오는 표는 아직 사지 않았다.",
    prose: [["오후 2시", "오후 3시"], ["돌아오는 표", "귀가 표"]],
  },
  {
    slug: "moa-diary-readme",
    type: "README 조각",
    title: "모아 일기 소개",
    target: "# 모아 일기\n\n하루 한 줄을 남기는 일기장이다.\n이름의 뜻: *모아 두는 하루*.",
    prose: [["한 줄", "한 문장"], ["일기장", "기록장"]],
  },
  {
    slug: "ai-cafe-intro",
    type: "AI에게 보내는 요청문",
    title: "소개글 요청",
    target: "# 요청: 소개글 쓰기\n\n동네 빵집 소개글을 세 문장으로 쓴다.\n말투는 *따뜻하게*, 문장은 짧게 쓴다.",
    prose: [["동네 빵집", "골목 꽃집"], ["세 문장", "네 문장"]],
  },
  {
    slug: "search-bug",
    type: "버그 신고",
    title: "검색 오류",
    target: "# 검색이 안 된다\n\n입력한 검색어: *주간 회의*.\n결과가 하나도 나오지 않는다.",
    prose: [["입력한 검색어", "넣은 검색어"], ["하나도", "전혀"]],
  },
]

export const italicCards = markCards("italic", italicDocs)
