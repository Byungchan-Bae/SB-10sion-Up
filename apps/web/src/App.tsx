import { Navigate, Route, Routes } from "react-router";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Nickname from "./pages/Nickname";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/nickname" element={<Nickname />} />
      <Route path="/home" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
