import { Routes, Route } from 'react-router-dom'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import JobsPage from './pages/app/JobsPage'
import MatchesPage from './pages/app/MatchesPage'
import DocumentsPage from './pages/app/DocumentsPage'
import ProfilePage from './pages/app/ProfilePage'

import AppLayout from './components/layout/AppLayout'
import ResumeEditorPage from './pages/editor/ResumeEditorPage'
import CoverLetterEditorPage from './pages/editor/CoverLetterEditorPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="/documents/resume/:id" element={<ResumeEditorPage />} />
      <Route path="/documents/cover-letter/:id" element={<CoverLetterEditorPage />} />
    </Routes>
  )
}