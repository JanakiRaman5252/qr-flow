'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Shield,
  Users,
  CheckCircle2,
  Copy,
  Mail,
  RefreshCw,
  Sparkles,
  HelpCircle,
  X,
  Crown,
  LogOut,
  Info,
} from 'lucide-react'
import { ROLE_DEFINITIONS, type Role } from '@/lib/rbac'

interface MemberItem {
  id: string
  userId: string
  name: string
  email: string
  role: Role
  status: string
  isCurrentUser?: boolean
  createdAt?: string
}

interface CapacityData {
  current: number
  limit: number
  isUnlimited: boolean
  remaining: number
  isLimitReached: boolean
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<MemberItem[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<Role>('VIEWER')
  const [workspaceName, setWorkspaceName] = useState<string>('Workspace')
  const [capacity, setCapacity] = useState<CapacityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null)

  const [showRoleGuide, setShowRoleGuide] = useState(false)

  const canManageTeam = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team')
      const json = await res.json()
      if (json.success) {
        setMembers(json.data)
        if (json.currentUserRole) setCurrentUserRole(json.currentUserRole)
        if (json.workspaceName) setWorkspaceName(json.workspaceName)
        if (json.capacity) setCapacity(json.capacity)
      }
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
    setSuccessMsg('')
    setLastInviteLink(null)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.message || json.error || 'Failed to invite member.')
        setIsSubmitting(false)
        return
      }

      if (json.inviteLink) {
        setLastInviteLink(json.inviteLink)
      }

      if (json.emailWarning) {
        setSuccessMsg(`Member ${inviteEmail} invited as ${inviteRole}. Notice: ${json.emailWarning}. You can copy the invite link below.`)
      } else {
        setSuccessMsg(`Invitation sent to ${inviteEmail} with ${inviteRole} permissions!`)
      }
      setInviteEmail('')
      fetchMembers()
    } catch (err) {
      console.error('Failed to invite member:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendInvite = async (memberId: string, email: string) => {
    setError('')
    setSuccessMsg('')
    setResendingId(memberId)
    try {
      const res = await fetch('/api/team/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(`Invitation email resent to ${email}!`)
        if (json.inviteLink) {
          setLastInviteLink(json.inviteLink)
        }
      } else {
        setError(json.error || 'Failed to resend invitation')
      }
    } catch (err) {
      setError('Failed to resend invitation')
    } finally {
      setResendingId(null)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, role: newRole }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to update member role')
        return
      }
      setSuccessMsg('Member role updated successfully')
      fetchMembers()
    } catch (err) {
      console.error('Failed to change role:', err)
      setError('An error occurred while updating role.')
    }
  }

  const handleDeleteMember = async (id: string, name: string, isSelf = false) => {
    const confirmMessage = isSelf
      ? `Are you sure you want to leave ${workspaceName}?`
      : `Are you sure you want to remove ${name} from ${workspaceName}?`

    if (!confirm(confirmMessage)) return

    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to remove member')
        return
      }
      setSuccessMsg(isSelf ? 'You have left the workspace' : `Removed ${name} from workspace`)
      if (isSelf) {
        window.location.reload()
      } else {
        setMembers(members.filter((m) => m.id !== id))
        fetchMembers()
      }
    } catch (err) {
      console.error('Failed to delete member:', err)
      setError('Failed to remove member.')
    }
  }

  const handleCopyInviteLink = (email?: string, directLink?: string, role?: string) => {
    const link =
      directLink ||
      `${window.location.origin}/accept-invite?email=${encodeURIComponent(email || '')}&workspace=${encodeURIComponent(workspaceName)}&role=${encodeURIComponent(role || 'Member')}`
    navigator.clipboard.writeText(link)
    setSuccessMsg('Invitation link copied to clipboard!')
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  const countByRole = (r: Role) => members.filter((m) => m.role === r).length

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Team Workspace & RBAC</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_DEFINITIONS[currentUserRole]?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
              Your Role: {currentUserRole}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage team members, roles, and granular permissions for <span className="text-indigo-400 font-semibold">{workspaceName}</span>.
          </p>
        </div>

        <button
          onClick={() => setShowRoleGuide(true)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Role Permissions Guide</span>
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes('limit') && (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </Link>
          )}
        </div>
      )}

      {successMsg && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {lastInviteLink && (
            <button
              onClick={() => handleCopyInviteLink(undefined, lastInviteLink)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Invite Link</span>
            </button>
          )}
        </div>
      )}

      {/* Team Member Seat Capacity Card */}
      {capacity && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between max-w-md">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Member Seats</span>
              <span className="text-xs font-bold text-white">
                {capacity.current} {capacity.isUnlimited ? 'members' : `/ ${capacity.limit} seats used`}
              </span>
            </div>

            {!capacity.isUnlimited && (
              <div className="w-full max-w-md h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    capacity.isLimitReached
                      ? 'bg-rose-500'
                      : capacity.current / capacity.limit >= 0.8
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (capacity.current / capacity.limit) * 100)}%` }}
                />
              </div>
            )}

            <p className="text-xs text-slate-400">
              {capacity.isUnlimited
                ? 'Your plan includes unlimited team member seats.'
                : capacity.isLimitReached
                  ? 'All seats are in use. Upgrade your plan to invite more collaborators.'
                  : `${capacity.remaining} seat${capacity.remaining === 1 ? '' : 's'} available on your current plan.`}
            </p>
          </div>

          {!capacity.isUnlimited && (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 shrink-0 self-start md:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade Capacity</span>
            </Link>
          )}
        </div>
      )}

      {/* Workspace Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Members</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{members.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Owners & Admins</span>
          </span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
            {countByRole('OWNER') + countByRole('ADMIN')}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Editors</span>
          <span className="text-2xl font-extrabold text-pink-400 mt-1 block">{countByRole('EDITOR')}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Viewers</span>
          <span className="text-2xl font-extrabold text-cyan-400 mt-1 block">{countByRole('VIEWER')}</span>
        </div>
      </div>

      {/* Invite Member Box (Visible to Owner & Admin) */}
      {canManageTeam ? (
        <form onSubmit={handleInvite} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Invite Team Member</span>
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="w-full md:w-56">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Assigned Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currentUserRole === 'OWNER' && <option value="ADMIN">Admin (Full Team Control)</option>}
              <option value="EDITOR">Editor (Create & Edit QRs)</option>
              <option value="VIEWER">Viewer (Read-only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (capacity?.isLimitReached ?? false)}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
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
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            You have <strong>{currentUserRole}</strong> permissions. Only Workspace Owners and Admins can invite or manage members.
          </span>
        </div>
      )}

      {/* Member Table & Search Controls */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Workspace Members ({filteredMembers.length})</span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading workspace team members...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No members matching your search or role filter.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User Details</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined / Invited</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMembers.map((m) => {
                    const isOwner = m.role === 'OWNER'
                    const isAdmin = m.role === 'ADMIN'
                    const canEditThisMember =
                      canManageTeam &&
                      !m.isCurrentUser &&
                      (currentUserRole === 'OWNER' || (!isOwner && !isAdmin))

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{m.name}</span>
                                {m.isCurrentUser && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block">{m.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Column with Editable Select */}
                        <td className="px-4 py-3.5">
                          {canEditThisMember ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {currentUserRole === 'OWNER' && <option value="ADMIN">Admin</option>}
                              <option value="EDITOR">Editor</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_DEFINITIONS[m.role]?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
                              {isOwner && <Crown className="w-3 h-3 mr-1 text-amber-400" />}
                              {m.role}
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium inline-flex items-center gap-1.5 ${
                            m.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {m.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-xs text-slate-400">
                          {m.createdAt || '—'}
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Resend / Copy link for pending invitations */}
                            {m.status === 'Invited' && canManageTeam && (
                              <>
                                <button
                                  onClick={() => handleResendInvite(m.id, m.email)}
                                  disabled={resendingId === m.id}
                                  title="Resend invitation email"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors text-xs"
                                >
                                  {resendingId === m.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                  ) : (
                                    <Mail className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopyInviteLink(m.email, undefined, m.role)}
                                  title="Copy invite link"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Remove Member button */}
                            {canEditThisMember && (
                              <button
                                onClick={() => handleDeleteMember(m.id, m.name)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
                                title="Remove member from workspace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Leave workspace for non-owners */}
                            {m.isCurrentUser && !isOwner && (
                              <button
                                onClick={() => handleDeleteMember(m.id, m.name, true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
                                title="Leave this workspace"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Role Permissions Guide Modal */}
      {showRoleGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Role-Based Access Control (RBAC)</h3>
              </div>
              <button
                onClick={() => setShowRoleGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(ROLE_DEFINITIONS) as Role[]).map((r) => {
                const def = ROLE_DEFINITIONS[r]
                return (
                  <div key={r} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${def.badgeClass}`}>
                        {def.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{def.description}</p>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {def.permissions.map((p, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRoleGuide(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
