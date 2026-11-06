import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { Stamp, STAMP_MS } from "../components/Stamp";
import type { Rect } from "@sb/types";
import { findPlace } from "../data/episodes";
import { rectStyle } from "../lib/rect";
import { checkQuiz } from "../lib/api";
import { applyServerProgress, getProgress, useProgress } from "../lib/progress";
import styles from "./PlaceQuiz.module.css";

const MAX_NOTE = 30;

/** 힌트 카드 위치 (PlaceQuiz.module.css .hintBox와 같은 값) */
const HINT_BOX = { left: 33, top: 240 };
/** data의 힌트 그림 좌표(무대 기준)를 카드 안 좌표로 */
const inHintBox = ([left, top, width, height]: Rect): Rect => [left - HINT_BOX.left, top - HINT_BOX.top, width, height];

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
  /** 서버가 정답이라고 확인한 보기 — 문제 2를 낼 때 같이 보낸다 */
  const [solved, setSolved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(() =>
    found ? (getProgress(found.episode.id).notes?.[found.place.id] ?? "") : "",
  );

  /** 정답 도장을 보여 주는 중. 끝나면 문제 2로 */
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => {
      setCelebrating(false);
      setStep(2);
    }, STAMP_MS);
    return () => clearTimeout(t);
  }, [celebrating]);

  if (!found) return <Navigate to="/map" replace />;
  const { episode, place } = found;
  if (!progress.verified.includes(place.id)) return <Navigate to={`/place/${place.id}`} replace />;
  const { quiz } = place;

  // 정답은 서버(/api/quiz)에서 확인한다
  const submitChoice = async () => {
    if (!selected || busy || celebrating) return;
    setBusy(true);
    setError(null);
    try {
      const { correct } = await checkQuiz(place.id, selected);
      if (correct) {
        setSolved(selected);
        setCelebrating(true);
      } else {
        // 틀리면 흔들고 선택을 풀어 다시 고르게 한다
        setWrong(selected);
        setSelected(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "확인하지 못했어요. 다시 시도해주세요");
    }
    setBusy(false);
  };

  const submitNote = async () => {
    const text = note.trim();
    if (!text || !solved || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await checkQuiz(place.id, solved, text);
      applyServerProgress(res.episodeId, res.progress);
      if (res.correct) {
        navigate(`/place/${place.id}/clue`, { replace: true });
        return;
      }
      setStep(1); // 있을 수 없는 경우지만, 정답이 바뀌었으면 문제 1부터 다시
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 다시 시도해주세요");
    }
    setBusy(false);
  };

  return (
    <MobileFrame>
      <Stage background="#fff">
        <img className={styles.leavesRight} src="/assets/quiz-leaves-right.webp" alt="" draggable={false} />
        <img className={styles.leavesLeft} src="/assets/quiz-leaves-left.webp" alt="" draggable={false} />
        <img className={styles.landscape} src="/assets/quiz-landscape.webp" alt="" draggable={false} />

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

        <p key={`q${step}`} className={styles.qLabel}>
          Q{step}
        </p>
        <h2 key={`t${step}`} className={styles.question}>{step === 1 ? quiz.question : quiz.reflection}</h2>

        {step === 1 ? (
          <>
            {/* 힌트 그림은 카드 안에 넣어 카드의 둥근 모서리로 잘리게 한다 (카드 왼쪽 끝에 붙은 그림이 모서리 밖으로 안 나오게) */}
            <div className={styles.hintBox}>
              <img
                className={styles.hintImage}
                style={rectStyle(inHintBox(quiz.hintImage))}
                src={`/assets/hint-${place.id}.webp`}
                alt={quiz.hint}
                draggable={false}
              />
            </div>
            <img
              className={styles.mascot}
              style={{ left: quiz.mascot[0], top: quiz.mascot[1] }}
              src="/assets/quiz-mascot.webp"
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
                    selected === option && (celebrating ? styles.correct : styles.selected),
                    wrong === option && styles.wrong,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelected(option);
                    setWrong(null);
                    setError(null);
                  }}
                  onAnimationEnd={() => setWrong(null)}
                >
                  {option}
                </button>
              ))}
            </div>
            {(wrong || error) && (
              <p className={styles.feedback} role={error ? "alert" : "status"}>
                {error ?? "다시 생각해 보세요!"}
              </p>
            )}

            <PrimaryButton size="md" className={styles.confirm} disabled={!selected || busy || celebrating} onClick={submitChoice}>
              {busy ? "확인 중…" : "확인"}
            </PrimaryButton>
          </>
        ) : (
          <>
            <img className={styles.paper} src="/assets/quiz-paper.webp" alt="" draggable={false} />
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

            {error && (
              <p className={styles.feedback} role="alert">
                {error}
              </p>
            )}
            <PrimaryButton size="md" className={styles.confirm} disabled={!note.trim() || busy} onClick={submitNote}>
              {busy ? "저장 중…" : "확인"}
            </PrimaryButton>
          </>
        )}
        {celebrating && <Stamp text="정답!" />}
      </Stage>
    </MobileFrame>
  );
}
