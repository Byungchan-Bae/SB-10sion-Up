// 에피소드를 완주하면 받는 쿠폰. api/ 밖에 있어서 Vercel 함수(주소)로는 안 열린다.
import type { Coupon, CouponsResponse } from "@sb/types";
import type { Sql } from "./db.js";

/**
 * 제휴 매장이 아직 없어서 전부 예시(sample). 실제 매장과 혜택이 정해지면 여기를 바꾸고 sample을 뺀다.
 * id는 사용 기록에 남으므로 한 번 쓴 id를 다른 쿠폰에 다시 쓰지 말 것.
 */
const COUPONS: Record<string, Coupon[]> = {
  ep01: [
    {
      id: "ep01-bakery",
      category: "빵집",
      shop: "성북동 빵집",
      benefit: "10%",
      condition: "빵 5,000원 이상 구매 시",
      sample: true,
    },
    {
      id: "ep01-cafe",
      category: "카페",
      shop: "성북동 카페",
      benefit: "1,000원",
      condition: "음료 1잔 이상 주문 시",
      sample: true,
    },
    {
      id: "ep01-restaurant",
      category: "식당",
      shop: "성북동 식당",
      benefit: "10%",
      condition: "식사 2인 이상 주문 시",
      sample: true,
    },
  ],
};

export const getCoupons = (episodeId: string) => COUPONS[episodeId] ?? [];

/** 쿠폰 사용 기록 테이블이 없으면 만든다. /reset으로 진행을 지워도 이 기록은 남아서 같은 쿠폰을 다시 쓸 수 없다 */
export async function ensureCouponTable(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS coupon_uses (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id text NOT NULL,
    used_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, coupon_id)
  )`;
}

/** 쿠폰 목록에 이 사용자의 사용 기록을 합친다 */
export async function loadCoupons(
  sql: Sql,
  userId: string,
  episodeId: string,
  unlocked: boolean,
): Promise<CouponsResponse> {
  const rows = await sql`SELECT coupon_id, used_at FROM coupon_uses WHERE user_id = ${userId}::uuid`;
  const usedAt = new Map(rows.map((r) => [r.coupon_id as string, new Date(r.used_at as string).getTime()]));
  return {
    episodeId,
    unlocked,
    coupons: getCoupons(episodeId).map((c) => ({ ...c, usedAt: usedAt.get(c.id) })),
  };
}
