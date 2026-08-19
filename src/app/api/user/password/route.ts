import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const { currentPassword, newPassword, revokeOtherSessions } = body

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: revokeOtherSessions ?? true,
        },
        headers: req.headers,
      })

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully!',
      })
    } catch (authErr: any) {
      return NextResponse.json(
        { success: false, error: authErr?.message || 'Invalid current password.' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    console.error('POST /api/user/password error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update password.' },
      { status: 500 }
    )
  }
}
