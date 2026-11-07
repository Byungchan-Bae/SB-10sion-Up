// 발표 시연 링크(/demo)의 가짜 서버.
// 시연 탭은 서버에 아무것도 보내지 않아서, 인터넷이 약해도 멈추지 않고 실제 랭킹에도 섞이지 않는다.
// 기록은 이 탭(sessionStorage)에만 남고, 탭을 닫으면 사라진다 (storage.ts의 appStorage).
import type { CheckInResponse, CouponStatus, CouponsResponse, EpisodeProgress, QuizResponse } from "@sb/types";
import { COUPONS } from "../data/coupons";
import { EPISODES, findPlace, getEpisode } from "../data/episodes";
import { appStorage, PROGRESS_KEY } from "./storage";

const COUPON_KEY = "sb-treasure:demo-coupons";
/** 시연의 소요 시간: 앞의 세 장소를 이미 돌아본 것처럼 보이게 한다 (수집 완료 화면 약 1시간 9분) */
const ELAPSED_MS = 68 * 60 * 1000;
/** 앞 장소에 남긴 것으로 할 기록. 시연하는 장소는 입력칸에 미리 채워 둔다 */
const NOTES: Record<string, string> = {
  gilsangsa: "고요해서 마음이 편안해지는 곳이에요",
  martyrs: "오래된 건물에서 깊은 믿음이 느껴져요",
  suyeonsanbang: "차 향기처럼 글이 스며드는 집이에요",
  simujang: "곧은 신념이 느껴지는 조용한 집이에요",
};

/** 시연을 시작하는 장소 */
const START_PLACE = "suyeonsanbang";

/** 시연 시작 상태: 시작 장소 앞의 단서를 모두 찾았고, 한 줄 기록은 뒤 장소까지 미리 적어 둔 진행 기록 */
export function demoStartProgress(): { episodeId: string; startPlace: string; progress: EpisodeProgress } {
  const episode = EPISODES[0];
  const start = episode.places.findIndex((p) => p.id === START_PLACE);
  const done = episode.places.slice(0, start).map((p) => p.id);
  return {
    episodeId: episode.id,
    startPlace: START_PLACE,
    progress: { startedAt: Date.now() - ELAPSED_MS, verified: done, clues: done, notes: NOTES },
  };
}

export const clearDemoCoupons = () => appStorage().removeItem(COUPON_KEY);

function readProgress(episodeId: string): EpisodeProgress {
  const state = JSON.parse(appStorage().getItem(PROGRESS_KEY) ?? "{}") as Record<string, EpisodeProgress>;
  return state[episodeId] ?? { verified: [], clues: [] };
}

const added = (ids: string[], id: string) => (ids.includes(id) ? ids : [...ids, id]);

/** 위치 확인 없이 바로 통과 */
export function demoCheckIn(placeId: string): CheckInResponse {
  const found = findPlace(placeId);
  if (!found) throw new Error("장소를 찾을 수 없어요");
  const progress = readProgress(found.episode.id);
  return {
    ok: true,
    radius: found.place.radius,
    episodeId: found.episode.id,
    progress: { ...progress, verified: added(progress.verified, placeId) },
  };
}

/** 정답은 서버에만 있어서 화면 코드로 옮기지 않는다. 시연에서는 어떤 보기를 골라도 정답으로 넘어간다 */
export function demoQuiz(placeId: string, note?: string): QuizResponse {
  const found = findPlace(placeId);
  if (!found) throw new Error("장소를 찾을 수 없어요");
  const progress = readProgress(found.episode.id);
  return {
    correct: true,
    episodeId: found.episode.id,
    progress: note
      ? { ...progress, clues: added(progress.clues, placeId), notes: { ...progress.notes, [placeId]: note } }
      : progress,
  };
}

type Records = Record<string, Pick<CouponStatus, "boughtAt" | "usedAt">>;

const readCoupons = () => JSON.parse(appStorage().getItem(COUPON_KEY) ?? "{}") as Records;

export function demoCoupons(episodeId: string): CouponsResponse {
  const records = readCoupons();
  const coupons = (COUPONS[episodeId] ?? []).map((c) => ({ ...c, ...records[c.id] }));
  const progress = readProgress(episodeId);
  const earned = progress.completedAt ? (getEpisode(episodeId)?.points ?? 0) : 0;
  const spent = coupons.reduce((sum, c) => sum + (c.boughtAt ? c.price : 0), 0);
  return { episodeId, unlocked: Boolean(progress.completedAt), points: earned - spent, coupons };
}

/** 서버와 같은 문구로 거절해서, 쿠폰 화면이 그대로 동작하게 한다 */
export function demoBuyCoupon(episodeId: string, couponId: string): CouponsResponse {
  const { points, coupons } = demoCoupons(episodeId);
  const coupon = coupons.find((c) => c.id === couponId);
  if (!coupon) throw new Error("쿠폰을 찾을 수 없어요");
  if (coupon.boughtAt) throw new Error("이미 교환한 쿠폰이에요");
  if (points < coupon.price) throw new Error("포인트가 부족해요");
  saveCoupon(couponId, { boughtAt: Date.now() });
  return demoCoupons(episodeId);
}

export function demoRedeemCoupon(episodeId: string, couponId: string): CouponsResponse {
  const coupon = demoCoupons(episodeId).coupons.find((c) => c.id === couponId);
  if (!coupon) throw new Error("쿠폰을 찾을 수 없어요");
  if (!coupon.boughtAt) throw new Error("먼저 포인트로 교환해 주세요");
  saveCoupon(couponId, { usedAt: coupon.usedAt ?? Date.now() });
  return demoCoupons(episodeId);
}

function saveCoupon(couponId: string, change: Records[string]) {
  const records = readCoupons();
  appStorage().setItem(COUPON_KEY, JSON.stringify({ ...records, [couponId]: { ...records[couponId], ...change } }));
}
