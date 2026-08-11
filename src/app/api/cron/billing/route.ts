import { NextRequest, NextResponse } from 'next/server'
import { checkTrialExpirations, checkGracePeriodExpirations } from '@/lib/billing/subscription'
import { flushScanCountersToDB } from '@/lib/billing/usage'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  // Protect cron route via CRON_SECRET header or query parameter
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = new URL(req.url).searchParams.get('secret')
    if (urlSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 })
    }
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
    return NextResponse.json({ error: error.message || 'Cron failed' }, { status: 500 })
  }
}
