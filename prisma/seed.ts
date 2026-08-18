// ─────────────────────────────────────────────
// Billing Seed Script
// ─────────────────────────────────────────────
// Run: bunx ts-node prisma/seed.ts
// Or:  bun run prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PLANS = [

  {
    name: 'Starter',
    slug: 'starter',
    description: 'Essential tools for creators and small businesses',
    monthlyPrice: 49900, // ₹499
    yearlyPrice: 499000, // ₹4,990
    trialDays: 7,
    sortOrder: 1,
    marketingFeatures: [
      '50 Dynamic QR Codes',
      '25,000 Scans/month',
      '5 Team Members',
      'Advanced Analytics',
      'Custom Branding',
      'Data Export',
    ],
    entitlements: [
      { entitlementKey: 'QR_CODE_LIMIT', valueType: 'NUMERIC' as const, numericValue: 50 },
      { entitlementKey: 'MONTHLY_SCAN_LIMIT', valueType: 'NUMERIC' as const, numericValue: 25000 },
      { entitlementKey: 'TEAM_MEMBER_LIMIT', valueType: 'NUMERIC' as const, numericValue: 5 },
      { entitlementKey: 'ADVANCED_ANALYTICS', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'CUSTOM_DOMAIN', valueType: 'BOOLEAN' as const, booleanValue: false },
      { entitlementKey: 'API_ACCESS', valueType: 'BOOLEAN' as const, booleanValue: false },
      { entitlementKey: 'CUSTOM_BRANDING', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'WHITE_LABEL', valueType: 'BOOLEAN' as const, booleanValue: false },
      { entitlementKey: 'EXPORT_DATA', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'BULK_QR_GENERATION', valueType: 'BOOLEAN' as const, booleanValue: false },
      { entitlementKey: 'PRIORITY_SUPPORT', valueType: 'BOOLEAN' as const, booleanValue: false },
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For growing marketing teams',
    monthlyPrice: 149900, // ₹1,499
    yearlyPrice: 1499000, // ₹14,990
    trialDays: 7,
    isRecommended: true,
    sortOrder: 2,
    marketingFeatures: [
      '250 Dynamic QR Codes',
      '100,000 Scans/month',
      '20 Team Members',
      'Custom Domain',
      'API Access',
      'Advanced Analytics',
      'Bulk QR Generation',
      'Data Export',
    ],
    entitlements: [
      { entitlementKey: 'QR_CODE_LIMIT', valueType: 'NUMERIC' as const, numericValue: 250 },
      { entitlementKey: 'MONTHLY_SCAN_LIMIT', valueType: 'NUMERIC' as const, numericValue: 100000 },
      { entitlementKey: 'TEAM_MEMBER_LIMIT', valueType: 'NUMERIC' as const, numericValue: 20 },
      { entitlementKey: 'ADVANCED_ANALYTICS', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'CUSTOM_DOMAIN', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'API_ACCESS', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'CUSTOM_BRANDING', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'WHITE_LABEL', valueType: 'BOOLEAN' as const, booleanValue: false },
      { entitlementKey: 'EXPORT_DATA', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'BULK_QR_GENERATION', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'PRIORITY_SUPPORT', valueType: 'BOOLEAN' as const, booleanValue: false },
    ],
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Enterprise-grade with unlimited scale',
    monthlyPrice: 499900, // ₹4,999
    yearlyPrice: 4999000, // ₹49,990
    trialDays: 7,
    sortOrder: 3,
    marketingFeatures: [
      '1,000 Dynamic QR Codes',
      '1,000,000 Scans/month',
      'Unlimited Team Members',
      'API Access',
      'White-Label',
      'Priority Support',
      'Custom Domain',
      'Bulk QR Generation',
    ],
    entitlements: [
      { entitlementKey: 'QR_CODE_LIMIT', valueType: 'NUMERIC' as const, numericValue: 1000 },
      { entitlementKey: 'MONTHLY_SCAN_LIMIT', valueType: 'UNLIMITED' as const },
      { entitlementKey: 'TEAM_MEMBER_LIMIT', valueType: 'UNLIMITED' as const },
      { entitlementKey: 'ADVANCED_ANALYTICS', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'CUSTOM_DOMAIN', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'API_ACCESS', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'CUSTOM_BRANDING', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'WHITE_LABEL', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'EXPORT_DATA', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'BULK_QR_GENERATION', valueType: 'BOOLEAN' as const, booleanValue: true },
      { entitlementKey: 'PRIORITY_SUPPORT', valueType: 'BOOLEAN' as const, booleanValue: true },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding billing plans...\n')

  for (const planData of PLANS) {
    const { entitlements, ...planFields } = planData

    const plan = await db.plan.upsert({
      where: { slug: planFields.slug },
      update: {
        name: planFields.name,
        description: planFields.description,
        monthlyPrice: planFields.monthlyPrice,
        yearlyPrice: planFields.yearlyPrice,
        isFree: false,
        isRecommended: (planFields as any).isRecommended || false,
        trialDays: (planFields as any).trialDays || 0,
        sortOrder: planFields.sortOrder,
        marketingFeatures: planFields.marketingFeatures,
      },
      create: {
        name: planFields.name,
        slug: planFields.slug,
        description: planFields.description,
        monthlyPrice: planFields.monthlyPrice,
        yearlyPrice: planFields.yearlyPrice,
        isFree: false,
        isRecommended: (planFields as any).isRecommended || false,
        trialDays: (planFields as any).trialDays || 0,
        sortOrder: planFields.sortOrder,
        marketingFeatures: planFields.marketingFeatures,
      },
    })

    // Upsert entitlements
    for (const ent of entitlements) {
      await db.planEntitlement.upsert({
        where: {
          planId_entitlementKey: {
            planId: plan.id,
            entitlementKey: ent.entitlementKey,
          },
        },
        update: {
          valueType: ent.valueType,
          numericValue: ent.numericValue ?? null,
          booleanValue: ent.booleanValue ?? null,
        },
        create: {
          planId: plan.id,
          entitlementKey: ent.entitlementKey,
          valueType: ent.valueType,
          numericValue: ent.numericValue ?? null,
          booleanValue: ent.booleanValue ?? null,
        },
      })
    }

    console.log(`  ✓ ${plan.name} (${plan.slug}) — ${entitlements.length} entitlements`)
  }

  // Backfill: assign FREE plan to existing orgs without subscriptions
  const freePlan = await db.plan.findFirst({ where: { isFree: true } })
  if (freePlan) {
    const orgsWithoutSub = await db.organization.findMany({
      where: { subscription: null },
      select: { id: true, name: true },
    })

    for (const org of orgsWithoutSub) {
      await db.subscription.create({
        data: {
          organizationId: org.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          currency: 'INR',
          currentPeriodStart: new Date(),
        },
      })
      console.log(`  ✓ Backfilled FREE subscription for org: ${org.name}`)
    }
  }

  console.log('\n✅ Billing seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
