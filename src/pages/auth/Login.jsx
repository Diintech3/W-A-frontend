import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.success) {
        toast.success(data.message || 'Welcome back')
        navigate('/', { replace: true })
      } else toast.error(data.message || 'Login failed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#334155] bg-[#1E293B] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-lg font-bold text-[#0F172A]">
            WA
          </div>
          <h1 className="text-2xl font-semibold text-[#F1F5F9]">Sign in</h1>
          <p className="mt-1 text-sm text-slate-400">WhatsApp Marketing SaaS</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{' '}
          <Link to="/register" className="text-[#25D366] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
