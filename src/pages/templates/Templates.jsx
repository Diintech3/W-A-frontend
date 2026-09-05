import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import {
  Eye,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Video,
  Phone,
  ExternalLink,
  MessageSquare,
  Plus,
} from 'lucide-react'
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
  const [reqHeaderType, setReqHeaderType] = useState('NONE') // 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  const [reqMediaUrl, setReqMediaUrl] = useState('')
  const [reqHeaderText, setReqHeaderText] = useState('')
  const [reqBodyText, setReqBodyText] = useState('')
  const [reqFooterText, setReqFooterText] = useState('')
  const [reqButtons, setReqButtons] = useState([])
  const [reqVariables, setReqVariables] = useState([])
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [uploadingReqMedia, setUploadingReqMedia] = useState(false)

  async function handleReqImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (.jpg, .png, .jpeg, .webp)')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setReqMediaUrl(localUrl)

    setUploadingReqMedia(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await templatesApi.uploadMedia(formData)
      if (res.data?.success && res.data.data?.url) {
        let uploadedUrl = res.data.data.url;
        if (uploadedUrl.includes('r2.cloudflarestorage.com')) {
          const publicBase = 'https://pub-922d0b8e92144ec8adc99d837e581709.r2.dev';
          const parts = uploadedUrl.split('/templates/');
          if (parts.length > 1) {
            uploadedUrl = `${publicBase}/templates/${parts[1]}`;
          } else {
            const anyParts = uploadedUrl.split('/yovoai/');
            if (anyParts.length > 1) uploadedUrl = `${publicBase}/${anyParts[1]}`;
          }
        }
        setReqMediaUrl(uploadedUrl)
        toast.success('Image selected and uploaded successfully!')
      }
    } catch (err) {
      console.warn('Upload fallback to local preview URL:', err)
      toast.success('Image loaded for template preview')
    } finally {
      setUploadingReqMedia(false)
    }
  }

  function handleAddButton(type) {
    if (reqButtons.length >= 3) {
      toast.error('Meta allows a maximum of 3 buttons per template');
      return;
    }
    if (type === 'PHONE_NUMBER' && reqButtons.some((b) => b.type === 'PHONE_NUMBER')) {
      toast.error('Meta allows maximum 1 Call button per template');
      return;
    }
    if (type === 'URL' && reqButtons.some((b) => b.type === 'URL')) {
      toast.error('Meta allows maximum 1 Website URL button per template');
      return;
    }
    setReqButtons([
      ...reqButtons,
      {
        type,
        text: type === 'PHONE_NUMBER' ? 'Call Us' : type === 'URL' ? 'Visit Website' : 'Quick Reply',
        phoneNumber: type === 'PHONE_NUMBER' ? '+91' : '',
        url: type === 'URL' ? 'https://' : '',
      },
    ]);
  }

  function handleRemoveButton(index) {
    setReqButtons(reqButtons.filter((_, i) => i !== index));
  }

  function handleButtonChange(index, field, value) {
    const updated = [...reqButtons];
    updated[index][field] = value;
    setReqButtons(updated);
  }

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
        headerType: reqHeaderType,
        mediaUrl: reqMediaUrl,
        headerText: reqHeaderText,
        bodyText: reqBodyText,
        footerText: reqFooterText,
        buttons: reqButtons,
        variables: reqVariables
      })
      if (data.success) {
        toast.success(data.message || 'Template verification request submitted!')
        setShowRequestModal(false)
        setReqName('')
        setReqCategory('MARKETING')
        setReqLanguage('en')
        setReqHeaderType('NONE')
        setReqMediaUrl('')
        setReqHeaderText('')
        setReqBodyText('')
        setReqFooterText('')
        setReqButtons([])
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
                      <TD className="font-medium text-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5">
                            {t.name}
                            {t.headerType === 'IMAGE' && (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                📸 IMAGE
                              </span>
                            )}
                            {t.buttons && t.buttons.length > 0 && (
                              <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                🔘 {t.buttons.length} CTA
                              </span>
                            )}
                          </span>
                        </div>
                      </TD>
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
                headerType={preview.headerType}
                headerText={preview.headerText}
                mediaUrl={preview.mediaUrl}
                footerText={preview.footerText}
                buttons={preview.buttons}
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
        title="Request WhatsApp Template Verification"
        onClose={() => setShowRequestModal(false)}
        size="3xl"
        footer={
          <ModalActions
            onCancel={() => setShowRequestModal(false)}
            onConfirm={handleRequestTemplate}
            loading={submittingRequest}
            confirmLabel="Submit to Admin for Meta Approval"
          />
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-h-[75vh] overflow-y-auto pr-1">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs text-slate-400">
              Design your WhatsApp template with Media & CTA buttons. Your Admin will submit this directly to Meta Graph API for official approval.
            </p>

            <Input
              label="Template Name *"
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              placeholder="e.g. asha_villas_festive_offer"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="MARKETING">Marketing (Offers / Promos)</option>
                  <option value="UTILITY">Utility (Updates / Alerts)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Language *</label>
                <select
                  value={reqLanguage}
                  onChange={(e) => setReqLanguage(e.target.value)}
                  className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="en_US">English US (en_US)</option>
                </select>
              </div>
            </div>

            {/* Header Type Selection */}
            <div className="space-y-2 bg-[#0A1122] p-3.5 rounded-xl border border-[#1E293B]">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Header Type (Optional Media / Graphic)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'NONE', label: 'None', icon: FileText },
                  { id: 'TEXT', label: 'Text 📝', icon: Edit2 },
                  { id: 'IMAGE', label: 'Image 📸', icon: ImageIcon },
                  { id: 'VIDEO', label: 'Video 🎥', icon: Video },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setReqHeaderType(h.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                      reqHeaderType === h.id
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {reqHeaderType === 'TEXT' && (
                <div className="pt-2">
                  <Input
                    label="Header Text"
                    value={reqHeaderText}
                    onChange={(e) => setReqHeaderText(e.target.value)}
                    placeholder="e.g. Exclusive Project Launch!"
                  />
                </div>
              )}

              {reqHeaderType === 'IMAGE' && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Sample Image / Graphic *
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{uploadingReqMedia ? 'Uploading...' : '📁 Select from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingReqMedia}
                        onChange={handleReqImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <Input
                    value={reqMediaUrl}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.includes('r2.cloudflarestorage.com')) {
                        const publicBase = 'https://pub-922d0b8e92144ec8adc99d837e581709.r2.dev';
                        const parts = val.split('/templates/');
                        if (parts.length > 1) {
                          val = `${publicBase}/templates/${parts[1]}`;
                        } else {
                          const anyParts = val.split('/yovoai/');
                          if (anyParts.length > 1) val = `${publicBase}/${anyParts[1]}`;
                        }
                      }
                      setReqMediaUrl(val);
                    }}
                    placeholder="https://yourdomain.com/banner.jpg"
                    className="bg-[#0A1122] border-[#1E293B] text-xs font-mono"
                  />

                  {/* Sample Gallery Presets */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      ✨ Or Choose from Real Estate Presets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🏡 Master Layout', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Asha+Realty+Master+Layout' },
                        { label: '🏊 3D Amenities & Pool', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Clubhouse+and+Amenities' },
                        { label: '🗺️ Expressway Map', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Location+and+Expressway+Map' },
                        { label: '📜 RERA Certificate', url: 'https://placehold.co/600x350/064e3b/ffffff?text=RERA+Approved+Legal+Docs' },
                        { label: '🎁 ₹2 Lakh Discount Voucher', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Special+Discount+Voucher' },
                        { label: '🚗 Free AC Cab Pass', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Complimentary+AC+Cab+Pass' },
                        { label: '⏳ Weekend Visit Pass', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Final+Weekend+Passes+Left' },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setReqMediaUrl(preset.url)}
                          className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                            reqMediaUrl === preset.url
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {reqHeaderType === 'VIDEO' && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-400">Sample Video URL *</label>
                  <Input
                    value={reqMediaUrl}
                    onChange={(e) => setReqMediaUrl(e.target.value)}
                    placeholder="e.g. https://yourdomain.com/walkthrough.mp4"
                  />
                </div>
              )}
            </div>

            {/* Body Text */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Body Text (Required) *
              </label>
              <textarea
                rows={4}
                value={reqBodyText}
                onChange={(e) => setReqBodyText(e.target.value)}
                className="w-full bg-[#0A1122] border border-[#1E293B] text-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition font-mono leading-relaxed"
                placeholder="e.g. Hello {{1}}, welcome to Asha Realty! Check our new luxury villas starting at ₹45 Lakhs. Would you like a free brochure?"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Use <code className="text-amber-400 font-mono">{"{{1}}"}</code>, <code className="text-amber-400 font-mono">{"{{2}}"}</code> for contact name or custom variables.
              </p>
            </div>

            {/* Footer Text */}
            <Input
              label="Footer Text (Optional)"
              value={reqFooterText}
              onChange={(e) => setReqFooterText(e.target.value)}
              placeholder="e.g. Asha Realty • RERA Approved Projects"
            />

            {/* Interactive CTA Buttons Builder */}
            <div className="space-y-3 bg-[#0A1122] p-3.5 rounded-xl border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interactive Buttons / CTA (Optional)
                  </div>
                  <div className="text-[11px] text-slate-500">Max 3 buttons (Quick Reply, Call Number, or Website URL)</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddButton('QUICK_REPLY')}
                    className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 py-1 px-2 h-auto"
                    disabled={reqButtons.length >= 3}
                  >
                    + Quick Reply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddButton('PHONE_NUMBER')}
                    className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 py-1 px-2 h-auto"
                    disabled={reqButtons.length >= 3 || reqButtons.some((b) => b.type === 'PHONE_NUMBER')}
                  >
                    + Call
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddButton('URL')}
                    className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 py-1 px-2 h-auto"
                    disabled={reqButtons.length >= 3 || reqButtons.some((b) => b.type === 'URL')}
                  >
                    + URL
                  </Button>
                </div>
              </div>

              {reqButtons.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No buttons added. Click buttons above to add Quick Replies or Call/Website actions.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reqButtons.map((btn, idx) => (
                    <div key={idx} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-800 text-slate-400 shrink-0">
                        {btn.type === 'PHONE_NUMBER' ? '📞 Call' : btn.type === 'URL' ? '🌐 URL' : '💬 Reply'}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                          placeholder="Button Text (e.g. Book Visit)"
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        {btn.type === 'PHONE_NUMBER' && (
                          <input
                            type="text"
                            value={btn.phoneNumber}
                            onChange={(e) => handleButtonChange(idx, 'phoneNumber', e.target.value)}
                            placeholder="+919876543210"
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        )}
                        {btn.type === 'URL' && (
                          <input
                            type="text"
                            value={btn.url}
                            onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                            placeholder="https://asharealty.com"
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                        title="Remove button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Sample Parameters Inputs */}
            {reqVariables.length > 0 && (
              <div className="space-y-2.5 border-t border-[#1E293B] pt-3">
                <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Sample Parameter Values (Required by Meta)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reqVariables.map((v, i) => (
                    <Input
                      key={i}
                      label={`Sample value for {{${v.key}}}`}
                      value={v.value}
                      onChange={(e) => handleReqVarChange(i, e.target.value)}
                      placeholder={`e.g. Rahul / Luxury Flat`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live WhatsApp Bubble Preview */}
          <div className="lg:col-span-5 sticky top-0 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Live Phone Preview</span>
              <span className="text-[10px] text-emerald-400 font-normal">Auto-updating</span>
            </div>
            <TemplatePreview
              name={reqName || 'Template Title'}
              bodyPreview={reqBodyText}
              languageCode={reqLanguage}
              whatsappTemplateName={reqName ? String(reqName).toLowerCase().replace(/\s+/g, '_') : 'template_preview'}
              headerType={reqHeaderType}
              headerText={reqHeaderText}
              mediaUrl={reqMediaUrl}
              footerText={reqFooterText}
              buttons={reqButtons}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
