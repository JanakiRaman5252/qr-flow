import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ exists: false, emailVerified: false }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, emailVerified: true },
    })

    if (user) {
      return NextResponse.json({
        exists: true,
        emailVerified: user.emailVerified ?? false,
      })
    }

    return NextResponse.json({ exists: false, emailVerified: false })
  } catch (error) {
    console.error('[check-email API error]:', error)
    return NextResponse.json({ exists: false, emailVerified: false })
  }
}
