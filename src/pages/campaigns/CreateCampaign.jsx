import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { campaignsApi, contactsApi, templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { useSocket } from '../../hooks/useSocket'

export default function CreateCampaign() {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [groups, setGroups] = useState([])
  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)

  const selectedTemplate = templates.find((t) => t._id === templateId)

  useEffect(() => {
    async function load() {
      try {
        const [g, t] = await Promise.all([contactsApi.groups(), templatesApi.list()])
        if (g.data.success) setGroups(g.data.data.groups || [])
        if (t.data.success) setTemplates(t.data.data.templates || [])
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load form data')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (payload) => {
      setProgress(payload)
    }
    socket.on('campaign:progress', handler)
    return () => socket.off('campaign:progress', handler)
  }, [socket])

  async function submit(e) {
    e.preventDefault()
    if (!name || !targetGroup || !templateId) {
      toast.error('Fill name, group and template')
      return
    }
    setLoading(true)
    try {
      const body = {
        name,
        targetGroup,
        template: templateId,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }
      const { data } = await campaignsApi.create(body)
      if (data.success) {
        toast.success('Campaign created')
        const c = data.data.campaign
        if (!scheduledAt && c.status === 'draft') {
          await campaignsApi.send(c._id)
        }
        navigate('/campaigns')
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  const pct =
    progress?.total > 0 ? Math.round((100 * (progress.processed || 0)) / progress.total) : 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Create campaign</h1>
        <p className="text-sm text-slate-400">Target a group with an approved WhatsApp template</p>
      </div>

      {progress?.total > 0 && (
        <Card className="p-4">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Sending progress</span>
            <span>
              {progress.processed ?? 0} / {progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#334155]">
            <div
              className="h-full bg-[#25D366] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {progress.status && (
            <p className="mt-2 text-xs text-slate-400">Status: {progress.status}</p>
          )}
        </Card>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Contact group</span>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              required
            >
              <option value="">Select group</option>
              {groups.length === 0 && (
                <option disabled>No groups found — create one in Contacts first</option>
              )}
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            {groups.length === 0 && (
              <p className="mt-1 text-xs text-[#F59E0B]">
                No groups yet.{' '}
                <a href="/contacts/groups" className="underline">Create a group first →</a>
              </p>
            )}
          </label>
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Template</span>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Schedule (optional, local time)"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : scheduledAt ? 'Schedule' : 'Create & send now'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {selectedTemplate && (
        <TemplatePreview
          name={selectedTemplate.name}
          bodyPreview={selectedTemplate.bodyPreview}
          languageCode={selectedTemplate.languageCode}
          whatsappTemplateName={selectedTemplate.whatsappTemplateName}
        />
      )}
    </div>
  )
}
