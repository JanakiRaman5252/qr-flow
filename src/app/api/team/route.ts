import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { sendEmail } from '@/lib/email'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const members = await db.member.findMany({
      where: { organizationId: orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = members.map((m) => ({
      id: m.id,
      name: m.user.name || 'Workspace Member',
      email: m.user.email,
      role: m.role,
      status: m.user.emailVerified ? 'Active' : 'Invited',
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('GET /api/team Error:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, organization } = await getCurrentUserAndOrg()
    const { email, role } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: role || 'EDITOR',
        },
      })
    }

    // Check existing membership
    const existing = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
    }

    const member = await db.member.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role: role || 'EDITOR',
      },
      include: { user: true },
    })

    // Send invitation email via Resend
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${organization.name} on QRFlow`,
      html: `<p>Hi there,</p><p>You've been assigned the <strong>${role || 'EDITOR'}</strong> role in ${organization.name}.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Sign in to QRFlow</a></p>`,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        status: 'Invited',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/team Error:', error)
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    await db.member.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'Member removed' })
  } catch (error) {
    console.error('DELETE /api/team Error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
