import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import ExamsPage from './pages/ExamsPage'
import ExamAttemptPage from './pages/ExamAttemptPage'
import ResultPage from './pages/ResultPage'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return <BrowserRouter><Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #3f3f46' } }} /><AnimatePresence mode="wait"><Routes>
    <Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute roles={['student', 'teacher']} />}><Route element={<StudentLayout />}><Route path="/dashboard" element={<StudentDashboard />} /><Route path="/exams" element={<ExamsPage />} /><Route path="/exam/:id" element={<ExamAttemptPage />} /><Route path="/result/:id" element={<ResultPage />} /></Route></Route>
    <Route element={<ProtectedRoute roles={['admin']} />}><Route element={<AdminLayout />}><Route path="/admin" element={<AdminDashboard />} /></Route></Route>
    <Route path="*" element={<LandingPage />} />
  </Routes></AnimatePresence></BrowserRouter>
}
