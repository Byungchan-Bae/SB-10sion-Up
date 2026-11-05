import { useEffect, useRef, useState, type FormEvent } from "react";
import { askAi } from "../lib/api";
import styles from "./AskSheet.module.css";

const MAX_QUESTION = 200;

type Turn = { question: string; answer?: string; error?: string };

/** 장소 이야기 화면의 "AI 질문하기" 아래 시트 */
export function AskSheet({ placeId, placeName, onClose }: { placeId: string; placeName: string; onClose: () => void }) {
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
  }, [turns]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setLoading(true);
    setTurns((t) => [...t, { question: q }]);
    try {
      const { answer } = await askAi(placeId, q);
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, answer } : turn)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "답을 받지 못했어요";
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, error: message } : turn)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="ask-title">AI에게 물어보기</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <div className={styles.list} ref={listRef} aria-live="polite">
          {turns.length === 0 && (
            <p className={styles.empty}>
              {placeName}에 대해 궁금한 걸 물어보세요!
              <br />
              <span>예) 이곳은 언제 만들어졌어요?</span>
            </p>
          )}
          {turns.map((turn, i) => (
            <div key={i} className={styles.turn}>
              <p className={styles.q}>{turn.question}</p>
              {turn.answer && <p className={styles.a}>{turn.answer}</p>}
              {turn.error && <p className={styles.err}>{turn.error}</p>}
              {!turn.answer && !turn.error && <p className={styles.a}>생각하는 중…</p>}
            </div>
          ))}
        </div>

        <form className={styles.form} onSubmit={submit}>
          <input
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION))}
            placeholder="질문을 입력하세요"
            aria-label="질문"
            enterKeyHint="send"
            autoFocus
          />
          <button type="submit" className={styles.send} disabled={!question.trim() || loading}>
            보내기
          </button>
        </form>
        <p className={styles.notice}>AI 답변은 틀릴 수 있어요. 이름·연락처 같은 개인정보는 적지 마세요.</p>
      </section>
    </div>
  );
}
