import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateApiKey } from '@/lib/api-key-auth'
import { redis } from '@/lib/redis'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateApiKey(req, 'qr:read')
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const qr = await db.qRCode.findFirst({
      where: { id, organizationId: auth.orgId, isInTrash: false },
    })

    if (!qr) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: qr })
  } catch (error) {
    console.error('GET /api/v1/qr/[id] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch QR code' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await validateApiKey(req, 'qr:write')
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const qr = await db.qRCode.findFirst({
      where: { id, organizationId: auth.orgId },
    })

    if (!qr) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    await db.qRCode.delete({ where: { id: qr.id } })
    await redis.del(`qr:short:${qr.shortCode}`)

    return NextResponse.json({ success: true, message: 'QR Code deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/v1/qr/[id] Error:', error)
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 })
  }
}
