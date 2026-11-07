import { useLayoutEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { useProgress } from "../lib/progress";
import { AskMate } from "../components/AskMate";
import { PlaceHero } from "./PlaceHero";
import styles from "./PlaceStory.module.css";

/** 페이지 길이 (한 화면보다 길어서 스크롤). Figma 1120 + 장소 이름 자리를 도착 인증 화면과 맞춘 만큼(29) */
const PAGE_H = 1149;
/** 본문 시작(top 583) + Figma 본문 8줄(25 × 8). 본문이 이보다 길면 넘친 만큼 팁 · 버튼 · 페이지를 내린다 */
const BODY_TOP = 583;
const BODY_BOTTOM = 783;

/**
 * 역사 내용 (/place/:id/story).
 * Figma 원본(JH6kcRQoSPwOctYO15z5YM) 136:3821 길상사 · 136:3848 구 본원 · 136:3875 수연산방 · 136:3907 심우장.
 * 위쪽 이름 자리는 도착 인증(136:3220)과 같고, "장소 이야기" 라벨이 주소 자리에 와서
 * 아래 내용은 Figma보다 29px 내려가 있다.
 */
export default function PlaceStory() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const found = findPlace(placeId);
  const progress = useProgress(found?.episode.id ?? "");
  const [asking, setAsking] = useState(false);
  // 본문 높이(무대 px)를 재서 8줄을 넘는 만큼 아래 요소를 내림. 웹폰트가 늦게 와 줄 수가 바뀌어도 다시 잼
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [push, setPush] = useState(0);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setPush(Math.max(0, Math.ceil(BODY_TOP + el.offsetHeight - BODY_BOTTOM)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [found?.place.id, found && progress.verified.includes(found.place.id)]);

  if (!found) return <Navigate to="/map" replace />;
  const { place } = found;
  // 도착 인증 전이면 인증 화면으로
  if (!progress.verified.includes(place.id)) return <Navigate to={`/place/${place.id}`} replace />;

  return (
    <MobileFrame>
      <Stage scrollHeight={PAGE_H + push} background="var(--color-detail-bg)">
        <PlaceHero
          place={place}
          title="장소 소개"
          back={<BackButton to="/map" />}
          subline={
            <span className={styles.tag}>
              <img src="/assets/icons/book.svg" alt="" width={13} height={17} />
              장소 이야기
            </span>
          }
        />
        <div className={styles.creamRest} style={{ height: 305 + push }} />

        <h3 className={styles.title}>{place.story.title}</h3>
        <p ref={bodyRef} className={styles.body}>{place.story.body}</p>

        {/* 팁 · 버튼: 좌표는 그대로, 본문이 8줄을 넘으면 묶음째 push만큼 내려감 */}
        <div className={styles.lower} style={{ top: push }}>
          <div className={styles.tipBox} />
          <img className={styles.tipMascot} src="/assets/story-tip-mascot.webp" alt="" draggable={false} />
          <p className={styles.tipText}>{place.story.tip}</p>

          <PrimaryButton size="md" className={styles.findClue} onClick={() => navigate(`/place/${place.id}/quiz`)}>
            {place.ordinal} 단서 찾기
          </PrimaryButton>
          <SecondaryButton size="md" className={styles.ask} onClick={() => setAsking(true)}>
            트레저 메이트 부르기
          </SecondaryButton>
        </div>

      </Stage>
      {asking && <AskMate place={place} onClose={() => setAsking(false)} />}
    </MobileFrame>
  );
}
