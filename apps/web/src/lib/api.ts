import type {
  ApiError,
  AskRequest,
  AskResponse,
  CreateUserRequest,
  CreateUserResponse,
  EpisodeProgress,
  ProgressResponse,
  RankingResponse,
  SyncProgressRequest,
} from "@sb/types";
import { getUser } from "./storage";

async function post<Req, Res>(path: string, body: Req, headers: Record<string, string> = {}): Promise<Res> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `요청 실패 (${res.status})`);
  return data as Res;
}

export const createUser = (nickname: string) =>
  post<CreateUserRequest, CreateUserResponse>("/api/users", { nickname });

export function askAi(placeId: string, question: string) {
  const user = getUser();
  if (!user) return Promise.reject(new Error("닉네임을 먼저 등록해 주세요"));
  return post<AskRequest, AskResponse>(
    "/api/ask",
    { userId: user.userId, placeId, question },
    { Authorization: `Bearer ${user.token}` },
  );
}

/** 이 기기의 진행 상태를 서버로 보내고, 서버에 저장된 것과 합친 결과를 받는다 */
export function syncProgress(episodeId: string, progress: EpisodeProgress) {
  const user = getUser();
  if (!user) return Promise.reject(new Error("닉네임을 먼저 등록해 주세요"));
  return post<SyncProgressRequest, ProgressResponse>(
    "/api/progress",
    { userId: user.userId, episodeId, progress },
    { Authorization: `Bearer ${user.token}` },
  );
}

/** 랭킹. 닉네임을 등록한 사용자면 내 순위도 함께 받는다 */
export async function getRanking(episodeId: string, signal?: AbortSignal): Promise<RankingResponse> {
  const user = getUser();
  const params = new URLSearchParams({ episodeId, ...(user ? { userId: user.userId } : {}) });
  const res = await fetch(`/api/ranking?${params}`, {
    signal,
    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `요청 실패 (${res.status})`);
  return data as RankingResponse;
}
