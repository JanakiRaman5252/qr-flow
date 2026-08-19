import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const keys = await db.aPIKey.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    // Mask API keys — only show last 8 characters
    const formatted = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: `qrf_live_${'*'.repeat(24)}${k.key.slice(-8)}`,
      scopes: k.scopes,
      createdAt: k.createdAt.toISOString().split('T')[0],
      lastUsed: k.lastUsedAt ? k.lastUsedAt.toISOString() : 'Never',
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'api_keys:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Workspace Owners and Admins can create API keys' } },
        { status: 403 }
      )
    }

    const { requireFeature } = await import('@/lib/billing/entitlements')
    await requireFeature(orgId, 'API_ACCESS', 'pro')

    const { name, scopes } = await req.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'API key name is required' } },
        { status: 400 }
      )
    }

    const randomHash = crypto.randomBytes(24).toString('hex')
    const keyString = `qrf_live_${randomHash}`

    const apiKey = await db.aPIKey.create({
      data: {
        name,
        key: keyString,
        scopes: scopes || ['qr:read', 'qr:write'],
        organizationId: orgId,
        creatorId: userId,
      },
    })

    // Return the FULL key only on creation (it can't be retrieved again)
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Only time full key is visible
        scopes: apiKey.scopes,
      },
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'api_keys:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Workspace Owners and Admins can revoke API keys' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'API key ID is required' } },
        { status: 400 }
      )
    }

    await db.aPIKey.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    return handleApiError(error)
  }
}
