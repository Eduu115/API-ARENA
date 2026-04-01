import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Landing from "../pages/landing/Landing";
import ChallengeDetail from "../pages/challenges/ChallengeDetail";
import Challenges from "../pages/challenges/Challenges";
import Dashboard from "../pages/dashboard/Dashboard";
import Leaderboard from "../pages/Leaderboard";
import Login from "../pages/auth/Login";
import MultiplayerHub from "../pages/MultiplayerHub";
import MySubmissions from "../pages/submissions/MySubmissions";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Register from "../pages/auth/Register";
import SubmissionDetail from "../pages/submissions/SubmissionDetail";
import Replay from "../pages/Replay";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import Corrections from "../pages/teacher/Corrections";
import TeacherChallenges from "../pages/teacher/TeacherChallenges";
import CreateChallenge from "../pages/teacher/CreateChallenge";

export default function RoutesConfig() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const isTeacher = (role) => String(role || "").toUpperCase() === "TEACHER";

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
        <Route
          path="/profile"
          element={
            isLoading ? null : isAuthenticated ? <Profile /> : <Navigate to="/register" replace />
          }
        />
        <Route path="/replay" element={<Replay />} />

        <Route path="/multiplayer" element={<MultiplayerHub />} />

        <Route
          path="/teacher"
          element={
            isLoading ? null : isAuthenticated && isTeacher(user?.role) ? <TeacherDashboard /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/teacher/corrections"
          element={
            isLoading ? null : isAuthenticated && isTeacher(user?.role) ? <Corrections /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/teacher/challenges"
          element={
            isLoading ? null : isAuthenticated && isTeacher(user?.role) ? <TeacherChallenges /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/teacher/challenges/new"
          element={
            isLoading ? null : isAuthenticated && isTeacher(user?.role) ? <CreateChallenge /> : <Navigate to="/dashboard" replace />
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
