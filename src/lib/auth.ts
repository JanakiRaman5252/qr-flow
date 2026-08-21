import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { db } from './db'
import { sendEmail } from './email'

const authSecret = process.env.BETTER_AUTH_SECRET

if (!authSecret || authSecret.length < 32) {
  throw new Error(
    'FATAL: BETTER_AUTH_SECRET must be set and at least 32 characters.'
  )
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }

  return 'http://localhost:3000'
}

const appUrl = getAppUrl()

const trustedOrigins = [
  'http://localhost:3000',
  'https://dynoqr.in',
  'https://www.dynoqr.in',
  'https://qr-flow-rouge.vercel.app',
  process.env.NEXT_PUBLIC_APP_URL,
]
  .filter(Boolean)
  .map((url) => url!.replace(/\/$/, ''))

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
    expiresIn: 3600,

    async sendVerificationEmail({ user, url }) {
      console.log(
        `[Better Auth] Sending verification email to ${user.email}`
      )

      const result = await sendEmail({
        to: user.email,
        subject: 'Verify your email address - QRFlow',

        text: `
Hi ${user.name || 'there'},

Thanks for signing up for QRFlow.

Verify your email address:

${url}

This link expires in 1 hour.

If you did not create this account, you can ignore this email.
        `.trim(),

        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 40px auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            
            <h1 style="font-size: 24px; color: #0f172a;">
              Verify your QRFlow account
            </h1>

            <p style="color: #475569; line-height: 1.6;">
              Hi ${user.name || 'there'}, thanks for signing up.
              Please verify your email address to continue.
            </p>

            <div style="margin: 30px 0;">
              <a
                href="${url}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display: inline-block;
                  background: #4f46e5;
                  color: #ffffff;
                  padding: 13px 24px;
                  border-radius: 10px;
                  text-decoration: none;
                  font-weight: 600;
                "
              >
                Verify Email Address
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              If the button doesn't work, copy this URL:
            </p>

            <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">
              ${url}
            </p>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

            <p style="font-size: 11px; color: #94a3b8;">
              This verification link expires in 1 hour.
            </p>

            <p style="font-size: 11px; color: #94a3b8;">
              If you didn't create a QRFlow account, you can ignore this email.
            </p>

          </div>
        `,
      })

      if (!result.success) {
        console.error(
          '[Better Auth] Verification email failed:',
          result.error
        )

        throw new Error(
          `Failed to send verification email: ${result.error}`
        )
      }

      console.log(
        `[Better Auth] Verification email sent: ${result.id}`
      )
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),

    ...(process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
})