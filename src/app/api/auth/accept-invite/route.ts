import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, organizationId } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = (name || cleanEmail.split('@')[0]).trim()

    // Find existing user if any
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: {
        accounts: true,
        memberships: true,
      },
    })

    const hasCredentialAccount = !!existingUser?.accounts?.some(
      (a) => a.providerId === 'credential' && !!a.password
    )

    let sessionToken: string | null = null
    let targetUserId = existingUser?.id

    // CASE 1: User already has a password set (Existing user signing in)
    if (hasCredentialAccount) {
      try {
        const signinRes = await auth.api.signInEmail({
          body: {
            email: cleanEmail,
            password,
          },
        })
        sessionToken = signinRes?.token || null
      } catch (err: any) {
        return NextResponse.json(
          { error: 'Incorrect password. If you forgot your password, please reset it.' },
          { status: 401 }
        )
      }
    } else {
      // CASE 2: New invited user (no password set yet)
      // Save existing memberships before resetting placeholder
      const existingMemberships = existingUser?.memberships || []
      const savedRoles = existingMemberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role,
      }))

      if (existingUser) {
        // Remove placeholder records to allow Better Auth signUpEmail to create the canonical user & credential account
        await db.member.deleteMany({ where: { userId: existingUser.id } })
        await db.account.deleteMany({ where: { userId: existingUser.id } })
        await db.session.deleteMany({ where: { userId: existingUser.id } })
        await db.user.delete({ where: { id: existingUser.id } })
      }

      // Create user + credential account via Better Auth
      const signupRes = await auth.api.signUpEmail({
        body: {
          name: cleanName,
          email: cleanEmail,
          password,
        },
      })

      sessionToken = signupRes?.token || null
      targetUserId = signupRes?.user?.id

      // Re-create / Ensure memberships for this user
      if (organizationId && targetUserId) {
        const matchingRole = savedRoles.find((r) => r.organizationId === organizationId)?.role || 'EDITOR'
        await db.member.upsert({
          where: {
            userId_organizationId: {
              userId: targetUserId,
              organizationId,
            },
          },
          update: { role: matchingRole },
          create: {
            userId: targetUserId,
            organizationId,
            role: matchingRole,
          },
        })
      }

      // Restore any other memberships if existed
      for (const saved of savedRoles) {
        if (saved.organizationId !== organizationId && targetUserId) {
          await db.member.upsert({
            where: {
              userId_organizationId: {
                userId: targetUserId,
                organizationId: saved.organizationId,
              },
            },
            update: { role: saved.role },
            create: {
              userId: targetUserId,
              organizationId: saved.organizationId,
              role: saved.role,
            },
          })
        }
      }

      // Mark user email as verified since they arrived via an authenticated email invite
      if (targetUserId) {
        await db.user.update({
          where: { id: targetUserId },
          data: { emailVerified: true },
        }).catch(() => {})
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account setup complete! Redirecting to dashboard...',
    })

    // Set Better Auth session cookie
    if (sessionToken) {
      const isProduction = process.env.NODE_ENV === 'production'
      const cookieName = isProduction ? '__Secure-better-auth.session_token' : 'better-auth.session_token'
      response.cookies.set(cookieName, sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      // Also set standard fallback cookie
      response.cookies.set('better-auth.session_token', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    // Set active workspace cookie
    if (organizationId) {
      response.cookies.set('dynoqr_active_org_id', organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      })
    }

    return response
  } catch (error) {
    console.error('POST /api/auth/accept-invite Error:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
