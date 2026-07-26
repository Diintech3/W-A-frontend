import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Shield, Terminal, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
  { to: '/admin/clients', label: 'My Client Accounts', icon: Users },
]

export function AdminSidebar() {
  const { logout } = useAuth()

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-[#1E293B] bg-[#080E1E] text-[#F3F4F6]">
      <div className="flex h-16 items-center gap-3 border-b border-[#1E293B] px-6 bg-[#080E1E]">
        <div className="p-2 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
        </div>
        <div>
          <span className="text-base font-black tracking-wider text-[#3B82F6]">
            ADMIN PANEL
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Portal</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-4">
        <div className="mb-2 px-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Client Management
        </div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-l-4 border-[#3B82F6]'
                  : 'text-slate-400 hover:bg-[#0F172A] hover:text-[#F3F4F6]'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0 text-[#3B82F6]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 space-y-3 border-t border-[#1E293B]/50">
        <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs text-slate-300">
          <p className="font-extrabold flex items-center gap-2 mb-1 text-[#3B82F6]">
            <Terminal className="w-4 h-4" /> Client Access Enabled
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">Direct login enabled into all client workspaces linked to this admin account.</p>
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
