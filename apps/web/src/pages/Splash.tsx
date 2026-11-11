import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { EPISODES } from "../data/episodes";
import { getUser, isDemoLink } from "../lib/storage";
import { playEffect } from "../components/Bgm";
import styles from "./Splash.module.css";

const SPLASH_MS = 2000;
/** 사라지는 애니메이션 시간 (Splash.module.css의 .leaving과 맞출 것) */
const LEAVE_MS = 400;
const BUBBLE_SOUND = "/audio/bubble-pop.mp3";
// StrictMode에서 두 번 마운트돼도 한 번만 울리게
let bubblePlayed = false;
// DB에 등록된 사용자만 홈으로 바로 간다. 처음이거나 등록 전이면 온보딩 → 닉네임
// 발표 시연 링크(/demo)는 의문의 편지로 바로 간다

export default function Splash() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // 화면이 뜨자마자 비눗방울 소리. 브라우저가 터치 전 소리를 막으면 첫 터치 때 낸다
  useEffect(() => {
    if (bubblePlayed) return;
    bubblePlayed = true;
    // 스플래시를 떠난 뒤의 첫 터치에서는 울리지 않는다
    const onTouch = () => {
      if (window.location.pathname === "/") void playEffect(BUBBLE_SOUND);
    };
    void playEffect(BUBBLE_SOUND).then((played) => {
      if (!played) window.addEventListener("pointerdown", onTouch, { once: true });
    });
  }, []);

  // 사라지는 애니메이션이 끝나면 다음 화면으로 (시간이 다 되거나 화면을 눌렀을 때)
  useEffect(() => {
    if (!leaving) return;
    const next = isDemoLink() ? `/episode/${EPISODES[0].id}/intro` : getUser() ? "/home" : "/onboarding";
    const t = setTimeout(() => navigate(next, { replace: true }), LEAVE_MS);
    return () => clearTimeout(t);
  }, [leaving, navigate]);

  return (
    <MobileFrame>
      <button
        type="button"
        className={[styles.splash, leaving && styles.leaving].filter(Boolean).join(" ")}
        onClick={() => setLeaving(true)}
        aria-label="시작하기"
      >
        <Asset name="logo.webp" alt="성북 트레저" className={styles.logo} />
        <p className={styles.tagline}>
          성북의 역사 속
          <br />
          숨은 이야기를 찾는 탐험 게임
        </p>
        <Asset name="mascots-splash.webp" alt="" className={styles.mascots} />
      </button>
    </MobileFrame>
  );
}
