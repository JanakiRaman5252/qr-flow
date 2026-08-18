import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { sendEmail } from '@/lib/email'
import { requireCapacity } from '@/lib/billing/usage'
import { getLimit } from '@/lib/billing/entitlements'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { hasPermission, canManageTargetMember, type Role } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'
import crypto from 'crypto'

export async function GET() {
  try {
    const { userId, orgId, organization, role: currentUserRole } = await getCurrentUserAndOrg()

    const members = await db.member.findMany({
      where: { organizationId: orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    })

    // Get team member limit from billing
    const { limit, isUnlimited } = await getLimit(orgId, 'TEAM_MEMBER_LIMIT')
    const currentCount = members.length
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - currentCount)

    const formatted = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name || 'Workspace Member',
      email: m.user.email,
      role: m.role,
      status: m.user.emailVerified ? 'Active' : 'Invited',
      isCurrentUser: m.userId === userId,
      createdAt: m.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      currentUserRole,
      canManageTeam: hasPermission(currentUserRole, 'team:invite'),
      workspaceName: organization.name,
      capacity: {
        current: currentCount,
        limit: isUnlimited ? -1 : limit,
        isUnlimited,
        remaining: isUnlimited ? -1 : remaining,
        isLimitReached: !isUnlimited && currentCount >= limit,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, organization, role: actorRole } = await getCurrentUserAndOrg()
    const { email, role } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'A valid email address is required' } },
        { status: 400 }
      )
    }

    // 1. Check actor permissions
    if (!hasPermission(actorRole, 'team:invite')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Workspace Owners and Admins can invite team members' } },
        { status: 403 }
      )
    }

    const assignedRole: Role = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'].includes(role) ? role : 'EDITOR'

    // Admin cannot invite someone as Owner or Admin
    if (actorRole === 'ADMIN' && (assignedRole === 'OWNER' || assignedRole === 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admins can only invite members as Editors or Viewers' } },
        { status: 403 }
      )
    }

    // 2. Billing: check team member capacity quota (no hardcoded plan recommendation)
    await requireCapacity(orgId, 'TEAM_MEMBER', 1)

    const cleanEmail = email.trim().toLowerCase()

    // 3. Find or create user
    let user = await db.user.findUnique({ where: { email: cleanEmail } })

    if (!user) {
      user = await db.user.create({
        data: {
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: assignedRole,
        },
      })
    }

    // 4. Check existing membership
    const existing = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'User is already a member of this workspace' } },
        { status: 409 }
      )
    }

    const member = await db.member.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role: assignedRole,
      },
      include: { user: true },
    })

    // 5. Generate secure invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Store token in Verification table for single-use + expiry
    await db.verification.create({
      data: {
        identifier: `invite:${cleanEmail}:${orgId}`,
        value: inviteToken,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      },
    })

    // Build secure invite link (token-based, no org/role in URL)
    const inviteLink = `${appUrl}/accept-invite?token=${inviteToken}`

    // 6. Send invitation email
    let emailSent = false
    let emailWarning: string | undefined = undefined

    try {
      const emailRes = await sendEmail({
        to: cleanEmail,
        subject: `You've been invited to join ${organization.name} on QRFlow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>You're invited to join ${organization.name}!</h2>
            <p>You have been assigned the <strong>${assignedRole}</strong> role on QRFlow.</p>
            <p>Click the button below to set your password and activate your account:</p>
            <p style="margin: 25px 0;">
              <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation & Set Password
              </a>
            </p>
            <p style="color: #64748B; font-size: 12px;">This invitation expires in 48 hours.</p>
          </div>
        `,
      })
      if (emailRes.success) {
        emailSent = true
      } else {
        emailWarning = emailRes.error
      }
    } catch (emailErr: any) {
      console.warn('Failed to send invitation email:', emailErr)
      emailWarning = emailErr.message || 'Failed to dispatch email'
    }

    // 7. Audit Log
    await db.auditLog.create({
      data: {
        action: 'MEMBER_INVITED',
        entity: 'Member',
        entityId: member.id,
        organizationId: orgId,
        userId,
        metadata: {
          invitedEmail: cleanEmail,
          role: assignedRole,
        },
      },
    }).catch(() => {})

    // NOTE: inviteLink is NOT returned in the API response (P2-006 fix)
    return NextResponse.json(
      {
        success: true,
        emailSent,
        emailWarning,
        data: {
          id: member.id,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          status: 'Invited',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, orgId, role: actorRole } = await getCurrentUserAndOrg()
    const { id, role } = await req.json()

    if (!id || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Member ID and Role are required' } },
        { status: 400 }
      )
    }

    const validRoles: Role[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role specified' } },
        { status: 400 }
      )
    }

    // 1. Check actor permissions
    if (!hasPermission(actorRole, 'team:update_role')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Workspace Owners and Admins can update roles' } },
        { status: 403 }
      )
    }

    // Verify target member belongs to same org (tenant isolation)
    const targetMember = await db.member.findFirst({
      where: { id, organizationId: orgId },
      include: { user: true },
    })

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found in workspace' } },
        { status: 404 }
      )
    }

    // 2. Prevent user from modifying their own role
    if (targetMember.userId === userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'You cannot change your own role' } },
        { status: 400 }
      )
    }

    // 3. Check actor-target management rules
    const managementCheck = canManageTargetMember(actorRole, targetMember.role, role)
    if (!managementCheck.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: managementCheck.reason || 'Unauthorized to modify this member' } },
        { status: 403 }
      )
    }

    // 4. If demoting an OWNER, verify another OWNER exists
    if (targetMember.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await db.member.count({
        where: { organizationId: orgId, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Workspace must have at least one Owner' } },
          { status: 400 }
        )
      }
    }

    const updated = await db.member.update({
      where: { id },
      data: { role },
      include: { user: true },
    })

    // 5. Audit Log
    await db.auditLog.create({
      data: {
        action: 'MEMBER_ROLE_UPDATED',
        entity: 'Member',
        entityId: targetMember.id,
        organizationId: orgId,
        userId,
        metadata: {
          targetEmail: targetMember.user.email,
          previousRole: targetMember.role,
          newRole: role,
        },
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, orgId, role: actorRole } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Member ID is required' } },
        { status: 400 }
      )
    }

    // Tenant isolation: verify member belongs to org
    const targetMember = await db.member.findFirst({
      where: { id, organizationId: orgId },
      include: { user: true },
    })

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    const isSelfRemoval = targetMember.userId === userId

    // If removing someone else, check permissions
    if (!isSelfRemoval) {
      if (!hasPermission(actorRole, 'team:remove')) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only Workspace Owners and Admins can remove members' } },
          { status: 403 }
        )
      }

      const managementCheck = canManageTargetMember(actorRole, targetMember.role)
      if (!managementCheck.allowed) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: managementCheck.reason || 'Unauthorized to remove this member' } },
          { status: 403 }
        )
      }
    }

    // If target is an OWNER, ensure they are not the sole owner
    if (targetMember.role === 'OWNER') {
      const ownerCount = await db.member.count({
        where: { organizationId: orgId, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot remove the primary/sole Owner of the workspace' } },
          { status: 400 }
        )
      }
    }

    await db.member.delete({
      where: { id },
    })

    // Audit Log
    await db.auditLog.create({
      data: {
        action: isSelfRemoval ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
        entity: 'Member',
        entityId: targetMember.id,
        organizationId: orgId,
        userId,
        metadata: {
          removedEmail: targetMember.user.email,
          removedRole: targetMember.role,
        },
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: isSelfRemoval ? 'You have left the workspace' : 'Member removed from workspace',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
