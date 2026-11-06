import type {
  ApiError,
  AskRequest,
  AskResponse,
  CheckInRequest,
  CheckInResponse,
  CompleteRequest,
  CouponsResponse,
  CreateUserRequest,
  CreateUserResponse,
  ProgressResponse,
  QuizRequest,
  QuizResponse,
  RankingResponse,
  UseCouponRequest,
} from "@sb/types";
import { clearPlayer, getUser } from "./storage";

/** 통신 자체가 실패했을 때(오프라인 등) 화면에 보여 줄 문구 */
const NETWORK_ERROR = "인터넷 연결을 확인하고 다시 시도해 주세요";
/** 응답이 너무 늦을 때 문구. 약한 통신에서 버튼이 멈춰 있지 않게 한다 */
const TIMEOUT_ERROR = "응답이 늦어요. 잠시 후 다시 시도해 주세요";
const NOT_REGISTERED = "닉네임을 먼저 등록해 주세요";

const TIMEOUT_MS = 15_000;
/** AI 답변은 오래 걸릴 수 있다 */
const ASK_TIMEOUT_MS = 40_000;

async function request<Res>(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Res> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // 화면이 넘긴 signal(화면을 벗어나면 취소)도 함께 따른다
  const outer = init.signal;
  const cancel = () => controller.abort();
  if (outer?.aborted) cancel();
  outer?.addEventListener("abort", cancel);

  let res: Response;
  let data: unknown;
  try {
    res = await fetch(path, { ...init, signal: controller.signal });
    data = await res.json().catch((err) => {
      if (controller.signal.aborted) throw err;
      return null; // 응답이 JSON이 아닌 경우
    });
  } catch (err) {
    if (timedOut) throw new Error(TIMEOUT_ERROR);
    if (outer?.aborted) throw err;
    throw new Error(NETWORK_ERROR);
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", cancel);
  }

  // 서버가 이 사용자를 모른다 (DB에서 지워짐 등). 이 기기에서는 더 진행할 수 없으니 다시 등록하게 한다
  if (res.status === 401 && new Headers(init.headers).has("Authorization")) {
    clearPlayer();
    window.location.replace("/nickname?expired=1");
    throw new Error(NOT_REGISTERED);
  }
  if (!res.ok) throw new Error((data as ApiError | null)?.error ?? `요청 실패 (${res.status})`);
  return data as Res;
}

const post = <Req, Res>(path: string, body: Req, headers: Record<string, string> = {}, timeoutMs?: number) =>
  request<Res>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

/** 닉네임을 등록한 사용자로 보내는 POST */
function postAsUser<Req, Res>(path: string, body: (userId: string) => Req, timeoutMs?: number) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  return post<Req, Res>(path, body(user.userId), { Authorization: `Bearer ${user.token}` }, timeoutMs);
}

export const createUser = (nickname: string) =>
  post<CreateUserRequest, CreateUserResponse>("/api/users", { nickname });

export const askAi = (placeId: string, question: string) =>
  postAsUser<AskRequest, AskResponse>("/api/ask", (userId) => ({ userId, placeId, question }), ASK_TIMEOUT_MS);

/** 서버에 저장된 내 진행 상태 */
export function fetchProgress(episodeId: string) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  const params = new URLSearchParams({ episodeId, userId: user.userId });
  return request<ProgressResponse>(`/api/progress?${params}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
}

/** 서버에 저장된 내 진행 기록을 지운다 (테스트 · 시연용 초기화) */
export function deleteProgress(episodeId: string) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  const params = new URLSearchParams({ episodeId, userId: user.userId });
  return request<ProgressResponse>(`/api/progress?${params}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${user.token}` },
  });
}

/** 장소 도착 인증 — 서버가 거리를 계산한다. demo면 거리 확인을 건너뛴다 (시연 단계가 아니면 랭킹에서도 빠진다) */
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

/** 쿠폰 목록과 내 사용 기록 */
export function getCoupons(episodeId: string, signal?: AbortSignal) {
  const user = getUser();
  if (!user) return Promise.reject(new Error(NOT_REGISTERED));
  const params = new URLSearchParams({ episodeId, userId: user.userId });
  return request<CouponsResponse>(`/api/coupons?${params}`, {
    signal,
    headers: { Authorization: `Bearer ${user.token}` },
  });
}

/** 쿠폰 사용 처리 — 서버가 완주 여부를 확인하고 한 번만 기록한다 */
export const redeemCoupon = (episodeId: string, couponId: string) =>
  postAsUser<UseCouponRequest, CouponsResponse>("/api/coupons", (userId) => ({ userId, episodeId, couponId }));

/** 랭킹. 닉네임을 등록한 사용자면 내 순위도 함께 받는다 */
export function getRanking(episodeId: string, signal?: AbortSignal) {
  const user = getUser();
  const params = new URLSearchParams({ episodeId, ...(user ? { userId: user.userId } : {}) });
  return request<RankingResponse>(`/api/ranking?${params}`, {
    signal,
    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
  });
}
