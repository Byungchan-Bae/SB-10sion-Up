import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  /** lg: 316 × 61 (1단계 화면), md: 270폭 (홈 · 에피소드 화면) */
  size?: "lg" | "md";
};

export function Button({ variant = "primary", size = "lg", className, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={[styles.button, styles[variant], size === "md" && styles.md, className].filter(Boolean).join(" ")}
    />
  );
}

export const PrimaryButton = (p: Omit<Props, "variant">) => <Button variant="primary" {...p} />;
export const SecondaryButton = (p: Omit<Props, "variant">) => <Button variant="secondary" {...p} />;
