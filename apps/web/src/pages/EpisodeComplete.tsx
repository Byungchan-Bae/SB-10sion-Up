import { useEffect, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { getEpisode } from "../data/episodes";
import { formatDuration } from "../lib/duration";
import { useProgress } from "../lib/progress";
import { playEffect } from "../components/Bgm";
import styles from "./EpisodeComplete.module.css";

const COIN_SOUND = "/audio/coin.mp3";
/** 조각이 모여 배지가 튀어나오는 시점 (EpisodeComplete.module.css .badge의 badgeIn 1.22s) */
const BADGE_IN_MS = 1220;

/** 움직임 줄이기 설정이면 효과 없이 끝난 모습만 */
const reduceMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** 배지 가운데 (Stage 좌표) — 조각이 모이는 곳 */
const BADGE_X = 194.5;
const BADGE_Y = 410;
/** 액자 네 귀퉁이 동그란 장식 (왼쪽 위 · 오른쪽 위 · 왼쪽 아래 · 오른쪽 아래). 장소 순서대로 한 조각씩 */
const CORNERS: [number, number][] = [
  [42, 423],
  [346, 421],
  [42, 586],
  [346, 588],
];
const TILTS = [-10, 9, 7, -8];
/** 배지 둘레 반짝이 [배지 가운데에서 x, y, 크기] */
const SPARKLES: [number, number, number][] = [
  [-62, -28, 14],
  [60, -34, 12],
  [-68, 24, 10],
  [66, 22, 15],
  [-36, -52, 9],
  [38, 50, 11],
];

/** 포인트 숫자 올라가기: delay 뒤 duration 동안 0 → target (끝으로 갈수록 천천히) */
function useCountUp(target: number, delay: number, duration: number) {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0));
  useEffect(() => {
    if (reduceMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, delay, duration]);
  return value;
}

/**
 * 수집 완료 (/episode/:id/complete) — Figma 136:4504
 * 들어오면: 액자 네 귀퉁이에서 이번 에피소드 편지 조각 4개가 나와 배지 자리로 모이고 →
 * 금빛이 번지며 배지가 나타나고 → 포인트가 0에서 올라가고 → 소요 시간 · 질문이 차례로 나온다 (약 2.5초).
 * 버튼은 처음부터 누를 수 있다.
 */
export default function EpisodeComplete() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(episodeId);
  const progress = useProgress(episode?.id ?? "");
  const points = useCountUp(episode?.points ?? 0, 1600, 850);
  const completed = !!progress.completedAt;

  // 단서 조각이 모여 배지로 바뀌는 순간 동전 소리 (움직임 줄이기 설정이면 화면이 뜨자마자)
  useEffect(() => {
    if (!completed) return;
    const t = window.setTimeout(() => void playEffect(COIN_SOUND), reduceMotion() ? 0 : BADGE_IN_MS);
    return () => window.clearTimeout(t);
  }, [completed]);

  if (!episode) return <Navigate to="/home" replace />;
  // 밝혀진 비밀에서 완료를 눌러야 들어온다
  if (!progress.completedAt) return <Navigate to={`/episode/${episode.id}/secret`} replace />;
  const duration = formatDuration(progress.completedAt - (progress.startedAt ?? progress.completedAt));

  return (
    <MobileFrame>
      <Stage background="#feeaad">
        <img className={styles.ticket} src="/assets/complete-ticket.webp" alt="" draggable={false} />
        <span className={styles.ticketFade} aria-hidden="true" />
        <BackButton to={`/episode/${episode.id}/secret`} />

        <img className={styles.mascots} src="/assets/complete-mascots.webp" alt="" draggable={false} />
        <h1 className={styles.title}>수집 완료</h1>

        {/* 편지 조각이 모여 배지가 되는 효과 */}
        {episode.places.map((place, i) => {
          const [cx, cy] = CORNERS[i % CORNERS.length];
          const sx = cx - BADGE_X;
          const sy = cy - BADGE_Y;
          return (
            <img
              key={place.id}
              className={styles.fragment}
              style={
                {
                  "--sx": `${sx}px`,
                  "--sy": `${sy}px`,
                  "--mx": `${sx * 0.45}px`,
                  "--my": `${sy * 0.45 - 40}px`,
                  "--rot": `${TILTS[i % TILTS.length]}deg`,
                  "--delay": `${0.15 + i * 0.08}s`,
                } as CSSProperties
              }
              src={`/assets/clue-${place.id}.webp`}
              alt=""
              draggable={false}
            />
          );
        })}
        <span className={styles.glow} aria-hidden="true" />
        <img className={styles.badge} src="/assets/complete-badge.webp" alt={`${episode.badge} 배지`} draggable={false} />
        {SPARKLES.map(([dx, dy, size], i) => (
          <svg
            key={i}
            className={styles.sparkle}
            style={
              {
                left: BADGE_X + dx - size / 2,
                top: BADGE_Y + dy - size / 2,
                width: size,
                height: size,
                "--delay": `${1.35 + i * 0.07}s`,
              } as CSSProperties
            }
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" fill="#f5b301" />
            <circle cx="10" cy="10" r="2.2" fill="#fff6d0" />
          </svg>
        ))}

        <p className={styles.points} aria-label={`${episode.points} point 획득`}>
          <em aria-hidden="true">
            {/* 자리 잡기용 최종 숫자(안 보임) 위에 올라가는 숫자를 겹쳐서, 숫자가 바뀌어도 글자가 흔들리지 않게 */}
            <span className={styles.count}>
              <span className={styles.countGhost}>{episode.points}</span>
              <span className={styles.countLive}>{points}</span>
            </span>{" "}
            point
          </em>
          <span aria-hidden="true"> 획득</span>
        </p>
        <p className={styles.duration}>
          <img src="/assets/icons/location-orange.svg" alt="" width={24.739} height={24.739} />
          <span className={styles.label}>소요 시간</span>
          <span aria-hidden="true">|</span>
          <span className={styles.value}>{duration}</span>
        </p>
        <p className={styles.ask}>다른 에피소드로 이동해볼까요?</p>

        <PrimaryButton size="md" className={styles.next} onClick={() => navigate("/home")}>
          다음 에피소드 보기
        </PrimaryButton>
        <SecondaryButton size="md" className={styles.collection} onClick={() => navigate("/collection")}>
          수집물 보기
        </SecondaryButton>
      </Stage>
    </MobileFrame>
  );
}
