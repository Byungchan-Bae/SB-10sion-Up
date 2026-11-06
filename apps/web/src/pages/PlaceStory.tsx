import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { BackButton } from "../components/BackButton";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { findPlace } from "../data/episodes";
import { useProgress } from "../lib/progress";
import { AskSheet } from "../components/AskSheet";
import { PlaceHero } from "./PlaceHero";
import styles from "./PlaceStory.module.css";

/** 페이지 길이 (한 화면보다 길어서 스크롤). Figma 1120 + 장소 이름 자리를 도착 인증 화면과 맞춘 만큼(29) */
const PAGE_H = 1149;

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

  if (!found) return <Navigate to="/map" replace />;
  const { place } = found;
  // 도착 인증 전이면 인증 화면으로
  if (!progress.verified.includes(place.id)) return <Navigate to={`/place/${place.id}`} replace />;

  return (
    <MobileFrame>
      <Stage scrollHeight={PAGE_H} background="var(--color-detail-bg)">
        <PlaceHero
          place={place}
          title="장소 도착 인증"
          back={<BackButton to="/map" />}
          subline={
            <span className={styles.tag}>
              <img src="/assets/icons/book.svg" alt="" width={13} height={17} />
              장소 이야기
            </span>
          }
        />
        <div className={styles.creamRest} />

        <h3 className={styles.title}>{place.story.title}</h3>
        <p className={styles.body}>{place.story.body}</p>

        <div className={styles.tipBox} />
        <img className={styles.tipMascot} src="/assets/story-tip-mascot.png" alt="" draggable={false} />
        <p className={styles.tipText}>{place.story.tip}</p>

        <PrimaryButton size="md" className={styles.findClue} onClick={() => navigate(`/place/${place.id}/quiz`)}>
          {place.ordinal} 단서 찾기
        </PrimaryButton>
        <SecondaryButton size="md" className={styles.ask} onClick={() => setAsking(true)}>
          AI 질문하기
        </SecondaryButton>

      </Stage>
      {asking && <AskSheet placeId={place.id} placeName={place.name} onClose={() => setAsking(false)} />}
    </MobileFrame>
  );
}
