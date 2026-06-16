import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveInitialLocale } from '../lib/locale.js';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enChallenges from './locales/en/challenges.json';
import enSubmissions from './locales/en/submissions.json';
import enDashboard from './locales/en/dashboard.json';
import enLeaderboard from './locales/en/leaderboard.json';
import enProfile from './locales/en/profile.json';
import enFriends from './locales/en/friends.json';
import enNotifications from './locales/en/notifications.json';
import enTours from './locales/en/tours.json';
import enReplay from './locales/en/replay.json';
import enTeacher from './locales/en/teacher.json';
import enLanding from './locales/en/landing.json';
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esChallenges from './locales/es/challenges.json';
import esSubmissions from './locales/es/submissions.json';
import esDashboard from './locales/es/dashboard.json';
import esLeaderboard from './locales/es/leaderboard.json';
import esProfile from './locales/es/profile.json';
import esFriends from './locales/es/friends.json';
import esNotifications from './locales/es/notifications.json';
import esTours from './locales/es/tours.json';
import esReplay from './locales/es/replay.json';
import esLanding from './locales/es/landing.json';
import esTeacher from './locales/es/teacher.json';

const initialLocale = resolveInitialLocale();

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, auth: enAuth, challenges: enChallenges, submissions: enSubmissions, dashboard: enDashboard, leaderboard: enLeaderboard, profile: enProfile, friends: enFriends, notifications: enNotifications, tours: enTours, replay: enReplay, landing: enLanding, teacher: enTeacher },
    es: { common: esCommon, auth: esAuth, challenges: esChallenges, submissions: esSubmissions, dashboard: esDashboard, leaderboard: esLeaderboard, profile: esProfile, friends: esFriends, notifications: esNotifications, tours: esTours, replay: esReplay, landing: esLanding, teacher: esTeacher },
  },
  lng: initialLocale,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth', 'challenges', 'submissions', 'dashboard', 'leaderboard', 'profile', 'friends', 'notifications', 'tours', 'replay', 'landing', 'teacher'],
  interpolation: { escapeValue: false },
});

try {
  document.documentElement.lang = initialLocale;
} catch {
  /* ignore */
}

export default i18n;
