import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { campaignsApi, contactsApi, templatesApi, photoshareApi } from '../../services/api'
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
  const [folders, setFolders] = useState([])
  const [name, setName] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [photoshareFolderId, setPhotoshareFolderId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [expandedTemplates, setExpandedTemplates] = useState({})

  const selectedTemplate = templates.find((t) => t._id === templateId)

  useEffect(() => {
    async function load() {
      try {
        const [g, t, f] = await Promise.all([
          contactsApi.groups(),
          templatesApi.list(),
          photoshareApi.listFolders()
        ])
        if (g.data.success) setGroups(g.data.data.groups || [])
        if (t.data.success) setTemplates(t.data.data.templates || [])
        if (f.data.success) setFolders(f.data.data.folders || [])
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
        photoshareFolderId: photoshareFolderId || undefined,
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
          <div className="relative w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Template *</span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-left text-[#F1F5F9] focus:border-[#25D366] focus:outline-none text-sm"
            >
              <span>{selectedTemplate ? selectedTemplate.name : 'Select template...'}</span>
              <span className="text-xs text-slate-400">▼</span>
            </button>
            
            {isOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-[#334155] bg-[#1E293B] shadow-xl">
                  {templates.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400">No templates found</div>
                  ) : (
                    templates.map((t) => {
                      const isSelected = t._id === templateId;
                      const hasLongPreview = t.bodyPreview && (t.bodyPreview.length > 150 || t.bodyPreview.split('\n').length > 4);
                      return (
                        <div
                          key={t._id}
                          onClick={() => {
                            setTemplateId(t._id);
                            setIsOpen(false);
                          }}
                          className={`w-full p-3 text-left border-b border-[#334155] last:border-b-0 hover:bg-[#334155] transition-colors flex flex-col gap-1.5 cursor-pointer ${
                            isSelected ? 'bg-[#1e3a2b] border-l-4 border-l-[#25D366]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-sm text-[#F1F5F9]">{t.name}</span>
                            <span className="text-xs text-slate-400 uppercase font-medium bg-[#334155] px-1.5 py-0.5 rounded">{t.languageCode}</span>
                          </div>
                          <div className="text-xs text-slate-300 w-full">
                            <p className={`whitespace-pre-wrap leading-relaxed ${
                              expandedTemplates[t._id] ? '' : 'line-clamp-4'
                            }`}>
                              {t.bodyPreview || 'No body preview.'}
                            </p>
                            {hasLongPreview && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTemplates(prev => ({
                                    ...prev,
                                    [t._id]: !prev[t._id]
                                  }));
                                }}
                                className="mt-1 text-[#25D366] hover:underline font-semibold block"
                              >
                                {expandedTemplates[t._id] ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">Link to Photoshare Folder (Optional)</span>
            <select
              className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-[#F1F5F9]"
              value={photoshareFolderId}
              onChange={(e) => setPhotoshareFolderId(e.target.value)}
            >
              <option value="">None — Do not link to any folder</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} {f.isActive ? '(Active)' : ''}
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
