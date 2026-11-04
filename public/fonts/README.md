# 글꼴 파일의 출처

Level 1 재설계(계획서 `dev-docs/plans/2026-11-03-level-1-redesign.md` §4.7)가 쓰는 두 글꼴이다. 라이선스는 둘 다 SIL Open Font License 1.1이고 원문은 각 폴더의 `LICENSE.txt`에 있다.

## pretendard/

- 파일: `PretendardVariable.subset.woff2` (443 KB, 가변 굵기 45~920)
- 출처: onsoonlabs 허브 저장소 `site/assets/fonts/PretendardVariable.subset.woff2`를 그대로 복사했다. 허브와 같은 파일을 쓰므로 onsoonlabs.com 안에서 글꼴 모양이 같다.
- 담은 글자: fonttools로 확인한 결과 KS X 1001 한글 2,350자 전부와 기본 라틴·숫자·문장 부호를 담는다(글리프 2,729개). 2,350자 밖의 한글 음절은 시스템 글꼴로 대체된다.
- 원 저작권: Kil Hyung-jin, Reserved Font Name "Pretendard".

## d2coding/

- 파일: `D2CodingWeb.subset.woff2` (304 KB, 400), `D2CodingBoldWeb.subset.woff2` (317 KB, 700)
- 출처: naver/d2codingfont 릴리스 `D2Coding Ver 1.4.0` (2026-10-03, `D2Coding-Ver1.4.0-20261003.zip`)의 `D2Coding/D2Coding-Ver1.4.0-20261003.ttf`와 `D2CodingBold-Ver1.4.0-20261003.ttf`.
- 만든 방법: `pyftsubset`(fonttools)으로 아래 유니코드 범위만 남기고 woff2로 바꿨다. 원본 TTF는 각 4.1 MB, 글리프 26,190개다.
  - `U+0000-024F` 라틴 기본·확장 A, `U+02C0-02FF`, `U+0300-036F`
  - `U+2000-206F` 일반 문장 부호, `U+20A0-20CF` 통화 기호(₩ 포함), `U+2190-21FF` 화살표, `U+2200-22FF` 수학 기호, `U+2500-25FF` 상자 그리기·도형
  - `U+3000-303F` CJK 기호, `U+3130-318F` 한글 호환 자모
  - `U+AC00-D7A3` 한글 음절 11,172자 전부 (에디터에서는 드문 음절도 폭이 맞아야 해서 줄이지 않았다)
  - `U+FF00-FFEF` 전각 기호
- 이름: OFL의 Reserved Font Name 조항(원본은 "D2Coding"·"D2Coding-Bold"를 예약한다)에 따라, 수정본인 이 subset의 글꼴 이름표(name 테이블 1·3·4·6·16)를 "D2Coding Web"으로 바꿨다. CSS에서도 `font-family: "D2Coding Web"`으로 부른다.
- 원 저작권: NAVER Corporation.
