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
 * footer(탭바)를 주면 "탭 화면"이 된다.
 * - 무대(위쪽 390 × 764)는 화면 폭에 맞춰 키운다. 탭바도 같은 배율이라 둘의 폭이 늘 같다.
 * - 화면이 짧으면(아이폰 Safari 주소창 · 툴바) 무대를 줄이지 않고 세로로 스크롤한다.
 *   탭바는 화면 맨 아래에 고정되고, 스크롤 끝에 탭바 높이만큼 빈 공간을 둬서 내용을 가리지 않는다.
 * - 화면이 길면 무대는 지금처럼 탭바 바로 위에 붙고 위쪽은 배경이 채운다.
 * - 배율은 CSS 변수 --stage-scale, 탭바 높이(안전 영역 포함)는 --tabbar-h로 넘긴다.
 * - 아이폰 하단 안전 영역(safe-area-inset-bottom)은 배율과 상관없이 탭바 아래에 더한다.
 * - PC 넓은 창에서는 MobileFrame이 앱 폭을 (화면 높이 × 390 / 844)로 줄여서 스크롤 없이 한 화면에 들어간다.
 *
 * footer가 없는 "전체 화면"도 같은 방식이다.
 * - 무대는 늘 화면 폭에 맞춘다. 아이폰 SE처럼 짧은 화면에서 높이에 맞춰 줄이면 양옆에 배경만 남아서,
 *   대신 무대를 폭에 꽉 채우고 넘치는 만큼 세로로 스크롤한다.
 * - 화면이 길면 무대는 아래에 붙고 위쪽은 배경이 채운다.
 */
export function Stage({
  background,
  footer,
  overlay,
  scrollHeight,
  children,
}: {
  background?: string;
  footer?: ReactNode;
  /** 탭 화면에서 스크롤과 상관없이 화면에 고정해 보여 줄 것 (토스트 등). --tabbar-h, --stage-scale 사용 가능 */
  overlay?: ReactNode;
  /** 한 화면보다 긴 페이지: 무대 높이(px). 폭에만 맞춰 키우고 세로로 스크롤 */
  scrollHeight?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /** 하단 안전 영역 높이를 재는 보이지 않는 요소 (CSS env()는 JS에서 바로 못 읽음) */
  const safeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [safeBottom, setSafeBottom] = useState(0);
  const isTab = Boolean(footer) && !scrollHeight;
  const height = scrollHeight ?? (isTab ? STAGE_H - TAB_BAR_H : STAGE_H);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setSafeBottom(safeRef.current?.offsetHeight ?? 0);
      // 모든 화면에서 폭에 맞춘다 (PC 넓은 창은 MobileFrame이 앱 폭을 미리 줄여 둠)
      setScale(el.clientWidth / STAGE_W);
    };
    update();
    // 화면 크기, 주소창 · 툴바, 안전 영역이 바뀌면 다시 계산
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (safeRef.current) ro.observe(safeRef.current);
    return () => ro.disconnect();
  }, [isTab, height, scrollHeight]);

  const stage = (
    <div
      className={styles.stage}
      style={{
        height,
        ...(scrollHeight || isTab ? { top: 0, transformOrigin: "50% 0" } : { bottom: 0 }),
        transform: `translateX(-50%) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );

  if (!isTab) {
    const rootStyle: CSSProperties = {
      ...(background ? { background } : {}),
      ...(scrollHeight
        ? { height: Math.ceil(height * scale), flex: "none" }
        : // 무대가 화면보다 길면(짧은 휴대폰) 그만큼 늘려서 페이지가 세로로 스크롤되게
          { minHeight: `max(100dvh, ${Math.floor(height * scale)}px)` }),
    };
    return (
      <div
        ref={ref}
        className={styles.root}
        style={rootStyle}
        // MobileFrame이 PC에서 앱 폭을 무대 폭에 맞출 때 쓰는 표시 (MobileFrame.module.css)
        data-stage={scrollHeight ? "scroll" : "full"}
      >
        {stage}
        {footer}
      </div>
    );
  }

  /** 탭바가 차지하는 높이 = 배율 적용한 80px + 안전 영역 */
  const tabBarH = TAB_BAR_H * scale + safeBottom;
  const rootStyle = {
    ...(background ? { background } : {}),
    "--stage-scale": scale,
    "--tabbar-h": `${tabBarH}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className={styles.root} style={rootStyle} data-stage="tab">
      <div className={styles.scroller}>
        {/* 화면이 길 때 남는 공간은 위쪽으로 (무대가 탭바 위에 붙도록) */}
        <div className={styles.page} style={{ height: Math.ceil(height * scale) }}>
          {stage}
        </div>
        {/* 스크롤 끝: 탭바 뒤에 가려지지 않도록 탭바 높이만큼 비워 둔다 */}
        <div className={styles.tabSpacer} style={{ height: tabBarH }} aria-hidden="true" />
      </div>
      {overlay}
      <div ref={safeRef} className={styles.safeProbe} aria-hidden="true" />
      {footer}
    </div>
  );
}
