import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import PageFallback from './components/PageFallback'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const StudentExamsPage = lazy(() => import('./pages/ExamsPage'))
const ExamAttemptPage = lazy(() => import('./pages/ExamAttemptPage'))
const StartExamPage = lazy(() => import('./pages/StartExamPage'))
const ResultPage = lazy(() => import('./pages/ResultPage'))
const StudentResultsPage = lazy(() => import('./pages/StudentResultsPage'))
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const TeachersPage = lazy(() => import('./pages/TeachersPage'))
const StudentsPage = lazy(() => import('./pages/StudentsPage'))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'))
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'))
const AdminExamsPage = lazy(() => import('./pages/AdminExamsPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const TeacherQuestionsPage = lazy(() => import('./pages/QuestionsPage'))
const TeacherExamsPage = lazy(() => import('./pages/AdminExamsPage'))
const TeacherResultsPage = lazy(() => import('./pages/TeacherResultsPage'))
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return <BrowserRouter><Toaster position="top-right" toastOptions={{ duration: 4000, ariaProps: { role: 'status', 'aria-live': 'polite' }, style: { background: '#18181b', color: '#fff', border: '1px solid #3f3f46' } }} /><RouteErrorBoundary><Suspense fallback={<PageFallback />}><AnimatePresence mode="wait"><Routes>
    <Route path="/" element={<LandingPage />} /><Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route>
    <Route element={<ProtectedRoute roles={['student']} />}><Route element={<StudentLayout />}><Route path="/dashboard" element={<StudentDashboard />} /><Route path="/exams" element={<StudentExamsPage />} /><Route path="/exam/:id" element={<StartExamPage />} /><Route path="/exam/:id/live" element={<ExamAttemptPage />} /><Route path="/results" element={<StudentResultsPage />} /><Route path="/result/:id" element={<ResultPage />} /><Route path="/profile" element={<StudentProfilePage />} /></Route></Route>
    <Route element={<ProtectedRoute roles={['teacher']} />}><Route element={<TeacherLayout />}><Route path="/teacher" element={<TeacherDashboard />} /><Route path="/teacher/questions" element={<TeacherQuestionsPage />} /><Route path="/teacher/exams" element={<TeacherExamsPage />} /><Route path="/teacher/results" element={<TeacherResultsPage />} /><Route path="/teacher/profile" element={<TeacherProfilePage />} /></Route></Route>
    <Route element={<ProtectedRoute roles={['admin']} />}><Route element={<AdminLayout />}><Route path="/admin" element={<AdminDashboard />} /><Route path="/admin/teachers" element={<TeachersPage />} /><Route path="/admin/students" element={<StudentsPage />} /><Route path="/admin/subjects" element={<SubjectsPage />} /><Route path="/admin/questions" element={<QuestionsPage />} /><Route path="/admin/exams" element={<AdminExamsPage />} /><Route path="/admin/results" element={<ResultsPage />} /></Route></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AnimatePresence></Suspense></RouteErrorBoundary></BrowserRouter>
}
