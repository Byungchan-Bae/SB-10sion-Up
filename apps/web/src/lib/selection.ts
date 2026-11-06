// 사용자가 고른 에피소드 (지도 탭에서 어떤 지도를 열지).
// 의문의 편지에서 "다음"을 눌러 실제로 시작해야 고른 것으로 남긴다. 홈에서 카드를 보거나 지도 탭을 누르는 것만으로는 고르지 않는다.
// 에피소드 상세나 지도에서 뒤로가기를 누르면 고른 것을 해제한다. 진행 기록과 타이머는 그대로다.
// 이 기기(localStorage)에 사용자별 키로 저장해서, 다른 사용자로 바뀌면 섞이지 않는다.
import { useSyncExternalStore } from "react";
import { getUser } from "./storage";

const PREFIX = "sb-treasure:selected-episode:";
/** 뒤로가기로 해제한 상태. 진행 기록이 있어도 다시 고를 때까지 지도 탭에 선택 안내를 보여 준다 */
export const NO_EPISODE = "";
const listeners = new Set<() => void>();

/** 서버에 등록된 사용자는 userId별, 아직 등록 전이면 이 기기 공용 칸 */
const key = () => PREFIX + (getUser()?.userId ?? "guest");

export function getSelectedEpisode(): string | null {
  try {
    return localStorage.getItem(key());
  } catch {
    return null;
  }
}

export function selectEpisode(episodeId: string) {
  try {
    localStorage.setItem(key(), episodeId);
  } catch {
    /* 사생활 보호 모드 등에서는 저장 생략 */
  }
  listeners.forEach((l) => l());
}

export const clearSelectedEpisode = () => selectEpisode(NO_EPISODE);

export function useSelectedEpisode(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSelectedEpisode,
  );
}
