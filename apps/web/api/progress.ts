import type { ProgressResponse } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, ensureProgressTables, error, isUser, loadProgress } from "../server/db.js";

// GET /api/progress?userId=&episodeId=  → { episodeId, progress }
// 조회만 한다. 기록은 서버가 확인하는 /api/checkin, /api/quiz, /api/complete에서만 한다.
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
