import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { markClueFound } from "../lib/progress";
import styles from "./TabPlaceholder.module.css";

/**
 * 문제 풀이 자리 (/place/:id/quiz) — 4단계(feat/quiz)에서 실제 문제 화면으로 교체.
 * 지금은 다음 장소가 열리는지 확인할 수 있게 "단서 찾음" 처리만 한다.
 */
export default function QuizPlaceholder() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const found = findPlace(placeId);
  if (!found) return <Navigate to="/map" replace />;
  const { episode, place } = found;

  return (
    <MobileFrame>
      <Stage background="var(--color-detail-bg)">
        <BackButton />
        <div className={styles.box}>
          <h1>{place.name} 문제</h1>
          <p>문제 풀이는 4단계에서 만들어요</p>
        </div>
        <PrimaryButton
          size="md"
          style={{ left: 60, top: 700, width: 270 }}
          onClick={() => {
            markClueFound(episode.id, place.id);
            navigate("/map", { replace: true });
          }}
        >
          단서 찾은 걸로 처리 (임시)
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
