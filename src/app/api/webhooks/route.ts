import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasPermission } from '@/lib/rbac'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const webhooks = await db.webhook.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        deliveries: {
          take: 5,
          orderBy: { deliveredAt: 'desc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: webhooks })
  } catch (error) {
    console.error('GET /api/webhooks Error:', error)
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'webhooks:manage')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can create webhooks' }, { status: 403 })
    }

    const { name, url, events } = await req.json()

    if (!name || !url) {
      return NextResponse.json({ error: 'Webhook name and URL are required' }, { status: 400 })
    }

    // Validate URL syntax
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid Webhook endpoint URL' }, { status: 400 })
    }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`

    const webhook = await db.webhook.create({
      data: {
        name,
        url,
        secret,
        events: Array.isArray(events) && events.length > 0 ? events : ['qr.scanned', 'qr.created'],
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, data: webhook }, { status: 201 })
  } catch (error) {
    console.error('POST /api/webhooks Error:', error)
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'webhooks:manage')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can update webhooks' }, { status: 403 })
    }

    const { id, isActive, events, name, url } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

    await db.webhook.updateMany({
      where: { id, organizationId: orgId },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(events !== undefined ? { events } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(url !== undefined ? { url } : {}),
      },
    })

    return NextResponse.json({ success: true, message: 'Webhook updated' })
  } catch (error) {
    console.error('PATCH /api/webhooks Error:', error)
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'webhooks:manage')) {
      return NextResponse.json({ error: 'Only Workspace Owners and Admins can delete webhooks' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

    await db.webhook.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'Webhook deleted' })
  } catch (error) {
    console.error('DELETE /api/webhooks Error:', error)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
