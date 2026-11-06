import styles from "./Stamp.module.css";

/** 게임처럼 잠깐 찍히는 도장 ("도착!", "정답!"). Stage 안에서 쓴다 */
export const STAMP_MS = 900;

export function Stamp({ text }: { text: string }) {
  return (
    <div className={styles.back} role="status">
      <span className={styles.stamp}>{text}</span>
    </div>
  );
}
