import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { ApiError, EpisodeProgress, ProgressResponse, SyncProgressRequest } from "@sb/types";
import { getEpisode, type Episode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요

/** 문제 2 한 줄 기록 최대 길이 (화면과 같음) */
const MAX_NOTE = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Sql = NeonQueryFunction<false, false>;
type Row = Record<string, unknown>;

function error(status: number, message: string) {
  const body: ApiError = { error: message };
  return Response.json(body, { status });
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 닉네임 등록 때 받은 token이 이 userId의 것인지 확인 */
async function isUser(sql: Sql, userId: unknown, request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (typeof userId !== "string" || !UUID.test(userId) || !token) return false;
  // DB 오류는 여기서 삼키지 않는다. 401로 바꾸면 장애가 "닉네임 미등록"처럼 보인다.
  const rows = (await sql`SELECT id FROM users WHERE id = ${userId}::uuid AND token_hash = ${await sha256(token)}`) as Row[];
  return rows.length > 0;
}

// 테이블이 없으면 만든다 (마이그레이션 도구를 붙이기 전까지 임시)
async function ensureTables(sql: Sql) {
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
}

const ms = (v: unknown) => (v ? new Date(v as string).getTime() : undefined);

/** DB에 저장된 진행 상태를 화면에서 쓰는 모양으로 */
async function load(sql: Sql, userId: string, episode: Episode): Promise<EpisodeProgress> {
  const [ep] = (await sql`SELECT started_at, completed_at, points FROM episode_progress
    WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`) as Row[];
  const places = (await sql`SELECT place_id, verified_at, clue_at, note FROM place_progress
    WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`) as Row[];

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

/** 시각(ms)이 말이 되는 값인지: 숫자이고 미래가 아니며 30일 이내 */
function validTime(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const now = Date.now();
  return v <= now + 60_000 && v > now - 30 * 24 * 3600_000 ? Math.min(v, now) : undefined;
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

// GET /api/progress?userId=&episodeId=  → { episodeId, progress }
export async function GET(request: Request): Promise<Response> {
  const url = process.env.DATABASE_URL;
  if (!url) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const sql = neon(url);
  const userId = params.get("userId");
  if (!(await isUser(sql, userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");
  await ensureTables(sql);

  const body: ProgressResponse = { episodeId: episode.id, progress: await load(sql, userId!, episode) };
  return Response.json(body);
}

// POST /api/progress  { userId, episodeId, progress } → { episodeId, progress }
// 이 기기의 진행 상태를 서버에 저장된 것과 합친다 (한 번 기록된 건 지워지지 않음).
// 같은 내용을 여러 번 보내도 결과가 같아서, 통신이 끊겼다가 다시 보내도 안전하다.
export async function POST(request: Request): Promise<Response> {
  const url = process.env.DATABASE_URL;
  if (!url) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<SyncProgressRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const episode = getEpisode(input.episodeId);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");
  const incoming = (input.progress ?? {}) as Partial<EpisodeProgress>;

  const sql = neon(url);
  if (!(await isUser(sql, input.userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");
  const userId = input.userId!;
  await ensureTables(sql);

  const saved = await load(sql, userId, episode);
  const placeIds = new Set(episode.places.map((p) => p.id));

  // 장소별 기록: 인증 → 단서 순서. 인증 안 된 장소의 단서는 받지 않는다.
  const verified = new Set([...saved.verified, ...strings(incoming.verified).filter((id) => placeIds.has(id))]);
  const clues = new Set([...saved.clues, ...strings(incoming.clues).filter((id) => verified.has(id))]);
  const notes = typeof incoming.notes === "object" && incoming.notes ? incoming.notes : {};

  for (const id of placeIds) {
    const newVerified = verified.has(id) && !saved.verified.includes(id);
    const newClue = clues.has(id) && !saved.clues.includes(id);
    const raw = notes[id];
    const note = typeof raw === "string" && raw.trim() && !saved.notes?.[id] ? [...raw.trim()].slice(0, MAX_NOTE).join("") : null;
    if (!newVerified && !newClue && !note) continue;
    await sql`INSERT INTO place_progress (user_id, episode_id, place_id, verified_at, clue_at, note)
      VALUES (${userId}::uuid, ${episode.id}, ${id},
        ${verified.has(id) ? new Date().toISOString() : null},
        ${clues.has(id) ? new Date().toISOString() : null}, ${note})
      ON CONFLICT (user_id, place_id) DO UPDATE SET
        verified_at = COALESCE(place_progress.verified_at, EXCLUDED.verified_at),
        clue_at = COALESCE(place_progress.clue_at, EXCLUDED.clue_at),
        note = COALESCE(place_progress.note, EXCLUDED.note)`;
  }

  // 시작 시각은 더 이른 쪽. 장소를 인증했는데 시작 시각이 없으면 지금으로.
  let startedAt = [saved.startedAt, validTime(incoming.startedAt)].filter((t): t is number => t !== undefined);
  if (!startedAt.length && verified.size) startedAt = [Date.now()];
  const started = startedAt.length ? Math.min(...startedAt) : undefined;

  // 완료는 단서를 모두 모았을 때만, 한 번만 기록. 포인트는 서버의 에피소드 데이터 기준.
  let completed = saved.completedAt;
  let points = saved.points;
  const allClues = episode.places.every((p) => clues.has(p.id));
  const doneAt = validTime(incoming.completedAt);
  if (completed === undefined && allClues && doneAt !== undefined && started !== undefined) {
    completed = Math.max(doneAt, started);
    points = episode.points;
  }

  if (started !== saved.startedAt || completed !== saved.completedAt) {
    const iso = (t: number | undefined) => (t === undefined ? null : new Date(t).toISOString());
    await sql`INSERT INTO episode_progress (user_id, episode_id, started_at, completed_at, points)
      VALUES (${userId}::uuid, ${episode.id}, ${iso(started)}, ${iso(completed)}, ${points ?? null})
      ON CONFLICT (user_id, episode_id) DO UPDATE SET
        started_at = LEAST(episode_progress.started_at, EXCLUDED.started_at),
        completed_at = COALESCE(episode_progress.completed_at, EXCLUDED.completed_at),
        points = COALESCE(episode_progress.points, EXCLUDED.points),
        updated_at = now()`;
  }

  const body: ProgressResponse = { episodeId: episode.id, progress: await load(sql, userId, episode) };
  return Response.json(body);
}
