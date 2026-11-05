import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { getEpisode } from "../data/episodes";
import { startEpisode } from "../lib/progress";
import styles from "./EpisodeIntro.module.css";

/** Figma 136:2455 스토리 ("의문의 편지") */
export default function EpisodeIntro() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(episodeId);
  if (!episode) return <Navigate to="/home" replace />;
  const { intro } = episode;

  return (
    <MobileFrame>
      <Stage background='#e9c9a0 url("/assets/story-bg.jpg") center bottom / cover no-repeat'>
        <img className={styles.letter} src="/assets/story-letter.png" alt="" draggable={false} />
        <BackButton />

        <h1 className={styles.title}>{intro.title}</h1>
        <p className={styles.lead}>{intro.lead}</p>
        <p className={styles.body}>{intro.body}</p>

        <span className={styles.tag}>
          <img src="/assets/icons/book.svg" alt="" width={13} height={17} />
          당신의 미션
        </span>
        <p className={styles.mission}>{intro.mission}</p>

        <PrimaryButton
          size="md"
          className={styles.cta}
          onClick={() => {
            startEpisode(episode.id);
            navigate(`/episode/${episode.id}/map`);
          }}
        >
          다음
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
