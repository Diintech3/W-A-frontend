import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, Users, ShieldAlert, Terminal, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/superadmin', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/superadmin/admins', label: 'Admin Accounts', icon: ShieldCheck },
  { to: '/superadmin/clients', label: 'Global Client Accounts', icon: Users },
]

export function SuperAdminSidebar() {
  const { logout } = useAuth()

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-[#1F2937] bg-[#090D16] text-[#F3F4F6]">
      <div className="flex h-16 items-center gap-3 border-b border-[#1F2937] px-6 bg-[#090D16]">
        <div className="p-2 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30">
          <ShieldAlert className="h-6 w-6 text-[#F59E0B]" />
        </div>
        <div>
          <span className="text-base font-black tracking-wider text-[#F59E0B]">
            SUPER ADMIN
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Control</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-4">
        <div className="mb-2 px-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Command Center
        </div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/superadmin'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-l-4 border-[#F59E0B]'
                  : 'text-slate-400 hover:bg-[#111827] hover:text-[#F3F4F6]'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0 text-[#F59E0B]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 space-y-3 border-t border-[#1F2937]/50">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F2937] text-xs text-slate-300">
          <p className="font-extrabold flex items-center gap-2 mb-1 text-[#F59E0B]">
            <Terminal className="w-4 h-4" /> Global Access Active
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">Direct workspace login enabled for all admin and client accounts.</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-4 py-2.5 text-sm font-bold transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
