// 에피소드 진행 상태 (localStorage). 나중에 API로 바꿀 때 이 파일만 고치면 된다.
import { useSyncExternalStore } from "react";
import type { Episode } from "../data/episodes";

const KEY = "sb-treasure:progress";

export type EpisodeProgress = {
  /** 에피소드 시작 시각 (ms) — 지도 타이머 */
  startedAt?: number;
  /** 도착 인증한 장소 id */
  verified: string[];
  /** 단서를 찾은 장소 id */
  clues: string[];
};

type State = Record<string, EpisodeProgress>;

const listeners = new Set<() => void>();
let cache: State | null = null;

function read(): State {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as State;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패해도 화면 상태는 유지 */
  }
  listeners.forEach((l) => l());
}

const EMPTY: EpisodeProgress = { verified: [], clues: [] };

export function getProgress(episodeId: string): EpisodeProgress {
  return read()[episodeId] ?? EMPTY;
}

function update(episodeId: string, fn: (p: EpisodeProgress) => EpisodeProgress) {
  const state = read();
  write({ ...state, [episodeId]: fn(state[episodeId] ?? EMPTY) });
}

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const startEpisode = (episodeId: string) =>
  update(episodeId, (p) => (p.startedAt ? p : { ...p, startedAt: Date.now() }));

export const markVerified = (episodeId: string, placeId: string) =>
  update(episodeId, (p) => ({ ...p, startedAt: p.startedAt ?? Date.now(), verified: addUnique(p.verified, placeId) }));

export const markClueFound = (episodeId: string, placeId: string) =>
  update(episodeId, (p) => ({ ...p, clues: addUnique(p.clues, placeId) }));

/** 첫 장소는 항상 열림. 그 다음은 바로 앞 장소의 단서를 찾아야 열린다. */
export function isPlaceOpen(episode: Episode, index: number, progress: EpisodeProgress) {
  return index === 0 || progress.clues.includes(episode.places[index - 1].id);
}

/** 화면에서 진행 상태가 바뀌면 다시 그리도록 구독 */
export function useProgress(episodeId: string): EpisodeProgress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getProgress(episodeId),
  );
}
