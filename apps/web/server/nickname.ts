// 닉네임 검사. 닉네임은 랭킹에 공개되므로 등록할 때 서버에서 확인한다.
// 금칙어는 완벽하게 거르지 못한다. 문제가 되는 말이 보이면 아래 목록에 추가하면 된다.

const MAX_NICKNAME = 10;

/** 호환 글자(전각, ㅅㅂ 같은 자모)를 같은 모양으로 맞추고 소문자로 */
const fold = (text: string) => text.normalize("NFKC").toLowerCase();

/** 어디에 들어 있어도 막는 말 */
const BLOCKED_ANYWHERE = [
  "시발", "씨발", "씨바", "ㅅㅂ", "ㅂㅅ", "병신", "븅신", "좆", "존나", "새끼", "지랄",
  "미친놈", "미친년", "느금마", "섹스", "창녀", "fuck", "shit", "bitch",
  // 운영자로 오해할 수 있는 이름
  "관리자", "운영자", "admin",
].map(fold);

/** 다른 말의 일부일 수 있어서("보지마", "시바견") 닉네임 전체가 이 말일 때만 막는 말 */
const BLOCKED_EXACT = ["보지", "자지", "시바", "니미"].map(fold);

export type NicknameCheck =
  | { ok: true; nickname: string; key: string }
  | { ok: false; message: string };

export function checkNickname(input: unknown): NicknameCheck {
  const nickname = typeof input === "string" ? input.normalize("NFKC").trim() : "";
  if (!nickname || [...nickname].length > MAX_NICKNAME) {
    return { ok: false, message: `닉네임은 1~${MAX_NICKNAME}자로 입력해 주세요` };
  }
  // 줄바꿈이나 눈에 안 보이는 글자로 다른 사람인 척하는 것을 막는다
  if (/\p{C}/u.test(nickname)) return { ok: false, message: "닉네임에 쓸 수 없는 글자가 있어요" };
  if (!/[\p{L}\p{N}]/u.test(nickname)) return { ok: false, message: "닉네임에 글자나 숫자를 넣어 주세요" };

  // "시 발", "시.발"처럼 글자 사이를 띄워도 잡도록 문자만 남겨서 비교한다
  const letters = fold(nickname).replace(/[^\p{L}]/gu, "");
  if (BLOCKED_EXACT.includes(letters) || BLOCKED_ANYWHERE.some((word) => letters.includes(word))) {
    return { ok: false, message: "사용할 수 없는 닉네임이에요. 다른 닉네임을 입력해 주세요" };
  }

  // 중복 비교용: 대소문자와 띄어쓰기는 구분하지 않는다 ("홍 길동" = "홍길동")
  return { ok: true, nickname, key: fold(nickname).replace(/\s/g, "") };
}
