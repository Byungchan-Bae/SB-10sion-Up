# HANDOFF

작업을 넘길 때마다 이 파일을 갱신하세요. AI에게 "HANDOFF.md를 최신으로 정리해줘"라고 요청하면 됩니다.

## 현재 작업

- 브랜치: `feat/onboarding` (1단계 완료, PR 리뷰 대기)
- 작업자: Byungchan-Bae + Claude Code
- 마지막 갱신: 2026-11-05

## 끝난 것

- Turborepo + React + TypeScript + Vite 기본 구조, Vercel 자동 배포 (https://sb-10sion-up.vercel.app)
- 1단계: 디자인 토큰(`apps/web/src/styles/tokens.css`), 공통 컴포넌트(MobileFrame, Button, PageHeader, Asset),
  라우팅(`/` → `/onboarding` → `/nickname` → `/home`), 스플래시 · 온보딩 3장(스와이프 지원) · 닉네임 화면
- 닉네임은 localStorage(`sb-treasure:nickname`)에 저장. 저장돼 있으면 스플래시 후 바로 `/home`
- `/home`은 임시 화면 (2단계에서 교체)

## 다음 할 일

- [x] 1단계: 기반 + 온보딩
- [ ] 2단계: 홈 + 에피소드 (`docs/prompts/figma-ui.md`의 2단계 프롬프트, 브랜치 `feat/episode`)
- [ ] 3단계: 탐험 지도 + 장소 인증 + 역사 이야기
- [ ] 4단계: 문제 풀이 + 단서 발견
- [ ] Figma에서 에셋 내보내서 `apps/web/public/assets/`에 넣기 (목록: `docs/design/ASSETS.md`)

## 막힌 점 / 메모

- 일러스트 에셋이 아직 없어서 회색 줄무늬 자리표시(이미지)와 그라데이션(배경)으로 보임. 파일만 넣으면 자동 교체됨.
- 색상 코드는 컨셉 이미지에서 추정한 값. Figma 실제 값을 알면 `tokens.css`만 고치면 됨.
- 화면 제목 글꼴은 Pretendard(CDN). 디자인의 둥근 손글씨 느낌 글꼴은 로고 이미지로 처리.
- 화면 수치는 컨셉 이미지를 393×852 기준으로 환산해서 맞춤. 버튼 높이 56px, 좌우 여백 36px.
- 로컬 테스트 시 닉네임 초기화: 브라우저 콘솔에서 `localStorage.clear()`.
