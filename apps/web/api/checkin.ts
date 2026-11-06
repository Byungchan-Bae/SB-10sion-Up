import type { CheckInRequest, CheckInResponse } from "@sb/types";
import { findPlace } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { DEMO_STAGE } from "../src/data/stage.js";
import { distanceMeters } from "../src/lib/geo.js";
import { connect, ensureProgressTables, error, isUser, loadProgress, markStarted } from "../server/db.js";

const isCoord = (v: unknown, max: number): v is number => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max;

// POST /api/checkin  { userId, placeId, lat, lng, demo? } → { ok, distance, radius, episodeId, progress }
// 장소 도착 인증. 서버가 거리를 계산해서 반경 안이면 인증을 기록한다.
// 시연 단계(DEMO_STAGE)에는 모두 거리 확인을 건너뛰고 랭킹에도 오른다.
// 시연 단계가 아닐 때 demo: true(화면 주소 ?demo=1)는 거리 확인을 건너뛰는 대신 랭킹에서 빠진다.
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<CheckInRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const found = findPlace(input.placeId);
  if (!found) return error(404, "장소를 찾을 수 없어요");
  const { episode, place, index } = found;

  const userId = input.userId;
  if (typeof userId !== "string" || !(await isUser(sql, userId, request))) {
    return error(401, "닉네임을 먼저 등록해 주세요");
  }
  await ensureProgressTables(sql);
  const saved = await loadProgress(sql, userId, episode);

  // 첫 장소는 항상 열림. 그 다음은 바로 앞 장소의 단서를 찾아야 열린다 (화면의 isPlaceOpen과 같은 규칙)
  if (index > 0 && !saved.clues.includes(episode.places[index - 1].id)) {
    return error(409, "앞 장소의 단서를 먼저 찾아 주세요");
  }

  const reply = (ok: boolean, distance: number | undefined, progress = saved) => {
    const body: CheckInResponse = { ok, distance, radius: place.radius, episodeId: episode.id, progress };
    return Response.json(body);
  };

  let distance: number | undefined;
  if (!DEMO_STAGE && input.demo !== true) {
    if (!isCoord(input.lat, 90) || !isCoord(input.lng, 180)) return error(400, "현재 위치 값이 없어요");
    distance = Math.round(distanceMeters(input.lat, input.lng, place.lat, place.lng));
    if (distance > place.radius) return reply(false, distance);
  }

  // 시연 모드를 쓴 사용자는 랭킹에서 뺀다
  if (!DEMO_STAGE && input.demo === true) {
    await sql`INSERT INTO demo_users (user_id) VALUES (${userId}::uuid) ON CONFLICT (user_id) DO NOTHING`;
  }

  if (!saved.verified.includes(place.id)) {
    await markStarted(sql, userId, episode.id);
    await sql`INSERT INTO place_progress (user_id, episode_id, place_id, verified_at)
      VALUES (${userId}::uuid, ${episode.id}, ${place.id}, now())
      ON CONFLICT (user_id, place_id) DO UPDATE SET
        verified_at = COALESCE(place_progress.verified_at, EXCLUDED.verified_at)`;
  }
  return reply(true, distance, await loadProgress(sql, userId, episode));
}
