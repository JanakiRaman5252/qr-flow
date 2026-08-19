import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from './db'

import { sendEmail } from './email'

// ── Fail fast if auth secret is missing or too weak ──
const authSecret = process.env.BETTER_AUTH_SECRET
if (!authSecret || authSecret.length < 32) {
  throw new Error(
    'FATAL: BETTER_AUTH_SECRET must be set and at least 32 characters. ' +
    'Generate one with: openssl rand -hex 32'
  )
}

// ── Build trusted origins & baseURL ──
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

const appUrl = getAppUrl()

const trustedOrigins = [
  'http://localhost:3000',
  'https://dynoqr.in',
  'https://www.dynoqr.in',
  'https://qr-flow-rouge.vercel.app',
  process.env.NEXT_PUBLIC_APP_URL,
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  secret: authSecret,
  baseURL: appUrl,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url, token }) {
      const baseUrl = getAppUrl()
      // Use clean frontend verification route instead of raw API endpoint to prevent security filter flagging
      const cleanUrl = `${baseUrl}/verify-email?token=${token}&callbackURL=${encodeURIComponent('/dashboard')}`

      console.log(`\n========================================`)
      console.log(`[VERIFICATION EMAIL INITIATED] To: ${user.email}`)
      console.log(`[VERIFICATION LINK] ${cleanUrl}`)
      console.log(`========================================\n`)

      try {
        const res = await sendEmail({
          to: user.email,
          subject: 'Verify your email address - QRFlow',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; color: #f8fafc;">
              <div style="margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0;">Verify your QRFlow account</h1>
                <p style="font-size: 14px; color: #94a3b8; margin: 0;">Hi ${user.name || 'there'}, thanks for signing up! Please verify your email address to get started.</p>
              </div>
              <div style="margin: 32px 0;">
                <a href="${cleanUrl}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none;">Verify Email Address</a>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">If the button above doesn't work, copy and paste this link into your web browser:</p>
              <p style="font-size: 12px; color: #818cf8; word-break: break-all; margin: 0;">${cleanUrl}</p>
              <hr style="border: 0; border-top: 1px solid #1e293b; margin: 32px 0 16px 0;" />
              <p style="font-size: 11px; color: #475569; margin: 0;">If you didn't create an account on QRFlow, no action is needed.</p>
            </div>
          `,
        })

        if (!res.success) {
          console.error('[Verification Email Delivery Notice Failed]:', res.error)
        } else {
          console.log(`[Verification Email Successfully Delivered] Message ID: ${res.id}`)
        }
      } catch (err: any) {
        console.error('[Verification Email Delivery Exception]:', err)
      }
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
})
