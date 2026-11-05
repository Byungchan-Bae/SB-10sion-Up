import { MobileFrame } from "../components/MobileFrame";
import { Stage } from "../components/Stage";
import { TabBar } from "../components/TabBar";
import styles from "./TabPlaceholder.module.css";

/** 지도 · 수집물 · 랭킹 탭 — 3단계 이후에 실제 화면으로 교체 */
export default function TabPlaceholder({ title }: { title: string }) {
  return (
    <MobileFrame>
      <Stage footer={<TabBar />} background="var(--color-detail-bg)">
        <div className={styles.box}>
          <h1>{title}</h1>
          <p>곧 열려요!</p>
        </div>
      </Stage>
    </MobileFrame>
  );
}
