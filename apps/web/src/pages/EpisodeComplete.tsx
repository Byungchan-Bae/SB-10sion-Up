import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { getEpisode } from "../data/episodes";
import { formatDuration } from "../lib/duration";
import { useProgress } from "../lib/progress";
import styles from "./EpisodeComplete.module.css";

/** 수집 완료 (/episode/:id/complete) — Figma 136:4504 */
export default function EpisodeComplete() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(episodeId);
  const progress = useProgress(episode?.id ?? "");

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
        <img className={styles.badge} src="/assets/complete-badge.webp" alt={`${episode.badge} 배지`} draggable={false} />

        <p className={styles.points}>
          <em>{episode.points} point</em> 획득
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
