import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { analyticsApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { MessageStatsChart } from '../../components/charts/MessageStatsChart'
import { CampaignChart } from '../../components/charts/CampaignChart'
import { DripFunnelChart } from '../../components/charts/DripFunnelChart'
import {
  BarChart3,
  Droplets,
  Send,
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle2,
  Eye,
  MessageSquare,
  Target,
  Users,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Check,
  Ban,
  Activity,
  Calendar,
} from 'lucide-react'

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'drip' | 'broadcast'
  const [overview, setOverview] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [dripData, setDripData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Step Inspector Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [inspectCampaign, setInspectCampaign] = useState(null)

  async function loadData(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [oRes, tRes, cRes, dRes] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.timeline(),
        analyticsApi.campaigns(),
        analyticsApi.drip(),
      ])

      if (oRes.data?.success) setOverview(oRes.data.data)
      if (tRes.data?.success) setTimeline(tRes.data.data.timeline || [])
      if (cRes.data?.success) setCampaigns(cRes.data.data.campaigns || [])
      if (dRes.data?.success) setDripData(dRes.data.data || null)
      if (isManualRefresh) toast.success('Analytics updated successfully!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <Loader label="Loading comprehensive analytics…" />

  // Drip Summary shortcuts
  const dripSummary = dripData?.summary || {}
  const dripDelivery = dripData?.delivery || {}
  const dripCampaignsList = dripData?.campaigns || []

  // Status badge styling helper
  function getDripStatusBadge(status) {
    const config = {
      active: { text: 'ACTIVE', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      scheduled: { text: 'SCHEDULED', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      paused: { text: 'PAUSED', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      draft: { text: 'DRAFT', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      awaiting_approval: { text: 'AWAITING APPROVAL', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      completed: { text: 'COMPLETED', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      stopped: { text: 'STOPPED', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    }
    const c = config[status] || { text: (status || 'UNKNOWN').toUpperCase(), bg: 'bg-slate-800 text-slate-400 border-slate-700' }
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.bg}`}>
        ● {c.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header & Channel Switcher ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[#25D366]" />
            Analytics &amp; Performance Hub
          </h1>
          <p className="text-sm text-slate-400">
            Real-time delivery health, engagement rates &amp; drip conversion analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#25D366]' : ''}`} />
            Refresh
          </Button>

          <Link to="/drip-campaigns/new">
            <Button size="sm" className="flex items-center gap-1.5 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-semibold shadow-lg shadow-[#25D366]/20">
              <Droplets className="h-3.5 w-3.5" />
              New Drip Sequence
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-800 pb-px space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-[#25D366] text-[#25D366] bg-slate-800/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Layers className="h-4 w-4" />
          Unified Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drip')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 ${
            activeTab === 'drip'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Droplets className="h-4 w-4 text-cyan-400" />
          Drip Automations
          {dripSummary.totalCampaigns > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
              {dripSummary.totalCampaigns}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 ${
            activeTab === 'broadcast'
              ? 'border-emerald-400 text-emerald-400 bg-slate-800/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Send className="h-4 w-4 text-emerald-400" />
          Broadcast Campaigns
          {campaigns.length > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {campaigns.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: UNIFIED OVERVIEW ────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="!p-4 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Total Dispatched</span>
                <Send className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-3xl font-bold text-[#F1F5F9]">
                {(overview?.totalMessages || 0) + (dripDelivery?.totalDispatched || 0)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Broadcast: <b className="text-slate-300">{overview?.totalMessages || 0}</b></span>
                <span>Drip: <b className="text-cyan-400">{dripDelivery?.totalDispatched || 0}</b></span>
              </div>
            </Card>

            <Card className="!p-4 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Delivery Health</span>
                <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
              </div>
              <div className="mt-2 text-3xl font-bold text-[#34D399]">
                {overview?.deliveredPercent ?? 0}%
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Failed Rate: <b className="text-rose-400">{overview?.failedPercent ?? 0}%</b></span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
            </Card>

            <Card className="!p-4 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Read Rate</span>
                <Eye className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-3xl font-bold text-sky-400">
                {overview?.readPercent ?? 0}%
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Drip Read: <b className="text-sky-300">{dripDelivery?.readRate ?? 0}%</b></span>
                <span className="text-sky-400">Verified</span>
              </div>
            </Card>

            <Card className="!p-4 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Drip Conversions</span>
                <Target className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-3xl font-bold text-purple-400">
                {dripSummary.converted || 0}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Rate: <b className="text-purple-300">{dripSummary.conversionRate || 0}%</b></span>
                <span>Enrolled: <b className="text-slate-300">{dripSummary.totalEnrolled || 0}</b></span>
              </div>
            </Card>
          </div>

          {/* Side-by-side Channel Highlights */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Broadcast Channel Card */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-200">Broadcast Campaigns Channel</h2>
                    <p className="text-xs text-slate-400">One-time mass WhatsApp broadcasts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('broadcast')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  View Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">Campaigns</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5">{campaigns.length}</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">Delivered</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{overview?.deliveredPercent || 0}%</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">Read Rate</div>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">{overview?.readPercent || 0}%</div>
                </div>
              </div>
            </div>

            {/* Drip Automations Channel Card */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-200">Drip Automations Engine</h2>
                    <p className="text-xs text-slate-400">Multi-step timed nurturing sequences</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('drip')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  View Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">Active Drips</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">{dripSummary.activeCampaigns || 0} / {dripSummary.totalCampaigns || 0}</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">In Pipeline</div>
                  <div className="text-lg font-bold text-purple-400 mt-0.5">{dripSummary.activeEnrolled || 0} Contacts</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">Conversions 🎯</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{dripSummary.converted || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Messages over time (30 Days)" subtitle="Combined Outbound &amp; Drip Trends">
              <MessageStatsChart data={timeline} showBreakdown={true} />
            </Card>

            <Card
              title="Drip Sequences Performance Funnel"
              subtitle="Step dispatch, delivery and engagement per automation"
              action={
                <button
                  type="button"
                  onClick={() => setActiveTab('drip')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  All Drip Data <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              <DripFunnelChart data={dripCampaignsList} />
            </Card>
          </div>

          {/* Quick Drip Automation Overview Table */}
          <Card
            title="Drip Automations Summary"
            subtitle="Recent multi-step automated sequences"
            action={
              <Link to="/drip-campaigns" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium">
                Manage all drips <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Automation Name</TH>
                    <TH>Mode</TH>
                    <TH>Status</TH>
                    <TH>Audience</TH>
                    <TH>Dispatched</TH>
                    <TH>Delivery %</TH>
                    <TH>Read %</TH>
                    <TH>Converted 🎯</TH>
                    <TH className="text-right">Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {dripCampaignsList.slice(0, 5).map((c) => (
                    <TR key={c._id} className="hover:bg-slate-800/40 transition">
                      <TD>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <Link to={`/drip-campaigns/${c._id}`} className="hover:text-cyan-400 transition">
                            {c.name}
                          </Link>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.totalSteps} steps · {c.durationDays} days duration
                        </div>
                      </TD>
                      <TD>
                        {c.mode === 'ai' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            <Sparkles className="h-3 w-3" /> AI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Manual
                          </span>
                        )}
                      </TD>
                      <TD>{getDripStatusBadge(c.status)}</TD>
                      <TD>
                        <div className="text-xs text-slate-300 font-medium">
                          {c.stats?.enrollments?.total || c.totalAudience || 0}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.stats?.enrollments?.active || 0} active
                        </div>
                      </TD>
                      <TD className="text-xs font-semibold text-slate-200">
                        {c.stats?.delivery?.totalDispatched || 0}
                      </TD>
                      <TD>
                        <span className="text-xs font-semibold text-emerald-400">
                          {c.stats?.delivery?.deliveryRate || 0}%
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs font-semibold text-sky-400">
                          {c.stats?.delivery?.readRate || 0}%
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs font-bold text-purple-400">
                          {c.stats?.enrollments?.converted || 0}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectCampaign(c)
                            setInspectModalOpen(true)
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-medium border border-slate-700 transition"
                        >
                          Inspect Steps
                        </button>
                      </TD>
                    </TR>
                  ))}
                  {!dripCampaignsList.length && (
                    <TR>
                      <TD colSpan={9} className="text-center py-6 text-slate-500 text-xs">
                        No drip automations created yet. Click "New Drip Sequence" to launch your first automation.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: DRIP AUTOMATIONS IN-DEPTH ANALYTICS ─────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'drip' && (
        <div className="space-y-6">
          {/* Drip KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Drip Sequences</span>
                <Droplets className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-cyan-400">
                {dripSummary.activeCampaigns || 0}
                <span className="text-sm font-normal text-slate-400"> / {dripSummary.totalCampaigns || 0}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {dripSummary.scheduledCampaigns || 0} scheduled · {dripSummary.pausedCampaigns || 0} paused
              </div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Enrolled Audience</span>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-400">
                {dripSummary.totalEnrolled || 0}
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                {dripSummary.activeEnrolled || 0} currently active
              </div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Delivery Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-400">
                {dripDelivery.deliveryRate || 0}%
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {dripDelivery.delivered || 0} delivered of {dripDelivery.totalDispatched || 0}
              </div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Read Rate</span>
                <Eye className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-sky-400">
                {dripDelivery.readRate || 0}%
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {dripDelivery.read || 0} verified read
              </div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Engagement &amp; Replies</span>
                <MessageSquare className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400">
                {dripDelivery.replied || 0}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {dripDelivery.replyRate || 0}% reply rate
              </div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Goal Conversions 🎯</span>
                <Target className="h-4 w-4 text-[#25D366]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#25D366]">
                {dripSummary.converted || 0}
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                {dripSummary.conversionRate || 0}% conversion rate
              </div>
            </Card>
          </div>

          {/* Enrollment Pipeline Status Distribution */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Drip Enrollment Pipeline Breakdown
                </h3>
                <p className="text-xs text-slate-400">Status of all contacts across active automation funnels</p>
              </div>
              <div className="text-xs text-slate-400">
                Total in Pipeline: <b className="text-slate-200">{dripSummary.totalEnrolled || 0}</b> contacts
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 font-semibold uppercase">Active (In Flow)</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{dripSummary.activeEnrolled || 0}</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-purple-500/30">
                <div className="text-[10px] text-purple-400 font-semibold uppercase">Converted 🎯</div>
                <div className="text-xl font-bold text-purple-400 mt-1">{dripSummary.converted || 0}</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-blue-500/30">
                <div className="text-[10px] text-blue-400 font-semibold uppercase">Completed Flow</div>
                <div className="text-xl font-bold text-blue-400 mt-1">{dripSummary.completed || 0}</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-amber-500/30">
                <div className="text-[10px] text-amber-400 font-semibold uppercase">Paused</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{dripSummary.pausedEnrolled || 0}</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-rose-500/30">
                <div className="text-[10px] text-rose-400 font-semibold uppercase">Opted Out</div>
                <div className="text-xl font-bold text-rose-400 mt-1">{dripSummary.optedOut || 0}</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-red-500/30">
                <div className="text-[10px] text-red-400 font-semibold uppercase">Failed Send</div>
                <div className="text-xl font-bold text-red-400 mt-1">{dripSummary.failedEnrolled || 0}</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Drip Campaigns Funnel Performance" subtitle="Sent vs Delivered vs Read vs Replied">
              <DripFunnelChart data={dripCampaignsList} />
            </Card>

            <Card title="Daily Automated Dispatches" subtitle="30-Day Automated Drip Activity">
              <MessageStatsChart data={timeline} showBreakdown={true} />
            </Card>
          </div>

          {/* Full Drip Campaigns Breakdown Table */}
          <Card
            title="All Drip Automations Performance"
            subtitle="Step-by-step delivery health, read rate, and conversion funnel analytics"
            action={
              <Link to="/drip-campaigns/new">
                <Button size="sm" className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
                  <Droplets className="h-3.5 w-3.5 mr-1" />
                  Create Sequence
                </Button>
              </Link>
            }
          >
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <THead>
                  <TR>
                    <TH className="w-[28%]">Campaign & Audience</TH>
                    <TH className="w-[12%]">Status</TH>
                    <TH className="w-[10%]">Sequence</TH>
                    <TH className="w-[12%]">Enrolled</TH>
                    <TH className="w-[10%]">Dispatched</TH>
                    <TH className="w-[16%]">Delivery & Read</TH>
                    <TH className="w-[12%] text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {dripCampaignsList.map((c) => (
                    <TR key={c._id} className="hover:bg-slate-800/40 transition">
                      <TD>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-cyan-400 shrink-0" />
                          <Link to={`/drip-campaigns/${c._id}`} className="hover:text-cyan-400 transition font-bold text-slate-100 text-xs truncate max-w-[200px]">
                            {c.name}
                          </Link>
                          {c.mode === 'ai' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                          <span>Grp: <strong className="text-slate-400">{c.audienceGroup?.name || 'All'}</strong></span>
                          <span>•</span>
                          <span>Time: <strong className="text-slate-400 font-mono">{c.preferredSendTime || '10:00'}</strong></span>
                        </div>
                      </TD>

                      <TD>{getDripStatusBadge(c.status)}</TD>

                      <TD>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-cyan-400 border border-slate-700 font-mono">
                          {c.totalSteps} Steps
                        </span>
                      </TD>

                      <TD>
                        <div className="text-xs font-bold text-slate-200">
                          {c.stats?.enrollments?.total || c.totalAudience || 0} contacts
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {c.stats?.enrollments?.active || 0} active in flow
                        </div>
                      </TD>

                      <TD>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {c.stats?.delivery?.totalDispatched || 0}
                        </span>
                        <div className="text-[10px] text-slate-500">msgs sent</div>
                      </TD>

                      <TD>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <span>✓ {c.stats?.delivery?.deliveryRate || 0}%</span>
                            <span className="text-[10px] text-slate-400 font-normal">({c.stats?.delivery?.delivered || 0} deliv)</span>
                          </div>
                          <div className="text-[11px] font-medium text-sky-400 flex items-center gap-1.5">
                            <span>👁️ {c.stats?.delivery?.readRate || 0}% read</span>
                            <span className="text-[10px] text-slate-500">({c.stats?.delivery?.read || 0})</span>
                          </div>
                        </div>
                      </TD>

                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectCampaign(c)
                              setInspectModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-400 font-bold border border-cyan-500/30 transition whitespace-nowrap"
                          >
                            Inspect Funnel
                          </button>
                          <Link
                            to={`/drip-campaigns/${c._id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
                            title="Manage Sequence"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </TD>
                    </TR>
                  ))}

                  {!dripCampaignsList.length && (
                    <TR>
                      <TD colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                        No drip automations found. Create your first automated sequence to start tracking step-by-step performance.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 3: BROADCAST CAMPAIGNS ANALYTICS ───────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500">Total Outbound Broadcasts</div>
              <div className="mt-1 text-2xl font-semibold text-slate-100">{overview?.totalMessages ?? 0}</div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500">Delivered %</div>
              <div className="mt-1 text-2xl font-semibold text-[#34D399]">{overview?.deliveredPercent ?? 0}%</div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500">Read %</div>
              <div className="mt-1 text-2xl font-semibold text-sky-400">{overview?.readPercent ?? 0}%</div>
            </Card>

            <Card className="!p-4 bg-slate-900 border-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500">Failed %</div>
              <div className="mt-1 text-2xl font-semibold text-rose-400">{overview?.failedPercent ?? 0}%</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Broadcast Messages Timeline (30d)">
              <MessageStatsChart data={timeline} showBreakdown={false} />
            </Card>

            <Card title="Broadcast Campaign Performance">
              <CampaignChart data={campaigns} />
            </Card>
          </div>

          <Card
            title="Broadcast Campaign Breakdown"
            action={
              <Link to="/campaigns/new" className="text-xs text-[#25D366] hover:underline font-semibold">
                + New Campaign
              </Link>
            }
          >
            <Table>
              <THead>
                <TR>
                  <TH>Campaign</TH>
                  <TH>Status</TH>
                  <TH>Sent</TH>
                  <TH>Failed</TH>
                </TR>
              </THead>
              <TBody>
                {campaigns.map((c) => (
                  <TR key={c._id}>
                    <TD className="font-semibold text-slate-200">{c.name}</TD>
                    <TD>
                      <Badge variant={c.status}>{c.status}</Badge>
                    </TD>
                    <TD className="text-emerald-400 font-semibold">{c.sent || 0}</TD>
                    <TD className="text-rose-400 font-semibold">{c.failed || 0}</TD>
                  </TR>
                ))}
                {!campaigns.length && (
                  <TR>
                    <TD colSpan={4} className="text-center text-slate-500 py-6">
                      No broadcast campaigns data yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ─── Step Funnel Inspector Modal ────────────────────────────────────── */}
      <Modal
        open={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-400" />
            <span>Step Funnel: {inspectCampaign?.name || 'Drip Automation'}</span>
          </div>
        }
        size="xl"
      >
        {inspectCampaign && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Campaign Status &amp; Strategy</div>
                <div className="flex items-center gap-2">
                  {getDripStatusBadge(inspectCampaign.status)}
                  <span className="text-xs text-slate-300">
                    Mode: <b className="text-cyan-400">{inspectCampaign.mode === 'ai' ? 'AI Generated ⚡' : 'Manual 🛠️'}</b>
                  </span>
                  <span className="text-xs text-slate-300">
                    Target Group: <b className="text-slate-200">{inspectCampaign.audienceGroup?.name || 'General'}</b>
                  </span>
                </div>
              </div>

              <Link to={`/drip-campaigns/${inspectCampaign._id}`}>
                <Button size="sm" className="text-xs bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
                  Open Sequence Builder <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Steps Timeline / Funnel View */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Step-by-Step Dispatch &amp; Engagement Funnel ({inspectCampaign.steps?.length || 0} Steps)
              </h4>

              <div className="space-y-2.5">
                {(inspectCampaign.steps || []).map((step, idx) => (
                  <div
                    key={step._id || idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/30">
                          {step.order}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span>Step {step.order}:</span>
                            <span className="text-cyan-400">{step.templateName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Category: {step.templateCategory} · Offset: {step.dayOffset ? `Day ${step.dayOffset}` : `${step.offsetValue || 1} ${step.offsetUnit || 'days'}`}
                          </div>
                        </div>
                      </div>

                      {step.notes && (
                        <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {step.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {!inspectCampaign.steps?.length && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No steps configured for this drip campaign.
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Aggregate Performance */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Campaign Summary Performance</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Enrolled Contacts</span>
                  <b className="text-purple-400 text-sm">{inspectCampaign.stats?.enrollments?.total || 0}</b>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Delivery Rate</span>
                  <b className="text-emerald-400 text-sm">{inspectCampaign.stats?.delivery?.deliveryRate || 0}%</b>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Read Rate</span>
                  <b className="text-sky-400 text-sm">{inspectCampaign.stats?.delivery?.readRate || 0}%</b>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Conversions 🎯</span>
                  <b className="text-amber-400 text-sm">{inspectCampaign.stats?.enrollments?.converted || 0}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
