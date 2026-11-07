import { useEffect } from "react";
import { useNavigate } from "react-router";
import { EPISODES } from "../data/episodes";
import { clearDemoCoupons, demoStartProgress } from "../lib/demoLink";
import { resetProgress } from "../lib/progress";
import { clearSelectedEpisode } from "../lib/selection";
import { setNickname, enterDemoLink } from "../lib/storage";

/**
 * 발표 시연 링크 (/demo). 슬라이드에서 눌러 연다.
 * 누를 때마다 처음 상태로 돌아가, 마지막 장소만 남은 상태로 의문의 편지부터 시작한다.
 * 기록은 이 탭에만 남고 서버로 보내지 않는다 (lib/demoLink.ts).
 */
export default function Demo() {
  const navigate = useNavigate();
  useEffect(() => {
    enterDemoLink();
    setNickname("시연");
    clearDemoCoupons();
    clearSelectedEpisode();
    const { episodeId, progress } = demoStartProgress();
    resetProgress(episodeId, progress);
    navigate(`/episode/${EPISODES[0].id}/intro`, { replace: true });
  }, [navigate]);
  return null;
}
