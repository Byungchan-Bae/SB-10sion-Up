import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { LeafBurst } from "../components/LeafBurst";
import { PrimaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { rectStyle } from "../lib/rect";
import { hasAllClues, useProgress } from "../lib/progress";
import { particle } from "../lib/korean";
import styles from "./PlaceClue.module.css";


/** 단서 발견 (/place/:id/clue) — Figma 136:4524 (길상사), 4538, 4553, 4568 */
export default function PlaceClue() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  // 수집물 탭에서 다시 보러 왔으면 게임 흐름용 "다음" 버튼은 숨기고, 뒤로 가기(왼쪽 위)로 수집물에 돌아간다
  const fromCollection = (useLocation().state as { from?: string } | null)?.from === "collection";
  const found = findPlace(placeId);
  const progress = useProgress(found?.episode.id ?? "");

  if (!found) return <Navigate to="/map" replace />;
  const { episode, place, index } = found;
  // 문제를 아직 안 풀었으면 문제 화면으로
  if (!progress.clues.includes(place.id)) return <Navigate to={`/place/${place.id}/quiz`} replace />;
  const { clue } = place;
  // 마지막 장소의 단서일 때만 "밝혀진 비밀"로. 이미 다 깬 뒤 처음이나 중간부터 다시 하면 다음 장소로 이어서 간다
  const isLast = index === episode.places.length - 1;

  return (
    <MobileFrame>
      <Stage background='#e9b98a url("/assets/clue-bg.webp") center / cover no-repeat'>
        <img className={styles.bg} src="/assets/clue-bg.webp" alt="" draggable={false} />
        <BackButton to={fromCollection ? "/collection" : "/map"} />

        <div className={styles.card} />
        <img className={styles.title} src="/assets/clue-title.webp" alt="" draggable={false} />
        <h1 className="sr-only">단서 발견!</h1>

        <img className={styles.thumb} style={rectStyle(clue.thumb)} src={`/assets/${place.pinPhoto}`} alt="" />
        {clue.subLabel && <p className={styles.subLabel}>{clue.subLabel}</p>}
        <p className={styles.foundAt}>
          {clue.foundAt}에서
          <br />
          단서를 찾았어요!
        </p>

        <img
          className={styles.fragment}
          style={rectStyle(clue.image)}
          src={`/assets/clue-${place.id}.webp`}
          alt={`편지 조각: ${clue.word}`}
          draggable={false}
        />

        <p className={styles.desc}>
          “{clue.word}”{particle(clue.word, "이", "가")} 적힌 편지 조각을 발견했어요
        </p>
        <p className={styles.summary}>
          성북동에 남겨진
          <br />
          {place.ordinal} 단서는 <em>“{clue.word}”</em>입니다
        </p>

        {/* 마지막 장소에서 단서를 다 모았으면 지도 대신 "밝혀진 비밀"로. 수집물에서 왔으면 다음 버튼 없음 */}
        {fromCollection ? null : isLast && hasAllClues(episode, progress) ? (
          <PrimaryButton size="md" className={styles.next} onClick={() => navigate(`/episode/${episode.id}/secret`)}>
            다음
          </PrimaryButton>
        ) : (
          <PrimaryButton size="md" className={styles.next} onClick={() => navigate("/map")}>
            다음 에피소드 보기
          </PrimaryButton>
        )}
        {/* 문제를 맞히고 단서를 막 찾았을 때만 단풍이 터짐 (수집물에서 다시 볼 땐 없음). 터지는 곳은 편지 조각 가운데 */}
        {!fromCollection && <LeafBurst x={clue.image[0] + clue.image[2] / 2} y={clue.image[1] + clue.image[3] / 2} />}

      </Stage>
    </MobileFrame>
  );
}
