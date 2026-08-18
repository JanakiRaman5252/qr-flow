import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'

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
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access' } },
        { status: 403 }
      )
    }

    const { name, color } = await req.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Folder name is required' } },
        { status: 400 }
      )
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
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access' } },
        { status: 403 }
      )
    }

    const { id, name, color } = await req.json()

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Folder ID and name are required' } },
        { status: 400 }
      )
    }

    const updated = await db.folder.updateMany({
      where: { id, organizationId: orgId },
      data: { name, color },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Folder updated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'folder:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Folder ID is required' } },
        { status: 400 }
      )
    }

    await db.folder.deleteMany({
      where: { id, organizationId: orgId },
    })

    return NextResponse.json({ success: true, message: 'Folder deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
