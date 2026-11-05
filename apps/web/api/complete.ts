import type { CompleteRequest, ProgressResponse } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, ensureProgressTables, error, isUser, loadProgress } from "../server/db.js";

// POST /api/complete  { userId, episodeId } → { episodeId, progress }
// 에피소드 완료. 서버에 단서가 모두 기록돼 있을 때만, 처음 한 번만 기록한다.
// 시각은 서버 시각, 포인트는 서버의 에피소드 데이터 기준. 여러 번 보내도 결과가 같다.
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<CompleteRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const episode = getEpisode(input.episodeId);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = input.userId;
  if (typeof userId !== "string" || !(await isUser(sql, userId, request))) {
    return error(401, "닉네임을 먼저 등록해 주세요");
  }
  await ensureProgressTables(sql);

  const saved = await loadProgress(sql, userId, episode);
  if (!episode.places.every((p) => saved.clues.includes(p.id))) return error(409, "단서를 모두 찾아야 끝낼 수 있어요");

  if (saved.completedAt === undefined) {
    await sql`INSERT INTO episode_progress (user_id, episode_id, started_at, completed_at, points)
      VALUES (${userId}::uuid, ${episode.id}, now(), now(), ${episode.points})
      ON CONFLICT (user_id, episode_id) DO UPDATE SET
        completed_at = COALESCE(episode_progress.completed_at, EXCLUDED.completed_at),
        points = COALESCE(episode_progress.points, EXCLUDED.points),
        updated_at = now()`;
  }

  const body: ProgressResponse = { episodeId: episode.id, progress: await loadProgress(sql, userId, episode) };
  return Response.json(body);
}
