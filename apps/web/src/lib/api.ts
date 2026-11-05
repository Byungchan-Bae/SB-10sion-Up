import type { ApiError, CreateUserRequest, CreateUserResponse } from "@sb/types";

async function post<Req, Res>(path: string, body: Req): Promise<Res> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `요청 실패 (${res.status})`);
  return data as Res;
}

export const createUser = (nickname: string) =>
  post<CreateUserRequest, CreateUserResponse>("/api/users", { nickname });
