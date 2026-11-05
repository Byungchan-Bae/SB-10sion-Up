import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", className, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
    />
  );
}

export const PrimaryButton = (p: Omit<Props, "variant">) => <Button variant="primary" {...p} />;
export const SecondaryButton = (p: Omit<Props, "variant">) => <Button variant="secondary" {...p} />;
