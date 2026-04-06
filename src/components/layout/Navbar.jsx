import { LogOut, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-4 border-b border-[#334155] bg-[#0F172A]/90 px-4 backdrop-blur md:h-16">
      <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
        <User className="h-4 w-4" />
        <span className="text-[#F1F5F9]">{user?.name}</span>
        <span className="text-slate-500">·</span>
        <span>{user?.businessName || user?.email}</span>
      </div>
      <Button type="button" variant="ghost" className="!py-1.5 !px-3" onClick={() => logout()}>
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </header>
  )
}
