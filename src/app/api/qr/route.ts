import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { redis } from '@/lib/redis'
import { requireCapacity } from '@/lib/billing/usage'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { dispatchWebhookEvent } from '@/lib/webhooks'
import { hasPermission } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const folderId = searchParams.get('folderId') || ''
    const tagId = searchParams.get('tagId') || ''

    const whereClause: any = {
      organizationId: orgId,
      isInTrash: false,
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { destinationUrl: { contains: search, mode: 'insensitive' } },
        { folder: { name: { contains: search, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } },
      ]
    }

    if (folderId && folderId !== 'all') {
      if (folderId === 'unassigned') {
        whereClause.folderId = null
      } else {
        whereClause.folderId = folderId
      }
    }

    if (tagId && tagId !== 'all') {
      whereClause.tags = {
        some: { tagId },
      }
    }

    const qrCodes = await db.qRCode.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        folder: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ success: true, data: qrCodes })
  } catch (error) {
    console.error('GET /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:create')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot create QR codes' }, { status: 403 })
    }

    // ── Billing: check QR code limit ──
    await requireCapacity(orgId, 'QR_CODE', 1, 'pro')

    const body = await req.json()

    const {
      title,
      type,
      destinationUrl,
      fgColor,
      bgColor,
      logoUrl,
      description,
      expiresAt,
      startsAt,
      maxScans,
      folderId,
      tagIds,
    } = body

    if (!title || !destinationUrl) {
      return NextResponse.json({ error: 'Title and Destination URL are required' }, { status: 400 })
    }

    // Generate unique random 7-character shortCode
    const shortCode = Math.random().toString(36).substring(2, 9)

    const tagCreateData = Array.isArray(tagIds) && tagIds.length > 0
      ? {
          tags: {
            create: tagIds.map((tId: string) => ({ tagId: tId })),
          },
        }
      : {}

    const qr = await db.qRCode.create({
      data: {
        title,
        type: type || 'WEBSITE',
        shortCode,
        destinationUrl,
        fgColor: fgColor || '#000000',
        bgColor: bgColor || '#FFFFFF',
        logoUrl: logoUrl || null,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        maxScans: maxScans ? parseInt(maxScans, 10) : null,
        folderId: folderId || null,
        organizationId: orgId,
        creatorId: userId,
        ...tagCreateData,
      },
      include: {
        folder: true,
        tags: { include: { tag: true } },
      },
    })

    // Pre-cache in Redis for sub-millisecond redirect
    await redis.set(`qr:short:${shortCode}`, destinationUrl, { ex: 600 })

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.created', qr).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, data: qr }, { status: 201 })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    console.error('POST /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:update')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot edit QR codes' }, { status: 403 })
    }

    const body = await req.json()
    const { id, title, destinationUrl, folderId, tagIds, fgColor, bgColor, logoUrl, description } = body

    if (!id) {
      return NextResponse.json({ error: 'QR Code ID is required' }, { status: 400 })
    }

    const existingQR = await db.qRCode.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existingQR) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    // Update tags if provided
    if (Array.isArray(tagIds)) {
      await db.tagOnQR.deleteMany({
        where: { qrCodeId: id },
      })

      if (tagIds.length > 0) {
        await db.tagOnQR.createMany({
          data: tagIds.map((tId: string) => ({ qrCodeId: id, tagId: tId })),
        })
      }
    }

    const updated = await db.qRCode.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(destinationUrl !== undefined ? { destinationUrl } : {}),
        ...(folderId !== undefined ? { folderId: folderId || null } : {}),
        ...(fgColor !== undefined ? { fgColor } : {}),
        ...(bgColor !== undefined ? { bgColor } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: {
        folder: true,
        tags: { include: { tag: true } },
      },
    })

    if (destinationUrl && destinationUrl !== existingQR.destinationUrl) {
      await redis.set(`qr:short:${existingQR.shortCode}`, destinationUrl, { ex: 600 })
    }

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.updated', updated).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to update QR code' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:delete')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot delete QR codes' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'QR Code ID is required' }, { status: 400 })
    }

    const qr = await db.qRCode.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!qr) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    await db.qRCode.delete({ where: { id: qr.id } })
    await redis.del(`qr:short:${qr.shortCode}`)

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.deleted', { id: qr.id, shortCode: qr.shortCode }).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, message: 'QR Code deleted' })
  } catch (error) {
    console.error('DELETE /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 })
  }
}
