import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { PrimaryButton } from "../components/Button";
import { COMING_SOON_EPISODES, EPISODES } from "../data/episodes";
import { useProgress } from "../lib/progress";
import styles from "./Home.module.css";

/** 카드 간격: 카드 폭 326 + 사이 11 (Figma 다음 카드 위치 기준) */
const SLIDE_STEP = 337;

/** Figma 136:2362 홈 */
export default function Home() {
  const navigate = useNavigate();
  const episode = EPISODES[0];
  const detailPath = `/episode/${episode.id}`;
  const total = 1 + COMING_SOON_EPISODES.length;
  // 최종 클리어 = 밝혀진 비밀에서 "완료"를 눌러 남긴 completedAt (이 기기 기록 + 서버 기록을 합친 값)
  const cleared = Boolean(useProgress(episode.id).completedAt);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const isOpen = current === 0;

  const settleTimer = useRef<number | undefined>(undefined);

  const goTo = (index: number) => {
    scrollerRef.current?.scrollTo({ left: index * SLIDE_STEP, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    // Stage가 확대/축소돼도 scrollLeft는 무대 좌표(px) 기준
    const index = Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / SLIDE_STEP)));
    setCurrent(index);

    // 손을 뗀 뒤 카드 사이에 멈춰 있으면 가장 가까운 카드 가운데로 붙임 (CSS 스냅이 안 먹는 브라우저 대비)
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - index * SLIDE_STEP) > 1) goTo(index);
    }, 120);
  };

  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background='#f7ead8 url("/assets/home-bg.webp") center bottom / cover no-repeat'>
        <h1 className={styles.heading} data-text={"진행 가능한\n에피소드"}>
          {"진행 가능한\n에피소드"}
        </h1>

        <div ref={scrollerRef} className={styles.carousel} onScroll={onScroll}>
          {/* 1번: 진행 가능한 에피소드 */}
          <div className={styles.slide}>
            <img className={styles.frame} src="/assets/home-card-frame-single.webp" alt="" draggable={false} />
            <Link
              to={detailPath}
              className={styles.card}
              aria-label={`${episode.badge} ${episode.title}${cleared ? " (완료)" : ""}`}
            >
              <img className={styles.cardArt} src={`/assets/${episode.cardImage}`} alt="" draggable={false} />
              <span className={styles.badge}>{episode.badge}</span>
              <span className={styles.title} data-text={episode.title}>
                {episode.title}
              </span>
              <span className={styles.quoteOpen} aria-hidden="true">“</span>
              <span className={styles.quoteClose} aria-hidden="true">“</span>
              <span className={styles.teaserBox}>
                <span className={styles.teaser}>{episode.teaser}</span>
              </span>
              {/* 최종 클리어한 에피소드: 카드만 어둡게 덮고 가운데에 컬러 완료 도장 (Figma 242:3980) */}
              {cleared && (
                <>
                  <span className={styles.clearDim} aria-hidden="true" />
                  <img className={styles.clearStamp} src="/assets/home-complete-stamp.webp" alt="" draggable={false} />
                </>
              )}
            </Link>
            <img className={styles.mascots} src="/assets/home-mascots.webp" alt="" draggable={false} />
          </div>

          {/* 2번부터: 공개 예정 */}
          {COMING_SOON_EPISODES.map(({ badge, message }) => (
            <div key={badge} className={styles.slide}>
              <img className={styles.frame} src="/assets/home-card-frame-single.webp" alt="" draggable={false} />
              <div className={`${styles.card} ${styles.locked}`} aria-label={`${badge} 공개 예정`}>
                <img className={styles.cardArt} src={`/assets/${episode.cardImage}`} alt="" draggable={false} />
                <span className={styles.lockedDim} />
                <span className={`${styles.badge} ${styles.badgeLocked}`}>{badge}</span>
                <span className={styles.lockedBox}>
                  <svg className={styles.lockIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className={styles.lockedTitle}>공개 예정</span>
                  <span className={styles.lockedText}>{message}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              className={i === current ? styles.dotActive : styles.dot}
              aria-label={`${i + 1}번째 카드`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <PrimaryButton size="md" className={styles.cta} disabled={!isOpen} onClick={() => navigate(detailPath)}>
          {isOpen ? "에피소드 보기" : "공개 예정"}
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
