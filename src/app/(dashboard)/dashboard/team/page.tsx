'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
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
  Sparkles,
  HelpCircle,
  X,
  Crown,
  LogOut,
} from 'lucide-react'
import { ROLE_DEFINITIONS, type Role } from '@/lib/rbac'
import { PulseLoader } from '@/components/ui/loader'

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

interface TeamResponse {
  success?: boolean
  data?: MemberItem[]
  currentUserRole?: Role
  workspaceName?: string
  capacity?: CapacityData
  message?: string
  error?: string
}

export default function TeamManagementPage() {
  /*
   * IMPORTANT:
   * These initial values must remain deterministic.
   *
   * Do not use window, localStorage, Date.now(), Math.random(),
   * matchMedia, or viewport detection during initial render.
   */
  const [members, setMembers] = useState<MemberItem[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<Role>('VIEWER')
  const [workspaceName, setWorkspaceName] = useState('Workspace')
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

  const canManageTeam =
    currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  /*
   * Fetch team members.
   *
   * useCallback keeps the function stable and avoids unnecessary
   * effect re-registration.
   */
  const fetchMembers = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/team', {
        method: 'GET',
        cache: 'no-store',
        signal,
      })

      if (!res.ok) {
        throw new Error(`Failed to load team members (${res.status})`)
      }

      const json: TeamResponse = await res.json()

      if (!json.success) {
        throw new Error(
          json.message || json.error || 'Failed to load team members.'
        )
      }

      setMembers(Array.isArray(json.data) ? json.data : [])

      if (json.currentUserRole) {
        setCurrentUserRole(json.currentUserRole)
      }

      if (json.workspaceName) {
        setWorkspaceName(json.workspaceName)
      }

      if (json.capacity) {
        setCapacity(json.capacity)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }

      console.error('Failed to load team members:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load workspace team members.'
      )
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  /*
   * Initial data loading happens only after hydration.
   * The server and client therefore render identical initial HTML.
   */
  useEffect(() => {
    const controller = new AbortController()

    void fetchMembers(controller.signal)

    return () => {
      controller.abort()
    }
  }, [fetchMembers])

  /*
   * Invite member
   */
  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const email = inviteEmail.trim()

    if (!email) {
      setError('Please enter an email address.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMsg('')
    setLastInviteLink(null)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
        }),
      })

      const json: TeamResponse & {
        inviteLink?: string
        emailWarning?: string
      } = await res.json()

      if (!res.ok || !json.success) {
        setError(
          json.message ||
            json.error ||
            'Failed to invite team member.'
        )
        return
      }

      if (json.inviteLink) {
        setLastInviteLink(json.inviteLink)
      }

      if (json.emailWarning) {
        setSuccessMsg(
          `Member ${email} invited as ${inviteRole}. Notice: ${json.emailWarning}. You can copy the invite link below.`
        )
      } else {
        setSuccessMsg(
          `Invitation sent to ${email} with ${inviteRole} permissions.`
        )
      }

      setInviteEmail('')

      await fetchMembers()
    } catch (err) {
      console.error('Failed to invite member:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  /*
   * Resend invitation
   */
  const handleResendInvite = async (
    memberId: string,
    email: string
  ) => {
    setError('')
    setSuccessMsg('')
    setResendingId(memberId)

    try {
      const res = await fetch('/api/team/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
        }),
      })

      const json: TeamResponse & {
        inviteLink?: string
      } = await res.json()

      if (!res.ok || !json.success) {
        setError(
          json.error ||
            json.message ||
            'Failed to resend invitation.'
        )
        return
      }

      setSuccessMsg(`Invitation email resent to ${email}.`)

      if (json.inviteLink) {
        setLastInviteLink(json.inviteLink)
      }
    } catch (err) {
      console.error('Failed to resend invitation:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend invitation.'
      )
    } finally {
      setResendingId(null)
    }
  }

  /*
   * Change role
   */
  const handleRoleChange = async (
    memberId: string,
    newRole: Role
  ) => {
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: memberId,
          role: newRole,
        }),
      })

      const json: TeamResponse = await res.json()

      if (!res.ok || !json.success) {
        setError(
          json.error ||
            json.message ||
            'Failed to update member role.'
        )
        return
      }

      setSuccessMsg('Member role updated successfully.')

      await fetchMembers()
    } catch (err) {
      console.error('Failed to change role:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while updating the role.'
      )
    }
  }

  /*
   * Remove member / leave workspace
   */
  const handleDeleteMember = async (
    id: string,
    name: string,
    isSelf = false
  ) => {
    const confirmMessage = isSelf
      ? `Are you sure you want to leave ${workspaceName}?`
      : `Are you sure you want to remove ${name} from ${workspaceName}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch(
        `/api/team?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      )

      const json: TeamResponse = await res.json()

      if (!res.ok || !json.success) {
        setError(
          json.error ||
            json.message ||
            'Failed to remove member.'
        )
        return
      }

      if (isSelf) {
        setSuccessMsg('You have left the workspace.')

        /*
         * This happens only after a user interaction,
         * therefore window usage is safe.
         */
        window.location.reload()
        return
      }

      setSuccessMsg(`Removed ${name} from workspace.`)

      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.id !== id)
      )

      await fetchMembers()
    } catch (err) {
      console.error('Failed to delete member:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove member.'
      )
    }
  }

  /*
   * Copy invite link
   */
  const handleCopyInviteLink = async (
    email?: string,
    directLink?: string,
    role?: string
  ) => {
    try {
      const link =
        directLink ||
        `${window.location.origin}/accept-invite?email=${encodeURIComponent(
          email || ''
        )}&workspace=${encodeURIComponent(
          workspaceName
        )}&role=${encodeURIComponent(role || 'Member')}`

      await navigator.clipboard.writeText(link)

      setError('')
      setSuccessMsg('Invitation link copied to clipboard.')
    } catch (err) {
      console.error('Failed to copy invite link:', err)

      setError(
        'Unable to copy the invitation link. Please copy it manually.'
      )
    }
  }

  /*
   * Filter members.
   *
   * useMemo avoids recalculating unnecessarily and keeps the
   * render deterministic.
   */
  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return members.filter((member) => {
      const matchesSearch =
        !normalizedSearch ||
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch)

      const matchesRole =
        roleFilter === 'ALL' || member.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [members, search, roleFilter])

  const countByRole = useCallback(
    (role: Role) =>
      members.filter((member) => member.role === role).length,
    [members]
  )

  const ownerAdminCount =
    countByRole('OWNER') + countByRole('ADMIN')

  return (
    <main className="min-h-screen w-full max-w-full space-y-6 bg-slate-950 p-4 text-slate-50 sm:space-y-8 sm:p-6 md:p-8">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Team Workspace & RBAC
            </h1>

            <span
              className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                ROLE_DEFINITIONS[currentUserRole]?.badgeClass ||
                'border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              Your Role: {currentUserRole}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Manage team members, roles, and granular permissions for{' '}
            <span className="font-semibold text-indigo-400">
              {workspaceName}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRoleGuide(true)}
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
        >
          <HelpCircle className="h-4 w-4 text-indigo-400" />
          <span>Role Permissions Guide</span>
        </button>
      </section>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>

          {error.toLowerCase().includes('limit') && (
            <Link
              href="/dashboard/billing"
              className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-rose-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
            </Link>
          )}
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}
      {successMsg && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>

          {lastInviteLink && (
            <button
              type="button"
              onClick={() =>
                handleCopyInviteLink(
                  undefined,
                  lastInviteLink
                )
              }
              className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-600/30"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Invite Link</span>
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          CAPACITY
      ====================================================== */}
      {capacity && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex max-w-md items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Team Member Seats
                </span>

                <span className="whitespace-nowrap text-xs font-bold text-white">
                  {capacity.current}{' '}
                  {capacity.isUnlimited
                    ? 'members'
                    : `/ ${capacity.limit} seats used`}
                </span>
              </div>

              {!capacity.isUnlimited && (
                <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacity.isLimitReached
                        ? 'bg-rose-500'
                        : capacity.limit > 0 &&
                            capacity.current / capacity.limit >= 0.8
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${
                        capacity.limit > 0
                          ? Math.min(
                              100,
                              (capacity.current /
                                capacity.limit) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              )}

              <p className="text-xs leading-relaxed text-slate-400">
                {capacity.isUnlimited
                  ? 'Your plan includes unlimited team member seats.'
                  : capacity.isLimitReached
                    ? 'All seats are in use. Upgrade your plan to invite more collaborators.'
                    : `${capacity.remaining} seat${
                        capacity.remaining === 1 ? '' : 's'
                      } available on your current plan.`}
              </p>
            </div>

            {!capacity.isUnlimited && (
              <Link
                href="/dashboard/billing"
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-purple-500"
              >
                <Sparkles className="h-4 w-4" />
                <span>Upgrade Capacity</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Members
          </span>

          <span className="mt-1 block text-2xl font-extrabold text-white">
            {members.length}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>Owners & Admins</span>
          </span>

          <span className="mt-1 block text-2xl font-extrabold text-indigo-400">
            {ownerAdminCount}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Editors
          </span>

          <span className="mt-1 block text-2xl font-extrabold text-pink-400">
            {countByRole('EDITOR')}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Viewers
          </span>

          <span className="mt-1 block text-2xl font-extrabold text-cyan-400">
            {countByRole('VIEWER')}
          </span>
        </div>
      </section>

      {/* =====================================================
          INVITE MEMBER
      ====================================================== */}
      {canManageTeam ? (
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div className="w-full">
              <label
                htmlFor="invite-email"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                <UserPlus className="h-4 w-4 text-indigo-400" />
                <span>Invite Team Member</span>
              </label>

              <input
                id="invite-email"
                type="email"
                required
                autoComplete="email"
                value={inviteEmail}
                onChange={(event) =>
                  setInviteEmail(event.target.value)
                }
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="w-full">
              <label
                htmlFor="invite-role"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Assigned Role
              </label>

              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as Role)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              >
                {currentUserRole === 'OWNER' && (
                  <option value="ADMIN">
                    Admin (Full Team Control)
                  </option>
                )}

                <option value="EDITOR">
                  Editor (Create & Edit QRs)
                </option>

                <option value="VIEWER">
                  Viewer (Read-only)
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (capacity?.isLimitReached ?? false)
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>

          {capacity?.isLimitReached && (
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Your current plan has reached its team member limit.
              </span>
            </p>
          )}
        </form>
      ) : (
        <div className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

          <span>
            You have{' '}
            <strong className="text-slate-200">
              {currentUserRole}
            </strong>{' '}
            permissions. Only Workspace Owners and Admins can
            invite or manage members.
          </span>
        </div>
      )}

      {/* =====================================================
          MEMBERS
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="space-y-4 border-b border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>
                Workspace Members ({filteredMembers.length})
              </span>
            </h2>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search name or email..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 sm:w-60"
                />
              </div>

              <select
                aria-label="Filter members by role"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <TeamMembersSkeleton />
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
              <Users className="h-6 w-6 text-slate-500" />
            </div>

            <h3 className="text-sm font-semibold text-slate-300">
              No members found
            </h3>

            <p className="mt-1 max-w-sm text-xs text-slate-500">
              No members match your current search or role
              filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    User Details
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Role
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Joined / Invited
                  </th>

                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((member) => {
                  const isOwner = member.role === 'OWNER'
                  const isAdmin = member.role === 'ADMIN'

                  const canEditThisMember =
                    canManageTeam &&
                    !member.isCurrentUser &&
                    (currentUserRole === 'OWNER' ||
                      (!isOwner && !isAdmin))

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-slate-800/20"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-md">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-white">
                                {member.name}
                              </span>

                              {member.isCurrentUser && (
                                <span className="shrink-0 rounded border border-indigo-500/30 bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                                  You
                                </span>
                              )}
                            </div>

                            <span className="block max-w-[260px] truncate text-xs text-slate-500">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        {canEditThisMember ? (
                          <select
                            aria-label={`Change role for ${member.name}`}
                            value={member.role}
                            onChange={(event) =>
                              handleRoleChange(
                                member.id,
                                event.target.value as Role
                              )
                            }
                            className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500"
                          >
                            {currentUserRole === 'OWNER' && (
                              <option value="ADMIN">
                                Admin
                              </option>
                            )}

                            <option value="EDITOR">
                              Editor
                            </option>

                            <option value="VIEWER">
                              Viewer
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              ROLE_DEFINITIONS[member.role]
                                ?.badgeClass ||
                              'border-slate-700 bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isOwner && (
                              <Crown className="mr-1 h-3 w-3 text-amber-400" />
                            )}

                            {member.role}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            member.status === 'Active'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              member.status === 'Active'
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                          />

                          {member.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {member.createdAt || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status === 'Invited' &&
                            canManageTeam && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleResendInvite(
                                      member.id,
                                      member.email
                                    )
                                  }
                                  disabled={
                                    resendingId === member.id
                                  }
                                  title="Resend invitation email"
                                  aria-label={`Resend invitation to ${member.email}`}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {resendingId ===
                                  member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyInviteLink(
                                      member.email,
                                      undefined,
                                      member.role
                                    )
                                  }
                                  title="Copy invite link"
                                  aria-label={`Copy invitation link for ${member.email}`}
                                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </>
                            )}

                          {canEditThisMember && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMember(
                                  member.id,
                                  member.name
                                )
                              }
                              title="Remove member from workspace"
                              aria-label={`Remove ${member.name}`}
                              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-900/20 hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {member.isCurrentUser && !isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMember(
                                  member.id,
                                  member.name,
                                  true
                                )
                              }
                              title="Leave this workspace"
                              aria-label="Leave workspace"
                              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-900/20 hover:text-rose-400"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          ROLE GUIDE MODAL
      ====================================================== */}
      {showRoleGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-guide-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />

                <h3
                  id="role-guide-title"
                  className="text-lg font-bold text-white"
                >
                  Role-Based Access Control
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowRoleGuide(false)}
                aria-label="Close role permissions guide"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
              {(Object.keys(ROLE_DEFINITIONS) as Role[]).map(
                (role) => {
                  const definition =
                    ROLE_DEFINITIONS[role]

                  return (
                    <div
                      key={role}
                      className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${definition.badgeClass}`}
                        >
                          {definition.label}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-400">
                        {definition.description}
                      </p>

                      <ul className="space-y-1.5 text-[11px] text-slate-300">
                        {definition.permissions.map(
                          (permission, index) => (
                            <li
                              key={`${role}-${index}`}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

                              <span>{permission}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )
                }
              )}
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowRoleGuide(false)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-700"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ============================================================
   TEAM MEMBERS SKELETON

   This is intentionally rendered from deterministic state.
   No browser APIs, dates, random values, or viewport checks.
============================================================ */

function TeamMembersSkeleton() {
  return (
    <div className="py-12 flex justify-center items-center">
      <PulseLoader text="Loading Team Workspace" subtext="Fetching member roles and capacity seats" />
    </div>
  )
}

/* ============================================================
   SKELETON BLOCK
============================================================ */

function SkeletonBlock({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-lg ${className}`}
    />
  )
}