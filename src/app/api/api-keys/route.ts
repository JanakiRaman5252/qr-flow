import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasPermission } from '@/lib/rbac'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const keys = await db.aPIKey.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: k.key,
      scopes: k.scopes,
      createdAt: k.createdAt.toISOString().split('T')[0],
      lastUsed: k.lastUsedAt ? k.lastUsedAt.toISOString() : 'Never',
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('GET /api/api-keys Error:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'api_keys:manage')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can create API keys' }, { status: 403 })
    }

    const { name, scopes } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    const randomHash = crypto.randomBytes(16).toString('hex')
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

    return NextResponse.json({ success: true, data: apiKey }, { status: 201 })
  } catch (error) {
    console.error('POST /api/api-keys Error:', error)
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'api_keys:manage')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can revoke API keys' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    await db.aPIKey.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    console.error('DELETE /api/api-keys Error:', error)
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
