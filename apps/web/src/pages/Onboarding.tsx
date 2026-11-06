import { useState } from "react";
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

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // 넘김은 "다음" 버튼으로만 (손으로 밀어서 넘기지 않음). 마지막 장에서 누르면 닉네임 입력으로
  const goNext = () => (index < SLIDES.length - 1 ? setIndex(index + 1) : navigate("/nickname"));

  return (
    <MobileFrame>
      <Asset name="onboarding-bottom.png" alt="" className={styles.landscape} fit="cover" />
      <Asset name="leaves-corner.png" alt="" className={styles.leaves} />

      <div className={styles.viewport}>
        <div className={styles.track} style={{ transform: `translateX(${-index * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <section key={s.title} className={styles.slide} aria-hidden={i !== index}>
              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.subtitle}>{s.subtitle}</p>
              <Asset name={s.image} alt={`${s.title} 성북 트레저를 즐기는 모습`} className={styles.photo} />
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
