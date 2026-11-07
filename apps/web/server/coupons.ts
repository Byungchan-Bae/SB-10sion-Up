// 에피소드를 완주해 모은 포인트로 바꾸는 쿠폰. api/ 밖에 있어서 Vercel 함수(주소)로는 안 열린다.
import type { Coupon, CouponsResponse } from "@sb/types";
import { COUPONS } from "../src/data/coupons.js"; // Node ESM은 확장자가 필요
import type { Sql } from "./db.js";

export const getCoupons = (episodeId: string) => COUPONS[episodeId] ?? [];

/**
 * 쿠폰 교환 · 사용 기록 테이블이 없으면 만든다. /reset으로 진행을 지워도 이 기록은 남아서
 * 같은 쿠폰을 다시 바꾸거나 쓸 수 없고, 쓴 포인트도 돌아오지 않는다.
 * coupon_purchases.price에는 교환할 때 낸 포인트를 남긴다 (나중에 값이 바뀌어도 잔액이 안 흔들리게).
 */
export async function ensureCouponTable(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS coupon_uses (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id text NOT NULL,
    used_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, coupon_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS coupon_purchases (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id text NOT NULL,
    price int NOT NULL,
    bought_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, coupon_id)
  )`;
}

/** 남은 포인트 = 완주한 에피소드 포인트 합 − 교환한 쿠폰 값. 진행을 지웠다가 다시 하면 0 아래일 수 있어 0으로 맞춘다 */
async function loadPoints(sql: Sql, userId: string) {
  const [row] = await sql`SELECT
    (SELECT COALESCE(SUM(points), 0) FROM episode_progress
      WHERE user_id = ${userId}::uuid AND completed_at IS NOT NULL) -
    (SELECT COALESCE(SUM(price), 0) FROM coupon_purchases WHERE user_id = ${userId}::uuid) AS points`;
  return Math.max(0, Number(row?.points ?? 0));
}

/**
 * 포인트로 쿠폰을 교환한다. 잔액 확인과 기록을 한 트랜잭션에서 하고, 같은 사용자의 교환은 차례로 처리해서
 * 동시에 여러 번 눌러도 포인트보다 많이 바꿀 수 없다.
 * @returns "ok" | "already"(이미 교환함) | "short"(포인트 부족)
 */
export async function buyCoupon(sql: Sql, userId: string, coupon: Coupon) {
  // ReadCommitted: 잠금을 기다린 뒤 다른 요청이 막 기록한 교환까지 보고 잔액을 계산한다
  const [, inserted] = await sql.transaction(
    [
      sql`SELECT pg_advisory_xact_lock(hashtext(${"coupon:" + userId}::text))`,
      sql`INSERT INTO coupon_purchases (user_id, coupon_id, price)
        SELECT ${userId}::uuid, ${coupon.id}::text, ${coupon.price}::int
        WHERE NOT EXISTS (SELECT 1 FROM coupon_uses WHERE user_id = ${userId}::uuid AND coupon_id = ${coupon.id})
          AND (SELECT COALESCE(SUM(points), 0) FROM episode_progress
                WHERE user_id = ${userId}::uuid AND completed_at IS NOT NULL) -
              (SELECT COALESCE(SUM(price), 0) FROM coupon_purchases WHERE user_id = ${userId}::uuid) >= ${coupon.price}::int
        ON CONFLICT (user_id, coupon_id) DO NOTHING
        RETURNING coupon_id`,
    ],
    { isolationLevel: "ReadCommitted" },
  );
  if (inserted.length > 0) return "ok" as const;
  const [owned] = await sql`SELECT 1 AS owned FROM coupon_purchases
    WHERE user_id = ${userId}::uuid AND coupon_id = ${coupon.id}
    UNION ALL SELECT 1 FROM coupon_uses WHERE user_id = ${userId}::uuid AND coupon_id = ${coupon.id}`;
  return owned ? ("already" as const) : ("short" as const);
}

/** 쿠폰 목록에 이 사용자의 교환 · 사용 기록과 남은 포인트를 합친다 */
export async function loadCoupons(
  sql: Sql,
  userId: string,
  episodeId: string,
  unlocked: boolean,
): Promise<CouponsResponse> {
  const time = (v: unknown) => new Date(v as string).getTime();
  const used = await sql`SELECT coupon_id, used_at FROM coupon_uses WHERE user_id = ${userId}::uuid`;
  const bought = await sql`SELECT coupon_id, bought_at FROM coupon_purchases WHERE user_id = ${userId}::uuid`;
  const usedAt = new Map(used.map((r) => [r.coupon_id as string, time(r.used_at)]));
  const boughtAt = new Map(bought.map((r) => [r.coupon_id as string, time(r.bought_at)]));
  return {
    episodeId,
    unlocked,
    points: await loadPoints(sql, userId),
    coupons: getCoupons(episodeId).map((c) => ({
      ...c,
      // 교환 기능 전에 쓴 쿠폰은 교환 기록이 없다 → 쓴 시각을 교환 시각으로 본다
      boughtAt: boughtAt.get(c.id) ?? usedAt.get(c.id),
      usedAt: usedAt.get(c.id),
    })),
  };
}
