// 사용자가 고른 에피소드 (지도 탭에서 어떤 지도를 열지).
// 홈에서 "에피소드 보기"나 에피소드 카드를 누르면 고른 것으로 남긴다. 홈을 보거나 지도 탭을 누르는 것만으로는 고르지 않는다.
// 이 기기(localStorage)에 사용자별 키로 저장해서, 다른 사용자로 바뀌면 섞이지 않는다.
import { useSyncExternalStore } from "react";
import { getUser } from "./storage";

const PREFIX = "sb-treasure:selected-episode:";
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

export function useSelectedEpisode(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSelectedEpisode,
  );
}
