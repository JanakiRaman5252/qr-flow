'use client'

import { useState, useEffect } from 'react'
import { X, Folder, Tag as TagIcon, Check, Loader2 } from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  color: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface QROrganizeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  qr: {
    id: string
    title: string
    destinationUrl: string
    folderId?: string | null
    tags?: Array<{ tagId: string; tag: TagItem }>
  }
}

export function QROrganizeModal({ isOpen, onClose, onSuccess, qr }: QROrganizeModalProps) {
  const [title, setTitle] = useState(qr.title)
  const [destinationUrl, setDestinationUrl] = useState(qr.destinationUrl)
  const [selectedFolderId, setSelectedFolderId] = useState<string>(qr.folderId || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    qr.tags ? qr.tags.map((t) => t.tagId) : []
  )

  const [folders, setFolders] = useState<FolderItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(qr.title)
    setDestinationUrl(qr.destinationUrl)
    setSelectedFolderId(qr.folderId || '')
    setSelectedTagIds(qr.tags ? qr.tags.map((t) => t.tagId) : [])
  }, [qr])

  useEffect(() => {
    if (!isOpen) return
    async function loadOptions() {
      try {
        setIsLoadingOptions(true)
        const [fRes, tRes] = await Promise.all([fetch('/api/folders'), fetch('/api/tags')])
        const [fJson, tJson] = await Promise.all([fRes.json(), tRes.json()])

        if (fJson.success) setFolders(fJson.data)
        if (tJson.success) setTags(tJson.data)
      } catch (err) {
        console.error('Failed to load folders/tags:', err)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    loadOptions()
  }, [isOpen])

  if (!isOpen) return null

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/qr', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: qr.id,
          title,
          destinationUrl,
          folderId: selectedFolderId || null,
          tagIds: selectedTagIds,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to update QR code')
        setIsSubmitting(false)
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to update QR code:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Organize QR Code</h2>
            <p className="text-xs text-slate-400 mt-0.5">Assign folder, modify tags, or edit target URL</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Destination URL
            </label>
            <input
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isLoadingOptions ? (
            <div className="py-6 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading folders & tags...</span>
            </div>
          ) : (
            <>
              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span>Assign Folder</span>
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Folder (Unassigned)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4 text-pink-400" />
                  <span>Select Tags</span>
                </label>
                {tags.length === 0 ? (
                  <p className="text-xs text-slate-500">No tags created yet in your workspace.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                          <span>#{tag.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
