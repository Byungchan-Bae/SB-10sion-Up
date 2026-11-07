// 쿠폰 목록. 서버(server/coupons.ts)와 발표 시연 링크(lib/demoLink.ts)가 함께 쓴다.
import type { Coupon } from "@sb/types";

/**
 * 제휴 매장이 아직 없어서 전부 예시(sample). 실제 매장과 혜택이 정해지면 여기를 바꾸고 sample을 뺀다.
 * id는 교환 · 사용 기록에 남으므로 한 번 쓴 id를 다른 쿠폰에 다시 쓰지 말 것 (ep01-restaurant는 쓰지 않음).
 * price(교환 포인트)는 할인 크기에 맞춰 정했다. 에피소드 하나를 완주하면 100 point.
 */
export const COUPONS: Record<string, Coupon[]> = {
  ep01: [
    {
      id: "ep01-bakery",
      category: "빵집",
      shop: "성북동 빵집",
      benefit: "10%",
      condition: "빵 5,000원 이상 구매 시",
      price: 50,
      sample: true,
    },
    {
      id: "ep01-cafe",
      category: "카페",
      shop: "성북동 카페",
      benefit: "1,000원",
      condition: "음료 1잔 이상 주문 시",
      price: 100,
      sample: true,
    },
    {
      id: "ep01-kimbap",
      category: "김밥집",
      shop: "성북동 김밥집",
      benefit: "500원",
      condition: "김밥 2줄 이상 주문 시",
      price: 50,
      sample: true,
    },
    {
      id: "ep01-chicken",
      category: "치킨집",
      shop: "성북동 치킨집",
      benefit: "2,000원",
      condition: "치킨 1마리 이상 주문 시",
      price: 200,
      sample: true,
    },
  ],
};
