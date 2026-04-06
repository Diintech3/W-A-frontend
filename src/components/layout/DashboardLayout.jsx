import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-[#F1F5F9]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
