import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { templatesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ModalActions } from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Loader } from '../../components/ui/Loader'
import { TemplatePreview } from '../../components/shared/TemplatePreview'
import { Edit2, Trash2, Eye, Plus, Code2 } from 'lucide-react'

const emptyForm = {
  name: '',
  whatsappTemplateName: '',
  languageCode: 'en',
  bodyPreview: '',
  sampleParams: [],
}

export default function Templates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [previewId, setPreviewId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await templatesApi.list()
      if (data.success) setList(data.data.templates || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleOpenCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function handleOpenEdit(t) {
    setEditingId(t._id)
    const existingParams = (t.sampleParams || []).map((p, idx) => ({
      key: p.key || p.parameter_name || String(idx + 1),
      value: p.value ?? p.text ?? (typeof p === 'string' ? p : ''),
    }))
    setForm({
      name: t.name || '',
      whatsappTemplateName: t.whatsappTemplateName || '',
      languageCode: t.languageCode || 'en',
      bodyPreview: t.bodyPreview || '',
      sampleParams: existingParams,
    })
    setOpen(true)
  }

  function handleAddParam() {
    const nextIdx = form.sampleParams.length + 1
    setForm({
      ...form,
      sampleParams: [...form.sampleParams, { key: String(nextIdx), value: '' }],
    })
  }

  function handleRemoveParam(idx) {
    const updated = form.sampleParams.filter((_, i) => i !== idx)
    setForm({ ...form, sampleParams: updated })
  }

  function handleParamChange(idx, field, val) {
    const updated = [...form.sampleParams]
    updated[idx] = { ...updated[idx], [field]: val }
    setForm({ ...form, sampleParams: updated })
  }

  async function save() {
    if (!form.name.trim() || !form.whatsappTemplateName.trim()) {
      toast.error('Display Name and WhatsApp Template Name are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        whatsappTemplateName: form.whatsappTemplateName.trim(),
        languageCode: (form.languageCode || 'en').trim(),
        bodyPreview: form.bodyPreview,
        sampleParams: form.sampleParams.filter((p) => p.value !== ''),
      }

      let res
      if (editingId) {
        res = await templatesApi.update(editingId, payload)
      } else {
        res = await templatesApi.create(payload)
      }

      if (res.data.success) {
        toast.success(editingId ? 'Template updated' : 'Template created')
        setOpen(false)
        setForm(emptyForm)
        setEditingId(null)
        load()
      } else {
        toast.error(res.data.message)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      const { data } = await templatesApi.remove(id)
      if (data.success) {
        toast.success('Template deleted')
        if (previewId === id) setPreviewId(null)
        load()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  const preview = list.find((t) => t._id === previewId)

  return (
    <div className="space-[#0F172A] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Templates Library</h1>
          <p className="text-sm text-slate-400">
            Map Meta-approved WhatsApp templates and manage sample parameter values for campaigns
          </p>
        </div>
        <Button type="button" onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Template
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className={preview ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <Card className="overflow-x-auto">
            {loading ? (
              <Loader />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Display Name</TH>
                    <TH>Meta Template Name</TH>
                    <TH>Lang Code</TH>
                    <TH>Variables</TH>
                    <TH className="text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {list.map((t) => {
                    const paramCount = t.sampleParams?.length || 0
                    return (
                      <TR key={t._id} className="hover:bg-slate-800/50 transition">
                        <TD className="font-medium text-slate-100">{t.name}</TD>
                        <TD className="font-mono text-xs text-[#25D366] bg-slate-900/60 px-2 py-1 rounded inline-block">
                          {t.whatsappTemplateName}
                        </TD>
                        <TD>
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                            {t.languageCode || 'en'}
                          </span>
                        </TD>
                        <TD>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Code2 className="h-3.5 w-3.5 text-slate-500" />
                            {paramCount > 0 ? `${paramCount} Params` : 'None'}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant={previewId === t._id ? 'primary' : 'ghost'}
                              onClick={() => setPreviewId(previewId === t._id ? null : t._id)}
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenEdit(t)}
                              title="Edit Template"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1 text-amber-400" /> Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => remove(t._id)}
                              title="Delete Template"
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
                      <TD colSpan={5} className="text-center py-8 text-slate-500">
                        No templates mapped yet. Click "Add Template" to get started.
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

      <Modal
        open={open}
        title={editingId ? 'Edit Template' : 'New Template'}
        onClose={() => setOpen(false)}
        footer={
          <ModalActions
            loading={saving}
            onCancel={() => setOpen(false)}
            onConfirm={save}
            confirmText={editingId ? 'Update Template' : 'Save Template'}
          />
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Display Name"
            placeholder="e.g. Order Confirmation"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <Input
              label="WhatsApp Template Name (Meta WABA Exact Name)"
              placeholder="e.g. vectorise or order_confirmation_msg"
              value={form.whatsappTemplateName}
              onChange={(e) => setForm({ ...form, whatsappTemplateName: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Must match the exact template name inside Meta WhatsApp Manager.
            </p>
          </div>

          <div>
            <Input
              label="Language Code (e.g. en, en_US, hi)"
              placeholder="en"
              value={form.languageCode}
              onChange={(e) => setForm({ ...form, languageCode: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-400">
              Match Meta language code (e.g. use <code className="text-amber-400">en</code> for English, <code className="text-amber-400">en_US</code> for English US).
            </p>
          </div>

          <label className="block w-full">
            <span className="mb-1 block text-sm font-medium text-slate-300">
              Body Message / Preview
            </span>
            <textarea
              className="w-full min-h-[90px] rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              placeholder="Hello {{1}}, your order {{2}} has been confirmed."
              value={form.bodyPreview}
              onChange={(e) => setForm({ ...form, bodyPreview: e.target.value })}
            />
          </label>

          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">
                Sample Parameters / Variables ({'{1}'}, {'{2}'}, {'{3}'})
              </span>
              <button
                type="button"
                onClick={handleAddParam}
                className="text-xs text-[#25D366] hover:underline flex items-center gap-1 font-medium"
              >
                + Add Variable Value
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Provide sample values required for template variables so Meta API sending won't fail.
            </p>

            <div className="space-y-2">
              {form.sampleParams.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1.5 rounded">
                    {`{{${idx + 1}}}`}
                  </span>
                  <input
                    type="text"
                    placeholder={`Value for {{${idx + 1}}} (e.g. Anil or ORD-101)`}
                    className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    value={p.value}
                    onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveParam(idx)}
                    className="text-red-400 hover:text-red-300 text-xs p-1"
                    title="Remove variable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!form.sampleParams.length && (
                <div className="text-xs text-slate-500 italic bg-slate-900/40 p-2.5 rounded text-center border border-dashed border-slate-800">
                  No sample parameters added. Click "+ Add Variable Value" if your template has {'{{1}}'}, {'{{2}}'}, etc.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

