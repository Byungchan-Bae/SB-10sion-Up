import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { CouponStatus, CouponsResponse, Episode } from "@sb/types";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { buyCoupon, getCoupons, redeemCoupon } from "../lib/api";
import styles from "./CollectionCoupons.module.css";

/** 서버가 포인트 부족으로 교환을 거절할 때의 문구 (api/coupons.ts) */
const SHORT_OF_POINTS = "포인트가 부족해요";
const ALREADY_BOUGHT = "이미 교환한 쿠폰이에요";
/** 변경 뒤 표가 초록으로 바뀌고 포인트가 줄어드는 걸 보여 준 다음 사용 화면으로 넘어가기까지 */
const BOUGHT_PAUSE_MS = 1100;
/** 창이 닫히는 애니메이션 길이 (CSS .closing과 맞춤) */
const CLOSE_MS = 220;

/**
 * 쿠폰 표 오른쪽 아래 음식 그림 (Figma 311:8212). 그림 파일은 /assets/coupon-<쿠폰 id>.webp
 * right · top은 표 오른쪽 위 기준. 목록(342폭)과 창 속 표(310폭)에서 같은 자리에 오도록 오른쪽에서 잰다.
 */
const ICONS: Record<string, { right: number; top: number; width: number; height: number }> = {
  "ep01-bakery": { right: 18, top: 63, width: 49, height: 34 },
  "ep01-cafe": { right: 23, top: 48, width: 38, height: 57 },
  "ep01-kimbap": { right: 23, top: 65, width: 42, height: 27 },
  "ep01-chicken": { right: 18, top: 55, width: 53, height: 37 },
};

const reduceMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** 숫자가 바뀌면 이전 값에서 새 값까지 부드럽게 세어 간다 (포인트가 줄어드는 모습) */
function useTween(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || reduceMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const t = Math.min(1, (now - t0) / duration);
      const v = Math.round(start + (target - start) * (1 - Math.pow(1 - t, 3)));
      from.current = v;
      setValue(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

type Step = "exchange" | "use" | "short";

const isBought = (c: CouponStatus) => c.boughtAt !== undefined;
const isUsed = (c: CouponStatus) => c.usedAt !== undefined;

/** 쿠폰 표 한 장의 안쪽 (목록과 창에서 함께 씀) */
function TicketFace({ coupon }: { coupon: CouponStatus }) {
  const icon = ICONS[coupon.id];
  return (
    <>
      <span className={styles.benefit}>
        <b>{coupon.benefit}</b>
        할인
      </span>
      <span className={styles.body}>
        <span className={styles.category}>{coupon.category}</span>
        <span className={styles.shop}>{coupon.shop}</span>
        <span className={styles.condition}>{coupon.condition}</span>
      </span>
      {icon && (
        <img
          className={styles.food}
          style={{ right: icon.right, top: icon.top, width: icon.width, height: icon.height }}
          src={`/assets/coupon-${coupon.id}.webp`}
          alt=""
          draggable={false}
        />
      )}
    </>
  );
}

/**
 * 수집물 탭의 쿠폰 (/collection?tab=coupons) — Figma 311:8212(목록) · 311:8648(변경 확인) · 311:8352(사용).
 * 에피소드를 완주해 모은 포인트로 쿠폰을 바꾸고(초록 표), 가게에서 직원에게 보여 준 뒤 사용 완료를 누르면
 * 표가 뿌옇게 바뀌고 사용완료 도장이 찍힌다. 교환 · 사용은 서버에 한 번만 기록된다.
 *
 * 움직임: 창은 회색 배경 위로 살짝 올라오며 열리고, 변경하면 창 속 표가 초록으로 물들며 포인트가 줄어든 뒤
 * 같은 창이 사용 화면으로 부드럽게 바뀐다. 사용 완료하면 창이 닫히고 목록의 표 위로 도장이 쾅 찍힌다.
 *
 * 창은 탭바까지 덮도록 overlayHost(Stage overlay 안의 빈 칸)에 그린다. 없으면 무대 안에 그린다.
 */
export function CollectionCoupons({ episode, overlayHost }: { episode: Episode; overlayHost?: HTMLElement | null }) {
  const [data, setData] = useState<CouponsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [openId, setOpenId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("exchange");
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  /** 변경 직후 초록으로 바뀐 표를 잠깐 보여 주는 중 */
  const [justBought, setJustBought] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  /** 방금 사용 완료한 쿠폰: 도장이 찍히는 애니메이션을 한 번만 보여 준다 */
  const [stampedId, setStampedId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    getCoupons(episode.id, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [episode.id, attempt]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const points = useTween(data?.points ?? 0);

  // 창이 열려 있으면 Esc로 닫기
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !justBought) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const open = (coupon: CouponStatus) => {
    if (!data || isUsed(coupon)) return;
    window.clearTimeout(timer.current);
    setSheetError(null);
    setJustBought(false);
    setClosing(false);
    setStep(isBought(coupon) ? "use" : data.points < coupon.price ? "short" : "exchange");
    setOpenId(coupon.id);
  };

  const close = () => {
    window.clearTimeout(timer.current);
    setClosing(true);
    timer.current = window.setTimeout(
      () => {
        setOpenId(null);
        setClosing(false);
        setJustBought(false);
        setSheetError(null);
      },
      reduceMotion() ? 0 : CLOSE_MS,
    );
  };

  const exchange = async (couponId: string) => {
    setBusy(true);
    setSheetError(null);
    try {
      setData(await buyCoupon(episode.id, couponId));
      // 표가 초록으로 바뀌고 포인트가 줄어드는 걸 보여 준 뒤 사용 화면으로
      setJustBought(true);
      timer.current = window.setTimeout(
        () => {
          setJustBought(false);
          setStep("use");
        },
        reduceMotion() ? 0 : BOUGHT_PAUSE_MS,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === SHORT_OF_POINTS || message === ALREADY_BOUGHT) {
        // 다른 기기에서 포인트를 썼거나 이미 바꾼 쿠폰: 목록을 새로 받고 맞는 창으로
        setAttempt((n) => n + 1);
        setStep(message === SHORT_OF_POINTS ? "short" : "use");
      } else {
        setSheetError(message || "바꾸지 못했어요. 다시 시도해 주세요");
      }
    } finally {
      setBusy(false);
    }
  };

  const redeem = async (couponId: string) => {
    setBusy(true);
    setSheetError(null);
    try {
      const next = await redeemCoupon(episode.id, couponId);
      setStampedId(couponId);
      setData(next);
      close();
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : "처리하지 못했어요. 다시 시도해 주세요");
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

  const current = data.coupons.find((c) => c.id === openId);

  const sheet = current && (
    <div className={[styles.dim, closing && styles.closing].filter(Boolean).join(" ")}>
      <button
        type="button"
        className={styles.dimClose}
        aria-label="닫기"
        tabIndex={-1}
        disabled={busy || justBought}
        onClick={close}
      />
      <div
        className={styles.sheet}
        data-step={step}
        role="dialog"
        aria-modal="true"
        aria-label={step === "use" ? `${current.shop} 쿠폰 사용` : `${current.shop} 쿠폰 변경`}
      >
        {/* 변경 확인 · 포인트 부족: 위쪽 마스코트 + 현재 포인트 + 질문 */}
        <div className={styles.top} aria-hidden={step === "use"}>
          <img className={styles.peek} src="/assets/home-mascots.webp" alt="" draggable={false} />
          <p className={styles.pointBox}>
            현재 point : <b>{points}</b>
          </p>
          <p className={styles.question}>{step === "short" ? "포인트가 부족해요" : "변경하시겠습니까?"}</p>
        </div>

        {/* 쿠폰 표: 변경 확인에서는 질문 아래, 사용 화면에서는 맨 위로 올라간다 */}
        <div
          className={[styles.ticket, styles.sheetTicket, isBought(current) && styles.bought, justBought && styles.pressed]
            .filter(Boolean)
            .join(" ")}
          aria-hidden={step === "short"}
        >
          <TicketFace coupon={current} />
          {justBought && <span className={styles.shine} aria-hidden="true" />}
        </div>

        {/* 사용 안내 · 포인트 부족 안내 (감 마스코트 상자) */}
        <div className={styles.info} aria-hidden={step === "exchange"}>
          <img src="/assets/coupon-tip-mascot.webp" alt="" draggable={false} />
          <p>
            {step === "short"
              ? `이 쿠폰은 ${current.price} point예요.\n에피소드를 완주하면\n${episode.points} point를 받아요!`
              : "직원에게 이 화면을 보여 주세요.\n사용 완료는 직원 앞에서 눌러 주세요.\n한 번 누르면 되돌릴 수 없어요."}
          </p>
        </div>

        {sheetError && (
          <p className={styles.error} role="alert">
            {sheetError}
          </p>
        )}

        <PrimaryButton
          size="md"
          className={[styles.primary, justBought && styles.done].filter(Boolean).join(" ")}
          disabled={busy || justBought}
          onClick={() => (step === "exchange" ? exchange(current.id) : step === "use" ? redeem(current.id) : close())}
        >
          {step === "short"
            ? "확인"
            : step === "use"
              ? busy
                ? "처리하는 중…"
                : "사용 하기"
              : justBought
                ? "변경 완료!"
                : busy
                  ? "바꾸는 중…"
                  : "변경"}
        </PrimaryButton>
        <SecondaryButton size="md" className={styles.secondary} disabled={busy || justBought} onClick={close}>
          닫기
        </SecondaryButton>
      </div>
    </div>
  );

  return (
    <>
      <img className={styles.bush} src="/assets/coupon-bush.webp" alt="" draggable={false} />
      <img className={styles.mascot} src="/assets/coupon-mascot.webp" alt="" draggable={false} />
      <p className={styles.bubble} aria-live="polite">
        현재 point : {points}
      </p>

      <ul className={styles.tickets}>
        {data.coupons.map((coupon, i) => {
          const bought = isBought(coupon);
          const used = isUsed(coupon);
          const stamped = used && stampedId === coupon.id;
          return (
            <li key={coupon.id} style={{ "--i": i } as CSSProperties}>
              <button
                type="button"
                className={[styles.ticket, bought && styles.bought, used && styles.used, stamped && styles.justUsed]
                  .filter(Boolean)
                  .join(" ")}
                disabled={used}
                onClick={() => open(coupon)}
                aria-label={`${coupon.shop} ${coupon.benefit} 할인 쿠폰 — ${
                  used ? "사용 완료" : bought ? "교환함, 눌러서 사용" : `${coupon.price} point로 교환`
                }`}
              >
                <TicketFace coupon={coupon} />
                {!bought && <span className={styles.price}>{coupon.price} PT</span>}
                <span className={styles.arrow} aria-hidden="true" />
              </button>
              {used && (
                <span className={[styles.stamp, stamped && styles.stampIn].filter(Boolean).join(" ")} aria-hidden="true">
                  <img src="/assets/coupon-stamp.webp" alt="" draggable={false} />
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {sheet &&
        (overlayHost ? (
          createPortal(sheet, overlayHost)
        ) : (
          // 탭바 위 무대 안에 그릴 때는 이미 무대 배율이 적용돼 있다
          <div className={styles.inStage} style={{ "--stage-scale": 1 } as CSSProperties}>
            {sheet}
          </div>
        ))}
    </>
  );
}
