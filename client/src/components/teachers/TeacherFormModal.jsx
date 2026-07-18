import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import Input from '../Input'
import Modal from '../Modal'

const blankTeacher = { name: '', email: '', password: '', employeeNumber: '', department: '', status: 'active' }

export default function TeacherFormModal({ open, onClose, teacher, onSubmit, isPending }) {
  const isEditing = Boolean(teacher)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: blankTeacher })

  useEffect(() => {
    reset(teacher ? { ...teacher, password: '' } : blankTeacher)
  }, [teacher, open, reset])

  const submit = (values) => {
    const payload = { ...values, department: values.department.trim() || null }
    if (isEditing && !payload.password) delete payload.password
    onSubmit(payload)
  }

  return <Modal open={open} onClose={onClose} title={isEditing ? 'Edit teacher' : 'Add teacher'}>
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Full name" placeholder="e.g. Ayesha Khan" error={errors.name?.message} {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })} /><Input label="Employee number" placeholder="EMP-001" error={errors.employeeNumber?.message} {...register('employeeNumber', { required: 'Employee number is required' })} /></div>
      <Input label="Email address" type="email" autoComplete="email" placeholder="teacher@example.com" error={errors.email?.message} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
      <Input label={isEditing ? 'New password (optional)' : 'Password'} type="password" autoComplete="new-password" placeholder={isEditing ? 'Leave blank to keep the current password' : 'At least 8 characters'} error={errors.password?.message} {...register('password', { required: isEditing ? false : 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })} />
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Department" placeholder="Computer Science" error={errors.department?.message} {...register('department', { maxLength: { value: 150, message: 'Department must not exceed 150 characters' } })} /><label className="block"><span className="mb-2 block text-sm font-medium text-zinc-300">Status</span><select className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10" {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></label></div>
      <div className="flex justify-end gap-3 border-t border-white/10 pt-5"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create teacher'}</Button></div>
    </form>
  </Modal>
}
