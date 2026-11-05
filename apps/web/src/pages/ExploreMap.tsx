import { useEffect, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { BackButton } from "../components/BackButton";
import type { Place } from "@sb/types";
import { EPISODES, getEpisode } from "../data/episodes";
import { isPlaceOpen, useProgress } from "../lib/progress";
import styles from "./ExploreMap.module.css";

/** 시작 후 흐른 시간 "08:56" / "1:08:56" */
function useElapsed(startedAt?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "00:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

function Pin({ place, open, onClick }: { place: Place; open: boolean; onClick: () => void }) {
  const p = place.pin;
  const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: x, top: y, width: w, height: h });
  return (
    <button
      type="button"
      className={open ? styles.pin : styles.pinLocked}
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.w, height: p.h }}
      onClick={onClick}
      aria-label={open ? `${place.name} 장소 인증하기` : `${place.name} (잠김)`}
    >
      <span className={styles.label} style={box(...(open ? p.label : (p.lockedLabel ?? p.label)))} />
      <span className={styles.ring} style={box(0, 0, ...p.ring)} />
      <span className={styles.photo} style={box(...p.photo)}>
        <img src={`/assets/${place.pinPhoto}`} alt="" draggable={false} />
        {!open && <img className={styles.lock} src="/assets/icons/lock.svg" alt="" />}
      </span>
      <span
        className={styles.name}
        style={{ left: p.text[0], top: p.text[1], width: p.text[2] || undefined, fontSize: p.fontSize }}
      >
        {place.pinLabel}
      </span>
    </button>
  );
}

/** Figma 136:2806 (5) ~ 136:2839 (8) 탐험 지도 */
export default function ExploreMap() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = episodeId ? getEpisode(episodeId) : EPISODES[0];
  const progress = useProgress(episode?.id ?? "");
  const elapsed = useElapsed(progress.startedAt);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!episode) return <Navigate to="/home" replace />;

  const openPlace = (place: Place, index: number) => {
    if (!isPlaceOpen(episode, index, progress)) {
      setToast(`${episode.places[index - 1].name}에서 단서를 먼저 찾아야 열려요!`);
      return;
    }
    navigate(progress.verified.includes(place.id) ? `/place/${place.id}/story` : `/place/${place.id}`);
  };

  return (
    <MobileFrame>
      <Stage
        footer={<TabBar />}
        background="#aee0fe"
        // 지도는 세로로 스크롤될 수 있어서 토스트는 화면(탭바 위)에 고정
        overlay={
          toast && (
            <p className={styles.toast} role="status">
              {toast}
            </p>
          )
        }
      >
        <BackButton to="/home" />
        <h1 className={styles.header}>탐험 지도</h1>

        <div className={styles.map}>
          <img className={styles.mapImage} src="/assets/map-ep01.jpg" alt="성북동 탐험 지도" draggable={false} />
          {episode.places.map((place, i) => (
            <Pin key={place.id} place={place} open={isPlaceOpen(episode, i, progress)} onClick={() => openPlace(place, i)} />
          ))}

          <div className={styles.status}>
            <img className={styles.thumb} src={`/assets/${episode.photo}`} alt="" />
            <span className={styles.ep}>{episode.badge}</span>
            <span className={styles.title}>{episode.title}</span>
            <span className={styles.timer} aria-label="탐험 시간">
              {elapsed}
            </span>
          </div>
        </div>
      </Stage>
    </MobileFrame>
  );
}
