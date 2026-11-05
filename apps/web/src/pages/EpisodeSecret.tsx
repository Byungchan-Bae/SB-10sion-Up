import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { Emphasis } from "../components/Emphasis";
import { getEpisode } from "../data/episodes";
import { completeEpisode, hasAllClues, useProgress } from "../lib/progress";
import styles from "./EpisodeSecret.module.css";

/** 밝혀진 비밀 (/episode/:id/secret) — Figma 136:4582. 단서를 모두 모아야 열린다. */
export default function EpisodeSecret() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(episodeId);
  const progress = useProgress(episode?.id ?? "");

  if (!episode) return <Navigate to="/home" replace />;
  if (!hasAllClues(episode, progress)) return <Navigate to="/map" replace />;
  const { secret } = episode;

  return (
    <MobileFrame>
      <Stage background='#e9b98a url("/assets/clue-bg.jpg") center / cover no-repeat'>
        <img className={styles.bg} src="/assets/clue-bg.jpg" alt="" draggable={false} />
        <BackButton to="/map" />

        <div className={styles.card} />
        <img className={styles.title} src="/assets/secret-title.png" alt="" draggable={false} />
        <h1 className="sr-only">밝혀진 비밀</h1>

        <p className={styles.reveal}>
          <span className={styles.lead}>{secret.lead}</span>
          <br />
          <span className={styles.headline}>
            <Emphasis text={secret.headline} className={styles.em} />
          </span>
        </p>
        <p className={styles.body}>{secret.body}</p>

        <img
          className={styles.letter}
          src="/assets/secret-letter.png"
          alt="편지: “시간이 흘러도 이곳의 이야기를 기억해 주기를,”"
          draggable={false}
        />

        <div className={styles.closingBox} />
        <p className={styles.closing}>{secret.closing}</p>

        <PrimaryButton
          size="md"
          className={styles.done}
          onClick={() => {
            completeEpisode(episode.id);
            navigate(`/episode/${episode.id}/complete`);
          }}
        >
          완료
        </PrimaryButton>
        <SecondaryButton size="md" className={styles.collection} onClick={() => navigate("/collection")}>
          수집물 보기
        </SecondaryButton>
      </Stage>
    </MobileFrame>
  );
}
