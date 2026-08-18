import { NextRequest, NextResponse } from 'next/server'
import { checkTrialExpirations, checkGracePeriodExpirations } from '@/lib/billing/subscription'
import { flushScanCountersToDB } from '@/lib/billing/usage'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  // ── Cron Authentication: Fail closed ──
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 16) {
    logger.error('CRON_SECRET is not configured or too weak — rejecting cron execution')
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cron secret not configured' } },
      { status: 403 }
    )
  }

  // Only accept Bearer token via Authorization header (no query param fallback)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron authorization' } },
      { status: 401 }
    )
  }

  try {
    logger.info('Starting scheduled billing maintenance job...')

    const [trialsProcessed, graceProcessed, scansFlushed] = await Promise.all([
      checkTrialExpirations(),
      checkGracePeriodExpirations(),
      flushScanCountersToDB(),
    ])

    logger.info(
      { trialsProcessed, graceProcessed, scansFlushed },
      'Billing maintenance job completed successfully'
    )

    return NextResponse.json({
      success: true,
      data: {
        trialsProcessed,
        graceProcessed,
        scansFlushed,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    logger.error({ error }, 'Cron billing execution failed')
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron execution failed' } },
      { status: 500 }
    )
  }
}
