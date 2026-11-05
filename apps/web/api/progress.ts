import type { ProgressResponse } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, ensureProgressTables, error, isUser, loadProgress } from "../server/db.js";

// GET /api/progress?userId=&episodeId=  → { episodeId, progress }
// 조회만 한다. 기록은 서버가 확인하는 /api/checkin, /api/quiz, /api/complete에서만 한다.
// (DELETE는 아래: 테스트 · 시연용 초기화)
export async function GET(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = params.get("userId");
  if (!userId || !(await isUser(sql, userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");
  await ensureProgressTables(sql);

  const body: ProgressResponse = { episodeId: episode.id, progress: await loadProgress(sql, userId, episode) };
  return Response.json(body);
}

// DELETE /api/progress?userId=&episodeId=  → { episodeId, progress: 빈 상태 }
// 테스트 · 시연용 초기화 (/reset). 자기 기록만 지운다. 시연 표시도 지워서 다음 진행은 실제 위치로 인증하면 랭킹에 오른다.
export async function DELETE(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = params.get("userId");
  if (!userId || !(await isUser(sql, userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");
  await ensureProgressTables(sql);

  await sql`DELETE FROM place_progress WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`;
  await sql`DELETE FROM episode_progress WHERE user_id = ${userId}::uuid AND episode_id = ${episode.id}`;
  await sql`DELETE FROM demo_users WHERE user_id = ${userId}::uuid`;

  const body: ProgressResponse = { episodeId: episode.id, progress: await loadProgress(sql, userId, episode) };
  return Response.json(body);
}
