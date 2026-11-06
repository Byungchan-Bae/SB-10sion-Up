import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { getUser } from "../lib/storage";
import styles from "./Splash.module.css";

const SPLASH_MS = 2000;
/** 사라지는 애니메이션 시간 (Splash.module.css의 .leaving과 맞출 것) */
const LEAVE_MS = 400;
// DB에 등록된 사용자만 홈으로 바로 간다. 처음이거나 등록 전이면 온보딩 → 닉네임

export default function Splash() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // 사라지는 애니메이션이 끝나면 다음 화면으로 (시간이 다 되거나 화면을 눌렀을 때)
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => navigate(getUser() ? "/home" : "/onboarding", { replace: true }), LEAVE_MS);
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
