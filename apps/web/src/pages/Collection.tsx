import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { EPISODES } from "../data/episodes";
import { hasAllClues, useProgress } from "../lib/progress";
import styles from "./Collection.module.css";

/**
 * 수집물 탭 (/collection) — 모은 단서(편지 조각) 카드.
 * Figma "최종"에 이 화면 프레임이 없어서 단서 발견 화면(136:4524)의 카드 · 편지 조각 그림으로 구성.
 */
export default function Collection() {
  // 지금은 에피소드가 하나뿐이라 EP.01만 보여 준다
  const episode = EPISODES[0];
  const progress = useProgress(episode.id);
  const navigate = useNavigate();
  const count = episode.places.filter((p) => progress.clues.includes(p.id)).length;

  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background="var(--color-detail-bg)">
        <h1 className={styles.header}>수집물</h1>
        <p className={styles.episode}>
          <span className={styles.badge}>{episode.badge}</span>
          {episode.title}
          <span className={styles.count}>
            단서 <b>{count}</b> / {episode.places.length}
          </span>
        </p>

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
      </Stage>
    </MobileFrame>
  );
}
