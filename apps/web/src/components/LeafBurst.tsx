import { useMemo, type CSSProperties } from "react";
import styles from "./LeafBurst.module.css";

/**
 * 단풍잎 · 은행잎 · 낙엽이 한 점에서 폭죽처럼 높이 터졌다가 빠르게 떨어지는 효과 (단서 발견).
 * Stage(390 × 844) 좌표로 그린다. 라이브러리 없이 SVG + CSS 애니메이션만 쓰고, 한 번만 터진다.
 * 화면 움직임 줄이기(prefers-reduced-motion)를 켠 사람에게는 안 보인다.
 */

type Kind = "maple" | "ginkgo" | "leaf";

/** 단풍잎 (5갈래 뾰족한 잎 + 잎자루), viewBox 0 0 100 100 */
const MAPLE =
  "M50 3 56 21 66 15 63 36 80 25 77 36 95 33 86 46 97 52 74 62 79 73 58 68 54 81 H51.5 V97 H48.5 V81 H46 L42 68 21 73 26 62 3 52 14 46 5 33 23 36 20 25 37 36 34 15 44 21Z";
const MAPLE_VEINS = "M50 80 50 12 M50 60 86 40 M50 60 14 40 M50 70 74 63 M50 70 26 63";

/** 은행잎 (가운데가 갈라진 부채꼴 + 긴 잎자루) */
const GINKGO = "M50 66 C38 62 12 46 6 25 C18 9 37 5 47 13 L50 31 L53 13 C63 5 82 9 94 25 C88 46 62 62 50 66Z";
const GINKGO_VEINS = "M50 64 16 28 M50 64 28 16 M50 64 44 15 M50 64 56 15 M50 64 72 16 M50 64 84 28";
const GINKGO_STEM = "M50 64 C50 76 49 88 46 98";

/** 낙엽 (둥근 잎 + 가운데 잎맥) */
const LEAF = "M50 4 C72 18 82 42 74 66 C69 80 60 90 50 92 C40 90 31 80 26 66 C18 42 28 18 50 4Z";
const LEAF_VEINS = "M50 96 50 10 M50 40 66 30 M50 40 34 30 M50 58 70 48 M50 58 30 48 M50 74 64 66 M50 74 36 66";

const PALETTE: Record<Kind, { fill: string; vein: string }[]> = {
  maple: [
    { fill: "#d7321b", vein: "#8f1d0d" },
    { fill: "#ea4a1d", vein: "#9c2a0e" },
    { fill: "#f26a1b", vein: "#a8420c" },
    { fill: "#f58a24", vein: "#b0560f" },
  ],
  ginkgo: [
    { fill: "#f9c80e", vein: "#c79500" },
    { fill: "#fbd43d", vein: "#cf9f05" },
    { fill: "#f2b705", vein: "#b98700" },
  ],
  leaf: [
    { fill: "#b5652d", vein: "#6e3613" },
    { fill: "#9c5326", vein: "#5e2c0e" },
    { fill: "#c98a3c", vein: "#7d4f17" },
  ],
};

const COUNT = 42;

type Leaf = { kind: Kind; fill: string; vein: string; style: CSSProperties };

function LeafShape({ kind, fill, vein }: { kind: Kind; fill: string; vein: string }) {
  if (kind === "maple")
    return (
      <>
        <path d={MAPLE} fill={fill} stroke={vein} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={MAPLE_VEINS} fill="none" stroke={vein} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </>
    );
  if (kind === "ginkgo")
    return (
      <>
        <path d={GINKGO_STEM} fill="none" stroke={vein} strokeWidth="3" strokeLinecap="round" />
        <path d={GINKGO} fill={fill} stroke={vein} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={GINKGO_VEINS} fill="none" stroke={vein} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </>
    );
  return (
    <>
      <path d={LEAF} fill={fill} stroke={vein} strokeWidth="1.5" />
      <path d={LEAF_VEINS} fill="none" stroke={vein} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

export function LeafBurst({ x = 195, y = 450 }: { x?: number; y?: number }) {
  const leaves = useMemo<Leaf[]>(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
    return Array.from({ length: COUNT }, (_, i) => {
      // 단풍 45% · 은행 35% · 낙엽 20%
      const kind: Kind = i % 20 < 9 ? "maple" : i % 20 < 16 ? "ginkgo" : "leaf";
      const { fill, vein } = pick(PALETTE[kind]);
      // 크기: 작은 잎 35% · 중간 45% · 큰 잎 20%
      const r = Math.random();
      const size = r < 0.35 ? rand(12, 20) : r < 0.8 ? rand(20, 32) : rand(32, 48);
      // 대부분 위로 높이 (−160° ~ −20°), 일부는 옆으로 넓게
      const angle = (i % 5 === 0 ? rand(-200, 20) : rand(-160, -20)) * (Math.PI / 180);
      const power = rand(190, 340);
      return {
        kind,
        fill,
        vein,
        style: {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity: 0,
          "--o": size < 20 ? 0.85 : 1,
          "--dx": `${Math.cos(angle) * power}px`,
          "--dy": `${Math.sin(angle) * power}px`,
          "--fall": `${rand(520, 720)}px`,
          "--sway": `${rand(-50, 50)}px`,
          "--spin": `${rand(-720, 720)}deg`,
          "--flip": `${rand(0.25, 1)}`,
          "--dur": `${rand(1.7, 2.3)}s`,
          "--delay": `${rand(0, 0.15)}s`,
        } as CSSProperties,
      };
    });
  }, [x, y]);

  return (
    <div className={styles.layer} aria-hidden="true">
      {leaves.map((leaf, i) => (
        <svg key={i} className={styles.leaf} style={leaf.style} viewBox="0 0 100 100">
          <LeafShape kind={leaf.kind} fill={leaf.fill} vein={leaf.vein} />
        </svg>
      ))}
    </div>
  );
}
