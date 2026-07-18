import { useQuery } from '@tanstack/react-query'
import { Mail, UserRound } from 'lucide-react'
import Modal from '../Modal'
import Skeleton from '../Skeleton'
import { getTeacher } from '../../services/teachers'

const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

export default function TeacherDetailsModal({ teacherId, onClose }) {
  const { data: teacher, isPending, isError } = useQuery({ queryKey: ['teacher', teacherId], queryFn: () => getTeacher(teacherId), enabled: Boolean(teacherId) })
  return <Modal open={Boolean(teacherId)} onClose={onClose} title="Teacher details">
    {isPending && <div className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
    {isError && <p className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">Unable to load this teacher.</p>}
    {teacher && <div className="space-y-4"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><UserRound /></span><div><p className="font-semibold">{teacher.name}</p><p className="text-sm text-zinc-500">{teacher.employeeNumber}</p></div></div><Detail label="Email" value={teacher.email} icon={Mail} /><Detail label="Department" value={teacher.department || 'Not assigned'} /><Detail label="Status" value={teacher.status} /><Detail label="Created" value={formatDate(teacher.createdAt)} /></div>}
  </Modal>
}

function Detail({ label, value, icon: Icon }) { return <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[.03] px-4 py-3"><span className="flex items-center gap-2 text-sm text-zinc-500">{Icon && <Icon size={15} />}{label}</span><span className="text-right text-sm capitalize text-zinc-200">{value}</span></div> }
