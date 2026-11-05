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

// GET /api/progress?userId=&episodeId=  (헤더 Authorization: Bearer <token>)
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

export interface ProgressResponse {
  episodeId: string;
  progress: EpisodeProgress;
}

// POST /api/checkin  (헤더 Authorization: Bearer <token>)
export interface CheckInRequest {
  userId: string;
  placeId: string;
  /** 현재 위치. demo면 없어도 됨 */
  lat?: number;
  lng?: number;
  /** 시연 모드(?demo=1): 거리 확인을 건너뛰는 대신 랭킹에서 빠진다 */
  demo?: boolean;
}

export interface CheckInResponse {
  /** 인증 성공 여부 */
  ok: boolean;
  /** 장소까지 거리(m). demo면 없음 */
  distance?: number;
  /** 인증 반경(m) */
  radius: number;
  episodeId: string;
  progress: EpisodeProgress;
}

// POST /api/quiz  (헤더 Authorization: Bearer <token>)
export interface QuizRequest {
  userId: string;
  placeId: string;
  /** 문제 1에서 고른 보기 */
  choice: string;
  /** 문제 2 한 줄 기록. 있으면 정답일 때 단서를 찾은 것으로 저장 */
  note?: string;
}

export interface QuizResponse {
  correct: boolean;
  episodeId: string;
  progress: EpisodeProgress;
}

// POST /api/complete  (헤더 Authorization: Bearer <token>) → ProgressResponse
export interface CompleteRequest {
  userId: string;
  episodeId: string;
}

// GET /api/ranking?episodeId=&userId=  (내 순위도 받으려면 헤더 Authorization: Bearer <token>)
export interface RankingEntry {
  rank: number;
  nickname: string;
  points: number;
  /** 서버 기록 기준 소요 시간. 믿을 수 없는 기록(한 번에 몰아서 보냄)은 null이고 같은 점수에서 맨 뒤 */
  durationMs: number | null;
  isMe: boolean;
}

export interface RankingResponse {
  episodeId: string;
  /** 완주한 전체 인원 */
  total: number;
  /** 상위 목록 */
  entries: RankingEntry[];
  /** 내 순위. 상위 목록 밖이어도 들어 있고, 완주 전이거나 등록 전이면 null */
  me: RankingEntry | null;
}
