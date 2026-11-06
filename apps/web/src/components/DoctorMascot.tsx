import styles from "./DoctorMascot.module.css";

/**
 * 안경 쓴 참새 (역사 화면 안내). 참새 그림(story-tip-mascot.webp, 130 × 143) 위에 안경을 그려 얹는다.
 * 그림 파일을 새로 만들지 않아서 크기를 바꿔도 안경 위치가 그대로다. 크기는 className으로 폭만 정한다.
 */
export function DoctorMascot({ className }: { className?: string }) {
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(" ")} aria-hidden="true">
      <img src="/assets/story-tip-mascot.webp" alt="" draggable={false} />
      <svg viewBox="0 0 130 143">
        <g fill="rgb(255 255 255 / 0.18)" stroke="#2b1405" strokeWidth="4" strokeLinecap="round">
          <circle cx="43" cy="68" r="15" />
          <circle cx="83" cy="63" r="15" />
          <path d="M57.5 64 Q63 60 68.5 62" fill="none" />
          <path d="M28 69 L17 67" fill="none" />
          <path d="M98 61 L107 58" fill="none" />
        </g>
      </svg>
    </span>
  );
}
