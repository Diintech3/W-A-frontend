import { useAuthContext } from '../../context/AuthContext'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ImpersonationBanner() {
  return null

  const handleReturn = async () => {
    if (sessionStorage.getItem('isImpersonatedSession')) {
      sessionStorage.clear()
      window.close()
      navigate('/login')
      return
    }
    await revertImpersonation()
    if (originalUser?.role === 'superadmin') {
      navigate('/superadmin')
    } else if (originalUser?.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="bg-[#1E293B] border-b border-[#334155] px-6 py-2.5 flex items-center justify-between text-xs text-[#F1F5F9] shadow-md z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          You are currently viewing workspace as <strong className="text-white underline">{user?.name}</strong> (<span className="uppercase text-amber-400 font-bold">{user?.role}</span>).
        </span>
      </div>
      <button
        onClick={handleReturn}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#334155] hover:bg-[#475569] text-white font-bold transition-all border border-[#475569]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{sessionStorage.getItem('isImpersonatedSession') ? 'Close Workspace Tab' : `Return to ${originalUser?.name || 'My Panel'}`}</span>
      </button>
    </div>
  )
}
