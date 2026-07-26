import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { superadminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { ShieldCheck, Users, Megaphone, MessageSquare, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DistributionBarChart } from '../../components/charts/DistributionBarChart'
import { DistributionLineChart } from '../../components/charts/DistributionLineChart'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [admins, setAdmins] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, adminsRes, clientsRes] = await Promise.all([
          superadminApi.stats(),
          superadminApi.listAdmins(),
          superadminApi.listClients(),
        ])
        if (statsRes.data.success) setStats(statsRes.data.data)
        if (adminsRes.data.success) setAdmins(adminsRes.data.data.admins || [])
        if (clientsRes.data.success) setClients(clientsRes.data.data.clients || [])
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load platform stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loader label="Loading platform command center..." />

  const statCards = [
    { label: 'Active Admin Accounts', value: stats?.totalAdmins ?? 0, icon: ShieldCheck },
    { label: 'Total Business Clients', value: stats?.totalClients ?? 0, icon: Users },
    { label: 'Total Campaigns Run', value: stats?.totalCampaigns ?? 0, icon: Megaphone },
    { label: 'Total Messages Sent', value: stats?.totalMessages ?? 0, icon: MessageSquare },
  ]

  const adminChartData = admins.map((a) => ({
    name: a.name || 'Admin',
    clients: a.clientCount || 0,
  }))

  const planCounts = { Free: 0, Starter: 0, Pro: 0, Enterprise: 0 }
  clients.forEach((c) => {
    const p = (c.plan || 'free').toLowerCase()
    if (p === 'starter') planCounts.Starter++
    else if (p === 'pro') planCounts.Pro++
    else if (p === 'enterprise') planCounts.Enterprise++
    else planCounts.Free++
  })
  admins.forEach((a) => {
    const p = (a.plan || 'pro').toLowerCase()
    if (p === 'starter') planCounts.Starter++
    else if (p === 'pro') planCounts.Pro++
    else if (p === 'enterprise') planCounts.Enterprise++
    else planCounts.Free++
  })

  const planChartData = [
    { name: 'Free', count: planCounts.Free },
    { name: 'Starter', count: planCounts.Starter },
    { name: 'Pro', count: planCounts.Pro },
    { name: 'Enterprise', count: planCounts.Enterprise },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
        <div>
          <h1 className="text-2xl font-black text-[#F59E0B]">
            Platform Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">Global status and metrics across all admin accounts and sub-clients.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/superadmin/admins"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#090D16] font-extrabold text-sm hover:opacity-90 transition-all shrink-0"
          >
            <span>Admin Accounts</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            to="/superadmin/clients"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white font-extrabold text-sm transition-all border border-[#334155] shrink-0"
          >
            <span>Global Clients</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="p-6 rounded-2xl bg-[#111827] border border-[#1F2937] transition-all hover:border-[#F59E0B]/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">{c.label}</span>
                <div className="p-2.5 rounded-xl bg-[#090D16] text-[#F59E0B] border border-[#1F2937]">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-white">{c.value.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Admin Account Sub-Client Load" className="!bg-[#111827] !border-[#1F2937]">
          <DistributionBarChart
            data={adminChartData}
            dataKey="clients"
            name="Active Clients"
            color="#F59E0B"
            xKey="name"
            emptyMessage="No admin accounts registered yet"
          />
        </Card>
        <Card title="Global Platform Plan Allocation" className="!bg-[#111827] !border-[#1F2937]">
          <DistributionLineChart
            data={planChartData}
            dataKey="count"
            name="Total Accounts"
            color="#F59E0B"
            xKey="name"
            emptyMessage="No accounts registered yet"
          />
        </Card>
      </div>
    </div>
  )
}
