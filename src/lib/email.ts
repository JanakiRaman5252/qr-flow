import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`)
    return { id: 'mock_id' }
  }

  return await resend.emails.send({
    from: process.env.EMAIL_FROM || 'QRFlow <notifications@qrflow.io>',
    to,
    subject,
    html,
  })
}
