import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const qrCodes = await db.qRCode.findMany({
      where: {
        organizationId: orgId,
        isInTrash: false,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { shortCode: { contains: search, mode: 'insensitive' } },
                { destinationUrl: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
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
    const { userId, orgId } = await getCurrentUserAndOrg()
    const body = await req.json()

    const {
      title,
      type,
      destinationUrl,
      fgColor,
      bgColor,
      description,
      expiresAt,
      startsAt,
      maxScans,
      folderId,
    } = body

    if (!title || !destinationUrl) {
      return NextResponse.json({ error: 'Title and Destination URL are required' }, { status: 400 })
    }

    // Generate unique random 7-character shortCode
    const shortCode = Math.random().toString(36).substring(2, 9)

    const qr = await db.qRCode.create({
      data: {
        title,
        type: type || 'WEBSITE',
        shortCode,
        destinationUrl,
        fgColor: fgColor || '#000000',
        bgColor: bgColor || '#FFFFFF',
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        maxScans: maxScans ? parseInt(maxScans, 10) : null,
        folderId: folderId || null,
        organizationId: orgId,
        creatorId: userId,
      },
    })

    // Pre-cache in Redis for sub-millisecond redirect
    await redis.set(`qr:short:${shortCode}`, destinationUrl, { ex: 600 })

    return NextResponse.json({ success: true, data: qr }, { status: 201 })
  } catch (error) {
    console.error('POST /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
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

    return NextResponse.json({ success: true, message: 'QR Code deleted' })
  } catch (error) {
    console.error('DELETE /api/qr Error:', error)
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 })
  }
}
