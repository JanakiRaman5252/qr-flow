import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function getCurrentUserAndOrg() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

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

    let org = dbUser.memberships[0]?.organization

    if (!org) {
      org = await db.organization.create({
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
      })
    }

    return {
      userId: dbUser.id,
      user: dbUser,
      orgId: org.id,
      organization: org,
    }
  }

  // Find user's organization
  let member = await db.member.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (!member) {
    const org = await db.organization.create({
      data: {
        name: `${user.name || 'User'}'s Workspace`,
        slug: `workspace-${Date.now()}`,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    })
    return { userId: user.id, user, orgId: org.id, organization: org }
  }

  return { userId: user.id, user, orgId: member.organization.id, organization: member.organization }
}
