import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { rectStyle } from "../lib/rect";
import { useProgress } from "../lib/progress";
import { particle } from "../lib/korean";
import styles from "./PlaceClue.module.css";


/** 단서 발견 (/place/:id/clue) — Figma 136:4524 (길상사), 4538, 4553, 4568 */
export default function PlaceClue() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const found = findPlace(placeId);
  const progress = useProgress(found?.episode.id ?? "");

  if (!found) return <Navigate to="/map" replace />;
  const { place } = found;
  // 문제를 아직 안 풀었으면 문제 화면으로
  if (!progress.clues.includes(place.id)) return <Navigate to={`/place/${place.id}/quiz`} replace />;
  const { clue } = place;

  return (
    <MobileFrame>
      <Stage background='#e9b98a url("/assets/clue-bg.jpg") center / cover no-repeat'>
        <img className={styles.bg} src="/assets/clue-bg.jpg" alt="" draggable={false} />
        <BackButton to="/map" />

        <div className={styles.card} />
        <img className={styles.title} src="/assets/clue-title.png" alt="" draggable={false} />
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
          src={`/assets/clue-${place.id}.png`}
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

        <PrimaryButton size="md" className={styles.next} onClick={() => navigate("/map")}>
          다음 에피소드 보기
        </PrimaryButton>
        <SecondaryButton size="md" className={styles.collection} onClick={() => navigate("/collection")}>
          수집물 보기
        </SecondaryButton>
      </Stage>
    </MobileFrame>
  );
}
