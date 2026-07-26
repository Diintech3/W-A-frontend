import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { superadminApi } from '../../services/api'
import { useAuthContext } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { ShieldCheck, Plus, Trash2, X, Check, ExternalLink, Edit2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const { openWorkspaceInNewTab } = useAuthContext()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    plan: 'pro',
    maxClients: 50,
    maxMessages: 500000,
  })

  const [editForm, setEditForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    plan: 'pro',
    maxClients: 50,
    maxMessages: 500000,
    isVerified: true,
  })

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const res = await superadminApi.listAdmins()
      if (res.data.success) {
        setAdmins(res.data.data.admins || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await superadminApi.createAdmin(form)
      if (res.data.success) {
        toast.success('Admin Account created successfully')
        setShowCreate(false)
        setForm({ name: '', email: '', password: '', businessName: '', phone: '', plan: 'pro', maxClients: 50, maxMessages: 500000 })
        loadAdmins()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create admin')
    }
  }

  const handlePlanChange = async (id, newPlan) => {
    try {
      const res = await superadminApi.updateAdmin(id, { plan: newPlan })
      if (res.data.success) {
        toast.success(`Admin plan updated to ${newPlan}`)
        loadAdmins()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update plan')
    }
  }

  const handleStartEdit = (admin) => {
    setEditingAdmin(admin._id)
    setEditForm({
      name: admin.name || '',
      businessName: admin.businessName || '',
      phone: admin.phone || '',
      plan: admin.plan || 'pro',
      maxClients: admin.adminLimits?.maxClients || 20,
      maxMessages: admin.adminLimits?.maxMessages || 100000,
      isVerified: admin.isVerified ?? true,
    })
    setShowCreate(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await superadminApi.updateAdmin(editingAdmin, editForm)
      if (res.data.success) {
        toast.success('Admin Account updated successfully')
        setEditingAdmin(null)
        loadAdmins()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update admin')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Admin "${name}"? This will unlink their clients.`)) return
    try {
      const res = await superadminApi.deleteAdmin(id)
      if (res.data.success) {
        toast.success('Admin deleted successfully')
        loadAdmins()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete admin')
    }
  }

  const handleAccessPanel = async (admin) => {
    try {
      const res = await openWorkspaceInNewTab(admin._id, 'admin')
      if (res.success) {
        toast.success(`Opening ${admin.name}'s workspace in a new tab...`)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to access admin workspace')
    }
  }

  if (loading && admins.length === 0) return <Loader label="Loading admin accounts..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F59E0B] flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#F59E0B]" /> Manage Admin Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">Onboard administrators, configure quotas, or access workspaces directly.</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate)
            setEditingAdmin(null)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#090D16] font-extrabold text-sm hover:opacity-90 transition-all"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showCreate ? 'Close Form' : 'Create Admin Account'}</span>
        </button>
      </div>

      {showCreate && (
        <Card title="Onboard New Admin Account" className="!bg-[#111827] !border-[#1F2937]">
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ashi Sharma"
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
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
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. Diin Tech"
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 919876543210"
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Max Sub-Clients</label>
                <input
                  type="number"
                  value={form.maxClients}
                  onChange={(e) => setForm({ ...form, maxClients: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Max Messages Quota</label>
                <input
                  type="number"
                  value={form.maxMessages}
                  onChange={(e) => setForm({ ...form, maxMessages: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:opacity-90 text-[#090D16] font-extrabold text-sm transition-all"
              >
                <Check className="w-4 h-4" /> Create Admin Account
              </button>
            </div>
          </form>
        </Card>
      )}

      {editingAdmin && (
        <Card title="Edit Admin Account Quotas & Details" className="!bg-[#111827] !border-[#F59E0B]">
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none capitalize"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Max Sub-Clients</label>
                <input
                  type="number"
                  value={editForm.maxClients}
                  onChange={(e) => setEditForm({ ...editForm, maxClients: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Max Messages Quota</label>
                <input
                  type="number"
                  value={editForm.maxMessages}
                  onChange={(e) => setEditForm({ ...editForm, maxMessages: e.target.value })}
                  className="w-full rounded-xl border border-[#334155] bg-[#090D16] px-3.5 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-white">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                    className="w-4 h-4 rounded border-[#334155] text-[#F59E0B] focus:ring-[#F59E0B] bg-[#090D16]"
                  />
                  <span>Verified Admin Account</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-extrabold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:opacity-90 text-[#090D16] font-extrabold text-sm transition-all"
              >
                <Save className="w-4 h-4" /> Save Quotas & Changes
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Registered Admins (${admins.length})`} className="!bg-[#111827] !border-[#1F2937]">
        <Table>
          <THead>
            <TR className="!border-[#1F2937]">
              <TH>Admin Account</TH>
              <TH>Email & Phone</TH>
              <TH>Active Clients</TH>
              <TH>Plan & Quota</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {admins.length === 0 ? (
              <TR>
                <TD colSpan={6} className="text-center py-8 text-slate-400">
                  No Admins registered yet.
                </TD>
              </TR>
            ) : (
              admins.map((admin) => (
                <TR key={admin._id} className="!border-[#1F2937] hover:bg-[#1E293B]/30">
                  <TD className="font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#090D16] border border-[#1F2937] flex items-center justify-center text-[#F59E0B] font-black">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{admin.name}</p>
                        <p className="text-[11px] text-[#F59E0B] font-semibold">{admin.businessName || 'Admin'}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <p className="text-sm text-slate-200">{admin.email}</p>
                    <p className="text-xs text-slate-400">{admin.phone || 'No phone'}</p>
                  </TD>
                  <TD>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#090D16] text-[#F59E0B] border border-[#1F2937] text-xs font-bold">
                      {admin.clientCount || 0} / {admin.adminLimits?.maxClients || 20} Clients
                    </span>
                  </TD>
                  <TD>
                    <select
                      value={admin.plan}
                      onChange={(e) => handlePlanChange(admin._id, e.target.value)}
                      className="rounded-lg border border-[#334155] bg-[#090D16] px-2.5 py-1 text-xs font-bold text-white focus:border-[#F59E0B] focus:outline-none capitalize"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Limit: {(admin.adminLimits?.maxMessages || 100000).toLocaleString()} msgs</p>
                  </TD>
                  <TD>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${admin.isVerified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.isVerified ? 'bg-emerald-400' : 'bg-yellow-400'}`}></span>
                      {admin.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAccessPanel(admin)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F59E0B]/15 hover:bg-[#F59E0B] text-[#F59E0B] hover:text-[#090D16] border border-[#F59E0B]/30 font-extrabold text-xs transition-all"
                        title="Directly enter this Admin's workspace"
                      >
                        <span>Access Panel</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(admin)}
                        className="p-2 rounded-xl bg-[#090D16] hover:bg-[#F59E0B]/15 text-slate-400 hover:text-[#F59E0B] border border-[#1F2937] transition-all"
                        title="Edit Admin Quotas & Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin._id, admin.name)}
                        className="p-2 rounded-xl bg-[#090D16] hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-[#1F2937] transition-all"
                        title="Delete Admin"
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
