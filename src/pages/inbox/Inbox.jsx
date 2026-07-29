import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { inboxApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Loader } from '../../components/ui/Loader'
import { useSocket } from '../../hooks/useSocket'

export default function Inbox() {
  const { socket } = useSocket()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [assign, setAssign] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const { data } = await inboxApi.conversations()
      if (data.success) setConversations(data.data.conversations || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load inbox')
    } finally {
      setLoadingList(false)
    }
  }, [])

  const loadMessages = useCallback(async (id) => {
    if (!id) return
    setLoadingMsg(true)
    try {
      const { data } = await inboxApi.messages(id)
      if (data.success) {
        setMessages(data.data.messages || [])
        setAssign(data.data.conversation?.assignedAgent || '')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load thread')
    } finally {
      setLoadingMsg(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  useEffect(() => {
    if (!socket) return
    const onNew = (payload) => {
      loadList()
      if (payload?.conversationId === activeId) loadMessages(activeId)
    }
    const onUpd = () => loadList()
    socket.on('inbox:newMessage', onNew)
    socket.on('inbox:update', onUpd)
    return () => {
      socket.off('inbox:newMessage', onNew)
      socket.off('inbox:update', onUpd)
    }
  }, [socket, activeId, loadList, loadMessages])

  async function sendReply() {
    if (!activeId || !reply.trim()) return
    setSending(true)
    try {
      const { data } = await inboxApi.reply(activeId, { text: reply })
      if (data.success) {
        setReply('')
        loadMessages(activeId)
        loadList()
        toast.success('Sent')
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  async function saveAssign() {
    if (!activeId) return
    try {
      const { data } = await inboxApi.assign(activeId, { assignedAgent: assign })
      if (data.success) {
        toast.success('Assignment updated')
        loadList()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  async function toggleAi() {
    if (!activeId || !active) return
    const newState = !active.isAIPaused
    try {
      const { data } = await inboxApi.toggleAi(activeId, { isAIPaused: newState })
      if (data.success) {
        toast.success(newState ? 'AI Paused (Manual Mode)' : 'AI Resumed (Auto Mode)')
        loadList()
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Toggle failed')
    }
  }

  const active = conversations.find((c) => c._id === activeId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Inbox</h1>
        <p className="text-sm text-slate-400">Live conversations · Socket.io realtime</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr] min-h-[480px]">
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="border-b border-[#334155] px-4 py-3 text-sm font-medium text-slate-300">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <Loader label="Loading…" />
            ) : (
              conversations.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveId(c._id)}
                  className={`w-full text-left px-4 py-3 border-b border-[#334155] hover:bg-[#334155]/40 ${
                    activeId === c._id ? 'bg-[#25D366]/10' : ''
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-[#F1F5F9] truncate">
                      {c.customerName || c.customerPhone}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-[#25D366] px-2 py-0.5 text-xs text-[#0F172A]">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage}</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {c.lastMessageAt ? format(new Date(c.lastMessageAt), 'MMM d, HH:mm') : ''}
                  </p>
                </button>
              ))
            )}
            {!loadingList && !conversations.length && (
              <p className="p-4 text-sm text-slate-500">No conversations yet</p>
            )}
          </div>
        </Card>

        <Card className="!p-0 flex flex-col min-h-[480px]">
          {!activeId && (
            <div className="flex flex-1 items-center justify-center text-slate-500 text-sm p-8">
              Select a conversation
            </div>
          )}
          {activeId && (
            <>
              <div className="border-b border-[#334155] px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex-1 min-w-[150px]">
                  <div className="text-sm font-semibold text-[#F1F5F9]">
                    {active?.customerName || active?.customerPhone}
                  </div>
                  <div className="text-xs text-slate-500">{active?.customerPhone}</div>
                </div>
                <div className="flex gap-2 items-center shrink-0 flex-nowrap overflow-x-auto pb-1 max-w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={toggleAi}
                    className={`shrink-0 border-0 ${
                      active?.isAIPaused 
                        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                        : 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${active?.isAIPaused ? 'bg-rose-500' : 'bg-[#25D366]'}`} />
                      {active?.isAIPaused ? 'Manual Switch' : 'Auto Switch'}
                    </span>
                  </Button>
                  <div className="w-[140px] shrink-0">
                    <Input
                      placeholder="Assign to agent"
                      value={assign}
                      onChange={(e) => setAssign(e.target.value)}
                      className="!py-1.5"
                    />
                  </div>
                  <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={saveAssign}>
                    Assign
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F172A]/50">
                {loadingMsg ? (
                  <Loader label="Loading messages…" />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          m.direction === 'outbound'
                            ? 'bg-[#25D366]/20 text-[#F1F5F9]'
                            : 'bg-[#1E293B] text-[#F1F5F9] border border-[#334155]'
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {format(new Date(m.createdAt), 'HH:mm')} · {m.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-[#334155] p-3 flex gap-2">
                <Input
                  placeholder="Type a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
                />
                <Button type="button" onClick={sendReply} disabled={sending}>
                  Send
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
