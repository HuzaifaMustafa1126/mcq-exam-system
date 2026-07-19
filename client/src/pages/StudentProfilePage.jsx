import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { updateProfile } from '../services/student'
import { useAuth } from '../hooks/useAuth'

export default function StudentProfilePage(){const {user,login,token}=useAuth();const {register,handleSubmit,formState:{isSubmitting}}=useForm({defaultValues:{name:user?.name,email:user?.email,password:''}});const save=async values=>{try{if(!values.password)delete values.password;const data=await updateProfile(values);login({token:data.token,user:data.user},{remember:localStorage.getItem('mcq_token')===token});toast.success('Profile updated')}catch(e){toast.error(e.response?.data?.message||'Could not update profile')}};return <div className="mx-auto max-w-2xl"><p className="text-sm font-semibold text-cyan-300">STUDENT PROFILE</p><h1 className="mt-1 text-3xl font-bold">Account settings</h1><Card className="mt-7 p-6"><form className="space-y-5" onSubmit={handleSubmit(save)}><Input label="Full name" {...register('name',{required:true})}/><Input label="Email address" type="email" {...register('email',{required:true})}/><Input label="New password" type="password" placeholder="Leave blank to keep your current password" {...register('password',{minLength: {value:8,message:'Use at least 8 characters'}})}/><Button disabled={isSubmitting} type="submit">{isSubmitting?'Saving…':'Save changes'}</Button></form></Card></div>}
