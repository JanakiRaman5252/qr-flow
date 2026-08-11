import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const tags = await db.tag.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { qrCodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color || '#EC4899',
      qrCount: t._count.qrCodes,
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('GET /api/tags Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()
    const { name, color } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const cleanName = name.replace(/\s+/g, '')

    const tag = await db.tag.create({
      data: {
        name: cleanName,
        color: color || '#EC4899',
        organizationId: orgId,
        creatorId: userId,
      },
    })

    return NextResponse.json({ success: true, data: tag }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tags Error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { id, name, color } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: 'Tag ID and name are required' }, { status: 400 })
    }

    const cleanName = name.replace(/\s+/g, '')

    const updated = await db.tag.updateMany({
      where: { id, organizationId: orgId },
      data: { name: cleanName, color },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Tag updated successfully' })
  } catch (error) {
    console.error('PATCH /api/tags Error:', error)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    await db.tag.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'Tag deleted' })
  } catch (error) {
    console.error('DELETE /api/tags Error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}

