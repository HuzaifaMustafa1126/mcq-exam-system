import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpen, ClipboardList, Users } from 'lucide-react'
import Card from '../components/Card'
import { useAuth } from '../hooks/useAuth'
import { getExams } from '../services/exams'
import { getQuestions } from '../services/questions'
import { getResults } from '../services/results'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const questions = useQuery({ queryKey: ['teacher-questions'], queryFn: () => getQuestions({ page: 1, limit: 100 }) })
  const exams = useQuery({ queryKey: ['teacher-exams'], queryFn: () => getExams({ page: 1, limit: 100 }) })
  const results = useQuery({ queryKey: ['teacher-results'], queryFn: () => getResults({ page: 1, limit: 100 }) })
  const list = results.data?.results || []; const average = list.length ? (list.reduce((total, result) => total + result.percentage, 0) / list.length).toFixed(1) : 0; const chart = exams.data?.exams?.map((exam) => ({ name: exam.title, questions: exam.totalQuestions })) || []
  const summary = [['Total Questions', questions.data?.pagination?.total || 0, BookOpen], ['Total Exams', exams.data?.pagination?.total || 0, ClipboardList], ['Students Appeared', results.data?.summary?.total || 0, Users], ['Average Score', `${average}%`, Bar]]
  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-cyan-300">TEACHER PORTAL</p><h1 className="mt-1 text-3xl font-bold">Welcome, {user?.name}</h1><p className="mt-2 text-zinc-400">Create exams, manage questions, and review student progress.</p><section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value, Icon], index) => <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><Card className="p-5"><Icon className="text-cyan-300" size={22} /><p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-zinc-400">{label}</p></Card></motion.div>)}</section><section className="mt-7 grid gap-6 xl:grid-cols-2"><Card className="p-5"><h2 className="font-bold">Question statistics</h2><ResponsiveContainer width="100%" height={240}><BarChart data={chart}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="questions" fill="#22d3ee" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Card><Card className="p-5"><h2 className="font-bold">Exam performance</h2><p className="mt-3 text-4xl font-bold text-emerald-300">{average}%</p><p className="mt-2 text-sm text-zinc-500">Average score across submitted attempts.</p></Card></section></div>
}
