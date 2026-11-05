import { Navigate, Route, Routes } from "react-router";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Nickname from "./pages/Nickname";
import Home from "./pages/Home";
import EpisodeDetail from "./pages/EpisodeDetail";
import EpisodeIntro from "./pages/EpisodeIntro";
import TabPlaceholder from "./pages/TabPlaceholder";
import ExploreMap from "./pages/ExploreMap";
import PlaceCheckIn from "./pages/PlaceCheckIn";
import PlaceStory from "./pages/PlaceStory";
import QuizPlaceholder from "./pages/QuizPlaceholder";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/nickname" element={<Nickname />} />
      <Route path="/home" element={<Home />} />
      <Route path="/episode/:episodeId" element={<EpisodeDetail />} />
      <Route path="/episode/:episodeId/intro" element={<EpisodeIntro />} />
      <Route path="/episode/:episodeId/map" element={<ExploreMap />} />
      <Route path="/map" element={<ExploreMap />} />
      <Route path="/place/:placeId" element={<PlaceCheckIn />} />
      <Route path="/place/:placeId/story" element={<PlaceStory />} />
      <Route path="/place/:placeId/quiz" element={<QuizPlaceholder />} />
      <Route path="/collection" element={<TabPlaceholder title="수집물" />} />
      <Route path="/ranking" element={<TabPlaceholder title="랭킹" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
