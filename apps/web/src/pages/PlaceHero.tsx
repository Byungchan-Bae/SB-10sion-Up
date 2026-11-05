import type { ReactNode } from "react";
import type { Place } from "@sb/types";
import styles from "./PlaceHero.module.css";

/** 무대 밖(화면이 더 길 때) 배경: 위는 하늘색, 아래는 크림색 */
export const PLACE_BACKGROUND = "linear-gradient(#bfe2f6 50%, var(--color-detail-bg) 50%)";

/**
 * 장소 화면 위쪽 공통 (Figma 136:3108): 헤더, 사진 카드, 마스코트, 크림색 바탕, 장소 이름 + 주소.
 * Stage 안에서 쓴다.
 */
export function PlaceHero({
  place,
  title,
  back,
  subline,
}: {
  place: Place;
  title: string;
  back: ReactNode;
  /** 이름 아래 줄. 기본은 주소 */
  subline?: ReactNode;
}) {
  return (
    <>
      <img className={styles.bg} src="/assets/place-bg.jpg" alt="" draggable={false} />
      <div className={styles.cream} />
      {back}
      <h1 className={styles.header}>{title}</h1>
      <div className={styles.photoCard}>
        <img src={`/assets/${place.photo}`} alt={`${place.name} 사진`} />
      </div>
      <img className={styles.mascots} src="/assets/checkin-mascots.png" alt="" draggable={false} />
      <div className={styles.titleBlock}>
        {place.name.length > 8 ? (
          <h2 className={styles.nameLong}>{place.pinLabel}</h2>
        ) : (
          <h2 className={styles.name}>{place.name}</h2>
        )}
        {subline ?? (
          <p className={styles.address}>
            <img src="/assets/icons/location-20.svg" alt="" width={20} height={20} />
            {place.address}
          </p>
        )}
      </div>
    </>
  );
}
