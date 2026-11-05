# HANDOFF

작업을 넘길 때마다 이 파일을 갱신하세요. AI에게 "HANDOFF.md를 최신으로 정리해줘"라고 요청하면 됩니다.

## 현재 작업

- 브랜치: `feat/place` (3단계 완료). `feat/onboarding` → `feat/episode` → `feat/place` 순서로 쌓여 있어서 PR도 이 순서로 머지
- 작업자: Byungchan-Bae + Claude Code
- 마지막 갱신: 2026-11-05

## 끝난 것

- Turborepo + React + TypeScript + Vite 기본 구조, Vercel 자동 배포 (https://sb-10sion-up.vercel.app)
- 1단계: 디자인 토큰(`apps/web/src/styles/tokens.css`), 공통 컴포넌트(MobileFrame, Button, PageHeader, Asset),
  라우팅(`/` → `/onboarding` → `/nickname` → `/home`), 스플래시 · 온보딩 3장(스와이프 지원) · 닉네임 화면
- 닉네임은 localStorage(`sb-treasure:nickname`)에 저장. 저장돼 있으면 스플래시 후 바로 `/home`
- `/home`은 임시 화면 (2단계에서 교체)
- 1단계 화면을 Figma "최종" 섹션과 1px 단위로 맞춤. 에셋 10개를 Figma MCP로 가져옴 (`docs/design/ASSETS.md`에 노드 ID 정리)
- 색상, 글꼴, 버튼 크기를 Figma 실제 값으로 교체 (`tokens.css`)
- 2단계: 홈(`/home`), 에피소드 상세(`/episode/ep01`), 의문의 편지(`/episode/ep01/intro`), 하단 탭바(홈/지도/수집물/랭킹)
- 에피소드 타입과 데이터 확정: `apps/web/src/data/episodes.ts` (Episode, Place, Quiz, Clue). 장소 좌표는 대략값
- `Stage` 컴포넌트: Figma 390 × 844 좌표를 그대로 absolute로 쓰고 화면 크기에 맞게 확대/축소. 탭 화면은 `<Stage footer={<TabBar />}>`
- 수집물/랭킹 탭은 "곧 열려요" 임시 화면
- 3단계: 탐험 지도(`/map`, `/episode/ep01/map`), 장소 도착 인증(`/place/:id`), 역사 내용(`/place/:id/story`)
- 진행 상태: `apps/web/src/lib/progress.ts` (localStorage `sb-treasure:progress`: 시작 시각, 인증한 장소, 찾은 단서). 앞 장소 단서를 찾아야 다음 장소가 열림
- 위치 인증: `lib/geo.ts` 하버사인 거리 150m 이내 통과. URL에 `?demo=1`이면 위치 확인 생략 (시연용)
- `/place/:id/quiz`는 임시 화면: "단서 찾은 걸로 처리" 버튼으로 다음 장소를 열 수 있음. 4단계에서 문제 화면으로 교체

## 다음 할 일

- [x] 1단계: 기반 + 온보딩
- [x] 2단계: 홈 + 에피소드
- [x] 3단계: 탐험 지도 + 장소 인증 + 역사 이야기
- [ ] 장소 좌표 · 주소 확인 (`data/episodes.ts`의 TODO. 길상사 주소만 확인됨)
- [ ] 4단계: 문제 풀이 + 단서 발견 (브랜치 `feat/quiz`, Figma 노드는 `docs/design/ASSETS.md` 표. `QuizPlaceholder` 교체)
- [x] 1단계 에셋을 Figma에서 가져오기

## 막힌 점 / 메모

- 글꼴은 Figma와 같은 NanumHuman(jsDelivr CDN, 400/800/900). 없으면 Pretendard로 대체.
- 색상 코드와 크기는 Figma 값. 바꿀 땐 `apps/web/src/styles/tokens.css`만 수정.
- 화면 수치는 390 × 844(Figma 프레임) 기준. 버튼 316 × 61, 좌우 여백 37px.
- Figma `download_assets`로 받은 이미지는 투명도가 사라짐. 로고, 마스코트 같은 투명 에셋은 원본 이미지를 crop해야 함 (`docs/design/ASSETS.md`).
- Figma 온보딩 1번 프레임(136:2309)엔 설명 박스와 점이 빠져 있어서 2, 3번 프레임 값으로 통일함.
- 4단계 이후 화면 프레임 노드 ID는 `docs/design/ASSETS.md` 아래쪽 표 참고.
- 역사 내용 화면은 Figma "최종"에 프레임이 없어서 컨셉 이미지(03-place-gilsangsa.webp) 기준으로 만듦. 위쪽은 인증 화면과 같음.
- Figma 길상사 주소 "성북로 131"은 실제 주소(선잠로5길 68)와 달라서 실제 주소를 씀.
- 장소 좌표는 대략값이라 현장 테스트 전에 꼭 확인. 나머지 3곳 사진은 저해상도 임시.
- Figma 제목 글꼴 "Jalnan 2"는 CDN에 없어서 "Jalnan"(잘난체, fonts-archive)으로 대체. 인용 부호 글꼴 KFAGothic은 NanumHuman으로 대체.
- 상세 화면 인용문 뒤 흰 사각형(136:2449)은 Figma 렌더에 안 보여서 뺐음.
- 홈 에피소드 카드는 지금 1개라 점 3개는 고정 표시. 에피소드가 늘면 온보딩처럼 스와이프로 바꾸면 됨.
- 로컬 테스트 시 닉네임 초기화: 브라우저 콘솔에서 `localStorage.clear()`.
