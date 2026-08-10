import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authApi, adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [phoneId, setPhoneId] = useState('')
  const [token, setToken] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [saving, setSaving] = useState(false)
  const [agentId, setAgentId] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)

  async function handleGeneratePartnerSharing() {
    try {
      const res = await adminApi.generateSelfSharing()
      if (res.data.success) {
        toast.success('Partner API Keys generated successfully')
        await refreshUser()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate partner keys')
    }
  }

  async function handleRevokePartnerSharing() {
    if (!window.confirm('Are you sure you want to revoke Partner Integration access? This will break any existing connections (like Magnifi AI) immediately.')) return
    try {
      const res = await adminApi.revokeSelfSharing()
      if (res.data.success) {
        toast.success('Partner API Integration access revoked')
        await refreshUser()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke partner keys')
    }
  }

  useEffect(() => {
    if (user) {
      setPhoneId(user.whatsappPhoneNumberId || '')
      setWabaId(user.whatsappWabaId || '')
    }
  }, [user])

  useEffect(() => {
    async function fetchAgentId() {
      try {
        const { data } = await authApi.getAIAgentId()
        if (data.success && data.data?.agentId) {
          setAgentId(data.data.agentId)
        }
      } catch (err) {
        console.error('Failed to load AI Agent ID:', err)
      }
    }
    fetchAgentId()
  }, [])

  async function handleSaveAgent(e) {
    e.preventDefault()
    setSavingAgent(true)
    try {
      const { data } = await authApi.saveAIAgentId({ agentId: agentId.trim() })
      if (data.success) {
        toast.success(data.message || 'AI Agent ID saved')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save AI Agent ID')
    } finally {
      setSavingAgent(false)
    }
  }

  async function connect(e) {
    e.preventDefault()
    if (!phoneId.trim() || !token.trim()) {
      toast.error('Phone Number ID and Access Token required')
      return
    }
    setSaving(true)
    try {
      const { data } = await authApi.connectWhatsApp({
        whatsappPhoneNumberId: phoneId.trim(),
        whatsappAccessToken: token.trim(),
        whatsappWabaId: wabaId.trim(),
      })
      if (data.success) {
        toast.success(data.message || 'Connected')
        setToken('')
        await refreshUser()
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Settings</h1>
        <p className="text-sm text-slate-400">
          {user?.role === 'client' ? 'Connect Meta WhatsApp Cloud API' : 'Manage your Partner Integration keys'}
        </p>
      </div>

      <Card title="Business profile">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-[#F1F5F9]">{user?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-[#F1F5F9]">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Business</dt>
            <dd className="text-[#F1F5F9]">{user?.businessName || '—'}</dd>
          </div>
          {user?.role === 'client' && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Plan</dt>
              <dd className="text-[#25D366] capitalize">{user?.plan}</dd>
            </div>
          )}
        </dl>
      </Card>

      {user?.role === 'client' && (
        <Card title="WhatsApp Cloud API">
          {user?.whatsappPhoneNumberId && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#25D366]"></span>
              <span className="text-xs text-[#34D399]">Connected — Phone ID: {user.whatsappPhoneNumberId}</span>
            </div>
          )}
          <p className="text-xs text-slate-500 mb-4">
            Use the Phone Number ID and a valid System User or permanent token from Meta Business
            settings. Webhook callback URL must point to{' '}
            <code className="text-[#34D399]">/api/webhook</code> with your verify token.
          </p>
          <form onSubmit={connect} className="space-y-4" autoComplete="off">
            <Input
              label="Phone Number ID"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              placeholder="From Meta app"
              autoComplete="off"
              name="whatsapp_phone_id_field"
            />
            <Input
              label="Access token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Never shown again after save"
              autoComplete="new-password"
              name="whatsapp_token_field"
            />
            <div>
              <Input
                label="WhatsApp Business Account ID (WABA ID)"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="e.g. 1107299854127673"
                autoComplete="off"
                name="whatsapp_waba_id_field"
              />
              <p className="mt-1 text-xs text-slate-500">
                Meta Business Manager → WhatsApp → Settings → <span className="text-amber-400">Business Account ID</span>.
                Required for auto-syncing templates.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save connection'}
            </Button>
          </form>
        </Card>
      )}

      {user?.role === 'client' && (
        <Card title="AI Agent Status">
          {user?.aiAgentActive || agentId ? (
            <div className="flex items-center gap-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
              <span className="text-sm font-bold text-[#60A5FA]">AI Agent: Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
              <span className="text-sm font-bold text-slate-400">AI Agent: Inactive / Not Assigned</span>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Your AI Bot auto-replies are managed by your Reseller Agency / Admin. Contact support for modifications.
          </p>
        </Card>
      )}

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <Card title="Partner API Integration">
          <p className="text-xs text-slate-500 mb-4">
            Generate a Master API Integration key and access token to connect external systems like Magnifi AI.
          </p>
          {user?.apiSharing?.isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-emerald-400">Active & Enabled</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">PARTNER API KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={user.apiSharing.apiSharingKey}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none"
                    />
                    <Button type="button" onClick={() => {
                      navigator.clipboard.writeText(user.apiSharing.apiSharingKey);
                      toast.success('API Key Copied!');
                    }} className="px-2 py-1 text-xs">Copy</Button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ACCESS TOKEN</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={user.apiSharing.accessToken}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none"
                    />
                    <Button type="button" onClick={() => {
                      navigator.clipboard.writeText(user.apiSharing.accessToken);
                      toast.success('Access Token Copied!');
                    }} className="px-2 py-1 text-xs">Copy</Button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">REFERENCE KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={user.apiSharing.referenceKey}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none"
                    />
                    <Button type="button" onClick={() => {
                      navigator.clipboard.writeText(user.apiSharing.referenceKey);
                      toast.success('Reference Key Copied!');
                    }} className="px-2 py-1 text-xs">Copy</Button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Generated on: {new Date(user.apiSharing.generatedAt).toLocaleString()}
                </p>
              </div>
              <Button type="button" onClick={handleRevokePartnerSharing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition">
                Revoke Integration Access
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="text-xs text-slate-400">Not Generated / Inactive</span>
              </div>
              <Button type="button" onClick={handleGeneratePartnerSharing} className="bg-[#25D366] text-black font-bold py-2 px-4 rounded-lg text-sm transition">
                Generate Partner Keys
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
