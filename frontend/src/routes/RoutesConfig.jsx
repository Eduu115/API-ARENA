import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import SubmissionResults from "../pages/submissions/SubmissionResults";
import Replay from "../pages/Replay";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import Corrections from "../pages/teacher/Corrections";
import TeacherChallenges from "../pages/teacher/TeacherChallenges";
import CreateChallenge from "../pages/teacher/CreateChallenge";
import TeacherGroups from "../pages/teacher/TeacherGroups";
import ChallengeSubmit from "../pages/challenges/ChallengeSubmit";
import ProtectedLayout from "../layouts/ProtectedLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import Friends from "../pages/friends/Friends";
import ActiveChallengeSessionBanner from "../components/ActiveChallengeSessionBanner";

export default function RoutesConfig() {
  return (
    <BrowserRouter>
      <ActiveChallengeSessionBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetail />} />

        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/multiplayer" element={<MultiplayerHub />} />

        <Route element={<ProtectedLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="profile" element={<Navigate to="/perfil" replace />} />
          <Route path="submissions" element={<MySubmissions />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />
          <Route path="submissions/:id/results" element={<SubmissionResults />} />
          <Route path="challenges/:id/submit" element={<ChallengeSubmit />} />
          <Route path="replay" element={<Replay />} />
          <Route path="friends" element={<Friends />} />
        </Route>

        <Route element={<TeacherLayout />}>
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/corrections" element={<Corrections />} />
          <Route path="teacher/groups" element={<TeacherGroups />} />
          <Route path="teacher/challenges" element={<TeacherChallenges />} />
          <Route path="teacher/challenges/new" element={<CreateChallenge />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
