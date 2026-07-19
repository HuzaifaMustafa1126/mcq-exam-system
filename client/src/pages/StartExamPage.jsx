import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock3, FileText, Play } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Card from '../components/Card'
import { getStudentExam, startStudentExam } from '../services/student'

export default function StartExamPage() {
  const { id } = useParams(); const navigate = useNavigate()
  const exam = useQuery({ queryKey: ['student-exam', id], queryFn: () => getStudentExam(id) })
  const start = useMutation({ mutationFn: () => startStudentExam(id), onSuccess: () => navigate(`/exam/${id}/live`), onError: (e) => { toast.error(e.response?.data?.message || 'Unable to start exam'); if (e.response?.status === 409) navigate(`/exam/${id}/live`) } })
  if (exam.isLoading) return <p className="p-8 text-zinc-400">Loading exam instructions…</p>
  if (exam.isError) return <div className="glass mx-auto max-w-xl rounded-2xl p-8">This exam is not currently available.</div>
  const data = exam.data
  return <div className="mx-auto max-w-3xl py-4"><p className="text-sm font-semibold text-cyan-300">EXAM INSTRUCTIONS</p><h1 className="mt-2 text-3xl font-bold">{data.title}</h1><p className="mt-2 text-zinc-400">{data.subjectName}</p><Card className="mt-7 p-7"><div className="grid gap-4 sm:grid-cols-3">{[[Clock3, `${data.durationMinutes} minutes`], [FileText, `${data.totalQuestions} questions`], [CheckCircle2, `${data.passingMarks}/${data.totalMarks} to pass`]].map(([Icon, text]) => <div key={text} className="rounded-xl bg-white/5 p-4 text-sm text-zinc-300"><Icon className="mb-2 text-cyan-300" size={19}/>{text}</div>)}</div><h2 className="mt-8 text-lg font-bold">Before you begin</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400"><li>• The timer starts immediately and the exam submits automatically when time expires.</li><li>• Your selected answers are saved on this device while you work.</li><li>• You can move between questions and submit only when you are ready.</li></ul><Button disabled={start.isPending} onClick={() => start.mutate()} className="mt-8 w-full">{start.isPending ? 'Starting secure session…' : <><Play size={16}/>Start exam</>}</Button></Card></div>
}
