import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import ActiveChallengeSessionBanner from "../components/ActiveChallengeSessionBanner";
import BrowsingTimeTracker from "../components/BrowsingTimeTracker";
import CookieConsent from "../components/CookieConsent";
import ProfileComplianceGate from "../components/ProfileComplianceGate";
import ProtectedLayout from "../layouts/ProtectedLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import LocaleLayout, { RootLocaleRedirect } from "./LocaleLayout";

const Landing = lazy(() => import("../pages/landing/Landing"));
const ChallengeDetail = lazy(() => import("../pages/challenges/ChallengeDetail"));
const Challenges = lazy(() => import("../pages/challenges/Challenges"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Leaderboard = lazy(() => import("../pages/Leaderboard"));
const Login = lazy(() => import("../pages/auth/Login"));
const MultiplayerHub = lazy(() => import("../pages/MultiplayerHub"));
const MySubmissions = lazy(() => import("../pages/submissions/MySubmissions"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Profile = lazy(() => import("../pages/Profile"));
const ProfileAchievements = lazy(() => import("../pages/ProfileAchievements"));
const Register = lazy(() => import("../pages/auth/Register"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const SubmissionDetail = lazy(() => import("../pages/submissions/SubmissionDetail"));
const SubmissionResults = lazy(() => import("../pages/submissions/SubmissionResults"));
const Replay = lazy(() => import("../pages/Replay"));
const DocsHub = lazy(() => import("../pages/docs/DocsHub"));
const LegalPage = lazy(() => import("../pages/legal/LegalPage"));
const TeacherDashboard = lazy(() => import("../pages/teacher/TeacherDashboard"));
const Corrections = lazy(() => import("../pages/teacher/Corrections"));
const TeacherChallenges = lazy(() => import("../pages/teacher/TeacherChallenges"));
const CreateChallenge = lazy(() => import("../pages/teacher/CreateChallenge"));
const TeacherGroups = lazy(() => import("../pages/teacher/TeacherGroups"));
const ChallengeSubmit = lazy(() => import("../pages/challenges/ChallengeSubmit"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("../pages/admin/AdminUserDetail"));
const AdminAudit = lazy(() => import("../pages/admin/AdminAudit"));
const Friends = lazy(() => import("../pages/friends/Friends"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Social = lazy(() => import("../pages/social/Social"));

function RouteFallback() {
  return <div className="route-fallback" aria-hidden="true" />;
}

function AppRoutes() {
  return (
    <>
      <Route path="/" element={<RootLocaleRedirect />} />

      {/* Isolated admin bunker — outside LocaleLayout, no locale, no normal-site chrome. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="audit" element={<AdminAudit />} />
      </Route>

      <Route path="/:locale" element={<LocaleLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route path="challenges" element={<Challenges />} />
        <Route path="challenges/:id" element={<ChallengeDetail />} />

        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="multiplayer" element={<MultiplayerHub />} />
        <Route path="docs" element={<DocsHub />} />
        <Route path="docs/:docId" element={<DocsHub />} />

        <Route path="aviso-legal" element={<LegalPage />} />
        <Route path="privacidad" element={<LegalPage />} />
        <Route path="cookies" element={<LegalPage />} />
        <Route path="terminos" element={<LegalPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="perfil/achievements" element={<ProfileAchievements />} />
          <Route path="profile" element={<Navigate to="../perfil" replace />} />
          <Route path="submissions" element={<MySubmissions />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />
          <Route path="submissions/:id/results" element={<SubmissionResults />} />
          <Route path="challenges/:id/submit" element={<ChallengeSubmit />} />
          <Route path="replay" element={<Replay />} />
          <Route path="friends" element={<Friends />} />
          <Route path="social" element={<Social />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route element={<TeacherLayout />}>
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/corrections" element={<Corrections />} />
          <Route path="teacher/groups" element={<TeacherGroups />} />
          <Route path="teacher/challenges" element={<TeacherChallenges />} />
          <Route path="teacher/challenges/new" element={<CreateChallenge />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </>
  );
}

/** Site-level widgets (banners, cookie consent, trackers) — never inside the admin bunker. */
function SiteChrome() {
  const { pathname } = useLocation();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return (
    <>
      <BrowsingTimeTracker />
      <ActiveChallengeSessionBanner />
      <CookieConsent />
      <ProfileComplianceGate />
    </>
  );
}

export default function RoutesConfig() {
  return (
    <BrowserRouter>
      <SiteChrome />
      <Suspense fallback={<RouteFallback />}>
        <Routes>{AppRoutes()}</Routes>
      </Suspense>
    </BrowserRouter>
  );
}
