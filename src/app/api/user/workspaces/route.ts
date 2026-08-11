import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()

    const memberships = await db.member.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: { members: true, qrCodes: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const workspaces = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      memberCount: m.organization._count.members,
      qrCount: m.organization._count.qrCodes,
      isCurrent: m.organization.id === orgId,
    }))

    return NextResponse.json({ success: true, data: workspaces })
  } catch (error) {
    console.error('GET /api/user/workspaces Error:', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getCurrentUserAndOrg()
    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user belongs to this organization
    const membership = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: { organization: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: membership.organization.id,
        name: membership.organization.name,
        role: membership.role,
      },
    })

    // Set active workspace cookie (valid for 30 days)
    response.cookies.set('dynoqr_active_org_id', organizationId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false, // accessible to client if needed
    })

    return response
  } catch (error) {
    console.error('POST /api/user/workspaces Error:', error)
    return NextResponse.json({ error: 'Failed to switch workspace' }, { status: 500 })
  }
}
