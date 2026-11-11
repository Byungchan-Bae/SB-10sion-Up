/** 3720000 → "1시간 2분", 540000 → "9분" */
export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 랭킹용: 2052000 → "34분 12초", 3725000 → "1시간 2분 5초", 45000 → "45초" */
export function formatDurationSeconds(ms: number) {
  const total = Math.max(1, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}시간 ${m}분 ${s}초`;
  if (m) return `${m}분 ${s}초`;
  return `${s}초`;
}
