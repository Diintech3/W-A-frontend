import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  MessageCircle,
  Bot,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/inbox', label: 'Inbox', icon: MessageCircle },
  { to: '/chatbot', label: 'Chatbot', icon: Bot },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#25D366]/15 text-[#25D366]'
                : 'text-slate-300 hover:bg-[#334155]/50 hover:text-white'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-3 z-40 rounded-lg bg-[#1E293B] p-2 text-white md:hidden border border-[#334155]"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#334155] bg-[#0F172A] transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-[#334155] px-4 md:h-16">
          <div className="h-9 w-9 rounded-lg bg-[#25D366] flex items-center justify-center text-[#0F172A] font-bold text-sm">
            WA
          </div>
          <div>
            <div className="text-sm font-semibold text-[#F1F5F9]">WhatsMarketing</div>
            <div className="text-xs text-slate-500">SaaS Console</div>
          </div>
        </div>
        {nav}
      </aside>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
