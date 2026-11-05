# SB 10sion Up

성북 SB 스타트업 네트워킹 해커톤 — 모바일 웹앱 (React + TypeScript + Turborepo, Vercel 배포)

## 구조

```
apps/web/            React + Vite 프론트엔드
apps/web/api/        백엔드 API (Vercel Functions) — 파일 하나 = 엔드포인트 하나
packages/types/      프론트·백엔드 공용 타입 (@sb/types)
```

## 처음 세팅

```bash
npm i -g pnpm        # 처음 한 번
pnpm install
pnpm dev             # http://localhost:5173 (API 포함)
```

같은 와이파이의 핸드폰에서는 터미널의 `Network:` 주소(예: `http://192.168.x.x:5173`)로 접속하세요.

## API 추가하기

`apps/web/api/hello.ts` 파일을 만들면 `/api/hello` 가 됩니다.

```ts
export function GET(request: Request) {
  return Response.json({ hello: "world" });
}
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(body, { status: 201 });
}
```

## 명령어

| 명령 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 (프론트 + API) |
| `pnpm build` | 타입체크 + 프로덕션 빌드 |
| `pnpm typecheck` | 타입체크만 |

## 배포 (Vercel)

- `main`에 push → 프로덕션 자동 배포
- 브랜치/PR → Preview URL 자동 생성 (핸드폰으로 바로 확인)
- Vercel 프로젝트 설정: Root Directory = `apps/web`
