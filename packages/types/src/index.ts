// 프론트(apps/web/src)와 백엔드(apps/web/api)가 함께 쓰는 타입

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
  /** 시연 모드: 거리 확인을 건너뛴다. 시연 단계(DEMO_STAGE)가 아니면 랭킹에서도 빠진다 */
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
  /** 서버 기록 기준 소요 시간(수연산방 구간은 최대 10분까지만 셈). 믿을 수 없는 기록(한 번에 몰아서 보냄)은 null이고 같은 점수에서 맨 뒤 */
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

// GET /api/coupons?userId=&episodeId=, POST /api/coupons  (헤더 Authorization: Bearer <token>)
// 에피소드를 완주해 모은 포인트로 쿠폰을 교환(buy)하고, 가게에서 직원에게 보여 준 뒤 사용(use)한다.
export interface Coupon {
  id: string;
  /** "빵집", "카페", "김밥집", "치킨집" */
  category: string;
  shop: string;
  /** 할인 크기: "10%", "1,000원" */
  benefit: string;
  /** 쓸 수 있는 조건 */
  condition: string;
  /** 교환에 드는 포인트 */
  price: number;
  /** 제휴 전 예시 쿠폰 */
  sample?: boolean;
}

export interface CouponStatus extends Coupon {
  /** 포인트로 교환한 시각(ms). 안 바꿨으면 없음 */
  boughtAt?: number;
  /** 사용한 시각(ms). 안 썼으면 없음 */
  usedAt?: number;
}

export interface CouponsResponse {
  episodeId: string;
  /** 서버에 이 에피소드 완주 기록이 있으면 true */
  unlocked: boolean;
  /** 지금 남은 포인트 = 완주한 에피소드 포인트 합 − 교환한 쿠폰 값 */
  points: number;
  coupons: CouponStatus[];
}

/** buy: 포인트로 교환, use: 사용 완료 (생략하면 use) */
export type CouponAction = "buy" | "use";

export interface UseCouponRequest {
  userId: string;
  episodeId: string;
  couponId: string;
  action?: CouponAction;
}

// ---- 에피소드 데이터 (apps/web/src/data/episodes.ts, GET /api/episodes) ----

/** [left, top, width, height] — Stage(390 × 844) 좌표 */
export type Rect = [number, number, number, number];

/**
 * 장소 문제 2개 (Figma 문제 7 · 문제 8 프레임).
 * 1번은 객관식, 2번은 그 장소에서 느낀 분위기를 한 줄로 적는 서술형.
 */
export type Quiz = {
  /** Q1 질문 (줄바꿈은 \n) */
  question: string;
  options: string[];
  // 정답은 여기에 두지 않는다 → apps/web/server/answers.ts (서버 /api/quiz에서 확인)
  /** 연두색 힌트 카드 글 — 화면에는 글자가 들어간 그림(hint-<장소 id>.png)을 쓰고, 이 글은 대체 텍스트 */
  hint: string;
  /** 힌트 그림 자리 */
  hintImage: Rect;
  /** 힌트 카드 옆 마스코트 [left, top] */
  mascot: [number, number];
  /** Q2 질문 (줄바꿈은 \n) */
  reflection: string;
};

/** 단서 발견 화면 (Figma 136:4524 · 4538 · 4553 · 4568) */
export type Clue = {
  /** 편지 조각에 적힌 단서 글자 */
  word: string;
  /** 편지 조각 그림 (clue-<장소 id>.png) 자리 */
  image: Rect;
  /** "<foundAt>에서 단서를 찾았어요!" */
  foundAt: string;
  /** foundAt 위 작은 글씨 (긴 장소 이름) */
  subLabel?: string;
  /** 원형 장소 사진(pinPhoto) 자리 */
  thumb: Rect;
};

/**
 * 탐험 지도 위 장소 핀. Figma 프레임 8(136:2839)의 Component 11/13/15/17 값.
 * x, y는 지도 이미지(390 × 677) 기준 %, 나머지는 핀 안쪽 px.
 */
export type MapPin = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 사진 뒤 크림색 원 [w, h] */
  ring: [number, number];
  /** 원형 사진 [left, top, w, h] */
  photo: [number, number, number, number];
  /** 이름표 [left, top, w, h] */
  label: [number, number, number, number];
  /**
   * 잠긴 장소의 회색 이름표 [left, top, w, h] (Figma 프레임 5, 136:2806).
   * 지도 그림에 크림색 이름표가 그려져 있어서, 잠겼을 땐 그 이름표(번진 테두리 포함)를 사방 2px 여유로 다 덮게 크게 그린다. 없으면 label
   */
  lockedLabel?: [number, number, number, number];
  /**
   * true면 이름표(팻말)를 지도 그림이 아니라 코드로 그린다: 이름표 전체 크기 + 그림자까지.
   * 지도 그림에서 원래 팻말을 지운 핀(원형 사진과 세로 중심을 맞추려고 팻말을 옮긴 핀)에만 쓴다.
   */
  drawnSign?: boolean;
  /** 이름 글자 [left, top, w], 글자 크기 */
  text: [number, number, number];
  fontSize: number;
};

export type Place = {
  id: string;
  /** 지도/인증 화면 이름 */
  name: string;
  /** 지도 핀 이름 (줄바꿈은 \n) */
  pinLabel: string;
  /**
   * 인증 · 역사 화면 큰 이름 위 작은 줄 (Figma 136:3220 "한국순교복자성직수도회" / "구 본원").
   * 있으면 heroName을 큰 글씨로, 없으면 name을 큰 글씨로 쓴다
   */
  heroSub?: string;
  heroName?: string;
  address: string;
  /** 도착 인증용 좌표 */
  lat: number;
  lng: number;
  /** 도착으로 인정하는 반경(m) */
  radius: number;
  /** 인증 · 역사 화면 위쪽 사진 (354 × 194) */
  photo: string;
  /** 지도 핀 원형 사진 */
  pinPhoto: string;
  pin: MapPin;
  /** "첫번째", "두번째" … (버튼 "첫번째 단서 찾기") */
  ordinal: string;
  story: {
    /** 줄바꿈은 \n */
    title: string;
    body: string;
    /** 마스코트 말풍선 */
    tip: string;
  };
  /** 자주 묻는 질문. 눌러서 물으면 AI를 쓰지 않고 이 답을 바로 보여 준다. 문제 정답은 넣지 말 것 */
  faq: { question: string; answer: string }[];
  quiz: Quiz;
  clue: Clue;
};

export type Episode = {
  id: string;
  /** "EP.01" */
  badge: string;
  title: string;
  /** 홈 카드 말풍선 (줄바꿈은 \n) */
  teaser: string;
  /** 홈 카드 이미지 (public/assets/) */
  cardImage: string;
  /** 상세 화면 위쪽 사진 */
  photo: string;
  /** 상세 화면 사진 위 마스코트 */
  mascots: string;
  /** 상세 화면 인용문. {{ }} 안은 주황 강조 (줄바꿈은 \n) */
  hook: string;
  /** 상세 화면 설명. {{ }} 안은 주황 강조 */
  summary: string;
  /** 시작하기 다음의 "의문의 편지" 화면 */
  intro: {
    title: string;
    lead: string;
    body: string;
    mission: string;
  };
  /** 단서를 다 모으면 나오는 "밝혀진 비밀" (Figma 136:4582). {{ }} 안은 주황 강조 */
  secret: {
    lead: string;
    headline: string;
    body: string;
    closing: string;
  };
  /** 에피소드를 끝내면 받는 포인트 (수집 완료 136:4504) */
  points: number;
  startPlace: string;
  distance: string;
  duration: string;
  places: Place[];
};
