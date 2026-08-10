import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { Eye, Code2, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Edit2, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal, ModalActions } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

// ─── Status badge ─────────────────────────────────────────────────────────────
function MetaStatusBadge({ status }) {
  const config = {
    PENDING_ADMIN_APPROVAL: { color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: Clock, label: 'Awaiting Admin' },
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

export default function Templates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState(null)
  
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editVariables, setEditVariables] = useState([])
  const [savingVars, setSavingVars] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  async function handleDeleteTemplate(id) {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    setDeletingId(id)
    try {
      const { data } = await templatesApi.remove(id)
      if (data.success) {
        toast.success(data.message || 'Template deleted successfully')
        load()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  // Request Template states
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [reqName, setReqName] = useState('')
  const [reqCategory, setReqCategory] = useState('MARKETING')
  const [reqLanguage, setReqLanguage] = useState('en')
  const [reqHeaderText, setReqHeaderText] = useState('')
  const [reqBodyText, setReqBodyText] = useState('')
  const [reqFooterText, setReqFooterText] = useState('')
  const [reqVariables, setReqVariables] = useState([])
  const [submittingRequest, setSubmittingRequest] = useState(false)

  useEffect(() => {
    const text = (reqHeaderText || '') + ' ' + (reqBodyText || '')
    const matches = text.match(/\{\{(\d+)\}\}/g) || []
    const uniqueVars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].sort((a,b) => Number(a) - Number(b))
    
    setReqVariables(prev => {
      return uniqueVars.map(varNum => {
        const existing = prev.find(v => String(v.key) === String(varNum))
        return existing || { key: String(varNum), value: '' }
      })
    })
  }, [reqHeaderText, reqBodyText])

  function handleReqVarChange(index, val) {
    const updated = [...reqVariables]
    updated[index].value = val
    setReqVariables(updated)
  }

  async function handleRequestTemplate() {
    if (!reqName.trim() || !reqBodyText.trim()) {
      toast.error('Template name and body text are required')
      return
    }
    setSubmittingRequest(true)
    try {
      const { data } = await templatesApi.create({
        name: reqName.trim(),
        category: reqCategory,
        language: reqLanguage,
        bodyText: reqBodyText,
        headerText: reqHeaderText,
        footerText: reqFooterText,
        variables: reqVariables
      })
      if (data.success) {
        toast.success(data.message || 'Template verification request submitted!')
        setShowRequestModal(false)
        setReqName('')
        setReqCategory('MARKETING')
        setReqLanguage('en')
        setReqHeaderText('')
        setReqBodyText('')
        setReqFooterText('')
        setReqVariables([])
        load()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit template request')
    } finally {
      setSubmittingRequest(false)
    }
  }

  function getTemplateVariables(t) {
    const text = (t.headerText || '') + ' ' + (t.bodyPreview || '')
    const matches = text.match(/\{\{(\d+)\}\}/g) || []
    const uniqueVars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].sort((a,b) => Number(a) - Number(b))
    
    const currentParams = t.sampleParams ? [...t.sampleParams] : []
    const variables = uniqueVars.map(varNum => {
      const existing = currentParams.find(p => String(p.key) === String(varNum))
      return existing || { key: String(varNum), value: '' }
    })

    if (t.headerType === 'IMAGE') {
      const existingHeader = currentParams.find(p => p.key === 'header_image')
      variables.unshift(existingHeader || { key: 'header_image', value: '' })
    }

    return variables;
  }

  function openEditVars(t) {
    setEditingTemplate(t)
    setEditVariables(getTemplateVariables(t))
  }

  function handleVarChange(index, val) {
    const updated = [...editVariables]
    updated[index].value = val
    setEditVariables(updated)
  }

  async function saveVariables() {
    if (!editingTemplate) return
    setSavingVars(true)
    try {
      const { data } = await templatesApi.update(editingTemplate._id, { sampleParams: editVariables })
      if (data.success) {
        toast.success('Variables updated successfully')
        setEditingTemplate(null)
        load()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update variables')
    } finally {
      setSavingVars(false)
    }
  }

  async function load() {
    setLoading(true)
    try {
      const { data } = await templatesApi.list()
      if (data.success) setList(data.data.templates || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const preview = list.find((t) => t._id === previewId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">My Templates</h1>
          <p className="text-sm text-slate-400">
            Templates approved for your account by your admin
          </p>
        </div>
        <Button onClick={() => setShowRequestModal(true)} className="bg-[#25D366] text-black font-extrabold text-sm hover:opacity-90 flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition shadow-lg shadow-[#25D366]/20">
          Request Template Verification
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className={preview ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <Card className="overflow-x-auto">
            {loading ? (
              <Loader />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Template Name</TH>
                    <TH>Meta Template</TH>
                    <TH>Language</TH>
                    <TH>Variables</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {list.map((t) => {
                    const vars = getTemplateVariables(t)
                    return (
                    <TR key={t._id} className="hover:bg-slate-800/50 transition">
                      <TD className="font-medium text-slate-100">{t.name}</TD>
                      <TD>
                        <span className="font-mono text-xs text-[#25D366] bg-slate-900/60 px-2 py-1 rounded inline-block">
                          {t.whatsappTemplateName}
                        </span>
                      </TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                          {t.languageCode || 'en'}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Code2 className="h-3.5 w-3.5 text-slate-500" />
                          {vars.length > 0 ? `${vars.length} Params` : 'None'}
                        </span>
                      </TD>
                      <TD>
                        <MetaStatusBadge status={t.metaStatus || 'DRAFT'} />
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={vars.length === 0}
                            onClick={() => openEditVars(t)}
                            title={vars.length === 0 ? "This template has no variables" : "Edit Variables"}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Variables
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={previewId === t._id ? 'primary' : 'ghost'}
                            onClick={() => setPreviewId(previewId === t._id ? null : t._id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-2.5 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                            disabled={deletingId === t._id}
                            onClick={() => handleDeleteTemplate(t._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  )})}
                  {!list.length && (
                    <TR>
                      <TD colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-10 w-10 text-slate-700" />
                          <span className="text-sm">No templates assigned yet.</span>
                          <span className="text-xs text-slate-600">
                            Your admin will assign approved WhatsApp templates to your account.
                          </span>
                        </div>
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            )}
          </Card>
        </div>

        {preview && (
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-400">WhatsApp Preview</span>
                <button
                  onClick={() => setPreviewId(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Close
                </button>
              </div>
              <TemplatePreview
                name={preview.name}
                bodyPreview={preview.bodyPreview}
                languageCode={preview.languageCode}
                whatsappTemplateName={preview.whatsappTemplateName}
              />
            </div>
          </div>
        )}
      </div>
      {/* Modal for editing variables */}
      <Modal
        open={!!editingTemplate}
        title={`Edit Variables: ${editingTemplate?.name}`}
        onClose={() => setEditingTemplate(null)}
        footer={
          <ModalActions
            onCancel={() => setEditingTemplate(null)}
            onConfirm={saveVariables}
            loading={savingVars}
            confirmLabel="Save Variables"
          />
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Set default values for template variables. These will be used when sending campaigns if not overridden.
          </p>
          {editVariables.length === 0 ? (
            <div className="rounded-lg bg-slate-800/50 p-4 text-center text-sm text-slate-400 border border-slate-700">
              This template does not contain any variables.
            </div>
          ) : (
            editVariables.map((v, i) => (
              <Input
                key={i}
                label={v.key === 'header_image' ? 'Header Image URL (link)' : `Variable {{${v.key}}}`}
                value={v.value}
                onChange={(e) => handleVarChange(i, e.target.value)}
                placeholder={v.key === 'header_image' ? 'e.g. https://domain.com/banner.png' : 'e.g. name, fallback text'}
              />
            ))
          )}
        </div>
      </Modal>

      {/* Modal for requesting new template verification */}
      <Modal
        open={showRequestModal}
        title="Request Template Verification"
        onClose={() => setShowRequestModal(false)}
        footer={
          <ModalActions
            onCancel={() => setShowRequestModal(false)}
            onConfirm={handleRequestTemplate}
            loading={submittingRequest}
            confirmLabel="Submit Request"
          />
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Design your WhatsApp message template. This will be sent as a draft request to your Admin for review and Meta approval.
          </p>
          <Input
            label="Template Name"
            value={reqName}
            onChange={(e) => setReqName(e.target.value)}
            placeholder="e.g. welcome_offer_october"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value)}
                className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
              <select
                value={reqLanguage}
                onChange={(e) => setReqLanguage(e.target.value)}
                className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
          </div>
          <Input
            label="Header Text (Optional)"
            value={reqHeaderText}
            onChange={(e) => setReqHeaderText(e.target.value)}
            placeholder="e.g. Special Offer!"
          />
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Body Text (Required)</label>
            <textarea
              rows={4}
              value={reqBodyText}
              onChange={(e) => setReqBodyText(e.target.value)}
              className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="e.g. Hello {{1}}, get {{2}}% off on your first order. Use code {{3}}."
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Use <code className="text-amber-400 font-mono">{"{{1}}"}</code>, <code className="text-amber-400 font-mono">{"{{2}}"}</code> for dynamic placeholders.
            </p>
          </div>
          <Input
            label="Footer Text (Optional)"
            value={reqFooterText}
            onChange={(e) => setReqFooterText(e.target.value)}
            placeholder="e.g. Valid until Oct 31."
          />

          {/* Dynamic Sample Parameters Inputs */}
          {reqVariables.length > 0 && (
            <div className="space-y-3 border-t border-[#1E293B] pt-4">
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider">Provide Sample Parameter Values</label>
              <p className="text-[11px] text-slate-500 mb-2">Sample values are required by Meta to verify how your message will look.</p>
              {reqVariables.map((v, i) => (
                <Input
                  key={i}
                  label={`Sample value for {{${v.key}}}`}
                  value={v.value}
                  onChange={(e) => handleReqVarChange(i, e.target.value)}
                  placeholder={`e.g. Sample data for variable ${v.key}`}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
