import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { sendEmail } from '@/lib/email'
import { hasPermission } from '@/lib/rbac'

export async function POST(req: NextRequest) {
  try {
    const { orgId, organization, role: actorRole } = await getCurrentUserAndOrg()
    const { memberId } = await req.json()

    if (!hasPermission(actorRole, 'team:invite')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can resend invitations' }, { status: 403 })
    }

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const member = await db.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const cleanEmail = member.user.email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/accept-invite?email=${encodeURIComponent(cleanEmail)}&workspace=${encodeURIComponent(organization.name)}&orgId=${orgId}&role=${member.role}`

    let emailSent = false
    let emailWarning: string | undefined = undefined

    try {
      const emailRes = await sendEmail({
        to: cleanEmail,
        subject: `Reminder: You've been invited to join ${organization.name} on QRFlow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reminder: You're invited to join ${organization.name}!</h2>
            <p>You have been assigned the <strong>${member.role}</strong> role on QRFlow.</p>
            <p>Click the button below to set your password and activate your account:</p>
            <p style="margin: 25px 0;">
              <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation & Set Password
              </a>
            </p>
            <p style="color: #64748B; font-size: 12px;">Or copy and paste this link into your browser:<br/>${inviteLink}</p>
          </div>
        `,
      })
      if (emailRes.success) {
        emailSent = true
      } else {
        emailWarning = emailRes.error
      }
    } catch (emailErr: any) {
      console.warn('Failed to resend invitation email:', emailErr)
      emailWarning = emailErr.message || 'Failed to dispatch email'
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailWarning,
      inviteLink,
      message: `Invitation resent to ${cleanEmail}`,
    })
  } catch (error) {
    console.error('POST /api/team/resend Error:', error)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}
