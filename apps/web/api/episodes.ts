import type { Episode } from "@sb/types";
import { EPISODES, getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { error } from "../server/db.js";

// GET /api/episodes          → 에피소드 목록
// GET /api/episodes?id=ep01  → 에피소드 하나
// 정답은 episodes.ts에 없다 (server/answers.ts). 데이터가 DB로 옮겨 가면 여기만 바꾸면 된다.
export function GET(request: Request): Response {
  const id = new URL(request.url).searchParams.get("id");
  if (id === null) return Response.json(EPISODES satisfies Episode[]);

  const episode = getEpisode(id);
  return episode ? Response.json(episode satisfies Episode) : error(404, "에피소드를 찾을 수 없어요");
}
