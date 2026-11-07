// 이 기기에 저장하는 사용자 정보 (localStorage)
// 발표 시연 링크(/demo)로 연 탭은 이 탭에만(sessionStorage) 저장해서, 실제 기록과 섞이지 않고 탭을 닫으면 사라진다.
const DEMO_LINK_KEY = "sb-treasure:demo-link";

export function isDemoLink(): boolean {
  try {
    return sessionStorage.getItem(DEMO_LINK_KEY) === "1";
  } catch {
    return false;
  }
}

/** 이 탭을 시연 탭으로 만든다 */
export const enterDemoLink = () => sessionStorage.setItem(DEMO_LINK_KEY, "1");

export const appStorage = (): Storage => (isDemoLink() ? sessionStorage : localStorage);

const NICKNAME_KEY = "sb-treasure:nickname";
const USER_KEY = "sb-treasure:user";
export const PROGRESS_KEY = "sb-treasure:progress";

function safeGet(key: string): string | null {
  try {
    return appStorage().getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    appStorage().setItem(key, value);
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
    appStorage().removeItem(USER_KEY);
    appStorage().removeItem(PROGRESS_KEY);
  } catch {
    /* 사생활 보호 모드 등 */
  }
}
