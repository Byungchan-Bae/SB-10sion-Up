import { Link, useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { PrimaryButton } from "../components/Button";
import { EPISODES } from "../data/episodes";
import styles from "./Home.module.css";

/** Figma 136:2362 홈 */
export default function Home() {
  const navigate = useNavigate();
  const episode = EPISODES[0];
  const detailPath = `/episode/${episode.id}`;

  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background='#f7ead8 url("/assets/home-bg.jpg") center bottom / cover no-repeat'>
        <h1 className={styles.heading} data-text={"진행 가능한\n에피소드"}>
          {"진행 가능한\n에피소드"}
        </h1>

        <img className={styles.frame} src="/assets/home-card-frame.png" alt="" draggable={false} />

        <Link to={detailPath} className={styles.card} aria-label={`${episode.badge} ${episode.title}`}>
          <img className={styles.cardArt} src={`/assets/${episode.cardImage}`} alt="" draggable={false} />
          <span className={styles.badge}>{episode.badge}</span>
          <span className={styles.title} data-text={episode.title}>
            {episode.title}
          </span>
          <span className={styles.quoteOpen} aria-hidden="true">“</span>
          <span className={styles.quoteClose} aria-hidden="true">“</span>
          <span className={styles.teaserBox}>
            <span className={styles.teaser}>{episode.teaser}</span>
          </span>
        </Link>

        <img className={styles.mascots} src="/assets/home-mascots.png" alt="" draggable={false} />

        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dotActive} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>

        <PrimaryButton size="md" className={styles.cta} onClick={() => navigate(detailPath)}>
          에피소드 보기
        </PrimaryButton>

      </Stage>
    </MobileFrame>
  );
}
