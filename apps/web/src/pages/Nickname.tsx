import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { MobileFrame } from "../components/MobileFrame";
import { Asset } from "../components/Asset";
import { PrimaryButton } from "../components/Button";
import { getNickname, setNickname } from "../lib/storage";
import styles from "./Nickname.module.css";

const MAX_LENGTH = 10;

export default function Nickname() {
  const navigate = useNavigate();
  const [name, setName] = useState(getNickname() ?? "");
  const valid = name.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setNickname(name);
    navigate("/home", { replace: true });
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
        <PrimaryButton type="submit" disabled={!valid} className={styles.submit}>
          시작하기
        </PrimaryButton>
      </form>
    </MobileFrame>
  );
}
