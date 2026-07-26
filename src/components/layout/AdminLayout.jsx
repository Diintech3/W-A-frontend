import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { Shield } from 'lucide-react'
import { NavbarProfile } from './NavbarProfile'

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#080E1E] text-[#F3F4F6] font-sans">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#080E1E]/95 px-6 backdrop-blur shadow-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
              <Shield className="w-4 h-4" /> Admin Workspace
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NavbarProfile roleLabel="Admin" badgeColor="text-[#3B82F6]" badgeBg="bg-[#3B82F6]/15" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-[#080E1E]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
