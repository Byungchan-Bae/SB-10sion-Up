import { useNavigate } from "react-router";
import styles from "./PageHeader.module.css";

/** 뒤로가기 화살표 + 가운데 제목 */
export function PageHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.back}
        aria-label="뒤로가기"
        onClick={onBack ?? (() => navigate(-1))}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {title && <h1 className={styles.title}>{title}</h1>}
    </header>
  );
}
