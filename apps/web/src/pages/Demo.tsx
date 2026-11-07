import { useEffect } from "react";
import { useNavigate } from "react-router";
import { clearDemoCoupons, demoStartProgress } from "../lib/demoLink";
import { resetProgress } from "../lib/progress";
import { selectEpisode } from "../lib/selection";
import { setNickname, enterDemoLink } from "../lib/storage";

/**
 * 발표 시연 링크 (/demo). 슬라이드에서 눌러 연다.
 * 누를 때마다 처음 상태로 돌아가, 이태준 가옥의 도착 인증 화면부터 시작한다.
 * 기록은 이 탭에만 남고 서버로 보내지 않는다 (lib/demoLink.ts).
 */
export default function Demo() {
  const navigate = useNavigate();
  useEffect(() => {
    enterDemoLink();
    setNickname("시연");
    clearDemoCoupons();
    const { episodeId, startPlace, progress } = demoStartProgress();
    resetProgress(episodeId, progress);
    selectEpisode(episodeId);
    navigate(`/place/${startPlace}`, { replace: true });
  }, [navigate]);
  return null;
}
