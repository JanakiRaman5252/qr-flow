import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { redis } from '@/lib/redis'
import { requireCapacity } from '@/lib/billing/usage'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { dispatchWebhookEvent } from '@/lib/webhooks'
import { hasPermission } from '@/lib/rbac'
import { handleApiError, AuthenticationError } from '@/lib/errors'
import { validateDestinationUrl, generateShortCode, validatePagination } from '@/lib/validation'
import { Prisma } from '@prisma/client'

// ── GET /api/qr — List QR codes with pagination ──
export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const folderId = searchParams.get('folderId') || ''
    const tagId = searchParams.get('tagId') || ''

    // Pagination
    const { page, limit, skip } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    )

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

    // Execute count and data queries in parallel
    const [total, qrCodes] = await Promise.all([
      db.qRCode.count({ where: whereClause }),
      db.qRCode.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          folder: true,
          tags: { include: { tag: true } },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: qrCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── POST /api/qr — Create QR code ──
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access and cannot create QR codes' } },
        { status: 403 }
      )
    }

    // ── Billing: check QR code limit ──
    await requireCapacity(orgId, 'QR_CODE', 1)

    const body = await req.json()

    const {
      title,
      type,
      destinationUrl,
      fgColor,
      bgColor,
      logoUrl,
      description,
      dotsStyle,
      cornerDotsStyle,
      frameTemplate,
      frameText,
      designConfig,
      expiresAt,
      startsAt,
      maxScans,
      folderId,
      tagIds,
    } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title is required' } },
        { status: 400 }
      )
    }

    if (!destinationUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Destination URL is required' } },
        { status: 400 }
      )
    }

    // Validate URL scheme (reject javascript:, data:, etc.)
    const validatedUrl = validateDestinationUrl(destinationUrl)

    // Generate cryptographically secure shortCode with collision retry
    const MAX_RETRIES = 3
    let qr: any = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const shortCode = generateShortCode()

      const tagCreateData = Array.isArray(tagIds) && tagIds.length > 0
        ? {
            tags: {
              create: tagIds.map((tId: string) => ({ tagId: tId })),
            },
          }
        : {}

      try {
        qr = await db.qRCode.create({
          data: {
            title: title.trim(),
            type: type || 'WEBSITE',
            shortCode,
            destinationUrl: validatedUrl,
            fgColor: fgColor || '#000000',
            bgColor: bgColor || '#FFFFFF',
            logoUrl: logoUrl || null,
            dotsStyle: dotsStyle || 'square',
            cornerDotsStyle: cornerDotsStyle || 'square',
            frameTemplate: frameTemplate || null,
            frameText: frameText || null,
            redirectRules: designConfig ? designConfig : undefined,
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
        break // success
      } catch (err: any) {
        // P2002 = unique constraint violation (shortCode collision)
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          if (attempt === MAX_RETRIES - 1) {
            throw new Error('Failed to generate unique shortCode after multiple attempts')
          }
          continue // retry with new shortCode
        }
        throw err // other errors bubble up
      }
    }

    // Pre-cache in Redis for fast redirect
    await redis.set(`qr:short:${qr.shortCode}`, JSON.stringify({
      destinationUrl: validatedUrl,
      isArchived: false,
      isInTrash: false,
      expiresAt: qr.expiresAt?.toISOString() || null,
      startsAt: qr.startsAt?.toISOString() || null,
      maxScans: qr.maxScans,
      scanCount: 0,
    }), { ex: 600 })

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.created', qr).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, data: qr }, { status: 201 })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    return handleApiError(error)
  }
}

// ── PATCH /api/qr — Update QR code ──
export async function PATCH(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:update')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access and cannot edit QR codes' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      id,
      title,
      destinationUrl,
      folderId,
      tagIds,
      fgColor,
      bgColor,
      logoUrl,
      dotsStyle,
      cornerDotsStyle,
      frameTemplate,
      frameText,
      designConfig,
      description,
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'QR Code ID is required' } },
        { status: 400 }
      )
    }

    const existingQR = await db.qRCode.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existingQR) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'QR Code not found' } },
        { status: 404 }
      )
    }

    // Validate destination URL if being updated
    let validatedUrl: string | undefined
    if (destinationUrl !== undefined) {
      validatedUrl = validateDestinationUrl(destinationUrl)
    }

    // Use a transaction for atomic tag update + QR update
    const updated = await db.$transaction(async (tx) => {
      // Update tags if provided
      if (Array.isArray(tagIds)) {
        await tx.tagOnQR.deleteMany({
          where: { qrCodeId: id },
        })

        if (tagIds.length > 0) {
          await tx.tagOnQR.createMany({
            data: tagIds.map((tId: string) => ({ qrCodeId: id, tagId: tId })),
          })
        }
      }

      return tx.qRCode.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(validatedUrl !== undefined ? { destinationUrl: validatedUrl } : {}),
          ...(folderId !== undefined ? { folderId: folderId || null } : {}),
          ...(fgColor !== undefined ? { fgColor } : {}),
          ...(bgColor !== undefined ? { bgColor } : {}),
          ...(logoUrl !== undefined ? { logoUrl } : {}),
          ...(dotsStyle !== undefined ? { dotsStyle } : {}),
          ...(cornerDotsStyle !== undefined ? { cornerDotsStyle } : {}),
          ...(frameTemplate !== undefined ? { frameTemplate } : {}),
          ...(frameText !== undefined ? { frameText } : {}),
          ...(designConfig !== undefined ? { redirectRules: designConfig } : {}),
          ...(description !== undefined ? { description } : {}),
        },
        include: {
          folder: true,
          tags: { include: { tag: true } },
        },
      })
    })

    // Update Redis cache if destination URL changed
    if (validatedUrl && validatedUrl !== existingQR.destinationUrl) {
      await redis.set(`qr:short:${existingQR.shortCode}`, JSON.stringify({
        destinationUrl: validatedUrl,
        isArchived: updated.isArchived,
        isInTrash: updated.isInTrash,
        expiresAt: updated.expiresAt?.toISOString() || null,
        startsAt: updated.startsAt?.toISOString() || null,
        maxScans: updated.maxScans,
        scanCount: updated.scanCount,
      }), { ex: 600 })
    }

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.updated', updated).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── DELETE /api/qr — Delete QR code ──
export async function DELETE(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    // ── RBAC Check ──
    if (!hasPermission(role, 'qr:delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewers have read-only access and cannot delete QR codes' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'QR Code ID is required' } },
        { status: 400 }
      )
    }

    // Verify ownership via organizationId
    const qr = await db.qRCode.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!qr) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'QR Code not found' } },
        { status: 404 }
      )
    }

    await db.qRCode.delete({ where: { id: qr.id } })
    await redis.del(`qr:short:${qr.shortCode}`)

    // Dispatch webhook event
    dispatchWebhookEvent(orgId, 'qr.deleted', { id: qr.id, shortCode: qr.shortCode }).catch((err) =>
      console.error('Webhook error:', err)
    )

    return NextResponse.json({ success: true, message: 'QR Code deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
