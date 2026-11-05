import { Fragment } from "react";

/** "성북동의 {{네 곳}}을" → {{ }} 부분만 className을 입힌 span으로 감싼다. */
export function Emphasis({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\{\{(.+?)\}\}/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
