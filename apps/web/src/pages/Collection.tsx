import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { COMING_SOON_EPISODES, EPISODES, placeName } from "../data/episodes";
import { hasAllClues, useProgress } from "../lib/progress";
import { CollectionCoupons } from "./CollectionCoupons";
import styles from "./Collection.module.css";

/**
 * 수집물 탭 (/collection) — 모은 단서(편지 조각) 카드(Figma 242:3980)와 쿠폰(?tab=coupons, CollectionCoupons).
 * 찾은 단서 카드를 누르면 그 장소에서 남긴 한 줄 기록(/place/:id/note)을 보여 준다.
 */
export default function Collection() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // 에피소드가 늘어나면 고르는 목록에 자동으로 나온다 (?ep=에피소드 id). 없으면 첫 에피소드
  const episode = EPISODES.find((e) => e.id === params.get("ep")) ?? EPISODES[0];
  const progress = useProgress(episode.id);
  const [picking, setPicking] = useState(false);
  // 쿠폰 창은 탭바까지 덮도록 Stage overlay 안의 이 칸에 그린다
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const showCoupons = params.get("tab") === "coupons";
  const go = (coupons: boolean, episodeId: string) =>
    setParams(
      { ...(coupons ? { tab: "coupons" } : {}), ...(episodeId !== EPISODES[0].id ? { ep: episodeId } : {}) },
      { replace: true },
    );
  const count = episode.places.filter((p) => progress.clues.includes(p.id)).length;

  const tab = (label: string, coupons: boolean) => (
    <button
      type="button"
      role="tab"
      aria-selected={showCoupons === coupons}
      className={showCoupons === coupons ? styles.tabOn : styles.tab}
      onClick={() => go(coupons, episode.id)}
    >
      {label}
    </button>
  );

  return (
    <MobileFrame>
      <Stage
        footer={<TabBar />}
        background="var(--color-detail-bg)"
        overlay={<div ref={setOverlayHost} className={styles.overlayHost} />}
      >
        <h1 className={styles.header}>수집물</h1>
        <div className={styles.tabs} role="tablist" aria-label="수집물 종류">
          {tab("단서", false)}
          {tab("쿠폰", true)}
        </div>
        {showCoupons ? (
          // Figma 311:8212: 쿠폰 탭에는 에피소드 고르기가 없고 마스코트 + 현재 포인트가 그 자리에 온다
          <CollectionCoupons episode={episode} overlayHost={overlayHost} />
        ) : (
          <>
            <img className={styles.bush} src="/assets/coupon-bush.webp" alt="" draggable={false} />
            <p className={styles.episodeLabel}>
              <svg viewBox="0 0 11 14" aria-hidden="true">
                <path
                  d="M2 0h8a1 1 0 0 1 1 1v9.5a.5.5 0 0 1-.5.5H2.2a.9.9 0 0 0 0 1.8h8.3a.5.5 0 0 1 0 1H2.2A2.2 2.2 0 0 1 0 11.6V2a2 2 0 0 1 2-2Zm1 2.2v1.3h5.5V2.2H3Z"
                  fill="currentColor"
                />
              </svg>
              에피소드
            </p>
            <button
              type="button"
              className={styles.episodePicker}
              aria-haspopup="listbox"
              aria-expanded={picking}
              aria-label={`에피소드: ${episode.title} (단서 ${count} / ${episode.places.length})`}
              onClick={() => setPicking((open) => !open)}
            >
              {episode.title}
              <span className={styles.chevron} aria-hidden="true" />
            </button>
            <img className={styles.mascot} src="/assets/collection-mascot.webp" alt="" draggable={false} />

            <ul className={styles.grid}>
              {episode.places.map((place) => {
                const found = progress.clues.includes(place.id);
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={[styles.card, !found && styles.locked].filter(Boolean).join(" ")}
                      disabled={!found}
                      // 문제 2에서 남긴 한 줄 기록을 보여 준다
                      onClick={() => navigate(`/place/${place.id}/note`)}
                      aria-label={
                        found
                          ? `${place.ordinal} 단서 “${place.clue.word}” — ${placeName(place)}. 눌러서 남긴 기록 보기`
                          : `${place.ordinal} 단서 — 아직 찾지 못했어요`
                      }
                    >
                      <img className={styles.thumb} src={`/assets/${place.pinPhoto}`} alt="" draggable={false} />
                      <span className={styles.place}>{found ? placeName(place) : "???"}</span>
                      <span className={styles.fragment}>
                        <img src={`/assets/clue-${place.id}.webp`} alt="" draggable={false} />
                        {!found && <img className={styles.lock} src="/assets/icons/lock.svg" alt="" />}
                      </span>
                      <span className={styles.ordinal}>{place.ordinal} 단서</span>
                      <span className={styles.word}>{found ? `“${place.clue.word}”` : "???"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {hasAllClues(episode, progress) && (
              <button type="button" className={styles.secret} onClick={() => navigate(`/episode/${episode.id}/secret`)}>
                <img src="/assets/quiz-mascot.webp" alt="" draggable={false} />
                <p>{"단서를 모두 모았어요!\n눌러서 편지의 비밀을 확인해 보세요"}</p>
                <span className={styles.arrow} aria-hidden="true" />
              </button>
            )}
          </>
        )}

        {picking && !showCoupons && (
          <>
            <button type="button" className={styles.episodeBack} aria-label="닫기" onClick={() => setPicking(false)} />
            <ul className={styles.episodeMenu} role="listbox" aria-label="에피소드">
              {EPISODES.map((e) => (
                <li key={e.id} role="option" aria-selected={e.id === episode.id}>
                  <button
                    type="button"
                    className={e.id === episode.id ? styles.episodeOn : styles.episodeItem}
                    onClick={() => {
                      go(showCoupons, e.id);
                      setPicking(false);
                    }}
                  >
                    <span className={styles.badge}>{e.badge}</span>
                    {e.title}
                  </button>
                </li>
              ))}
              {COMING_SOON_EPISODES.map((e) => (
                <li key={e.badge} role="option" aria-selected={false} aria-disabled={true}>
                  <span className={styles.episodeSoon}>
                    <span className={styles.badge}>{e.badge}</span>
                    공개 예정
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Stage>
    </MobileFrame>
  );
}
