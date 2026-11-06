import type { ReactNode } from "react";
import type { Place } from "@sb/types";
import styles from "./PlaceHero.module.css";

/** 무대 밖(화면이 더 길 때) 배경: 위는 하늘색, 아래는 크림색 */
export const PLACE_BACKGROUND = "linear-gradient(#bfe2f6 50%, var(--color-detail-bg) 50%)";

/**
 * 장소 화면 위쪽 공통 (Figma 136:3108): 헤더, 사진 카드, 마스코트, 크림색 바탕, 장소 이름 + 주소.
 * 이름 · 주소 · 지도 보기 자리는 Figma 136:3220(구 본원, Component 21) 기준으로 네 장소 모두 같다.
 * Stage 안에서 쓴다.
 */

/** 카카오맵 웹 링크: 좌표에 장소 이름으로 핀을 찍어 연다 (휴대폰에 앱이 있으면 앱으로) */
const kakaoMapUrl = (place: Place) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
export function PlaceHero({
  place,
  title,
  back,
  subline,
  mapButton = false,
}: {
  place: Place;
  title: string;
  back: ReactNode;
  /** 이름 아래 줄. 기본은 주소 */
  subline?: ReactNode;
  /** 주소 오른쪽 "지도 보기" (도착 인증 화면) */
  mapButton?: boolean;
}) {
  return (
    <>
      <img className={styles.bg} src="/assets/place-bg.webp" alt="" draggable={false} />
      <div className={styles.cream} />
      {back}
      <h1 className={styles.header}>{title}</h1>
      <div className={styles.photoCard}>
        <img src={`/assets/${place.photo}`} alt={`${place.name} 사진`} />
      </div>
      <img className={styles.mascots} src="/assets/checkin-mascots.webp" alt="" draggable={false} />
      <div className={styles.titleBlock}>
        {place.heroSub && <p className={styles.sub}>{place.heroSub}</p>}
        <h2 className={styles.name} aria-label={place.name}>
          {place.heroName ?? place.name}
        </h2>
        <div className={styles.subline}>
          {subline ?? (
            <p className={styles.address}>
              <img src="/assets/icons/location-20.svg" alt="" width={20} height={20} />
              {place.address}
            </p>
          )}
        </div>
        {mapButton && (
          <a className={styles.mapButton} href={kakaoMapUrl(place)} target="_blank" rel="noopener noreferrer">
            <img src="/assets/icons/map-14.svg" alt="" width={14} height={14} />
            지도 보기
          </a>
        )}
      </div>
    </>
  );
}
