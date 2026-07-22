import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { campaignsApi, contactsApi, templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ModalActions } from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { useSocket } from '../../hooks/useSocket'
import { Play, RotateCw, Edit2, Trash2, Plus, Eye, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export default function Campaigns() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [templates, setTemplates] = useState([])

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [form, setForm] = useState({
    name: '',
    targetGroup: '',
    template: '',
    scheduledAt: '',
  })
  const [saving, setSaving] = useState(false)

  // Logs Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [selectedLogsCampaign, setSelectedLogsCampaign] = useState(null)
  const [logsMessages, setLogsMessages] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const { socket } = useSocket()

  async function load() {
    setLoading(true)
    try {
      const res = await campaignsApi.list()
      if (res.data?.success) setList(res.data.data?.campaigns || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }

    try {
      const [groupRes, tempRes] = await Promise.all([
        contactsApi.groups(),
        templatesApi.list(),
      ])
      if (groupRes.data?.success) setGroups(groupRes.data.data?.groups || [])
      if (tempRes.data?.success) setTemplates(tempRes.data.data?.templates || [])
    } catch {
      /* ignore dropdown load failures */
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onProgress = () => load()
    socket.on('campaign:progress', onProgress)
    return () => socket.off('campaign:progress', onProgress)
  }, [socket])

  async function sendNow(id, isResend = false) {
    try {
      const { data } = await campaignsApi.send(id)
      if (data.success) {
        toast.success(isResend ? 'Campaign re-triggered successfully' : 'Sending started')
        load()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Send failed')
    }
  }

  function handleOpenEdit(c) {
    setEditingCampaign(c)
    setForm({
      name: c.name || '',
      targetGroup: typeof c.targetGroup === 'object' ? c.targetGroup?._id : c.targetGroup || '',
      template: typeof c.template === 'object' ? c.template?._id : c.template || '',
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '',
    })
    setEditModalOpen(true)
  }

  async function handleViewLogs(c) {
    setSelectedLogsCampaign(c)
    setLogsModalOpen(true)
    setLoadingLogs(true)
    try {
      const { data } = await campaignsApi.get(c._id)
      if (data.success) {
        setLogsMessages(data.data.messages || [])
      } else {
        toast.error('Failed to load campaign details')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load logs')
    } finally {
      setLoadingLogs(false)
    }
  }

  async function handleSaveEdit() {
    if (!form.name.trim()) {
      toast.error('Campaign Name is required')
      return
    }
    setSaving(true)
    try {
      const { data } = await campaignsApi.update(editingCampaign._id, {
        name: form.name.trim(),
        targetGroup: form.targetGroup,
        template: form.template,
        scheduledAt: form.scheduledAt || null,
      })
      if (data.success) {
        toast.success('Campaign updated successfully')
        setEditModalOpen(false)
        setEditingCampaign(null)
        load()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update campaign')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      const { data } = await campaignsApi.remove(id)
      if (data.success) {
        toast.success('Campaign deleted')
        load()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Campaigns</h1>
          <p className="text-sm text-slate-400">Broadcasts, re-triggering and scheduled sends</p>
        </div>
        <Link to="/campaigns/new">
          <Button type="button" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New campaign
          </Button>
        </Link>
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Status</TH>
                <TH>Total</TH>
                <TH>Sent</TH>
                <TH>Failed</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {list.map((c) => {
                const isRunning = c.status === 'running'
                const isFinished = c.status === 'completed' || c.status === 'failed'
                return (
                  <TR key={c._id} className="hover:bg-slate-800/50 transition">
                    <TD className="font-medium text-slate-100">{c.name}</TD>
                    <TD>
                      <Badge variant={c.status}>{c.status}</Badge>
                    </TD>
                    <TD className="font-semibold">{c.totalContacts || 0}</TD>
                    <TD className="text-emerald-400 font-medium">{c.sent || 0}</TD>
                    <TD className={c.failed > 0 ? 'text-red-400 font-medium' : 'text-slate-400'}>
                      {c.failed || 0}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Eye Button - View Logs & Failure Reasons */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewLogs(c)}
                          title="View Delivery Logs & Failure Reason"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-400 mr-1" /> Logs
                        </Button>

                        {/* Send / Re-trigger Button */}
                        {!isRunning && (
                          <Button
                            type="button"
                            size="sm"
                            variant={isFinished ? 'secondary' : 'primary'}
                            onClick={() => sendNow(c._id, isFinished)}
                            title={isFinished ? 'Re-trigger / Send again' : 'Send Campaign'}
                            className="flex items-center gap-1.5"
                          >
                            {isFinished ? (
                              <>
                                <RotateCw className="h-3.5 w-3.5 text-emerald-400" /> Re-trigger
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 fill-current" /> Send Now
                              </>
                            )}
                          </Button>
                        )}

                        {/* Edit Button */}
                        {!isRunning && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Campaign"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-amber-400 mr-1" /> Edit
                          </Button>
                        )}

                        {/* Delete Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => remove(c._id)}
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                )
              })}
              {!list.length && (
                <TR>
                  <TD colSpan={6} className="text-center py-8 text-slate-500">
                    No campaigns created yet. Click "New campaign" to start one.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Campaign Logs & Failure Reason Modal */}
      <Modal
        open={logsModalOpen}
        title={`Campaign Logs: ${selectedLogsCampaign?.name || ''}`}
        onClose={() => setLogsModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setLogsModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {loadingLogs ? (
            <Loader label="Loading logs..." />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                <div>
                  <span className="text-xs text-slate-400">Total Contacts</span>
                  <p className="text-base font-bold text-slate-200">
                    {selectedLogsCampaign?.totalContacts || logsMessages.length}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-emerald-400">Sent / Delivered</span>
                  <p className="text-base font-bold text-emerald-400">
                    {selectedLogsCampaign?.sent || 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-red-400">Failed</span>
                  <p className="text-base font-bold text-red-400">
                    {selectedLogsCampaign?.failed || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300">Recipient Message Details</h3>
                {logsMessages.map((m) => {
                  const isFailed = m.status === 'failed'
                  return (
                    <div
                      key={m._id}
                      className={`p-3 rounded-lg border text-xs transition ${
                        isFailed
                          ? 'border-red-500/30 bg-red-950/20'
                          : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-slate-200 font-semibold">{m.to}</span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                            isFailed
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isFailed ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {m.status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Error Reason Display Box */}
                      {isFailed && (
                        <div className="mt-2 bg-red-900/30 border border-red-800/50 p-2.5 rounded text-red-300 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-red-200">Failure Reason:</strong>
                            <span className="font-mono text-xs">{m.errorReason || 'Unknown error'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {!logsMessages.length && (
                  <p className="text-center text-xs text-slate-500 py-4 italic">
                    No recipient logs available for this campaign yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal
        open={editModalOpen}
        title="Edit Campaign"
        onClose={() => setEditModalOpen(false)}
        footer={
          <ModalActions
            loading={saving}
            onCancel={() => setEditModalOpen(false)}
            onConfirm={handleSaveEdit}
            confirmText="Update Campaign"
          />
        }
      >
        <div className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="e.g. Diintech Promo Broadcast"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">
              Target Contact Group
            </label>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              value={form.targetGroup}
              onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
            >
              <option value="">Select Target Group...</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">
              WhatsApp Template
            </label>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
            >
              <option value="">Select Template...</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.whatsappTemplateName})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Schedule Date & Time (Optional)"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}


