# AGENTS.md

SB 10sion Up — 성북 SB 스타트업 네트워킹 해커톤용 모바일 웹앱.
이 파일은 Claude Code, Codex 등 AI 코딩 도구가 공통으로 따르는 규칙입니다.

## 작업 시작 전에 반드시

1. `HANDOFF.md`를 읽고 이전 사람이 하던 작업과 다음 할 일을 파악한다.
2. `git log -5 --oneline`, `git status`로 현재 브랜치 상태를 확인한다.

## 디자인 기준

- Figma 컨셉 이미지: `docs/design/*.webp`. 화면은 이 이미지와 최대한 똑같이 구현한다.
- 구현 단계와 상세 요구사항: `docs/prompts/figma-ui.md`

## 기술 스택

- React 19 + TypeScript + Vite (프론트)
- Vercel Functions (백엔드 API, `apps/web/api/`)
- Turborepo + pnpm workspace (모노레포)
- 배포: Vercel (`main` push → 프로덕션, PR → Preview)

## 구조

```
apps/web/src/        화면 (React 컴포넌트, .tsx)
apps/web/api/        API. 파일 하나 = /api/<파일이름>
packages/types/      프론트와 API가 공유하는 타입 (@sb/types)
```

API 파일은 Web 표준 형식으로 작성한다:

```ts
export function GET(request: Request) {
  return Response.json({ ok: true });
}
```

## 명령어 (저장소 루트에서)

- `pnpm install` — 의존성 설치 (npm, yarn 사용 금지)
- `pnpm dev` — 개발 서버 (화면 + API, http://localhost:5173)
- `pnpm build` — 타입체크 + 빌드. **작업을 끝내기 전에 반드시 통과시킬 것**
- `pnpm typecheck` — 타입체크만

## 규칙

- 모바일 우선. 화면 폭 375px 기준으로 확인한다.
- 프론트와 API가 주고받는 데이터 타입은 `packages/types/src/index.ts`에 정의하고 양쪽에서 `import type`으로 쓴다.
- `main`에 직접 커밋하지 않는다. `feat/…`, `fix/…`, `design/…` 브랜치에서 작업한다.
- 커밋 메시지는 한국어 한 줄로, 무엇을 했는지 쓴다.
- API 키 등 비밀값은 코드에 넣지 않는다. Vercel 환경변수 + `vercel env pull`.
- 요청받지 않은 대규모 리팩터링이나 라이브러리 추가는 하지 않는다.

## 작업을 마치거나 토큰이 떨어지기 전에

1. `HANDOFF.md`를 최신 상태로 갱신한다 (한 일 / 다음 할 일 / 막힌 점).
2. 빌드가 안 되더라도 작업 브랜치에 커밋하고 push한다 (`WIP: …`).
