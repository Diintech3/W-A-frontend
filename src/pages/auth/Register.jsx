import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await register(form)
      if (data.success) {
        toast.success(data.message || 'Account created')
        navigate('/', { replace: true })
      } else toast.error(data.message || 'Registration failed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#334155] bg-[#1E293B] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#F1F5F9]">Create account</h1>
          <p className="mt-1 text-sm text-slate-400">Start automating WhatsApp</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Business name"
            name="businessName"
            autoComplete="organization"
            value={form.businessName}
            onChange={(e) => setField('businessName', e.target.value)}
          />
          <Input
            label="Phone (optional)"
            name="phone"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#25D366] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
