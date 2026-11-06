import type { RankingEntry, RankingResponse } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, ensureProgressTables, error, sha256 } from "../server/db.js";

/** 목록에 보여 주는 인원 */
const TOP = 50;
/**
 * 이보다 짧으면 실제로 걸어서 문제를 풀었다고 볼 수 없어 시간을 믿지 않는다 ("시간 기록 없음", 같은 점수에서 맨 뒤).
 * 도보 경로 1,324m 중 인증 반경 150m씩을 뺀 618m를 달리듯(8km/h) 약 4.6분 + 문제 4개 약 1.4분 = 6분.
 * 장소나 문제를 바꾸면 다시 계산할 것.
 */
const MIN_TRUSTED_SECONDS = 360;
/**
 * 수연산방에서 차를 마셔도 순위에서 손해 보지 않게, 수연산방 인증 ~ 심우장 인증 구간은 이 시간까지만 센다.
 * 걷기 약 7분(카카오맵) + 문제 풀기 약 2분에 여유를 둔 값.
 */
const REST_FROM_PLACE = "suyeonsanbang";
const REST_TO_PLACE = "simujang";
const MAX_REST_LEG_SECONDS = 600;
/** Postgres: 테이블이 없음 */
const UNDEFINED_TABLE = "42P01";

// GET /api/ranking?episodeId=&userId=  (내 순위도 받으려면 헤더 Authorization: Bearer <token>)
// 순서: 포인트 많은 순 → 소요 시간 짧은 순 → 먼저 끝낸 순. 시연 모드(demo_users)를 쓴 사용자는 뺀다.
// 소요 시간은 서버가 기록한 시각(첫 인증 ~ 마지막 단서)으로 계산하고, 수연산방 구간의 초과분을 뺀다. 기기가 보낸 시각은 쓰지 않는다.
export async function GET(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = params.get("userId") ?? "";
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const tokenHash = token ? await sha256(token) : "";

  let rows: Record<string, unknown>[];
  try {
    await ensureProgressTables(sql);
    rows = await sql`WITH timing AS (
        SELECT user_id,
          EXTRACT(EPOCH FROM MAX(clue_at) - MIN(verified_at))
            - GREATEST(0, COALESCE(EXTRACT(EPOCH FROM
                MAX(verified_at) FILTER (WHERE place_id = ${REST_TO_PLACE})
                - MAX(verified_at) FILTER (WHERE place_id = ${REST_FROM_PLACE})
              ), 0) - ${MAX_REST_LEG_SECONDS}) AS seconds
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
          AND NOT EXISTS (SELECT 1 FROM demo_users d WHERE d.user_id = e.user_id)
      )
      SELECT nickname, points, seconds, is_me, rank, total FROM ranked
      WHERE rank <= ${TOP} OR is_me
      ORDER BY rank`;
  } catch (err) {
    // 아직 아무도 닉네임을 등록하지 않아 users 테이블이 없는 경우
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
