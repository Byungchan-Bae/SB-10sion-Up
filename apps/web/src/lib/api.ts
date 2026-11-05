import type { ApiError, AskRequest, AskResponse, CreateUserRequest, CreateUserResponse } from "@sb/types";
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
