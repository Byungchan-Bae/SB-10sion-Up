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

// GET /api/progress?userId=&episodeId=  ·  POST /api/progress  (헤더 Authorization: Bearer <token>)
/** 에피소드 하나의 진행 상태. 시각은 ms (Date.now()) */
export interface EpisodeProgress {
  /** 에피소드 시작 시각 — 지도 타이머 */
  startedAt?: number;
  /** 도착 인증한 장소 id */
  verified: string[];
  /** 단서를 찾은 장소 id */
  clues: string[];
  /** 문제 2에서 장소별로 적은 한 줄 기록 */
  notes?: Record<string, string>;
  /** 에피소드를 끝낸 시각 — 수집 완료 화면의 소요 시간 */
  completedAt?: number;
  /** 끝냈을 때 받은 포인트 (서버가 채움) */
  points?: number;
}

/** 이 기기의 진행 상태를 보내면 서버가 저장된 것과 합쳐서 돌려준다 */
export interface SyncProgressRequest {
  userId: string;
  episodeId: string;
  progress: EpisodeProgress;
}

export interface ProgressResponse {
  episodeId: string;
  progress: EpisodeProgress;
}
