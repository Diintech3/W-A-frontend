import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { campaignsApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { useSocket } from '../../hooks/useSocket'

export default function Campaigns() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  async function load() {
    setLoading(true)
    try {
      const { data } = await campaignsApi.list()
      if (data.success) setList(data.data.campaigns || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onProgress = () => load()
    socket.on('campaign:progress', onProgress)
    return () => socket.off('campaign:progress', onProgress)
  }, [socket])

  async function sendNow(id) {
    try {
      const { data } = await campaignsApi.send(id)
      if (data.success) toast.success(data.message || 'Sending started')
      else toast.error(data.message)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Send failed')
    }
  }

  async function remove(id) {
    if (!confirm('Delete this campaign?')) return
    try {
      const { data } = await campaignsApi.remove(id)
      if (data.success) {
        toast.success('Deleted')
        load()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Campaigns</h1>
          <p className="text-sm text-slate-400">Broadcasts and scheduled sends</p>
        </div>
        <Link to="/campaigns/new">
          <Button type="button">New campaign</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Status</TH>
                <TH>Total</TH>
                <TH>Sent</TH>
                <TH>Failed</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {list.map((c) => (
                <TR key={c._id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD>
                    <Badge variant={c.status}>{c.status}</Badge>
                  </TD>
                  <TD>{c.totalContacts}</TD>
                  <TD>{c.sent}</TD>
                  <TD>{c.failed}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <Button type="button" size="sm" onClick={() => sendNow(c._id)}>
                          Send
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="danger" onClick={() => remove(c._id)}>
                        Delete
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {!list.length && (
                <TR>
                  <TD colSpan={6} className="text-center text-slate-500">
                    No campaigns yet
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
