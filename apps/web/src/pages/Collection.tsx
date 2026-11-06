import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { COMING_SOON_EPISODES, EPISODES } from "../data/episodes";
import { hasAllClues, useProgress } from "../lib/progress";
import { CollectionCoupons } from "./CollectionCoupons";
import styles from "./Collection.module.css";

/**
 * 수집물 탭 (/collection) — 모은 단서(편지 조각) 카드와 쿠폰(?tab=coupons).
 * Figma "최종"에 이 화면 프레임이 없어서 단서 발견 화면(136:4524)의 카드 · 편지 조각 그림으로 구성.
 */
export default function Collection() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // 에피소드가 늘어나면 고르는 목록에 자동으로 나온다 (?ep=에피소드 id). 없으면 첫 에피소드
  const episode = EPISODES.find((e) => e.id === params.get("ep")) ?? EPISODES[0];
  const progress = useProgress(episode.id);
  const [picking, setPicking] = useState(false);
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
      <Stage footer={<TabBar />} background="var(--color-detail-bg)">
        <h1 className={styles.header}>수집물</h1>
        <div className={styles.tabs} role="tablist" aria-label="수집물 종류">
          {tab("단서", false)}
          {tab("쿠폰", true)}
        </div>
        <p className={styles.episodeLabel}>에피소드</p>
        <button
          type="button"
          className={styles.episodePicker}
          aria-haspopup="listbox"
          aria-expanded={picking}
          onClick={() => setPicking((open) => !open)}
        >
          {episode.title}
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        {!showCoupons && (
          <p className={styles.count}>
            단서 <b>{count}</b> / {episode.places.length}
          </p>
        )}

        {showCoupons ? (
          <CollectionCoupons episode={episode} />
        ) : (
          <>
            <ul className={styles.grid}>
              {episode.places.map((place) => {
                const found = progress.clues.includes(place.id);
                const note = progress.notes?.[place.id];
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={[styles.card, !found && styles.locked].filter(Boolean).join(" ")}
                      disabled={!found}
                      onClick={() => navigate(`/place/${place.id}/clue`)}
                      aria-label={found ? `${place.ordinal} 단서 “${place.clue.word}” — ${place.name}` : `${place.ordinal} 단서 — 아직 찾지 못했어요`}
                    >
                      <span className={styles.fragment}>
                        <img src={`/assets/clue-${place.id}.webp`} alt="" draggable={false} />
                        {!found && <img className={styles.lock} src="/assets/icons/lock.svg" alt="" />}
                      </span>
                      <span className={styles.ordinal}>{place.ordinal} 단서</span>
                      <span className={styles.word}>{found ? `“${place.clue.word}”` : "???"}</span>
                      <span className={styles.place}>{found ? place.clue.foundAt : "아직 찾지 못했어요"}</span>
                      {found && note && <span className={styles.note}>“{note}”</span>}
                    </button>
                  </li>
                );
              })}
            </ul>

            {hasAllClues(episode, progress) ? (
              <button
                type="button"
                className={[styles.tip, styles.tipLink].join(" ")}
                onClick={() => navigate(`/episode/${episode.id}/secret`)}
              >
                <img src="/assets/quiz-mascot.webp" alt="" draggable={false} />
                <p>{"단서를 모두 모았어요!\n눌러서 편지의 비밀을 확인해 보세요"}</p>
                <span className={styles.arrow} aria-hidden="true">
                  ›
                </span>
              </button>
            ) : (
              <div className={styles.tip}>
                <img src="/assets/quiz-mascot.webp" alt="" draggable={false} />
                <p>{"네 개의 단서를 모두 모으면\n편지의 수신인이 밝혀져요!"}</p>
              </div>
            )}
          </>
        )}

        {picking && (
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
