/** 마지막 글자 받침에 따라 조사를 고른다. particle("마음", "이", "가") → "이", particle("자유", "이", "가") → "가" */
export function particle(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withFinal;
  return code % 28 === 0 ? withoutFinal : withFinal;
}
