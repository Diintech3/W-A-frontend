import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { superadminApi } from '../../services/api'
import { useAuthContext } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Users, ExternalLink, PhoneCall, ShieldCheck, Edit2, Trash2, Check, X, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ManageGlobalClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState(null)
  const { openWorkspaceInNewTab } = useAuthContext()
  const navigate = useNavigate()

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
      const res = await superadminApi.listClients()
      if (res.data.success) {
        setClients(res.data.data.clients || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load global clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await superadminApi.updateClient(id, { status: newStatus })
      if (res.data.success) {
        toast.success(`Client status updated to ${newStatus}`)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status')
    }
  }

  const handlePlanChange = async (id, newPlan) => {
    try {
      const res = await superadminApi.updateClient(id, { plan: newPlan })
      if (res.data.success) {
        toast.success(`Client plan updated to ${newPlan}`)
        loadClients()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update plan')
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
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await superadminApi.updateClient(editingClient, editForm)
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
    if (!window.confirm(`Are you sure you want to delete client "${name}" globally?`)) return
    try {
      const res = await superadminApi.deleteClient(id)
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

  if (loading && clients.length === 0) return <Loader label="Loading global client registry..." />

  const pendingClients = clients.filter(c => c.status === 'pending')
  const activeClients = clients.filter(c => c.status !== 'pending')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F59E0B] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#F59E0B]" /> Global Client Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">Direct oversight and workspace access for all business client accounts across the platform.</p>
        </div>
      </div>

      {editingClient && (
        <Card title="Edit Client Account & AI Agent" className="!bg-[#111827] !border-[#F59E0B]/30">
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full rounded-xl border border-[#1F2937] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none capitalize"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* WhatsApp API Settings Card */}
            <div className="mt-4 rounded-xl border border-[#25D366]/30 bg-[#090D16] p-4">
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
                    className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-3.5 py-2 text-sm text-white focus:border-[#25D366] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Access Token (Optional)</label>
                  <input
                    type="password"
                    value={editForm.whatsappAccessToken}
                    onChange={(e) => setEditForm({ ...editForm, whatsappAccessToken: e.target.value })}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-3.5 py-2 text-sm text-white focus:border-[#25D366] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#F59E0B]/30 bg-[#090D16] p-4">
              <h3 className="text-sm font-bold text-[#F1F5F9] mb-3">AI Agent Settings</h3>
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
                <span className="text-xs font-bold text-[#FBBF24]">
                  {editForm.aiAgentId ? `Active Agent: ${editForm.aiAgentId}` : 'Not Configured'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Enter the external Agent ID from your <code className="text-[#FBBF24]">vectorize.onthewifi.com</code> portal. If configured, this agent will be queried for RAG-based auto-replies before falling back to generic responses.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">AI Agent ID</label>
                <input
                  type="text"
                  value={editForm.aiAgentId}
                  onChange={(e) => setEditForm({ ...editForm, aiAgentId: e.target.value })}
                  placeholder="e.g. b7981f6037ed62d0"
                  className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-slate-300 font-extrabold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:opacity-90 text-[#090D16] font-extrabold text-sm transition-all"
              >
                <Save className="w-4 h-4" /> Save Client Changes
              </button>
            </div>
          </form>
        </Card>
      )}

      {pendingClients.length > 0 && (
        <Card title={`Pending Client Registrations (${pendingClients.length})`} className="!bg-[#18181B] !border-amber-500/40 shadow-xl">
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
            <span>These clients registered publicly and are pending approval. You can approve or reject them directly from here.</span>
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
                        <span>Approve Registration</span>
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

      <Card title={`All Active & Approved Client Accounts (${activeClients.length})`} className="!bg-[#111827] !border-[#1F2937]">
        <Table>
          <THead>
            <TR className="!border-[#1F2937]">
              <TH>Client Account</TH>
              <TH>Assigned Admin</TH>
              <TH>Approval Status</TH>
              <TH>AI Bot</TH>
              <TH>Email & Phone</TH>
              <TH>WhatsApp Status</TH>
              <TH>Plan Tier</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {activeClients.length === 0 ? (
              <TR>
                <TD colSpan={8} className="text-center py-8 text-slate-400">
                  No active business clients found on the platform.
                </TD>
              </TR>
            ) : (
              activeClients.map((client) => (
                <TR key={client._id} className="!border-[#1F2937] hover:bg-[#1E293B]/30">
                  <TD className="font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#090D16] border border-[#1F2937] flex items-center justify-center text-[#F59E0B] font-black">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{client.name}</p>
                        <p className="text-[11px] text-[#F59E0B] font-semibold">{client.businessName || 'Business'}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    {client.parentAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090D16] text-[#F59E0B] border border-[#1F2937] text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {client.parentAdmin.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Direct / Unassigned</span>
                    )}
                  </TD>
                  <TD>
                    <select
                      value={client.status || 'active'}
                      onChange={(e) => handleStatusChange(client._id, e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none capitalize ${
                        client.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : client.status === 'rejected'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      <option value="active" className="bg-[#090D16] text-emerald-400">Active (Approved)</option>
                      <option value="pending" className="bg-[#090D16] text-amber-400">Pending Approval</option>
                      <option value="rejected" className="bg-[#090D16] text-red-400">Rejected</option>
                    </select>
                  </TD>
                  <TD>
                    {client.aiAgentId ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30 text-xs font-bold" title={`Agent ID: ${client.aiAgentId}`}>
                        Active Bot
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                        None
                      </span>
                    )}
                  </TD>
                  <TD>
                    <p className="text-sm text-slate-200">{client.email}</p>
                    <p className="text-xs text-slate-400">{client.phone || 'No phone'}</p>
                  </TD>
                  <TD>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${client.whatsappPhoneNumberId ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <PhoneCall className="w-3.5 h-3.5" />
                      {client.whatsappPhoneNumberId ? 'Connected' : 'Not Connected'}
                    </span>
                  </TD>
                  <TD>
                    <select
                      value={client.plan}
                      onChange={(e) => handlePlanChange(client._id, e.target.value)}
                      className="rounded-lg border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-xs font-bold text-white focus:border-[#F59E0B] focus:outline-none capitalize"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {client.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(client._id, 'active')}
                            className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all"
                            title="Approve Registration"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(client._id, 'rejected')}
                            className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all"
                            title="Reject Registration"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleAccessPanel(client)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 hover:bg-[#F59E0B] text-[#F59E0B] hover:text-[#090D16] border border-[#F59E0B]/30 font-extrabold text-xs transition-all"
                        title="Directly enter this Client's marketing workspace"
                      >
                        <span>Access Client Panel</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(client)}
                        className="p-2 rounded-xl bg-[#090D16] hover:bg-[#F59E0B]/15 text-slate-400 hover:text-[#F59E0B] border border-[#1F2937] transition-all"
                        title="Edit Client Details & AI Agent"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client._id, client.name)}
                        className="p-2 rounded-xl bg-[#090D16] hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-[#1F2937] transition-all"
                        title="Delete Client Globally"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  )
}
