import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { Shield, Crown, MessageSquare } from 'lucide-react'

export default function Login({ portalRole: propRole }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Determine active portal role
  let role = propRole
  if (!role) {
    if (location.pathname.startsWith('/superadmin')) role = 'superadmin'
    else if (location.pathname.startsWith('/admin')) role = 'admin'
    else role = 'client'
  }

  // Theme configuration based on role
  const theme = {
    superadmin: {
      title: 'Super Admin Login',
      subtitle: 'Global Platform Administration & System Registry',
      badgeText: 'SA',
      icon: <Crown className="w-7 h-7 text-[#090D16]" />,
      badgeBg: 'bg-[#F59E0B]',
      border: 'border-[#F59E0B]/40',
      cardBg: 'bg-[#111827]',
      pageBg: 'bg-[#090D16]',
      buttonBg: '!bg-[#F59E0B] hover:!bg-[#F59E0B]/90 !text-[#090D16]',
      accentText: 'text-[#F59E0B]',
      showRegister: false,
      redirectUrl: '/superadmin'
    },
    admin: {
      title: 'Agency Admin Login',
      subtitle: 'Reseller Agency Portal & Client Management',
      badgeText: 'AD',
      icon: <Shield className="w-7 h-7 text-white" />,
      badgeBg: 'bg-[#3B82F6]',
      border: 'border-[#3B82F6]/40',
      cardBg: 'bg-[#0F172A]',
      pageBg: 'bg-[#080E1E]',
      buttonBg: '!bg-[#3B82F6] hover:!bg-[#3B82F6]/90 !text-white',
      accentText: 'text-[#3B82F6]',
      showRegister: false,
      redirectUrl: '/admin'
    },
    client: {
      title: 'Client Workspace Sign in',
      subtitle: 'WhatsApp Marketing SaaS & AI Bot Engine',
      badgeText: 'WA',
      icon: <MessageSquare className="w-7 h-7 text-[#0F172A]" />,
      badgeBg: 'bg-[#25D366]',
      border: 'border-[#334155]',
      cardBg: 'bg-[#1E293B]',
      pageBg: 'bg-[#0F172A]',
      buttonBg: '!bg-[#25D366] hover:!bg-[#25D366]/90 !text-[#0F172A]',
      accentText: 'text-[#25D366]',
      showRegister: true,
      redirectUrl: '/'
    }
  }[role] || {
    title: 'Sign in',
    subtitle: 'WhatsApp Marketing SaaS',
    badgeText: 'WA',
    icon: <MessageSquare className="w-7 h-7 text-[#0F172A]" />,
    badgeBg: 'bg-[#25D366]',
    border: 'border-[#334155]',
    cardBg: 'bg-[#1E293B]',
    pageBg: 'bg-[#0F172A]',
    buttonBg: '!bg-[#25D366] hover:!bg-[#25D366]/90 !text-[#0F172A]',
    accentText: 'text-[#25D366]',
    showRegister: true,
    redirectUrl: '/'
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password, role)
      if (data.success) {
        toast.success(data.message || 'Welcome back')
        navigate(theme.redirectUrl, { replace: true })
      } else toast.error(data.message || 'Login failed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center ${theme.pageBg} p-4 transition-colors duration-300`}>
      <div className={`w-full max-w-md rounded-2xl border ${theme.border} ${theme.cardBg} p-8 shadow-2xl transition-all duration-300`}>
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${theme.badgeBg} shadow-lg font-black`}>
            {theme.icon ? theme.icon : <span className="text-lg font-bold text-[#0F172A]">{theme.badgeText}</span>}
          </div>
          <h1 className="text-2xl font-black text-[#F1F5F9] tracking-tight">{theme.title}</h1>
          <p className="mt-1.5 text-xs font-medium text-slate-400">{theme.subtitle}</p>
        </div>
        {user && user.role !== role && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-center text-xs text-amber-300">
            <p className="font-semibold">⚠️ Active Session Notice</p>
            <p className="mt-1 text-[11px] text-slate-300">
              You are currently logged in as <strong className="text-white capitalize">{user.name || 'User'}</strong> (<span className="uppercase text-amber-400 font-bold">{user.role}</span>). Logging in here will switch your session to <strong className="text-white uppercase">{role}</strong>.
            </p>
          </div>
        )}
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
          <Button type="submit" className={`w-full font-extrabold py-3 rounded-xl shadow-md transition-all ${theme.buttonBg}`} disabled={loading}>
            {loading ? 'Authenticating…' : `Sign in to ${role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Agency Portal' : 'Workspace'}`}
          </Button>
        </form>
        {theme.showRegister ? (
          <p className="mt-6 text-center text-sm text-slate-400">
            No account?{' '}
            <Link to="/register" className={`${theme.accentText} font-bold hover:underline`}>
              Register
            </Link>
          </p>
        ) : (
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              🔒 Restricted Access Portal. Authorized credentials required.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
