import { useNavigate } from "react-router";
import styles from "./BackButton.module.css";

/** Figma "icon button" — 28 × 28, 흰색 70%, Stage 안 (28, 61) */
export function BackButton({ to, onClick, label = "뒤로가기" }: { to?: string; onClick?: () => void; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.back}
      aria-label={label}
      onClick={() => (onClick ? onClick() : to ? navigate(to) : navigate(-1))}
    >
      <img src="/assets/icons/back.svg" alt="" width={28} height={28} />
    </button>
  );
}
