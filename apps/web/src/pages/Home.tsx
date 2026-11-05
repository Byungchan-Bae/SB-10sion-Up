import { MobileFrame } from "../components/MobileFrame";
import { getNickname } from "../lib/storage";

/** 2단계(feat/episode)에서 Figma 홈 화면으로 교체 예정 */
export default function Home() {
  return (
    <MobileFrame background="var(--color-cream)">
      <div style={{ padding: 24 }}>
        <h1 style={{ color: "var(--color-title)", fontSize: 22 }}>{getNickname() ?? "탐험가"}님, 환영해요!</h1>
        <p style={{ color: "var(--color-text-sub)" }}>홈 화면은 2단계에서 구현됩니다.</p>
      </div>
    </MobileFrame>
  );
}
