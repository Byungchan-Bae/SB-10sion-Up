import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { PrimaryButton } from "../components/Button";
import { EPISODES } from "../data/episodes";
import { useSelectedEpisode } from "../lib/selection";
import ExploreMap from "./ExploreMap";
import styles from "./MapHome.module.css";

/**
 * 하단 탭 "지도" (/map).
 * 에피소드에 들어가 있으면 그 지도, 아니면 진행 기록이 있어도 에피소드 선택 안내 (Figma 221:3534).
 * 지도에 들어오는 것만으로는 시작 · 타이머 · 포인트를 건드리지 않는다.
 */
export default function MapHome() {
  const selected = useSelectedEpisode();
  const episode = EPISODES.find((ep) => ep.id === selected);
  return episode ? <ExploreMap episodeId={episode.id} /> : <MapEmpty />;
}

/** Figma 221:3534 에피소드 고르기 전 지도 탭 (390 × 844 기준) */
function MapEmpty() {
  const navigate = useNavigate();
  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background="#fff">
        <img className={styles.leaves} src="/assets/empty-map-leaves.webp" alt="" draggable={false} />
        <img className={styles.mascots} src="/assets/empty-map-mascots.webp" alt="" draggable={false} />
        <h1 className={styles.title}>어떤 모험을 떠나볼까요?</h1>
        <p className={styles.desc}>
          에피소드를 선택하면
          <br />
          나만의 탐험 지도가 열려요.
        </p>
        <PrimaryButton size="md" className={styles.cta} onClick={() => navigate("/home")}>
          에피소드 선택하기
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
