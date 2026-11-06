import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { PrimaryButton } from "../components/Button";
import { EPISODES, findPlace, placeName } from "../data/episodes";
import { useProgress } from "../lib/progress";
import styles from "./PlaceNote.module.css";

/** 문제 2 입력 칸과 같은 최대 글자 수 (PlaceQuiz.tsx MAX_NOTE) */
const MAX_NOTE = 30;

/**
 * 남긴 기록 (/place/:id/note) — Figma 문제 9 ~ 12 (311:10225, 10245, 10265, 10285).
 * 수집물 탭에서 찾은 단서 카드를 누르면 그 장소의 문제 2에서 적은 한 줄을 문제 2와 같은 양피지에 다시 보여 준다.
 * 고칠 수는 없고 "닫기"로 수집물에 돌아간다.
 */
export default function PlaceNote() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const found = findPlace(placeId);
  const progress = useProgress(found?.episode.id ?? "");

  if (!found) return <Navigate to="/collection" replace />;
  const { episode, place } = found;
  // 아직 못 찾은 단서는 볼 수 없다
  if (!progress.clues.includes(place.id)) return <Navigate to="/collection" replace />;

  const note = progress.notes?.[place.id]?.trim() ?? "";
  const close = () => navigate(episode.id === EPISODES[0].id ? "/collection" : `/collection?ep=${episode.id}`);

  return (
    <MobileFrame>
      <Stage background="#fff">
        <img className={styles.leavesRight} src="/assets/quiz-leaves-right.webp" alt="" draggable={false} />
        <img className={styles.leavesLeft} src="/assets/quiz-leaves-left.webp" alt="" draggable={false} />
        <img className={styles.landscape} src="/assets/quiz-landscape.webp" alt="" draggable={false} />

        <img className={styles.mascots} src="/assets/complete-mascots.webp" alt="" draggable={false} />
        <h1 className={styles.title}>{`${placeName(place)}에서 느낀 분위기를\n한 줄로 남겼어요`}</h1>

        <img className={styles.paper} src="/assets/quiz-paper.webp" alt="" draggable={false} />
        {[376, 407, 443, 474].map((top) => (
          <img key={top} className={styles.line} style={{ top }} src="/assets/icons/dotted-line.svg" alt="" />
        ))}
        <p className={note ? styles.note : styles.empty}>{note || "남긴 기록이 없어요"}</p>
        <p className={styles.counter}>
          {note.length} / {MAX_NOTE}
        </p>

        <PrimaryButton size="md" className={styles.close} onClick={close}>
          닫기
        </PrimaryButton>
      </Stage>
    </MobileFrame>
  );
}
