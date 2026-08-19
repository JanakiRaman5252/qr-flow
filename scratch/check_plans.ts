import { db } from '../src/lib/db'

async function main() {
  const plans = await db.plan.findMany()
  console.log('PLANS IN DB:', JSON.stringify(plans, null, 2))
}

main().catch(console.error).finally(() => process.exit())
