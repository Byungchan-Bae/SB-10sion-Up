import type { QuizRequest, QuizResponse } from "@sb/types";
import { findPlace } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { QUIZ_ANSWERS } from "../server/answers.js";
import { connect, ensureProgressTables, error, isUser, loadProgress } from "../server/db.js";

/** 문제 2 한 줄 기록 최대 길이 (화면과 같음) */
const MAX_NOTE = 30;

// POST /api/quiz  { userId, placeId, choice, note? } → { correct, episodeId, progress }
// 문제 1 정답 확인. note(문제 2 한 줄 기록)까지 오면 정답일 때 단서를 찾은 것으로 기록한다.
//  - 문제 1에서 "확인": { choice } → 정답 여부만
//  - 문제 2에서 "확인": { choice, note } → 단서 + 기록 저장
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<QuizRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const found = findPlace(input.placeId);
  const answer = found && QUIZ_ANSWERS[found.place.id];
  if (!found || !answer) return error(404, "장소를 찾을 수 없어요");
  const { episode, place } = found;
  if (typeof input.choice !== "string") return error(400, "보기를 골라 주세요");

  let note: string | undefined;
  if (input.note !== undefined) {
    note = typeof input.note === "string" ? input.note.replace(/\n/g, "").trim() : "";
    if (!note || [...note].length > MAX_NOTE) return error(400, `기록은 1~${MAX_NOTE}자로 적어 주세요`);
  }

  const userId = input.userId;
  if (typeof userId !== "string" || !(await isUser(sql, userId, request))) {
    return error(401, "닉네임을 먼저 등록해 주세요");
  }
  await ensureProgressTables(sql);
  const saved = await loadProgress(sql, userId, episode);
  if (!saved.verified.includes(place.id)) return error(409, "먼저 장소 도착 인증을 해 주세요");

  const correct = input.choice === answer;
  if (correct && note !== undefined) {
    // 단서는 처음 찾은 시각을 유지하고, 한 줄 기록은 다시 쓰면 바뀐다
    await sql`UPDATE place_progress SET
        clue_at = COALESCE(clue_at, now()),
        note = ${note}
      WHERE user_id = ${userId}::uuid AND place_id = ${place.id}`;
  }

  const body: QuizResponse = {
    correct,
    episodeId: episode.id,
    progress: correct && note !== undefined ? await loadProgress(sql, userId, episode) : saved,
  };
  return Response.json(body);
}
