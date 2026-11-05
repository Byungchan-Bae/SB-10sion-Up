import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { PrimaryButton } from "../components/Button";
import { getNickname, setNickname, setUser } from "../lib/storage";
import { createUser } from "../lib/api";
import styles from "./Nickname.module.css";

const MAX_LENGTH = 10;

export default function Nickname() {
  const navigate = useNavigate();
  const [name, setName] = useState(getNickname() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    setNickname(name);
    try {
      // DB(users 테이블)에 닉네임 등록. 인증 · 문제 확인을 서버에서 하므로 등록 없이는 진행할 수 없다
      const { userId, token } = await createUser(name.trim());
      setUser({ userId, token });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "닉네임을 등록하지 못했어요. 다시 시도해 주세요");
      setSaving(false);
    }
  };

  return (
    <MobileFrame>
      <form className={styles.page} onSubmit={submit}>
        <Asset name="logo-mascots.png" alt="성북 트레저" className={styles.logo} />
        <p className={styles.tagline}>
          성북의 역사 속
          <br />
          이야기를 탐험해요!
        </p>

        <div className={styles.spacer} />

        <div className={styles.field}>
          <label htmlFor="nickname" className={styles.label}>
            닉네임을 입력해주세요
          </label>
          <input
            id="nickname"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="홍길동"
            autoComplete="nickname"
            enterKeyHint="done"
            maxLength={MAX_LENGTH}
          />
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <PrimaryButton type="submit" disabled={!valid || saving} className={styles.submit}>
          {saving ? "등록 중…" : "시작하기"}
        </PrimaryButton>
      </form>
    </MobileFrame>
  );
}
