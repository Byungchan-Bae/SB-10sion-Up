import { neon } from "@neondatabase/serverless";
import type { ApiError, RankingEntry, RankingResponse } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요

/** 목록에 보여 주는 인원 */
const TOP = 50;
/** 이보다 짧으면 한 번에 몰아서 보낸 기록(오프라인 · 조작)이라 시간을 믿을 수 없다 */
const MIN_TRUSTED_SECONDS = 60;
/** Postgres: 테이블이 없음 */
const UNDEFINED_TABLE = "42P01";

function error(status: number, message: string) {
  const body: ApiError = { error: message };
  return Response.json(body, { status });
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// GET /api/ranking?episodeId=&userId=  (내 순위도 받으려면 헤더 Authorization: Bearer <token>)
// 순서: 포인트 많은 순 → 소요 시간 짧은 순 → 먼저 끝낸 순.
// 소요 시간은 서버가 기록한 시각(첫 인증 ~ 마지막 단서)으로 계산한다. 기기가 보낸 시각은 쓰지 않는다.
export async function GET(request: Request): Promise<Response> {
  const url = process.env.DATABASE_URL;
  if (!url) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = params.get("userId") ?? "";
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const tokenHash = token ? await sha256(token) : "";

  const sql = neon(url);
  let rows: Record<string, unknown>[];
  try {
    rows = await sql`WITH timing AS (
        SELECT user_id, EXTRACT(EPOCH FROM MAX(clue_at) - MIN(verified_at)) AS seconds
        FROM place_progress
        WHERE episode_id = ${episode.id}
        GROUP BY user_id
      ), ranked AS (
        SELECT u.nickname, e.points,
          CASE WHEN t.seconds >= ${MIN_TRUSTED_SECONDS} THEN t.seconds::float8 END AS seconds,
          (u.id::text = ${userId} AND u.token_hash = ${tokenHash}) AS is_me,
          ROW_NUMBER() OVER (
            ORDER BY e.points DESC,
              CASE WHEN t.seconds >= ${MIN_TRUSTED_SECONDS} THEN t.seconds END ASC NULLS LAST,
              e.completed_at ASC
          )::int AS rank,
          COUNT(*) OVER ()::int AS total
        FROM episode_progress e
        JOIN users u ON u.id = e.user_id
        LEFT JOIN timing t ON t.user_id = e.user_id
        WHERE e.episode_id = ${episode.id} AND e.completed_at IS NOT NULL AND e.points IS NOT NULL
      )
      SELECT nickname, points, seconds, is_me, rank, total FROM ranked
      WHERE rank <= ${TOP} OR is_me
      ORDER BY rank`;
  } catch (err) {
    // 아직 아무도 진행 상태를 저장하지 않아 테이블이 없는 경우
    if ((err as { code?: string }).code !== UNDEFINED_TABLE) throw err;
    rows = [];
  }

  const all: RankingEntry[] = rows.map((r) => ({
    rank: r.rank as number,
    nickname: r.nickname as string,
    points: r.points as number,
    durationMs: r.seconds === null ? null : Math.round((r.seconds as number) * 1000),
    isMe: r.is_me as boolean,
  }));
  const body: RankingResponse = {
    episodeId: episode.id,
    total: rows.length ? (rows[0].total as number) : 0,
    entries: all.filter((e) => e.rank <= TOP),
    me: all.find((e) => e.isMe) ?? null,
  };
  return Response.json(body);
}
