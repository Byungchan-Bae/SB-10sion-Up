import { NavLink, useLocation } from "react-router";
import styles from "./TabBar.module.css";

const TABS = [
  { to: "/home", label: "홈", icon: "tab-home.svg" },
  { to: "/map", label: "지도", icon: "tab-map.svg" },
  { to: "/collection", label: "수집물", icon: "tab-collection.svg" },
  { to: "/ranking", label: "랭킹", icon: "tab-ranking.svg" },
] as const;

/** Figma "네비게이션" 136:2386 — <Stage footer={<TabBar />}>로 사용 */
export function TabBar() {
  const { pathname } = useLocation();
  // /episode/:id/map 도 "지도" 탭으로 표시
  const active = (to: string, isActive: boolean) => isActive || (to === "/map" && pathname.endsWith("/map"));
  return (
    <nav className={styles.bar} aria-label="주요 메뉴">
      <div className={styles.row}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => (active(t.to, isActive) ? styles.active : styles.tab)}>
            <span className={styles.icon} style={{ maskImage: `url(/assets/icons/${t.icon})` }} aria-hidden="true" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
