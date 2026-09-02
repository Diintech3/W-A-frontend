import { useEffect, useState, useRef, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminApi, templatesApi } from '../../services/api'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, FileText, RefreshCw, Eye, Trash2, Zap, Check, Send, Plus, X } from 'lucide-react'

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

export default function CreateTemplate() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  
  const [client, setClient] = useState(null)

  
  const [submittingTemplate, setSubmittingTemplate] = useState(false)
  const verifyTimer = useRef(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifying, setVerifying] = useState(false)
  
  const [metaTemplates, setMetaTemplates] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en',
    bodyText: '',
    headerText: '',
    footerText: '',
    variables: [],
    wabaId: '',
    mode: 'create',
    whatsappTemplateName: '',
  })

  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    try {
      const clientRes = await adminApi.listClients()
      const foundClient = clientRes.data.data.clients.find(c => c._id === clientId)
      if (foundClient) setClient(foundClient)
    } catch (e) {
      toast.error('Failed to load client data')
    }
  }

  useEffect(() => {
    if (templateForm.mode === 'assign' && metaTemplates.length === 0) {
      fetchMetaTemplatesList()
    }
  }, [templateForm.mode])

  const fetchMetaTemplatesList = async () => {
    setLoadingMeta(true)
    try {
      const { data } = await templatesApi.metaList(clientId)
      if (data.success) {
        setMetaTemplates(data.data.templates || [])
      }
    } catch (e) {
      toast.error('Failed to load Meta templates')
    } finally {
      setLoadingMeta(false)
    }
  }

  const handleAddVariable = () => {
    setTemplateForm((f) => ({ ...f, variables: [...f.variables, { value: '' }] }))
  }

  const handleRemoveVariable = (idx) => {
    setTemplateForm((f) => ({ ...f, variables: f.variables.filter((_, i) => i !== idx) }))
  }

  const handleVariableChange = (idx, val) => {
    const updated = [...templateForm.variables]
    updated[idx] = { value: val }
    setTemplateForm((f) => ({ ...f, variables: updated }))
  }

  const handleTemplateNameChange = (val) => {
    const selectedMetaTemplate = metaTemplates.find(t => t.name === val)
    
    let autoBody = ''
    if (selectedMetaTemplate) {
      const bodyComp = (selectedMetaTemplate.components || []).find(c => c.type === 'BODY')
      autoBody = bodyComp ? bodyComp.text : ''
    }

    setTemplateForm(f => ({ 
      ...f, 
      whatsappTemplateName: val,
      ...(selectedMetaTemplate ? {
        name: selectedMetaTemplate.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        language: selectedMetaTemplate.language,
        category: selectedMetaTemplate.category,
        bodyText: autoBody
      } : {})
    }))

    setVerifyResult(null)
    clearTimeout(verifyTimer.current)
    if (!val.trim()) return
    verifyTimer.current = setTimeout(async () => {
      setVerifying(true)
      try {
        const { data } = await templatesApi.metaVerify(val.trim(), clientId)
        if (data.success) setVerifyResult(data.data)
      } catch { /* ignore */ }
      finally { setVerifying(false) }
    }, 900)
  }

  const handleSubmitTemplate = async () => {
    if (!templateForm.name.trim()) { toast.error('Template display name required'); return }
    if (templateForm.mode === 'create' && !templateForm.bodyText.trim()) { toast.error('Body text required'); return }
    if (templateForm.mode === 'assign' && !templateForm.whatsappTemplateName.trim()) { toast.error('WhatsApp template name required'); return }
    setSubmittingTemplate(true)
    try {
      let res
      if (templateForm.mode === 'create') {
        res = await templatesApi.adminCreateOnMeta(clientId, {
          name: templateForm.name,
          category: templateForm.category,
          language: templateForm.language,
          bodyText: templateForm.bodyText,
          headerText: templateForm.headerText,
          footerText: templateForm.footerText,
          variables: templateForm.variables,
          wabaId: templateForm.wabaId || undefined,
        })
      } else {
        res = await templatesApi.adminAssign(clientId, {
          name: templateForm.name,
          whatsappTemplateName: templateForm.whatsappTemplateName,
          languageCode: templateForm.language,
          bodyPreview: templateForm.bodyText,
          category: templateForm.category,
        })
      }
      if (res.data.success) {
        toast.success(res.data.message || 'Template saved!')
        navigate(`/admin/clients/${clientId}/templates`)
      } else {
        toast.error(res.data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save template')
    } finally {
      setSubmittingTemplate(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(`/admin/clients/${clientId}/templates`)} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm mb-3 font-medium transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Templates
          </button>
          <h1 className="text-2xl font-black text-[#25D366] flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#25D366]" /> 
            {templateForm.mode === 'create' ? 'Create New Template' : 'Assign Existing Template'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">For client: <strong className="text-white">{client?.name || 'Loading...'}</strong></p>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Form Section */}
          <div className="flex-1 space-y-6">
            <div className="flex p-1 bg-[#1E293B]/50 rounded-xl">
              <button
                onClick={() => setTemplateForm(f => ({ ...f, mode: 'create' }))}
                className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${templateForm.mode === 'create' ? 'bg-[#25D366] text-black shadow-lg shadow-[#25D366]/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Zap className="w-4 h-4" /> Create on Meta
              </button>
              <button
                onClick={() => setTemplateForm(f => ({ ...f, mode: 'assign' }))}
                className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${templateForm.mode === 'assign' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileText className="w-4 h-4" /> Assign Existing
              </button>
            </div>

            <div className="space-y-5">
              {templateForm.mode === 'assign' && (
                <div className="bg-slate-800/30 p-4 rounded-xl border border-blue-500/20">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp Template Name (Select from Meta) *</label>
                  
                  {loadingMeta ? (
                    <div className="text-xs text-slate-400 py-2 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Loading templates from Meta...</div>
                  ) : (
                    <select 
                      value={templateForm.whatsappTemplateName} 
                      onChange={e => handleTemplateNameChange(e.target.value)}
                      className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">-- Select a template --</option>
                      {metaTemplates.filter(t => t.status === 'APPROVED').map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                      ))}
                    </select>
                  )}

                  <div className="mt-3 min-h-[20px]">
                    {verifying && <span className="text-xs text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Checking Meta...</span>}
                    {!verifying && verifyResult && (
                      <span className={`text-xs font-bold flex items-center gap-1 ${verifyResult.found ? 'text-emerald-400' : 'text-red-400'}`}>
                        {verifyResult.found ? <><CheckCircle2 className="w-3 h-3"/> Found — Status: {verifyResult.status}</> : <><XCircle className="w-3 h-3"/> Not found on Meta</>}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Display Name *</label>
                <input type="text" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Order Confirmation" className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-2.5 text-sm text-white focus:border-[#25D366] focus:outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Category</label>
                  <select value={templateForm.category} onChange={e => setTemplateForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3 py-2.5 text-sm text-white focus:border-[#25D366] focus:outline-none appearance-none">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Language</label>
                  <select value={templateForm.language} onChange={e => setTemplateForm(f => ({ ...f, language: e.target.value }))} className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-3 py-2.5 text-sm text-white focus:border-[#25D366] focus:outline-none appearance-none">
                    <option value="en">English (en)</option>
                    <option value="en_US">English US (en_US)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="en_GB">English UK (en_GB)</option>
                  </select>
                </div>
              </div>



              {templateForm.mode === 'create' && (
                <>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Header <span className="text-slate-500 font-normal">(Optional)</span></label>
                      <input type="text" value={templateForm.headerText} onChange={e => setTemplateForm(f => ({ ...f, headerText: e.target.value }))} placeholder="Header text" className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-2.5 text-sm text-white focus:border-[#25D366] focus:outline-none" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Body Message * <span className="text-slate-500 font-normal">(Use {'{{1}}'} for variables)</span></label>
                      <textarea value={templateForm.bodyText} onChange={e => setTemplateForm(f => ({ ...f, bodyText: e.target.value }))} placeholder="Hello {{1}}, your order is confirmed." rows={4} className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-3 text-sm text-white focus:border-[#25D366] focus:outline-none resize-none" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Footer <span className="text-slate-500 font-normal">(Optional)</span></label>
                      <input type="text" value={templateForm.footerText} onChange={e => setTemplateForm(f => ({ ...f, footerText: e.target.value }))} placeholder="Footer text" className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-2.5 text-sm text-white focus:border-[#25D366] focus:outline-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-[#080E1E] rounded-xl border border-[#1E293B]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-slate-300">Variable Sample Values</label>
                      <button type="button" onClick={handleAddVariable} className="text-xs text-[#25D366] hover:text-[#22c55e] font-bold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Variable
                      </button>
                    </div>
                    <div className="space-y-2">
                      {templateForm.variables.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700">{`{{${idx + 1}}}`}</span>
                          <input type="text" value={v.value} onChange={e => handleVariableChange(idx, e.target.value)} placeholder={`Sample for {{${idx + 1}}}`} className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-sm text-white focus:border-[#25D366] focus:outline-none" />
                          <button onClick={() => handleRemoveVariable(idx)} className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                      {!templateForm.variables.length && (
                        <div className="text-xs text-slate-500 italic text-center py-2">No variables added. Click above to add sample values.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">WABA ID Override <span className="text-slate-500 font-normal">(Optional)</span></label>
                <input type="text" value={templateForm.wabaId} onChange={e => setTemplateForm(f => ({ ...f, wabaId: e.target.value }))} placeholder="Leave blank to use global ID" className="w-full rounded-xl border border-[#334155] bg-[#080E1E] px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#1E293B] flex justify-end gap-3">
              <button onClick={() => navigate(`/admin/clients/${clientId}/templates`)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitTemplate}
                disabled={submittingTemplate}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-lg ${templateForm.mode === 'create' ? 'bg-[#25D366] hover:bg-[#22c55e] text-black shadow-[#25D366]/20' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {submittingTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : (templateForm.mode === 'create' ? <Send className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
                {submittingTemplate ? 'Processing...' : (templateForm.mode === 'create' ? 'Create & Assign' : 'Assign to Client')}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="w-full lg:w-[320px] xl:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E293B] pt-6 lg:pt-0 lg:pl-8">
            <div className="sticky top-6">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" /> WhatsApp Preview
              </h3>
              <TemplatePreview 
                name={templateForm.name || 'Template Name'}
                bodyPreview={templateForm.mode === 'create' ? templateForm.bodyText || 'Your message body will appear here...' : templateForm.bodyText || 'Preview not available for assigned templates.'}
                languageCode={templateForm.language}
                whatsappTemplateName={templateForm.mode === 'create' ? templateForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : templateForm.whatsappTemplateName}
              />
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300 leading-relaxed">
                  <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Make sure your template follows Meta's guidelines. Variables must be sequential starting from {'{{1}}'}.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
