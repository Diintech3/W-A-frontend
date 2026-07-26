import { Outlet } from 'react-router-dom'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import { ShieldAlert } from 'lucide-react'
import { NavbarProfile } from './NavbarProfile'

export function SuperAdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#090D16] text-[#F3F4F6] font-sans">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1F2937] bg-[#090D16]/95 px-6 backdrop-blur shadow-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
              <ShieldAlert className="w-4 h-4" /> Global Platform Authority
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NavbarProfile roleLabel="Super Admin" badgeColor="text-[#F59E0B]" badgeBg="bg-[#F59E0B]/15" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-[#090D16]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
