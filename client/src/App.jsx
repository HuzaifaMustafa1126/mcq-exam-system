import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentExamsPage from './pages/ExamsPage'
import ExamAttemptPage from './pages/ExamAttemptPage'
import StartExamPage from './pages/StartExamPage'
import ResultPage from './pages/ResultPage'
import StudentResultsPage from './pages/StudentResultsPage'
import StudentProfilePage from './pages/StudentProfilePage'
import TeacherDashboard from './pages/TeacherDashboard'
import Loader from './components/Loader'

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

export default function App() {
  return <BrowserRouter><Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #3f3f46' } }} /><AnimatePresence mode="wait"><Routes>
    <Route path="/" element={<LandingPage />} /><Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route>
    <Route element={<ProtectedRoute roles={['student']} />}><Route element={<StudentLayout />}><Route path="/dashboard" element={<StudentDashboard />} /><Route path="/exams" element={<StudentExamsPage />} /><Route path="/exam/:id" element={<StartExamPage />} /><Route path="/exam/:id/live" element={<ExamAttemptPage />} /><Route path="/results" element={<StudentResultsPage />} /><Route path="/result/:id" element={<ResultPage />} /><Route path="/profile" element={<StudentProfilePage />} /></Route></Route>
    <Route element={<ProtectedRoute roles={['teacher']} />}><Route element={<TeacherLayout />}><Route path="/teacher" element={<TeacherDashboard />} /><Route path="/teacher/questions" element={<Suspense fallback={<Loader text="Loading questions..." />}><TeacherQuestionsPage /></Suspense>} /><Route path="/teacher/exams" element={<Suspense fallback={<Loader text="Loading exams..." />}><TeacherExamsPage /></Suspense>} /><Route path="/teacher/results" element={<Suspense fallback={<Loader text="Loading results..." />}><TeacherResultsPage /></Suspense>} /><Route path="/teacher/profile" element={<TeacherProfilePage />} /></Route></Route>
    <Route element={<ProtectedRoute roles={['admin']} />}><Route element={<AdminLayout />}><Route path="/admin" element={<Suspense fallback={<Loader text="Loading dashboard..." />}><AdminDashboard /></Suspense>} /><Route path="/admin/teachers" element={<Suspense fallback={<Loader text="Loading teachers..." />}><TeachersPage /></Suspense>} /><Route path="/admin/students" element={<Suspense fallback={<Loader text="Loading students..." />}><StudentsPage /></Suspense>} /><Route path="/admin/subjects" element={<Suspense fallback={<Loader text="Loading subjects..." />}><SubjectsPage /></Suspense>} /><Route path="/admin/questions" element={<Suspense fallback={<Loader text="Loading questions..." />}><QuestionsPage /></Suspense>} /><Route path="/admin/exams" element={<Suspense fallback={<Loader text="Loading exams..." />}><AdminExamsPage /></Suspense>} /><Route path="/admin/results" element={<Suspense fallback={<Loader text="Loading results..." />}><ResultsPage /></Suspense>} /></Route></Route>
    <Route path="*" element={<LandingPage />} />
  </Routes></AnimatePresence></BrowserRouter>
}
