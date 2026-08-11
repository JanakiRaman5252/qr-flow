import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')?.trim().toLowerCase()
    const orgId = searchParams.get('orgId')
    const queryWorkspaceParam = searchParams.get('workspace') || ''
    const queryRoleParam = searchParams.get('role') || ''

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        memberships: {
          include: { organization: true },
        },
      },
    })

    const hasCredentialAccount = !!user?.accounts?.some(
      (a) => a.providerId === 'credential' && !!a.password
    )

    // Find the relevant membership / workspace
    let targetMembership = user?.memberships?.[0]
    let workspaceTitle = queryWorkspaceParam || ''
    let assignedRole = queryRoleParam || ''

    if (orgId) {
      if (user?.memberships) {
        const matched = user.memberships.find((m) => m.organizationId === orgId)
        if (matched) targetMembership = matched
      }
      if (!targetMembership) {
        const org = await db.organization.findUnique({ where: { id: orgId } })
        if (org) workspaceTitle = org.name
      }
    }

    if (targetMembership?.organization?.name) {
      workspaceTitle = targetMembership.organization.name
    }
    if (targetMembership?.role) {
      assignedRole = targetMembership.role
    }

    return NextResponse.json({
      success: true,
      exists: !!user,
      hasPassword: hasCredentialAccount,
      email,
      name: user?.name || email.split('@')[0],
      workspaceName: workspaceTitle || 'Your Workspace',
      role: assignedRole || 'EDITOR',
      orgId: targetMembership?.organizationId || orgId || '',
    })
  } catch (error) {
    console.error('GET /api/auth/check-invite Error:', error)
    return NextResponse.json({ error: 'Failed to check invitation status' }, { status: 500 })
  }
}
