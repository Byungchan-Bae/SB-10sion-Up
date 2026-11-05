import type {
  ApiError,
  AskRequest,
  AskResponse,
  CheckInRequest,
  CheckInResponse,
  CompleteRequest,
  CreateUserRequest,
  CreateUserResponse,
  ProgressResponse,
  QuizRequest,
  QuizResponse,
  RankingResponse,
} from "@sb/types";
import { getUser } from "./storage";

/** 통신 자체가 실패했을 때(오프라인 등) 화면에 보여 줄 문구 */
const NETWORK_ERROR = "인터넷 연결을 확인하고 다시 시도해 주세요";
const NOT_REGISTERED = "닉네임을 먼저 등록해 주세요";

async function request<Res>(path: string, init?: RequestInit): Promise<Res> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error(NETWORK_ERROR);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `요청 실패 (${res.status})`);
  return data as Res;
}

const post = <Req, Res>(path: string, body: Req, headers: Record<string, string> = {}) =>
  request<Res>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

/** 닉네임을 등록한 사용자로 보내는 POST */
function postAsUser<Req, Res>(path: string, body: (userId: string) => Req) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  return post<Req, Res>(path, body(user.userId), { Authorization: `Bearer ${user.token}` });
}

export const createUser = (nickname: string) =>
  post<CreateUserRequest, CreateUserResponse>("/api/users", { nickname });

export const askAi = (placeId: string, question: string) =>
  postAsUser<AskRequest, AskResponse>("/api/ask", (userId) => ({ userId, placeId, question }));

/** 서버에 저장된 내 진행 상태 */
export function fetchProgress(episodeId: string) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  const params = new URLSearchParams({ episodeId, userId: user.userId });
  return request<ProgressResponse>(`/api/progress?${params}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
}

/** 장소 도착 인증 — 서버가 거리를 계산한다. demo면 거리 확인을 건너뛰고 랭킹에서 빠진다 */
export const checkIn = (placeId: string, where: { lat: number; lng: number } | "demo") =>
  postAsUser<CheckInRequest, CheckInResponse>("/api/checkin", (userId) =>
    where === "demo" ? { userId, placeId, demo: true } : { userId, placeId, ...where },
  );

/** 문제 1 정답 확인. note(문제 2 기록)까지 보내면 정답일 때 단서로 저장된다 */
export const checkQuiz = (placeId: string, choice: string, note?: string) =>
  postAsUser<QuizRequest, QuizResponse>("/api/quiz", (userId) => ({ userId, placeId, choice, note }));

/** 에피소드 완료 — 서버가 단서를 모두 찾았는지 확인한다 */
export const completeOnServer = (episodeId: string) =>
  postAsUser<CompleteRequest, ProgressResponse>("/api/complete", (userId) => ({ userId, episodeId }));

/** 랭킹. 닉네임을 등록한 사용자면 내 순위도 함께 받는다 */
export function getRanking(episodeId: string, signal?: AbortSignal) {
  const user = getUser();
  const params = new URLSearchParams({ episodeId, ...(user ? { userId: user.userId } : {}) });
  return request<RankingResponse>(`/api/ranking?${params}`, {
    signal,
    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
  });
}
