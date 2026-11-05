// 프론트(apps/web/src)와 백엔드(apps/web/api)가 함께 쓰는 타입

export interface Participant {
  id: string;
  name: string;
  team: string;
  role: string;
  interests: string[];
}

export interface HealthResponse {
  ok: boolean;
  time: string;
}

// POST /api/users
export interface CreateUserRequest {
  nickname: string;
}

export interface CreateUserResponse {
  userId: string;
  nickname: string;
  /** 이 기기에서 사용자 본인임을 증명하는 값. 서버에는 해시만 저장한다 */
  token: string;
}

export interface ApiError {
  error: string;
}

// POST /api/ask  (헤더 Authorization: Bearer <token>)
export interface AskRequest {
  userId: string;
  placeId: string;
  question: string;
}

export interface AskResponse {
  answer: string;
  /** 오늘 남은 질문 횟수 */
  remaining: number;
}
