import { useEffect, useState, useRef, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi, templatesApi } from '../../services/api'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, FileText, RefreshCw, Eye, Trash2, Zap, Check, Send, Plus, X } from 'lucide-react'

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

export default function ClientTemplates() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  
  const [client, setClient] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [previewTemplateId, setPreviewTemplateId] = useState(null)
  const [submittingId, setSubmittingId] = useState(null)
  


  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientRes, templatesRes] = await Promise.all([
        adminApi.listClients(),
        templatesApi.adminListClientTemplates(clientId)
      ])
      
      const foundClient = clientRes.data.data.clients.find(c => c._id === clientId)
      if (foundClient) setClient(foundClient)
      
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data.templates || [])
      }
    } catch (e) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshAllStatus = async () => {
    setRefreshing(true)
    try {
      const { data } = await templatesApi.adminRefreshAll(clientId)
      if (data.success) {
        toast.success(data.message)
        const templatesRes = await templatesApi.adminListClientTemplates(clientId)
        setTemplates(templatesRes.data.data.templates || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return
    setDeletingId(templateId)
    try {
      const { data } = await templatesApi.adminDelete(templateId)
      if (data.success) {
        toast.success('Template deleted')
        setTemplates(t => t.filter(x => x._id !== templateId))
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitToMeta = async (templateId) => {
    if (!window.confirm('Are you sure you want to approve this template and register it on Meta Graph API?')) return
    setSubmittingId(templateId)
    try {
      const { data } = await templatesApi.adminApproveAndSubmit(templateId)
      if (data.success) {
        toast.success(data.message || 'Template successfully submitted to Meta!')
        loadData()
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      const msg = e.response?.data?.message || ''
      if (msg.includes('OAuth') || msg.includes('token') || msg.includes('access token')) {
        toast.error('Meta WhatsApp Access Token is expired or invalid in Settings. You can click the "✓ Direct Approve" button to approve locally!', { duration: 6000 })
      } else {
        toast.error(msg || 'Submission to Meta failed')
      }
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDirectApprove = async (templateId) => {
    try {
      const { data } = await templatesApi.adminDirectApprove(templateId)
      if (data.success) {
        toast.success('Template directly approved!')
        loadData()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approval failed')
    }
  }



  if (loading) return <Loader label="Loading templates..." />

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/admin/clients')} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm mb-3 font-medium transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Client Details
          </button>
          <h1 className="text-2xl font-black text-[#25D366] flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#25D366]" /> 
            Templates for {client?.name || 'Client'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage and sync WhatsApp message templates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAllStatus}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Meta Status
          </button>
          <button
            onClick={() => navigate(`/admin/clients/${clientId}/templates/new`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-extrabold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#25D366]/20"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A1122] border-b border-[#1E293B]">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Template Name</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Language</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-[#0A1122]/30">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No templates found. Click "Create Template" to get started.
                  </td>
                </tr>
              ) : (
                templates.map(tmpl => (
                  <Fragment key={tmpl._id}>
                    <tr className="bg-[#080E1E] hover:bg-[#0A1122] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            {tmpl.name}
                            {tmpl.headerType === 'IMAGE' && (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                📸 IMAGE
                              </span>
                            )}
                            {tmpl.buttons && tmpl.buttons.length > 0 && (
                              <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                                🔘 {tmpl.buttons.length} CTA
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-mono text-[#25D366] mt-0.5">{tmpl.whatsappTemplateName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-300">{tmpl.languageCode}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <MetaStatusBadge status={tmpl.metaStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tmpl.metaStatus === 'PENDING_ADMIN_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleSubmitToMeta(tmpl._id)}
                                disabled={submittingId === tmpl._id}
                                className="p-2 rounded-xl bg-[#0A1122] border border-[#1E293B] hover:border-emerald-500/30 hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-400 transition-all disabled:opacity-50"
                                title="Submit to Meta Graph API for Official Approval"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDirectApprove(tmpl._id)}
                                className="p-2 rounded-xl bg-[#0A1122] border border-[#1E293B] hover:border-blue-500/30 hover:bg-blue-500/15 text-slate-400 hover:text-blue-400 transition-all"
                                title="Direct Approve (Mark Approved Directly)"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setPreviewTemplateId(previewTemplateId === tmpl._id ? null : tmpl._id)}
                            className={`p-2 rounded-xl border transition-all ${
                              previewTemplateId === tmpl._id
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                : 'bg-[#0A1122] border-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tmpl._id)}
                            disabled={deletingId === tmpl._id}
                            className="p-2 rounded-xl bg-[#0A1122] border border-[#1E293B] hover:border-red-500/30 hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {previewTemplateId === tmpl._id && (
                      <tr className="bg-[#0A1122]">
                        <td colSpan={5} className="p-0">
                          <div className="p-6 border-l-2 border-[#25D366] bg-[#060B14]/50 animate-fadeIn overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" /> Template Preview
                              </h4>
                              <button
                                onClick={() => setPreviewTemplateId(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <TemplatePreview
                              name={tmpl.name}
                              bodyPreview={tmpl.bodyPreview}
                              languageCode={tmpl.languageCode}
                              whatsappTemplateName={tmpl.whatsappTemplateName}
                              headerType={tmpl.headerType}
                              headerText={tmpl.headerText}
                              mediaUrl={tmpl.mediaUrl}
                              footerText={tmpl.footerText}
                              buttons={tmpl.buttons}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  )
}
