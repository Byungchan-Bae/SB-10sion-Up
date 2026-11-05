import { useNavigate } from "react-router";
import styles from "./BackButton.module.css";

/** Figma "icon button" — 28 × 28, 흰색 70%, Stage 안 (28, 61) */
export function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.back}
      aria-label="뒤로가기"
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      <img src="/assets/icons/back.svg" alt="" width={28} height={28} />
    </button>
  );
}
