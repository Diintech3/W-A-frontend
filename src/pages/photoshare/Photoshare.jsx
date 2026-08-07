import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { photoshareApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Loader } from '../../components/ui/Loader'
import { useSocket } from '../../hooks/useSocket'
import {
  FolderPlus,
  Play,
  Pause,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  Calendar,
  Clock,
  UserCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react'

export default function Photoshare() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Bot phone number (saved in local storage)
  const [botPhone, setBotPhone] = useState(() => {
    return localStorage.getItem('whatsai_bot_phone_number') || '919876543210'
  })

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folderPhotos, setFolderPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [analytics, setAnalytics] = useState(null)

  // Form State
  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  const { socket } = useSocket()

  // Load Folder List
  async function loadFolders() {
    try {
      const res = await photoshareApi.listFolders()
      if (res.data?.success) {
        setFolders(res.data.data?.folders || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  // Load Folder Photos & Analytics
  async function loadFolderDetails(id) {
    setLoadingPhotos(true)
    try {
      const [detailsRes, photosRes] = await Promise.all([
        photoshareApi.getFolderDetails(id),
        photoshareApi.getFolderPhotos(id),
      ])
      if (detailsRes.data?.success) {
        setSelectedFolder(detailsRes.data.data?.folder)
        setAnalytics(detailsRes.data.data?.analytics)
      }
      if (photosRes.data?.success) {
        setFolderPhotos(photosRes.data.data?.photos || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load photos')
    } finally {
      setLoadingPhotos(false)
    }
  }

  useEffect(() => {
    loadFolders()
  }, [])

  // Listen to real-time photo uploads via socket
  useEffect(() => {
    if (!socket) return
    const onNewPhoto = (data) => {
      // If the currently open folder is receiving the photo, prepend it
      if (selectedFolderId && String(data.folderId) === String(selectedFolderId)) {
        setFolderPhotos((prev) => [data.photo, ...prev])
        // Refresh details (analytics)
        photoshareApi.getFolderDetails(selectedFolderId).then((res) => {
          if (res.data?.success) setAnalytics(res.data.data?.analytics)
        })
      }
      // Refresh folders list to update total counts (can be optimized but simple reload works)
      loadFolders()
    }

    socket.on('photoshare:newPhoto', onNewPhoto)
    return () => socket.off('photoshare:newPhoto', onNewPhoto)
  }, [socket, selectedFolderId])

  // Save Bot Phone Number to local storage
  function handleSaveBotPhone(val) {
    const cleaned = val.replace(/\D/g, '')
    setBotPhone(cleaned)
    localStorage.setItem('whatsai_bot_phone_number', cleaned)
  }

  // Create Folder
  async function handleCreateFolder(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        isActive: form.isActive,
      }
      const res = await photoshareApi.createFolder(payload)
      if (res.data?.success) {
        toast.success(res.data?.message || 'Folder created successfully')
        setCreateModalOpen(false)
        setForm({ name: '', startTime: '', endTime: '', isActive: true })
        loadFolders()
      } else {
        toast.error(res.data?.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Active Status
  async function handleToggleActive(folder) {
    try {
      const updatedStatus = !folder.isActive
      const res = await photoshareApi.updateFolder(folder._id, { isActive: updatedStatus })
      if (res.data?.success) {
        toast.success(`Folder marked as ${updatedStatus ? 'Active' : 'Inactive'}`)
        loadFolders()
        if (selectedFolderId === folder._id) {
          setSelectedFolder((prev) => ({ ...prev, isActive: updatedStatus }))
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle folder status')
    }
  }

  // Delete Folder
  async function handleDeleteFolder(id) {
    if (!window.confirm('Are you sure you want to delete this folder? This will delete all DB entries for its photos.')) return
    try {
      const res = await photoshareApi.deleteFolder(id)
      if (res.data?.success) {
        toast.success('Folder deleted')
        loadFolders()
        if (selectedFolderId === id) {
          setSelectedFolderId(null)
          setSelectedFolder(null)
          setFolderPhotos([])
          setAnalytics(null)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete folder')
    }
  }

  // Copy click-to-chat links
  function copyToClipboard(text, msg = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text)
    toast.success(msg)
  }

  // Open Photos Viewer
  function handleSelectFolder(id) {
    setSelectedFolderId(id)
    loadFolderDetails(id)
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#25D366]" /> Photoshare (EventPics)
          </h1>
          <p className="text-sm text-slate-400">Collect event photos via WhatsApp, moderate with AI, and share public galleries.</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#25D366] text-[#0F172A] hover:bg-[#20ba59] font-bold flex items-center gap-2"
        >
          <FolderPlus className="h-5 w-5" /> New Event Folder
        </Button>
      </div>

      {/* SETTINGS CARD - BOT PHONE CONFIGURATION */}
      <Card className="p-4 bg-[#1E293B]/40 border border-[#334155]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#25D366]" /> Connected WhatsApp Bot Phone
            </h4>
            <p className="text-xs text-slate-400">Specify your WhatsApp bot phone number (e.g. `918147540362`) to build active redirect links.</p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              value={botPhone}
              onChange={(e) => handleSaveBotPhone(e.target.value)}
              placeholder="e.g. 919876543210"
              className="font-mono text-sm focus:border-[#25D366]"
            />
          </div>
        </div>
      </Card>

      {/* MAIN LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT / TOP: FOLDERS LIST */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Event Folders</h2>
          {loading ? (
            <div className="flex justify-center p-8"><Loader label="Loading folders..." /></div>
          ) : folders.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 border border-[#334155] bg-[#1E293B]/10">
              No photo collection folders found. Click "New Event Folder" to get started.
            </Card>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {folders.map((f) => {
                const isSelected = selectedFolderId === f._id
                const waLink = `https://wa.me/${botPhone}?text=Upload_${f.linkCode}`
                const galleryLink = `${window.location.origin}/gallery/${f.linkCode}`
                
                return (
                  <Card
                    key={f._id}
                    className={`p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#25D366] bg-[#1E293B]/60 shadow-[0_0_10px_rgba(37,211,102,0.15)]'
                        : 'border-[#334155] bg-[#1E293B]/20 hover:bg-[#1E293B]/40 hover:border-slate-500'
                    }`}
                    onClick={() => handleSelectFolder(f._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-2">
                        <h3 className="font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-xs">{f.name}</h3>
                        <div className="text-xs font-mono text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded inline-block">
                          {f.linkCode}
                        </div>
                      </div>
                      <Badge variant={f.isActive ? 'success' : 'neutral'}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Meta Time limits */}
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      {f.startTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Start: {new Date(f.startTime).toLocaleString()}</span>
                        </div>
                      )}
                      {f.endTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>End: {new Date(f.endTime).toLocaleString()}</span>
                        </div>
                      )}
                      {!f.startTime && !f.endTime && (
                        <div className="text-slate-500 italic">No time limits set</div>
                      )}
                    </div>

                    {/* Mini Quick Actions */}
                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#334155]" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleActive(f)}
                        title={f.isActive ? 'Deactivate Folder' : 'Activate Folder'}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          f.isActive
                            ? 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10'
                            : 'border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10'
                        }`}
                      >
                        {f.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(waLink, 'WhatsApp Redirect Link Copied!')}
                        title="Copy WhatsApp Upload Link"
                        className="p-1.5 rounded-lg border border-[#334155] text-slate-300 hover:bg-[#334155] hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(galleryLink, 'Public Gallery URL Copied!')}
                        title="Copy Public Gallery Link"
                        className="p-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(f._id)}
                        title="Delete Folder"
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-white ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: PHOTOS REVIEW PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Folder Review & Photos</h2>

          {!selectedFolderId ? (
            <Card className="p-16 text-center text-slate-500 border border-[#334155] bg-[#1E293B]/10 flex flex-col items-center justify-center gap-3">
              <Eye className="h-10 w-10 text-slate-600" />
              <span>Select an Event Folder on the left to review photos, analytics, and uploaded records.</span>
            </Card>
          ) : (
            <div className="space-y-6">
              
              {/* Folder Details Summary & Analytics */}
              {selectedFolder && (
                <div className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 bg-[#1E293B]/40 border border-[#334155] sm:col-span-1 flex flex-col justify-center">
                      <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold">Total Submissions</div>
                      <div className="mt-1 text-2xl font-bold text-[#25D366]">{analytics?.totalCount || 0}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {analytics?.approvedCount || 0} Valid | {analytics?.flaggedCount || 0} Blocked
                      </div>
                    </Card>

                    <Card className="p-4 bg-[#1E293B]/40 border border-[#334155] sm:col-span-2 flex items-center gap-3">
                      <Info className="h-6 w-6 text-[#25D366] shrink-0" />
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold block text-slate-200">How to Collect Photos:</span>
                        Guests scan the WhatsApp QR code or click the upload link. It opens WhatsApp with a prefilled message. They click send to start their photo sharing session.
                      </div>
                    </Card>
                  </div>

                  {/* Links & QR Codes Row */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* WhatsApp Upload Details */}
                    <Card className="p-4 bg-[#1E293B]/40 border border-[#334155] flex flex-col justify-between" title="1. WhatsApp Upload Link & QR">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="bg-white p-1.5 rounded-lg shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wa.me/${botPhone}?text=Upload_${selectedFolder.linkCode}`)}`}
                            alt="WhatsApp Upload QR Code"
                            className="h-28 w-28 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold">WhatsApp Link</div>
                          <div className="text-[11px] font-mono text-[#25D366] bg-slate-800/40 p-2 rounded border border-slate-700 break-all select-all">
                            {`https://wa.me/${botPhone}?text=Upload_${selectedFolder.linkCode}`}
                          </div>
                          <p className="text-[10px] text-slate-500">Scan this QR or copy this link for your campaigns.</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#334155] flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(`https://wa.me/${botPhone}?text=Upload_${selectedFolder.linkCode}`, 'WhatsApp Link Copied!')}
                          className="py-1 px-3 text-xs w-full"
                        >
                          Copy Link
                        </Button>
                      </div>
                    </Card>

                    {/* Public Gallery Web Details */}
                    <Card className="p-4 bg-[#1E293B]/40 border border-[#334155] flex flex-col justify-between" title="2. Public Web Gallery Link & QR">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="bg-white p-1.5 rounded-lg shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/gallery/${selectedFolder.linkCode}`)}`}
                            alt="Gallery QR Code"
                            className="h-28 w-28 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold">Gallery Web URL</div>
                          <div className="text-[11px] font-mono text-purple-400 bg-slate-800/40 p-2 rounded border border-slate-700 break-all select-all">
                            {`${window.location.origin}/gallery/${selectedFolder.linkCode}`}
                          </div>
                          <p className="text-[10px] text-slate-500">Scan this QR to view/download photos or scan selfie.</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#334155] flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(`${window.location.origin}/gallery/${selectedFolder.linkCode}`, 'Gallery Link Copied!')}
                          className="py-1 px-3 text-xs w-1/2 border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700"
                        >
                          Copy Link
                        </Button>
                        <a
                          href={`/gallery/${selectedFolder.linkCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs w-1/2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors font-semibold"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Visit Gallery
                        </a>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* TOP CONTRIBUTORS CAROUSEL/LIST */}
              {analytics?.contributors && analytics.contributors.length > 0 && (
                <Card className="p-4 border border-[#334155]" title="Top Guests Uploaders">
                  <div className="flex flex-wrap gap-2">
                    {analytics.contributors.map((contrib, idx) => (
                      <div
                        key={contrib._id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-xl text-xs"
                      >
                        <div className="h-5 w-5 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="font-semibold text-slate-200">
                          {contrib.name || 'Anonymous'}
                        </div>
                        <div className="text-slate-500">
                          ({contrib._id.slice(-4)})
                        </div>
                        <Badge variant="info" className="ml-1">{contrib.count} photos</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* PHOTOS GRID */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Uploaded Photos ({folderPhotos.length})</span>
                  {loadingPhotos && <span className="text-xs text-slate-500 font-normal">Refreshing...</span>}
                </h3>

                {loadingPhotos && folderPhotos.length === 0 ? (
                  <div className="flex justify-center p-12"><Loader label="Loading photos..." /></div>
                ) : folderPhotos.length === 0 ? (
                  <Card className="p-16 text-center text-slate-500 border border-[#334155] bg-[#1E293B]/10">
                    No photos uploaded yet for this event. Send the WhatsApp trigger link to guests to collect photos!
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-h-[50vh] overflow-y-auto pr-1">
                    {folderPhotos.map((photo) => (
                      <Card
                        key={photo._id}
                        className={`overflow-hidden border relative flex flex-col bg-slate-900/50 ${
                          photo.isValid ? 'border-slate-800' : 'border-red-500/40 bg-red-950/10'
                        }`}
                      >
                        {/* Image element */}
                        <div className="aspect-square bg-slate-950 relative overflow-hidden group">
                          {photo.isValid ? (
                            <img
                              src={photo.photoUrl}
                              alt={photo.senderName}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/300x300?text=Load+Error';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-red-950/20 text-red-400">
                              <Info className="h-8 w-8 mb-2" />
                              <span className="text-xs font-semibold">Flagged by AI</span>
                              <span className="text-[10px] text-slate-400 mt-1 line-clamp-3">
                                {photo.moderationReason || 'Inappropriate content'}
                              </span>
                            </div>
                          )}
                          
                          {/* Badge Status */}
                          <div className="absolute top-2 left-2">
                            <Badge variant={photo.isValid ? 'success' : 'neutral'}>
                              {photo.isValid ? 'Approved' : 'Blocked'}
                            </Badge>
                          </div>
                        </div>

                        {/* Contributor metadata details */}
                        <div className="p-3 text-xs space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-200 font-semibold truncate">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              <span>{photo.senderName || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 font-mono mt-0.5">
                              <Phone className="h-3.5 w-3.5 text-slate-500" />
                              <span>{photo.senderPhone}</span>
                            </div>
                            
                            {photo.caption && (
                              <div className="flex items-start gap-1 text-slate-300 mt-2 bg-slate-800/40 p-1.5 rounded border border-slate-700">
                                <MessageSquare className="h-3.5 w-3.5 text-[#25D366] shrink-0 mt-0.5" />
                                <span className="italic line-clamp-2">"{photo.caption}"</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-500 text-right pt-2">
                            {new Date(photo.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* CREATE FOLDER MODAL */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Event Folder">
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <Input
            label="Folder / Event Name"
            placeholder="e.g. Wedding-Rahul-Priya (Defaults to YYYY-MM-DD)"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="datetime-local"
              label="Start Time (Optional)"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            <Input
              type="datetime-local"
              label="End Time (Optional)"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-[#25D366] focus:ring-[#25D366]"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-medium text-slate-300 cursor-pointer">
              Mark as active immediately
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#25D366] text-[#0F172A] hover:bg-[#20ba59] font-bold"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
