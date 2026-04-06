import { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [phoneId, setPhoneId] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

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
        <p className="text-sm text-slate-400">Connect Meta WhatsApp Cloud API</p>
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
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Plan</dt>
            <dd className="text-[#25D366] capitalize">{user?.plan}</dd>
          </div>
        </dl>
      </Card>

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
        <form onSubmit={connect} className="space-y-4">
          <Input
            label="Phone Number ID"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="From Meta app"
          />
          <Input
            label="Access token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Never shown again after save"
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save connection'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
