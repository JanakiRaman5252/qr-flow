import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Role } from '@/lib/rbac'

export interface SessionUserAndOrg {
  userId: string
  user: any
  orgId: string
  organization: any
  role: Role
  memberId?: string
}

export async function getCurrentUserAndOrg(): Promise<SessionUserAndOrg> {
  const reqHeaders = await headers()
  const cookieStore = await cookies()

  const session = await auth.api.getSession({
    headers: reqHeaders,
  })

  const activeOrgCookie = cookieStore.get('dynoqr_active_org_id')?.value
  const activeOrgHeader = reqHeaders.get('x-organization-id')
  const requestedOrgId = activeOrgHeader || activeOrgCookie

  let user = session?.user

  // If no active session, get or create default workspace user for development
  if (!user) {
    let dbUser = await db.user.findFirst({
      include: { memberships: { include: { organization: true } } },
    })

    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          name: 'Demo Workspace Admin',
          email: 'admin@qrflow.io',
          role: 'OWNER',
          emailVerified: true,
        },
        include: { memberships: { include: { organization: true } } },
      })
    }

    let memberships = dbUser.memberships || []
    let member = memberships[0]

    if (!member || !member.organization) {
      const org = await db.organization.create({
        data: {
          name: 'Default Workspace',
          slug: `workspace-${Date.now()}`,
          members: {
            create: {
              userId: dbUser.id,
              role: 'OWNER',
            },
          },
        },
        include: { members: true },
      })
      member = {
        id: org.members[0]?.id || 'dev-member',
        userId: dbUser.id,
        organizationId: org.id,
        role: 'OWNER',
        organization: org,
      } as any
    }

    // Check if user requested a specific workspace they belong to
    if (requestedOrgId) {
      const matched = memberships.find((m) => m.organizationId === requestedOrgId)
      if (matched && matched.organization) {
        member = matched
      }
    }

    return {
      userId: dbUser.id,
      user: dbUser,
      orgId: member.organization.id,
      organization: member.organization,
      role: (member.role as Role) || 'OWNER',
      memberId: member.id,
    }
  }

  // Find all user's memberships
  const memberships = await db.member.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  // If user has no workspace yet, create a default one
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
    role: (selectedMember.role as Role) || 'MEMBER',
    memberId: selectedMember.id,
  }
}
