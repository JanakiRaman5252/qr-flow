import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface ApiKeyAuthResult {
  authenticated: boolean
  orgId?: string
  userId?: string
  scopes?: string[]
  keyId?: string
  error?: string
}

/**
 * Validates an incoming API Key from `Authorization: Bearer <key>` or `x-api-key: <key>` header.
 * Checks key validity, updates `lastUsedAt`, and checks for required scope permissions.
 */
export async function validateApiKey(
  req: NextRequest,
  requiredScope?: string
): Promise<ApiKeyAuthResult> {
  const authHeader = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')

  let keyString: string | null = null

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    keyString = authHeader.substring(7).trim()
  } else if (apiKeyHeader) {
    keyString = apiKeyHeader.trim()
  }

  if (!keyString) {
    return { authenticated: false, error: 'Missing API key. Provide Bearer token or x-api-key header.' }
  }

  try {
    const apiKey = await Promise.race([
      db.aPIKey.findUnique({
        where: { key: keyString },
        include: { organization: true },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ])

    if (!apiKey) {
      return { authenticated: false, error: 'Invalid API key provided.' }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { authenticated: false, error: 'API key has expired.' }
    }

    if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
      return {
        authenticated: false,
        error: `Insufficient API key permissions. Required scope: ${requiredScope}`,
      }
    }

    // Touch lastUsedAt asynchronously
    db.aPIKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.error('Failed to update lastUsedAt:', err))

    return {
      authenticated: true,
      orgId: apiKey.organizationId,
      userId: apiKey.creatorId,
      scopes: apiKey.scopes,
      keyId: apiKey.id,
    }
  } catch (error) {
    console.error('API Key validation error:', error)
    return { authenticated: false, error: 'Internal API key validation error.' }
  }
}
