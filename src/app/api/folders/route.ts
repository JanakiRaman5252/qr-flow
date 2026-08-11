import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasPermission } from '@/lib/rbac'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    const folders = await db.folder.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { qrCodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = folders.map((f) => ({
      id: f.id,
      name: f.name,
      color: f.color || '#6366F1',
      qrCount: f._count.qrCodes,
      createdAt: f.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('GET /api/folders Error:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot create folders' }, { status: 403 })
    }

    const { name, color } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const folder = await db.folder.create({
      data: {
        name,
        color: color || '#6366F1',
        organizationId: orgId,
        creatorId: userId,
      },
    })

    return NextResponse.json({ success: true, data: folder }, { status: 201 })
  } catch (error) {
    console.error('POST /api/folders Error:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot edit folders' }, { status: 403 })
    }

    const { id, name, color } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: 'Folder ID and name are required' }, { status: 400 })
    }

    const updated = await db.folder.updateMany({
      where: { id, organizationId: orgId },
      data: { name, color },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Folder updated successfully' })
  } catch (error) {
    console.error('PATCH /api/folders Error:', error)
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json({ error: 'Viewers have read-only access and cannot delete folders' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    await db.folder.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'Folder deleted' })
  } catch (error) {
    console.error('DELETE /api/folders Error:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}

