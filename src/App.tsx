import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import LandingPage from './pages/LandingPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import PracticePage from './pages/PracticePage';
import QuizPage from './pages/QuizPage';
import QuizResultPage from './pages/QuizResultPage';
import BookmarksPage from './pages/BookmarksPage';
import DashboardPage from './pages/DashboardPage';
import ProgressPage from './pages/ProgressPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShowcasePage from './pages/ShowcasePage';
import DailyChallengePage from './pages/DailyChallengePage';
import AuthGuard from './features/auth/components/AuthGuard';
import { SubmitQuestionPage } from './pages/SubmitQuestionPage';
import AdminGuard from './features/admin/components/AdminGuard';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCommunityPage from './pages/AdminCommunityPage';
import AdminCommunityDetailPage from './pages/AdminCommunityDetailPage';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export function App() {
  return (
    <AppProviders>
      <Analytics />
      <SpeedInsights />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/questions" element={<QuestionBankPage />} />
        <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/:quizId" element={<QuizPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/daily-challenge" element={<DailyChallengePage />} />

        {/* Protected User Routes (Wrapped in AuthGuard) */}
        <Route
          path="/results/:attemptId"
          element={
            <AuthGuard>
              <QuizResultPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <AuthGuard>
              <BookmarksPage />
            </AuthGuard>
          }
        />
        <Route
          path="/progress"
          element={
            <AuthGuard>
              <ProgressPage />
            </AuthGuard>
          }
        />
        <Route
          path="/community/submit"
          element={
            <AuthGuard>
              <SubmitQuestionPage />
            </AuthGuard>
          }
        />

        {/* Admin Routes (Wrapped in AdminGuard) */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminDashboardPage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/community"
          element={
            <AdminGuard>
              <AdminCommunityPage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/community/:submissionId"
          element={
            <AdminGuard>
              <AdminCommunityDetailPage />
            </AdminGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  );
}

export default App;
