import type { AskRequest, AskResponse } from "@sb/types";
import { findPlace } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, error, isUser } from "../server/db.js";

const MAX_QUESTION = 200;
/** 사용자 한 명이 하루에 할 수 있는 질문 수 (무료 API 한도 보호) */
const DAILY_LIMIT = 20;
/** Google AI Studio 무료 등급 모델. 바꾸려면 Vercel 환경변수 GEMINI_MODEL */
const DEFAULT_MODEL = "gemini-3.6-flash";

// POST /api/ask  { userId, placeId, question } → { answer, remaining }
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!sql || !apiKey) return error(500, "서버 설정(DATABASE_URL, GEMINI_API_KEY)이 없어요");

  let input: Partial<AskRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (!question || question.length > MAX_QUESTION) return error(400, `질문은 1~${MAX_QUESTION}자로 입력해 주세요`);
  const found = findPlace(input.placeId);
  if (!found) return error(404, "장소를 찾을 수 없어요");

  // 등록된 사용자인지 확인 (닉네임 등록 때 받은 token). DB 오류는 401이 아니라 500이 된다:
  // 화면은 401을 받으면 이 기기의 사용자 정보를 지우므로, 장애를 401로 돌려주면 안 된다.
  if (!(await isUser(sql, input.userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");

  // 하루 질문 수 제한
  await sql`CREATE TABLE IF NOT EXISTS ask_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    place_id text NOT NULL,
    question text NOT NULL,
    answer text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM ask_logs
    WHERE user_id = ${input.userId}::uuid AND created_at > now() - interval '1 day'`;
  if ((count as number) >= DAILY_LIMIT) return error(429, "오늘 질문은 여기까지예요. 내일 다시 물어봐 주세요!");

  const { place } = found;
  const system = [
    "너는 서울 성북동 역사 탐험 게임 '성북 트레저'의 친절한 안내원이야.",
    `지금 사용자는 "${place.name}"에 와 있어.`,
    "아래 장소 이야기를 바탕으로, 초등학생도 이해할 수 있게 한국어 존댓말(~요)로 3문장 이내로 답해.",
    "모르는 내용은 지어내지 말고 잘 모르겠다고 말해. 게임 문제의 정답은 직접 알려주지 말고 힌트만 줘.",
    "장소나 성북동 역사와 관계없는 질문에는 장소 이야기로 부드럽게 돌아오게 해.",
    "",
    `[장소 이야기] ${place.story.title.replace(/\n/g, " ")}`,
    place.story.body,
  ].join("\n");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: question }] }],
      // Gemini 3는 답하기 전에 "생각"에도 출력 토큰을 써서, 생각을 줄이고 한도를 넉넉히 둔다
      generationConfig: { maxOutputTokens: 2048, temperature: 0.4, thinkingConfig: { thinkingLevel: "low" } },
    }),
  });
  if (res.status === 429) return error(429, "지금 질문이 많아요. 잠시 후 다시 물어봐 주세요!");
  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text().catch(() => ""));
    return error(502, "AI가 답하지 못했어요. 잠시 후 다시 시도해 주세요");
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!answer) return error(502, "AI가 답하지 못했어요. 다른 질문을 해 볼까요?");

  await sql`INSERT INTO ask_logs (user_id, place_id, question, answer)
    VALUES (${input.userId}::uuid, ${place.id}, ${question}, ${answer})`;

  const body: AskResponse = { answer, remaining: DAILY_LIMIT - (count as number) - 1 };
  return Response.json(body);
}
