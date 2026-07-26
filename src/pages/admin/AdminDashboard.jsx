import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Users, Megaphone, MessageSquare, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DistributionBarChart } from '../../components/charts/DistributionBarChart'
import { DistributionLineChart } from '../../components/charts/DistributionLineChart'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, clientsRes] = await Promise.all([
          adminApi.stats(),
          adminApi.listClients(),
        ])
        if (statsRes.data.success) setStats(statsRes.data.data)
        if (clientsRes.data.success) setClients(clientsRes.data.data.clients || [])
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load admin stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loader label="Loading admin dashboard..." />

  const statCards = [
    { label: 'My Sub-Clients', value: stats?.totalClients ?? 0, max: stats?.limits?.maxClients ?? 20, icon: Users },
    { label: 'Client Campaigns Run', value: stats?.totalCampaigns ?? 0, icon: Megaphone },
    { label: 'Client Messages Sent', value: stats?.totalMessages ?? 0, max: stats?.limits?.maxMessages ?? 100000, icon: MessageSquare },
  ]

  const planCounts = { Free: 0, Starter: 0, Pro: 0, Enterprise: 0 }
  const statusCounts = { Connected: 0, Pending: 0 }
  clients.forEach((c) => {
    const p = (c.plan || 'free').toLowerCase()
    if (p === 'starter') planCounts.Starter++
    else if (p === 'pro') planCounts.Pro++
    else if (p === 'enterprise') planCounts.Enterprise++
    else planCounts.Free++

    if (c.whatsappPhoneNumberId) statusCounts.Connected++
    else statusCounts.Pending++
  })

  const planChartData = [
    { name: 'Free', count: planCounts.Free },
    { name: 'Starter', count: planCounts.Starter },
    { name: 'Pro', count: planCounts.Pro },
    { name: 'Enterprise', count: planCounts.Enterprise },
  ]

  const statusChartData = [
    { name: 'API Connected', count: statusCounts.Connected },
    { name: 'Pending Setup', count: statusCounts.Pending },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F172A] p-6 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-black text-[#3B82F6]">
            Admin Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back! You are managing your isolated admin workspace and client accounts.</p>
        </div>
        <Link
          to="/admin/clients"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white font-extrabold text-sm hover:opacity-90 transition-all shrink-0"
        >
          <span>Manage My Clients</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {statCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] transition-all hover:border-[#3B82F6]/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">{c.label}</span>
                <div className="p-2.5 rounded-xl bg-[#080E1E] text-[#3B82F6] border border-[#1E293B]">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-white">
                  {c.value.toLocaleString()}
                  {c.max && <span className="text-xs text-slate-400 font-normal ml-1">/ {c.max} max</span>}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sub-Client Plan Tier Allocation" className="!bg-[#0F172A] !border-[#1E293B]">
          <DistributionBarChart
            data={planChartData}
            dataKey="count"
            name="Client Accounts"
            color="#3B82F6"
            xKey="name"
            emptyMessage="No sub-clients registered yet"
          />
        </Card>
        <Card title="WhatsApp API Connection Status" className="!bg-[#0F172A] !border-[#1E293B]">
          <DistributionLineChart
            data={statusChartData}
            dataKey="count"
            name="Client Status"
            color="#3B82F6"
            xKey="name"
            emptyMessage="No sub-clients registered yet"
          />
        </Card>
      </div>
    </div>
  )
}
