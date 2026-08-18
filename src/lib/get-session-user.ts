import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Role } from '@/lib/rbac'
import { AuthenticationError } from '@/lib/errors'

export interface SessionUserAndOrg {
  userId: string
  user: any
  orgId: string
  organization: any
  role: Role
  memberId?: string
}

/**
 * Resolves the authenticated user and their active organization context.
 *
 * Security contract:
 * - No session → throws AuthenticationError (caller returns 401)
 * - Authenticated user with no org → auto-creates first workspace (onboarding)
 * - Authenticated user with org → returns org context with role
 *
 * NEVER creates demo/fallback users. NEVER grants implicit OWNER access.
 */
export async function getCurrentUserAndOrg(): Promise<SessionUserAndOrg> {
  const reqHeaders = await headers()
  const cookieStore = await cookies()

  const session = await auth.api.getSession({
    headers: reqHeaders,
  })

  // ── FAIL CLOSED: No session = 401 ──
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  const user = session.user
  const activeOrgCookie = cookieStore.get('dynoqr_active_org_id')?.value
  const activeOrgHeader = reqHeaders.get('x-organization-id')
  const requestedOrgId = activeOrgHeader || activeOrgCookie

  // Find all user's memberships
  const memberships = await db.member.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  // If user has no workspace yet, create a default one (onboarding path)
  if (memberships.length === 0) {
    const org = await db.organization.create({
      data: {
        name: `${user.name || 'My'}'s Workspace`,
        slug: `workspace-${Date.now()}`,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: { members: true },
    })

    return {
      userId: user.id,
      user,
      orgId: org.id,
      organization: org,
      role: 'OWNER',
      memberId: org.members[0]?.id,
    }
  }

  // Pick requested organization if valid membership exists, otherwise fallback to first
  let selectedMember = memberships[0]
  if (requestedOrgId) {
    const matched = memberships.find((m) => m.organizationId === requestedOrgId)
    if (matched) {
      selectedMember = matched
    }
  }

  return {
    userId: user.id,
    user,
    orgId: selectedMember.organization.id,
    organization: selectedMember.organization,
    role: (selectedMember.role as Role) || 'VIEWER',
    memberId: selectedMember.id,
  }
}
