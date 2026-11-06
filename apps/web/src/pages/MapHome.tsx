import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import { PrimaryButton } from "../components/Button";
import { EPISODES, getEpisode } from "../data/episodes";
import { hasAnyProgress, useProgress, useProgressSettled } from "../lib/progress";
import { NO_EPISODE, useSelectedEpisode } from "../lib/selection";
import ExploreMap from "./ExploreMap";
import styles from "./MapHome.module.css";

/**
 * 하단 탭 "지도" (/map).
 * 0) 뒤로가기로 고른 것을 해제했으면 진행 기록이 있어도 에피소드 선택 안내
 * 1) 시작해서 고른 에피소드가 있으면 그 지도
 * 2) 고른 기록은 없어도 진행 기록(시작 · 인증 · 단서 · 완료)이 있는 에피소드가 있으면 그 지도
 * 3) 서버 기록을 아직 불러오는 중이면 아무것도 그리지 않음 (잘못된 화면이 잠깐 보이지 않게)
 * 4) 그 밖에는 에피소드 선택 안내 (Figma 221:3534)
 * 지도에 들어오는 것만으로는 시작 · 타이머 · 포인트를 건드리지 않는다.
 */
export default function MapHome() {
  const selected = useSelectedEpisode();
  // 에피소드 목록은 고정이라 훅 호출 순서가 바뀌지 않는다
  const progresses = EPISODES.map((ep) => useProgress(ep.id));
  const settled = EPISODES.map((ep) => useProgressSettled(ep.id)).every(Boolean);

  if (selected === NO_EPISODE) return <MapEmpty />;

  const chosen =
    (selected && getEpisode(selected)?.id) ?? EPISODES.find((_, i) => hasAnyProgress(progresses[i]))?.id;
  if (chosen) return <ExploreMap episodeId={chosen} />;
  if (!settled) return <MapLoading />;
  return <MapEmpty />;
}

function MapLoading() {
  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background="#fff">
        <span className="sr-only" role="status">
          지도를 불러오는 중이에요
        </span>
      </Stage>
    </MobileFrame>
  );
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
