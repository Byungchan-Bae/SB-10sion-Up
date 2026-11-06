import { useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { formatDistance, getCurrentPosition, type PositionError } from "../lib/geo";
import { checkIn } from "../lib/api";
import { applyServerProgress, getProgress, isPlaceOpen } from "../lib/progress";
import { PlaceHero, PLACE_BACKGROUND } from "./PlaceHero";
import styles from "./PlaceCheckIn.module.css";

const ERROR_TEXT: Record<PositionError, string> = {
  unsupported: "이 기기에서는 위치 확인을 할 수 없어요",
  denied: "위치 권한을 허용해야 인증할 수 있어요",
  unavailable: "현재 위치를 찾지 못했어요. 다시 시도해주세요",
  timeout: "위치 확인이 오래 걸려요. 다시 시도해주세요",
};

/** Figma 136:3108 장소 도착 인증 / 136:3127 인증 중 */
export default function PlaceCheckIn() {
  const { placeId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const found = findPlace(placeId);
  if (!found) return <Navigate to="/map" replace />;
  const { episode, place, index } = found;
  if (!isPlaceOpen(episode, index, getProgress(episode.id))) return <Navigate to="/map" replace />;

  const demo = search.get("demo") === "1";

  const verify = async () => {
    setError(null);
    setChecking(true);
    // 1) 현재 위치 받기 — 개발 · 시연용 ?demo=1 이면 생략
    let where: { lat: number; lng: number } | "demo" = "demo";
    if (!demo) {
      try {
        const pos = await getCurrentPosition();
        where = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        setError(ERROR_TEXT[e as PositionError] ?? ERROR_TEXT.unavailable);
        setChecking(false);
        return;
      }
    }
    // 2) 서버가 거리를 계산하고 반경 안이면 인증을 기록한다
    try {
      const res = await checkIn(place.id, where);
      applyServerProgress(res.episodeId, res.progress);
      if (res.ok) {
        navigate(`/place/${place.id}/story${demo ? "?demo=1" : ""}`, { replace: true });
        return;
      }
      setError(`${place.name}까지 ${formatDistance(res.distance ?? 0)} 남았어요.\n${res.radius}m 안으로 와주세요!`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증하지 못했어요. 다시 시도해주세요");
    }
    setChecking(false);
  };

  return (
    <MobileFrame>
      <Stage background={PLACE_BACKGROUND}>
        <PlaceHero place={place} title="장소 도착 인증" back={<BackButton to="/map" />} mapButton />

        <div className={styles.box} />
        <p className={error ? styles.error : styles.guide} role={error ? "alert" : undefined}>
          {error ?? "GPS로 현장에 도착했는지 확인할게요!"}
        </p>
        <img
          className={styles.steps}
          src="/assets/checkin-steps.webp"
          alt="위치 권한 허용(최초 1회) → 현재 위치 확인 → 도착 인증 완료"
        />
        <PrimaryButton size="md" className={styles.cta} disabled={checking} onClick={verify}>
          {checking ? "인증 대기중...." : error ? "다시 인증하기" : "지금 위치로 인증하기"}
        </PrimaryButton>

        <img className={styles.mascots} src="/assets/checkin-mascots-bottom.webp" alt="" draggable={false} />
        <img className={styles.bubble} src="/assets/icons/bubble.svg" alt="" />
        <p className={styles.bubbleText}>
          도착을 인증하면 이곳에 담긴
          <br />
          <span className={styles.em}>역사이야기</span>를 볼 수 있어요!
        </p>
      </Stage>
    </MobileFrame>
  );
}
