import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Place } from "@sb/types";
import { askAi } from "../lib/api";
import { DoctorMascot } from "./DoctorMascot";
import styles from "./AskSheet.module.css";

const MAX_QUESTION = 200;
/** 자동응답도 잠깐 생각하는 모습을 보여 준다 */
const FAQ_DELAY_MS = 500;

type Turn = { question: string; answer?: string; error?: string };

/** 참새 박사가 말풍선으로 알려 주는 모습 */
function Doctor({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div className={styles.doctorRow}>
      <DoctorMascot className={styles.avatar} />
      <div className={error ? styles.err : styles.a}>{children}</div>
    </div>
  );
}

/** 장소 이야기 화면의 "참새 박사에게 물어보기" 아래 시트. 답은 AI가 만들고, 참새 박사가 알려 주는 모습으로 보여 준다 */
export function AskSheet({ place, onClose }: { place: Place; onClose: () => void }) {
  const { id: placeId, faq } = place;
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

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-title"
        onClick={(e) => e.stopPropagation()}
      >
        <DoctorMascot className={styles.hero} />
        <header className={styles.header}>
          <h2 id="ask-title">참새 박사에게 물어보기</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <div className={styles.list} ref={listRef} aria-live="polite">
          <Doctor>
            안녕하세요, 참새 박사예요!
            <br />
            {place.heroName ?? place.name}에 대해 궁금한 게 있나요?
          </Doctor>
          {turns.map((turn, i) => (
            <div key={i} className={styles.turn}>
              <p className={styles.q}>{turn.question}</p>
              {turn.answer && <Doctor>{turn.answer}</Doctor>}
              {turn.error && <Doctor error>{turn.error}</Doctor>}
              {!turn.answer && !turn.error && (
                <Doctor>
                  <span className={styles.thinking} role="status" aria-label="찾아보는 중이에요">
                    <i />
                    <i />
                    <i />
                  </span>
                </Doctor>
              )}
            </div>
          ))}
          {/* 아직 안 물어본 자주 묻는 질문 */}
          {!loading && remaining.length > 0 && (
            <div className={styles.suggestions}>
              {remaining.map((f) => (
                <button key={f.question} type="button" className={styles.suggestion} onClick={() => ask(f.question)}>
                  {f.question}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={submit}>
          <input
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION))}
            placeholder="참새 박사에게 물어보세요"
            aria-label="질문"
            enterKeyHint="send"
          />
          <button type="submit" className={styles.send} disabled={!question.trim() || loading}>
            보내기
          </button>
        </form>
        <p className={styles.notice}>참새 박사는 AI라서 틀릴 수 있어요. 이름·연락처 같은 개인정보는 적지 마세요.</p>
      </section>
    </div>
  );
}
