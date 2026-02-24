import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/landing/Landing";
import ChallengeDetail from "../pages/challenges/ChallengeDetail";
import Challenges from "../pages/challenges/Challenges";
import Dashboard from "../pages/dashboard/Dashboard";
import Leaderboard from "../pages/Leaderboard";
import Login from "../pages/auth/Login";
import MultiplayerHub from "../pages/MultiplayerHub";
import MySubmissions from "../pages/MySubmissions";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Register from "../pages/auth/Register";
import SubmissionDetail from "../pages/SubmissionDetail";

export default function RoutesConfig() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetail />} />

        <Route path="/submissions" element={<MySubmissions />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />

        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/multiplayer" element={<MultiplayerHub />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
