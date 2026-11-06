import type { UseCouponRequest } from "@sb/types";
import { getEpisode } from "../src/data/episodes.js"; // Node ESM은 확장자가 필요
import { connect, ensureProgressTables, error, isUser, loadProgress } from "../server/db.js";
import { buyCoupon, ensureCouponTable, getCoupons, loadCoupons } from "../server/coupons.js";

// GET /api/coupons?userId=&episodeId=  → { episodeId, unlocked, points, coupons }
// 쿠폰 목록, 내 교환 · 사용 기록, 남은 포인트. unlocked는 서버에 이 에피소드 완주 기록이 있을 때 true.
export async function GET(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");
  const params = new URL(request.url).searchParams;
  const episode = getEpisode(params.get("episodeId") ?? undefined);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");

  const userId = params.get("userId");
  if (!userId || !(await isUser(sql, userId, request))) return error(401, "닉네임을 먼저 등록해 주세요");
  await ensureProgressTables(sql);
  await ensureCouponTable(sql);

  const progress = await loadProgress(sql, userId, episode);
  return Response.json(await loadCoupons(sql, userId, episode.id, progress.completedAt !== undefined));
}

// POST /api/coupons  { userId, episodeId, couponId, action } → { episodeId, unlocked, points, coupons }
// action "buy": 포인트로 교환. 포인트가 모자라거나 이미 바꿨으면 409.
// action "use"(생략 시 기본): 사용 완료. 교환한 쿠폰만, 쿠폰마다 한 번만 기록한다. 여러 번 보내도 처음 사용 시각이 유지된다.
export async function POST(request: Request): Promise<Response> {
  const sql = connect();
  if (!sql) return error(500, "DATABASE_URL이 설정되지 않았어요");

  let input: Partial<UseCouponRequest>;
  try {
    input = await request.json();
  } catch {
    return error(400, "JSON 형식이 아니에요");
  }
  const episode = getEpisode(input.episodeId);
  if (!episode) return error(404, "에피소드를 찾을 수 없어요");
  const action = input.action ?? "use";
  if (action !== "buy" && action !== "use") return error(400, "action은 buy 또는 use예요");

  const userId = input.userId;
  if (typeof userId !== "string" || !(await isUser(sql, userId, request))) {
    return error(401, "닉네임을 먼저 등록해 주세요");
  }
  const coupon = getCoupons(episode.id).find((c) => c.id === input.couponId);
  if (!coupon) return error(404, "쿠폰을 찾을 수 없어요");

  await ensureProgressTables(sql);
  await ensureCouponTable(sql);

  if (action === "buy") {
    const result = await buyCoupon(sql, userId, coupon);
    if (result === "short") return error(409, "포인트가 부족해요");
    if (result === "already") return error(409, "이미 교환한 쿠폰이에요");
  } else {
    const [bought] = await sql`SELECT 1 AS bought FROM coupon_purchases
      WHERE user_id = ${userId}::uuid AND coupon_id = ${coupon.id}`;
    if (!bought) return error(409, "먼저 포인트로 교환해 주세요");
    await sql`INSERT INTO coupon_uses (user_id, coupon_id) VALUES (${userId}::uuid, ${coupon.id})
      ON CONFLICT (user_id, coupon_id) DO NOTHING`;
  }

  const progress = await loadProgress(sql, userId, episode);
  return Response.json(await loadCoupons(sql, userId, episode.id, progress.completedAt !== undefined));
}
