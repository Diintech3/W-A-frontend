import { useEffect, useState, useRef, Fragment } from 'react'
import toast from 'react-hot-toast'
import { adminApi, templatesApi } from '../../services/api'
import { useAuthContext } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Users, Plus, Trash2, Check, X, PhoneCall, ExternalLink, Edit2, Save, Key, Copy, RefreshCw, AlertCircle, ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, XCircle, Send, Zap, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TemplatePreview } from '../../components/shared/TemplatePreview'

// ─── Meta Status Badge ────────────────────────────────────────────────────────
function MetaStatusBadge({ status }) {
  const config = {
    APPROVED: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Approved' },
    PENDING:  { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending' },
    REJECTED: { color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle, label: 'Rejected' },
    DISABLED: { color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: AlertCircle, label: 'Disabled' },
    DRAFT:    { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: FileText, label: 'Draft' },
  }
  const c = config[status] || config.DRAFT
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${c.color}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

export default function ManageClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [sharingClient, setSharingClient] = useState(null)
  const [generatingKeys, setGeneratingKeys] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const { openWorkspaceInNewTab } = useAuthContext()
  const navigate = useNavigate()
  const [previewTemplateId, setPreviewTemplateId] = useState(null)



  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    plan: 'free',
    status: 'active',
    whatsappPhoneNumberId: '',
  })

  const [editForm, setEditForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    plan: 'free',
    status: 'active',
    aiAgentId: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
  })

  const loadClients = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listClients()
      if (res.data.success) {
        setClients(res.data.data.clients || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await adminApi.createClient(form)
      if (res.data.success) {
        toast.success('Sub-Client created successfully')
        setShowCreate(false)
        setForm({ name: '', email: '', password: '', businessName: '', phone: '', plan: 'free', status: 'active', whatsappPhoneNumberId: '' })
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create client')
    }
  }

  const handlePlanChange = async (id, newPlan) => {
    try {
      const res = await adminApi.updateClient(id, { plan: newPlan })
      if (res.data.success) {
        toast.success(`Client plan updated to ${newPlan}`)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update plan')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminApi.updateClient(id, { status: newStatus })
      if (res.data.success) {
        toast.success(`Client status updated to ${newStatus}`)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status')
    }
  }

  const handleStartEdit = (client) => {
    setEditingClient(client._id)
    setEditForm({
      name: client.name || '',
      businessName: client.businessName || '',
      phone: client.phone || '',
      plan: client.plan || 'free',
      status: client.status || 'active',
      aiAgentId: client.aiAgentId || '',
      whatsappPhoneNumberId: client.whatsappPhoneNumberId || '',
      whatsappAccessToken: '',
    })
    setShowCreate(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await adminApi.updateClient(editingClient, editForm)
      if (res.data.success) {
        toast.success('Client Account updated successfully')
        setEditingClient(null)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update client')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete client "${name}"?`)) return
    try {
      const res = await adminApi.deleteClient(id)
      if (res.data.success) {
        toast.success('Client deleted successfully')
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete client')
    }
  }

  const handleAccessPanel = async (client) => {
    try {
      const res = await openWorkspaceInNewTab(client._id, 'client')
      if (res.success) {
        toast.success(`Opening ${client.name}'s workspace in a new tab...`)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to access client workspace')
    }
  }

  const handleOpenSharing = (client) => {
    setSharingClient(client)
  }

  const handleGenerateSharing = async (id) => {
    setGeneratingKeys(true)
    try {
      const res = await adminApi.generateClientApiSharing(id)
      if (res.data.success) {
        toast.success('Client API Sharing credentials generated successfully!')
        const updatedClient = {
          ...sharingClient,
          apiSharing: {
            isEnabled: true,
            apiSharingKey: res.data.data.apiSharingKey,
            accessToken: res.data.data.accessToken,
            referenceKey: res.data.data.referenceKey,
            generatedAt: new Date(),
          },
        }
        setSharingClient(updatedClient)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate client API sharing credentials')
    } finally {
      setGeneratingKeys(false)
    }
  }

  const handleRevokeSharing = async (id) => {
    if (!window.confirm('Are you sure you want to revoke API Sharing access for this client?')) return
    try {
      const res = await adminApi.revokeClientApiSharing(id)
      if (res.data.success) {
        toast.success('API Sharing access revoked')
        const updatedClient = {
          ...sharingClient,
          apiSharing: { isEnabled: false },
        }
        setSharingClient(updatedClient)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to revoke API sharing access')
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Copied ${field}!`)
    setTimeout(() => setCopiedField(''), 2000)
  }


  if (loading && clients.length === 0) return <Loader label="Loading client accounts..." />

  const pendingClients = clients.filter(c => c.status === 'pending')
  const activeClients = clients.filter(c => c.status !== 'pending')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#3B82F6] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#3B82F6]" /> Manage Client Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">View sub-client accounts, connect WhatsApp APIs, or enter workspaces directly.</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate)
            setEditingClient(null)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white font-extrabold text-sm hover:opacity-90 transition-all"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showCreate ? 'Close Form' : 'Create New Client'}</span>
        </button>
      </div>

      {showCreate && (
        <Card title="Onboard New Sub-Client Account" className="!bg-[#0F172A] !border-[#1E293B]">
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Anil Kumar Singh"
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. HexStack"
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 919918309983"
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:opacity-90 text-white font-extrabold text-sm transition-all"
              >
                <Check className="w-4 h-4" /> Create Client Account
              </button>
            </div>
          </form>
        </Card>
      )}

      {editingClient && (
        <Card title="Edit Client Account & WhatsApp Config" className="!bg-[#0F172A] !border-[#3B82F6]">
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none capitalize"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* WhatsApp API Settings Card */}
            <div className="mt-4 rounded-xl border border-[#25D366]/30 bg-[#080E1E] p-4">
              <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">WhatsApp API Settings</h3>
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#25D366]"></span>
                <span className="text-xs font-bold text-[#4ADE80]">
                  {editForm.whatsappPhoneNumberId ? `Connected Phone ID: ${editForm.whatsappPhoneNumberId}` : 'Not Configured'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Enter your <code className="text-[#4ADE80]">WhatsApp Phone Number ID</code> and Access Token from Meta Developers portal for automated message delivery.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={editForm.whatsappPhoneNumberId}
                    onChange={(e) => setEditForm({ ...editForm, whatsappPhoneNumberId: e.target.value })}
                    placeholder="e.g. 104928374829"
                    className="w-full rounded-xl border border-[#334155] bg-[#0F172A] px-3.5 py-2 text-sm text-white focus:border-[#25D366] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Access Token (Optional)</label>
                  <input
                    type="password"
                    value={editForm.whatsappAccessToken}
                    onChange={(e) => setEditForm({ ...editForm, whatsappAccessToken: e.target.value })}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full rounded-xl border border-[#334155] bg-[#0F172A] px-3.5 py-2 text-sm text-white focus:border-[#25D366] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#3B82F6]/30 bg-[#080E1E] p-4">
              <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">AI Agent Settings</h3>
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]"></span>
                <span className="text-xs font-bold text-[#60A5FA]">
                  {editForm.aiAgentId ? `Active Agent: ${editForm.aiAgentId}` : 'Not Configured'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Enter the external Agent ID from your <code className="text-[#60A5FA]">vectorize.onthewifi.com</code> portal. If configured, this agent will be queried for RAG-based auto-replies before falling back to generic responses.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">AI Agent ID</label>
                <input
                  type="text"
                  value={editForm.aiAgentId}
                  onChange={(e) => setEditForm({ ...editForm, aiAgentId: e.target.value })}
                  placeholder="e.g. b7981f6037ed62d0"
                  className="w-full rounded-xl border border-[#334155] bg-[#0F172A] px-3.5 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-extrabold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] hover:opacity-90 text-white font-extrabold text-sm transition-all"
              >
                <Save className="w-4 h-4" /> Save Client Changes
              </button>
            </div>
          </form>
        </Card>
      )}

      {pendingClients.length > 0 && (
        <Card title={`Pending Client Registrations (${pendingClients.length})`} className="!bg-[#111827] !border-amber-500/40 shadow-xl">
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
            <span>These clients self-registered from the public landing page and are awaiting agency approval. Click Approve to claim and manage them.</span>
          </div>
          <Table>
            <THead>
              <TR className="!border-amber-500/20">
                <TH className="!text-amber-400 font-black">Client Account</TH>
                <TH className="!text-amber-400 font-black">Email & Contact</TH>
                <TH className="!text-amber-400 font-black">Registration Status</TH>
                <TH className="!text-amber-400 font-black">WhatsApp API</TH>
                <TH className="!text-amber-400 font-black text-right">Quick Review Actions</TH>
              </TR>
            </THead>
            <TBody>
              {pendingClients.map((client) => (
                <TR key={client._id} className="!border-amber-500/20 hover:bg-amber-500/5">
                  <TD className="font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{client.name}</p>
                        <p className="text-[11px] text-amber-400 font-semibold">{client.businessName || 'Business'}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <p className="text-sm text-slate-200">{client.email}</p>
                    <p className="text-xs text-slate-400">{client.phone || 'No phone'}</p>
                  </TD>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      Pending Approval
                    </span>
                  </TD>
                  <TD>
                    <span className="text-xs text-slate-400 font-semibold">Not connected</span>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleStatusChange(client._id, 'active')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Claim</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(client._id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 font-black text-xs transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card title={`Active & Managed Client Accounts (${activeClients.length})`} className="!bg-[#0F172A] !border-[#1E293B]">
        <Table>
          <THead>
            <TR className="!border-[#1F2937]">
              <TH>Client Account</TH>
              <TH>Email & Contact</TH>
              <TH>Approval Status</TH>
              <TH>AI Bot</TH>
              <TH>WhatsApp Status</TH>
              <TH>Assigned Plan</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {activeClients.length === 0 ? (
              <TR>
                <TD colSpan={7} className="text-center py-8 text-slate-400">
                  No active clients assigned to your account yet.
                </TD>
              </TR>
            ) : (
              activeClients.map((client) => (
                <Fragment key={client._id}>
                  {/* ── Main client row ── */}
                  <TR
                    key={client._id}
                    className="!border-[#1E293B] cursor-pointer transition-all hover:bg-[#1E293B]/40"
                    onClick={() => navigate(`/admin/clients/${client._id}/templates`)}
                  >
                    <TD className="font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg border flex items-center justify-center font-black text-sm transition-colors bg-[#080E1E] border-[#1E293B] text-[#3B82F6]">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{client.name}</p>
                          <p className="text-[11px] text-[#3B82F6] font-semibold">{client.businessName || 'Business'}</p>
                        </div>
                      </div>
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm text-slate-200">{client.email}</p>
                      <p className="text-xs text-slate-400">{client.phone || 'No phone'}</p>
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <select
                        value={client.status || 'active'}
                        onChange={(e) => handleStatusChange(client._id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none capitalize ${
                          client.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : client.status === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <option value="active" className="bg-[#080E1E] text-emerald-400">Active (Approved)</option>
                        <option value="pending" className="bg-[#080E1E] text-amber-400">Pending Approval</option>
                        <option value="rejected" className="bg-[#080E1E] text-red-400">Rejected</option>
                      </select>
                    </TD>
                    <TD>
                      {client.aiAgentId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 text-xs font-bold">
                          Active Bot
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                          None
                        </span>
                      )}
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${client.whatsappPhoneNumberId ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <PhoneCall className="w-3.5 h-3.5" />
                        {client.whatsappPhoneNumberId ? 'Connected' : 'Not Connected'}
                      </span>
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <select
                        value={client.plan}
                        onChange={(e) => handlePlanChange(client._id, e.target.value)}
                        className="rounded-lg border border-[#334155] bg-[#080E1E] px-2.5 py-1 text-xs font-bold text-white focus:border-[#3B82F6] focus:outline-none capitalize"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </TD>
                    <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {client.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(client._id, 'active')} className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all" title="Approve"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleStatusChange(client._id, 'rejected')} className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all" title="Reject"><X className="w-4 h-4" /></button>
                          </>
                        )}
                        <button onClick={() => handleAccessPanel(client)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-[#3B82F6]/30 font-extrabold text-xs transition-all"><span>Access Panel</span><ExternalLink className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenSharing(client)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/30 font-extrabold text-xs transition-all"><Key className="w-3.5 h-3.5" /><span>API</span></button>
                        <button onClick={() => handleStartEdit(client)} className="p-2 rounded-xl bg-[#080E1E] hover:bg-[#3B82F6]/15 text-slate-400 hover:text-[#3B82F6] border border-[#1E293B] transition-all" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(client._id, client.name)} className="p-2 rounded-xl bg-[#080E1E] hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-[#1E293B] transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client._id}/templates`) }}
                          className="p-2 rounded-xl bg-[#080E1E] border border-[#1E293B] text-slate-400 hover:text-[#25D366] hover:border-[#25D366]/40 transition-all text-xs font-bold"
                          title="Manage Templates"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                  </Fragment>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      {sharingClient && (
        <div className="mt-8 animate-fadeIn">
          <Card title={`Magnifi AI — Client SSO & API Sharing (${sharingClient.name})`} className="!bg-[#0F172A] !border-purple-500/30 shadow-2xl shadow-purple-900/10">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
                <div>
                  <h3 className="text-base font-extrabold text-white">Client Portal SSO Integration Credentials</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Map this Client Account (<code className="text-purple-400 font-mono">{sharingClient.email}</code>) to a Magnifi AI Workspace so Super Admin can access it directly.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${sharingClient.apiSharing?.isEnabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {sharingClient.apiSharing?.isEnabled ? '🟢 Active & Enabled' : '⚪ Not Generated / Inactive'}
                </span>
              </div>

              {sharingClient.apiSharing?.isEnabled ? (
                <div className="space-y-3 bg-[#090D16]/50 p-4 rounded-xl border border-[#1F2937]">
                  <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> Copy these 3 credentials into Magnifi AI's <span className="text-white bg-black px-1.5 py-0.5 rounded border border-slate-700">Add Client Credentials</span> modal:
                  </p>

                  {[
                    { label: 'API SHARING KEY', value: sharingClient.apiSharing.apiSharingKey },
                    { label: 'ACCESS TOKEN', value: sharingClient.apiSharing.accessToken },
                    { label: 'REFERENCE KEY', value: sharingClient.apiSharing.referenceKey },
                  ].map((field) => (
                    <div key={field.label} className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-400">{field.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={field.value}
                          className="w-full bg-[#090D16] border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 select-all"
                        />
                        <button
                          onClick={() => copyToClipboard(field.value, field.label)}
                          className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold flex items-center gap-1.5 border border-[#334155] transition-all shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedField === field.label ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 flex items-center justify-between border-t border-[#1F2937]">
                    <p className="text-[11px] text-slate-400">Generated on: {new Date(sharingClient.apiSharing.generatedAt || Date.now()).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateSharing(sharingClient._id)}
                        disabled={generatingKeys}
                        className="px-3 py-1.5 rounded-lg bg-yellow-500/15 hover:bg-yellow-500 text-yellow-400 hover:text-black font-extrabold text-xs transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generatingKeys ? 'animate-spin' : ''}`} />
                        <span>Re-generate Keys</span>
                      </button>
                      <button
                        onClick={() => handleRevokeSharing(sharingClient._id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white font-extrabold text-xs transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[#090D16]/50 rounded-xl border border-dashed border-[#334155] p-6">
                  <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No Integration Credentials Generated</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    Generate secure API Sharing tokens so Magnifi AI Super Admin can map and access this Client account directly without passwords.
                  </p>
                  <button
                    onClick={() => handleGenerateSharing(sharingClient._id)}
                    disabled={generatingKeys}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-600/20"
                  >
                    <Key className={`w-4 h-4 ${generatingKeys ? 'animate-spin' : ''}`} />
                    <span>Generate Magnifi AI Client Credentials</span>
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
