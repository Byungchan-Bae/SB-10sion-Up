import { useState } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { EPISODES } from "../data/episodes";
import { resetEpisode } from "../lib/progress";
import styles from "./Reset.module.css";

/**
 * 테스트 · 시연용 진행 초기화 (/reset). 화면에 링크는 없고 주소로만 들어온다.
 * 서버와 이 기기의 진행 기록을 지운다. 닉네임과 사용자 정보는 그대로라 다시 등록하지 않아도 된다.
 */
export default function Reset() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 지금은 에피소드가 하나뿐이라 EP.01만 지운다
  const episode = EPISODES[0];

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetEpisode(episode.id);
      // 진행 중이던 동기화와 타이머가 남지 않게 새로 불러온다
      window.location.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "초기화하지 못했어요. 다시 시도해 주세요");
      setBusy(false);
    }
  };

  return (
    <MobileFrame>
      <main className={styles.page}>
        <h1 className={styles.title}>진행 초기화</h1>
        <p className={styles.desc}>
          {episode.badge} {episode.title}의 인증, 단서, 한 줄 기록, 완료, 랭킹 기록을 모두 지워요.
          {"\n"}닉네임은 그대로이고, 지운 기록은 되돌릴 수 없어요.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <PrimaryButton size="md" disabled={busy} onClick={reset}>
          {busy ? "지우는 중…" : "처음부터 다시 하기"}
        </PrimaryButton>
        <SecondaryButton size="md" disabled={busy} onClick={() => navigate("/home", { replace: true })}>
          취소
        </SecondaryButton>
      </main>
    </MobileFrame>
  );
}
