import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ExamCard from '../components/ExamCard'
import { getStudentExams } from '../services/student'

export default function ExamsPage() {
  const [query, setQuery] = useState('')
  const { data: exams = [], isLoading, isError } = useQuery({ queryKey: ['student-exams'], queryFn: getStudentExams })
  const list = useMemo(() => exams.filter((exam) => `${exam.title} ${exam.subjectName}`.toLowerCase().includes(query.toLowerCase())), [query, exams])
  return <div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-sm font-semibold text-cyan-300">EXAM LIBRARY</p><h1 className="mt-1 text-3xl font-bold">Available examinations</h1><p className="mt-2 text-zinc-400">Only live, published exams are shown here.</p></header><div className="glass mb-7 rounded-2xl p-3"><label className="flex items-center gap-2 rounded-xl bg-zinc-950/60 px-3"><Search size={18} className="text-zinc-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by exam or subject" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-600" /></label></div>{isLoading?<p className="text-zinc-400">Loading available exams…</p>:isError?<div className="glass rounded-2xl p-10 text-center">Unable to load exams. Please refresh and try again.</div>:list.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map((exam) => <ExamCard key={exam.id} exam={exam} />)}</div> : <div className="glass rounded-2xl p-14 text-center"><p className="text-lg font-semibold">No exams available</p><p className="mt-2 text-sm text-zinc-400">Check again when an exam is published.</p></div>}</div>
}
