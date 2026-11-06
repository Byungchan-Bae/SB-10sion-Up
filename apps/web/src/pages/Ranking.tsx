import { useEffect, useState } from "react";
import type { RankingEntry, RankingResponse } from "@sb/types";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { EPISODES } from "../data/episodes";
import { getRanking } from "../lib/api";
import { formatDuration } from "../lib/duration";
import styles from "./Ranking.module.css";

const time = (entry: RankingEntry) => (entry.durationMs === null ? "시간 기록 없음" : formatDuration(entry.durationMs));

/**
 * 랭킹 탭 (/ranking) — 포인트 많은 순 → 소요 시간 짧은 순.
 * Figma "최종"에 이 화면 프레임이 없어서 수집물 탭과 같은 색 · 글꼴로 구성.
 */
export default function Ranking() {
  // 지금은 에피소드가 하나뿐이라 EP.01만 보여 준다
  const episode = EPISODES[0];
  const [data, setData] = useState<RankingResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getRanking(episode.id, controller.signal)
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

  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background="var(--color-detail-bg)">
        <h1 className={styles.header}>랭킹</h1>
        <p className={styles.episode}>
          <span className={styles.badge}>{episode.badge}</span>
          {episode.title}
          {data && (
            <span className={styles.count}>
              완주 <b>{data.total}</b>명
            </span>
          )}
        </p>

        <div className={styles.mine}>
          <img src="/assets/quiz-mascot.webp" alt="" draggable={false} />
          {data?.me ? (
            <p>
              내 순위 <b>{data.me.rank}위</b>
              <span>
                {data.me.points} point · {time(data.me)}
              </span>
            </p>
          ) : (
            <p>{"에피소드를 끝까지 완주하면\n내 순위가 여기에 나와요!"}</p>
          )}
        </div>

        <div className={styles.body}>
          {failed ? (
            <div className={styles.message} role="alert">
              <p>랭킹을 불러오지 못했어요</p>
              <button type="button" className={styles.retry} onClick={retry}>
                다시 시도
              </button>
            </div>
          ) : !data ? (
            <p className={styles.message} role="status">
              불러오는 중이에요…
            </p>
          ) : data.entries.length === 0 ? (
            <p className={styles.message}>{"아직 완주한 사람이 없어요.\n첫 번째 주인공이 되어보세요!"}</p>
          ) : (
            <ol className={styles.list}>
              {data.entries.map((entry) => (
                <li key={entry.rank} className={entry.isMe ? styles.me : styles.row}>
                  <span className={styles.rank} data-top={entry.rank <= 3 ? entry.rank : undefined}>
                    {entry.rank}
                  </span>
                  <span className={styles.name}>
                    {entry.nickname}
                    {entry.isMe && <em>나</em>}
                  </span>
                  <span className={styles.score}>
                    <b>{entry.points} point</b>
                    {time(entry)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Stage>
    </MobileFrame>
  );
}
