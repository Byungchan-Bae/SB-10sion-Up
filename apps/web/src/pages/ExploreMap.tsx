import { useEffect, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { BackButton } from "../components/BackButton";
import type { Place } from "@sb/types";
import { EPISODES, getEpisode } from "../data/episodes";
import { isPlaceOpen, useProgress } from "../lib/progress";
import { clearSelectedEpisode } from "../lib/selection";
import { isDemoLink } from "../lib/storage";
import styles from "./ExploreMap.module.css";

/** 발표 시연: 자물쇠가 풀리는 시간 (ExploreMap.module.css lockOpen과 맞출 것) */
const DEMO_UNLOCK_MS = 700;
/** 발표 시연: 풀린 핀을 보여 준 뒤 다음 화면으로 넘어가기까지 */
const DEMO_OPENED_MS = 650;

/** 시작 후 흐른 시간 "08:56" / "1:08:56". 에피소드를 끝냈으면 끝낸 시각에서 멈춘다 */
function useElapsed(startedAt?: number, completedAt?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || completedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt, completedAt]);
  if (!startedAt) return "00:00";
  const s = Math.max(0, Math.floor(((completedAt ?? now) - startedAt) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

function Pin({
  place,
  open,
  current,
  shaking,
  unlocking,
  onClick,
}: {
  place: Place;
  open: boolean;
  /** 다음 목적지 */
  current: boolean;
  /** 잠긴 핀을 눌러서 흔들리는 중 */
  shaking: boolean;
  /** 발표 시연: 자물쇠가 풀리는 중 */
  unlocking: boolean;
  onClick: () => void;
}) {
  const p = place.pin;
  const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: x, top: y, width: w, height: h });
  return (
    <button
      type="button"
      className={[open ? styles.pin : styles.pinLocked, current && styles.pinCurrent, shaking && styles.shaking, unlocking && styles.unlocking]
        .filter(Boolean)
        .join(" ")}
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.w, height: p.h }}
      onClick={onClick}
      aria-label={open ? `${place.name} 장소 인증하기` : `${place.name} (잠김)`}
    >
      <span
        className={p.drawnSign ? `${styles.label} ${styles.drawnSign}` : styles.label}
        style={box(...(open ? p.label : (p.lockedLabel ?? p.label)))}
      />
      <span className={styles.ring} style={p.ring.length === 4 ? box(...p.ring) : box(0, 0, ...p.ring)} />
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
/** episodeId: /map 에서 MapHome이 정해 넘김. 없으면 주소(/episode/:episodeId/map)의 값 */
export default function ExploreMap({ episodeId: chosenId }: { episodeId?: string } = {}) {
  const { episodeId: routeId } = useParams();
  const episodeId = chosenId ?? routeId;
  const navigate = useNavigate();
  const episode = episodeId ? getEpisode(episodeId) : EPISODES[0];
  const progress = useProgress(episode?.id ?? "");
  const elapsed = useElapsed(progress.startedAt, progress.completedAt);
  const [toast, setToast] = useState<string | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  // 발표 시연: 마지막 장소는 잠겨 보이다가, 누르면 자물쇠가 풀리고 다음 화면으로 넘어간다
  const [demoStep, setDemoStep] = useState<"locked" | "unlocking" | "opened">("locked");
  const demoPlace = episode?.places.at(-1);
  const demoLocked =
    isDemoLink() && !!demoPlace && !progress.verified.includes(demoPlace.id) && demoStep !== "opened";

  useEffect(() => {
    if (demoStep === "locked" || !demoPlace) return;
    const t =
      demoStep === "unlocking"
        ? setTimeout(() => {
            setDemoStep("opened");
            setToast(`${demoPlace.name}의 잠금이 풀렸어요!`);
          }, DEMO_UNLOCK_MS)
        : setTimeout(() => navigate(`/place/${demoPlace.id}`), DEMO_OPENED_MS);
    return () => clearTimeout(t);
  }, [demoStep, demoPlace, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!shakingId) return;
    const t = setTimeout(() => setShakingId(null), 400);
    return () => clearTimeout(t);
  }, [shakingId]);

  if (!episode) return <Navigate to="/home" replace />;

  // 다음 목적지 = 열려 있고 아직 단서를 못 찾은 첫 장소
  const currentIndex = episode.places.findIndex(
    (place, i) => isPlaceOpen(episode, i, progress) && !progress.clues.includes(place.id),
  );

  const openPlace = (place: Place, index: number) => {
    if (demoLocked && place.id === demoPlace?.id) {
      setDemoStep("unlocking");
      return;
    }
    if (!isPlaceOpen(episode, index, progress)) {
      setToast(`${episode.places[index - 1].name}에서 단서를 먼저 찾아야 열려요!`);
      setShakingId(place.id);
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
        <BackButton
          onClick={() => {
            clearSelectedEpisode();
            // 폰의 뒤로가기로 이 지도에 돌아오지 않게 기록을 바꿔치기한다
            navigate("/map", { replace: true });
          }}
        />
        <h1 className={styles.header}>탐험 지도</h1>

        <div className={styles.map}>
          <img className={styles.mapImage} src="/assets/map-ep01.webp" alt="성북동 탐험 지도" draggable={false} />
          <span className={styles.skyFade} aria-hidden="true" />
          {episode.places.map((place, i) => (
            <Pin
              key={place.id}
              place={place}
              open={isPlaceOpen(episode, i, progress) && !(demoLocked && place.id === demoPlace?.id)}
              current={i === currentIndex && !(demoLocked && place.id === demoPlace?.id)}
              shaking={shakingId === place.id}
              unlocking={demoStep === "unlocking" && place.id === demoPlace?.id}
              onClick={() => openPlace(place, i)}
            />
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
