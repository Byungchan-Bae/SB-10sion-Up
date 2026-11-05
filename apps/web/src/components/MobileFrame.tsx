import type { CSSProperties, ReactNode } from "react";
import styles from "./MobileFrame.module.css";

/** 390px 기준 화면. 모바일은 꽉 차게, PC에서는 가운데 정렬. */
export function MobileFrame({
  children,
  background,
}: {
  children: ReactNode;
  background?: string;
}) {
  const style: CSSProperties | undefined = background ? { background } : undefined;
  return (
    <div className={styles.outer}>
      <div className={styles.frame} style={style}>
        {children}
      </div>
    </div>
  );
}
