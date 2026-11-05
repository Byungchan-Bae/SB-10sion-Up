// API(apps/web/api/*.ts)들이 함께 쓰는 DB 코드. api/ 밖에 있어서 Vercel 함수(주소)로는 안 열린다.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { ApiError, EpisodeProgress } from "@sb/types";
import type { Episode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요

export type Sql = NeonQueryFunction<false, false>;
export type Row = Record<string, unknown>;

export function error(status: number, message: string) {
  const body: ApiError = { error: message };
  return Response.json(body, { status });
}

/** DATABASE_URL이 없으면 null */
export function connect(): Sql | null {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 닉네임 등록 때 받은 token(헤더 Authorization: Bearer)이 이 userId의 것인지 확인 */
export async function isUser(sql: Sql, userId: unknown, request: Request): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (typeof userId !== "string" || !UUID.test(userId) || !token) return false;
  // DB 오류는 여기서 삼키지 않는다. 401로 바꾸면 장애가 "닉네임 미등록"처럼 보인다.
  const rows = await sql`SELECT id FROM users WHERE id = ${userId}::uuid AND token_hash = ${await sha256(token)}`;
  return rows.length > 0;
}

/** 진행 상태 테이블이 없으면 만든다 (마이그레이션 도구를 붙이기 전까지 임시) */
export async function ensureProgressTables(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS episode_progress (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_id text NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    points int,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, episode_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS place_progress (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_id text NOT NULL,
    place_id text NOT NULL,
    verified_at timestamptz,
    clue_at timestamptz,
    note text,
    PRIMARY KEY (user_id, place_id)
  )`;
  // 시연 모드(?demo=1)로 인증한 적 있는 사용자. 위치 확인을 건너뛰었으므로 랭킹에 넣지 않는다.
  await sql`CREATE TABLE IF NOT EXISTS demo_users (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

const ms = (v: unknown) => (v ? new Date(v as string).getTime() : undefined);

/** DB에 저장된 진행 상태를 화면에서 쓰는 모양으로 */
export async function loadProgress(sql: Sql, userId: string, episode: Episode): Promise<EpisodeProgress> {
  const [ep] = await sql`SELECT started_at, completed_at, points FROM episode_progress
    WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`;
  const places = await sql`SELECT place_id, verified_at, clue_at, note FROM place_progress
    WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`;

  // 에피소드의 장소 순서대로 정렬
  const order = episode.places.map((p) => p.id);
  places.sort((a, b) => order.indexOf(a.place_id as string) - order.indexOf(b.place_id as string));

  const notes: Record<string, string> = {};
  for (const p of places) if (p.note) notes[p.place_id as string] = p.note as string;
  return {
    startedAt: ms(ep?.started_at),
    verified: places.filter((p) => p.verified_at).map((p) => p.place_id as string),
    clues: places.filter((p) => p.clue_at).map((p) => p.place_id as string),
    notes,
    completedAt: ms(ep?.completed_at),
    points: (ep?.points as number | null) ?? undefined,
  };
}

/** 에피소드 시작 시각을 남긴다 (이미 있으면 더 이른 쪽 유지) */
export async function markStarted(sql: Sql, userId: string, episodeId: string, at: Date = new Date()) {
  await sql`INSERT INTO episode_progress (user_id, episode_id, started_at)
    VALUES (${userId}::uuid, ${episodeId}, ${at.toISOString()})
    ON CONFLICT (user_id, episode_id) DO UPDATE SET
      started_at = LEAST(episode_progress.started_at, EXCLUDED.started_at),
      updated_at = now()`;
}
