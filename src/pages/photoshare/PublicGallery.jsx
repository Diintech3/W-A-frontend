import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { photoshareApi } from '../../services/api'
import {
  Camera,
  Download,
  Sparkles,
  Info,
  X,
  Search,
  Grid,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'

export default function PublicGallery() {
  const { linkCode } = useParams()
  const [folder, setFolder] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  // Selfie Matching State
  const [matchingPhotos, setMatchingPhotos] = useState(null) // null = no filter, array = matched results
  const [searching, setSearching] = useState(false)
  const [selfieFile, setSelfieFile] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState('')

  // Load Folder & Approved Photos
  async function loadGallery() {
    setLoading(true)
    try {
      const [folderRes, photosRes] = await Promise.all([
        photoshareApi.getPublicFolderDetails(linkCode),
        photoshareApi.getPublicFolderPhotos(linkCode),
      ])

      if (folderRes.data?.success) {
        setFolder(folderRes.data.data?.folder)
      }
      if (photosRes.data?.success) {
        setPhotos(photosRes.data.data?.photos || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGallery()
  }, [linkCode])

  // Handle Selfie Input Change
  function handleSelfieChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.')
      return
    }

    setSelfieFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelfiePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Submit Selfie for Matching
  async function handleSelfieSearch(e) {
    e.preventDefault()
    if (!selfieFile) return

    setSearching(true)
    const toastId = toast.loading('AI is scanning faces to match your photos. Please wait...')

    try {
      const formData = new FormData()
      formData.append('file', selfieFile)

      const res = await photoshareApi.searchPhotosBySelfie(linkCode, formData)
      if (res.data?.success) {
        const matches = res.data.data?.matches || []
        setMatchingPhotos(matches)
        toast.success(`Scan completed! Found ${matches.length} matching photos.`, { id: toastId })
      } else {
        toast.error(res.data?.message || 'Search failed', { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Face matching search failed.', { id: toastId })
    } finally {
      setSearching(false)
    }
  }

  // Clear Selfie Search filter
  function handleClearSearch() {
    setMatchingPhotos(null)
    setSelfieFile(null)
    setSelfiePreview('')
  }

  // Direct Photo Download
  async function downloadPhoto(url, filename) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || 'event-photo.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) {
      toast.error('Failed to download image. Try right-clicking and saving it.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-10 w-10 text-[#25D366] animate-spin" />
        <p className="text-slate-400 font-medium">Loading event gallery...</p>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] flex flex-col items-center justify-center p-6 text-center">
        <ImageIcon className="h-16 w-16 text-slate-700 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-slate-200">Event Gallery Not Found</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">The link is invalid or the client has removed this photoshare event.</p>
      </div>
    )
  }

  // Validate start/end times
  const now = new Date()
  const hasStarted = folder.startTime ? now >= new Date(folder.startTime) : true
  const hasEnded = folder.endTime ? now > new Date(folder.endTime) : false
  const uploadsOpen = folder.isActive && hasStarted && !hasEnded

  const displayedPhotos = matchingPhotos !== null ? matchingPhotos : photos

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] font-sans selection:bg-[#25D366] selection:text-[#090D16]">
      <Toaster position="bottom-center" />
      
      {/* BRANDING HEADER */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center border border-[#25D366]/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-200 truncate max-w-[250px] sm:max-w-xs">{folder.name}</h1>
              <p className="text-[11px] text-[#25D366] flex items-center gap-1 font-semibold">
                <Sparkles className="h-3 w-3 animate-pulse" /> Guest Photo Hub
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Folder validity alert badge */}
            {uploadsOpen ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold rounded-full">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" /> Uploads Open
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold rounded-full">
                Uploads Closed
              </span>
            )}
            
            {/* Click-to-chat instruction for uploading */}
            {uploadsOpen && (
              <a
                href={`https://wa.me/${localStorage.getItem('whatsai_bot_phone_number') || '918147540362'}?text=Upload_${folder.linkCode}`}
                className="px-4 py-1.5 bg-[#25D366] text-[#090D16] hover:bg-[#20ba59] font-bold text-xs rounded-lg shadow-lg hover:shadow-green-500/20 transition-all"
              >
                Upload via WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* TIME LIMIT INFO ALERT */}
        {folder.endTime && (
          <div className="rounded-xl border border-blue-500/10 bg-blue-950/10 p-4 flex gap-3 text-xs text-blue-300">
            <Info className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold block">Folder Time Window Restrictions:</span>
              <span className="text-slate-400 block mt-0.5">
                This event collects photos until **{new Date(folder.endTime).toLocaleString()}**. 
                After this time, uploads will automatically close, and guests can access this gallery.
              </span>
            </div>
          </div>
        )}

        {/* AI SELFIE SEARCH BOX */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> Find Your Photos using AI
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload a clear selfie, and our AI model (Gemini) will scanning the entire gallery to show only the pictures containing your face.
            </p>
          </div>

          <form onSubmit={handleSelfieSearch} className="space-y-4 max-w-md mx-auto">
            {selfiePreview ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-32 w-32 rounded-2xl border-2 border-purple-500/50 overflow-hidden relative group">
                  <img src={selfiePreview} alt="Selfie preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-2xl"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={searching}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-55"
                  >
                    {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span>{searching ? 'AI Matching...' : 'Start Face Matching Scan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2 border border-slate-700 bg-transparent hover:bg-slate-800 rounded-xl text-xs text-slate-300"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-900/20 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:bg-purple-950/20 transition-all">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="mt-3 text-xs font-semibold text-slate-200">Upload your selfie</span>
                <span className="mt-1 text-[10px] text-slate-500">Capture from front camera or pick a clear portrait</span>
              </label>
            )}
          </form>
        </section>

        {/* GALLERY SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Grid className="h-5 w-5 text-[#25D366]" /> 
              <span>{matchingPhotos !== null ? 'AI Matching Results' : 'Gallery Collection'}</span>
            </h2>
            
            {matchingPhotos !== null && (
              <button
                onClick={handleClearSearch}
                className="text-xs text-purple-400 hover:underline flex items-center gap-1"
              >
                Show All Photos ({photos.length})
              </button>
            )}
          </div>

          {displayedPhotos.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 p-16 text-center text-slate-500 bg-slate-900/10 flex flex-col items-center justify-center gap-3">
              <ImageIcon className="h-12 w-12 text-slate-700 animate-pulse" />
              <p className="text-sm font-medium">
                {matchingPhotos !== null 
                  ? 'No matching photos found containing your face.' 
                  : 'No approved event photos yet.'}
              </p>
              {matchingPhotos !== null && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-all mt-2"
                >
                  Clear search and view all
                </button>
              )}
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
              {displayedPhotos.map((photo) => (
                <div
                  key={photo._id}
                  className="break-inside-avoid relative rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] group shadow-md"
                >
                  <img
                    src={photo.photoUrl}
                    alt="Event Photo"
                    className="w-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x400?text=Image+Load+Error';
                    }}
                  />
                  
                  {/* Overlay Details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                    <div className="space-y-1">
                      {photo.senderName && (
                        <p className="text-[10px] text-slate-300 font-semibold truncate">
                          By: {photo.senderName}
                        </p>
                      )}
                      {photo.caption && (
                        <p className="text-xs text-slate-100 italic truncate max-w-full">
                          "{photo.caption}"
                        </p>
                      )}
                      <button
                        onClick={() => downloadPhoto(photo.photoUrl, `event_${photo._id}.jpg`)}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-[#090D16] text-[10px] font-bold transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="border-t border-slate-800 mt-16 py-8 bg-[#0F172A]/40 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} WhatsMarketing Photoshare (EventPics) Hub. Powered by Gemini AI.</p>
        </div>
      </footer>

    </div>
  )
}
