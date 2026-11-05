import { neon } from "@neondatabase/serverless";
import type { ApiError, CreateUserRequest, CreateUserResponse } from "@sb/types";

const MAX_NICKNAME = 10;

function error(status: number, message: string) {
  const body: ApiError = { error: message };
  return Response.json(body, { status });
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /api/users  { nickname } → { userId, nickname, token }
export async function POST(request: Request): Promise<Response> {
  const url = process.env.DATABASE_URL;
  if (!url) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<CreateUserRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
  if (!nickname || [...nickname].length > MAX_NICKNAME) {
    return error(400, `닉네임은 1~${MAX_NICKNAME}자로 입력해 주세요`);
  }

  const sql = neon(url);
  // 테이블이 없으면 만든다 (마이그레이션 도구를 붙이기 전까지 임시)
  await sql`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname text NOT NULL,
    token_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  const token = crypto.randomUUID();
  const rows = await sql`INSERT INTO users (nickname, token_hash)
    VALUES (${nickname}, ${await sha256(token)})
    RETURNING id`;

  const body: CreateUserResponse = { userId: rows[0].id as string, nickname, token };
  return Response.json(body, { status: 201 });
}
