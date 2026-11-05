import type { CreateUserRequest, CreateUserResponse } from "@sb/types";
import { connect, error, sha256 } from "../server/db.js";
import { checkNickname } from "../server/nickname.js";

// POST /api/users  { nickname } → { userId, nickname, token }
// 닉네임은 랭킹에 공개되므로 금칙어와 중복을 확인한다. 이미 있으면 409.
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<CreateUserRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const check = checkNickname(input.nickname);
  if (!check.ok) return error(400, check.message);
  const { nickname, key } = check;

  // 테이블이 없으면 만든다 (마이그레이션 도구를 붙이기 전까지 임시)
  await sql`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname text NOT NULL,
    token_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  // 같은 닉네임이 없을 때만 넣는다. 이미 겹치는 옛 기록이 있을 수 있어서 UNIQUE 제약은 걸지 않았다.
  const token = crypto.randomUUID();
  const rows = await sql`INSERT INTO users (nickname, token_hash)
    SELECT ${nickname}::text, ${await sha256(token)}::text
    WHERE NOT EXISTS (
      SELECT 1 FROM users WHERE lower(regexp_replace(nickname, '[[:space:]]', '', 'g')) = ${key}::text
    )
    RETURNING id`;
  if (!rows.length) return error(409, "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요");

  const body: CreateUserResponse = { userId: rows[0].id as string, nickname, token };
  return Response.json(body, { status: 201 });
}
