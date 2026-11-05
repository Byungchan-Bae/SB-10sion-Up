import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Stage.module.css";

export const STAGE_W = 390;
export const STAGE_H = 844;
/** Figma 탭바 높이 (홈 등 탭 화면) */
export const TAB_BAR_H = 80;

/**
 * Figma 프레임(390 × 844)을 그대로 옮기는 무대.
 * 안쪽 요소는 Figma 좌표(px)로 absolute 배치하고, 무대 전체를 화면에 맞게 확대/축소한다.
 * 배경은 화면 전체를 덮고(background), 무대는 화면 아래쪽에 붙는다.
 *
 * footer(탭바)를 주면 무대는 위쪽 390 × 764만 쓰고, footer는 축소 없이 화면 맨 아래 전체 폭으로 붙는다.
 */
export function Stage({
  background,
  footer,
  scrollHeight,
  children,
}: {
  background?: string;
  footer?: ReactNode;
  /** 한 화면보다 긴 페이지: 무대 높이(px). 폭에만 맞춰 키우고 세로로 스크롤 */
  scrollHeight?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const reserved = footer ? TAB_BAR_H : 0;
  const height = scrollHeight ?? STAGE_H - reserved;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setScale(
        scrollHeight
          ? el.clientWidth / STAGE_W
          : Math.min(el.clientWidth / STAGE_W, (el.clientHeight - reserved) / height),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reserved, height, scrollHeight]);

  const rootStyle: CSSProperties = {
    ...(background ? { background } : {}),
    ...(scrollHeight ? { height: Math.ceil(height * scale), flex: "none" } : {}),
  };

  return (
    <div
      ref={ref}
      className={styles.root}
      style={rootStyle}
      // MobileFrame이 PC에서 앱 폭을 무대 폭에 맞출 때 쓰는 표시 (MobileFrame.module.css)
      data-stage={scrollHeight ? "scroll" : footer ? "tab" : "full"}
    >
      <div
        className={styles.stage}
        style={{
          height,
          ...(scrollHeight ? { top: 0, transformOrigin: "50% 0" } : { bottom: reserved }),
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}
