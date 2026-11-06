// 에피소드 진행 상태.
// 화면은 이 기기(localStorage)에 저장된 값을 바로 쓰고, 서버(DB)와 맞춘다.
//  - 장소 인증 · 단서 · 한 줄 기록: 서버(/api/checkin, /api/quiz)가 확인하고 기록한 결과만 받아 온다 (applyServerProgress)
//  - 완료: 기기에 먼저 남기고 뒤에서 /api/complete로 보낸다. 실패하면 올라갈 때까지 다시 보냄 (RETRY_MS마다, 온라인 복귀, 앱으로 돌아올 때)
//  - 시작 시각: 지도 타이머용으로 기기에만 남긴다. 서버는 첫 인증 때 자기 시각을 기록한다
import { useSyncExternalStore } from "react";
import type { Episode, EpisodeProgress } from "@sb/types";
import { getEpisode } from "../data/episodes";
import { completeOnServer, deleteProgress, fetchProgress } from "./api";
import { getUser, PROGRESS_KEY as KEY } from "./storage";

export type { EpisodeProgress };

/** 완료 전송에 실패했을 때 다시 보내는 간격 */
const RETRY_MS = 30_000;

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

export const startEpisode = (episodeId: string) =>
  update(episodeId, (p) => (p.startedAt ? p : { ...p, startedAt: Date.now() }));

/** 서버(/api/checkin, /api/quiz)가 돌려준 진행 상태를 이 기기에 반영한다 */
export function applyServerProgress(episodeId: string, server: EpisodeProgress) {
  fresh.add(episodeId);
  const state = read();
  write({ ...state, [episodeId]: merge(state[episodeId] ?? EMPTY, server) });
}

/** 단서를 모두 모았는지 */
export const hasAllClues = (episode: Episode, progress: EpisodeProgress) =>
  episode.places.every((p) => progress.clues.includes(p.id));

/** "밝혀진 비밀"에서 완료를 누르면 끝낸 시각을 남긴다 (처음 한 번만) */
export const completeEpisode = (episodeId: string) =>
  update(episodeId, (p) => (p.completedAt ? p : { ...p, completedAt: Date.now() }));

/** 테스트 · 시연용: 서버와 이 기기의 진행 기록을 지운다. 서버에서 실패하면 기기 기록도 그대로 둔다 */
export async function resetEpisode(episodeId: string) {
  if (getUser()) await deleteProgress(episodeId);
  const next = { ...read() };
  delete next[episodeId];
  write(next);
}

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

/**
 * 서버 응답을 이 기기 기록과 합친다. 시작은 더 이른 쪽, 완료는 서버 값이 있으면 서버 값.
 * replace면 인증 · 단서 · 기록을 서버 것으로 바꾼다 (처음 열 때: 서버 확인 전에 기기에만 남은 옛 기록 정리).
 * 아니면 합집합 — 응답이 늦게 도착해도 방금 반영한 인증이 사라지지 않게.
 */
function merge(local: EpisodeProgress, server: EpisodeProgress, replace = false): EpisodeProgress {
  const union = (a: string[], b: string[]) => [...a, ...b.filter((id) => !a.includes(id))];
  const starts = [local.startedAt, server.startedAt].filter((t): t is number => t !== undefined);
  return {
    startedAt: starts.length ? Math.min(...starts) : undefined,
    verified: replace ? server.verified : union(server.verified, local.verified),
    clues: replace ? server.clues : union(server.clues, local.clues),
    notes: replace ? { ...server.notes } : { ...local.notes, ...server.notes },
    completedAt: server.completedAt ?? local.completedAt,
    points: server.points ?? local.points,
  };
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pulled = new Set<string>();

/** 서버에서 한 번이라도 받아 온 에피소드 */
const fresh = new Set<string>();

/** 변경을 잠깐 모았다가 한 번에 보낸다 */
function scheduleSync(episodeId: string, delay = 300) {
  if (!getUser()) return; // 서버에 등록 안 된 사용자는 이 기기에만 저장
  clearTimeout(timers.get(episodeId));
  timers.set(episodeId, setTimeout(() => void syncNow(episodeId), delay));
}

async function syncNow(episodeId: string) {
  timers.delete(episodeId);
  try {
    let { progress: server } = await fetchProgress(episodeId);
    // 기기에서 끝냈는데 서버에 아직 없으면 완료를 보낸다 (단서가 서버에 다 있을 때만 받아 준다)
    const episode = getEpisode(episodeId);
    if (read()[episodeId]?.completedAt && !server.completedAt && episode && hasAllClues(episode, server)) {
      ({ progress: server } = await completeOnServer(episodeId));
    }
    const state = read();
    const first = !fresh.has(episodeId);
    fresh.add(episodeId);
    // 다시 보내지는 않음 (write에 episodeId를 안 넘김)
    write({ ...state, [episodeId]: merge(state[episodeId] ?? EMPTY, server, first) });
  } catch {
    // 오프라인 등 — 다음 변경이나 온라인 복귀 때 다시 보낸다.
    // 끝낸 기록은 랭킹에 올라가야 하므로, 신호 없이 약한 통신이 이어져도 스스로 다시 시도한다.
    if (completionPending(episodeId)) scheduleSync(episodeId, RETRY_MS);
  }
}

/** 기기에서는 끝냈는데 서버 확인(포인트)을 아직 못 받았는지 */
function completionPending(episodeId: string) {
  const local = read()[episodeId];
  return !!local?.completedAt && local.points === undefined;
}

/** 처음 화면에 띄울 때 한 번: 서버 기록을 받아 오고, 기기에서 끝낸 완료가 남아 있으면 올린다 */
function pullOnce(episodeId: string) {
  if (pulled.has(episodeId)) return;
  pulled.add(episodeId);
  scheduleSync(episodeId, 0);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => pulled.forEach((id) => scheduleSync(id)));
  // 휴대폰은 앱이 뒤로 가면 타이머가 멈추므로, 돌아왔을 때 밀린 완료를 바로 보낸다
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      pulled.forEach((id) => completionPending(id) && scheduleSync(id));
    }
  });
}
