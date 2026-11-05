import { useState, type CSSProperties } from "react";
import styles from "./Asset.module.css";

/**
 * public/assets/<name> 이미지를 보여준다.
 * 파일이 아직 없으면 같은 자리에 회색 박스 + 파일 이름을 보여준다 (docs/design/ASSETS.md 참고).
 */
export function Asset({
  name,
  alt = "",
  className,
  style,
  fit = "contain",
}: {
  name: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  fit?: "contain" | "cover";
}) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className={[styles.placeholder, className].filter(Boolean).join(" ")} style={style} role="img" aria-label={alt}>
        <span>{name}</span>
      </div>
    );
  }

  return (
    <img
      src={`/assets/${name}`}
      alt={alt}
      className={className}
      style={{ objectFit: fit, ...style }}
      onError={() => setMissing(true)}
      draggable={false}
    />
  );
}
