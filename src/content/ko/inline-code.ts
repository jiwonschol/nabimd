import { markCards, type KoDoc } from "./build"

/** 기호 "코드": 명령어·파일 이름·단추 이름을 백틱으로 감싼다. */
export const inlineCodeDocs: readonly KoDoc[] = [
  {
    slug: "moa-run",
    type: "README 조각",
    title: "모아 메모 실행",
    target: "# 모아 메모 실행\n\n터미널에서 `./start.sh`를 실행한다.\n설정은 `config.txt`에서 바꾼다.",
    prose: [["터미널", "명령 창"], ["바꾼다", "고친다"]],
  },
  {
    slug: "export-error",
    type: "버그 신고",
    title: "내보내기 오류",
    target: "# 내보내기 오류\n\n`내보내기` 단추를 누르면 `E42` 오류가 뜬다.\n파일은 만들어지지 않는다.",
    prose: [["단추", "버튼"], ["만들어지지", "저장되지"]],
  },
  {
    slug: "file-cleanup",
    type: "할 일",
    title: "오늘 정리할 파일",
    target: "# 오늘 정리할 파일\n\n`보고서_최종.docx`를 공유 폴더로 옮긴다.\n`임시` 폴더는 비운다.",
    prose: [["공유 폴더", "팀 폴더"], ["비운다", "지운다"]],
  },
  {
    slug: "dev-meeting",
    type: "회의 메모",
    title: "개발 회의 메모",
    target: "# 개발 회의 메모\n\n로그인 화면 이름은 `LoginView`로 정했다.\n작업은 `dev` 브랜치에서 한다.",
    prose: [["로그인 화면", "첫 화면"], ["정했다", "맞췄다"]],
  },
  {
    slug: "ai-function-name",
    type: "AI에게 보내는 요청문",
    title: "함수 이름 요청",
    target: "# 요청: 함수 이름 짓기\n\n메모를 저장하는 함수 이름을 세 개 짓는다.\n`saveNote`처럼 영어 동사로 시작한다.",
    prose: [["저장하는", "지우는"], ["세 개", "다섯 개"]],
  },
  {
    slug: "room-screen",
    type: "공지",
    title: "회의실 화면 연결",
    target: "# 회의실 화면 연결\n\n화면 이름은 `ROOM-3`이다.\n노트북에서 `화면 미러링`을 켠다.",
    prose: [["화면 이름", "장치 이름"], ["노트북", "휴대폰"]],
  },
  {
    slug: "reading-log-file",
    type: "독서 메모",
    title: "독서 기록 파일",
    target: "# 독서 기록 정리\n\n기록은 `books.md` 파일 하나에 모은다.\n책마다 `## 책 이름` 줄로 시작한다.",
    prose: [["파일 하나", "한 파일"], ["시작한다", "연다"]],
  },
  {
    slug: "trip-photos",
    type: "여행 계획",
    title: "여행 사진 정리",
    target: "# 여행 사진 정리\n\n사진은 `가을여행` 폴더에 둔다.\n파일 이름은 `날짜_장소.jpg` 꼴로 바꾼다.",
    prose: [["사진은", "찍은 사진은"], ["바꾼다", "맞춘다"]],
  },
]

export const inlineCodeCards = markCards("inline-code", inlineCodeDocs)
