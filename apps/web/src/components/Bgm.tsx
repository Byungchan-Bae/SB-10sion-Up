import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import styles from "./Bgm.module.css";

/*
 * 배경음악. 기본은 Carefree, 에피소드를 시작하면(인트로 · 탐방 지도 · 장소) Sneaky Snitch,
 * 마무리(밝혀진 비밀 · 수집 완료)는 Easy Lemon.
 * Music: Kevin MacLeod (incompetech.com), Licensed under CC BY 4.0
 * 브라우저는 소리 나는 자동재생을 막으므로, 사용자가 화면을 처음 누를 때 재생을 시작한다.
 */
const TRACKS = {
  base: "/audio/carefree.mp3",
  episode: "/audio/sneaky-snitch.mp3",
  ending: "/audio/easy-lemon.mp3",
} as const;
type Track = keyof typeof TRACKS;

const VOLUME = 0.35;
const MUTED_KEY = "sb-treasure:bgm-muted";
const EPISODE_PATH = /^\/(episode\/[^/]+\/(intro|map)|place\/)/;
const ENDING_PATH = /^\/episode\/[^/]+\/(secret|complete)/;

const trackFor = (pathname: string): Track =>
  ENDING_PATH.test(pathname) ? "ending" : EPISODE_PATH.test(pathname) ? "episode" : "base";

function readMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    /* 사생활 보호 모드 등 */
  }
}

// 화면이 바뀌어도 소리가 끊기지 않게 오디오는 하나만 둔다
let audio: HTMLAudioElement | null = null;
let current: Track | null = null;
let unlocked = false;
let fadeTimer: number | undefined;

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.volume = VOLUME;
  }
  return audio;
}

function fadeTo(target: number, done?: () => void) {
  const a = getAudio();
  window.clearInterval(fadeTimer);
  fadeTimer = window.setInterval(() => {
    const next = a.volume + Math.sign(target - a.volume) * 0.05;
    if (Math.abs(target - a.volume) <= 0.05) {
      a.volume = target;
      window.clearInterval(fadeTimer);
      done?.();
    } else {
      a.volume = Math.min(1, Math.max(0, next));
    }
  }, 40);
}

function play(track: Track) {
  const a = getAudio();
  const start = () => {
    if (current !== track) {
      a.src = TRACKS[track];
      current = track;
    }
    a.volume = 0;
    a.play().then(() => fadeTo(VOLUME)).catch(() => {});
  };
  if (current && current !== track && !a.paused) fadeTo(0, start);
  else start();
}

function stop() {
  const a = getAudio();
  if (!a.paused) fadeTo(0, () => a.pause());
}

export function Bgm() {
  const { pathname } = useLocation();
  const track = trackFor(pathname);
  const [muted, setMuted] = useState(readMuted);

  // 첫 터치에 재생 시작
  useEffect(() => {
    if (unlocked) return;
    const unlock = () => {
      unlocked = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      if (!readMuted()) play(trackFor(window.location.pathname));
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // 화면에 따라 곡 바꾸기
  useEffect(() => {
    if (unlocked && !muted) play(track);
  }, [track, muted]);

  // 다른 앱으로 가거나 화면이 꺼지면 멈춤
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) getAudio().pause();
      else if (unlocked && !readMuted()) play(trackFor(window.location.pathname));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    saveMuted(next);
    unlocked = true;
    if (next) stop();
    else play(track);
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={muted ? "배경음악 켜기" : "배경음악 끄기"}
      aria-pressed={!muted}
      title="Music: Kevin MacLeod (incompetech.com) · CC BY 4.0"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          <path
            d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
