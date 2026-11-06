import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Place } from "@sb/types";
import { askAi } from "../lib/api";
import { getNickname } from "../lib/storage";
import { BackButton } from "./BackButton";
import styles from "./AskMate.module.css";

const MAX_QUESTION = 200;
/** 자동응답도 잠깐 생각하는 모습을 보여 준다 */
const FAQ_DELAY_MS = 500;

type Turn = { question: string; answer?: string; error?: string };

/** 헤드셋 쓴 감이 말풍선으로 알려 주는 모습 */
function Mate({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div className={styles.mateRow}>
      <img className={styles.mateIcon} src="/assets/ask-mate-avatar.webp" alt="" draggable={false} />
      <div className={error ? styles.err : styles.a}>{children}</div>
    </div>
  );
}

/**
 * AI 트레저 메이트 (Figma 390:10618). 장소 이야기 화면의 "AI 질문하기"에서 전체 화면으로 열린다.
 * 자주 묻는 질문(place.faq)은 AI를 쓰지 않고 바로 답한다.
 */
export function AskMate({ place, onClose }: { place: Place; onClose: () => void }) {
  const { id: placeId, faq } = place;
  const placeName = place.heroName ?? place.name;
  const nickname = getNickname();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setQuestion("");
    setLoading(true);
    setTurns((t) => [...t, { question: q }]);
    try {
      // 자주 묻는 질문은 AI를 쓰지 않는다 (하루 질문 수에서도 빠짐)
      const saved = faq.find((f) => f.question === q);
      if (saved) await new Promise((r) => setTimeout(r, FAQ_DELAY_MS));
      const answer = saved ? saved.answer : (await askAi(placeId, q)).answer;
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, answer } : turn)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "답을 받지 못했어요";
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, error: message } : turn)));
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  const remaining = faq.filter((f) => !turns.some((turn) => turn.question === f.question));
  const started = turns.length > 0;

  return (
    <section className={styles.screen} role="dialog" aria-modal="true" aria-labelledby="ask-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <BackButton label="닫기" onClick={onClose} />
          <h2 id="ask-title">AI 트레저 메이트</h2>
        </header>

        <div className={styles.list} ref={listRef} aria-live="polite">
          <img
            className={started ? styles.heroSmall : styles.hero}
            src="/assets/ask-mate-avatar.webp"
            alt=""
            draggable={false}
          />
          <p className={styles.greeting}>
            안녕하세요!👋 {nickname ? `${nickname}님` : ""}
            <br />
            성북 트레저 AI 탐험 도우미예요.
            <br />
            {placeName}에 대해 궁금한 점이 있으면
            <br />
            무엇이든 물어보세요!
          </p>

          {/* 대화를 시작하기 전에만 보이는 감 · 참새 그림. 참새에 안경을 씌웠다 */}
          {!started && (
            <div className={styles.mascots} aria-hidden="true">
              <img src="/assets/ask-mate-mascots.webp" alt="" draggable={false} />
              <svg viewBox="0 0 266 166">
                <g fill="rgb(255 255 255 / 0.25)" stroke="#2b1405" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round">
                  <circle cx="166" cy="53" r="11" />
                  <circle cx="196" cy="53" r="11" />
                  <path d="M177 52 Q181 49 185 52" fill="none" />
                </g>
              </svg>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className={styles.turn}>
              <p className={styles.q}>{turn.question}</p>
              {turn.answer && <Mate>{turn.answer}</Mate>}
              {turn.error && <Mate error>{turn.error}</Mate>}
              {!turn.answer && !turn.error && (
                <Mate>
                  <span className={styles.thinking} role="status" aria-label="찾아보는 중이에요">
                    <i />
                    <i />
                    <i />
                  </span>
                </Mate>
              )}
            </div>
          ))}

          {!loading && remaining.length > 0 && (
            <div className={styles.suggestions}>
              <h3>{started ? "이것도 궁금하지 않나요?" : "이런 질문은 어때요?"}</h3>
              {remaining.map((f) => (
                <button key={f.question} type="button" className={styles.suggestion} onClick={() => ask(f.question)}>
                  {f.question}
                </button>
              ))}
            </div>
          )}
        </div>

        <img className={styles.bush} src="/assets/ask-mate-bush.webp" alt="" draggable={false} />

        <div className={styles.bottom}>
          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION))}
              placeholder="궁금한 내용을 물어봐 주세요."
              aria-label="질문"
              enterKeyHint="send"
            />
            <button type="submit" className={styles.send} disabled={!question.trim() || loading} aria-label="보내기">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 3 3 10.5l7 3 3 7.5L21 3Z" fill="currentColor" />
              </svg>
            </button>
          </form>
          <p className={styles.notice}>AI 답변은 틀릴 수 있어요. 이름·연락처 같은 개인정보는 적지 마세요.</p>
        </div>
      </div>
    </section>
  );
}
