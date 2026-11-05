import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { rectStyle } from "../lib/rect";
import { completeQuiz, getProgress, useProgress } from "../lib/progress";
import styles from "./PlaceQuiz.module.css";

const MAX_NOTE = 30;

/**
 * 문제 풀이 (/place/:id/quiz).
 * 문제 1 = Figma 문제 7 (길상사 136:4087), 문제 2 = 문제 8 (136:4112). 장소마다 data만 다르다.
 */
export default function PlaceQuiz() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const found = findPlace(placeId);
  const progress = useProgress(found?.episode.id ?? "");
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [note, setNote] = useState(() =>
    found ? (getProgress(found.episode.id).notes?.[found.place.id] ?? "") : "",
  );

  if (!found) return <Navigate to="/map" replace />;
  const { episode, place } = found;
  if (!progress.verified.includes(place.id)) return <Navigate to={`/place/${place.id}`} replace />;
  const { quiz } = place;

  const submitChoice = () => {
    if (!selected) return;
    if (selected === quiz.answer) {
      setStep(2);
      return;
    }
    // 틀리면 흔들고 선택을 풀어 다시 고르게 한다
    setWrong(selected);
    setSelected(null);
  };

  const submitNote = () => {
    const text = note.trim();
    if (!text) return;
    completeQuiz(episode.id, place.id, text);
    navigate(`/place/${place.id}/clue`, { replace: true });
  };

  return (
    <MobileFrame>
      <Stage background="#fff">
        <img className={styles.leavesRight} src="/assets/quiz-leaves-right.png" alt="" draggable={false} />
        <img className={styles.leavesLeft} src="/assets/quiz-leaves-left.png" alt="" draggable={false} />
        <img className={styles.landscape} src="/assets/quiz-landscape.png" alt="" draggable={false} />

        <h1 className={styles.header}>
          {episode.badge} {episode.title}
        </h1>
        {step === 1 ? (
          <BackButton to={`/place/${place.id}/story`} />
        ) : (
          <BackButton label="이전 문제" onClick={() => setStep(1)} />
        )}

        {/* 진행 바 + "문제 n/2" (문제 8은 Figma에서 7px 오른쪽) */}
        <div className={styles.progress} data-step={step} aria-label={`문제 ${step}/2`}>
          <span className={styles.barOn} />
          <span className={step === 2 ? styles.barOn : styles.barOff} />
          <span className={styles.count}>문제 {step}/2</span>
        </div>

        <p className={styles.qLabel}>Q{step}</p>
        <h2 className={styles.question}>{step === 1 ? quiz.question : quiz.reflection}</h2>

        {step === 1 ? (
          <>
            <div className={styles.hintBox} />
            <img
              className={styles.hintImage}
              style={rectStyle(quiz.hintImage)}
              src={`/assets/hint-${place.id}.png`}
              alt={quiz.hint}
              draggable={false}
            />
            <img
              className={styles.mascot}
              style={{ left: quiz.mascot[0], top: quiz.mascot[1] }}
              src="/assets/quiz-mascot.png"
              alt=""
              draggable={false}
            />

            <div className={styles.options} role="radiogroup" aria-label="보기">
              {quiz.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected === option}
                  className={[
                    styles.option,
                    selected === option && styles.selected,
                    wrong === option && styles.wrong,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelected(option);
                    setWrong(null);
                  }}
                  onAnimationEnd={() => setWrong(null)}
                >
                  {option}
                </button>
              ))}
            </div>
            {wrong && (
              <p className={styles.feedback} role="status">
                다시 생각해 보세요!
              </p>
            )}

            <PrimaryButton size="md" className={styles.confirm} disabled={!selected} onClick={submitChoice}>
              확인
            </PrimaryButton>
          </>
        ) : (
          <>
            <img className={styles.paper} src="/assets/quiz-paper.png" alt="" draggable={false} />
            {[376, 407, 443, 474].map((top) => (
              <img key={top} className={styles.line} style={{ top }} src="/assets/icons/dotted-line.svg" alt="" />
            ))}
            <textarea
              className={styles.note}
              value={note}
              maxLength={MAX_NOTE}
              spellCheck={false}
              placeholder={`한 줄로 입력해보세요! (최대 ${MAX_NOTE}자)`}
              aria-label={quiz.reflection.replace("\n", " ")}
              onChange={(e) => setNote(e.target.value.replace(/\n/g, "").slice(0, MAX_NOTE))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNote();
                }
              }}
            />
            <p className={styles.counter} aria-live="polite">
              {note.length} / {MAX_NOTE}
            </p>

            <PrimaryButton size="md" className={styles.confirm} disabled={!note.trim()} onClick={submitNote}>
              확인
            </PrimaryButton>
          </>
        )}
      </Stage>
    </MobileFrame>
  );
}
