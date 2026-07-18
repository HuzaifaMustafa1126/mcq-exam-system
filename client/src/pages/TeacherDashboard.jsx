import { BookOpen, ClipboardList, Users } from 'lucide-react'
import Card from '../components/Card'
import { useAuth } from '../hooks/useAuth'

const summary = [
  ['Exams created', '0', ClipboardList],
  ['Question bank', '0', BookOpen],
  ['Students assessed', '0', Users],
]

export default function TeacherDashboard() {
  const { user } = useAuth()
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-cyan-300">TEACHER PORTAL</p><h1 className="mt-1 text-3xl font-bold">Welcome, {user?.name}</h1><p className="mt-2 text-zinc-400">Create exams, manage questions, and review student progress.</p><section className="mt-8 grid gap-4 sm:grid-cols-3">{summary.map(([label, value, Icon]) => <Card key={label} className="p-5"><Icon className="text-cyan-300" size={22} /><p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-zinc-400">{label}</p></Card>)}</section></div>
}
