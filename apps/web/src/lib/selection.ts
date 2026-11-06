// 지금 들어가 있는 에피소드 (지도 탭에서 지도를 열지, 에피소드 선택 안내를 보여 줄지).
// 의문의 편지에서 "다음"을 눌러 들어갈 때만 남긴다.
// 지도에서 뒤로가기, 뒤로 가서 홈에 도착, 홈에서 에피소드 열기를 하면 지운다. 진행 기록과 타이머는 그대로다.
// 이 기기(localStorage)에 사용자별 키로 저장해서, 다른 사용자로 바뀌면 섞이지 않는다.
import { useSyncExternalStore } from "react";
import { getUser } from "./storage";

// 예전 키(selected-episode)는 "에피소드 보기"만 눌러도 저장됐으므로 읽지 않는다
const PREFIX = "sb-treasure:entered-episode:";
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

function change(save: (storageKey: string) => void) {
  try {
    save(key());
  } catch {
    /* 사생활 보호 모드 등에서는 저장 생략 */
  }
  listeners.forEach((l) => l());
}

export const selectEpisode = (episodeId: string) => change((k) => localStorage.setItem(k, episodeId));

export const clearSelectedEpisode = () => change((k) => localStorage.removeItem(k));

export function useSelectedEpisode(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSelectedEpisode,
  );
}
