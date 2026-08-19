import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args)
          } catch (error: any) {
            const isConnectionError =
              error?.code === 'P1017' ||
              error?.code === 'P1001' ||
              error?.code === 'P1002' ||
              error?.message?.includes('Server has closed the connection') ||
              error?.message?.includes('ConnectionReset') ||
              error?.message?.includes('10054')

            if (isConnectionError) {
              console.warn('[Prisma] Stale database connection detected. Reconnecting and retrying...')
              try {
                await baseClient.$disconnect()
                await baseClient.$connect()
              } catch {
                // Ignore disconnect errors during recovery
              }
              return await query(args)
            }
            throw error
          }
        },
      },
    },
  })
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

export const db = (globalForPrisma.prisma as ExtendedPrismaClient) ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db as any
}
