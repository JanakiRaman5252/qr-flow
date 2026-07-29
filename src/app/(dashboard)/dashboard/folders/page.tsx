'use client'

import { useEffect, useState } from 'react'
import { Folder, Tag, Plus, Trash2, Loader2 } from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  color: string
  qrCount: number
  createdAt: string
}

interface TagItem {
  id: string
  name: string
  color: string
  qrCount: number
}

export default function FoldersAndTagsPage() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#6366F1')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#EC4899')

  const fetchData = async () => {
    try {
      const [foldersRes, tagsRes] = await Promise.all([
        fetch('/api/folders'),
        fetch('/api/tags'),
      ])
      const [foldersJson, tagsJson] = await Promise.all([
        foldersRes.json(),
        tagsRes.json(),
      ])

      if (foldersJson.success) setFolders(foldersJson.data)
      if (tagsJson.success) setTags(tagsJson.data)
    } catch (err) {
      console.error('Failed to load folders & tags:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, color: newFolderColor }),
      })
      const json = await res.json()
      if (json.success) {
        setNewFolderName('')
        fetchData()
      }
    } catch (err) {
      console.error('Failed to create folder:', err)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      })
      const json = await res.json()
      if (json.success) {
        setNewTagName('')
        fetchData()
      }
    } catch (err) {
      console.error('Failed to create tag:', err)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return
    try {
      const res = await fetch(`/api/folders?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFolders(folders.filter((f) => f.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete folder:', err)
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return
    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setTags(tags.filter((t) => t.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete tag:', err)
    }
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Folders & Tags</h1>
        <p className="text-slate-400 text-sm mt-1">Organize your dynamic QR codes into folders and labeled tags.</p>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading folders & tags from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Folders Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-400" />
                <span>Folders</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {folders.length} Folders
              </span>
            </div>

            {/* New Folder Form */}
            <form onSubmit={handleCreateFolder} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New Folder Name..."
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="color"
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
                title="Folder Accent Color"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Folder Cards List */}
            <div className="space-y-3">
              {folders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm border border-slate-800/80 rounded-2xl">
                  No folders created yet.
                </div>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="p-3 rounded-xl shrink-0"
                        style={{ backgroundColor: `${folder.color}15`, color: folder.color, borderColor: `${folder.color}30` }}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{folder.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{folder.qrCount} QR codes · Created {folder.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-400" />
                <span>Tags</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {tags.length} Tags
              </span>
            </div>

            {/* New Tag Form */}
            <form onSubmit={handleCreateTag} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3">
              <input
                type="text"
                required
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New Tag Name..."
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
                title="Tag Color"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Tags Cloud / List */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Tags</h3>
              {tags.length === 0 ? (
                <p className="text-slate-500 text-sm">No tags created yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        borderColor: `${tag.color}35`,
                      }}
                    >
                      <span>#{tag.name}</span>
                      <span className="opacity-60 text-[10px] font-mono">({tag.qrCount})</span>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="hover:opacity-100 opacity-60 transition-opacity ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
