'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Loader2, AlertCircle } from 'lucide-react'

interface MemberItem {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<MemberItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team')
      const json = await res.json()
      if (json.success) setMembers(json.data)
    } catch (err) {
      console.error('Failed to load team members:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to invite member.')
        setIsSubmitting(false)
        return
      }

      setInviteEmail('')
      fetchMembers()
    } catch (err) {
      console.error('Failed to invite member:', err)
      setError('An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setMembers(members.filter((m) => m.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete member:', err)
    }
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Team Workspace & RBAC</h1>
        <p className="text-slate-400 text-sm mt-1">Manage team access permissions, role definitions, and workspace members.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invite Member Box */}
      <form onSubmit={handleInvite} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Invite Team Member</label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Role</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Send Invitation</span>
            </>
          )}
        </button>
      </form>

      {/* Member Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Active Team Members</h2>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading team members...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-white block">{m.name}</span>
                      <span className="text-xs text-slate-500">{m.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium ${m.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
