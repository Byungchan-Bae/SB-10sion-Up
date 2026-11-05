import { useEffect } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { getNickname } from "../lib/storage";
import styles from "./Splash.module.css";

const SPLASH_MS = 2000;

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate(getNickname() ? "/home" : "/onboarding", { replace: true }), SPLASH_MS);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <MobileFrame>
      <button
        type="button"
        className={styles.splash}
        onClick={() => navigate(getNickname() ? "/home" : "/onboarding", { replace: true })}
        aria-label="시작하기"
      >
        <Asset name="logo.png" alt="성북 트레저" className={styles.logo} />
        <p className={styles.tagline}>
          성북의 역사 속
          <br />
          숨은 이야기를 찾는 탐험 게임
        </p>
        <Asset name="mascots-splash.png" alt="" className={styles.mascots} />
      </button>
    </MobileFrame>
  );
}
