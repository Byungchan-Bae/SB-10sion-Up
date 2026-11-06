import { useEffect, useState } from "react";
import type { CouponStatus, CouponsResponse, Episode } from "@sb/types";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { getCoupons, redeemCoupon } from "../lib/api";
import styles from "./Collection.module.css";

const usedDate = (at: number) => {
  const d = new Date(at);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 사용`;
};

function Ticket({ coupon, locked }: { coupon: CouponStatus; locked: boolean }) {
  return (
    <>
      <span className={styles.ticketBenefit}>
        {locked ? (
          <img src="/assets/icons/lock.svg" alt="" />
        ) : (
          <>
            <b>{coupon.benefit}</b>
            할인
          </>
        )}
      </span>
      <span className={styles.ticketBody}>
        <span className={styles.ticketCategory}>{coupon.category}</span>
        <span className={styles.ticketShop}>{coupon.shop}</span>
        <span className={styles.ticketCondition}>{locked ? "완주하면 열려요" : coupon.condition}</span>
      </span>
    </>
  );
}

/**
 * 수집물 탭의 쿠폰 목록 (/collection?tab=coupons). Stage 직속 요소로 그린다.
 * 에피소드를 완주하면 열리고, 직원에게 보여 준 뒤 사용 완료를 누르면 서버에 한 번만 기록한다.
 */
export function CollectionCoupons({ episode }: { episode: Episode }) {
  const [data, setData] = useState<CouponsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [useError, setUseError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getCoupons(episode.id, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [episode.id, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const close = () => {
    setOpenId(null);
    setUseError(null);
  };

  const redeem = async (couponId: string) => {
    setBusy(true);
    setUseError(null);
    try {
      setData(await redeemCoupon(episode.id, couponId));
      close();
    } catch (err) {
      setUseError(err instanceof Error ? err.message : "처리하지 못했어요. 다시 시도해 주세요");
    } finally {
      setBusy(false);
    }
  };

  if (failed) {
    return (
      <div className={styles.message} role="alert">
        <p>쿠폰을 불러오지 못했어요</p>
        <button type="button" className={styles.retry} onClick={retry}>
          다시 시도
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <p className={styles.message} role="status">
        불러오는 중이에요…
      </p>
    );
  }

  const open = data.coupons.find((c) => c.id === openId);
  const left = data.unlocked ? data.coupons.filter((c) => c.usedAt === undefined).length : 0;

  return (
    <>
      <p className={styles.couponCount}>
        쓸 수 있는 쿠폰 <b>{left}</b> / {data.coupons.length}
      </p>
      <ul className={styles.tickets}>
        {data.coupons.map((coupon) => {
          const used = coupon.usedAt !== undefined;
          const locked = !data.unlocked && !used;
          return (
            <li key={coupon.id}>
              <button
                type="button"
                className={[styles.ticket, locked && styles.ticketLocked, used && styles.ticketUsed]
                  .filter(Boolean)
                  .join(" ")}
                disabled={locked || used}
                onClick={() => setOpenId(coupon.id)}
              >
                <Ticket coupon={coupon} locked={locked} />
                {used && <span className={styles.ticketState}>{usedDate(coupon.usedAt as number)}</span>}
                {!locked && !used && <span className={styles.ticketArrow} aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.tip}>
        <img src="/assets/quiz-mascot.png" alt="" draggable={false} />
        <p>
          {data.coupons.some((c) => c.sample)
            ? "지금은 예시 쿠폰이에요.\n제휴 매장이 정해지면 바뀌어요"
            : "에피소드를 완주하면\n근처 가게 쿠폰을 받아요!"}
        </p>
      </div>

      {open && (
        <div className={styles.dialogBack}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`${open.shop} 쿠폰`}>
            <div className={[styles.ticket, styles.dialogTicket].join(" ")}>
              <Ticket coupon={open} locked={false} />
            </div>
            <p className={styles.dialogText}>
              {"직원에게 이 화면을 보여 주세요.\n사용 완료는 직원 앞에서 눌러 주세요.\n한 번 누르면 되돌릴 수 없어요."}
            </p>
            {useError && (
              <p className={styles.dialogError} role="alert">
                {useError}
              </p>
            )}
            <PrimaryButton size="md" disabled={busy} onClick={() => redeem(open.id)}>
              {busy ? "처리하는 중…" : "사용 완료"}
            </PrimaryButton>
            <SecondaryButton size="md" disabled={busy} onClick={close}>
              닫기
            </SecondaryButton>
          </div>
        </div>
      )}
    </>
  );
}
