// 사용자 진행 상태 (지금은 localStorage, 나중에 API로 교체)
const NICKNAME_KEY = "sb-treasure:nickname";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 사생활 보호 모드 등에서는 저장 생략 */
  }
}

export const getNickname = () => safeGet(NICKNAME_KEY);
export const setNickname = (name: string) => safeSet(NICKNAME_KEY, name.trim());
