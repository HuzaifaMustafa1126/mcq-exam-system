import { Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { getDefaultRoute } from '../utils/auth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '', password: '', remember: true },
  })

  if (isAuthenticated) return <Navigate to={getDefaultRoute(user?.role)} replace />

  const onSubmit = async ({ email, password, remember }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data, { remember })
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath || getDefaultRoute(data.user.role), { replace: true })
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to sign in. Please try again.',
      })
    }
  }

  return <Card className="w-full max-w-md p-6 sm:p-8 md:p-9">
    <Link to="/" className="mb-8 flex w-fit items-center gap-2 text-xl font-bold transition hover:text-cyan-200">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400"><GraduationCap size={22} /></span>
      Examora
    </Link>
    <p className="text-sm font-semibold tracking-wide text-cyan-300">WELCOME BACK</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in to your account</h1>
    <p className="mt-2 text-sm leading-6 text-zinc-400">Access your exams, results, and learning workspace.</p>

    <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email address is required',
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
        })}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          className="pr-12"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          className="absolute right-3 top-9 rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-400">
        <input type="checkbox" className="size-4 rounded border-white/20 bg-zinc-900 text-cyan-400 focus:ring-cyan-400" {...register('remember')} />
        Remember me on this device
      </label>

      {errors.root?.server && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{errors.root.server.message}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><LoaderCircle className="animate-spin" size={17} />Signing in...</> : <><LockKeyhole size={17} />Sign in securely</>}
      </Button>
    </form>
  </Card>
}
