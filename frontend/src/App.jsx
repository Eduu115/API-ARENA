import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ChallengeDetail from "./pages/ChallengeDetail";
import Challenges from "./pages/Challenges";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import MultiplayerHub from "./pages/MultiplayerHub";
import MySubmissions from "./pages/MySubmissions";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SubmissionDetail from "./pages/SubmissionDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* hacia la raíz */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Publicas */}
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

        {/* Cualquier otra ruta */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
