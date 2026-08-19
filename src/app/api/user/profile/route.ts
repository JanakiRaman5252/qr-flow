import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { db } from '@/lib/db'
import { isSuperAdminEmail } from '@/lib/is-super-admin'
import { z } from 'zod'

export async function GET() {
  try {
    const { userId, orgId, organization } = await getCurrentUserAndOrg()

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription = await db.subscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true },
    })

    const isSuperAdmin = isSuperAdminEmail(user.email)

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        plan: subscription?.plan?.name || 'Starter',
        isSuperAdmin,
      },
    })
  } catch (err) {
    console.error('GET /api/user/profile error:', err)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().or(z.literal('')).optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data', details: parsed.error.flatten() }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (err) {
    console.error('PATCH /api/user/profile error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
