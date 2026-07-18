import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, UserRound, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Skeleton from '../components/Skeleton'
import TeacherDetailsModal from '../components/teachers/TeacherDetailsModal'
import TeacherFormModal from '../components/teachers/TeacherFormModal'
import { createTeacher, deleteTeacher, getTeachers, updateTeacher } from '../services/teachers'

const PAGE_SIZE = 10
const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—'
const errorMessage = (error, fallback) => error.response?.data?.message || fallback

export default function TeachersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formTeacher, setFormTeacher] = useState(undefined)
  const [detailsId, setDetailsId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()
  const queryKey = ['teachers', { page, limit: PAGE_SIZE, search: deferredSearch }]
  const { data, isPending, isError, refetch } = useQuery({ queryKey, queryFn: () => getTeachers({ page, limit: PAGE_SIZE, search: deferredSearch }) })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teachers'] })
  const createMutation = useMutation({ mutationFn: createTeacher, onSuccess: () => { toast.success('Teacher created successfully'); setFormTeacher(undefined); invalidate() }, onError: (error) => toast.error(errorMessage(error, 'Unable to create teacher')) })
  const updateMutation = useMutation({ mutationFn: updateTeacher, onSuccess: () => { toast.success('Teacher updated successfully'); setFormTeacher(undefined); invalidate() }, onError: (error) => toast.error(errorMessage(error, 'Unable to update teacher')) })
  const deleteMutation = useMutation({ mutationFn: deleteTeacher, onSuccess: () => { toast.success('Teacher deleted successfully'); setDeleteTarget(null); invalidate() }, onError: (error) => toast.error(errorMessage(error, 'Unable to delete teacher')) })
  const teachers = data?.teachers || []
  const pagination = data?.pagination

  const handleSearch = (value) => { setSearch(value); setPage(1) }
  const saveTeacher = (payload) => formTeacher?.id ? updateMutation.mutate({ id: formTeacher.id, payload }) : createMutation.mutate(payload)

  return <div className="mx-auto max-w-7xl pb-8"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold tracking-wide text-cyan-300">PEOPLE MANAGEMENT</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Teachers</h1><p className="mt-2 text-sm text-zinc-400 sm:text-base">Create and manage educator accounts for your examination system.</p></div><Button onClick={() => setFormTeacher({})}><Plus size={18} />Add teacher</Button></header>
    <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /><input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search by name, email, or employee number" className="w-full rounded-xl border border-white/10 bg-white/[.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10" /></div><p className="text-sm text-zinc-500">{pagination ? `${pagination.total} teachers` : '—'}</p></div>
      {isPending ? <TeacherTableSkeleton /> : isError ? <ErrorState onRetry={refetch} /> : teachers.length === 0 ? <EmptyState search={deferredSearch} onAdd={() => setFormTeacher({})} /> : <><div className="overflow-x-auto"><table className="w-full min-w-225 text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wider text-zinc-500"><tr>{['Teacher', 'Employee number', 'Department', 'Status', 'Created date', 'Actions'].map((header) => <th key={header} className="px-5 py-3 font-medium">{header}</th>)}</tr></thead><tbody>{teachers.map((teacher, index) => <motion.tr key={teacher.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} className="border-t border-white/5 text-zinc-300"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-violet-500/10 text-violet-300"><UserRound size={17} /></span><div><p className="font-medium text-white">{teacher.name}</p><p className="text-xs text-zinc-500">{teacher.email}</p></div></div></td><td className="px-5 py-4 font-mono text-xs">{teacher.employeeNumber}</td><td className="px-5 py-4">{teacher.department || '—'}</td><td className="px-5 py-4"><StatusBadge status={teacher.status} /></td><td className="px-5 py-4 text-zinc-400">{formatDate(teacher.createdAt)}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><ActionButton label="View teacher" onClick={() => setDetailsId(teacher.id)}><Eye size={16} /></ActionButton><ActionButton label="Edit teacher" onClick={() => setFormTeacher(teacher)}><Pencil size={16} /></ActionButton><ActionButton label="Delete teacher" danger onClick={() => setDeleteTarget(teacher)}><Trash2 size={16} /></ActionButton></div></td></motion.tr>)}</tbody></table></div><Pagination pagination={pagination} onPage={setPage} /></>}
    </Card>
    <TeacherFormModal open={formTeacher !== undefined} teacher={formTeacher?.id ? formTeacher : null} onClose={() => setFormTeacher(undefined)} onSubmit={saveTeacher} isPending={createMutation.isPending || updateMutation.isPending} />
    <TeacherDetailsModal teacherId={detailsId} onClose={() => setDetailsId(null)} />
    <DeleteModal teacher={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} isPending={deleteMutation.isPending} />
  </div>
}

function StatusBadge({ status }) { const colors = { active: 'bg-emerald-500/10 text-emerald-300', inactive: 'bg-amber-500/10 text-amber-300', suspended: 'bg-rose-500/10 text-rose-300' }; return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[status] || 'bg-white/10 text-zinc-300'}`}>{status}</span> }
function ActionButton({ children, label, danger = false, onClick }) { return <button title={label} aria-label={label} onClick={onClick} className={`rounded-lg p-2 transition ${danger ? 'text-rose-300 hover:bg-rose-500/10' : 'text-zinc-400 hover:bg-white/5 hover:text-cyan-200'}`}>{children}</button> }
function Pagination({ pagination, onPage }) { if (!pagination || pagination.totalPages <= 1) return null; return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4"><p className="text-sm text-zinc-500">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button onClick={() => onPage(pagination.page - 1)} disabled={pagination.page === 1} className="rounded-lg border border-white/10 p-2 text-zinc-300 disabled:opacity-40"><ChevronLeft size={17} /></button><button onClick={() => onPage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="rounded-lg border border-white/10 p-2 text-zinc-300 disabled:opacity-40"><ChevronRight size={17} /></button></div></div> }
function TeacherTableSkeleton() { return <div className="space-y-px p-5">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> }
function EmptyState({ search, onAdd }) { return <div className="grid min-h-75 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Users /></span><h2 className="mt-4 font-bold">{search ? 'No teachers found' : 'No teachers yet'}</h2><p className="mt-2 text-sm text-zinc-500">{search ? 'Try a different search term.' : 'Create the first teacher account to get started.'}</p>{!search && <Button className="mt-5" onClick={onAdd}><Plus size={16} />Add teacher</Button>}</div></div> }
function ErrorState({ onRetry }) { return <div className="p-8 text-center"><p className="font-medium text-rose-300">Unable to load teachers.</p><button onClick={onRetry} className="mt-3 text-sm text-cyan-300 hover:text-cyan-200">Try again</button></div> }
function DeleteModal({ teacher, onClose, onConfirm, isPending }) { return <Modal open={Boolean(teacher)} onClose={onClose} title="Delete teacher"><p className="text-sm leading-6 text-zinc-400">Delete <span className="font-medium text-white">{teacher?.name}</span>? Their account and associated records may no longer be accessible. This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><button onClick={onConfirm} disabled={isPending} className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60">{isPending ? 'Deleting...' : 'Delete teacher'}</button></div></Modal> }
