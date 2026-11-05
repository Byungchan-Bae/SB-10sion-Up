// 이 기기에 저장하는 사용자 정보 (localStorage)
const NICKNAME_KEY = "sb-treasure:nickname";
const USER_KEY = "sb-treasure:user";
export const PROGRESS_KEY = "sb-treasure:progress";

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

/** 서버(DB)에 등록된 사용자. 나중에 진행 상태 API를 부를 때 token을 함께 보낸다 */
export interface StoredUser {
  userId: string;
  token: string;
}

export function getUser(): StoredUser | null {
  try {
    const user = JSON.parse(safeGet(USER_KEY) ?? "null");
    return user && typeof user.userId === "string" && typeof user.token === "string" ? user : null;
  } catch {
    return null;
  }
}

export const setUser = (user: StoredUser) => safeSet(USER_KEY, JSON.stringify(user));

/** 서버가 이 사용자를 모를 때: 사용자와 진행 기록을 지운다. 닉네임은 다시 입력하기 쉽게 남긴다 */
export function clearPlayer() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* 사생활 보호 모드 등 */
  }
}
