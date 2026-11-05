// 에피소드 진행 상태.
// 화면은 이 기기(localStorage)에 바로 저장된 값을 쓰고, 뒤에서 서버(/api/progress)와 맞춘다.
// 현장은 통신이 약할 수 있어서 서버 저장이 실패해도 화면은 멈추지 않고, 다음 변경이나 재접속 때 다시 보낸다.
import { useSyncExternalStore } from "react";
import type { EpisodeProgress } from "@sb/types";
import type { Episode } from "../data/episodes";
import { syncProgress } from "./api";
import { getUser } from "./storage";

export type { EpisodeProgress };

const KEY = "sb-treasure:progress";

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

function write(next: State, episodeId?: string) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패해도 화면 상태는 유지 */
  }
  listeners.forEach((l) => l());
  if (episodeId) scheduleSync(episodeId);
}

const EMPTY: EpisodeProgress = { verified: [], clues: [] };

export function getProgress(episodeId: string): EpisodeProgress {
  pullOnce(episodeId);
  return read()[episodeId] ?? EMPTY;
}

function update(episodeId: string, fn: (p: EpisodeProgress) => EpisodeProgress) {
  const state = read();
  write({ ...state, [episodeId]: fn(state[episodeId] ?? EMPTY) }, episodeId);
}

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const startEpisode = (episodeId: string) =>
  update(episodeId, (p) => (p.startedAt ? p : { ...p, startedAt: Date.now() }));

export const markVerified = (episodeId: string, placeId: string) =>
  update(episodeId, (p) => ({ ...p, startedAt: p.startedAt ?? Date.now(), verified: addUnique(p.verified, placeId) }));

export const markClueFound = (episodeId: string, placeId: string) =>
  update(episodeId, (p) => ({ ...p, clues: addUnique(p.clues, placeId) }));

/** 문제 2의 한 줄 기록을 저장하고 단서를 찾은 것으로 처리 */
export const completeQuiz = (episodeId: string, placeId: string, note: string) =>
  update(episodeId, (p) => ({ ...p, clues: addUnique(p.clues, placeId), notes: { ...p.notes, [placeId]: note } }));

/** 단서를 모두 모았는지 */
export const hasAllClues = (episode: Episode, progress: EpisodeProgress) =>
  episode.places.every((p) => progress.clues.includes(p.id));

/** "밝혀진 비밀"에서 완료를 누르면 끝낸 시각을 남긴다 (처음 한 번만) */
export const completeEpisode = (episodeId: string) =>
  update(episodeId, (p) => (p.completedAt ? p : { ...p, completedAt: Date.now() }));

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

// ---- 서버와 맞추기 ----

/** 두 기록을 합친다. 한 번 한 일은 지워지지 않고, 시작은 더 이른 쪽 */
function merge(local: EpisodeProgress, server: EpisodeProgress): EpisodeProgress {
  const union = (a: string[], b: string[]) => [...a, ...b.filter((id) => !a.includes(id))];
  const starts = [local.startedAt, server.startedAt].filter((t): t is number => t !== undefined);
  return {
    startedAt: starts.length ? Math.min(...starts) : undefined,
    verified: union(local.verified, server.verified),
    clues: union(local.clues, server.clues),
    notes: { ...server.notes, ...local.notes },
    completedAt: server.completedAt ?? local.completedAt,
    points: server.points ?? local.points,
  };
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pulled = new Set<string>();

/** 변경을 잠깐 모았다가 한 번에 보낸다 */
function scheduleSync(episodeId: string, delay = 300) {
  if (!getUser()) return; // 서버에 등록 안 된 사용자는 이 기기에만 저장
  clearTimeout(timers.get(episodeId));
  timers.set(episodeId, setTimeout(() => void syncNow(episodeId), delay));
}

async function syncNow(episodeId: string) {
  timers.delete(episodeId);
  try {
    const res = await syncProgress(episodeId, getProgress(episodeId));
    const state = read();
    // 보내는 사이에 바뀐 것도 살리도록 지금 값과 합친다 (다시 보내지는 않음)
    write({ ...state, [episodeId]: merge(state[episodeId] ?? EMPTY, res.progress) });
  } catch {
    /* 오프라인 등 — 다음 변경이나 온라인 복귀 때 다시 보냄 */
  }
}

/** 처음 화면에 띄울 때 한 번: 기존 기록을 올리고 다른 기기에서 한 것도 받아온다 */
function pullOnce(episodeId: string) {
  if (pulled.has(episodeId)) return;
  pulled.add(episodeId);
  scheduleSync(episodeId, 0);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => pulled.forEach((id) => scheduleSync(id)));
}
