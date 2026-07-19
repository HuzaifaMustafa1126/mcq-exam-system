import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import ExamCard from '../components/ExamCard'
import { exams } from '../utils/demoData'

const filters = ['All', 'Web Development', 'Computer Science', 'Programming']

export default function ExamsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const list = useMemo(() => exams.filter((exam) => (filter === 'All' || exam.subject === filter) && `${exam.title} ${exam.subject}`.toLowerCase().includes(query.toLowerCase())), [query, filter])
  return <div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-sm font-semibold text-cyan-300">EXAM LIBRARY</p><h1 className="mt-1 text-3xl font-bold">Find your next challenge</h1><p className="mt-2 text-zinc-400">Pick an exam and make your practice count.</p></header><div className="glass mb-7 flex flex-col gap-3 rounded-2xl p-3 md:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-950/60 px-3"><Search size={18} className="text-zinc-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exams or categories" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-600" /></label><div className="flex items-center gap-2 overflow-auto"><SlidersHorizontal size={17} className="ml-2 shrink-0 text-zinc-500" />{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${filter === item ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}>{item}</button>)}</div></div>{list.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map((exam) => <ExamCard key={exam.id} exam={exam} />)}</div> : <div className="glass rounded-2xl p-14 text-center"><p className="text-lg font-semibold">No exams found</p><p className="mt-2 text-sm text-zinc-400">Try a different search or category.</p></div>}</div>
}
