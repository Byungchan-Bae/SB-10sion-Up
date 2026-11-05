import { useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { PrimaryButton } from "../components/Button";
import styles from "./Onboarding.module.css";

const DESCRIPTION = "성북동의 유서 깊은 장소를 직접 걸으며\n미스터리를 해결하는 야외 방탈출게임이에요";

const SLIDES = [
  { title: "친구와", subtitle: "성북의 역사 속\n이야기를 탐험해요!", image: "onboarding-friends.png", tone: "orange" },
  { title: "연인과", subtitle: "성북의 역사 속\n이야기를 특별한 데이트로!", image: "onboarding-couple.png", tone: "green" },
  { title: "가족과", subtitle: "성북의 역사 속\n이야기를 온 가족이 함께!", image: "onboarding-family.png", tone: "blue" },
] as const;

const SWIPE_THRESHOLD = 50;

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const goNext = () => (index < SLIDES.length - 1 ? setIndex(index + 1) : navigate("/nickname"));

  const onPointerDown = (e: PointerEvent) => {
    startX.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragging) setDragX(e.clientX - startX.current);
  };
  const onPointerEnd = () => {
    if (!dragging) return;
    if (dragX < -SWIPE_THRESHOLD && index < SLIDES.length - 1) setIndex(index + 1);
    if (dragX > SWIPE_THRESHOLD && index > 0) setIndex(index - 1);
    setDragging(false);
    setDragX(0);
  };

  return (
    <MobileFrame>
      <Asset name="onboarding-bottom.png" alt="" className={styles.landscape} fit="cover" />
      <Asset name="leaves-corner.png" alt="" className={styles.leaves} />

      <div
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
      >
        <div
          className={styles.track}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            transition: dragging ? "none" : undefined,
          }}
        >
          {SLIDES.map((s, i) => (
            <section key={s.title} className={styles.slide} aria-hidden={i !== index}>
              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.subtitle}>{s.subtitle}</p>
              <Asset name={s.image} alt={`${s.title} 성북 트레저를 즐기는 모습`} className={styles.photo} />
              <div className={styles.dots} aria-hidden="true">
                {SLIDES.map((_, d) => (
                  <span key={d} className={d === i ? styles.dotActive : styles.dot} />
                ))}
              </div>
              <div className={styles.spacer} />
              <p className={`${styles.description} ${styles[s.tone]}`}>{DESCRIPTION}</p>
            </section>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <PrimaryButton onClick={goNext}>다음</PrimaryButton>
      </div>
    </MobileFrame>
  );
}
