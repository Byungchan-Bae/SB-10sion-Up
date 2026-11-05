import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { Emphasis } from "../components/Emphasis";
import { getEpisode } from "../data/episodes";
import styles from "./EpisodeDetail.module.css";

/** Figma 136:2411 에피소드 상세 */
export default function EpisodeDetail() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(episodeId);
  if (!episode) return <Navigate to="/home" replace />;

  const info = [
    { label: "시작 위치", value: episode.startPlace },
    { label: "이동 거리", value: episode.distance },
    { label: "예상 소요 시간", value: episode.duration },
  ];

  return (
    <MobileFrame>
      <Stage background="linear-gradient(#fff 50%, var(--color-detail-bg) 50%)">
        <div className={styles.cream} />
        <img className={styles.paper} src="/assets/detail-paper.png" alt="" draggable={false} />
        <img className={styles.leaves} src="/assets/leaves-corner.png" alt="" draggable={false} />

        <BackButton to="/home" />
        <h1 className={styles.header}>에피소드 상세</h1>

        <div className={styles.photoCard}>
          <img className={styles.photo} src={`/assets/${episode.photo}`} alt={`${episode.startPlace} 사진`} />
          <span className={styles.badge}>{episode.badge}</span>
        </div>
        <img className={styles.mascots} src={`/assets/${episode.mascots}`} alt="" draggable={false} />

        <h2 className={styles.title}>{episode.title}</h2>

        <span className={styles.tag}>
          <img src="/assets/icons/book.svg" alt="" width={13} height={17} />
          이야기
        </span>

        <p className={styles.hook}>
          <span className={styles.quoteOpen} aria-hidden="true">“</span>
          <span className={styles.quoteClose} aria-hidden="true">“</span>
          <Emphasis text={episode.hook} className={styles.em} />
        </p>

        <p className={styles.summary}>
          <Emphasis text={episode.summary} className={styles.emLight} />
        </p>

        <div className={styles.infoBox} />
        <dl className={styles.info}>
          {info.map((row) => (
            <div key={row.label} className={styles.row}>
              <img src="/assets/icons/location.svg" alt="" width={17} height={17} />
              <dt>{row.label}</dt>
              <span aria-hidden="true">|</span>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <PrimaryButton size="md" className={styles.cta} onClick={() => navigate(`/episode/${episode.id}/intro`)}>
          시작하기
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
