import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import ActiveChallengeSessionBanner from "../components/ActiveChallengeSessionBanner";
import BrowsingTimeTracker from "../components/BrowsingTimeTracker";
import CookieConsent from "../components/CookieConsent";
import ProfileComplianceGate from "../components/ProfileComplianceGate";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import RouteFallback from "../components/RouteFallback";
import ProtectedLayout from "../layouts/ProtectedLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import { lazyWithRetry } from "../lib/lazyWithRetry";
import LocaleLayout, { RootLocaleRedirect } from "./LocaleLayout";

const Landing = lazyWithRetry(() => import("../pages/landing/Landing"));
const ChallengeDetail = lazyWithRetry(() => import("../pages/challenges/ChallengeDetail"));
const Challenges = lazyWithRetry(() => import("../pages/challenges/Challenges"));
const Dashboard = lazyWithRetry(() => import("../pages/dashboard/Dashboard"));
const Leaderboard = lazyWithRetry(() => import("../pages/Leaderboard"));
const Login = lazyWithRetry(() => import("../pages/auth/Login"));
const MultiplayerHub = lazyWithRetry(() => import("../pages/MultiplayerHub"));
const MySubmissions = lazyWithRetry(() => import("../pages/submissions/MySubmissions"));
const NotFound = lazyWithRetry(() => import("../pages/NotFound"));
const Profile = lazyWithRetry(() => import("../pages/Profile"));
const ProfileAchievements = lazyWithRetry(() => import("../pages/ProfileAchievements"));
const Register = lazyWithRetry(() => import("../pages/auth/Register"));
const VerifyEmail = lazyWithRetry(() => import("../pages/auth/VerifyEmail"));
const ForgotPassword = lazyWithRetry(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("../pages/auth/ResetPassword"));
const SubmissionDetail = lazyWithRetry(() => import("../pages/submissions/SubmissionDetail"));
const SubmissionResults = lazyWithRetry(() => import("../pages/submissions/SubmissionResults"));
const Replay = lazyWithRetry(() => import("../pages/Replay"));
const DocsHub = lazyWithRetry(() => import("../pages/docs/DocsHub"));
const LegalPage = lazyWithRetry(() => import("../pages/legal/LegalPage"));
const AboutPage = lazyWithRetry(() => import("../pages/about/AboutPage"));
const TeacherDashboard = lazyWithRetry(() => import("../pages/teacher/TeacherDashboard"));
const Corrections = lazyWithRetry(() => import("../pages/teacher/Corrections"));
const TeacherChallenges = lazyWithRetry(() => import("../pages/teacher/TeacherChallenges"));
const CreateChallenge = lazyWithRetry(() => import("../pages/teacher/CreateChallenge"));
const TeacherGroups = lazyWithRetry(() => import("../pages/teacher/TeacherGroups"));
const TeacherOnboarding = lazyWithRetry(() => import("../pages/teacher/TeacherOnboarding"));
const ChallengeSubmit = lazyWithRetry(() => import("../pages/challenges/ChallengeSubmit"));
const AdminLayout = lazyWithRetry(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazyWithRetry(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("../pages/admin/AdminUsers"));
const AdminUserDetail = lazyWithRetry(() => import("../pages/admin/AdminUserDetail"));
const AdminAudit = lazyWithRetry(() => import("../pages/admin/AdminAudit"));
const AdminContent = lazyWithRetry(() => import("../pages/admin/AdminContent"));
const AdminContentEditor = lazyWithRetry(() => import("../pages/admin/AdminContentEditor"));
const NewsList = lazyWithRetry(() => import("../pages/content/NewsList"));
const NewsArticle = lazyWithRetry(() => import("../pages/content/NewsArticle"));
const Changelog = lazyWithRetry(() => import("../pages/content/Changelog"));
const Roadmap = lazyWithRetry(() => import("../pages/content/Roadmap"));
const Friends = lazyWithRetry(() => import("../pages/friends/Friends"));
const Notifications = lazyWithRetry(() => import("../pages/Notifications"));
const Social = lazyWithRetry(() => import("../pages/social/Social"));

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
        <Route path="content" element={<AdminContent />} />
        <Route path="content/new" element={<AdminContentEditor />} />
        <Route path="content/:id" element={<AdminContentEditor />} />
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
        <Route path="news" element={<NewsList />} />
        <Route path="news/:slug" element={<NewsArticle />} />
        <Route path="changelog" element={<Changelog />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="multiplayer" element={<MultiplayerHub />} />
        <Route path="docs" element={<DocsHub />} />
        <Route path="docs/:docId" element={<DocsHub />} />
        <Route path="teachers" element={<TeacherOnboarding />} />

        <Route path="about" element={<AboutPage />} />
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
      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>{AppRoutes()}</Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
