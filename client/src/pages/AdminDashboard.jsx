import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, BookPlus, ClipboardList, GraduationCap, HelpCircle, Layers3, Plus, RefreshCw, School, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'
import api from '../services/api'
import Card from '../components/Card'
import Loader from '../components/Loader'

const statDefinitions = [
  ['Total Students', 'totalStudents', GraduationCap, 'from-violet-500/25 to-violet-500/5', 'text-violet-300'],
  ['Total Teachers', 'totalTeachers', Users, 'from-cyan-500/25 to-cyan-500/5', 'text-cyan-300'],
  ['Total Subjects', 'totalSubjects', Layers3, 'from-amber-500/25 to-amber-500/5', 'text-amber-300'],
  ['Total Questions', 'totalQuestions', HelpCircle, 'from-fuchsia-500/25 to-fuchsia-500/5', 'text-fuchsia-300'],
  ['Total Exams', 'totalExams', ClipboardList, 'from-blue-500/25 to-blue-500/5', 'text-blue-300'],
  ['Active Exams', 'activeExams', BookOpen, 'from-emerald-500/25 to-emerald-500/5', 'text-emerald-300'],
]

const quickActions = [
  ['Add Teacher', Users, 'teacher'],
  ['Add Student', GraduationCap, 'student'],
  ['Add Subject', BookPlus, 'subject'],
  ['Add Question', HelpCircle, 'question'],
  ['Create Exam', ClipboardList, 'exam'],
]

const fetchDashboard = async () => (await api.get('/admin/dashboard')).data.data
const formatNumber = (value) => new Intl.NumberFormat().format(Number(value || 0))

export default function AdminDashboard() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboard,
  })

  if (isPending) return <Loader text="Loading dashboard..." />
  if (isError) return <ErrorState onRetry={refetch} />

  const recentActivity = data.recentActivity || { students: [], teachers: [], exams: [] }
  return <div className="mx-auto max-w-7xl pb-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold tracking-wide text-cyan-300">ADMIN OVERVIEW</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Control center</h1><p className="mt-2 text-sm text-zinc-400 sm:text-base">Monitor learners, assessments, and platform activity in one place.</p></div>
      <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-60"><RefreshCw className={isFetching ? 'animate-spin' : ''} size={16} />Refresh</button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {statDefinitions.map(([label, field, Icon, background, color], index) => <motion.article key={field} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
        <Card className={`overflow-hidden bg-gradient-to-br ${background} p-5 transition-shadow hover:shadow-xl hover:shadow-black/20`}><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl bg-zinc-950/35 ${color}`}><Icon size={21} /></span><span className="text-xs font-medium text-zinc-400">Live total</span></div><p className="mt-6 text-3xl font-bold tracking-tight">{formatNumber(data[field])}</p><p className="mt-1 text-sm text-zinc-400">{label}</p></Card>
      </motion.article>)}
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-2">
      <ChartCard title="Student registrations" subtitle="New students added over recent months"><ResponsiveContainer width="100%" height={270}><AreaChart data={data.studentRegistration || []} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.42} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff12" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="students" name="Students" stroke="#22d3ee" fill="url(#studentGradient)" strokeWidth={3} /></AreaChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Exam performance" subtitle="Average percentage for recent exams"><ResponsiveContainer width="100%" height={270}><BarChart data={data.examPerformance || []} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><CartesianGrid stroke="#ffffff12" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={55} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Average score']} /><Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={38}>{(data.examPerformance || []).map((item, index) => <Cell key={`${item.label}-${index}`} fill={index % 2 ? '#a78bfa' : '#22d3ee'} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>
    </section>

    <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Recent activity</h2><p className="mt-1 text-sm text-zinc-500">Latest members and assessments</p></div><span className="rounded-lg bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">Updated live</span></div><div className="mt-5 grid gap-5 md:grid-cols-3"><ActivityList title="Latest students" items={recentActivity.students} icon={GraduationCap} getMeta={(item) => item.studentNumber || 'Student'} /><ActivityList title="Latest teachers" items={recentActivity.teachers} icon={Users} getMeta={(item) => item.employeeNumber || 'Teacher'} /><ActivityList title="Latest exams" items={recentActivity.exams} icon={School} getMeta={(item) => item.subjectName || item.status} /></div></Card>
      <Card className="p-5"><h2 className="font-bold">Quick actions</h2><p className="mt-1 text-sm text-zinc-500">Manage your examination system.</p><div className="mt-5 space-y-2">{quickActions.map(([label, Icon, action]) => <a key={action} href={`/admin?create=${action}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.03] px-3 py-3 text-sm text-zinc-300 transition hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-white"><span className="grid size-8 place-items-center rounded-lg bg-white/5 text-cyan-300"><Icon size={16} /></span>{label}<Plus className="ml-auto text-zinc-500" size={16} /></a>)}</div></Card>
    </section>
  </div>
}

const tooltipStyle = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#f4f4f5' }

function ChartCard({ title, subtitle, children }) {
  return <Card className="p-5"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-zinc-500">{subtitle}</p><div className="mt-5">{children}</div></Card>
}

function ActivityList({ title, items, icon: Icon, getMeta }) {
  return <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3><div className="space-y-2">{items.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">No activity yet.</p> : items.map((item, index) => <div key={`${item.name || item.title}-${index}`} className="flex items-center gap-3 rounded-xl bg-white/[.03] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-cyan-300"><Icon size={15} /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-200">{item.name || item.title}</p><p className="truncate text-xs text-zinc-500">{getMeta(item)}</p></div></div>)}</div></div>
}

function ErrorState({ onRetry }) {
  return <Card className="mx-auto max-w-xl p-8 text-center"><h1 className="text-xl font-bold">Dashboard unavailable</h1><p className="mt-2 text-sm text-zinc-400">We could not load the latest dashboard data. Please try again.</p><button onClick={onRetry} className="mt-5 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">Try again</button></Card>
}
