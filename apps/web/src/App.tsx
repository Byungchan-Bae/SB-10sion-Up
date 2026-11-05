import { Navigate, Route, Routes } from "react-router";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Nickname from "./pages/Nickname";
import Home from "./pages/Home";
import EpisodeDetail from "./pages/EpisodeDetail";
import EpisodeIntro from "./pages/EpisodeIntro";
import TabPlaceholder from "./pages/TabPlaceholder";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/nickname" element={<Nickname />} />
      <Route path="/home" element={<Home />} />
      <Route path="/episode/:episodeId" element={<EpisodeDetail />} />
      <Route path="/episode/:episodeId/intro" element={<EpisodeIntro />} />
      <Route path="/map" element={<TabPlaceholder title="탐험 지도" />} />
      <Route path="/collection" element={<TabPlaceholder title="수집물" />} />
      <Route path="/ranking" element={<TabPlaceholder title="랭킹" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
