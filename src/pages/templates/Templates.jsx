import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { Eye, Code2, CheckCircle2, XCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'

// ─── Status badge ─────────────────────────────────────────────────────────────
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

export default function Templates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState(null)

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
                  {list.map((t) => (
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
                          {t.sampleParams?.length > 0 ? `${t.sampleParams.length} Params` : 'None'}
                        </span>
                      </TD>
                      <TD>
                        <MetaStatusBadge status={t.metaStatus || 'DRAFT'} />
                      </TD>
                      <TD className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={previewId === t._id ? 'primary' : 'ghost'}
                          onClick={() => setPreviewId(previewId === t._id ? null : t._id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                        </Button>
                      </TD>
                    </TR>
                  ))}
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
    </div>
  )
}
