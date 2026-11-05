import type { CSSProperties } from "react";
import type { Rect } from "@sb/types";

/** data의 [left, top, width, height]를 Stage 안 절대 위치 style로 */
export const rectStyle = ([left, top, width, height]: Rect): CSSProperties => ({ left, top, width, height });
